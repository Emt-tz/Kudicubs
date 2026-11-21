import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StateView } from "@/components/StateView";
import { getDemoState } from "@/lib/demo-state";
import { loadChild, nowMs, type Badge, type ChildBundle } from "../../../../_a/data";
import { refCode, relDayInline } from "../../../../_a/format";
import { ChildSkeleton, Chip, ErrorPanel, IconCheck, IconLock, IconMedal, PageHead, Seg } from "../../../../_a/ui";

export const metadata: Metadata = { title: "Badges" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

// What each badge means. The badges table has no description column, so the copy lives with the screen.
const EARNED_TEXT: Record<string, string> = {
  "badge.first_coins": "Found the first coins.",
  "badge.kind_friend": "Helped a friend at the market.",
  "badge.early_bird": "Played before breakfast.",
  "badge.hard_worker": "Finished a mission after trying hard.",
  "badge.smart_sorter": "Sorted every coin into the right jar.",
  "badge.smart_saver": "Saved coins in the jar three times.",
  "badge.market_explorer": "Visited every stall in the market.",
  "badge.pride_star": "Reached level 5 in the Pride.",
};
const LOCKED_TEXT: Record<string, string> = {
  "badge.first_coins": "Find the first coins in a mission.",
  "badge.kind_friend": "Help a friend at the market.",
  "badge.early_bird": "Play a mission before breakfast.",
  "badge.hard_worker": "Finish The Lost Coins for the first time.",
  "badge.smart_sorter": "Sort every coin into the right jar.",
  "badge.smart_saver": "Save coins in the jar three times.",
  "badge.market_explorer": "Visit every stall in the market.",
  "badge.pride_star": "Reach level 5 in the Pride.",
};

const FILTERS = ["all", "earned", "locked"] as const;
type Filter = (typeof FILTERS)[number];

// dp-13-badges: grid of earned and locked badges, from badges + child_badges.
export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const demo = getDemoState(sp);
  const show: Filter = FILTERS.find((f) => f === sp.show) ?? "all";
  let bundle: ChildBundle | null = null;
  let failed = demo === "error";
  try {
    bundle = await loadChild(id);
  } catch {
    failed = true;
  }
  if (!failed && bundle === null) notFound();
  if (demo === "loading") return <ChildSkeleton />;
  if (failed || !bundle) {
    return (
      <div className="da" data-screen="dp-13-badges">
        <PageHead title="Badges" sub="Badges this child has earned." />
        <ErrorPanel retryHref={`/dashboard/children/${id}/badges`} reference={refCode()} />
      </div>
    );
  }
  return (
    <StateView state={demo === "offline" ? "offline" : "normal"}>
      <Badges b={bundle} show={show} />
    </StateView>
  );
}

function Badges({ b, show }: { b: ChildBundle; show: Filter }) {
  const now = nowMs();
  const earnedAt = new Map(b.earned.map((e) => [e.badge_id, e.earned_at]));
  const all: Badge[] = [...b.badges].sort((x, y) => Number(earnedAt.has(y.id)) - Number(earnedAt.has(x.id)) || +new Date(earnedAt.get(y.id) ?? 0) - +new Date(earnedAt.get(x.id) ?? 0));
  const earnedCount = all.filter((x) => earnedAt.has(x.id)).length;
  const lockedCount = all.length - earnedCount;
  const list = all.filter((x) => (show === "all" ? true : show === "earned" ? earnedAt.has(x.id) : !earnedAt.has(x.id)));
  const base = `/dashboard/children/${b.child.id}/badges`;
  const href = (f: Filter) => (f === "all" ? base : `${base}?show=${f}`);

  return (
    <div className="da" data-screen="dp-13-badges">
      <PageHead
        title="Badges"
        sub={`${b.child.nickname} has earned ${earnedCount} of ${all.length} badges. Locked badges show how to earn them.`}
        actions={
          <Seg
            label="Show badges"
            items={[
              { label: `All ${all.length}`, href: href("all"), active: show === "all" },
              { label: `Earned ${earnedCount}`, href: href("earned"), active: show === "earned" },
              { label: `Locked ${lockedCount}`, href: href("locked"), active: show === "locked" },
            ]}
          />
        }
      />
      {list.length === 0 ? (
        <p className="da-note" role="status">
          {show === "earned" ? `${b.child.nickname} has not earned a badge yet. The first one is not far away.` : "Every badge is earned. Well done!"}
        </p>
      ) : (
        <div className="da-badges">
          {list.map((x) => {
            const when = earnedAt.get(x.id);
            return (
              <article key={x.id} className={`da-badge ${when ? "" : "locked"}`}>
                <div className={`da-medal ${when ? "" : "locked"}`}>{when ? <IconMedal /> : <IconLock />}</div>
                <strong>{x.title}</strong>
                {when ? (
                  <Chip tone="ok" flat>
                    <IconCheck />
                    Earned {relDayInline(when, now)}
                  </Chip>
                ) : (
                  <Chip flat>Locked</Chip>
                )}
                <p>{when ? (EARNED_TEXT[x.id] ?? "Earned in a mission.") : (LOCKED_TEXT[x.id] ?? "Keep playing missions to earn it.")}</p>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
