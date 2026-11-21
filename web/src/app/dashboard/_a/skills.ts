// Pillar progress derived from real attempts, missions and badges (there is no pillar table).
//
// Each mission teaches one pillar, chosen by its position in its band (1 Know, 2 Understand, 3 Decide, 4 Invest, 5 Share).
// Progress points: 25 for the first finished play of a mission, 5 for each further finished play,
// 15 for each earned badge that carries that pillar. Progress is capped at 100.

import type { Attempt, Badge, ChildBadge, Mission } from "./data";
import { DAY, startOfDay } from "./format";

export const PILLARS = ["Know", "Understand", "Decide", "Invest", "Share"] as const;
export type Pillar = (typeof PILLARS)[number];

export const pillarOfMission = (m: Pick<Mission, "position">): Pillar => PILLARS[(Math.max(1, m.position) - 1) % PILLARS.length];

const norm = (s: string | null): Pillar | null => PILLARS.find((p) => p.toLowerCase() === (s ?? "").toLowerCase()) ?? null;

type Increment = { at: number; pillar: Pillar; points: number };

export function pillarIncrements(attempts: Attempt[], missions: Mission[], badges: Badge[], earned: ChildBadge[]): Increment[] {
  const byMission = new Map(missions.map((m) => [m.id, m]));
  const out: Increment[] = [];
  const seen = new Set<string>();
  const sorted = [...attempts].sort((a, b) => +new Date(a.finished_at ?? a.started_at) - +new Date(b.finished_at ?? b.started_at));
  for (const a of sorted) {
    if (a.outcome !== "success" && a.outcome !== "gentle") continue;
    const m = byMission.get(a.mission_id);
    if (!m) continue;
    const first = !seen.has(a.mission_id);
    seen.add(a.mission_id);
    out.push({ at: +new Date(a.finished_at ?? a.started_at), pillar: pillarOfMission(m), points: first ? 25 : 5 });
  }
  const badgeById = new Map(badges.map((b) => [b.id, b]));
  for (const cb of earned) {
    const p = norm(badgeById.get(cb.badge_id)?.pillar ?? null);
    if (p) out.push({ at: +new Date(cb.earned_at), pillar: p, points: 15 });
  }
  return out;
}

export type PillarScore = { pillar: Pillar; pct: number };

export function scoreAt(incs: Increment[], until = Infinity): PillarScore[] {
  return PILLARS.map((pillar) => ({
    pillar,
    pct: Math.min(100, incs.filter((i) => i.pillar === pillar && i.at <= until).reduce((s, i) => s + i.points, 0)),
  }));
}

/** Weekly cumulative series for the trend chart; the last point is "now". */
export function weeklyTrend(incs: Increment[], weeks: number, now: number) {
  const end = startOfDay(now) + DAY - 1;
  const series: Record<Pillar, number[]> = { Know: [], Understand: [], Decide: [], Invest: [], Share: [] };
  for (let w = 0; w < weeks; w++) {
    const until = end - (weeks - 1 - w) * 7 * DAY;
    for (const s of scoreAt(incs, until)) series[s.pillar].push(s.pct);
  }
  return series;
}

export const PILLAR_TIP: Record<Pillar, string> = {
  Know: "Ask {n} what different coins and notes are worth.",
  Understand: "Ask {n} to explain why prices go up and down.",
  Decide: "Ask {n} to choose between two treats and say why.",
  Invest: "Ask {n} what could help a little money grow over time.",
  Share: "Ask {n} about giving a little to a goal in the next mission.",
};
