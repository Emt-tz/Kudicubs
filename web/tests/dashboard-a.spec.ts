import { expect, test, type Page } from "@playwright/test";
import { apiSignIn, getMailCode, PARENT_EMAIL, signInAs } from "./helpers";

const PARENT2_EMAIL = "parent2@example.com";

type Kid = { id: string; nickname: string };

/** Signs the sample parent in and returns Ama, Kofi, Zara and Tobi with their ids. */
async function sampleKids(page: Page): Promise<Record<string, Kid>> {
  const sb = await signInAs(page, PARENT_EMAIL, "dashboard");
  const { data, error } = await sb.from("child_profiles").select("id,nickname").is("deleted_at", null);
  expect(error).toBeNull();
  return Object.fromEntries((data ?? []).map((k) => [k.nickname as string, k as Kid]));
}

test.describe("Parent Dashboard part A", () => {
  test("seeded parent sees 4 children with the right balances", async ({ page }) => {
    await signInAs(page, PARENT_EMAIL, "dashboard");
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { level: 1, name: "Your family" })).toBeVisible();

    const rows = page.locator("table tbody tr");
    await expect(rows).toHaveCount(4);
    const expected: Record<string, { band: string; wallet: string; saved: string; level: string }> = {
      Ama: { band: "4–6", wallet: "GH₵120", saved: "GH₵40", level: "2 · Market Helper" },
      Kofi: { band: "7–9", wallet: "₦90", saved: "₦120", level: "3 · Stall Keeper" },
      Zara: { band: "10–12", wallet: "£130", saved: "£200", level: "4 · Market Star" },
      Tobi: { band: "13–15", wallet: "GH₵60", saved: "GH₵0", level: "1 · Market Visitor" },
    };
    for (const [name, e] of Object.entries(expected)) {
      const row = rows.filter({ hasText: name });
      const cells = row.locator("td");
      await expect(cells.nth(1)).toHaveText(e.band);
      await expect(cells.nth(3)).toHaveText(e.level);
      await expect(cells.nth(4)).toHaveText(e.wallet);
      await expect(cells.nth(5)).toHaveText(e.saved);
    }
    // KPI tiles are real numbers too
    await expect(page.locator(".da-kpi").filter({ hasText: "Children" }).locator(".da-kpi-value")).toHaveText("4");
    await expect(page.locator(".da-kpi").filter({ hasText: "Badges earned" }).locator(".da-kpi-value")).not.toHaveText("0");
  });

  test("child page, skills, activity and badges show the child's real data", async ({ page }) => {
    const kids = await sampleKids(page);
    const ama = kids.Ama.id;

    await page.goto(`/dashboard/children/${ama}`);
    await expect(page.getByRole("heading", { level: 1, name: "Ama" })).toBeVisible();
    await expect(page.getByText("Ages 4–6 · Ghana (GH₵) · Level 2, Market Helper")).toBeVisible();
    await expect(page.locator(".da-kpi").filter({ hasText: "Wallet" }).locator(".da-kpi-value")).toHaveText("GH₵120");
    await expect(page.locator(".da-kpi").filter({ hasText: "Saved in the jar" }).locator(".da-kpi-value")).toHaveText("GH₵40");
    await expect(page.getByText("360 of 400 XP to Stall Keeper")).toBeVisible();
    await expect(page.locator("svg[role=img]").first()).toBeVisible(); // inline SVG chart, no library

    await page.goto(`/dashboard/children/${ama}/skills`);
    await expect(page.getByRole("heading", { level: 1, name: "Skills growing" })).toBeVisible();
    for (const p of ["Know", "Understand", "Decide", "Invest", "Share"]) await expect(page.locator(".da-skill-row", { hasText: p }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Trend over 12 weeks" })).toBeVisible();
    await page.getByRole("link", { name: "6 months" }).click();
    await expect(page.getByRole("heading", { name: "Trend over 6 months" })).toBeVisible();

    await page.goto(`/dashboard/children/${ama}/activity`);
    await expect(page.getByRole("heading", { level: 1, name: "Activity" })).toBeVisible();
    await expect(page.getByRole("row", { name: /The Lost Coins/ }).first()).toBeVisible();
    await page.getByRole("link", { name: "Tried again" }).click();
    await expect(page).toHaveURL(/show=retry/);
    await expect(page.getByText("No sessions match this filter.")).toBeVisible();

    await page.goto(`/dashboard/children/${ama}/badges`);
    await expect(page.getByText("Ama has earned 3 of 8 badges.")).toBeVisible();
    await expect(page.locator(".da-badge")).toHaveCount(8);
    await expect(page.locator(".da-badge.locked")).toHaveCount(5);
    await page.getByRole("link", { name: "Earned 3" }).click();
    await expect(page.locator(".da-badge")).toHaveCount(3);
  });

  test("another family's parent cannot open a child page (404)", async ({ page, browser }) => {
    const kids = await sampleKids(page);
    const other = await browser.newContext();
    const page2 = await other.newPage();
    try {
      await signInAs(page2, PARENT2_EMAIL, "dashboard");
      for (const tail of ["", "/skills", "/activity", "/badges"]) {
        const res = await page2.goto(`/dashboard/children/${kids.Ama.id}${tail}`);
        expect(res?.status(), `child page${tail || " (overview)"}`).toBe(404);
        await expect(page2.getByText("Ama", { exact: true })).toHaveCount(0);
      }
      // a made-up id is a 404 too, not a server error
      expect((await page2.goto("/dashboard/children/not-a-real-id"))?.status()).toBe(404);
    } finally {
      await other.close();
    }
  });

  test("new family empty state appears with ?state=empty", async ({ page }) => {
    await signInAs(page, PARENT_EMAIL, "dashboard");
    await page.goto("/dashboard?state=empty");
    await expect(page.getByRole("heading", { level: 1, name: "Welcome to KudiCubs" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "No children yet" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Add your first child in the app" })).toBeVisible();

    await page.goto("/dashboard/children/" + (await sampleKids(page)).Ama.id + "?state=empty");
    await expect(page.getByRole("heading", { name: "Ama has not played yet" })).toBeVisible();
  });

  test("a brand-new parent really lands on the empty state (sign-in with a code)", async ({ page }) => {
    const email = `new-family-${Date.now()}@example.com`;
    const since = Date.now() - 1000;
    try {
      await page.goto("/dashboard/signin");
      await page.getByLabel("Parent email").fill(email);
      await page.getByRole("button", { name: "Send me a code" }).click();
      await expect(page).toHaveURL(/\/dashboard\/code$/);
      await expect(page.getByText(email)).toBeVisible();
      // Only the newest code per address is valid: wait for the message that arrived after the send, and
      // if the first try is rejected, ask for a fresh code and retry once.
      let sentAt = since;
      for (let attempt = 0; attempt < 2; attempt++) {
        await page.getByLabel("6-digit code").fill(await getMailCode(email, { since: sentAt, timeoutMs: 20_000 }));
        await page.getByRole("button", { name: /^(Sign in|Try again)$/ }).click();
        const landed = await page
          .waitForURL(/\/dashboard$/, { timeout: 8_000 })
          .then(() => true)
          .catch(() => false);
        if (landed) break;
        if (attempt === 1) break;
        sentAt = Date.now() - 1000;
        await page.getByRole("button", { name: "Send a new code" }).click();
        await expect(page.getByText(`We sent a new code to`)).toBeVisible();
      }
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole("heading", { name: "No children yet" })).toBeVisible();
    } finally {
      // remove the throwaway family again
      try {
        const { supabase } = await apiSignIn(email);
        await supabase.rpc("delete_my_family");
      } catch {
        /* nothing to clean up if sign-in never happened */
      }
    }
  });

  test("a wrong code shows its own error and keeps the page usable", async ({ page }) => {
    await page.goto("/dashboard/signin");
    await page.getByLabel("Parent email").fill(PARENT_EMAIL);
    await page.getByRole("button", { name: "Send me a code" }).click();
    await expect(page).toHaveURL(/\/dashboard\/code$/);
    await page.getByLabel("6-digit code").fill("000000");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "That code is not right." })).toBeVisible();
    await expect(page.getByText(/You have \d attempts? left\./)).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send a new code" })).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard\/code$/);
  });

  test("sign-in and code screens open their designed states", async ({ page }) => {
    await page.goto("/dashboard/signin?state=error");
    await expect(page.getByText("We could not send a code. Check the email address and try again.")).toBeVisible();
    await expect(page.getByText("Please check the email address. It should look like name@example.com.")).toBeVisible();

    await page.goto("/dashboard/signin?state=loading");
    await expect(page.getByRole("button", { name: "Sending your code..." })).toBeDisabled();

    await page.goto("/dashboard/signin");
    await page.getByLabel("Parent email").fill("not-an-email");
    await page.getByRole("button", { name: "Send me a code" }).click();
    await expect(page.getByText("Please check the email address. It should look like name@example.com.")).toBeVisible();

    await page.goto("/dashboard/code?state=wrong");
    await expect(page.getByText("That code is not right.")).toBeVisible();

    await page.goto("/dashboard/code?state=expired");
    await expect(page.getByRole("heading", { level: 1, name: "This code has expired" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Send me a new code" })).toBeVisible();
  });

  test("overview error and loading states open directly", async ({ page }) => {
    await signInAs(page, PARENT_EMAIL, "dashboard");
    await page.goto("/dashboard?state=error");
    await expect(page.getByText("We could not load this")).toBeVisible();
    await expect(page.getByRole("link", { name: "Try again" })).toBeVisible();
    await page.goto("/dashboard?state=loading");
    await expect(page.getByRole("status").first()).toBeVisible();
  });
});
