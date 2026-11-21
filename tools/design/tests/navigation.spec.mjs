// E3 (004 FR-003–FR-005, FR-043) + the load-failure screen (FR-051, A9).
// Break it: drop guard G1 in KC.guard AND use a push (not replace) when leaving Reward (either one alone still
// protects Back); make kcBootFail a no-op in index.html.
import { test, expect } from '@playwright/test';
import { noTts, fresh, guard, onboard, playLostCoins, screenIs } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

const screen = (page) => page.evaluate(() => document.getElementById('kc-screen').getAttribute('data-screen'));
const totals = (page) => page.evaluate(() => { const v = KC.view(); return { coins: v.coins, xp: v.xp, badges: v.badges.length, history: v.history.length, events: KC.state.events.length }; });

test('no Back button on Home, Wallet or Progress (FR-003)', async ({ page }) => {
  await page.goto('./#/welcome');
  for (const id of ['home', 'wallet', 'progress']) {
    await page.evaluate((s) => KC.go(s), id);
    await expect(page.locator('#kc-back')).toBeHidden();
  }
  await page.evaluate(() => KC.go('age-select'));
  await expect(page.locator('#kc-back')).toBeVisible();
});

test('Back never returns to Reward, a Result screen or the parent gate (FR-004)', async ({ page }) => {
  const g = guard(page);
  await page.goto('./#/welcome');
  await onboard(page, null);
  await page.goBack(); await page.waitForTimeout(250);
  expect(await screen(page), 'Back from Home after the gate').not.toBe('parent-gate');
  await page.evaluate(() => KC.go('home'));
  await playLostCoins(page, null, 'save', { check: false });
  await page.click('[data-primary]'); await screenIs(page, 'home');            // Reward → Home
  const visited = [];
  for (let i = 0; i < 8; i++) {
    await page.goBack(); await page.waitForTimeout(250);
    const s = await screen(page);
    visited.push(s);
    expect(['reward', 'result-save', 'result-spend', 'parent-gate'], `Back #${i + 1} landed on ${s}`).not.toContain(s);
  }
  const t = await totals(page);
  expect(t.coins).toBe(40);                                                     // nothing granted again by going back
  g.expectClean();
});

test('Back from Summary skips the Result screen', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.go('home'); });
  await page.click('[data-primary]'); await screenIs(page, 'mission-intro');
  await page.evaluate(() => { KC.resetRun(); KC.run.reached = KC.MISSION.indexOf('decision'); KC.state.lostCoins.choice = 'save'; KC.go('decision'); });
  await page.click('[data-choice=save]'); await page.click('[data-primary]'); await screenIs(page, 'result-save');
  await page.click('[data-primary]'); await screenIs(page, 'summary');
  await page.goBack(); await page.waitForTimeout(250);
  expect(await screen(page)).toBe('decision');
});

test('Reward and Result opened directly, or Reward refreshed, grant nothing and go Home (FR-005)', async ({ page }) => {
  await page.goto('./#/welcome');
  const zero = await totals(page);
  for (const id of ['reward', 'result-save', 'result-spend']) {
    await page.goto(`./#/${id}`); await page.waitForTimeout(250);
    expect(await screen(page), `#/${id} opened directly`).toBe('home');
    expect(await totals(page)).toEqual(zero);
  }
  await page.goto('./#/welcome');
  await onboard(page, null);
  await playLostCoins(page, null, 'spend', { check: false });
  const after = await totals(page);
  await page.reload(); await page.waitForTimeout(400);
  expect(await screen(page), 'Reward refreshed').toBe('home');
  expect(await totals(page)).toEqual(after);
  await page.evaluate(() => { location.hash = '#/reward'; }); await page.waitForTimeout(300);
  expect(await screen(page), 'hash set to reward').toBe('home');
  expect(await totals(page)).toEqual(after);
});

for (const file of ['assets/data/mock-data.js', 'assets/data/build-info.js', 'assets/data/regions.js', 'assets/data/audio-manifest.js',
  'assets/app.js', 'assets/activities.js', 'assets/celebrate.js', 'assets/screens.js',
  'assets/missions/band-7-9.js', 'assets/missions/band-10-12.js', 'assets/missions/band-13-15.js', 'assets/screens-bands.js', 'assets/screens-parent.js']) {
  test(`load failure: ${file} blocked → Kudi "Tap to try again"; tapping with the file back starts the app (FR-051)`, async ({ page }) => {
    const pattern = '**/' + file;
    await page.route(pattern, (r) => r.abort());
    await page.goto('./#/welcome');
    const panel = page.locator('#kc-boot-fail');
    await expect(panel).toBeVisible();
    await expect(page.locator('#kc-phone')).toBeHidden();
    expect(await page.evaluate(() => [document.getElementById('kc-screen').getAttribute('data-screen'), document.body.getAttribute('data-last-line')]),
      'the app must not start behind the panel').toEqual([null, null]);
    const box = await panel.locator('button').boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(64); expect(box.height).toBeGreaterThanOrEqual(64);
    await page.waitForTimeout(3000);                                            // never reloads by itself
    await expect(panel).toBeVisible();
    await page.unroute(pattern);
    await panel.locator('button').click();
    await screenIs(page, 'welcome');
    await expect(page.locator('#kc-boot-fail')).toBeHidden();
  });
}

test('load failure: an error while starting shows the panel too', async ({ page }) => {
  await page.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { window.KC.start = () => { throw new Error('boom'); }; }, { capture: true, once: true }); });
  await page.goto('./#/welcome');
  await expect(page.locator('#kc-boot-fail')).toBeVisible();
});
