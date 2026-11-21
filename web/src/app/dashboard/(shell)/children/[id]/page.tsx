import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StateView } from "@/components/StateView";
import { getDemoState } from "@/lib/demo-state";
import { BarChart, niceMax, Sparkline } from "../../../_a/charts";
import { attemptTime, loadChild, nowMs, type ChildBundle, type WalletEvent } from "../../../_a/data";
import { CsvDownload, PlayReminder } from "../../../_a/Downloads";
import {
  BAND_LABEL, COUNTRY, DAY, dayDiff, levelFor, money, plural, refCode, relDay, relDayInline, shortDay, startOfDay,
} from "../../../_a/format";
import { PILLARS, pillarIncrements, scoreAt } from "../../../_a/skills";
import { BarRow, ChildDot, Chip, ChildSkeleton, EmptyPanel, ErrorPanel, IconCheck, IconMedal, Kpi, PageHead, Panel } from "../../../_a/ui";

export const metadata: Metadata = { title: "Child" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const sign = (k: WalletEvent["kind"]) => (k === "spend" || k === "save" ? -1 : 1);

/** Running balance at the end of each of the last `n` days. `pick` decides how an event moves the line. */
function dailySeries(events: WalletEvent[], n: number, now: number, pick: (e: WalletEvent) => number): number[] {
  const asc = [...events].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
  const today0 = startOfDay(now);
  return Array.from({ length: n }, (_, i) => {
    const end = today0 - (n - 1 - i) * DAY + DAY;
    return asc.filter((e) => +new Date(e.created_at) < end).reduce((s, e) => s + pick(e), 0);
  });
}

function eventText(e: WalletEvent): string {
  const n = `${e.amount} coins`;
  switch (e.kind) {
    case "earn": return `Earned ${n}`;
    case "bonus": return `Bonus of ${n}`;
    case "daily": return `Daily bonus of ${n}`;
    case "spend": return `Spent ${n}`;
    case "save": return `Saved ${n} in the jar`;
    default: return `${e.amount} XP`;
  }
}

// dash-02-child and dp-10-child-no-play (the child has not played yet, or ?state=empty).
export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const demo = getDemoState(await searchParams);
  let bundle: ChildBundle | null = null;
  let failed = demo === "error";
  try {
    bundle = await loadChild(id);
  } catch {
    failed = true;
  }
  if (!failed && bundle === null) notFound(); // unknown id, or another family's child (RLS hides it)
  if (demo === "loading") return <ChildSkeleton />;
  if (failed || !bundle) {
    return (
      <div className="da" data-screen="dash-02-child">
        <PageHead title="Child" sub="Progress for this child." />
        <ErrorPanel retryHref={`/dashboard/children/${id}`} reference={refCode()} />
      </div>
    );
  }
  const noPlay = demo === "empty" || bundle.attempts.length === 0;
  return (
    <StateView state={demo === "offline" ? "offline" : "normal"}>{noPlay ? <NoPlay b={bundle} /> : <Overview b={bundle} />}</StateView>
  );
}

function Top({ b, sub, actions }: { b: ChildBundle; sub: string; actions?: React.ReactNode }) {
  const c = b.child;
  return (
    <PageHead
      title={c.nickname}
      lead={<ChildDot name={c.nickname} size="lg" />}
      sub={sub}
      actions={
        <>
          <Link href={`/dashboard/children/${c.id}/settings`} className="btn btn-sm">
            Child settings
          </Link>
          {actions}
        </>
      }
    />
  );
}

function NoPlay({ b }: { b: ChildBundle }) {
  const c = b.child;
  const now = nowMs();
  const joined = dayDiff(now, new Date(c.created_at));
  const lvl = levelFor(b.balance.xp);
  return (
    <div className="da" data-screen="dp-10-child-no-play">
      <Top b={b} sub={`Ages ${BAND_LABEL[c.age_band]} · ${COUNTRY[c.region]} · ${joined <= 0 ? "Joined today" : `Joined ${plural(joined, "day")} ago`}`} />
      <div className="da-kpis">
        <Kpi label="Wallet" value={money(c.region, b.balance.coins)} />
        <Kpi label="Saved in the jar" value={money(c.region, b.balance.saved)} />
        <Kpi label="Level" value={lvl.level} unit={lvl.name} />
        <Kpi label="Badges" value={b.earned.length} unit={`of ${b.badges.length}`} />
      </div>
      <EmptyPanel
        image="/brand/kudi-wave.webp"
        alt="Kudi the Cub waving"
        title={`${c.nickname} has not played yet`}
        body={`Once ${c.nickname} finishes a first mission, you will see skills, activity and badges here. A short first mission takes about five minutes.`}
      >
        <PlayReminder nickname={c.nickname} />
      </EmptyPanel>
    </div>
  );
}

function Overview({ b }: { b: ChildBundle }) {
  const now = nowMs();
  const today0 = startOfDay(now);
  const c = b.child;
  const lvl = levelFor(b.balance.xp);
  const byMission = new Map(b.missions.map((m) => [m.id, m]));
  const badgeById = new Map(b.badges.map((x) => [x.id, x]));

  const coinsSeries = dailySeries(b.wallet, 14, now, (e) => (e.kind === "xp" ? 0 : sign(e.kind) * e.amount));
  const savedSeries = dailySeries(b.wallet, 14, now, (e) => (e.kind === "save" ? e.amount : 0));
  const lastSave = b.wallet.find((e) => e.kind === "save");

  const days = Array.from({ length: 7 }, (_, i) => today0 - (6 - i) * DAY);
  const perDay = days.map((d) => b.attempts.filter((a) => startOfDay(attemptTime(a)) === d).length);
  const total = perDay.reduce((s, n) => s + n, 0);
  const labels = days.map((d, i) => (i === 6 ? "Today" : shortDay(d)));

  const scores = scoreAt(pillarIncrements(b.attempts, b.missions, b.badges, b.earned));
  const top = [...scores].sort((x, y) => y.pct - x.pct)[0];

  const earnedSorted = [...b.earned].sort((x, y) => +new Date(y.earned_at) - +new Date(x.earned_at));
  const latest = earnedSorted[0];
  const recent = b.attempts.slice(0, 3);

  const detail = (a: ChildBundle["attempts"][number]) => {
    const day = startOfDay(attemptTime(a));
    const ev = [...b.wallet].reverse().find((e) => e.kind !== "xp" && startOfDay(+new Date(e.created_at)) === day);
    return ev ? eventText(ev) : (byMission.get(a.mission_id)?.world ?? "Mission");
  };

  const reportRows: (string | number)[][] = [
    ["KudiCubs report", c.nickname],
    ["Age band", BAND_LABEL[c.age_band]],
    ["Country", COUNTRY[c.region]],
    ["Level", `${lvl.level} ${lvl.name}`],
    ["Wallet", b.balance.coins],
    ["Saved", b.balance.saved],
    ["XP", b.balance.xp],
    ["Badges earned", b.earned.length],
    [],
    ...scores.map((s) => [`Skill: ${s.pillar}`, `${s.pct}%`]),
    [],
    ["Date", "Mission", "Outcome"],
    ...b.attempts.map((a) => [new Date(attemptTime(a)).toISOString().slice(0, 10), byMission.get(a.mission_id)?.title ?? a.mission_id, a.outcome]),
  ];

  return (
    <div className="da" data-screen="dash-02-child">
      <Top
        b={b}
        sub={`Ages ${BAND_LABEL[c.age_band]} · ${COUNTRY[c.region]} · Level ${lvl.level}, ${lvl.name}`}
        actions={<CsvDownload filename={`kudicubs-${c.nickname.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.csv`} rows={reportRows} label="Download report" />}
      />
      <div className="da-kpis">
        <Kpi label="Wallet" value={money(c.region, b.balance.coins)} spark={<Sparkline values={coinsSeries} />} note={`${b.balance.coins.toLocaleString("en-GB")} coins`} />
        <Kpi
          label="Saved in the jar"
          value={money(c.region, b.balance.saved)}
          spark={<Sparkline values={savedSeries} />}
          note={lastSave ? `Saved ${relDayInline(lastSave.created_at, now)}` : "Nothing saved yet"}
        />
        <Kpi
          label="Level"
          value={lvl.level}
          unit="of 5"
          bar={lvl.pct}
          note={lvl.next ? `${b.balance.xp} of ${lvl.next.from} XP to ${lvl.next.name}` : `${b.balance.xp} XP, top level`}
        />
        <Kpi
          label="Badges"
          value={b.earned.length}
          unit={`of ${b.badges.length}`}
          chip={
            latest ? (
              <Chip tone="ok">
                <IconCheck />
                {badgeById.get(latest.badge_id)?.title ?? "Badge"} {relDayInline(latest.earned_at, now)}
              </Chip>
            ) : undefined
          }
        />
      </div>

      <div className="da-split even">
        <Panel
          title="Skills growing"
          sub={top && top.pct > 0 ? `Strongest skill: ${top.pillar}` : "No skills yet"}
          aside={<Link href={`/dashboard/children/${c.id}/skills`} className="da-note">See trend</Link>}
        >
          <div className="da-skill compact">
            {PILLARS.map((p) => (
              <BarRow key={p} label={p} pct={scores.find((s) => s.pillar === p)?.pct ?? 0} />
            ))}
          </div>
        </Panel>
        <Panel title="Last 7 days" sub={`Missions played per day · ${total} in total`}>
          <BarChart
            values={perDay}
            labels={labels}
            yMax={niceMax(Math.max(...perDay), 3)}
            w={560}
            ariaLabel={`Bar chart of missions played per day: ${perDay.map((n, i) => `${labels[i]} ${n}`).join(", ")}.`}
          />
        </Panel>
      </div>

      <div className="da-split even">
        <Panel title="Recent play" aside={<Link href={`/dashboard/children/${c.id}/activity`} className="da-note">All activity</Link>}>
          <ul className="da-list">
            {recent.map((a) => (
              <li key={a.id}>
                <div>
                  <strong>{byMission.get(a.mission_id)?.title ?? "Mission"}</strong>
                  <div className="sub">{detail(a)}</div>
                </div>
                <span className="when">{relDay(new Date(attemptTime(a)).toISOString(), now)}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Badges earned" aside={<Link href={`/dashboard/children/${c.id}/badges`} className="da-note">All badges</Link>}>
          {earnedSorted.length === 0 ? (
            <p className="da-note">No badges yet. They appear here as {c.nickname} earns them.</p>
          ) : (
            <ul className="da-list">
              {earnedSorted.slice(0, 3).map((e) => (
                <li key={e.badge_id} style={{ alignItems: "center" }}>
                  <span className="da-medal sm"><IconMedal size={20} /></span>
                  <div>
                    <strong>{badgeById.get(e.badge_id)?.title ?? "Badge"}</strong>
                    <div className="sub">{relDay(e.earned_at, now)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
