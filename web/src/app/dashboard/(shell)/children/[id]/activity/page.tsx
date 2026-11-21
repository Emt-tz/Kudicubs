import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StateView } from "@/components/StateView";
import { getDemoState } from "@/lib/demo-state";
import { BarChart, niceMax } from "../../../../_a/charts";
import { attemptTime, loadChild, nowMs, type Attempt, type ChildBundle, type WalletEvent } from "../../../../_a/data";
import { CsvDownload } from "../../../../_a/Downloads";
import { BAND_LABEL, DAY, dayMonth, humaniseLabel, money, plural, refCode, shortDay, startOfDay, tableDay } from "../../../../_a/format";
import { ChildSkeleton, Chip, ErrorPanel, IconCheck, IconClock, PageHead, Panel, Seg } from "../../../../_a/ui";

export const metadata: Metadata = { title: "Activity" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const RANGES = { "7d": { days: 7, label: "7 days" }, "30d": { days: 30, label: "30 days" } } as const;
const SHOWS = ["all", "finished", "retry"] as const;
type RangeKey = keyof typeof RANGES;
type Show = (typeof SHOWS)[number];

const minutesOf = (a: Attempt): number | null => (a.finished_at ? Math.max(0, Math.round((+new Date(a.finished_at) - +new Date(a.started_at)) / 60_000)) : null);
const isFinished = (a: Attempt) => a.outcome === "success" || a.outcome === "gentle";

const KIND_TEXT: Record<WalletEvent["kind"], string> = { earn: "Earned", bonus: "Bonus", daily: "Daily bonus", spend: "Spent", save: "Saved", xp: "XP" };

// dp-12-activity: minutes per day, recent sessions (mission_attempts) and coin movements (wallet_events), with filters in the URL.
export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const demo = getDemoState(sp);
  const range: RangeKey = sp.range === "30d" ? "30d" : "7d";
  const show: Show = SHOWS.find((s) => s === sp.show) ?? "all";
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
      <div className="da" data-screen="dp-12-activity">
        <PageHead title="Activity" sub="Missions played and time spent." />
        <ErrorPanel retryHref={`/dashboard/children/${id}/activity`} reference={refCode()} />
      </div>
    );
  }
  return (
    <StateView state={demo === "offline" ? "offline" : "normal"}>
      <Activity b={bundle} range={range} show={show} />
    </StateView>
  );
}

function Activity({ b, range, show }: { b: ChildBundle; range: RangeKey; show: Show }) {
  const now = nowMs();
  const today0 = startOfDay(now);
  const n = RANGES[range].days;
  const from = today0 - (n - 1) * DAY;
  const c = b.child;
  const missions = new Map(b.missions.map((m) => [m.id, m]));

  const inRange = b.attempts.filter((a) => attemptTime(a) >= from);
  const rows = inRange.filter((a) => (show === "all" ? true : show === "finished" ? isFinished(a) : a.outcome === "retry"));
  const days = Array.from({ length: n }, (_, i) => from + i * DAY);
  const minutes = days.map((d) => inRange.filter((a) => startOfDay(attemptTime(a)) === d).reduce((s, a) => s + (minutesOf(a) ?? 0), 0));
  const totalMin = minutes.reduce((s, v) => s + v, 0);
  const labels = days.map((d, i) => (n <= 7 ? (i === n - 1 ? "Today" : shortDay(d)) : dayMonth(d)));

  // coins earned by an attempt: events linked to it, else the day's events when that was the child's only play that day
  const dayCount = new Map<number, number>();
  for (const a of b.attempts) dayCount.set(startOfDay(attemptTime(a)), (dayCount.get(startOfDay(attemptTime(a))) ?? 0) + 1);
  const gains = (e: WalletEvent) => e.kind === "earn" || e.kind === "bonus" || e.kind === "daily";
  const earnedBy = (a: Attempt): number | null => {
    const linked = b.wallet.filter((e) => e.attempt_id === a.id && gains(e));
    if (linked.length) return linked.reduce((s, e) => s + e.amount, 0);
    const day = startOfDay(attemptTime(a));
    if (dayCount.get(day) !== 1) return null;
    const same = b.wallet.filter((e) => gains(e) && startOfDay(+new Date(e.created_at)) === day);
    return same.length ? same.reduce((s, e) => s + e.amount, 0) : null;
  };

  const coinRows = b.wallet.filter((e) => +new Date(e.created_at) >= from);
  const href = (r: RangeKey, s: Show) => {
    const q = new URLSearchParams();
    if (r !== "7d") q.set("range", r);
    if (s !== "all") q.set("show", s);
    const qs = q.toString();
    return `/dashboard/children/${c.id}/activity${qs ? `?${qs}` : ""}`;
  };

  const csv: (string | number)[][] = [
    ["Date", "Mission", "Minutes", "Outcome", "Coins earned"],
    ...rows.map((a) => [new Date(attemptTime(a)).toISOString().slice(0, 16).replace("T", " "), missions.get(a.mission_id)?.title ?? a.mission_id, minutesOf(a) ?? "", a.outcome, earnedBy(a) ?? ""]),
  ];

  return (
    <div className="da" data-screen="dp-12-activity">
      <PageHead
        title="Activity"
        sub={`${c.nickname} · Ages ${BAND_LABEL[c.age_band]} · Missions played and time spent`}
        actions={
          <>
            <Seg
              label="Time range"
              items={(Object.keys(RANGES) as RangeKey[]).map((k) => ({ label: RANGES[k].label, href: href(k, show), active: range === k }))}
            />
            <CsvDownload filename={`kudicubs-${c.nickname.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-activity-${range}.csv`} rows={csv} label="Export CSV" />
          </>
        }
      />
      <Panel
        title="Minutes played per day"
        sub={`Last ${n} days · ${plural(totalMin, "minute")} in total · average ${Math.round(totalMin / n)} ${Math.round(totalMin / n) === 1 ? "minute" : "minutes"} a day`}
      >
        <BarChart
          values={minutes}
          labels={labels}
          yMax={niceMax(Math.max(...minutes))}
          ariaLabel={`Bar chart of minutes played per day over the last ${n} days. ${plural(totalMin, "minute")} in total.`}
        />
        <div className="da-legend">
          <span><i className="da-swatch" style={{ background: "#F68C1F" }} />Earlier days</span>
          <span><i className="da-swatch" style={{ background: "#3E2312" }} />Most recent day</span>
        </div>
      </Panel>

      <Panel
        title="Recent sessions"
        pad={false}
        aside={
          <Seg
            label="Show sessions"
            items={[
              { label: "All", href: href(range, "all"), active: show === "all" },
              { label: "Finished", href: href(range, "finished"), active: show === "finished" },
              { label: "Tried again", href: href(range, "retry"), active: show === "retry" },
            ]}
          />
        }
      >
        {rows.length === 0 ? (
          <p className="da-note" style={{ padding: "0 20px 20px" }} role="status">
            No sessions {show === "all" ? "in this time range" : "match this filter"}. Try a longer range{show === "all" ? "" : " or show all sessions"}.
          </p>
        ) : (
          <div className="da-scroll">
            <table className="da-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Mission</th>
                  <th scope="col">Minutes</th>
                  <th scope="col">Outcome</th>
                  <th scope="col">Earned</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const mins = minutesOf(a);
                  const earned = earnedBy(a);
                  return (
                    <tr key={a.id}>
                      <td>{tableDay(new Date(attemptTime(a)).toISOString(), now)}</td>
                      <td style={{ fontWeight: 800 }}>{missions.get(a.mission_id)?.title ?? "Mission"}</td>
                      <td>{mins ?? "–"}</td>
                      <td>
                        {isFinished(a) ? (
                          <Chip tone="ok" flat><IconCheck />Finished</Chip>
                        ) : (
                          <Chip flat><IconClock />{a.outcome === "retry" ? "Tried again" : "Left early"}</Chip>
                        )}
                      </td>
                      <td>{earned === null ? "–" : money(c.region, earned)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Coins and XP" pad={false} aside={<span>{plural(coinRows.length, "entry", "entries")}</span>}>
        {coinRows.length === 0 ? (
          <p className="da-note" style={{ padding: "0 20px 20px" }} role="status">No coin or XP changes in this time range.</p>
        ) : (
          <div className="da-scroll">
            <table className="da-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">What</th>
                  <th scope="col">Type</th>
                  <th scope="col" className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {coinRows.slice(0, 30).map((e) => (
                  <tr key={e.id}>
                    <td>{tableDay(e.created_at, now)}</td>
                    <td style={{ fontWeight: 800 }}>{humaniseLabel(e.label, e.kind)}</td>
                    <td><Chip flat>{KIND_TEXT[e.kind]}</Chip></td>
                    <td className="num">{e.kind === "xp" ? `${e.amount} XP` : `${e.kind === "spend" || e.kind === "save" ? "−" : "+"}${money(c.region, e.amount)}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
