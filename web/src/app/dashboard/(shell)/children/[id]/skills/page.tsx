import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StateView } from "@/components/StateView";
import { getDemoState } from "@/lib/demo-state";
import { LegendLine, LineChart, SERIES_STYLES } from "../../../../_a/charts";
import { loadChild, nowMs, type ChildBundle } from "../../../../_a/data";
import { BAND_LABEL, refCode } from "../../../../_a/format";
import { PILLAR_TIP, PILLARS, pillarIncrements, scoreAt, weeklyTrend } from "../../../../_a/skills";
import { BarRow, ChildSkeleton, EmptyPanel, ErrorPanel, IconInfo, PageHead, Panel, Seg } from "../../../../_a/ui";

export const metadata: Metadata = { title: "Skills" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const RANGES = { "12w": { weeks: 12, label: "12 weeks", title: "12 weeks" }, "6m": { weeks: 26, label: "6 months", title: "6 months" } } as const;

// dp-11-skills. Pillar progress is derived from the child's attempts, the missions' positions and earned badges (see _a/skills.ts).
export default async function Page({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const demo = getDemoState(sp);
  const rangeKey = sp.range === "6m" ? "6m" : "12w";
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
      <div className="da" data-screen="dp-11-skills">
        <PageHead title="Skills growing" sub="Progress in each skill." />
        <ErrorPanel retryHref={`/dashboard/children/${id}/skills`} reference={refCode()} />
      </div>
    );
  }
  return (
    <StateView state={demo === "offline" ? "offline" : "normal"}>
      <Skills b={bundle} rangeKey={rangeKey} noData={demo === "empty"} />
    </StateView>
  );
}

function Skills({ b, rangeKey, noData }: { b: ChildBundle; rangeKey: keyof typeof RANGES; noData: boolean }) {
  const c = b.child;
  const range = RANGES[rangeKey];
  const incs = noData ? [] : pillarIncrements(b.attempts, b.missions, b.badges, b.earned);
  const scores = scoreAt(incs).sort((x, y) => y.pct - x.pct || PILLARS.indexOf(x.pillar) - PILLARS.indexOf(y.pillar));
  const top = scores[0];
  const lowest = [...scores].reverse().find((s) => s.pct < 50) ?? null;
  const base = `/dashboard/children/${c.id}/skills`;
  const trend = weeklyTrend(incs, range.weeks, nowMs());
  const lines = scores.slice(0, 3).map((s, i) => ({ name: s.pillar, values: trend[s.pillar], ...SERIES_STYLES[i] }));
  const first = (v: number[]) => v[0] ?? 0;

  return (
    <div className="da" data-screen="dp-11-skills">
      <PageHead
        title="Skills growing"
        sub={`${c.nickname} · Ages ${BAND_LABEL[c.age_band]} · ${top && top.pct > 0 ? `Strongest skill: ${top.pillar}` : "No skills yet"}`}
        actions={
          <Seg
            label="Time range"
            items={[
              { label: "12 weeks", href: base, active: rangeKey === "12w" },
              { label: "6 months", href: `${base}?range=6m`, active: rangeKey === "6m" },
            ]}
          />
        }
      />
      {incs.length === 0 ? (
        <EmptyPanel
          image="/brand/kudi-wave.webp"
          alt="Kudi the Cub waving"
          title={`${c.nickname} has no skills yet`}
          body="Skills grow as missions are finished and badges are earned. They will appear here after the first mission."
        />
      ) : (
        <div className="da-split skills">
          <Panel title="Skills today">
            <div className="da-skill">
              {scores.map((s) => (
                <BarRow key={s.pillar} label={s.pillar} pct={s.pct} />
              ))}
            </div>
            {lowest ? (
              <div className="da-tip">
                <IconInfo size={18} />
                <div>
                  <strong>Tip:</strong> {lowest.pct === 0 ? `${lowest.pillar} has not started yet. ` : `${lowest.pillar} is the next one to grow. `}
                  {PILLAR_TIP[lowest.pillar].replace("{n}", c.nickname)}
                </div>
              </div>
            ) : null}
          </Panel>
          <Panel title={`Trend over ${range.title}`} sub="Percent of each skill reached">
            <LineChart
              series={lines}
              xLabel={(i) => `Wk ${i + 1}`}
              ariaLabel={`Line chart over ${range.title}. ${lines.map((l) => `${l.name} goes from ${first(l.values)} to ${l.values[l.values.length - 1]} percent`).join(", ")}.`}
            />
            <div className="da-legend">
              {lines.map((l) => (
                <span key={l.name}>
                  <LegendLine colour={l.colour} dash={l.dash} />
                  {l.name} {l.values[l.values.length - 1]}%
                </span>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
