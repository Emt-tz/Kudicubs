import { chromium, type FullConfig } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { BASE_URL, PARENT_EMAIL, STAFF_EMAIL, apiSignIn, firstId } from "./helpers";

export const AUTH_DIR = path.join(__dirname, ".auth");

/** Signs the sample parent and staff user in once; saves browser state and sample ids for the specs. */
export default async function globalSetup(config: FullConfig) {
  void config;
  mkdirSync(AUTH_DIR, { recursive: true });
  const browser = await chromium.launch();
  const ids: Record<string, string> = {};
  for (const [name, email] of [["parent", PARENT_EMAIL], ["staff", STAFF_EMAIL]] as const) {
    const { supabase, cookies } = await apiSignIn(email);
    const context = await browser.newContext({ baseURL: BASE_URL });
    await context.addCookies(cookies.map((c) => ({ name: c.name, value: c.value, url: BASE_URL })));
    await context.storageState({ path: path.join(AUTH_DIR, `${name}.json`) });
    await context.close();
    if (name === "parent") ids.child = await firstId(supabase, "child_profiles");
    else {
      ids.family = await firstId(supabase, "parents");
      ids.mission = await firstId(supabase, "missions");
    }
  }
  await browser.close();
  writeFileSync(path.join(AUTH_DIR, "ids.json"), JSON.stringify(ids));
}
