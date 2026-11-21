import "server-only";
import { createClient } from "@/lib/supabase/server";
import { LEVEL_TITLES, bandLabel, levelForXp, levelTitle, type RegionCode } from "./consts";
import { isoDay, startOfDay, timeAgo, formatDate } from "./format";

type Supabase = Awaited<ReturnType<typeof createClient>>;
const DAY = 86_400_000;

export type ChildRow = { id: string; nickname: string; age_band: string; region: RegionCode; avatar: string };

export async function loadChildren(supabase: Supabase) {
  const { data, error } = await supabase
    .from("child_profiles")
    .select("id,nickname,age_band,region,avatar,created_at")
    .is("deleted_at", null)
    .order("created_at");
  return { children: (data ?? []) as (ChildRow & { created_at: string })[], failed: !!error };
}

/* ---------------------------------------------------------------- devices */

export type DeviceRow = { id: string; label: string; mode: "my-phone" | "family"; last_seen: string };

export async function loadDevices(supabase: Supabase) {
  const { data, error } = await supabase.from("devices").select("id,label,mode,last_seen").order("last_seen", { ascending: false });
  return { devices: (data ?? []) as DeviceRow[], failed: !!error };
}

export const deviceMode = (m: string) => (m === "family" ? "Family device" : "This is my phone");
/** "Active now" when seen in the last 15 minutes, otherwise "Idle". */
export const deviceActive = (lastSeen: string, now = Date.now()) => now - new Date(lastSeen).getTime() < 15 * 60_000;

/* ---------------------------------------------------------------- summary */

export type ChildSummary = {
  id: string;
  nickname: string;
  band: string;
  region: RegionCode;
  missions: number;
  coins: number;
  xp: number;
  badges: number;
  streak: number;
};

export type Summary = {
  from: Date;
  to: Date;
  missions: number;
  missionsPrev: number;
  coins: number;
  coinsPrev: number;
  daysPlayed: number;
  daysPlayedPrev: number;
  badges: number;
  badgesPrev: number;
  streak: number;
  buckets: { label: string; missions: number }[];
  worlds: { world: string; missions: number }[];
  children: ChildSummary[];
  hasActivity: boolean;
};

const COIN_KINDS = new Set(["earn", "bonus", "daily"]);

/** Current streak: consecutive active days ending today (or yesterday, if today has no activity yet). */
function streakOf(days: Set<number>, today: number): number {
  let d = days.has(today) ? today : today - DAY;
  let n = 0;
  while (days.has(d)) {
    n++;
    d -= DAY;
  }
  return n;
}

/** Totals for the last 30 days and the 30 days before (for the comparison), from the parent's own rows (RLS). */
export async function loadSummary(supabase: Supabase, now = new Date()): Promise<Summary | "error"> {
  const { children, failed } = await loadChildren(supabase);
  if (failed) return "error";
  const ids = children.map((c) => c.id);
  const from = new Date(now.getTime() - 30 * DAY);
  const since = new Date(now.getTime() - 60 * DAY).toISOString();

  const empty: Summary = {
    from, to: now, missions: 0, missionsPrev: 0, coins: 0, coinsPrev: 0, daysPlayed: 0, daysPlayedPrev: 0, badges: 0, badgesPrev: 0,
    streak: 0, buckets: [], worlds: [], children: [], hasActivity: false,
  };
  if (!ids.length) return empty;

  const [att, wal, bad, mis] = await Promise.all([
    supabase.from("mission_attempts").select("child_id,mission_id,outcome,started_at").in("child_id", ids).gte("started_at", since).limit(5000),
    supabase.from("wallet_events").select("child_id,kind,amount,created_at").in("child_id", ids).gte("created_at", since).limit(10000),
    supabase.from("child_badges").select("child_id,earned_at").in("child_id", ids).gte("earned_at", since).limit(2000),
    supabase.from("missions").select("id,world"),
  ]);
  if (att.error || wal.error || bad.error || mis.error) return "error";

  const worldOf = new Map((mis.data ?? []).map((m) => [m.id as string, m.world as string]));
  const fromMs = from.getTime();
  const inCur = (iso: string) => new Date(iso).getTime() > fromMs;
  const played = (att.data ?? []).filter((a) => a.outcome !== "left");

  const daysCur = new Set<number>();
  const daysPrev = new Set<number>();
  const perChildDays = new Map<string, Set<number>>(ids.map((i) => [i, new Set<number>()]));
  const mark = (child: string, iso: string) => {
    const day = startOfDay(new Date(iso));
    (inCur(iso) ? daysCur : daysPrev).add(day);
    perChildDays.get(child)?.add(day);
  };
  for (const a of att.data ?? []) mark(a.child_id, a.started_at);
  for (const w of wal.data ?? []) mark(w.child_id, w.created_at);

  const per = new Map<string, ChildSummary>(
    children.map((c) => [c.id, { id: c.id, nickname: c.nickname, band: c.age_band, region: c.region, missions: 0, coins: 0, xp: 0, badges: 0, streak: 0 }]),
  );
  let missions = 0, missionsPrev = 0, coins = 0, coinsPrev = 0, badges = 0, badgesPrev = 0;
  const bucketCount = 5;
  const bucketMs = (30 * DAY) / bucketCount;
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    label: formatDate(new Date(fromMs + i * bucketMs + 1000), false),
    missions: 0,
  }));
  const worlds = new Map<string, number>();

  for (const a of played) {
    if (inCur(a.started_at)) {
      missions++;
      const p = per.get(a.child_id);
      if (p) p.missions++;
      const idx = Math.min(bucketCount - 1, Math.floor((new Date(a.started_at).getTime() - fromMs) / bucketMs));
      buckets[Math.max(0, idx)].missions++;
      const w = worldOf.get(a.mission_id) ?? "Other";
      worlds.set(w, (worlds.get(w) ?? 0) + 1);
    } else missionsPrev++;
  }
  for (const w of wal.data ?? []) {
    const cur = inCur(w.created_at);
    if (COIN_KINDS.has(w.kind)) {
      if (cur) {
        coins += w.amount;
        const p = per.get(w.child_id);
        if (p) p.coins += w.amount;
      } else coinsPrev += w.amount;
    } else if (w.kind === "xp" && cur) {
      const p = per.get(w.child_id);
      if (p) p.xp += w.amount;
    }
  }
  for (const b of bad.data ?? []) {
    if (inCur(b.earned_at)) {
      badges++;
      const p = per.get(b.child_id);
      if (p) p.badges++;
    } else badgesPrev++;
  }
  const today = startOfDay(now);
  for (const [id, p] of per) p.streak = streakOf(perChildDays.get(id) ?? new Set(), today);

  return {
    from, to: now, missions, missionsPrev, coins, coinsPrev, daysPlayed: daysCur.size, daysPlayedPrev: daysPrev.size, badges, badgesPrev,
    streak: streakOf(new Set([...daysCur, ...daysPrev]), today),
    buckets,
    worlds: [...worlds].map(([world, n]) => ({ world, missions: n })).sort((a, b) => b.missions - a.missions),
    children: [...per.values()],
    hasActivity: missions + coins + badges + daysCur.size > 0,
  };
}

/* ---------------------------------------------------------- notifications */

export type NotificationKind = "milestone" | "summary" | "account";
export type Notice = {
  id: string;
  kind: NotificationKind;
  icon: "badge" | "level" | "summary" | "device" | "child";
  title: string;
  detail: string;
  at: Date;
  href?: string;
  action?: string;
};

const weekStart = (d: Date): number => {
  const day = startOfDay(d);
  return day - ((new Date(day).getUTCDay() + 6) % 7) * DAY; // Monday
};

/** Notifications are derived from real rows in the last 30 days: badges, level-ups, weekly summaries, new children and devices. */
export async function loadNotifications(supabase: Supabase, now = new Date()): Promise<Notice[] | "error"> {
  const { children, failed } = await loadChildren(supabase);
  if (failed) return "error";
  const ids = children.map((c) => c.id);
  const name = new Map(children.map((c) => [c.id, c.nickname]));
  const since = new Date(now.getTime() - 30 * DAY);
  const out: Notice[] = [];

  const devices = await loadDevices(supabase);
  if (devices.failed) return "error";
  for (const d of devices.devices) {
    const at = new Date(d.last_seen);
    if (at >= since)
      out.push({ id: `dev-${d.id}`, kind: "account", icon: "device", title: `${d.label} is signed in`, detail: `Account · Last seen ${timeAgo(at, now).toLowerCase()}. If this was not you, sign it out.`, at, href: "/dashboard/devices", action: "Review" });
  }
  for (const c of children) {
    const at = new Date(c.created_at);
    if (at >= since)
      out.push({ id: `kid-${c.id}`, kind: "account", icon: "child", title: `${c.nickname} joined the Pride`, detail: `Account · ${bandLabel(c.age_band)}`, at, href: `/dashboard/children/${c.id}` });
  }
  if (!ids.length) return out.sort((a, b) => b.at.getTime() - a.at.getTime());

  const recent = new Date(now.getTime() - 37 * DAY).toISOString();
  const [bad, xp, att, wal] = await Promise.all([
    supabase.from("child_badges").select("child_id,badge_id,earned_at,badges(title,pillar)").in("child_id", ids).order("earned_at"),
    supabase.from("wallet_events").select("child_id,amount,created_at").in("child_id", ids).eq("kind", "xp").order("created_at").limit(5000),
    supabase.from("mission_attempts").select("started_at").in("child_id", ids).gte("started_at", recent).limit(5000),
    supabase.from("wallet_events").select("created_at").in("child_id", ids).gte("created_at", recent).limit(10000),
  ]);
  if (bad.error || xp.error || att.error || wal.error) return "error";

  for (const b of bad.data ?? []) {
    const at = new Date(b.earned_at);
    if (at < since) continue;
    const meta = (Array.isArray(b.badges) ? b.badges[0] : b.badges) as { title: string; pillar: string | null } | null;
    const pillar = meta?.pillar ? `${meta.pillar[0].toUpperCase()}${meta.pillar.slice(1)} skill` : "Badge";
    out.push({ id: `badge-${b.child_id}-${b.badge_id}`, kind: "milestone", icon: "badge", title: `${name.get(b.child_id)} earned the ${meta?.title ?? "new"} badge`, detail: `Milestone · ${pillar}`, at, href: `/dashboard/children/${b.child_id}/badges` });
  }

  const totals = new Map<string, number>();
  for (const e of xp.data ?? []) {
    const before = totals.get(e.child_id) ?? 0;
    const after = before + e.amount;
    totals.set(e.child_id, after);
    const lv = levelForXp(after);
    const at = new Date(e.created_at);
    if (lv > levelForXp(before) && at >= since)
      out.push({ id: `lvl-${e.child_id}-${lv}`, kind: "milestone", icon: "level", title: `${name.get(e.child_id)} reached Level ${lv}, ${levelTitle(lv)}`, detail: `Milestone · Level ${lv} of ${LEVEL_TITLES.length}`, at, href: `/dashboard/children/${e.child_id}` });
  }

  // Weekly summaries: each finished Monday-to-Sunday week (UTC) in the window with any play or wallet activity.
  const active = new Set<number>();
  for (const a of att.data ?? []) active.add(weekStart(new Date(a.started_at)));
  for (const w of wal.data ?? []) active.add(weekStart(new Date(w.created_at)));
  for (const ws of active) {
    const end = ws + 7 * DAY;
    if (end > now.getTime() || end < since.getTime()) continue;
    out.push({ id: `week-${isoDay(new Date(ws))}`, kind: "summary", icon: "summary", title: "Your weekly summary is ready", detail: `Summary · Week of ${formatDate(new Date(ws), false)}`, at: new Date(end), href: "/dashboard/summary" });
  }
  return out.sort((a, b) => b.at.getTime() - a.at.getTime());
}

/* ------------------------------------------------------------- child page */

export async function loadChildSettings(supabase: Supabase, id: string) {
  const { data, error } = await supabase.from("child_profiles").select("id,nickname,age_band,region,avatar").eq("id", id).is("deleted_at", null).maybeSingle();
  if (error && error.code !== "22P02") return { status: "error" as const };
  if (!data) return { status: "missing" as const };
  const bal = await supabase.from("child_balances").select("xp").eq("child_id", id).maybeSingle();
  return { status: "ok" as const, child: data as ChildRow, xp: Number(bal.data?.xp ?? 0) };
}
