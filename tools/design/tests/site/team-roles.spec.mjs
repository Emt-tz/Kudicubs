// 005 T078: Team Console role gating, privacy by design (FR-017, FR-018, research R11), responsiveness and touch sizes.
import { test, expect } from '@playwright/test';
import { watch, expectNoOverflow, VIEWPORTS } from './helpers.mjs';
import { manifest, TEAM, expectTouchSizes, sameOriginOnly } from './dashboard-helpers.mjs';

const NICKS = ['Ama', 'Kofi', 'Zara', 'Tobi'];
const open = async (page, hash) => { await page.goto(`${TEAM}#/${hash}`); await page.waitForSelector('main h1'); };
const asRole = async (page, role, hash) => { await open(page, `sign-in?as=${role}`); if (hash) await open(page, hash); };
const main = (page) => page.locator('main');

test('sign-in: a role chooser built from the sample staff list', async ({ page }) => {
  const w = watch(page);
  await open(page, 'sign-in');
  await expect(page.locator('h1')).toHaveText('Team Console sign-in');
  await expect(page.getByRole('link', { name: 'Continue as Support' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue as Content editor' })).toBeVisible();
  await page.getByRole('link', { name: 'Continue as Support' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'families');
  w.assertClean();
});

test('no role chosen: a protected page sends you to the role chooser', async ({ page }) => {
  await open(page, 'families');
  await expect(page.locator('body')).toHaveAttribute('data-view', 'sign-in');
  await open(page, 'content');
  await expect(page.locator('body')).toHaveAttribute('data-view', 'sign-in');
});

test.describe('support', () => {
  test('families and family show nicknames, age band, region and last active only', async ({ page }) => {
    await asRole(page, 'support', 'families');
    await expect(main(page)).toContainText('Signed in as Support');
    await expect(main(page).locator('table thead th')).toHaveText(['Family', 'Children (nicknames)', 'Default region', 'Last active', 'Open']);
    for (const n of NICKS) await expect(main(page)).toContainText(n);
    await main(page).getByRole('link', { name: /Open/ }).click();
    await expect(page.locator('body')).toHaveAttribute('data-view', 'family');
    await expect(main(page).locator('table th[scope="col"]')).toHaveText(['Nickname', 'Age band', 'Region', 'Last active']);
    await expect(main(page).locator('tbody tr')).toHaveCount(4);
    const kofi = main(page).locator('tr[data-child="Kofi"]');
    await expect(kofi).toContainText('7 to 9');
    await expect(kofi).toContainText('Nigeria');
    await expect(kofi).toContainText(/ago|Today|Yesterday/);
    const text = await main(page).innerText();
    expect(text).not.toMatch(/@/);                                                  // no email
    expect(text).not.toMatch(/example\.com|parent phone|family tablet|\bcoins\b|\bbadges?\b|\bxp\b/i);   // no emails, devices or events detail
    expect(await page.content()).not.toContain('parent@example.com');
  });
  test('families search: match and empty-search state', async ({ page }) => {
    await asRole(page, 'support', 'families');
    await page.getByLabel('Search by nickname or family').fill('kofi');
    await expect(main(page).locator('tbody tr')).toHaveCount(1);
    await page.getByLabel('Search by nickname or family').fill('zzz');
    await expect(main(page).locator('[data-empty="search"]')).toContainText('No families match');
  });
  test('families loading state', async ({ page }) => {
    await asRole(page, 'support', 'families?state=loading');
    await expect(page.getByRole('status')).toContainText('Loading');
  });
  test('support cannot open content or mission: no-access with a way back', async ({ page }) => {
    for (const id of ['content', 'mission?m=lost-coins']) {
      await asRole(page, 'support', id);
      await expect(page.locator('body')).toHaveAttribute('data-view', 'no-access');
      await expect(page.locator('h1')).toHaveText('You do not have access to this page');
      await expect(main(page)).toContainText('Support role cannot open');
      await expect(main(page).locator('table')).toHaveCount(0);
      await main(page).getByRole('link', { name: 'Back to Families' }).click();
      await expect(page.locator('body')).toHaveAttribute('data-view', 'families');
    }
  });
});

test.describe('content editor', () => {
  test('content lists the four missions with age band, regions and voice status', async ({ page }) => {
    await asRole(page, 'content', 'content');
    const rows = main(page).locator('tbody tr');
    await expect(rows).toHaveCount(4);
    const want = [['The Lost Coins', '4 to 6'], ['The Snack Stall', '7 to 9'], ['The Lemonade Stand', '10 to 12'], ['Side Hustle: first sale', '13 to 15']];
    for (const [i, [title, band]] of want.entries()) { await expect(rows.nth(i)).toContainText(title); await expect(rows.nth(i)).toContainText(band); await expect(rows.nth(i)).toContainText('gh, ng, uk'); }
    // 4 to 6 status comes from the app's audio manifest (gh scratch voice, others pending); the rest are labelled sample values
    await expect(rows.nth(0).locator('[data-voice]')).toHaveText(['Scratch voice', 'Pending', 'Pending']);
    await expect(rows.nth(1).locator('[data-voice]')).toHaveText(['Pending', 'Pending', 'Pending']);
    await expect(main(page)).toContainText('sample value');
  });
  test('content filters and filtered-empty state', async ({ page }) => {
    await asRole(page, 'content', 'content');
    await page.getByLabel('Age band').selectOption('b10_12');
    await expect(main(page).locator('tbody tr')).toHaveCount(1);
    await page.getByLabel('Search missions').fill('zzz');
    await expect(main(page).locator('[data-empty="filter"]')).toContainText('No missions match');
  });
  test('mission view: age band, regions and voice status by region', async ({ page }) => {
    await asRole(page, 'content', 'content');
    await main(page).getByRole('link', { name: /Open The Lost Coins/ }).click();
    await expect(page.locator('h1')).toHaveText('The Lost Coins');
    await expect(main(page)).toContainText('Age band: 4 to 6');
    await expect(main(page).locator('tr[data-region="gh"]')).toContainText('Scratch voice');
    await expect(main(page).locator('tr[data-region="gh"]')).toContainText('146 scratch');
    await expect(main(page).locator('tr[data-region="uk"]')).toContainText('Pending');
  });
  test('content editor cannot open families or family', async ({ page }) => {
    for (const id of ['families', 'family']) {
      await asRole(page, 'content', id);
      await expect(page.locator('body')).toHaveAttribute('data-view', 'no-access');
      await expect(main(page)).toContainText('Content editor role cannot open');
      await expect(main(page).locator('tr[data-child]')).toHaveCount(0);
      await main(page).getByRole('link', { name: 'Back to Content' }).click();
      await expect(page.locator('body')).toHaveAttribute('data-view', 'content');
    }
  });
});

test('reviewer menu on every view switches role and forces states', async ({ page }) => {
  for (const s of manifest.team.screens) { await asRole(page, 'support'); await open(page, s.id); await expect(page.locator('#kd-rev-btn'), s.id).toBeVisible(); }
  await asRole(page, 'support', 'families');
  await page.locator('#kd-rev-btn').click();
  await page.locator('#kd-rev').getByRole('link', { name: 'Sign in as Content editor' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'content');
});

test('one h1 per view, noindex, same origin only, no cookies, switch role clears the role', async ({ page, context }) => {
  const net = sameOriginOnly(page);
  for (const s of manifest.team.screens) { await asRole(page, 'support'); await open(page, s.id); await expect(page.locator('h1'), s.id).toHaveCount(1); }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await asRole(page, 'support', 'families');
  await page.locator('#kd-side').getByRole('link', { name: 'Switch role' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-view', 'sign-in');
  await open(page, 'families');
  await expect(page.locator('body')).toHaveAttribute('data-view', 'sign-in');
  await net.assert(context);
});

const roleFor = (id) => (id === 'content' || id === 'mission' ? 'content' : 'support');
for (const [vp, size] of Object.entries(VIEWPORTS)) {
  test.describe(`${vp} ${size.width}px`, () => {
    test.use({ viewport: size });
    for (const s of manifest.team.screens) {
      test(`no horizontal overflow and 44px targets: ${s.id}`, async ({ page }) => {
        const w = watch(page);
        for (const st of s.states) {
          await asRole(page, roleFor(s.id));
          await open(page, `${s.id}?state=${st}${s.id === 'no-access' ? '&from=content' : ''}`);
          await expectNoOverflow(page, `${s.id}/${st} @${size.width}`);
          await expectTouchSizes(page, `${s.id}/${st} @${size.width}`);
        }
        w.assertClean();
      });
    }
  });
}
