export const BAND_LABEL: Record<string, string> = { b4_6: "4–6", b7_9: "7–9", b10_12: "10–12", b13_15: "13–15" };
export const BAND_VALUES = ["b4_6", "b7_9", "b10_12", "b13_15"] as const;
export const REGION_LABEL: Record<string, string> = { gh: "Ghana", ng: "Nigeria", uk: "United Kingdom" };
export const REGION_VALUES = ["gh", "ng", "uk"] as const;
export const OUTCOME_LABEL: Record<string, string> = { success: "Success", retry: "Try again", gentle: "Gentle result", left: "Left early" };
export const MODE_LABEL: Record<string, string> = { "my-phone": "Own phone", family: "Family device" };

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Today / Yesterday / N days ago / N weeks ago / a date. */
export function relativeDay(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return "No activity yet";
  const then = new Date(iso);
  const days = Math.floor((startOfDay(now) - startOfDay(then.getTime())) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "1 week ago";
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export type SP = Record<string, string | string[] | undefined>;
export const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

/** Keeps letters, digits and a few safe characters so the value can sit inside a PostgREST filter. */
export const safeSearch = (q: string): string => q.replace(/[^\p{L}\p{N}@.+' -]/gu, "").trim().slice(0, 60);
