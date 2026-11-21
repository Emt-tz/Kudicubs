import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { StateView } from "@/components/StateView";
import { getDemoState, type DemoState } from "@/lib/demo-state";
import { BarChart, niceMax, Sparkline } from "../_a/charts";
import { attemptTime, loadFamily, nowMs, type FamilyData } from "../_a/data";
import {
  BAND_LABEL, BAND_ORDER, COUNTRY, DAY, avatarColour, dayDiff, joinNames, levelFor, money, plural, refCode, relDay, shortDay, startOfDay,
} from "../_a/format";
import { ChildDot, Chip, ErrorPanel, EmptyPanel, IconCheck, IconClock, IconDown, IconFlat, IconInfo, IconUp, Kpi, OverviewSkeleton, PageHead, Panel } from "../_a/ui";

export const metadata: Metadata = { title: "Overview" };

// dash-01-overview. States: dp-07-overview-loading (loading.tsx / Suspense, ?state=loading),
// dp-08-overview-empty (no children, ?state=empty), dp-09-overview-error (a query failed, ?state=error).
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const demo = getDemoState(await searchParams);
  if (demo === "loading") return <OverviewSkeleton />;
  return (
    <Suspense fallback={<OverviewSkeleton />}>
      <Overview demo={demo} />
    </Suspense>
  );
}

async function Overview({ demo }: { demo: DemoState }) {
  let data: FamilyData | null = null;
  let failed = demo === "error";
  if (!failed) {
    try {
      data = await loadFamily();
    } catch {
      failed = true;
    }
  }
  if (failed || !data) {
    return (
      <div className="da" data-screen="dp-09-overview-error">
        <PageHead title="Your family" sub="Progress for all your children." />
        <ErrorPanel retryHref="/dashboard" reference={refCode()} />
      </div>
    );
  }
  if (demo === "empty" || data.children.length === 0) return <NewFamily />;
  return (
    <StateView state={demo === "offline" ? "offline" : "normal"}>
      <Family data={data} />
    </StateView>
  );
}

function NewFamily() {
  return (
    <div className="da" data-screen="dp-08-overview-empty">
      <PageHead title="Welcome to KudiCubs" sub="Your family is set up. Children and their progress will appear here." />
      <EmptyPanel
        image="/brand/kudi-thumbs-up.webp"
        alt="Kudi the Cub giving a thumbs up"
        title="No children yet"
        body="Add your first child in the KudiCubs app. Pick their age band, an avatar and a nickname, and their progress will show up here after their first mission."
      >
        <Link href="/get-the-app" className="btn btn-sm btn-secondary">
          Add your first child in the app
        </Link>
        <Link href="/how-it-works" className="btn btn-sm">
          How it works
        </Link>
      </EmptyPanel>
      <div className="da-steps">
        {[
          ["1. Open the app", 'Install KudiCubs on a phone or tablet and choose "Join the Pride".'],
          ["2. Set up a child", "Choose an age band and a nickname from the list. No real names."],
          ["3. Come back here", "See skills growing, missions played and badges earned."],
        ].map(([t, b]) => (
          <div key={t} className="da-panel da-panel-pad da-step">
            <strong>{t}</strong>
            <p>{b}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Family({ data }: { data: FamilyData }) {
  const now = nowMs();
  const today0 = startOfDay(now);
  const { children, balances, attempts, earned, missions } = data;
  const missionTitle = new Map(missions.map((m) => [m.id, m]));
  const nameOf = new Map(children.map((c) => [c.id, c.nickname]));

  // last 7 days, oldest first; the final slot is today
  const days = Array.from({ length: 7 }, (_, i) => today0 - (6 - i) * DAY);
  const perDay = days.map((d) => attempts.filter((a) => startOfDay(attemptTime(a)) === d).length);
  const weekCount = perDay.reduce((s, n) => s + n, 0);
  const prevWeek = attempts.filter((a) => {
    const t = attemptTime(a);
    return t >= today0 - 13 * DAY && t < today0 - 6 * DAY;
  }).length;
  const playersOn = (d: number) => new Set(attempts.filter((a) => startOfDay(attemptTime(a)) === d).map((a) => a.child_id)).size;
  const playedPerDay = days.map(playersOn);
  const playedToday = playedPerDay[6];
  const playedYesterday = playedPerDay[5];

  const earnedByDay = days.map((d) => earned.filter((b) => +new Date(b.earned_at) < d + DAY).length);
  const newBadges = earned.filter((b) => +new Date(b.earned_at) >= days[0]).length;
  const childrenByDay = days.map((d) => children.filter((c) => +new Date(c.created_at) < d + DAY).length);

  const bands = BAND_ORDER.filter((b) => children.some((c) => c.age_band === b));
  const bandChip = bands.length === 1 ? `Band ${BAND_LABEL[bands[0]]}` : `Bands ${BAND_LABEL[bands[0]]} to ${BAND_LABEL[bands[bands.length - 1]]}`;

  const lastPlayed = new Map<string, number>();
  for (const a of attempts) lastPlayed.set(a.child_id, Math.max(lastPlayed.get(a.child_id) ?? 0, attemptTime(a)));
  const quiet = children
    .map((c) => ({ c, n: lastPlayed.has(c.id) ? dayDiff(now, lastPlayed.get(c.id)!) : null }))
    .filter((q): q is { c: (typeof children)[number]; n: number } => q.n !== null && q.n >= 2);
  const quietMin = quiet.length ? Math.min(...quiet.map((q) => q.n)) : 0;
  const quietSame = quiet.every((q) => q.n === quietMin);

  const delta = (now_: number, before: number, unit: string, flatText: string) =>
    now_ === before ? (
      <Chip><IconFlat />{flatText}</Chip>
    ) : (
      <Chip tone={now_ > before ? "ok" : "soft"}>
        {now_ > before ? <IconUp /> : <IconDown />}
        {Math.abs(now_ - before)} {now_ > before ? "more" : "fewer"} than {unit}
      </Chip>
    );

  const recent = attempts.slice(0, 5);
  const chartLabels = days.map((d, i) => (i === 6 ? "Today" : shortDay(d)));

  return (
    <div className="da" data-screen="dash-01-overview">
      <PageHead
        title="Your family"
        sub={`Progress for ${children.length === 1 ? "your child" : `all ${children.length === 4 ? "four" : children.length} children`}. Money is shown in each child's own currency.`}
        actions={
          <Link href="/get-the-app" className="btn btn-sm">
            Add a child in the app
          </Link>
        }
      />
      {quiet.length ? (
        <div className="banner banner-info" role="status">
          <IconInfo size={20} />
          <div>
            <strong>
              {joinNames(quiet.map((q) => q.c.nickname))} {quiet.length === 1 ? "has" : "have"} been quiet for {quietSame ? `${quietMin} days` : `${quietMin} days or more`}.
            </strong>{" "}
            A short mission together can help {quiet.length === 1 ? "them" : "them"} get back into it.
          </div>
        </div>
      ) : null}
      <div className="da-kpis">
        <Kpi label="Children" value={children.length} spark={<Sparkline values={childrenByDay} />} chip={<Chip>{bandChip}</Chip>} />
        <Kpi label="Missions this week" value={weekCount} spark={<Sparkline values={perDay} />} chip={delta(weekCount, prevWeek, "last week", "Same as last week")} />
        <Kpi
          label="Badges earned"
          value={earned.length}
          spark={<Sparkline values={earnedByDay} />}
          chip={
            newBadges > 0 ? (
              <Chip tone="ok"><IconUp />{newBadges} new this week</Chip>
            ) : (
              <Chip><IconFlat />None new this week</Chip>
            )
          }
        />
        <Kpi
          label="Played today"
          value={`${playedToday} of ${children.length}`}
          spark={<Sparkline values={playedPerDay} />}
          chip={playedToday === playedYesterday ? <Chip><IconFlat />Same as yesterday</Chip> : delta(playedToday, playedYesterday, "yesterday", "Same as yesterday")}
        />
      </div>

      <Panel title="All children" aside={<span className="muted" style={{ fontSize: 13 }}>{plural(children.length, "child", "children")}</span>} pad={false}>
        <div className="da-scroll">
          <table className="da-table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th scope="col">Child</th>
                <th scope="col">Age band</th>
                <th scope="col">Country</th>
                <th scope="col">Level</th>
                <th scope="col">Wallet</th>
                <th scope="col">Saved</th>
                <th scope="col">Last played</th>
                <th scope="col"><span className="sr-only">Open</span></th>
              </tr>
            </thead>
            <tbody>
              {children.map((c) => {
                const bal = balances.get(c.id) ?? { coins: 0, saved: 0, xp: 0 };
                const lvl = levelFor(bal.xp);
                const last = lastPlayed.get(c.id);
                const recentPlay = last !== undefined && dayDiff(now, last) <= 1;
                return (
                  <tr key={c.id}>
                    <td>
                      <span className="da-who">
                        <ChildDot name={c.nickname} />
                        {c.nickname}
                      </span>
                    </td>
                    <td>{BAND_LABEL[c.age_band]}</td>
                    <td>{COUNTRY[c.region]}</td>
                    <td>{lvl.level} · {lvl.name}</td>
                    <td style={{ fontWeight: 800 }}>{money(c.region, bal.coins)}</td>
                    <td>{money(c.region, bal.saved)}</td>
                    <td>
                      {last === undefined ? (
                        <Chip flat><IconClock />Not yet</Chip>
                      ) : (
                        <Chip tone={recentPlay ? "ok" : "soft"} flat>
                          {recentPlay ? <IconCheck /> : <IconClock />}
                          {relDay(new Date(last).toISOString(), now)}
                        </Chip>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/dashboard/children/${c.id}`} className="btn btn-sm" aria-label={`Open ${c.nickname}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="da-split">
        <Panel
          title="Missions played this week"
          sub={`All children together · ${plural(weekCount, "mission")}`}
        >
          <BarChart
            values={perDay}
            labels={chartLabels}
            yMax={niceMax(Math.max(...perDay), 3)}
            w={560}
            ariaLabel={`Bar chart of missions played per day this week: ${perDay.map((n, i) => `${chartLabels[i]} ${n}`).join(", ")}.`}
          />
        </Panel>
        <Panel title="Recent play">
          {recent.length === 0 ? (
            <p className="da-note">Nothing played yet. Recent missions will show up here.</p>
          ) : (
            <ul className="da-list">
              {recent.map((a) => {
                const who = nameOf.get(a.child_id) ?? "";
                const m = missionTitle.get(a.mission_id);
                const verb = a.outcome === "retry" ? "tried" : a.outcome === "left" ? "paused" : "finished";
                return (
                  <li key={a.id}>
                    <span style={{ background: avatarColour(who) }} className={`da-dot ${avatarColour(who) === "#FCE6C6" ? "is-light" : ""}`} aria-hidden="true" />
                    <div>
                      <strong>{who}</strong> {verb} {m?.title ?? "a mission"}
                      <div className="sub">
                        {m?.world ?? "Mission"} · {relDay(new Date(attemptTime(a)).toISOString(), now)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
