-- Roommate Hinge / GopherHole
-- Paste this whole file into the Supabase SQL Editor if you are not using the CLI.
-- Jev is an application sort (housing + location + budget + dates + year + intent), not a table.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null default '',
  name text not null default '',
  age integer,
  year text not null default '',
  major text not null default '',
  housing_type text not null default '',
  locations text[] not null default '{}',
  budget_min integer not null default 600,
  budget_max integer not null default 1200,
  move_in text not null default '',
  move_out text not null default '',
  parking text not null default '',
  existing_roommates integer not null default 0,
  intent text not null default '',
  socials jsonb not null default '{}'::jsonb,
  spotify jsonb not null default '{}'::jsonb,
  photos text[] not null default '{}',
  prompts jsonb not null default '[]'::jsonb,
  last_active timestamptz not null default now(),
  published boolean not null default false,
  home_state text not null default '',
  address text not null default '',
  map_center jsonb not null default '[44.9765, -93.2352]'::jsonb,
  radius_mi numeric not null default 1,
  dorms text[] not null default '{}',
  looking_for_subleaser boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  poster_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  pocket text not null default '',
  rent integer not null default 0,
  utilities text not null default '',
  move_in text not null default '',
  move_out text not null default '',
  parking text not null default '',
  existing text not null default '',
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references auth.users (id) on delete cascade,
  swipee_id uuid not null references auth.users (id) on delete cascade,
  direction text not null check (direction in ('like', 'pass', 'block')),
  created_at timestamptz not null default now(),
  unique (swiper_id, swipee_id),
  check (swiper_id <> swipee_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references auth.users (id) on delete cascade,
  user_b uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_a, user_b),
  check (user_a < user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_published_idx on public.profiles (published) where published = true;
create index if not exists swipes_swiper_idx on public.swipes (swiper_id);
create index if not exists swipes_swipee_idx on public.swipes (swipee_id);
create index if not exists matches_user_a_idx on public.matches (user_a);
create index if not exists matches_user_b_idx on public.matches (user_b);
create index if not exists messages_match_idx on public.messages (match_id, created_at);
create index if not exists listings_poster_idx on public.listings (poster_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.swipes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

drop policy if exists profiles_select_published_or_own on public.profiles;
create policy profiles_select_published_or_own
  on public.profiles for select
  to authenticated
  using (published = true or user_id = auth.uid());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists listings_select_auth on public.listings;
create policy listings_select_auth
  on public.listings for select
  to authenticated
  using (true);

drop policy if exists listings_insert_own on public.listings;
create policy listings_insert_own
  on public.listings for insert
  to authenticated
  with check (poster_id = auth.uid());

drop policy if exists listings_update_own on public.listings;
create policy listings_update_own
  on public.listings for update
  to authenticated
  using (poster_id = auth.uid())
  with check (poster_id = auth.uid());

drop policy if exists listings_delete_own on public.listings;
create policy listings_delete_own
  on public.listings for delete
  to authenticated
  using (poster_id = auth.uid());

drop policy if exists swipes_select_participants on public.swipes;
create policy swipes_select_participants
  on public.swipes for select
  to authenticated
  using (swiper_id = auth.uid() or swipee_id = auth.uid());

drop policy if exists swipes_insert_own on public.swipes;
create policy swipes_insert_own
  on public.swipes for insert
  to authenticated
  with check (swiper_id = auth.uid());

drop policy if exists swipes_update_own on public.swipes;
create policy swipes_update_own
  on public.swipes for update
  to authenticated
  using (swiper_id = auth.uid())
  with check (swiper_id = auth.uid());

drop policy if exists swipes_delete_own on public.swipes;
create policy swipes_delete_own
  on public.swipes for delete
  to authenticated
  using (swiper_id = auth.uid());

drop policy if exists matches_select_participants on public.matches;
create policy matches_select_participants
  on public.matches for select
  to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists matches_insert_participants on public.matches;
create policy matches_insert_participants
  on public.matches for insert
  to authenticated
  with check (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists matches_delete_participants on public.matches;
create policy matches_delete_participants
  on public.matches for delete
  to authenticated
  using (user_a = auth.uid() or user_b = auth.uid());

drop policy if exists messages_select_participants on public.messages;
create policy messages_select_participants
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

drop policy if exists messages_insert_participants on public.messages;
create policy messages_insert_participants
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own
  on public.messages for delete
  to authenticated
  using (sender_id = auth.uid());

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.listings to authenticated;
grant select, insert, update, delete on table public.swipes to authenticated;
grant select, insert, update, delete on table public.matches to authenticated;
grant select, insert, update, delete on table public.messages to authenticated;


