import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { PhoneShell, Placeholder } from "@/components/PhoneShell";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchMessages,
  fetchMyMatches,
  fetchMySwipes,
  fetchProfilesByUserIds,
  otherUserId,
  profileToStudent,
  type MatchRow,
  type MessageRow,
} from "@/lib/api";
import type { Student } from "@/lib/data";

export const Route = createFileRoute("/messages/")({
  head: () => ({
    meta: [
      { title: "Messages — GopherHole" },
      { name: "description", content: "Your roommate conversations, sorted by whose turn it is." },
      { property: "og:title", content: "Messages — GopherHole" },
      { property: "og:description", content: "Your roommate conversations, sorted by whose turn it is." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Messages,
});

interface ThreadPreview {
  matchId: string;
  person: Student;
  last?: MessageRow;
}

function Section({
  title,
  items,
  gold,
  open,
  toggle,
}: {
  title: string;
  items: ThreadPreview[];
  gold: boolean;
  open: boolean;
  toggle: () => void;
}) {
  return (
    <>
      <button onClick={toggle} className="mt-5 flex w-full items-center justify-between">
        <span className="text-xs font-bold">
          {title} ({items.length})
        </span>
        {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
      </button>
      {open &&
        items.map((item) => (
          <Link
            key={item.matchId}
            to="/messages/$id"
            params={{ id: item.matchId }}
            className="flex items-center gap-3 border-t border-border py-3"
          >
            <Placeholder
              label={item.person.name.charAt(0)}
              className={
                gold
                  ? "size-11 shrink-0 rounded-full border-2 border-accent text-base"
                  : "size-11 shrink-0 rounded-full text-base"
              }
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs">{item.person.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{item.last?.body ?? "Say something."}</p>
            </div>
            <span className="text-[9px] text-muted-foreground">{item.person.lastActive.replace("Active ", "")}</span>
          </Link>
        ))}
    </>
  );
}

function Messages() {
  const { user } = useAuth();
  const [openA, setOpenA] = useState(true);
  const [openB, setOpenB] = useState(true);
  const [openC, setOpenC] = useState(false);
  const [threads, setThreads] = useState<ThreadPreview[]>([]);
  const [blocked, setBlocked] = useState<Student[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [matches, swipes] = await Promise.all([fetchMyMatches(user.id), fetchMySwipes(user.id)]);
      const blockedIds = swipes.filter((s) => s.direction === "block").map((s) => s.swipee_id);
      const blockedRows = await fetchProfilesByUserIds(blockedIds);
      const previews: ThreadPreview[] = [];
      for (const m of matches as MatchRow[]) {
        const other = otherUserId(m, user.id);
        const [profileRows, msgs] = await Promise.all([fetchProfilesByUserIds([other]), fetchMessages(m.id)]);
        const person = profileRows[0] ? profileToStudent(profileRows[0]) : undefined;
        if (!person) continue;
        previews.push({ matchId: m.id, person, last: msgs[msgs.length - 1] });
      }
      if (cancelled) return;
      setThreads(previews);
      setBlocked(blockedRows.map(profileToStudent));
    })().catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, [user]);

  const yourTurn = threads.filter((t) => !t.last || t.last.sender_id !== user?.id);
  const theirTurn = threads.filter((t) => t.last && t.last.sender_id === user?.id);

  return (
    <PhoneShell>
      <div className="px-6 pb-8">
        <h1 className="pt-4 text-lg font-bold">Messages</h1>
        {threads.length === 0 && (
          <p className="mt-12 text-center text-sm font-semibold text-muted-foreground">
            No conversations yet. Go match with someone who answers the group chat.
          </p>
        )}
        {yourTurn.length > 0 && (
          <Section title="Your turn" items={yourTurn} gold open={openA} toggle={() => setOpenA(!openA)} />
        )}
        {theirTurn.length > 0 && (
          <Section title="Their turn" items={theirTurn} gold={false} open={openB} toggle={() => setOpenB(!openB)} />
        )}
        <Section
          title="Hidden"
          items={blocked.map((person) => ({ matchId: person.id, person }))}
          gold={false}
          open={openC}
          toggle={() => setOpenC(!openC)}
        />
      </div>
    </PhoneShell>
  );
}
