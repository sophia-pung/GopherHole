import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";
import { Shuffle } from "lucide-react";
import { PhoneShell } from "@/components/PhoneShell";
import { WheelField } from "@/components/WheelPicker";
import { DORMS, MAJORS, MONTHS, NEIGHBORHOODS, PROMPT_BANK, STATES } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { meToProfile, upsertOwnProfile } from "@/lib/api";

const MapRadius = lazy(() => import("@/components/MapRadius").then((m) => ({ default: m.MapRadius })));

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Build your roommate profile — GopherHole" },
      { name: "description", content: "One question at a time: year, housing, budget, roommates, prompts, socials." },
      { property: "og:title", content: "Build your roommate profile — GopherHole" },
      { property: "og:description", content: "One question at a time: year, housing, budget, roommates, prompts, socials." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad"];
const HOUSING = [
  { v: "Dorm", emoji: "🏫", sub: "On-campus residence hall" },
  { v: "Apartment", emoji: "🏢", sub: "Find a place + roommate off campus" },
  { v: "Subletting my place", emoji: "🔑", sub: "I have a room to fill" },
];
const PARKING = ["Bringing a car", "Need a spot", "No car"];
const INTENT = ["Just a roommate", "Roommate who could be a friend"];
const SOCIALS: { k: string; label: string; prefix: string }[] = [
  { k: "instagram", label: "Instagram", prefix: "instagram.com/" },
  { k: "snapchat", label: "Snapchat", prefix: "snapchat.com/add/" },
  { k: "tiktok", label: "TikTok", prefix: "tiktok.com/@" },
  { k: "linkedin", label: "LinkedIn", prefix: "linkedin.com/in/" },
];
const HOOD_COORDS: Record<string, [number, number]> = {
  Dinkytown: [44.9807, -93.2366],
  Superblock: [44.9728, -93.2297],
  "Stadium Village": [44.9745, -93.2226],
  Como: [44.9885, -93.2213],
  "Prospect Park": [44.9657, -93.2127],
  Downtown: [44.9778, -93.265],
  "St. Paul campus": [44.9851, -93.1818],
};
const PROMPT_COLORS = ["bg-accent/40", "bg-primary/10", "bg-secondary"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-bold">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Pills({ options, value, onSelect }: { options: string[]; value: string | string[]; onSelect: (v: string) => void }) {
  const isOn = (o: string) => (Array.isArray(value) ? value.includes(o) : value === o);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onSelect(o)}
          className={
            isOn(o)
              ? "rounded-full bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-transform active:scale-95"
              : "rounded-full border-2 border-input px-3 py-2 text-xs text-foreground transition-transform active:scale-95"
          }
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function RoommateSlider({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="mb-2 flex justify-center text-4xl">{value === 0 ? "🙋 Solo" : `${"🧑".repeat(value)}${value >= 4 ? "+" : ""}`}</div>
      <input
        type="range"
        min={0}
        max={4}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        {["0", "1", "2", "3", "4+"].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
    </div>
  );
}

function BudgetRange({ min, max, onChange }: { min: number; max: number; onChange: (a: number, b: number) => void }) {
  const LO = 300;
  const HI = 2500;
  const pct = (v: number) => ((v - LO) / (HI - LO)) * 100;
  return (
    <div>
      <p className="text-center text-2xl font-bold text-primary">
        ${min} – ${max}
        {max >= HI ? "+" : ""}
      </p>
      <div className="dual-range relative mt-3 h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-secondary" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${pct(min)}%`, right: `${100 - pct(max)}%` }}
        />
        <input type="range" min={LO} max={HI} step={50} value={min} aria-label="Minimum budget"
          onChange={(e) => onChange(Math.min(Number(e.target.value), max - 50), max)} />
        <input type="range" min={LO} max={HI} step={50} value={max} aria-label="Maximum budget"
          onChange={(e) => onChange(min, Math.max(Number(e.target.value), min + 50))} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>${LO}</span>
        <span>${HI}+</span>
      </div>
    </div>
  );
}

const input = "w-full rounded-2xl border-2 border-input bg-card px-3 py-3 text-sm outline-none focus:border-accent";

function Onboarding() {
  const { user, me: saved, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [me, setMe] = useState(saved);
  const [picked, setPicked] = useState<{ prompt: string; answer: string }[]>(saved.prompts);
  const [deckStart, setDeckStart] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    setMe(saved);
    setPicked(saved.prompts);
  }, [saved]);

  const visiblePrompts = Array.from({ length: 4 }, (_, i) => PROMPT_BANK[(deckStart + i) % PROMPT_BANK.length]!);

  const whereBody =
    me.housing === "Dorm" ? (
      <Field label="Tap every dorm you'd live in">
        <div className="grid grid-cols-2 gap-2">
          {DORMS.map((d) => {
            const on = me.dorms.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => setMe({ ...me, dorms: on ? me.dorms.filter((x) => x !== d) : [...me.dorms, d] })}
                className={
                  on
                    ? "rounded-xl border-2 border-accent bg-primary px-2 py-3 text-xs font-bold text-primary-foreground transition-transform active:scale-95"
                    : "sticker-btn rounded-full bg-card px-2 py-3 text-xs transition-transform active:scale-95"
                }
              >
                {d}
              </button>
            );
          })}
        </div>
      </Field>
    ) : me.housing === "Subletting my place" ? (
      <>
        <Field label="Address of the place you're subletting">
          <input className={input} placeholder="1225 SE 5th St, Minneapolis" value={me.address}
            onChange={(e) => setMe({ ...me, address: e.target.value })} />
        </Field>
        <p className="mt-2 text-[11px] text-muted-foreground">Only matched students see the exact address.</p>
      </>
    ) : (
      <>
        <p className="mt-1 text-[11px] text-muted-foreground">Tap the map to move your pin, then set how far you'll go.</p>
        <div className="mt-3">
          {hydrated && (
            <Suspense fallback={<div className="h-56 rounded-xl bg-secondary" />}>
              <MapRadius center={me.mapCenter} radiusMi={me.radiusMi} onCenter={(c) => setMe((m) => ({ ...m, mapCenter: c }))} />
            </Suspense>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs font-bold">Radius</p>
          <p className="text-xs text-muted-foreground">{me.radiusMi} mi</p>
        </div>
        <input type="range" min={0.25} max={5} step={0.25} value={me.radiusMi}
          onChange={(e) => setMe({ ...me, radiusMi: Number(e.target.value) })} className="w-full accent-primary" />
        <div className="mt-3 flex flex-wrap gap-2">
          {NEIGHBORHOODS.map((n) => (
            <button key={n} type="button" onClick={() => setMe({ ...me, mapCenter: HOOD_COORDS[n]!, neighborhoods: [n] })}
              className={me.neighborhoods[0] === n
                ? "rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
                : "rounded-full border-2 border-input px-3 py-1.5 text-[11px]"}>
              📍 {n}
            </button>
          ))}
        </div>
      </>
    );

  const steps = [
    {
      title: "Who are you?",
      body: (
        <>
          <Field label="First name">
            <input className={input} value={me.firstName} onChange={(e) => setMe({ ...me, firstName: e.target.value })} />
          </Field>
          <Field label="Age">
            <input className={input} inputMode="numeric" value={me.age} onChange={(e) => setMe({ ...me, age: e.target.value })} />
          </Field>
          <Field label="Home state">
            <WheelField label="Home state" options={STATES} value={me.homeState} onChange={(v) => setMe({ ...me, homeState: v })} />
          </Field>
          <Field label="Year">
            <Pills options={YEARS} value={me.year} onSelect={(v) => setMe({ ...me, year: v })} />
          </Field>
        </>
      ),
    },
    {
      title: "What are you studying?",
      body: (
        <Field label="Major">
          <WheelField label="Major" options={MAJORS} value={me.major} onChange={(v) => setMe({ ...me, major: v })} />
        </Field>
      ),
    },
    {
      title: "What kind of housing?",
      body: (
        <div className="mt-3 space-y-3">
          {HOUSING.map((h) => (
            <button key={h.v} type="button" onClick={() => setMe({ ...me, housing: h.v })}
              className={me.housing === h.v
                ? "flex w-full items-center gap-4 rounded-2xl border-2 border-accent bg-primary p-4 text-left text-primary-foreground transition-transform active:scale-[0.98]"
                : "flex w-full items-center gap-4 rounded-2xl border-2 border-input p-4 text-left transition-transform active:scale-[0.98]"}>
              <span className="text-3xl">{h.emoji}</span>
              <span>
                <span className="block text-sm font-bold">{h.v}</span>
                <span className="block text-[11px] opacity-75">{h.sub}</span>
              </span>
            </button>
          ))}
        </div>
      ),
    },
    {
      title: me.housing === "Dorm" ? "Which dorms?" : me.housing === "Subletting my place" ? "Where's your place?" : "Where do you want to live?",
      body: whereBody,
    },
    {
      title: "Money and dates",
      body: (
        <>
          <Field label="Budget per person / month">
            <BudgetRange min={me.budgetMin} max={me.budgetMax}
              onChange={(a, b) => setMe({ ...me, budgetMin: a, budgetMax: b, budget: `$${a}–$${b}` })} />
          </Field>
          <Field label="Move-in month">
            <WheelField label="Move-in month" options={MONTHS} value={me.moveIn} onChange={(v) => setMe({ ...me, moveIn: v })} />
          </Field>
          <Field label="Parking">
            <Pills options={PARKING} value={me.parking} onSelect={(v) => setMe({ ...me, parking: v })} />
          </Field>
        </>
      ),
    },
    {
      title: "Roommates",
      body: (
        <>
          <Field label={me.housing === "Subletting my place" ? "Current number of roommates" : "How many roommates do you want?"}>
            {me.housing === "Subletting my place" ? (
              <WheelField label="Current roommates" options={["0", "1", "2", "3", "4", "5+"]}
                value={String(me.roommates)} onChange={(v) => setMe({ ...me, roommates: parseInt(v, 10) })} />
            ) : (
              <RoommateSlider value={Math.min(me.roommates, 4)} onChange={(n) => setMe({ ...me, roommates: n })} />
            )}
          </Field>
          <Field label="What you're looking for">
            <Pills options={INTENT} value={me.intent} onSelect={(v) => setMe({ ...me, intent: v })} />
          </Field>
        </>
      ),
    },
    {
      title: "Pick 3 prompts",
      body: (
        <div>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className={i < picked.length ? "size-3 rounded-full bg-accent" : "size-3 rounded-full bg-secondary"} />
              ))}
            </div>
            <button type="button" onClick={() => setDeckStart((d) => d + 4)}
              className="flex items-center gap-1 rounded-full border-2 border-input px-3 py-1.5 text-[11px] font-semibold active:rotate-6">
              <Shuffle className="size-3" /> Shuffle
            </button>
          </div>

          {picked.map((p, i) => (
            <div key={p.prompt} className={`mt-3 rounded-2xl p-4 ${PROMPT_COLORS[i % 3]}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-primary">{p.prompt}</p>
                <button type="button" aria-label="Remove prompt" className="text-xs text-muted-foreground"
                  onClick={() => setPicked(picked.filter((x) => x.prompt !== p.prompt))}>✕</button>
              </div>
              <textarea rows={2} placeholder="Type your answer…" value={p.answer} maxLength={150}
                onChange={(e) => setPicked(picked.map((x) => (x.prompt === p.prompt ? { ...x, answer: e.target.value } : x)))}
                className="mt-2 w-full resize-none rounded-xl bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent" />
              <p className="text-right text-[10px] text-muted-foreground">{p.answer.length}/150</p>
            </div>
          ))}

          {picked.length < 3 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {visiblePrompts.filter((p) => !picked.some((x) => x.prompt === p)).map((p) => (
                <button key={p} type="button" onClick={() => setPicked([...picked, { prompt: p, answer: "" }])}
                  className="rounded-2xl border-2 border-dashed border-accent p-3 text-left text-xs font-semibold transition-transform hover:-rotate-1 active:scale-95">
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Link your socials",
      body: (
        <>
          {SOCIALS.map(({ k, label, prefix }) => (
            <Field key={k} label={label}>
              <div className="flex items-center overflow-hidden rounded-2xl border-2 border-input bg-card focus-within:border-accent">
                <span className="whitespace-nowrap bg-secondary px-2 py-3 text-xs text-muted-foreground">{prefix}</span>
                <input className="w-full px-2 py-3 text-sm outline-none" placeholder="username"
                  value={me.socials[k] ?? ""}
                  onChange={(e) => setMe({ ...me, socials: { ...me.socials, [k]: e.target.value.replace(/^@/, "").trim() } })} />
              </div>
            </Field>
          ))}
          <a href="https://accounts.spotify.com/login?continue=https%3A%2F%2Fopen.spotify.com%2F" target="_blank" rel="noreferrer"
            onClick={() => setMe({ ...me, spotifyConnected: true })}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-spotify py-3 text-sm font-bold text-spotify-foreground">
            {me.spotifyConnected ? "Spotify opened ✓ — open again" : "Connect Spotify"}
          </a>
          {me.spotifyConnected && (
            <Field label="Paste a Spotify song link to show on your profile">
              <input className={input} placeholder="https://open.spotify.com/track/…" value={me.spotifyTrack}
                onChange={(e) => setMe({ ...me, spotifyTrack: e.target.value })} />
              {/open\.spotify\.com\/track\/([A-Za-z0-9]+)/.test(me.spotifyTrack) && (
                <iframe title="Spotify track" className="mt-3 h-20 w-full rounded-xl" allow="encrypted-media"
                  src={`https://open.spotify.com/embed/track/${me.spotifyTrack.match(/track\/([A-Za-z0-9]+)/)![1]}`} />
              )}
            </Field>
          )}
        </>
      ),
    },
    {
      title: "Review and publish",
      body: (
        <div className="space-y-2 text-sm">
          <p className="font-bold">{me.firstName || "You"}</p>
          <p className="text-xs text-muted-foreground">
            {[me.year, me.major, me.homeState, me.housing, `$${me.budgetMin}–$${me.budgetMax}`, me.moveIn].filter(Boolean).join(" · ")}
          </p>
          <p className="text-xs text-muted-foreground">
            {me.housing === "Dorm" ? me.dorms.join(", ") : me.housing === "Subletting my place" ? me.address : `${me.radiusMi} mi around ${me.neighborhoods[0] ?? "your pin"}`}
          </p>
          <p className="text-xs text-muted-foreground">{picked.length} prompt answers</p>
        </div>
      ),
    },
  ];

  const last = step === steps.length - 1;

  async function next() {
    if (last) {
      if (!user) {
        navigate({ to: "/signup" });
        return;
      }
      setBusy(true);
      setError("");
      try {
        await upsertOwnProfile(meToProfile(user.id, user.email ?? me.email, { ...me, prompts: picked }, true));
        await refreshProfile();
        navigate({ to: "/discover" });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not publish profile.");
        setBusy(false);
      }
      return;
    }
    setStep(step + 1);
  }

  return (
    <PhoneShell tabs={false}>
      <div className="flex min-h-full flex-col px-6 pb-8 pt-4">
        <div className="h-1.5 w-full rounded-full bg-secondary">
          <div className="h-1.5 rounded-full bg-accent transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>
        <h1 className="mt-5 text-xl font-bold text-primary">{steps[step]!.title}</h1>
        <div className="mt-2 flex-1">{steps[step]!.body}</div>
        {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}
        <div className="mt-6 flex gap-3">
          {step > 0 && (
            <button type="button" onClick={() => setStep(step - 1)} className="sticker-btn rounded-full bg-card px-5 py-4 text-sm font-bold">
              Back
            </button>
          )}
          <button type="button" onClick={next} disabled={busy || (step === 2 && !me.housing)}
            className="flex-1 sticker-btn rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-40">
            {busy ? "Publishing…" : last ? "Publish profile" : "Next"}
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}
