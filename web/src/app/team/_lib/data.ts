import "server-only";
import { createClient } from "@/lib/supabase/server";
import { safeSearch } from "./format";

export const PAGE_SIZE = 10;
const ACTIVE_DAYS = 7;

export type FamilyRow = {
  id: string;
  parentId: string;
  nickname: string;
  band: string;
  region: string;
  removed: boolean;
  lastActive: string | null;
  email?: string;
};

export type FamilyList = { rows: FamilyRow[]; total: number; error: boolean };

export const isActive = (iso: string | null): boolean => !!iso && Date.now() - new Date(iso).getTime() < ACTIVE_DAYS * 86_400_000;

/** Children (one row each, linked to their family) as the signed-in staff user sees them under RLS. */
export async function listFamilies(opts: { q: string; band: string; region: string; page: number; showEmail: boolean }): Promise<FamilyList> {
  const supabase = await createClient();
  const q = safeSearch(opts.q);
  let parentIds: string[] = [];
  if (q && opts.showEmail) {
    const { data } = await supabase.from("parents").select("id").ilike("email", `%${q}%`).limit(200);
    parentIds = (data ?? []).map((p) => p.id as string);
  }
  const select = opts.showEmail
    ? "id,parent_id,nickname,age_band,region,deleted_at,parents(email)"
    : "id,parent_id,nickname,age_band,region,deleted_at";
  let query = supabase.from("child_profiles").select(select, { count: "exact" });
  if (q) {
    const ors = [`nickname.ilike.%${q}%`];
    if (parentIds.length) ors.push(`parent_id.in.(${parentIds.join(",")})`);
    query = query.or(ors.join(","));
  }
  if (opts.band) query = query.eq("age_band", opts.band);
  if (opts.region) query = query.eq("region", opts.region);
  const from = (opts.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order("nickname").order("id").range(from, from + PAGE_SIZE - 1);
  if (error) return { rows: [], total: 0, error: true };

  type Raw = { id: string; parent_id: string; nickname: string; age_band: string; region: string; deleted_at: string | null; parents?: { email?: string } | { email?: string }[] | null };
  const raw = (data ?? []) as unknown as Raw[];
  const last = await Promise.all(
    raw.map(async (c) => {
      const { data: a } = await supabase.from("mission_attempts").select("started_at").eq("child_id", c.id).order("started_at", { ascending: false }).limit(1);
      return (a?.[0]?.started_at as string | undefined) ?? null;
    }),
  );
  const rows = raw.map<FamilyRow>((c, i) => {
    const p = Array.isArray(c.parents) ? c.parents[0] : c.parents;
    return {
      id: c.id,
      parentId: c.parent_id,
      nickname: c.nickname,
      band: c.age_band,
      region: c.region,
      removed: !!c.deleted_at,
      lastActive: last[i],
      email: opts.showEmail ? p?.email : undefined,
    };
  });
  return { rows, total: count ?? rows.length, error: false };
}

export type Child = { id: string; nickname: string; band: string; region: string; removed: boolean; createdAt: string };
export type FamilyDetail = {
  parent: { id: string; email: string; region: string; createdAt: string; consentedAt: string | null };
  children: (Child & { lastActive: string | null; coins?: number; saved?: number; xp?: number; badges?: number })[];
  attempts: { id: string; child: string; mission: string; outcome: string; startedAt: string }[];
  devices: { id: string; label: string; mode: string; lastSeen: string }[];
  notes: { id: string; reference: string; topic: string; message: string; createdAt: string }[];
  lastActive: string | null;
};

/** One family (a parent row and everything under it). `full` adds balances, attempts and devices (admin). */
export async function getFamily(parentId: string, full: boolean): Promise<FamilyDetail | null | "error"> {
  const supabase = await createClient();
  // Explicit column list: pin_hash is never selected (and is not granted to clients).
  const { data: parent, error } = await supabase.from("parents").select("id,email,region,created_at,consented_at").eq("id", parentId).maybeSingle();
  if (error) return "error";
  if (!parent) return null;
  const { data: kids, error: e2 } = await supabase
    .from("child_profiles")
    .select("id,nickname,age_band,region,created_at,deleted_at")
    .eq("parent_id", parentId)
    .order("created_at")
    .order("id");
  if (e2) return "error";
  const ids = (kids ?? []).map((k) => k.id as string);

  const attemptsQ = ids.length
    ? await supabase.from("mission_attempts").select("id,child_id,outcome,started_at,missions(title)").in("child_id", ids).order("started_at", { ascending: false }).limit(60)
    : { data: [] as never[], error: null };
  if (attemptsQ.error) return "error";
  type A = { id: string; child_id: string; outcome: string; started_at: string; missions?: { title?: string } | { title?: string }[] | null };
  const allAttempts = (attemptsQ.data ?? []) as unknown as A[];

  const [balances, badges, devices, notes] = full
    ? await Promise.all([
        ids.length ? supabase.from("child_balances").select("child_id,coins,saved,xp").in("child_id", ids) : { data: [] },
        ids.length ? supabase.from("child_badges").select("child_id").in("child_id", ids) : { data: [] },
        supabase.from("devices").select("id,label,mode,last_seen").eq("parent_id", parentId).order("last_seen", { ascending: false }),
        supabase.from("contact_messages").select("id,reference,topic,message,created_at").eq("email", parent.email).order("created_at", { ascending: false }).limit(10),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const bal = new Map((balances.data ?? []).map((b) => [b.child_id as string, b]));
  const badgeCount = new Map<string, number>();
  for (const b of badges.data ?? []) badgeCount.set(b.child_id as string, (badgeCount.get(b.child_id as string) ?? 0) + 1);
  const lastBy = new Map<string, string>();
  for (const a of allAttempts) if (!lastBy.has(a.child_id)) lastBy.set(a.child_id, a.started_at);
  const nick = new Map((kids ?? []).map((k) => [k.id as string, k.nickname as string]));

  const children = (kids ?? []).map((k) => ({
    id: k.id as string,
    nickname: k.nickname as string,
    band: k.age_band as string,
    region: k.region as string,
    removed: !!k.deleted_at,
    createdAt: k.created_at as string,
    lastActive: lastBy.get(k.id as string) ?? null,
    ...(full ? { coins: Number(bal.get(k.id as string)?.coins ?? 0), saved: Number(bal.get(k.id as string)?.saved ?? 0), xp: Number(bal.get(k.id as string)?.xp ?? 0), badges: badgeCount.get(k.id as string) ?? 0 } : {}),
  }));
  const lastActive = allAttempts[0]?.started_at ?? null;
  return {
    parent: { id: parent.id as string, email: parent.email as string, region: parent.region as string, createdAt: parent.created_at as string, consentedAt: (parent.consented_at as string | null) ?? null },
    children,
    attempts: full
      ? allAttempts.slice(0, 10).map((a) => {
          const m = Array.isArray(a.missions) ? a.missions[0] : a.missions;
          return { id: a.id, child: nick.get(a.child_id) ?? "", mission: m?.title ?? "Mission", outcome: a.outcome, startedAt: a.started_at };
        })
      : [],
    devices: (devices.data ?? []).map((d) => ({ id: d.id as string, label: d.label as string, mode: d.mode as string, lastSeen: d.last_seen as string })),
    notes: (notes.data ?? []).map((n) => ({ id: n.id as string, reference: n.reference as string, topic: n.topic as string, message: n.message as string, createdAt: n.created_at as string })),
    lastActive,
  };
}

export type MissionRow = { id: string; band: string; world: string; title: string; position: number; published: boolean; updatedAt: string };

export async function listMissions(): Promise<MissionRow[] | "error"> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("missions").select("id,age_band,world,title,position,published,updated_at").order("age_band").order("position").order("id");
  if (error) return "error";
  return (data ?? []).map((m) => ({ id: m.id as string, band: m.age_band as string, world: m.world as string, title: m.title as string, position: m.position as number, published: !!m.published, updatedAt: m.updated_at as string }));
}

export async function getMission(id: string): Promise<{ mission: MissionRow; outcomes: Record<string, number> } | null | "error"> {
  const supabase = await createClient();
  const { data: m, error } = await supabase.from("missions").select("id,age_band,world,title,position,published,updated_at").eq("id", id).maybeSingle();
  if (error) return "error";
  if (!m) return null;
  const outcomes: Record<string, number> = {};
  await Promise.all(
    ["success", "retry", "gentle", "left"].map(async (o) => {
      const { count } = await supabase.from("mission_attempts").select("id", { count: "exact", head: true }).eq("mission_id", id).eq("outcome", o);
      outcomes[o] = count ?? 0;
    }),
  );
  return {
    mission: { id: m.id as string, band: m.age_band as string, world: m.world as string, title: m.title as string, position: m.position as number, published: !!m.published, updatedAt: m.updated_at as string },
    outcomes,
  };
}
