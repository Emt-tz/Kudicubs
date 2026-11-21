import { demoStatesEnabled } from "@/lib/demo-state";

/** `?idle=<seconds>` shortens the idle timeout so it can be tested. Only honoured when demo states are on. */
export function idleSeconds(sp: Record<string, string | string[] | undefined>): number | undefined {
  if (!demoStatesEnabled()) return undefined;
  const v = Array.isArray(sp.idle) ? sp.idle[0] : sp.idle;
  const n = Number(v);
  return Number.isFinite(n) && n >= 2 && n <= 900 ? n : undefined;
}
