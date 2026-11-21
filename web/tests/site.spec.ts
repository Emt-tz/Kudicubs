import { expect, test } from "@playwright/test";
import { getMailCode, PARENT_EMAIL } from "./helpers";

// Website specs (area: (site) pages + 404). Run on their own with playwright.site.config.ts, or with the full suite.

test.describe("navigation", () => {
  test("every header and footer link resolves to a page with an h1", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page.locator("header a[href], footer a[href]").evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""));
    const unique = [...new Set(hrefs)].filter((h) => h.startsWith("/"));
    expect(unique).toEqual(expect.arrayContaining(["/", "/how-it-works", "/age-bands", "/safety", "/faq", "/contact", "/family/signin", "/get-the-app", "/privacy", "/terms"]));
    for (const href of unique) {
      const res = await request.get(href.split("#")[0]);
      expect(res.status(), href).toBe(200);
    }
    for (const href of unique) {
      await page.goto(href);
      await expect(page.locator("main h1").first(), href).toBeVisible();
    }
  });

  test("unknown address shows the Kudi 404", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1, name: "Kudi cannot find that page" })).toBeVisible();
    await page.getByRole("link", { name: "Back to home" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Play. Earn. Roar!" })).toBeVisible();
  });

  test("privacy has a children's privacy section reachable from the footer", async ({ page }) => {
    await page.goto("/");
    await page.locator("footer").getByRole("link", { name: "Children's privacy" }).click();
    await expect(page).toHaveURL(/\/privacy#children$/);
    await expect(page.getByRole("heading", { level: 2, name: "Children's privacy" })).toBeVisible();
  });
});

test.describe("contact form", () => {
  test("a valid message is stored and the real reference is shown", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("Playwright Parent");
    await page.getByLabel("Email address").fill("pw-parent@example.com");
    await page.getByLabel("Topic").selectOption("My family's data");
    await page.getByLabel("Message").fill("How do I export my children's progress?");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Thank you, we got it" })).toBeVisible();
    await expect(page.getByText("pw-parent@example.com")).toBeVisible();
    await expect(page.getByRole("main")).toContainText(/Your reference is\s*KC-\d{4}/);
    await page.getByRole("button", { name: "Send another message" }).click();
    await expect(page.getByLabel("Your name")).toHaveValue("");
  });

  test("an empty form lists what to fix and does not send", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    const alert = page.locator("main [role=alert]");
    await expect(alert).toContainText("Please fix 3 things before sending");
    await expect(page.getByText("Your name is missing").last()).toBeVisible();
    await expect(page.getByText("Check the email address, it looks incomplete")).toBeVisible();
    await expect(page.getByText("Write a short message so we can help")).toBeVisible();
    await expect(page.getByLabel("Your name")).toHaveAttribute("aria-invalid", "true");
    await expect(page).toHaveURL(/\/contact$/);
  });

  test("an invalid email or a short message is refused, then fixed", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("Ama's parent");
    await page.getByLabel("Email address").fill("parent@example");
    await page.getByLabel("Message").fill("Hi");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.locator("main [role=alert]")).toContainText("Please fix 2 things before sending");
    await page.getByLabel("Email address").fill("parent@example.com");
    await page.getByLabel("Message").fill("Hello, a real question.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Thank you, we got it" })).toBeVisible();
  });

  test("a whitespace-padded short message is still refused", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Your name").fill("X");
    await page.getByLabel("Email address").fill("x@example.com");
    // whitespace padding is trimmed, leaving a message that is too short
    await page.getByLabel("Message").fill("   ab   ");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Write a short message so we can help")).toBeVisible();
  });

  test("designed states can be opened directly", async ({ page }) => {
    await page.goto("/contact?state=error");
    await expect(page.locator("main [role=alert]")).toContainText("Please fix 3 things before sending");
    await page.goto("/contact?state=sending");
    await expect(page.getByText("Sending your message...")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sending..." })).toBeDisabled();
    await page.goto("/contact?state=sent");
    await expect(page.getByText("KC-4821")).toBeVisible();
  });
});

test.describe("faq", () => {
  test("search filters the questions and ?q= keeps it", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator(".ws-faq summary")).toHaveCount(6);
    await page.getByLabel("Search the questions").fill("PIN");
    await expect(page.getByText("What is the parent PIN for?")).toBeVisible();
    await expect(page.getByText("What ages is KudiCubs for?")).toHaveCount(0);
    await expect(page).toHaveURL(/\/faq\?q=PIN$/);
    await page.getByLabel("Search the questions").fill("real money");
    await expect(page.locator(".ws-faq summary")).toHaveText(["Is any real money involved?"]);
  });

  test("no match shows the empty state and clearing brings everything back", async ({ page }) => {
    await page.goto("/faq?q=zzzz");
    await expect(page.getByRole("heading", { name: 'No answers for "zzzz"' })).toBeVisible();
    await page.getByLabel("Search the questions").fill("refund");
    await expect(page.getByRole("heading", { name: 'No answers for "refund"' })).toBeVisible();
    await expect(page.getByText("there is nothing to refund")).toBeVisible();
    await page.getByRole("button", { name: "Show all questions" }).click();
    await expect(page.locator(".ws-faq summary")).toHaveCount(6);
    await expect(page.getByLabel("Search the questions")).toHaveValue("");
  });
});

test.describe("get the app", () => {
  test("send-me-the-link validates the email, then confirms without storing anything", async ({ page }) => {
    await page.goto("/get-the-app");
    await page.getByLabel("Your email address").fill("nope");
    await page.getByRole("button", { name: "Send me the link" }).click();
    await expect(page.getByText("Check the email address, it looks incomplete")).toBeVisible();
    await page.getByLabel("Your email address").fill("visitor@example.com");
    await page.getByRole("button", { name: "Send me the link" }).click();
    await expect(page.getByText("Sent! Check your inbox.")).toBeVisible();
    await expect(page.getByRole("main")).toContainText("visitor@example.com");
    await expect(page.getByRole("main")).toContainText("/get-the-app");
    await page.getByRole("button", { name: "Use a different email" }).click();
    await expect(page.getByLabel("Your email address")).toHaveValue("");
  });
});

test.describe("family sign-in", () => {
  test("an unknown family shows the designed error", async ({ page }) => {
    await page.goto("/family/signin");
    await page.getByLabel("Parent email address").fill("nobody-here@example.com");
    await page.getByRole("button", { name: "Send me a code" }).click();
    await expect(page.locator("main [role=alert]")).toContainText("We could not find a family with that email");
    await expect(page.getByText("No family found for this address")).toBeVisible();
    await expect(page.getByRole("link", { name: "Get the app" }).last()).toBeVisible();
  });

  test("a malformed email is caught before sending", async ({ page }) => {
    await page.goto("/family/signin");
    await page.getByLabel("Parent email address").fill("parent@exmaple");
    await page.getByRole("button", { name: "Send me a code" }).click();
    await expect(page.locator("main [role=alert]")).toContainText("Check the email address");
  });

  test("designed states can be opened directly", async ({ page }) => {
    await page.goto("/family/signin?state=error");
    await expect(page.locator("main [role=alert]")).toContainText("We could not find a family with that email");
    await page.goto("/family/signin?state=sending");
    await expect(page.getByRole("button", { name: "Sending your code..." })).toBeDisabled();
  });

  test("a real code signs the parent in and opens the dashboard", async ({ page }) => {
    const since = Date.now() - 1000;
    await page.goto("/family/signin");
    await page.getByLabel("Parent email address").fill(PARENT_EMAIL);
    await page.getByRole("button", { name: "Send me a code" }).click();
    await page.getByLabel("6-digit code").fill("000000");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("main [role=alert]")).toContainText("not right");
    await page.getByLabel("6-digit code").fill(await getMailCode(PARENT_EMAIL, { since }));
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});
