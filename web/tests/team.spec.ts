import { expect, test } from "@playwright/test";
import { PARENT_EMAIL, STAFF_EMAIL, signInAs } from "./helpers";

// One sign-in at a time: the local mail service sends one code per second per address.
test.describe.configure({ mode: "serial" });

test.describe("Team Console as staff (admin)", () => {
  test("families list shows the seeded families", async ({ page }) => {
    await signInAs(page, STAFF_EMAIL, "team");
    await page.goto("/team/families");
    await expect(page.getByRole("heading", { name: "Families", level: 1 })).toBeVisible();
    for (const nickname of ["Ama", "Kofi", "Zara", "Tobi"]) {
      await expect(page.getByRole("cell", { name: nickname, exact: true })).toBeVisible();
    }
  });

  test("searching with no match shows the empty state", async ({ page }) => {
    await signInAs(page, STAFF_EMAIL, "team");
    await page.goto("/team/families?q=no-match");
    await expect(page.getByRole("heading", { name: /No families match/ })).toBeVisible();
    await expect(page.getByRole("table")).toHaveCount(0);
    await page.getByRole("link", { name: "Clear search" }).click();
    await expect(page.getByRole("cell", { name: "Ama", exact: true })).toBeVisible();
  });

  test("a family opens with children, balances and no pin hash", async ({ page }) => {
    const supabase = await signInAs(page, STAFF_EMAIL, "team");
    const { data: kid } = await supabase.from("child_profiles").select("parent_id").eq("nickname", "Ama").limit(1).single();
    await page.goto(`/team/families/${kid!.parent_id}`);
    await expect(page.getByRole("heading", { name: /Family of / })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Ama", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Recent attempts" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/pin_hash|\$2[aby]\$/);
    // An unknown family is the designed not-found page.
    await page.goto("/team/families/00000000-0000-0000-0000-000000000000");
    await expect(page.getByRole("heading", { name: "We could not find that family" })).toBeVisible();
  });

  test("publish toggle persists, then is restored", async ({ page }) => {
    const supabase = await signInAs(page, STAFF_EMAIL, "team");
    const { data: m } = await supabase.from("missions").select("id,title,published").order("id").limit(1).single();
    const id = m!.id as string;
    const original = !!m!.published;
    const toggle = original ? "Unpublish mission" : "Publish mission";
    const restore = original ? "Publish mission" : "Unpublish mission";
    try {
      await page.goto(`/team/content/${id}`);
      await page.getByRole("button", { name: toggle }).click();
      await expect(page.getByRole("button", { name: restore })).toBeVisible();
      const { data: after } = await supabase.from("missions").select("published").eq("id", id).single();
      expect(after!.published).toBe(!original);
      await page.reload();
      await expect(page.getByRole("button", { name: restore })).toBeVisible();
    } finally {
      const { data: now } = await supabase.from("missions").select("published").eq("id", id).single();
      if (now && now.published !== original) {
        await page.goto(`/team/content/${id}`);
        await page.getByRole("button", { name: restore }).click();
      }
      const { data: end } = await supabase.from("missions").select("published").eq("id", id).single();
      expect(end!.published).toBe(original);
    }
  });

  test("content list filters and shows the empty state", async ({ page }) => {
    await signInAs(page, STAFF_EMAIL, "team");
    await page.goto("/team/content");
    await expect(page.getByRole("table")).toBeVisible();
    await page.goto("/team/content?q=zzzz-no-match");
    await expect(page.getByRole("heading", { name: "No missions match these filters" })).toBeVisible();
  });
});

test.describe("Team Console as a parent (not staff)", () => {
  test("is sent to no-access and receives no family data", async ({ page }) => {
    const parent = await signInAs(page, PARENT_EMAIL, "team");
    await page.goto("/team/families");
    await expect(page).toHaveURL(/\/team\/no-access$/);
    await expect(page.getByRole("heading", { name: "You do not have access to this page" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Kofi|Zara|Tobi|staff@example\.com/);

    await page.goto("/team/content/anything");
    await expect(page).toHaveURL(/\/team\/no-access$/);

    // The database agrees: a parent cannot read other families or the staff list.
    const { data: staff } = await parent.from("staff_users").select("user_id");
    expect(staff ?? []).toHaveLength(0);
    const { data: parents } = await parent.from("parents").select("id");
    expect((parents ?? []).length).toBe(1);
  });
});

test.describe("Team Console public pages", () => {
  test("sign-in, signed-out and error pages render", async ({ page }) => {
    await page.goto("/team/signin");
    await expect(page.getByRole("heading", { name: "Sign in to the Team Console" })).toBeVisible();
    await page.goto("/team/signed-out");
    await expect(page.getByRole("heading", { name: "You have signed out" })).toBeVisible();
    await page.goto("/team/error");
    await expect(page.getByRole("heading", { name: "We could not load this" })).toBeVisible();
  });
});
