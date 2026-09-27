import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify your UMN email — GopherHole" },
      { name: "description", content: "Enter the 6-digit code sent to your University of Minnesota email." },
      { property: "og:title", content: "Verify your UMN email — GopherHole" },
      { property: "og:description", content: "Enter the 6-digit code sent to your University of Minnesota email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Verify,
});

function Verify() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signError) {
      setError(signError.message + " If you just signed up, confirm the email link first.");
      return;
    }
    navigate({ to: "/onboarding" });
  }

  async function resend() {
    if (!email.trim()) {
      setError("Enter your UMN email first.");
      return;
    }
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email: email.trim() });
    if (resendError) setError(resendError.message);
    else setNotice("Confirmation email resent. Check your UMN inbox.");
  }

  return (
    <PhoneShell tabs={false}>
      <form onSubmit={submit} className="flex min-h-full flex-col px-6 pb-8 pt-6">
        <h1 className="text-2xl font-bold text-primary">Check your UMN inbox</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Confirm the email we sent{email ? ` to ${email}` : ""}, then sign in. Session survives refresh.
        </p>
        <label className="mt-6 block text-xs font-bold">UMN email</label>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="gopher001@umn.edu"
          className="mt-1 w-full rounded-2xl border-2 border-input bg-card px-3 py-3 text-sm outline-none focus:border-accent"
        />
        <label className="mt-4 block text-xs font-bold">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-2xl border-2 border-input bg-card px-3 py-3 text-sm outline-none focus:border-accent"
        />
        {error && <p className="mt-3 text-xs font-medium text-destructive">{error}</p>}
        {notice && <p className="mt-3 text-xs font-medium text-primary">{notice}</p>}
        <p className="mt-4 rounded-lg bg-secondary p-3 text-[11px] text-muted-foreground">
          Unverified accounts can’t swipe, message, or post a listing. That’s the whole point.
        </p>
        <button type="button" onClick={resend} className="mt-3 text-xs font-bold text-primary">
          Resend confirmation email
        </button>
        <button
          type="submit"
          disabled={busy}
          className="mt-auto sticker-btn rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </PhoneShell>
  );
}
