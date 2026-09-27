import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up with your UMN email — GopherHole" },
      { name: "description", content: "UMN students only. Verify your @umn.edu email to start matching." },
      { property: "og:title", content: "Sign up with your UMN email — GopherHole" },
      { property: "og:description", content: "UMN students only. Verify your @umn.edu email to start matching." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Signup,
});

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/@umn\.edu$/i.test(email.trim())) {
      setError("UMN email only. Gmail is how Fieldhouse horror stories start.");
      return;
    }
    if (password.length < 6) {
      setError("Password needs at least 6 characters.");
      return;
    }
    setBusy(true);
    setError("");
    const { data, error: signError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/onboarding" });
      return;
    }
    navigate({ to: "/verify" });
  }

  return (
    <PhoneShell tabs={false}>
      <form onSubmit={submit} className="flex min-h-full flex-col px-6 pb-8 pt-6">
        <h1 className="text-2xl font-bold text-primary">Create your account</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          UMN email only. Gmail is how Fieldhouse horror stories start.
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

        <button
          type="submit"
          disabled={busy}
          className="mt-auto sticker-btn rounded-full bg-primary py-4 text-sm font-bold text-primary-foreground disabled:opacity-40"
        >
          {busy ? "Sending…" : "Send verification email"}
        </button>
      </form>
    </PhoneShell>
  );
}
