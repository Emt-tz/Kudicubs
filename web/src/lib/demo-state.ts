export type DemoState = "normal" | "loading" | "empty" | "error" | "offline";

type SearchParams = URLSearchParams | Record<string, string | string[] | undefined> | undefined | null;

const STATES: readonly DemoState[] = ["normal", "loading", "empty", "error", "offline"];

/** The override is on only when NEXT_PUBLIC_DEMO_STATES=1 (never in production). */
export const demoStatesEnabled = (): boolean => process.env.NEXT_PUBLIC_DEMO_STATES === "1";

function read(searchParams: SearchParams, key: string): string | undefined {
  if (!searchParams) return undefined;
  if (searchParams instanceof URLSearchParams) return searchParams.get(key) ?? undefined;
  const v = searchParams[key];
  return Array.isArray(v) ? v[0] : v;
}

/** `?state=loading|empty|error|offline` -> that state; anything else (or flag off) -> 'normal'. */
export function getDemoState(searchParams: SearchParams): DemoState {
  if (!demoStatesEnabled()) return "normal";
  const v = read(searchParams, "state");
  return (STATES as readonly string[]).includes(v ?? "") ? (v as DemoState) : "normal";
}

/**
 * For screen-specific variants that are not one of the five core states
 * (e.g. `?state=wrong`, `?state=expired`, `?state=sent`). Returns the value only if it is allowed.
 */
export function getDemoVariant<T extends string>(searchParams: SearchParams, allowed: readonly T[]): T | null {
  if (!demoStatesEnabled()) return null;
  const v = read(searchParams, "state");
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : null;
}
