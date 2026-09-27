import { useEffect, useRef, useState } from "react";

const ITEM = 40;

export function Wheel({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idx = Math.max(0, options.indexOf(value));

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = idx * ITEM;
    // only on mount / option change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  function onScroll() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(options.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM)));
      if (options[i] !== undefined && options[i] !== value) onChange(options[i]!);
    }, 80);
  }

  return (
    <div className="relative h-[200px] overflow-hidden rounded-3xl border-2 border-primary bg-card">
      <div className="pointer-events-none absolute inset-x-2 top-[80px] h-10 rounded-full border-2 border-primary bg-accent/30" />
      <div
        ref={ref}
        onScroll={onScroll}
        className="relative h-full snap-y snap-mandatory overflow-y-scroll py-[80px] [scrollbar-width:none]"
      >
        {options.map((o, i) => {
          const d = Math.abs(i - idx);
          return (
            <button
              type="button"
              key={o}
              onClick={() => {
                ref.current?.scrollTo({ top: i * ITEM, behavior: "smooth" });
                onChange(o);
              }}
              className="flex h-10 w-full snap-center items-center justify-center transition-all"
              style={{ opacity: d === 0 ? 1 : d === 1 ? 0.55 : 0.25, transform: `scale(${d === 0 ? 1.08 : 0.92})` }}
            >
              <span className={d === 0 ? "text-base font-extrabold text-primary" : "text-base text-foreground"}>
                {d === 0 && <span className="mr-2 text-accent">✓</span>}
                {o}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WheelSheet({
  title,
  options,
  value,
  onDone,
  onClose,
}: {
  title: string;
  options: string[];
  value: string;
  onDone: (v: string) => void;
  onClose: () => void;
}) {
  const [v, setV] = useState(value);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40" onClick={onClose}>
      <div
        className="w-full max-w-[390px] rounded-t-[32px] border-2 border-b-0 border-primary bg-background p-5 pb-8 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
        <div className="mb-3 flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-xs text-muted-foreground">
            Cancel
          </button>
          <p className="text-sm font-bold text-primary">{title}</p>
          <button type="button" onClick={() => onDone(v)} className="text-xs font-bold text-primary">
            Done
          </button>
        </div>
        <Wheel options={options} value={v} onChange={setV} />
      </div>
    </div>
  );
}

/** A tappable field that opens a wheel sheet. */
export function WheelField({
  label,
  options,
  value,
  placeholder = "Pick one",
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="sticker-btn flex w-full items-center justify-between rounded-full bg-card px-4 py-3 text-left text-base"
        aria-label={label}
      >
        <span className={value ? "" : "text-muted-foreground"}>{value || placeholder}</span>
        <span className="text-xs text-muted-foreground">▾</span>
      </button>
      {open && (
        <WheelSheet
          title={label}
          options={options}
          value={value || options[0]!}
          onClose={() => setOpen(false)}
          onDone={(v) => {
            onChange(v);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
