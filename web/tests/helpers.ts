import { createServerClient } from "@supabase/ssr";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Page } from "@playwright/test";

export type Area = "dashboard" | "family" | "team";

export const BASE_URL = process.env.BASE_URL ?? "http://127.0.0.1:3100";
export const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://127.0.0.1:56324";
export const PARENT_EMAIL = "parent@example.com";
export const STAFF_EMAIL = "staff@example.com";

/** Reads web/.env.local (Playwright does not load it by itself). Real environment wins. */
function loadEnvFile(): Record<string, string> {
  try {
    const text = readFileSync(path.join(__dirname, "..", ".env.local"), "utf8");
    const out: Record<string, string> = {};
    for (const line of text.split("\n")) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && !line.trim().startsWith("#")) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
    return out;
  } catch {
    return {};
  }
}
const fileEnv = loadEnvFile();
const env = (k: string, d = "") => process.env[k] ?? fileEnv[k] ?? d;

export const SUPABASE_URL = env("NEXT_PUBLIC_SUPABASE_URL", "http://127.0.0.1:56321");
export const SUPABASE_ANON_KEY = env("NEXT_PUBLIC_SUPABASE_ANON_KEY");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type MailpitSummary = { ID: string; Created: string; To: { Address: string }[] };

/**
 * The 6-digit code from the newest Mailpit message sent to `email`.
 * `since` (ms epoch) ignores older messages, so a stale code is never picked up.
 */
export async function getMailCode(email: string, opts: { since?: number; timeoutMs?: number } = {}): Promise<string> {
  const { since = 0, timeoutMs = 15_000 } = opts;
  const deadline = Date.now() + timeoutMs;
  const want = email.trim().toLowerCase();
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    if (res.ok) {
      const list = (await res.json()) as { messages?: MailpitSummary[] };
      // Mailpit lists newest first.
      const hit = (list.messages ?? []).find(
        (m) => m.To?.some((t) => t.Address.toLowerCase() === want) && new Date(m.Created).getTime() >= since,
      );
      if (hit) {
        const msg = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${hit.ID}`)).json()) as { Text?: string; HTML?: string };
        const m = /(?<!\d)(\d{6})(?!\d)/.exec(msg.Text ?? "") ?? /(?<!\d)(\d{6})(?!\d)/.exec((msg.HTML ?? "").replace(/<[^>]+>/g, " "));
        if (m) return m[1];
      }
    }
    await sleep(400);
  }
  throw new Error(`No 6-digit code arrived in Mailpit for ${email} within ${timeoutMs} ms (is \`supabase start\` running?)`);
}

/** Signs in with the real email-code flow against local Supabase, as a Node client. */
export async function apiSignIn(email: string) {
  const jar = new Map<string, { name: string; value: string }>();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar.values()],
      setAll: (list) => list.forEach(({ name, value }) => jar.set(name, { name, value })),
    },
  });
  const since = Date.now() - 1000;
  for (let attempt = 0; ; attempt++) {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (!error) break;
    if (attempt >= 4) throw new Error(`signInWithOtp(${email}) failed: ${error.message}`);
    await sleep(1500);
  }
  const token = await getMailCode(email, { since });
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) throw new Error(`verifyOtp(${email}) failed: ${error.message}`);
  for (let i = 0; i < 20 && jar.size === 0; i++) await sleep(100); // @supabase/ssr writes cookies on the auth event
  if (jar.size === 0) throw new Error("No session cookies were produced");
  return { supabase, cookies: [...jar.values()] };
}

/**
 * Signs `email` in (real code from Mailpit, no UI) and puts the session cookies into the page's
 * browser context. The user must already exist (run `node scripts/seed.mjs`).
 * `area` only documents intent; both areas use the same Supabase session cookie.
 */
export async function signInAs(page: Page, email: string, area: Area = "dashboard") {
  void area;
  const { supabase, cookies } = await apiSignIn(email);
  await page.context().addCookies(cookies.map((c) => ({ name: c.name, value: c.value, url: BASE_URL })));
  return supabase;
}

/** Test-only: first row id for resolving {child} / {family} / {mission} in coverage-map urls. */
export async function firstId(supabase: Awaited<ReturnType<typeof apiSignIn>>["supabase"], table: "child_profiles" | "parents" | "missions") {
  const { data } = await supabase.from(table).select("id").order("id").limit(1);
  return (data?.[0]?.id as string | undefined) ?? "demo";
}
