import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell, Placeholder } from "@/components/PhoneShell";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyMatches, fetchProfilesByUserIds, otherUserId, profileToStudent, type MatchRow } from "@/lib/api";
import type { Student } from "@/lib/data";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Your matches — GopherHole" },
      { name: "description", content: "Potential roommates you matched with, with icebreakers already loaded." },
      { property: "og:title", content: "Your matches — GopherHole" },
      { property: "og:description", content: "Potential roommates you matched with, with icebreakers already loaded." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Matches,
});

function Matches() {
  const { user, loading } = useAuth();
  const [people, setPeople] = useState<Student[]>([]);
  const [matchIds, setMatchIds] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const matches = await fetchMyMatches(user.id);
      const ids = matches.map((m: MatchRow) => otherUserId(m, user.id));
      const map: Record<string, string> = {};
      for (const m of matches) map[otherUserId(m, user.id)] = m.id;
      const rows = await fetchProfilesByUserIds(ids);
      if (cancelled) return;
      setMatchIds(map);
      setPeople(rows.map(profileToStudent));
    })().catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <PhoneShell>
        <p className="px-6 py-10 text-center text-sm text-muted-foreground">Loading matches…</p>
      </PhoneShell>
    );
  }

  const [lead, ...rest] = people;

  return (
    <PhoneShell>
      <div className="px-6 pb-8">
        <h1 className="pt-4 text-lg font-bold">Potential Roommate</h1>

        {!lead ? (
          <p className="mt-12 text-center text-sm font-semibold text-muted-foreground">
            Your standards are elite. Or your bio is only a Spotify song.
          </p>
        ) : (
          <>
            <Link
              to="/messages/$id"
              params={{ id: matchIds[lead.id] ?? lead.id }}
              className="mt-3 block rounded border border-border p-3"
            >
              <span className="inline-block rounded-md rounded-bl-none bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground">
                {lead.opener}
              </span>
              <p className="mt-2 text-sm font-bold">{lead.name}</p>
              <Placeholder label={lead.name.charAt(0)} className="mt-2 h-[189px] w-full rounded-2xl" />
            </Link>

            {rest.length > 0 && (
              <>
                <h2 className="mt-5 text-xs font-bold">Up Next</h2>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {rest.map((p) => (
                    <Link
                      key={p.id}
                      to="/messages/$id"
                      params={{ id: matchIds[p.id] ?? p.id }}
                      className="sticker p-2"
                    >
                      <span className="inline-block rounded rounded-bl-none bg-accent px-2 py-1 text-[9px] font-medium text-accent-foreground">
                        {p.opener.slice(0, 16)}
                      </span>
                      <p className="mt-1 text-xs font-bold">{p.name}</p>
                      <Placeholder label={p.name.charAt(0)} className="mt-1 h-28 w-full rounded-2xl text-lg" />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <Link
          to="/listings"
          className="mt-6 block rounded-xl border-2 border-accent py-3 text-center text-xs font-bold text-primary"
        >
          Browse subleases and open rooms
        </Link>
      </div>
    </PhoneShell>
  );
}
