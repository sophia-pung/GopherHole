import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { WheelSheet } from "@/components/WheelPicker";
import { MAJORS, NEIGHBORHOODS, STATES } from "@/lib/data";
import { setFilters, useFilters, type Filters as F } from "@/lib/store";

export const Route = createFileRoute("/filters")({
  head: () => ({
    meta: [
      { title: "Roommate preferences — GopherHole" },
      { name: "description", content: "Filter roommates by neighborhood, year, major, home state, and lifestyle." },
      { property: "og:title", content: "Roommate preferences — GopherHole" },
      { property: "og:description", content: "Filter roommates by neighborhood, year, major, home state, and lifestyle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FiltersPage,
});

type Key = "neighborhood" | "year" | "major" | "state" | "intent";

const ROWS: { key: Key; label: string; options: string[] }[] = [
  { key: "neighborhood", label: "Neighborhood", options: ["Any", ...NEIGHBORHOODS] },
  { key: "year", label: "Year", options: ["Any", "Freshman", "Sophomore", "Junior", "Senior", "Grad"] },
  { key: "major", label: "Major", options: ["Any", ...MAJORS] },
  { key: "state", label: "Home state", options: ["Any", ...STATES] },
];

function Row({ label, value, onOpen }: { label: string; value: string; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="flex w-full items-center justify-between border-b border-border py-3">
      <p className="text-xs font-bold">{label}</p>
      <p className="text-[11px] text-muted-foreground">{value} ▾</p>
    </button>
  );
}

function FiltersPage() {
  const f = useFilters();
  const navigate = useNavigate();
  const [open, setOpen] = useState<{ key: Key; label: string; options: string[] } | null>(null);
  const set = (patch: Partial<F>) => setFilters((cur) => ({ ...cur, ...patch }));
  const intentRow = { key: "intent" as const, label: "What I want", options: ["Any", "Just a roommate", "Roommate who could be a friend"] };

  return (
    <PhoneShell>
      <div className="px-6 pb-8">
        <div className="relative flex items-center justify-center py-2">
          <h1 className="text-sm font-bold text-primary">Roommate Preferences</h1>
          <button onClick={() => navigate({ to: "/discover" })} className="absolute right-0" aria-label="Close">
            <X className="size-4 text-primary" />
          </button>
        </div>

        <p className="mt-4 text-[10px] font-bold text-primary">BASICS</p>
        {ROWS.map((r) => (
          <Row key={r.key} label={r.label} value={String(f[r.key])} onOpen={() => setOpen(r)} />
        ))}

        <p className="mt-5 text-[10px] font-bold text-primary">LIFESTYLE</p>
        <Row label={intentRow.label} value={f.intent} onOpen={() => setOpen(intentRow)} />
        <div className="flex items-center justify-between border-b border-border py-3">
          <div>
            <p className="text-xs font-bold">Looking for a subleaser</p>
            <p className="text-[10px] text-muted-foreground">Only show people with a room to fill</p>
          </div>
          <button
            onClick={() => set({ needsSubleaser: !f.needsSubleaser })}
            className={
              f.needsSubleaser
                ? "rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold text-primary-foreground"
                : "rounded-full border-2 border-input px-3 py-1.5 text-[10px] font-semibold"
            }
          >
            {f.needsSubleaser ? "On" : "Off"}
          </button>
        </div>

        <button
          onClick={() => navigate({ to: "/discover" })}
          className="mt-6 w-full sticker-btn rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground"
        >
          Show me people
        </button>
      </div>
      {open && (
        <WheelSheet
          title={open.label}
          options={open.options}
          value={String(f[open.key])}
          onClose={() => setOpen(null)}
          onDone={(v) => {
            set({ [open.key]: v } as Partial<F>);
            setOpen(null);
          }}
        />
      )}
    </PhoneShell>
  );
}
