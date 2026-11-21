// Shared formatting and derivation helpers for Parent Dashboard part A (overview, child, skills, activity, badges).

export type Region = "gh" | "ng" | "uk";
export type AgeBand = "b4_6" | "b7_9" | "b10_12" | "b13_15";

export const CURRENCY: Record<Region, string> = { gh: "GH₵", ng: "₦", uk: "£" };
export const COUNTRY: Record<Region, string> = { gh: "Ghana (GH₵)", ng: "Nigeria (₦)", uk: "United Kingdom (£)" };
export const BAND_LABEL: Record<AgeBand, string> = { b4_6: "4–6", b7_9: "7–9", b10_12: "10–12", b13_15: "13–15" };
export const BAND_ORDER: AgeBand[] = ["b4_6", "b7_9", "b10_12", "b13_15"];

/** Fictional currency only: the child's own region decides the symbol. */
export const money = (region: Region, n: number): string => `${n < 0 ? "-" : ""}${CURRENCY[region]}${Math.abs(n).toLocaleString("en-GB")}`;

export const DAY = 86_400_000;

export const startOfDay = (d: Date | number): number => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};

/** Whole calendar days from `b` to `a` (a later than b => positive). */
export const dayDiff = (a: Date | number, b: Date | number): number => Math.round((startOfDay(a) - startOfDay(b)) / DAY);

const SHORT_DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const shortDay = (ms: number): string => SHORT_DAY[new Date(ms).getDay()];
export const dayMonth = (ms: number): string => `${new Date(ms).getDate()} ${MONTH[new Date(ms).getMonth()]}`;

/** "Today", "Yesterday", "3 days ago", then "12 Nov". */
export function relDay(iso: string, now: number): string {
  const n = dayDiff(now, new Date(iso));
  if (n <= 0) return "Today";
  if (n === 1) return "Yesterday";
  if (n < 30) return `${n} days ago`;
  return dayMonth(new Date(iso).getTime());
}

/** Table date: "Today", "Yesterday", weekday within the last week, then "12 Nov". */
export function tableDay(iso: string, now: number): string {
  const n = dayDiff(now, new Date(iso));
  if (n <= 0) return "Today";
  if (n === 1) return "Yesterday";
  if (n < 7) return LONG_DAY[new Date(iso).getDay()];
  return dayMonth(new Date(iso).getTime());
}

export const AVATAR_COLOURS = ["#F68C1F", "#FBAA19", "#FCE6C6", "#644D3B"];
export const avatarColour = (nickname: string): string => {
  let h = 0;
  for (const ch of nickname) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return AVATAR_COLOURS[h % AVATAR_COLOURS.length];
};

export const initial = (nickname: string): string => (nickname.trim()[0] ?? "?").toUpperCase();

/** "Ama", "Ama and Kofi", "Ama, Kofi and Tobi". */
export const joinNames = (names: string[]): string =>
  names.length <= 1 ? (names[0] ?? "") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

/** 'history.market_walk' -> "Market walk"; 'xp' -> "XP earned". */
export function humaniseLabel(label: string, kind?: string): string {
  if (!label || label === "xp") return kind === "xp" || label === "xp" ? "XP earned" : "Coins";
  const base = label.includes(".") ? label.split(".").slice(1).join(" ") : label;
  const text = base.replace(/_/g, " ").trim();
  return text ? text[0].toUpperCase() + text.slice(1) : "Coins";
}

export const LEVELS = [
  { n: 1, name: "Market Visitor", from: 0 },
  { n: 2, name: "Market Helper", from: 100 },
  { n: 3, name: "Stall Keeper", from: 400 },
  { n: 4, name: "Market Star", from: 600 },
  { n: 5, name: "Pride Star", from: 1000 },
] as const;

export function levelFor(xp: number) {
  let idx = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.from) idx = i;
  });
  const cur = LEVELS[idx];
  const next = LEVELS[idx + 1] ?? null;
  const pct = next ? Math.round(((xp - cur.from) / (next.from - cur.from)) * 100) : 100;
  return { level: cur.n, name: cur.name, next, pct, xp };
}

export const refCode = (): string => `KC-${Date.now().toString(36).toUpperCase().slice(-4)}-${Math.floor(Math.random() * 90 + 10)}`;

/** Like relDay, but "Today"/"Yesterday" start lower case so it reads inside a sentence ("Saved yesterday"). */
export const relDayInline = (iso: string, now: number): string => relDay(iso, now).replace(/^(Today|Yesterday)$/, (s) => s.toLowerCase());
