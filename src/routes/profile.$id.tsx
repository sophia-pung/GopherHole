import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { PhoneShell, Placeholder, SpotifyBar } from "@/components/PhoneShell";
import { compatibility, isMutualNumberOne } from "@/lib/match";
import { useFilters } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { buildAppState } from "@/lib/session-state";
import {
  createMatch,
  fetchDiscoverProfiles,
  fetchMyMatches,
  fetchOwnProfile,
  fetchProfilesByUserIds,
  findReciprocalLike,
  otherUserId,
  profileToStudent,
  recordSwipe,
} from "@/lib/api";
import type { Student } from "@/lib/data";

export const Route = createFileRoute("/profile/$id")({
  head: () => ({
    meta: [
      { title: "Roommate profile — GopherHole" },
      { name: "description", content: "Prompts, socials, budget, boundaries, and why you two might live well together." },
      { property: "og:title", content: "Roommate profile — GopherHole" },
      { property: "og:description", content: "Prompts, socials, budget, boundaries, and why you two might live well together." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PublicProfile,
});

function PublicProfile() {
  const { id } = useParams({ from: "/profile/$id" });
  const { user, me } = useAuth();
  const filters = useFilters();
  const [p, setP] = useState<Student | undefined>();
  const [matched, setMatched] = useState(false);
  const [deck, setDeck] = useState<Student[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [own, others, matches, discover] = await Promise.all([
        fetchOwnProfile(user.id),
        fetchProfilesByUserIds([id]),
        fetchMyMatches(user.id),
        fetchDiscoverProfiles(user.id),
      ]);
      if (cancelled) return;
      setP(others[0] ? profileToStudent(others[0]) : own && own.user_id === id ? profileToStudent(own) : undefined);
      setMatched(matches.some((m) => otherUserId(m, user.id) === id));
      setDeck(discover.map(profileToStudent));
    })().catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  if (!p) {
    return (
      <PhoneShell>
        <p className="px-6 py-10 text-center text-sm">That profile is gone.</p>
      </PhoneShell>
    );
  }

  const s = buildAppState(me, filters);
  const comp = compatibility(p, s);
  const badges = [
    p.verified ? "Verified UMN email" : "Unverified",
    p.housing,
    ...p.neighborhoods,
    `$${p.budgetMin}–$${p.budgetMax}/mo`,
    `Move-in ${p.moveIn}`,
    p.parking,
    ...(p.hasRoommates ? ["Has existing roommates"] : []),
    ...(p.lookingForSubleaser ? ["Looking for a subleaser"] : []),
  ];

  return (
    <PhoneShell>
      <div className="px-6 pb-8">
        <Link to="/discover" className="flex items-center gap-1 pt-3 text-xs font-semibold text-muted-foreground">
          <ChevronLeft className="size-4" /> Back to deck
        </Link>

        <div className="relative mt-4">
          <div className="absolute inset-0 rotate-2 rounded-[28px] border-2 border-primary bg-accent" />
          <Placeholder label={p.name.charAt(0)} className="relative h-[240px] w-full -rotate-1 rounded-[28px] border-2 border-primary" />
          {isMutualNumberOne(p, s, deck) && (
            <span className="absolute -right-2 -top-3 flex size-16 rotate-12 flex-col items-center justify-center rounded-full border-2 border-primary bg-accent text-center text-[10px] font-extrabold leading-tight">
              ⭐<span>each other’s #1</span>
            </span>
          )}
        </div>

        <h1 className="mt-5 text-3xl text-primary">{p.name}, {p.age}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span className="size-2 rounded-full bg-online" /> {p.lastActive} · {p.pronouns}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <span key={b} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{b}</span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {Object.entries(p.socials)
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <button
                key={k}
                onClick={() => navigator.clipboard?.writeText(String(v))}
                className={`sticker-btn rounded-full px-4 py-2 text-sm font-extrabold ${
                  k === "instagram" ? "bg-secondary text-primary" : k === "snapchat" ? "bg-accent text-accent-foreground" : k === "tiktok" ? "bg-foreground text-background" : "bg-success text-foreground"
                }`}
              >
                {k === "instagram" ? "📸 IG" : k === "snapchat" ? "👻 Snap" : k === "tiktok" ? "🎵 TikTok" : "💼 LinkedIn"}
              </button>
            ))}
        </div>

        <div className="mt-5 rounded-3xl border-2 border-primary bg-success p-4">
          <p className="font-display text-lg font-black text-primary">{comp.score}% roommate chemistry</p>
          <ul className="mt-1 space-y-0.5">
            {comp.reasons.map((r) => (
              <li key={r} className="text-sm">✨ {r}</li>
            ))}
          </ul>
          {comp.warnings.map((w) => (
            <p key={w} className="mt-2 rounded-full bg-card px-3 py-1 text-xs font-bold">💬 Talk about this: {w}</p>
          ))}
        </div>

        <div className="mt-6 space-y-7">
          {p.prompts.map((pr, i) => (
            <div key={pr.prompt} className={`sticker tape p-4 ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
              <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{pr.prompt}</p>
              <p className="font-hand mt-1 text-2xl leading-tight">{pr.answer}</p>
            </div>
          ))}
        </div>

        {matched ? (
          <Link
            to="/messages/$id"
            params={{ id: p.id }}
            className="mt-5 block sticker-btn rounded-full bg-primary py-4 text-center text-sm font-bold text-primary-foreground"
          >
            Open chat
          </Link>
        ) : (
          <button
            onClick={async () => {
              if (!user) return;
              await recordSwipe(user.id, p.id, "like");
              const reciprocal = await findReciprocalLike(user.id, p.id);
              if (reciprocal) {
                await createMatch(user.id, p.id);
                setMatched(true);
              }
            }}
            className="mt-5 w-full sticker-btn rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground"
          >
            Match with {p.name}
          </button>
        )}

        <div className="mt-4">
          <SpotifyBar track={p.spotify.track} artist={p.spotify.artist} />
        </div>
      </div>
    </PhoneShell>
  );
}
