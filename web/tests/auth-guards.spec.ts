import { expect, test } from "@playwright/test";
import path from "node:path";

const AUTH = path.join(__dirname, ".auth");

test.describe("signed out", () => {
  test("/dashboard goes to /dashboard/signin", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/signin$/);
  });
  test("/dashboard/devices goes to /dashboard/signin", async ({ page }) => {
    await page.goto("/dashboard/devices");
    await expect(page).toHaveURL(/\/dashboard\/signin$/);
  });
  test("/team/families goes to /team/signin", async ({ page }) => {
    await page.goto("/team/families");
    await expect(page).toHaveURL(/\/team\/signin$/);
  });
});

test.describe("signed in as a parent (not staff)", () => {
  test.use({ storageState: path.join(AUTH, "parent.json") });
  test("the dashboard opens", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("link", { name: "Devices and data" })).toBeVisible();
  });
  test("/team/families goes to /team/no-access", async ({ page }) => {
    await page.goto("/team/families");
    await expect(page).toHaveURL(/\/team\/no-access$/);
  });
});

test.describe("signed in as staff", () => {
  test.use({ storageState: path.join(AUTH, "staff.json") });
  test("the console opens and shows the signed-in role", async ({ page }) => {
    await page.goto("/team/families");
    await expect(page).toHaveURL(/\/team\/families$/);
    await expect(page.getByText(/Role: /)).toBeVisible();
  });
});
