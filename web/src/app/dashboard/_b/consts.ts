// Shared constants for the Parent Dashboard account pages (part B). Safe for server and client code.

export type AgeBand = "b4_6" | "b7_9" | "b10_12" | "b13_15";
export type RegionCode = "gh" | "ng" | "uk";

export const BANDS: { value: AgeBand; label: string; short: string }[] = [
  { value: "b4_6", label: "Ages 4–6 · Money & Choices", short: "Ages 4–6" },
  { value: "b7_9", label: "Ages 7–9 · Build & Grow", short: "Ages 7–9" },
  { value: "b10_12", label: "Ages 10–12 · Founder Mode", short: "Ages 10–12" },
  { value: "b13_15", label: "Ages 13–15 · Side Hustle", short: "Ages 13–15" },
];

export const REGIONS: { value: RegionCode; label: string; name: string; symbol: string }[] = [
  { value: "gh", label: "Ghana (GH₵)", name: "Ghana", symbol: "GH₵" },
  { value: "ng", label: "Nigeria (₦)", name: "Nigeria", symbol: "₦" },
  { value: "uk", label: "United Kingdom (£)", name: "United Kingdom", symbol: "£" },
];

export const AVATARS = ["cub-friend-1", "cub-friend-2", "cub-friend-3", "cub-friend-4"] as const;

/** Children never use real names: nicknames come from this short list (a child's current nickname is always allowed). */
export const NICKNAMES = [
  "Ama", "Kofi", "Zara", "Tobi", "Esi", "Kwame", "Efua", "Kojo", "Abena", "Nia",
  "Ada", "Chidi", "Ife", "Tunde", "Zuri", "Leo", "Mia", "Sam", "Ivy", "Max",
] as const;

/** Same list the database refuses in set_pin(). Checked first so a weak PIN never uses up a try. */
export const WEAK_PINS = ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999", "1234", "4321", "0123"];

export const bandLabel = (v: string) => BANDS.find((b) => b.value === v)?.short ?? v;
export const regionName = (v: string) => REGIONS.find((r) => r.value === v)?.name ?? v;
export const regionSymbol = (v: string) => REGIONS.find((r) => r.value === v)?.symbol ?? "";

/** Same level rule as the phone app: level = 1 + xp / 300. */
export const XP_PER_LEVEL = 300;
export const LEVEL_TITLES = ["Cub Starter", "Coin Collector", "Stall Keeper", "Smart Saver", "Market Pro", "Money Master"];
export const levelForXp = (xp: number) => 1 + Math.floor(Math.max(0, xp) / XP_PER_LEVEL);
export const levelTitle = (level: number) => LEVEL_TITLES[Math.min(Math.max(level, 1), LEVEL_TITLES.length) - 1];

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
export const NOTIF_READ_COOKIE = "kc_notif_read";
