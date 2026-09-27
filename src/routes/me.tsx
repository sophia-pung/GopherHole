import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Ban, Check, ChevronRight, Shield, SlidersHorizontal, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { PhoneShell, Placeholder } from "@/components/PhoneShell";
import { useAuth } from "@/hooks/use-auth";
import { fetchMySwipes, fetchProfilesByUserIds, profileToStudent, upsertOwnProfile, meToProfile } from "@/lib/api";

export const Route = createFileRoute("/me")({
  head: () => ({
    meta: [
      { title: "Your profile — GopherHole" },
      { name: "description", content: "Verification, roommate preferences, block list, and past matches." },
      { property: "og:title", content: "Your profile — GopherHole" },
      { property: "og:description", content: "Verification, roommate preferences, block list, and past matches." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MePage,
});

const TABS = ["My Profile", "Settings", "Safety"] as const;

function MePage() {
  const { user, me, profile, loading, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<(typeof TABS)[number]>("My Profile");
  const [blockedNames, setBlockedNames] = useState<string[]>([]);
  const name = me.firstName || "Your name";
  const verified = Boolean(user);

  if (loading) {
    return (
      <PhoneShell>
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">Loading profile…</p>
      </PhoneShell>
    );
  }

  useEffect(() => {
    if (!user) return;
    fetchMySwipes(user.id)
      .then(async (swipes) => {
        const ids = swipes.filter((s) => s.direction === "block").map((s) => s.swipee_id);
        const rows = await fetchProfilesByUserIds(ids);
        setBlockedNames(rows.map((r) => profileToStudent(r).name));
      })
      .catch((err) => console.error(err));
  }, [user]);

  return (
    <PhoneShell>
      <div className="px-6 pb-8">
        <div className="relative mx-auto mt-4 w-[70px]">
          <Placeholder label={name.charAt(0)} className="size-[70px] rounded-full border-[3px] border-accent text-2xl" />
          {verified && (
            <span className="absolute -bottom-1 right-0 flex size-5 items-center justify-center rounded-full bg-primary">
              <Check className="size-3 text-primary-foreground" />
            </span>
          )}
        </div>
        <p className="mt-3 text-center text-lg font-bold">{name}</p>
        <p className="text-center text-[10px] text-muted-foreground">University of Minnesota</p>

        <div className="mt-5 flex">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                tab === t
                  ? "flex-1 border-b-2 border-primary pb-1.5 text-xs font-bold text-primary"
                  : "flex-1 border-b border-border pb-1.5 text-xs text-muted-foreground"
              }
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "My Profile" && (
          <div className="mt-5 space-y-3">
            <Row
              Icon={Shield}
              title="Verification"
              sub={verified ? "You're verified." : "Verify your UMN email."}
              to="/verify"
            />
            <Row Icon={SlidersHorizontal} title="Preferences" sub="Set your roommate preferences" to="/filters" />
            <Row Icon={Ban} title="Block List" sub={`${blockedNames.length} blocked`} to="/messages" />
            <Row Icon={Users} title="Past Matches" sub="View previous roommate matches" to="/matches" />
            <div className="sticker p-4">
              <p className="text-xs font-bold">Your prompts</p>
              {me.prompts.length === 0 ? (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  No prompts yet. Your bio is only a Spotify song.
                </p>
              ) : (
                me.prompts.map((p) => (
                  <div key={p.prompt} className="mt-2">
                    <p className="text-[10px] font-bold uppercase text-primary">{p.prompt}</p>
                    <p className="text-xs">{p.answer}</p>
                  </div>
                ))
              )}
              <Link to="/onboarding" className="mt-3 inline-block text-[11px] font-bold text-primary">
                Edit profile →
              </Link>
            </div>
          </div>
        )}

        {tab === "Settings" && (
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between sticker p-4">
              <div>
                <p className="text-xs font-bold">Spotify</p>
                <p className="text-[11px] text-muted-foreground">
                  {me.spotifyConnected ? "Connected" : "Not connected"}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!user) return;
                  await upsertOwnProfile(meToProfile(user.id, user.email ?? me.email, { ...me, spotifyConnected: !me.spotifyConnected }, profile?.published ?? false));
                  await refreshProfile();
                }}
                className="rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground"
              >
                {me.spotifyConnected ? "Disconnect" : "Connect"}
              </button>
            </div>
            <button
              onClick={async () => {
                await signOut();
                navigate({ to: "/" });
              }}
              className="w-full rounded-xl border border-destructive py-3 text-xs font-bold text-destructive"
            >
              Sign out
            </button>
          </div>
        )}

        {tab === "Safety" && (
          <div className="mt-5 space-y-3">
            <p className="rounded-xl bg-secondary p-4 text-[11px]">
              This is not a dating app, but if someone makes it weird, report them. Every chat header has Unmatch,
              Report, and Block.
            </p>
            <div className="sticker p-4">
              <p className="text-xs font-bold">Blocked</p>
              {blockedNames.length === 0 ? (
                <p className="mt-1 text-[11px] text-muted-foreground">Nobody yet. Keep it that way.</p>
              ) : (
                blockedNames.map((b) => (
                  <p key={b} className="mt-1 text-[11px]">
                    {b}
                  </p>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}

function Row({
  Icon,
  title,
  sub,
  to,
}: {
  Icon: typeof Shield;
  title: string;
  sub: string;
  to: "/verify" | "/filters" | "/messages" | "/matches";
}) {
  return (
    <Link to={to} className="flex items-center gap-3 sticker p-4">
      <span className="flex size-10 items-center justify-center rounded-full bg-secondary">
        <Icon className="size-5 text-primary" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-[11px] text-muted-foreground">{sub}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
