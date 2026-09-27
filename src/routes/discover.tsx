import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, MoreHorizontal, SlidersHorizontal, Undo2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PhoneShell, Placeholder, SpotifyBar } from "@/components/PhoneShell";
import { deck, compatibility, isMutualNumberOne } from "@/lib/match";
import { setFilters, useFilters } from "@/lib/store";
import { WheelSheet } from "@/components/WheelPicker";
import { MAJORS, STATES } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import {
  createMatch,
  deleteSwipe,
  fetchDiscoverProfiles,
  findReciprocalLike,
  profileToStudent,
  recordSwipe,
} from "@/lib/api";
import { buildAppState } from "@/lib/session-state";
import type { Student } from "@/lib/data";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover roommates — GopherHole" },
      { name: "description", content: "Swipe verified UMN students by housing type, neighborhood, budget, and move-in." },
      { property: "og:title", content: "Discover roommates — GopherHole" },
      { property: "og:description", content: "Swipe verified UMN students by housing type, neighborhood, budget, and move-in." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Discover,
});


function Discover() {
  const { user, me, loading, profile } = useAuth();
  const filters = useFilters();
  const navigate = useNavigate();
  const [picker, setPicker] = useState<null | "major" | "state">(null);
  const [lastAction, setLastAction] = useState<{ id: string; kind: "liked" | "skipped" } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadError, setLoadError] = useState("");
  const [ready, setReady] = useState(false);

  const s = buildAppState(me, filters);
  const cards = useMemo(() => deck(s, students), [s, students]);
  const card = cards[0];

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setReady(true);
      return;
    }
    let cancelled = false;
    fetchDiscoverProfiles(user.id)
      .then((rows) => {
        if (!cancelled) setStudents(rows.map(profileToStudent));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "Could not load profiles.");
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, user]);

  if (loading || !ready) {
    return (
      <PhoneShell>
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">Loading roommates…</p>
      </PhoneShell>
    );
  }

  if (!user) {
    return (
      <PhoneShell>
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-bold text-primary">Verify your UMN email first</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Unverified accounts can’t swipe, message, or post a listing.
          </p>
          <Link to="/signup" className="mt-5 inline-block sticker-btn rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground">
            Sign in
          </Link>
        </div>
      </PhoneShell>
    );
  }

  if (!profile?.published) {
    return (
      <PhoneShell>
        <div className="px-6 py-10 text-center">
          <p className="text-sm font-bold text-primary">Publish your profile first</p>
          <p className="mt-2 text-xs text-muted-foreground">Discover only shows published roommates.</p>
          <Link to="/onboarding" className="mt-5 inline-block sticker-btn rounded-full bg-primary px-5 py-3 text-xs font-bold text-primary-foreground">
            Finish onboarding
          </Link>
        </div>
      </PhoneShell>
    );
  }

  async function act(kind: "liked" | "skipped") {
    if (!card || !user) return;
    setLastAction({ id: card.id, kind });
    setStudents((prev) => prev.filter((st) => st.id !== card.id));
    try {
      await recordSwipe(user.id, card.id, kind === "liked" ? "like" : "pass");
      if (kind === "liked") {
        const reciprocal = await findReciprocalLike(user.id, card.id);
        if (reciprocal) await createMatch(user.id, card.id);
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Swipe failed.");
    }
  }

  async function undo() {
    if (!lastAction || !user) return;
    try {
      await deleteSwipe(user.id, lastAction.id);
      const rows = await fetchDiscoverProfiles(user.id);
      setStudents(rows.map(profileToStudent));
      setLastAction(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Undo failed.");
    }
  }

  const comp = card ? compatibility(card, s) : null;

  return (
    <PhoneShell>
      <div className="px-6 pb-6">
        <p className="text-center font-display text-xl font-black text-primary">
          {me.housing === "Dorm" ? "Dorm roommates" : me.housing === "Subletting my place" ? "Subleasers" : "Off-campus roommates"}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <Link to="/filters" aria-label="Filters">
            <SlidersHorizontal className="size-5 text-foreground" />
          </Link>
          {(["major", "state"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setPicker(k)}
              className="sticker-btn flex items-center gap-1 rounded-full bg-secondary py-1.5 pl-3 pr-2 text-sm font-bold text-secondary-foreground"
            >
              {filters[k] === "Any" ? (k === "major" ? "Major" : "State") : filters[k]}
              <ChevronDown className="size-3.5" />
            </button>
          ))}
          {picker && (
            <WheelSheet
              title={picker === "major" ? "Major" : "Home state"}
              options={["Any", ...(picker === "major" ? MAJORS : STATES)]}
              value={filters[picker]}
              onDone={(v) => {
                const k = picker;
                setFilters((f) => ({ ...f, [k]: v }));
                setPicker(null);
              }}
              onClose={() => setPicker(null)}
            />
          )}
        </div>

        {loadError && <p className="mt-3 text-center text-xs font-medium text-destructive">{loadError}</p>}

        {!card ? (
          <div className="sticker mt-10 p-6 text-center">
            <p className="text-5xl">🦫</p>
            <h2 className="mt-2 text-lg text-primary">The gopher hole is empty</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nobody in Dinky wants your budget. Widen filters or become a morning person.
            </p>
          </div>
        ) : (
          <>
            <div className="relative mt-5">
              <div className="absolute inset-0 rotate-[3deg] rounded-[28px] border-2 border-primary bg-accent" />
              <div className="absolute inset-0 -rotate-[2deg] rounded-[28px] border-2 border-primary bg-secondary" />
              <div className="sticker relative !rounded-[28px] p-3">
                {isMutualNumberOne(card, s, students) && (
                  <span className="absolute -right-3 -top-4 z-10 flex size-16 rotate-12 flex-col items-center justify-center rounded-full border-2 border-primary bg-accent text-center text-[10px] font-extrabold leading-tight shadow-[2px_2px_0_var(--primary)]">
                    ⭐<span>each other’s #1</span>
                  </span>
                )}
                <Link to="/profile/$id" params={{ id: card.id }}>
                  <Placeholder label={card.name.charAt(0)} className="h-[210px] w-full rounded-[20px] border-2 border-primary" />
                </Link>
                <div className="mt-3 flex items-start justify-between px-1">
                  <div>
                    <h1 className="text-2xl text-primary">{card.name}, {card.age}</h1>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="size-2 rounded-full bg-online" /> {card.lastActive} · {card.pronouns}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={undo} aria-label="Undo" className="sticker-btn flex size-9 items-center justify-center rounded-full bg-card">
                      <Undo2 className="size-4 text-primary" />
                    </button>
                    <Link to="/profile/$id" params={{ id: card.id }} aria-label="More" className="sticker-btn flex size-9 items-center justify-center rounded-full bg-card">
                      <MoreHorizontal className="size-4 text-primary" />
                    </Link>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 px-1">
                  {[
                    `${card.housing === "Dorm" ? "🏫" : card.housing === "Apartment" ? "🏢" : "🔑"} ${card.housing}`,
                    `📚 ${card.major}`,
                    `🎓 ${card.year}`,
                    `📍 ${card.hometown}`,
                    `💸 $${card.budgetMin}–$${card.budgetMax}`,
                    card.parking === "No car" ? "🚲 No car" : `🚗 ${card.parking}`,
                    card.sleep === "Night owl" ? "🦉 Night owl" : card.sleep === "Early bird" ? "🐦 Early bird" : "🌗 In between",
                  ].map((c) => (
                    <span key={c} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{c}</span>
                  ))}
                </div>
              </div>
            </div>

            {card.prompts[0] && (
              <div className="sticker tape mt-7 -rotate-1 p-4">
                <p className="text-xs font-extrabold uppercase tracking-wide text-primary">{card.prompts[0].prompt}</p>
                <p className="font-hand mt-1 text-2xl leading-tight">{card.prompts[0].answer}</p>
              </div>
            )}

            <div className="mt-4 rounded-3xl border-2 border-primary bg-success p-4">
              <p className="font-display text-lg font-black text-primary">{comp!.score}% roommate chemistry</p>
              <ul className="mt-1 space-y-0.5">
                {comp!.reasons.map((r) => (
                  <li key={r} className="text-sm">✨ {r}</li>
                ))}
              </ul>
              {comp!.warnings.map((w) => (
                <p key={w} className="mt-2 rounded-full bg-card px-3 py-1 text-xs font-bold">💬 Talk about this: {w}</p>
              ))}
            </div>

            <div className="mt-5 flex gap-3">
              <button onClick={() => act("skipped")} className="sticker-btn flex-1 rounded-full bg-card py-3.5 text-base font-extrabold text-primary">
                ✋ Pass
              </button>
              <button
                onClick={() => {
                  act("liked");
                  navigate({ to: "/matches" });
                }}
                className="sticker-btn flex-1 rounded-full bg-primary py-3.5 text-base font-extrabold text-primary-foreground"
              >
                💌 Match
              </button>
            </div>

            <div className="mt-5">
              <SpotifyBar track={card.spotify.track} artist={card.spotify.artist} />
            </div>
          </>
        )}
      </div>
    </PhoneShell>
  );
}
