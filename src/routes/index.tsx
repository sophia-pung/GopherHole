import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GopherHole — UMN roommate matching" },
      {
        name: "description",
        content:
          "Find a verified University of Minnesota roommate, subleaser, or open room without Facebook Marketplace or a Snapchat story.",
      },
      { property: "og:title", content: "GopherHole — UMN roommate matching" },
      {
        property: "og:description",
        content: "Hinge-style roommate matching for UMN students: dorms, off-campus, and subleases.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const tiles = [
  { title: "Dorms", copy: "Superblock, Territorial, and whoever is on your floor." },
  { title: "Off-campus", copy: "Dinkytown, Stadium Village, Como, Prospect Park." },
  { title: "Subleases", copy: "Take over a lease before someone else does." },
];

function Landing() {
  return (
    <PhoneShell tabs={false}>
      <div className="flex min-h-full flex-col px-6 pb-8 pt-6">
        <h1 className="text-4xl font-bold tracking-tight text-primary">GopherHole</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Find a UMN roommate without Facebook Marketplace, class-of-2030 Instagram pages, or a Snapchat story that
          leaves you eating ramen in the shower.
        </p>

        <div className="mt-6 space-y-3">
          {tiles.map((t) => (
            <div key={t.title} className="rounded-xl border-2 border-accent bg-secondary p-4">
              <p className="text-base font-bold text-primary">{t.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-8">
          <Link
            to="/signup"
            className="block sticker-btn rounded-full bg-primary py-4 text-center text-sm font-bold text-primary-foreground"
          >
            Continue with UMN email
          </Link>
          <p className="mt-4 text-center text-[11px] italic text-muted-foreground">
            “Short term open to long. Long term open to short. Hide-under-the-bed open to nobody.”
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}
