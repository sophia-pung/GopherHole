import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { PhoneShell, Placeholder } from "@/components/PhoneShell";
import { TALKING_POINTS } from "@/lib/data";
import { compatibility } from "@/lib/match";
import { useAuth } from "@/hooks/use-auth";
import { useFilters } from "@/lib/store";
import { buildAppState } from "@/lib/session-state";
import {
  deleteMatch,
  fetchMessages,
  fetchMyMatches,
  fetchProfilesByUserIds,
  otherUserId,
  profileToStudent,
  recordSwipe,
  sendMessage,
  type MessageRow,
} from "@/lib/api";
import type { Student } from "@/lib/data";

export const Route = createFileRoute("/messages/$id")({
  head: () => ({
    meta: [
      { title: "Conversation — GopherHole" },
      { name: "description", content: "Talk boundaries before you sign a lease: chores, groceries, and privacy." },
      { property: "og:title", content: "Conversation — GopherHole" },
      { property: "og:description", content: "Talk boundaries before you sign a lease: chores, groceries, and privacy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Thread,
});

function Thread() {
  const { id } = useParams({ from: "/messages/$id" });
  const { user, me } = useAuth();
  const filters = useFilters();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [notice, setNotice] = useState("");
  const [person, setPerson] = useState<Student | undefined>();
  const [msgs, setMsgs] = useState<MessageRow[]>([]);
  const [matchId, setMatchId] = useState(id);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const matches = await fetchMyMatches(user.id);
      const match = matches.find((m) => m.id === id) ?? matches.find((m) => otherUserId(m, user.id) === id);
      if (!match) return;
      const other = otherUserId(match, user.id);
      const [rows, messages] = await Promise.all([fetchProfilesByUserIds([other]), fetchMessages(match.id)]);
      if (cancelled) return;
      setMatchId(match.id);
      setPerson(rows[0] ? profileToStudent(rows[0]) : undefined);
      setMsgs(messages);
    })().catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  if (!person || !user) {
    return (
      <PhoneShell>
        <p className="px-6 py-10 text-center text-sm">That profile is gone.</p>
      </PhoneShell>
    );
  }

  const s = buildAppState(me, filters);
  const comp = compatibility(person, s);

  async function send(text: string) {
    if (!text.trim() || !user) return;
    const row = await sendMessage(matchId, user.id, text.trim());
    setMsgs((prev) => [...prev, row]);
    setDraft("");
  }

  async function unmatch() {
    await deleteMatch(matchId);
    navigate({ to: "/messages" });
  }

  async function block() {
    if (!user) return;
    await recordSwipe(user.id, person.id, "block");
    await deleteMatch(matchId);
    navigate({ to: "/messages" });
  }

  return (
    <PhoneShell>
      <div className="flex min-h-full flex-col px-5 pb-6">
        <div className="flex items-center gap-2 border-b border-border py-2">
          <Link to="/messages" aria-label="Back">
            <ChevronLeft className="size-5" />
          </Link>
          <Placeholder label={person.name.charAt(0)} className="size-8 rounded-full text-sm" />
          <div className="flex-1">
            <p className="text-xs font-bold">{person.name}</p>
            <p className="text-[10px] text-muted-foreground">{person.lastActive}</p>
          </div>
          <button onClick={unmatch} className="text-[10px] font-semibold text-muted-foreground">
            Unmatch
          </button>
          <button
            onClick={() => setNotice("Report submitted to GopherHole.")}
            className="text-[10px] font-semibold text-muted-foreground"
          >
            Report
          </button>
          <button onClick={block} className="text-[10px] font-semibold text-destructive">
            Block
          </button>
        </div>
        <p className="pt-2 text-[10px] italic text-muted-foreground">
          This is not a dating app, but if someone makes it weird, report them.
        </p>
        {notice && <p className="mt-2 rounded-lg bg-secondary p-2 text-[11px] font-semibold">{notice}</p>}

        <div className="mt-3 sticker p-3">
          <p className="text-[11px] font-bold text-primary">{comp.score}% compatible</p>
          {comp.reasons.map((r) => (
            <p key={r} className="text-[11px] text-muted-foreground">• {r}</p>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {TALKING_POINTS.map((t) => (
            <button
              key={t}
              onClick={() => send(t)}
              className="block w-full rounded-2xl bg-accent/30 p-2 text-left text-[11px] font-medium"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 flex-1 space-y-2">
          {msgs.map((m) => (
            <div
              key={m.id}
              className={
                m.sender_id === user.id
                  ? "ml-auto max-w-[75%] rounded-xl rounded-br-sm bg-primary px-3 py-2 text-xs text-primary-foreground"
                  : "mr-auto max-w-[75%] rounded-xl rounded-bl-sm bg-secondary px-3 py-2 text-xs"
              }
            >
              {m.body}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Say something useful"
            className="flex-1 rounded-full border-2 border-input px-4 py-3 text-sm outline-none focus:border-accent"
          />
          <button className="rounded-full bg-primary px-5 text-xs font-bold text-primary-foreground">Send</button>
        </form>
      </div>
    </PhoneShell>
  );
}
