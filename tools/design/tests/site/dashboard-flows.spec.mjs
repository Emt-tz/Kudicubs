// 005 T073: Parent Dashboard flows, derived numbers, currencies, responsiveness and touch sizes (FR-015, FR-016, SC-008).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../lib.mjs';
import { watch, expectNoOverflow, VIEWPORTS } from './helpers.mjs';
import { manifest, PARENT, expectTouchSizes, sameOriginOnly } from './dashboard-helpers.mjs';

const go = async (page, hash) => { await page.goto(`${PARENT}#/${hash}`); await page.waitForSelector('main h1'); };
const main = (page) => page.locator('main');

test.describe('sign-in and code (scripted demo, research R10)', () => {
  test('sign-in default, error, expired, loading', async ({ page }) => {
    const w = watch(page);
    await go(page, 'sign-in');
    await expect(page.locator('h1')).toHaveText(/Sign in/);
    await expect(page.getByLabel('Parent email')).toBeVisible();
    await expect(main(page)).toContainText('123456');               // the demo code is in a labelled reviewer note
    await expect(main(page).locator('.kd-note')).toContainText('Reviewer note');
    await page.getByLabel('Parent email').fill('not-an-email');
    await page.getByRole('button', { name: 'Send me a code' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-state', 'error');
    await expect(page.getByRole('alert')).toContainText('could not send a code');
    await go(page, 'sign-in?state=expired');
    await expect(page.getByRole('alert')).toContainText('expired');
    await go(page, 'sign-in?state=loading');
    await expect(page.getByRole('button', { name: /Sending code/ })).toBeDisabled();
    await expect(main(page)).toHaveAttribute('aria-busy', 'true');
    w.assertClean();
  });

  test('sample email and demo code sign in; a wrong code errors; resend confirms', async ({ page }) => {
    const w = watch(page);
    await go(page, 'sign-in');
    await page.getByLabel('Parent email').fill('parent@example.com');
    await page.getByRole('button', { name: 'Send me a code' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'code');
    await expect(main(page)).toContainText('parent@example.com');
    await page.getByLabel('Six-digit code').fill('000000');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-state', 'error');
    await expect(page.getByRole('alert')).toContainText('not right');
    await page.getByRole('button', { name: 'Send a new code' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'new code was sent' })).toBeVisible();
    await page.getByLabel('Six-digit code').fill('123456');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'overview');
    await expect(page.locator('h1')).toHaveText('Your family');
    await expect(main(page).locator('[data-unsigned]')).toHaveCount(0);
    w.assertClean();
  });

  test('the website sign-in link target #/code works on its own', async ({ page }) => {
    await page.goto(`${PARENT}#/code`);
    await expect(page.locator('h1')).toHaveText('Enter your code');
    await expect(page.getByLabel('Six-digit code')).toBeVisible();
  });
});

test.describe('overview', () => {
  test('default: every child with age band, region and own-currency money; switcher', async ({ page }) => {
    await go(page, 'overview');
    for (const n of ['Ama', 'Kofi', 'Zara', 'Tobi']) await expect(main(page).locator(`article[data-child="${n}"]`)).toBeVisible();
    const kofi = main(page).locator('article[data-child="Kofi"]');
    await expect(kofi).toContainText('Age band: 7 to 9');
    await expect(kofi).toContainText('Nigeria');
    await expect(kofi).toContainText('₦');
    await expect(main(page).locator('article[data-child="Zara"]')).toContainText('£');
    await expect(main(page).locator('article[data-child="Ama"]')).toContainText('GH₵');
    await main(page).getByRole('navigation', { name: 'Choose a child' }).getByRole('link', { name: 'Zara' }).click();
    await expect(main(page).locator('section[aria-labelledby="glance"]')).toContainText('Zara at a glance');
    await expect(main(page).locator('[data-k="coins"]').first()).toContainText('£');
  });
  test('new-family empty, loading and error states', async ({ page }) => {
    await go(page, 'overview?state=empty');
    await expect(main(page).locator('[data-empty="new-family"]')).toContainText('No children yet');
    await expect(main(page).locator('article')).toHaveCount(0);
    await go(page, 'overview?state=loading');
    await expect(page.getByRole('status')).toContainText('Loading');
    await go(page, 'overview?state=error');
    await expect(page.getByRole('alert')).toContainText('could not load');
    await page.getByRole('link', { name: 'Try again' }).click();
    await expect(main(page).locator('article[data-child="Ama"]')).toBeVisible();
  });
});

test.describe('child, skills, badges, activity', () => {
  const CUR = { Ama: 'GH₵', Kofi: '₦', Zara: '£', Tobi: 'GH₵' };
  for (const [name, sym] of Object.entries(CUR)) {
    test(`${name}: money is shown in the child's own currency (${sym})`, async ({ page }) => {
      await go(page, `child?c=${name}`);
      await expect(page.locator('h1')).toContainText(name);
      for (const k of ['coins', 'savings']) await expect(main(page).locator(`[data-k="${k}"]`)).toContainText(sym);
      const other = Object.values(CUR).filter((s) => s !== sym);
      const text = await main(page).locator('.kd-stats').innerText();
      for (const o of other) if (o !== sym) expect(text).not.toContain(o);
      await go(page, `activity?c=${name}`);
      await expect(main(page).locator('table[aria-label="Money history"]')).toContainText(sym);
    });
  }
  test('Ama: derived numbers equal the app sample (120 coins, 40 savings, 360 xp, level 2, 3 badges)', async ({ page }) => {
    await go(page, 'child?c=Ama');
    const d = await page.evaluate(() => { const v = window.KCDerive.derive(window.KC_FAMILY.children[0].events); return { coins: v.coins, savings: v.savings, xp: v.xp, level: v.level.n, badges: v.badges.length, name: v.level.name }; });
    expect(d).toEqual({ coins: 120, savings: 40, xp: 360, level: 2, badges: 3, name: 'Market Helper' });
    await expect(main(page).locator('[data-k="coins"]')).toHaveText('GH₵120');
    await expect(main(page).locator('[data-k="savings"]')).toHaveText('GH₵40');
    await expect(main(page).locator('[data-k="xp"]')).toHaveText('360');
    await expect(main(page).locator('[data-k="level"]')).toHaveText('Level 2');
    await expect(main(page).locator('[data-k="badges"]')).toHaveText('3');
    await expect(main(page).locator('svg.kd-ring')).toHaveAttribute('aria-label', /Level 2, Market Helper/);
  });
  test('no-play-yet empty state', async ({ page }) => {
    await go(page, 'child?c=Ama&state=no-play-yet');
    await expect(main(page).locator('[data-empty="no-play"]')).toContainText('No play yet');
    await expect(main(page).locator('[data-k="coins"]')).toHaveText('GH₵0');
  });
  test('skills chart has a text alternative and a table; Ama strongest is Know', async ({ page }) => {
    await go(page, 'skills?c=Ama');
    await expect(main(page).locator('[role="img"][aria-label^="Skills by pillar for Ama"]')).toHaveAttribute('aria-label', /Know 30 percent.*Understand 20 percent.*Decide 10 percent.*Invest 0 percent.*Share 10 percent/);
    await expect(main(page).locator('table[aria-label="Skills table"] tbody tr')).toHaveCount(5);
    await go(page, 'skills?c=Ama&state=empty');
    await expect(main(page).locator('[data-empty]')).toBeVisible();
  });
  test('badges: Ama has 3 of 8; empty state', async ({ page }) => {
    await go(page, 'badges?c=Ama');
    await expect(main(page).locator('li[data-earned="true"]')).toHaveCount(3);
    await expect(main(page).locator('li[data-badge]')).toHaveCount(8);
    await go(page, 'badges?c=Ama&state=empty');
    await expect(main(page).locator('[data-empty]')).toContainText('No badges yet');
  });
  test('activity strip has a text alternative and a day table', async ({ page }) => {
    await go(page, 'activity?c=Ama');
    await expect(main(page).locator('.kd-strip[role="img"]')).toHaveAttribute('aria-label', /last 7 days for Ama/);
    await expect(main(page).locator('table[aria-label="Last 7 days"] tbody tr')).toHaveCount(7);
    await go(page, 'activity?c=Ama&state=empty');
    await expect(main(page).locator('[data-empty]')).toBeVisible();
  });
});

test.describe('settings, devices, data, summary, signed-out', () => {
  test('child settings: save, then age band change needs confirmation', async ({ page }) => {
    await go(page, 'settings-child?c=Kofi');
    await page.getByLabel('Region').selectOption('uk');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-state', 'saved');
    await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();
    await go(page, 'child?c=Kofi');
    await expect(main(page).locator('[data-k="coins"]')).toContainText('£');              // region change flows to the currency
    await go(page, 'settings-child?c=Kofi');
    await page.getByLabel('Age band').selectOption('b10_12');
    await page.getByRole('button', { name: 'Save changes' }).click();
    const dlg = page.getByRole('dialog', { name: 'Change the age band?' });
    await expect(dlg).toBeVisible();
    await dlg.getByRole('button', { name: /Keep/ }).click();
    await expect(dlg).toHaveCount(0);
    await expect(page.getByLabel('Age band')).toHaveValue('b7_9');
    await page.getByLabel('Age band').selectOption('b10_12');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Yes, change it' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-state', 'saved');
    await expect(page.getByLabel('Age band')).toHaveValue('b10_12');
  });
  test('child settings: nickname must not be an email; confirm-band state opens the dialog', async ({ page }) => {
    await go(page, 'settings-child?c=Ama');
    await page.getByLabel('Nickname').fill('ama@example.com');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('alert')).toContainText('nickname');
    await go(page, 'settings-child?c=Ama&state=confirm-band');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
  test('family settings: saved and PIN error', async ({ page }) => {
    await go(page, 'settings-family');
    await expect(page.getByLabel('Parent email')).toHaveValue('parent@example.com');
    await page.getByLabel('New parent PIN').fill('12');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('alert')).toContainText('four digits');
    await page.getByLabel('New parent PIN').fill('1234');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-state', 'saved');
    await expect(page.getByLabel('New parent PIN')).toHaveValue('');                       // the PIN is never kept
  });
  test('devices: list and sign-out confirmation', async ({ page }) => {
    await go(page, 'devices');
    await expect(main(page).locator('tbody tr')).toHaveCount(2);
    await expect(main(page)).toContainText('Family tablet');
    await page.getByRole('button', { name: /Sign out Family tablet/ }).click();
    const dlg = page.getByRole('dialog', { name: /Sign out Family tablet/ });
    await expect(dlg).toBeVisible();
    await dlg.getByRole('button', { name: 'Keep it signed in' }).click();
    await expect(main(page).locator('tbody tr')).toHaveCount(2);
    await page.getByRole('button', { name: /Sign out Family tablet/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Sign out device' }).click();
    await expect(main(page).locator('tbody tr')).toHaveCount(1);
    await expect(main(page)).not.toContainText('Family tablet');
  });
  test('data: export ready, delete confirm needs a tick, deleted', async ({ page }) => {
    await go(page, 'data');
    await page.getByRole('link', { name: 'Prepare my export' }).click();
    await expect(page.locator('#export-ready')).toBeVisible();
    const dl = page.getByRole('link', { name: 'Download the file' });
    await expect(dl).toHaveAttribute('download', /\.json$/);
    const body = await page.evaluate(async () => (await fetch(document.querySelector('#dl').href)).text());
    expect(JSON.parse(body).children.map((c) => c.nickname)).toEqual(['Ama', 'Kofi', 'Zara', 'Tobi']);
    expect(body).not.toMatch(/@/);
    await page.getByRole('link', { name: 'Delete my data' }).click();
    const dlg = page.getByRole('dialog', { name: 'Delete all family data?' });
    await expect(dlg).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Delete everything' })).toBeDisabled();
    await dlg.getByLabel('I understand this cannot be undone').check();
    await dlg.getByRole('button', { name: 'Delete everything' }).click();
    await expect(page.locator('h1')).toHaveText('Your data was deleted');
    await expect(page.getByRole('status')).toContainText('nothing was really removed');
  });
  test('monthly summary and signed-out', async ({ page }) => {
    await go(page, 'monthly-summary');
    await expect(main(page).locator('tbody tr')).toHaveCount(4);
    await expect(main(page).locator('tr[data-child="Kofi"]')).toContainText('₦');
    await go(page, 'monthly-summary?state=empty');
    await expect(main(page).locator('[data-empty]')).toBeVisible();
    await go(page, 'signed-out');
    await expect(page.locator('h1')).toHaveText('You are signed out');
    await page.getByRole('link', { name: 'Sign in again' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'sign-in');
  });
});

test.describe('shell, reviewer menu and navigation', () => {
  test('reviewer menu is on every view and opens a panel with the forced states', async ({ page }) => {
    for (const s of manifest.parent.screens) {
      await go(page, s.id);
      await expect(page.locator('#kd-rev-btn'), s.id).toBeVisible();
    }
    await go(page, 'overview');
    await page.locator('#kd-rev-btn').click();
    const panel = page.locator('#kd-rev');
    await expect(panel).toBeVisible();
    for (const t of ['Sign-in: expired code', 'Code: resend sent', 'Overview: new family (empty)', 'Overview: loading', 'Overview: error']) await expect(panel.getByRole('link', { name: t })).toBeVisible();
    await expect(panel).toContainText('Viewport help');
    await panel.getByRole('link', { name: 'Overview: new family (empty)' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-state', 'empty');
    await expect(panel).toBeHidden();
  });
  test('side navigation at 1280, bottom navigation with More at 320; every view reachable', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await go(page, 'overview');
    await expect(page.locator('#kd-side')).toBeVisible();
    await expect(page.locator('#kd-bottom')).toBeHidden();
    const side = await page.locator('#kd-side a').count();
    await page.setViewportSize(VIEWPORTS.phone);
    await expect(page.locator('#kd-side')).toBeHidden();
    await expect(page.locator('#kd-bottom')).toBeVisible();
    await page.getByRole('button', { name: 'More' }).click();
    const more = await page.locator('#kd-more a').count();
    const prim = await page.locator('#kd-bottom a').count();
    expect(prim + more).toBe(side);
    await page.locator('#kd-more').getByRole('link', { name: 'Your data' }).click();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'data');
  });
  test('one h1 per view, document language, noindex, no external requests, no cookies', async ({ page, context }) => {
    const net = sameOriginOnly(page);
    for (const s of manifest.parent.screens) {
      await go(page, s.id);
      await expect(page.locator('h1'), s.id).toHaveCount(1);
    }
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('a.kc-skip')).toHaveAttribute('href', '#main');
    await net.assert(context);
  });
  test('the entrance chooser links to both consoles', async ({ page }) => {
    const w = watch(page);
    await page.goto('dashboard/index.html');
    await expect(page.locator('h1')).toHaveText('Choose a dashboard');
    await expect(page.getByRole('link', { name: 'Open the Parent Dashboard' })).toHaveAttribute('href', 'parent/index.html#/sign-in');
    await expect(page.getByRole('link', { name: 'Open the Team Console' })).toHaveAttribute('href', 'team/index.html#/sign-in');
    w.assertClean();
  });
});

for (const [vp, size] of Object.entries(VIEWPORTS)) {
  test.describe(`${vp} ${size.width}px`, () => {
    test.use({ viewport: size });
    for (const s of manifest.parent.screens) {
      test(`no horizontal overflow and 44px targets: ${s.id}`, async ({ page }) => {
        const w = watch(page);
        for (const st of s.states) {
          await go(page, `${s.id}?c=Zara&state=${st}`);
          await expectNoOverflow(page, `${s.id}/${st} @${size.width}`);
          await expectTouchSizes(page, `${s.id}/${st} @${size.width}`);
        }
        w.assertClean();
      });
    }
  });
}

test('consistency: Ama in the app sample equals Ama in the sample family', async ({ page }) => {
  const mock = readFileSync(path.join(ROOT, 'prototype/assets/data/mock-data.js'), 'utf8');
  const block = mock.slice(mock.indexOf('KC.sample = {'));
  const app = [...block.matchAll(/\{ t: '(\w+)', n: (\d+), ago: (\d+), label: '([\w.]+)'(?:, badge: '([\w.]+)')?(?:, pillar: '(\w+)')? \}/g)]
    .map((m) => ({ t: m[1], n: +m[2], ago: +m[3], label: m[4], ...(m[5] ? { badge: m[5] } : {}), ...(m[6] ? { pillar: m[6] } : {}) }));
  expect(app.length).toBeGreaterThan(10);
  await go(page, 'overview');
  const fam = await page.evaluate(() => window.KC_FAMILY.children.find((c) => c.nickname === 'Ama').events);
  expect(fam).toEqual(app);
  const levels = [...mock.matchAll(/xpFrom: (\d+)/g)].map((m) => +m[1]);
  expect(await page.evaluate(() => window.KCDerive.LEVELS.map((l) => l.xpFrom))).toEqual(levels);
});
