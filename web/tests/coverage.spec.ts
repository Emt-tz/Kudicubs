import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PUBLIC_DASHBOARD_PATHS, PUBLIC_TEAM_PATHS } from "../src/lib/auth/types";

type Entry = { id: string; platform: "web"; url: string; state: string; status?: number };

const root = path.join(__dirname, "..", "..");
const entries: Entry[] = JSON.parse(readFileSync(path.join(root, "design", "coverage-map.json"), "utf8")).web;
const AUTH = path.join(__dirname, ".auth");
const ids = (): Record<string, string> => JSON.parse(readFileSync(path.join(AUTH, "ids.json"), "utf8"));

const publicPaths: readonly string[] = [...PUBLIC_DASHBOARD_PATHS, ...PUBLIC_TEAM_PATHS];
const pathOf = (url: string) => url.split("?")[0];
type Group = "site" | "public-app" | "parent" | "staff";
const groupOf = (url: string): Group => {
  const p = pathOf(url);
  if (p.startsWith("/dashboard")) return publicPaths.includes(p) ? "public-app" : "parent";
  if (p.startsWith("/team")) return publicPaths.includes(p) ? "public-app" : "staff";
  return "site";
};
const resolve = (url: string) => {
  const i = ids();
  return url.replace("{child}", i.child).replace("{family}", i.family).replace("{mission}", i.mission);
};

test("coverage map lists all 60 web screens exactly once", () => {
  expect(entries).toHaveLength(60);
  expect(new Set(entries.map((e) => e.id)).size).toBe(60);
});

for (const group of ["site", "public-app", "parent", "staff"] as const) {
  test.describe(group, () => {
    if (group === "parent") test.use({ storageState: path.join(AUTH, "parent.json") });
    if (group === "staff") test.use({ storageState: path.join(AUTH, "staff.json") });

    for (const e of entries.filter((x) => groupOf(x.url) === group)) {
      test(`${e.id}  ${e.url}`, async ({ page }) => {
        const errors: string[] = [];
        const expected = e.status ?? 200;
        page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
        page.on("console", (msg) => {
          if (msg.type() !== "error") return;
          // A deliberate 404 page logs its own status once; nothing else is allowed through.
          if (expected === 404 && /status of 404/.test(msg.text())) return;
          errors.push(`console: ${msg.text()}`);
        });

        const res = await page.goto(resolve(e.url));
        expect(res?.status(), `HTTP status for ${e.url}`).toBe(expected);
        const h1 = page.locator("main h1").first();
        await expect(h1).toBeVisible();
        await expect(h1).not.toHaveText("");
        expect(errors, "console errors").toEqual([]);
      });
    }
  });
}
