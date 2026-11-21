import { createServerClient } from "@supabase/ssr";
import { expect, test, type Page } from "@playwright/test";
import { BASE_URL, SUPABASE_ANON_KEY, SUPABASE_URL, getMailCode, signInAs } from "./helpers";

/*
 * Parent Dashboard part B: child settings, family settings + PIN, devices, export, delete, summary,
 * notifications, session timeout and the status pages.
 *
 * Every test that writes uses its OWN throwaway family (a new email, created through the real email-code
 * sign-in), so the seeded families are never changed. parent2@example.com is used for read checks only.
 */

type Client = ReturnType<typeof createServerClient>;
const PIN = "5821";

async function newFamily(page: Page): Promise<{ email: string; supabase: Client; userId: string }> {
  const email = `throwaway-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const jar = new Map<string, { name: string; value: string }>();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => [...jar.values()],
      setAll: (list) => list.forEach(({ name, value }) => jar.set(name, { name, value })),
    },
  });
  const since = Date.now() - 1000;
  const sent = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (sent.error) throw new Error(`could not create ${email}: ${sent.error.message}`);
  const token = await getMailCode(email, { since });
  const verified = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (verified.error || !verified.data.user) throw new Error(`could not verify ${email}: ${verified.error?.message}`);
  for (let i = 0; i < 20 && jar.size === 0; i++) await new Promise((r) => setTimeout(r, 100));
  await page.context().addCookies([...jar.values()].map((c) => ({ name: c.name, value: c.value, url: BASE_URL })));
  const pin = await supabase.rpc("set_pin", { pin: PIN });
  expect(pin.error).toBeNull();
  return { email, supabase, userId: verified.data.user.id };
}

async function addChild(supabase: Client, userId: string, nickname = "Ama", age_band = "b4_6") {
  const { data, error } = await supabase
    .from("child_profiles")
    .insert({ parent_id: userId, nickname, age_band, region: "gh", avatar: "cub-friend-1" })
    .select("id")
    .single();
  expect(error).toBeNull();
  return data!.id as string;
}

test.describe("child settings", () => {
  test("changing the nickname, age band and avatar persists, and warns that progress is kept", async ({ page }) => {
    const { supabase, userId } = await newFamily(page);
    const id = await addChild(supabase, userId);
    await supabase.from("wallet_events").insert({ child_id: id, kind: "earn", amount: 75, label: "test" });

    await page.goto(`/dashboard/children/${id}/settings`);
    await expect(page.getByRole("heading", { name: "Child settings", level: 1 })).toBeVisible();
    await expect(page.getByTestId("band-warning")).toHaveCount(0);

    await page.getByLabel("Nickname").selectOption("Esi");
    await page.getByLabel("Age band").selectOption("b7_9");
    await expect(page.getByTestId("band-warning")).toContainText("kept");
    await page.getByLabel("Cub friend 3").check();
    await page.getByRole("button", { name: "Save changes" }).click();

    await expect(page).toHaveURL(/saved=band/);
    await expect(page.getByText("Saved.", { exact: false }).first()).toBeVisible();
    await expect(page.getByLabel("Nickname")).toHaveValue("Esi");

    const { data } = await supabase.from("child_profiles").select("nickname,age_band,avatar").eq("id", id).single();
    expect(data).toEqual({ nickname: "Esi", age_band: "b7_9", avatar: "cub-friend-3" });
    // progress is untouched
    const bal = await supabase.from("child_balances").select("coins").eq("child_id", id).single();
    expect(bal.data?.coins).toBe(75);

    await page.reload();
    await expect(page.getByLabel("Nickname")).toHaveValue("Esi");
    await expect(page.getByLabel("Age band")).toHaveValue("b7_9");
  });

  test("a real name is refused with the designed error", async ({ page }) => {
    const { supabase, userId } = await newFamily(page);
    const id = await addChild(supabase, userId);
    await page.goto(`/dashboard/children/${id}/settings`);
    // tamper with the select the way a hand-made request would
    await page.getByLabel("Nickname").evaluate((el: HTMLSelectElement) => {
      el.add(new Option("Amanda Boateng", "Amanda Boateng"));
      el.value = "Amanda Boateng";
    });
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("alert").first()).toContainText("could not save");
    await expect(page.getByText("Real names are not allowed.")).toBeVisible();
    const { data } = await supabase.from("child_profiles").select("nickname").eq("id", id).single();
    expect(data?.nickname).toBe("Ama");
  });

  test("another family's child is not found", async ({ page }) => {
    await newFamily(page);
    const res = await page.goto("/dashboard/children/00000000-0000-4000-8000-000000000000/settings");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We could not find that page" })).toBeVisible();
  });
});

test.describe("family settings and PIN", () => {
  test("a wrong current PIN is refused; the right one changes the PIN", async ({ page }) => {
    const { supabase } = await newFamily(page);
    await page.goto("/dashboard/settings?change=pin");
    await expect(page.getByRole("heading", { name: "Change your PIN" })).toBeVisible();

    await page.getByLabel("Current PIN").fill("4096");
    await page.getByLabel("New PIN", { exact: true }).fill("7391");
    await page.getByLabel("Confirm new PIN").fill("7391");
    await page.getByRole("button", { name: "Change PIN" }).click();
    await expect(page.getByText("That PIN does not match your current PIN.")).toBeVisible();
    await expect(page.getByText("Your PIN was not changed.")).toBeVisible();
    expect((await supabase.rpc("verify_pin", { pin: PIN })).data).toBe("ok"); // unchanged

    await page.getByLabel("Current PIN").fill(PIN);
    await page.getByLabel("New PIN", { exact: true }).fill("1234");
    await page.getByLabel("Confirm new PIN").fill("1234");
    await page.getByRole("button", { name: "Change PIN" }).click();
    await expect(page.getByText("Please choose a harder PIN.")).toBeVisible();

    await page.getByLabel("Current PIN").fill(PIN);
    await page.getByLabel("New PIN", { exact: true }).fill("7391");
    await page.getByLabel("Confirm new PIN").fill("7390");
    await page.getByRole("button", { name: "Change PIN" }).click();
    await expect(page.getByText("The two new PINs do not match.")).toBeVisible();

    await page.getByLabel("Current PIN").fill(PIN);
    await page.getByLabel("New PIN", { exact: true }).fill("7391");
    await page.getByLabel("Confirm new PIN").fill("7391");
    await page.getByRole("button", { name: "Change PIN" }).click();
    await expect(page).toHaveURL(/pin=changed/);
    await expect(page.getByText("Your PIN was changed.")).toBeVisible();
    expect((await supabase.rpc("verify_pin", { pin: "7391" })).data).toBe("ok");
  });

  test("five wrong tries lock the PIN", async ({ page }) => {
    await newFamily(page);
    await page.goto("/dashboard/settings?change=pin");
    for (let i = 0; i < 5; i++) {
      await page.getByLabel("Current PIN").fill("4096");
      await page.getByLabel("New PIN", { exact: true }).fill("7391");
      await page.getByLabel("Confirm new PIN").fill("7391");
      await page.getByRole("button", { name: "Change PIN" }).click();
      await expect(page.getByText(/does not match your current PIN|Too many wrong tries/)).toBeVisible();
    }
    await expect(page.getByText("Too many wrong tries")).toBeVisible();
  });

  test("the family region is saved", async ({ page }) => {
    const { supabase, userId } = await newFamily(page);
    await page.goto("/dashboard/settings");
    await page.getByLabel("Family region").selectOption("uk");
    await page.getByRole("button", { name: "Save region" }).click();
    await expect(page.getByText("Saved. Your family region is updated.")).toBeVisible();
    const { data } = await supabase.from("parents").select("region").eq("id", userId).single();
    expect(data?.region).toBe("uk");
  });
});

test.describe("devices and data", () => {
  test("signing a device out asks first, then removes it", async ({ page }) => {
    const { supabase, userId } = await newFamily(page);
    const ins = await supabase.from("devices").insert([
      { parent_id: userId, label: "Parent phone", mode: "my-phone" },
      { parent_id: userId, label: "Family tablet", mode: "family", last_seen: new Date(Date.now() - 2 * 86_400_000).toISOString() },
    ]);
    expect(ins.error).toBeNull();

    await page.goto("/dashboard/devices");
    await expect(page.getByRole("row", { name: /Family tablet.*Idle.*2 days ago/ })).toBeVisible();
    await page.getByRole("link", { name: "Sign out Family tablet" }).click();
    const dialog = page.getByRole("dialog", { name: "Sign out Family tablet?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: "Keep it signed in" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect((await supabase.from("devices").select("id")).data).toHaveLength(2);

    await page.getByRole("link", { name: "Sign out Family tablet" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByText("Device signed out.")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Family tablet" })).toHaveCount(0);
    expect((await supabase.from("devices").select("label")).data).toEqual([{ label: "Parent phone" }]);
  });

  test("export downloads JSON with only this family", async ({ page }) => {
    const { email, supabase, userId } = await newFamily(page);
    const id = await addChild(supabase, userId, "Kofi", "b7_9");
    await supabase.from("wallet_events").insert({ child_id: id, kind: "earn", amount: 40, label: "test" });

    await page.goto("/dashboard/devices?export=ready");
    await expect(page.getByText("Your export is ready.")).toBeVisible();
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Download file" }).click()]);
    expect(download.suggestedFilename()).toMatch(/^kudicubs-export-\d{4}-\d{2}-\d{2}\.json$/);
    const text = await (await import("node:fs/promises")).readFile((await download.path())!, "utf8");
    const json = JSON.parse(text);
    expect(json.parent.email).toBe(email);
    expect(json.children).toHaveLength(1);
    expect(json.children[0].profile.nickname).toBe("Kofi");
    expect(json.children[0].profile.parent_id).toBe(userId);
    expect(json.children[0].wallet).toHaveLength(1);
    expect(text).not.toContain("pin_hash");
    expect(text).not.toContain("parent@example.com");
    expect(text).not.toContain("Nia"); // the other seeded family's child
  });

  test("export needs a session", async ({ request }) => {
    const res = await request.get("/dashboard/devices/export", { maxRedirects: 0 });
    expect([307, 308, 401]).toContain(res.status());
  });

  test("deleting a throwaway family needs DELETE, signs out and shows the deleted page", async ({ page }) => {
    const { supabase, userId } = await newFamily(page);
    await addChild(supabase, userId);

    await page.goto("/dashboard/devices?confirm=delete");
    const dialog = page.getByRole("dialog", { name: "Delete all family data?" });
    await expect(dialog).toBeVisible();
    const go = dialog.getByRole("button", { name: "Delete everything" });
    await expect(go).toBeDisabled();
    await dialog.getByLabel("Type DELETE to confirm").fill("delete me");
    await expect(go).toBeDisabled();
    await dialog.getByLabel("Type DELETE to confirm").fill("DELETE");
    await expect(go).toBeEnabled();
    await go.click();

    await expect(page).toHaveURL(/\/dashboard\/deleted$/);
    await expect(page.getByRole("heading", { name: "Your family data has been deleted" })).toBeVisible();
    // signed out, and the data is gone
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/signin/);
    const left = await supabase.from("child_profiles").select("id");
    expect(left.data ?? []).toHaveLength(0);
  });
});

test.describe("summary and notifications", () => {
  test("the summary is computed from real events", async ({ page }) => {
    const { supabase, userId } = await newFamily(page);
    const id = await addChild(supabase, userId, "Zara", "b10_12");
    const { data: mission } = await supabase.from("missions").select("id").limit(1).single();
    const day = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
    expect((await supabase.from("mission_attempts").insert([
      { child_id: id, mission_id: mission!.id, outcome: "success", started_at: day(0) },
      { child_id: id, mission_id: mission!.id, outcome: "gentle", started_at: day(1) },
      { child_id: id, mission_id: mission!.id, outcome: "success", started_at: day(40) }, // previous 30 days
    ])).error).toBeNull();
    expect((await supabase.from("wallet_events").insert([
      { child_id: id, kind: "earn", amount: 120, label: "t", created_at: day(0) },
      { child_id: id, kind: "bonus", amount: 30, label: "t", created_at: day(1) },
      { child_id: id, kind: "spend", amount: 50, label: "t", created_at: day(1) },
      { child_id: id, kind: "earn", amount: 999, label: "t", created_at: day(45) },
    ])).error).toBeNull();

    await page.goto("/dashboard/summary");
    await expect(page.getByRole("heading", { name: "Last 30 days summary" })).toBeVisible();
    const tile = (label: string) => page.locator(".db-tile", { hasText: label });
    await expect(tile("Missions played")).toContainText("2");
    await expect(tile("Missions played")).toContainText("▲ 1 more");
    await expect(tile("Coins earned")).toContainText("150"); // 120 + 30, spend and old events excluded
    await expect(tile("Days played")).toContainText("2 of 30");
    await expect(tile("Days played")).toContainText("Current streak: 2 days");
    await expect(page.getByRole("row", { name: /Zara/ })).toContainText("GH₵150");
  });

  test("a family with no play sees the empty summary", async ({ page }) => {
    await newFamily(page);
    await page.goto("/dashboard/summary");
    await expect(page.getByRole("heading", { name: "No play in the last 30 days" })).toBeVisible();
  });

  test("notifications come from real events and can be marked read", async ({ page }) => {
    const { supabase, userId } = await newFamily(page);
    const id = await addChild(supabase, userId, "Kofi", "b7_9");
    await supabase.from("child_badges").insert({ child_id: id, badge_id: (await supabase.from("badges").select("id").limit(1).single()).data!.id });
    await supabase.from("wallet_events").insert([{ child_id: id, kind: "xp", amount: 650, label: "t" }]);

    await page.goto("/dashboard/notifications?tab=unread");
    await expect(page.getByText(/Kofi earned the .* badge/)).toBeVisible();
    await expect(page.getByText("Kofi reached Level 3, Stall Keeper")).toBeVisible();
    await expect(page.getByText("Kofi joined the Pride")).toBeVisible();
    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(page.getByRole("heading", { name: "You are all caught up" })).toBeVisible();
    await page.goto("/dashboard/notifications?tab=milestones");
    await expect(page.getByText("Kofi reached Level 3, Stall Keeper")).toBeVisible();
  });

  test("parent2 (read only) sees their own pages", async ({ page }) => {
    await signInAs(page, "parent2@example.com", "dashboard");
    for (const [url, heading] of [
      ["/dashboard/devices", "Devices and your data"],
      ["/dashboard/summary", /summary/],
      ["/dashboard/notifications", "Notifications"],
      ["/dashboard/settings", "Family settings"],
    ] as const) {
      await page.goto(url);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    }
    await page.goto("/dashboard/settings");
    await expect(page.getByText("parent2@example.com")).toBeVisible();
  });
});

test.describe("session timeout and status pages", () => {
  test("15-minute idle timeout routes to the session-timeout page (shortened for the test)", async ({ page }) => {
    await newFamily(page);
    await page.goto("/dashboard/devices?idle=4");
    await expect(page.getByTestId("idle-banner")).toBeVisible({ timeout: 6000 });
    await expect(page.getByTestId("idle-banner")).toContainText("Are you still there?");
    await expect(page).toHaveURL(/\/dashboard\/session-timeout$/, { timeout: 8000 });
    await expect(page.getByRole("heading", { name: "Your session timed out" })).toBeVisible();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard\/signin/); // really signed out
  });

  test("staying signed in dismisses the idle banner", async ({ page }) => {
    await newFamily(page);
    await page.goto("/dashboard/devices?idle=4");
    await page.getByRole("button", { name: "Stay signed in" }).click({ timeout: 6000 });
    await expect(page.getByTestId("idle-banner")).toHaveCount(0);
  });

  test("forbidden, session-timeout and deleted are public; unknown dashboard pages show the dashboard 404", async ({ page }) => {
    await page.goto("/dashboard/forbidden");
    await expect(page.getByRole("heading", { name: "You do not have access to this page" })).toBeVisible();
    await page.goto("/dashboard/session-timeout");
    await expect(page.getByRole("link", { name: "Sign in again" })).toBeVisible();
    await page.goto("/dashboard/deleted");
    await expect(page.getByRole("link", { name: "Start a new family" })).toBeVisible();

    await newFamily(page);
    const res = await page.goto("/dashboard/nothing-here");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We could not find that page" })).toBeVisible();
    await page.getByLabel("Search the dashboard").fill("devices");
    await expect(page.getByRole("link", { name: "Devices and your data" })).toBeVisible();
  });

  test("every designed variant opens by ?state=", async ({ page }) => {
    await newFamily(page);
    const cases: [string, string | RegExp][] = [
      ["/dashboard/settings?state=pin-error", "Your PIN was not changed."],
      ["/dashboard/devices?state=confirm-signout", "Sign out"],
      ["/dashboard/devices?state=export-ready", "Your export is ready."],
      ["/dashboard/devices?state=confirm-delete", "Delete all family data?"],
      ["/dashboard/devices?state=error", "We could not load your devices"],
      ["/dashboard/summary?state=error", "We could not load your summary"],
      ["/dashboard/summary?state=empty", "No play in the last 30 days"],
      ["/dashboard/notifications?state=empty", "No notifications yet"],
    ];
    for (const [url, text] of cases) {
      await page.goto(url);
      await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    }
    const { supabase, userId } = await newFamily(page);
    const id = await addChild(supabase, userId);
    for (const [state, text] of [
      ["saved", "Saved."],
      ["error", "We could not save"],
    ]) {
      await page.goto(`/dashboard/children/${id}/settings?state=${state}`);
      await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
    }
  });
});
