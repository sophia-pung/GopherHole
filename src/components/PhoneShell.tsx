import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, Home, MessageCircle, User } from "lucide-react";
import type { ReactNode } from "react";

function StatusBar() {
  return (
    <div className="relative h-11 shrink-0">
      <span className="absolute left-6 top-3 text-xs font-semibold tracking-wide text-foreground">3:14</span>
      <div className="absolute left-1/2 top-2.5 h-6 w-[99px] -translate-x-1/2 rounded-[40px] bg-foreground" />
      <div className="absolute right-6 top-4 flex items-end gap-[3px]">
        {[3, 5, 7, 9].map((h) => (
          <span key={h} className="w-[3px] rounded-sm bg-foreground" style={{ height: h }} />
        ))}
        <span className="ml-1 h-2 w-4 rounded border border-foreground p-[1px]">
          <span className="block h-full w-3/4 rounded-[1px] bg-foreground" />
        </span>
      </div>
    </div>
  );
}

const tabs = [
  { to: "/discover", label: "Home", Icon: Home },
  { to: "/matches", label: "Matches", Icon: Heart },
  { to: "/messages", label: "Messages", Icon: MessageCircle },
  { to: "/me", label: "Profile", Icon: User },
] as const;

function TabBar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="mx-3 mb-3 shrink-0 rounded-[28px] border-2 border-primary bg-primary pb-2 pt-3 shadow-[3px_3px_0_var(--accent)]">
      <ul className="grid grid-cols-4">
        {tabs.map(({ to, label, Icon }) => {
          const active = path === to || path.startsWith(`${to}/`);
          return (
            <li key={to} className="flex justify-center">
              <Link
                to={to}
                className={
                  active
                    ? "flex flex-col items-center gap-1 text-accent"
                    : "flex flex-col items-center gap-1 text-primary-foreground"
                }
              >
                <Icon className="size-5" strokeWidth={2} />
                <span className="text-[10px] font-semibold">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mx-auto mt-2 h-1 w-[140px] rounded-full bg-primary-foreground/60" />
    </nav>
  );
}

export function PhoneShell({ children, tabs: showTabs = true }: { children: ReactNode; tabs?: boolean }) {
  return (
    <div className="flex min-h-screen justify-center bg-background py-0 sm:py-10">
      <div className="flex min-h-screen w-full max-w-[390px] flex-col overflow-hidden bg-background sm:min-h-[780px] sm:rounded-[32px] sm:border-[3px] sm:border-primary sm:shadow-[6px_6px_0_var(--primary)]">
        <StatusBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
        {showTabs && <TabBar />}
      </div>
    </div>
  );
}

export function Placeholder({ label, className = "" }: { label: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-secondary font-display text-5xl font-black text-primary [background-image:radial-gradient(var(--card)_1.5px,transparent_1.5px)] [background-size:14px_14px] ${className}`}
    >
      {label}
    </div>
  );
}

export function SpotifyBar({ track, artist }: { track: string; artist: string }) {
  return (
    <div className="sticker flex items-center gap-3 !rounded-full px-3 py-2">
      <div className="size-9 shrink-0 rounded-lg border-2 border-primary bg-accent [background-image:linear-gradient(135deg,var(--secondary)_50%,transparent_50%)]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-extrabold">{track}</p>
        <p className="truncate text-[11px] text-muted-foreground">{artist}</p>
      </div>
      <div className="flex items-end gap-[3px]" aria-hidden>
        {[8, 14, 10, 16].map((h, i) => (
          <span key={i} className="w-1 animate-pulse rounded-full bg-primary" style={{ height: h, animationDelay: `${i * 150}ms` }} />
        ))}
      </div>
    </div>
  );
}
