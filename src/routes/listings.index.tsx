import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell, Placeholder } from "@/components/PhoneShell";
import { fetchListings, fetchProfilesByUserIds, listingFromRow, profileToStudent } from "@/lib/api";
import type { Listing } from "@/lib/data";

export const Route = createFileRoute("/listings/")({
  head: () => ({
    meta: [
      { title: "Subleases and open rooms — GopherHole" },
      { name: "description", content: "Real UMN sublease listings with rent, dates, parking, and who already lives there." },
      { property: "og:title", content: "Subleases and open rooms — GopherHole" },
      { property: "og:description", content: "Real UMN sublease listings with rent, dates, parking, and who already lives there." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Listings,
});

function Listings() {
  const [items, setItems] = useState<{ listing: Listing; posterName: string }[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await fetchListings();
      const posters = await fetchProfilesByUserIds([...new Set(rows.map((r) => r.poster_id))]);
      const names = Object.fromEntries(posters.map((p) => [p.user_id, profileToStudent(p).name]));
      if (cancelled) return;
      setItems(rows.map((r) => ({ listing: listingFromRow(r), posterName: names[r.poster_id] ?? "A gopher" })));
    })().catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, []);
  return (
    <PhoneShell>
      <div className="px-6 pb-8">
        <h1 className="pt-4 text-lg font-bold">Subleases & open rooms</h1>
        <p className="text-[11px] text-muted-foreground">Separate feed. No surprise Craigslist energy in your deck.</p>
        <div className="mt-4 space-y-4">
          {items.map(({ listing: l, posterName }) => {
            return (
              <Link key={l.id} to="/listings/$id" params={{ id: l.id }} className="block sticker p-3">
                <Placeholder label={l.pocket.charAt(0)} className="h-32 w-full rounded-2xl" />
                <p className="mt-2 text-sm font-bold">{l.title}</p>
                <p className="text-[11px] text-muted-foreground">{l.pocket}</p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  ${l.rent}/mo · {l.moveIn} – {l.moveOut}
                </p>
                <p className="text-[11px] text-muted-foreground">Posted by {posterName}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </PhoneShell>
  );
}
