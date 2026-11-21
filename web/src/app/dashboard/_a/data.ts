import "server-only";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AgeBand, Region } from "./format";

// Queries for Parent Dashboard part A. They run as the signed-in parent (anon key + cookies), so
// row-level security decides what is visible. Any failed query throws; pages turn that into the error state.

export type ChildRow = { id: string; nickname: string; age_band: AgeBand; region: Region; avatar: string; created_at: string };
export type Attempt = {
  id: string;
  child_id: string;
  mission_id: string;
  outcome: "success" | "retry" | "gentle" | "left";
  started_at: string;
  finished_at: string | null;
};
export type WalletKind = "earn" | "spend" | "save" | "bonus" | "daily" | "xp";
export type WalletEvent = { id: string; child_id: string; kind: WalletKind; amount: number; label: string; attempt_id: string | null; created_at: string };
export type Mission = { id: string; title: string; age_band: AgeBand; world: string; position: number };
export type Badge = { id: string; title: string; pillar: string | null };
export type ChildBadge = { child_id: string; badge_id: string; earned_at: string };
export type Balance = { coins: number; saved: number; xp: number };

type Res<T> = { data: T | null; error: { message: string; code?: string } | null };
function ok<T>(res: Res<T>, what: string): T {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data as T;
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CHILD_COLS = "id,nickname,age_band,region,avatar,created_at";
const ATTEMPT_COLS = "id,child_id,mission_id,outcome,started_at,finished_at";

export const attemptTime = (a: Pick<Attempt, "started_at" | "finished_at">): number => +new Date(a.finished_at ?? a.started_at);

export type FamilyData = {
  children: ChildRow[];
  balances: Map<string, Balance>;
  attempts: Attempt[];
  earned: ChildBadge[];
  missions: Mission[];
  badges: Badge[];
};

/** Everything the overview needs for all of the parent's children. */
export async function loadFamily(): Promise<FamilyData> {
  const sb = await createClient();
  const [kids, bal, att, earned, missions, badges] = await Promise.all([
    sb.from("child_profiles").select(CHILD_COLS).is("deleted_at", null).order("created_at"),
    sb.from("child_balances").select("child_id,coins,saved,xp"),
    sb.from("mission_attempts").select(ATTEMPT_COLS).order("started_at", { ascending: false }).limit(1000),
    sb.from("child_badges").select("child_id,badge_id,earned_at"),
    sb.from("missions").select("id,title,age_band,world,position"),
    sb.from("badges").select("id,title,pillar"),
  ]);
  const children = ok(kids as Res<ChildRow[]>, "children");
  const ids = new Set(children.map((c) => c.id));
  const balances = new Map<string, Balance>();
  for (const b of ok(bal as Res<(Balance & { child_id: string })[]>, "balances")) {
    if (ids.has(b.child_id)) balances.set(b.child_id, { coins: Number(b.coins), saved: Number(b.saved), xp: Number(b.xp) });
  }
  return {
    children,
    balances,
    attempts: ok(att as Res<Attempt[]>, "attempts").filter((a) => ids.has(a.child_id)),
    earned: ok(earned as Res<ChildBadge[]>, "badges earned").filter((b) => ids.has(b.child_id)),
    missions: ok(missions as Res<Mission[]>, "missions"),
    badges: ok(badges as Res<Badge[]>, "badges"),
  };
}

export type ChildBundle = {
  child: ChildRow;
  balance: Balance;
  attempts: Attempt[];
  wallet: WalletEvent[];
  earned: ChildBadge[];
  missions: Mission[];
  badges: Badge[];
};

/** One child and all their rows. Returns null when the id is not one of this parent's children (another family's child is invisible under RLS). */
export async function loadChild(id: string): Promise<ChildBundle | null> {
  if (!UUID_RE.test(id)) return null;
  const sb = await createClient();
  const kid = (await sb.from("child_profiles").select(CHILD_COLS).eq("id", id).is("deleted_at", null).maybeSingle()) as Res<ChildRow>;
  const child = ok(kid, "child");
  if (!child) return null;
  const [bal, att, wal, earned, missions, badges] = await Promise.all([
    sb.from("child_balances").select("coins,saved,xp").eq("child_id", id).maybeSingle(),
    sb.from("mission_attempts").select(ATTEMPT_COLS).eq("child_id", id).order("started_at", { ascending: false }).limit(1000),
    sb.from("wallet_events").select("id,child_id,kind,amount,label,attempt_id,created_at").eq("child_id", id).order("created_at", { ascending: false }).limit(2000),
    sb.from("child_badges").select("child_id,badge_id,earned_at").eq("child_id", id),
    sb.from("missions").select("id,title,age_band,world,position"),
    sb.from("badges").select("id,title,pillar"),
  ]);
  const b = ok(bal as Res<Balance>, "balance");
  return {
    child,
    balance: { coins: Number(b?.coins ?? 0), saved: Number(b?.saved ?? 0), xp: Number(b?.xp ?? 0) },
    attempts: ok(att as Res<Attempt[]>, "attempts"),
    wallet: ok(wal as Res<WalletEvent[]>, "wallet"),
    earned: ok(earned as Res<ChildBadge[]>, "badges earned"),
    missions: ok(missions as Res<Mission[]>, "missions"),
    badges: ok(badges as Res<Badge[]>, "badges"),
  };
}

/** The email and age of the code sent from this browser (httpOnly kc_code cookie written by sendCode). */
export async function pendingCode(): Promise<{ email: string; ageMs: number } | null> {
  const raw = (await cookies()).get("kc_code")?.value;
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { e?: unknown; t?: unknown };
    if (typeof v.e !== "string" || typeof v.t !== "number") return null;
    return { email: v.e, ageMs: Date.now() - v.t };
  } catch {
    return null;
  }
}

export const nowMs = (): number => Date.now();
