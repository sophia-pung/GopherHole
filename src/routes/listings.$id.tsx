import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { PhoneShell, Placeholder } from "@/components/PhoneShell";
import { useAuth } from "@/hooks/use-auth";
import {
  createMatch,
  fetchListings,
  fetchMyMatches,
  fetchProfilesByUserIds,
  listingFromRow,
  otherUserId,
  profileToStudent,
  sendMessage,
} from "@/lib/api";
import type { Listing } from "@/lib/data";
import type { Student } from "@/lib/data";

export const Route = createFileRoute("/listings/$id")({
  head: () => ({
    meta: [
      { title: "Sublease details — GopherHole" },
      { name: "description", content: "Rent, utilities, dates, parking, and existing roommates for this UMN room." },
      { property: "og:title", content: "Sublease details — GopherHole" },
      { property: "og:description", content: "Rent, utilities, dates, parking, and existing roommates for this UMN room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListingDetail,
});

function ListingDetail() {
  const { id } = useParams({ from: "/listings/$id" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [l, setL] = useState<Listing | undefined>();
  const [poster, setPoster] = useState<Student | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await fetchListings();
      const row = rows.find((x) => x.id === id);
      if (!row) return;
      const posters = await fetchProfilesByUserIds([row.poster_id]);
      if (cancelled) return;
      setL(listingFromRow(row));
      setPoster(posters[0] ? profileToStudent(posters[0]) : undefined);
    })().catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!l || !poster) {
    return (
      <PhoneShell>
        <p className="px-6 py-10 text-center text-sm">This listing is gone.</p>
      </PhoneShell>
    );
  }

  const rows = [
    ["Rent", `$${l.rent}/mo`],
    ["Utilities", l.utilities],
    ["Move-in", l.moveIn],
    ["Move-out", l.moveOut],
    ["Parking", l.parking],
    ["Who lives there", l.existing],
  ];

  return (
    <PhoneShell>
      <div className="px-6 pb-8">
        <Link to="/listings" className="flex items-center gap-1 pt-3 text-xs font-semibold text-muted-foreground">
          <ChevronLeft className="size-4" /> All listings
        </Link>
        <Placeholder label={l.pocket.charAt(0)} className="mt-3 h-40 w-full rounded-xl" />
        <h1 className="mt-3 text-lg font-bold">{l.title}</h1>
        <p className="text-[11px] text-muted-foreground">{l.pocket}</p>

        <div className="mt-3 rounded-2xl bg-surface px-4 py-1">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-muted-foreground/30 py-2.5 last:border-0">
              <span className="text-xs font-bold">{k}</span>
              <span className="max-w-[60%] text-right text-xs">{v}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 rounded-2xl bg-accent/30 p-3 text-[11px] font-medium">{l.note}</p>

        <Link
          to="/profile/$id"
          params={{ id: poster.id }}
          className="mt-3 block sticker p-3 text-xs font-semibold"
        >
          View {poster.name}’s GopherHole profile →
        </Link>

        <button
          onClick={async () => {
            if (!user || !poster) return;
            const match = await createMatch(user.id, poster.id);
            const existing = await fetchMyMatches(user.id);
            const found = existing.find((m) => otherUserId(m, user.id) === poster.id) ?? match;
            await sendMessage(found.id, user.id, `Hey! You asked about ${l.title}.`);
            navigate({ to: "/messages/$id", params: { id: found.id } });
          }}
          className="mt-4 w-full sticker-btn rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground"
        >
          I’m interested
        </button>
      </div>
    </PhoneShell>
  );
}
