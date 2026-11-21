import type { Metadata } from "next";
import { StateView } from "@/components/StateView";
import { getDemoState } from "@/lib/demo-state";
import { requireParent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { IdleTimeout } from "../../_b/IdleTimeout";
import { PrintButton } from "../../_b/PrintButton";
import { bandLabel, regionSymbol } from "../../_b/consts";
import { loadSummary } from "../../_b/data";
import { idleSeconds } from "../../_b/idle-params";
import { formatDate, plural } from "../../_b/format";
import "../../_b/dashb.css";

export const metadata: Metadata = { title: "Monthly summary" };

/** "▲ 4 more than before", "▼ 2 fewer than before" or "► Same as before". */
function delta(now: number, prev: number, unit = ""): string {
  const d = now - prev;
  const u = unit ? ` ${unit}` : "";
  if (d === 0) return "► Same as the 30 days before";
  return d > 0 ? `▲ ${d}${u} more than the 30 days before` : `▼ ${-d}${u} fewer than the 30 days before`;
}

// Canvas: dp-23-monthly-summary. Everything is computed from the family's real attempts, wallet events and badges
// in the last 30 days (compared with the 30 days before); nothing is estimated.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  await requireParent();
  const demo = getDemoState(sp);
  const supabase = await createClient();
  const summary = demo === "loading" ? null : await loadSummary(supabase);
  const state = demo !== "normal" ? demo : summary === "error" ? "error" : summary && !summary.hasActivity ? "empty" : "normal";
  const s = summary && summary !== "error" ? summary : null;
  const max = Math.max(1, ...(s?.buckets.map((b) => b.missions) ?? [1]));
  const maxWorld = Math.max(1, ...(s?.worlds.map((w) => w.missions) ?? [1]));
  const regions = new Set(s?.children.map((c) => c.region));

  return (
    <>
      <IdleTimeout seconds={idleSeconds(sp)} />
      <div className="page-head">
        <div>
          <h1>Last 30 days summary</h1>
          <p className="db-lead">
            {s ? `${formatDate(s.from)} to ${formatDate(s.to)}. ` : ""}How the whole family played, worked out from their real missions and rewards.
          </p>
        </div>
        <div className="db-noprint"><PrintButton>Print or save as PDF</PrintButton></div>
      </div>
      <StateView
        state={state}
        skeleton="cards"
        empty={{ title: "No play in the last 30 days", body: "When your children play missions, their summary appears here." }}
        error={{ title: "We could not load your summary", body: "Check your connection and try again.", retryHref: "/dashboard/summary" }}
      >
        {s ? (
          <>
            <div className="db-tiles">
              <Tile label="Missions played" value={String(s.missions)} note={delta(s.missions, s.missionsPrev)} />
              <Tile label="Coins earned" value={String(s.coins)} note={regions.size > 1 ? "In each child's own currency, see below" : delta(s.coins, s.coinsPrev)} />
              <Tile label="Days played" value={`${s.daysPlayed} of 30`} note={`Current streak: ${plural(s.streak, "day")}`} />
              <Tile label="Badges earned" value={String(s.badges)} note={delta(s.badges, s.badgesPrev)} />
            </div>
            <div className="db-two" style={{ alignItems: "start" }}>
              <section className="db-section" aria-labelledby="wk-h">
                <h2 id="wk-h">Missions over time</h2>
                <p className="sr-only">{s.buckets.map((b) => `From ${b.label}: ${b.missions}`).join(". ")}</p>
                <div aria-hidden="true">
                  <div className="db-bars">
                    {s.buckets.map((b) => (
                      <div key={b.label}>
                        <span>{b.missions}</span>
                        <i style={{ height: `${(b.missions / max) * 100}%` }} />
                      </div>
                    ))}
                  </div>
                  <div className="db-bar-labels">
                    {s.buckets.map((b) => (
                      <span key={b.label}>{b.label}</span>
                    ))}
                  </div>
                </div>
              </section>
              <section className="db-section" aria-labelledby="wd-h">
                <h2 id="wd-h">Missions by world</h2>
                {s.worlds.length === 0 ? (
                  <p className="muted">No missions were played in this period.</p>
                ) : (
                  s.worlds.map((w) => (
                    <div key={w.world} className="db-hbar">
                      <div className="top"><span>{w.world}</span><span>{plural(w.missions, "mission")}</span></div>
                      <div className="bar" role="presentation"><span style={{ width: `${(w.missions / maxWorld) * 100}%` }} /></div>
                    </div>
                  ))
                )}
              </section>
            </div>
            <section className="db-section" aria-labelledby="by-h">
              <h2 id="by-h">By child</h2>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr><th>Child</th><th>Missions</th><th>Coins earned</th><th>XP</th><th>Streak</th><th>Badges</th></tr>
                  </thead>
                  <tbody>
                    {s.children.map((c) => (
                      <tr key={c.id}>
                        <td><strong>{c.nickname}</strong> · {bandLabel(c.band).replace("Ages ", "")}</td>
                        <td>{c.missions}</td>
                        <td>{regionSymbol(c.region)}{c.coins}</td>
                        <td>{c.xp}</td>
                        <td>{plural(c.streak, "day")}</td>
                        <td>{c.badges}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted" style={{ margin: 0 }}>Each child&apos;s coins are shown in their own currency, so the rows are not added together.</p>
            </section>
          </>
        ) : null}
      </StateView>
    </>
  );
}

function Tile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="db-tile">
      <div className="l">{label}</div>
      <div className="n">{value}</div>
      <div className="d">{note}</div>
    </div>
  );
}
