// T043 / T047 / T056 — specs/002-ux-prototype/contracts/screen-flow.md §4 assertions 1–9.
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const URL = pathToFileURL(path.join(ROOT, 'prototype/index.html')).href;

const COMPONENTS = new Set(['primary-button', 'secondary-button', 'icon-button', 'choice-card', 'speaker-cue', 'kudi-bubble', 'illustration',
  'coin-counter', 'xp-bar', 'level-badge', 'streak-daily', 'badge-tile', 'jar', 'coin-token', 'progress-dots', 'bottom-nav', 'region-coin-set',
  'parent-gate-pad', 'pin-pad', 'action-result', 'bar-chart', 'level-path-node', 'celebration-overlay', 'gentle-hint', 'reviewer-menu']);
const REQUIRED_SCREENS = ['welcome', 'age-select', 'avatar', 'parent-gate', 'home', 'mission-intro', 'activity-find', 'activity-sort',
  'activity-count', 'decision', 'result-save', 'summary', 'reward', 'wallet', 'progress'];
const SYMBOLS = /GH₵|₦|£/;

/** Assertions that hold on every screen state (2, 3, 4, traceability, name). Returns the screen id. */
async function audit(page) {
  return page.evaluate(({ components }) => {
    const root = document.getElementById('kc-screen');
    const id = root.getAttribute('data-screen');
    const child = root.getAttribute('data-audience') === 'child';
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const problems = [];
    // 2. exactly one main action at a time on child screens
    if (child) {
      const n = [...root.querySelectorAll('[data-primary]')].filter(visible).length + [...root.querySelectorAll('[data-primary-group]')].filter(visible).length;
      if (n !== 1) problems.push(`${id}: ${n} main actions (want exactly 1)`);
    }
    // 3. never a failure state
    if (document.querySelector('[data-failure]')) problems.push(`${id}: data-failure present`);
    // 4. touch targets
    const phone = document.getElementById('kc-phone');
    phone.querySelectorAll('button, [role=button], [data-component=choice-card]').forEach((el) => {
      if (!visible(el) || el.closest('[hidden]') || el.getAttribute('aria-disabled') === 'true' || el.disabled) return;
      const r = el.getBoundingClientRect();
      if (r.width < 47.5 || r.height < 47.5) problems.push(`${id}: touch target ${Math.round(r.width)}×${Math.round(r.height)} < 48 (${el.outerHTML.slice(0, 80)})`);
      if (child && el.hasAttribute('data-primary') && (r.width < 63.5 || r.height < 63.5)) problems.push(`${id}: main action ${Math.round(r.width)}×${Math.round(r.height)} < 64`);
    });
    // traceability (T047): every visible control and image belongs to a listed component
    phone.querySelectorAll('button, [role=button], img, svg').forEach((el) => {
      if (!visible(el) || el.closest('[hidden]')) return;
      const host = el.closest('[data-component]');
      if (!host) problems.push(`${id}: ${el.tagName.toLowerCase()} outside any data-component (${el.outerHTML.slice(0, 80)})`);
    });
    phone.querySelectorAll('[data-component]').forEach((el) => {
      const c = el.getAttribute('data-component');
      if (!components.includes(c)) problems.push(`${id}: unknown component "${c}"`);
    });
    // 9. old name never visible
    if (/bizkid/i.test(document.body.innerText)) problems.push(`${id}: old product name visible`);
    return { id, problems };
  }, { components: [...COMPONENTS] });
}

async function step(page, seen) {
  const { id, problems } = await audit(page);
  expect(problems, problems.join('\n')).toEqual([]);
  seen.add(id);
  return id;
}

/** What a child would see in the Wallet: balance, savings and the visible history list. */
async function walletView(page) {
  await page.click('[data-route=wallet]');
  return page.evaluate(() => ({
    coins: KC.state.coins, savings: KC.state.savings, items: KC.state.items.slice(), events: KC.state.events.length,
    shown: [...document.querySelectorAll('#kc-screen .kc-panel [data-money]')].map((m) => m.innerText.trim()),
    history: [...document.querySelectorAll('#kc-screen .kc-history li')].map((li) => li.innerText.replace(/\s+/g, ' ').trim()),
  }));
}

async function passGate(page) {
  const hold = page.locator('.kc-hold');
  const box = await hold.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(3200); await page.mouse.up();
  const q = await page.getAttribute('[data-question]', 'data-question');
  const [a, b] = q.split('x').map(Number);
  for (const d of String(a * b)) await page.click(`[data-component=parent-gate-pad] button:text-is("${d}")`);
  await page.click('[data-primary]');
  for (const d of '2580') await page.click(`[data-component=pin-pad] button:text-is("${d}")`);
  await page.click('[data-primary]');
  await page.click('[data-primary]'); // region (Ghana preselected)
  await page.fill('input[type=email]', 'parent@example.com');
  await page.click('[data-primary]');
  await page.waitForFunction(() => document.getElementById('kc-screen').getAttribute('data-screen') === 'home', null, { timeout: 5000 });
}

/** Plays The Lost Coins from Home to Reward. Sorting uses tap-coin-then-tap-jar (contract §4 note). */
async function playLostCoins(page, seen, choice, { wrongOnce = false, switchFrom = null } = {}) {
  await page.click('[data-primary]'); await step(page, seen);                       // → mission-intro
  await page.click('[data-primary]'); await step(page, seen);                       // → activity-find
  for (let i = 0; i < 8; i++) {
    await page.locator('.kc-scene [data-component=coin-token]:not(.is-found)').first().click();
    if (i < 7) await step(page, seen);
  }
  await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);                       // → activity-sort
  if (wrongOnce) {
    const c = page.locator('.kc-tray [data-component=coin-token]').first();
    const d = await c.getAttribute('data-denom');
    await c.click(); await page.locator(`[data-component=jar]:not([data-jar="${d}"])`).first().click();
    await step(page, seen);
  }
  while (await page.locator('.kc-tray [data-component=coin-token]').count()) {
    const c = page.locator('.kc-tray [data-component=coin-token]').first();
    const d = await c.getAttribute('data-denom');
    await c.click(); await page.click(`[data-component=jar][data-jar="${d}"]`);
  }
  await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);                       // → activity-count
  for (let j = 0; j < 3; j++) {
    const g = page.locator('[data-primary-group] [data-component=coin-token]:not(.is-counted)');
    while (await g.count()) await g.first().click();
    await page.waitForTimeout(650);
    await step(page, seen);
  }
  await page.click('[data-primary]'); await step(page, seen);                       // → decision
  if (switchFrom) {                                                                 // change of mind: pick, see the result, go back, pick again
    await page.click(`[data-choice=${switchFrom}]`); await step(page, seen);
    await page.click('[data-primary]'); await step(page, seen);                     // → result-<switchFrom>
    await page.click('#kc-back');
    await page.waitForFunction(() => document.getElementById('kc-screen').getAttribute('data-screen') === 'decision');
    await step(page, seen);
  }
  await page.click(`[data-choice=${choice}]`); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);                       // → result-*
  await page.click('[data-primary]'); await step(page, seen);                       // → summary
  await page.click('[data-primary]'); await step(page, seen);                       // → reward
}

test('full 4–6 journey: one main action, no failure, touch sizes, traceability, idle hint, offline-only (assertions 1–5, 7–9)', async ({ page }) => {
  const offOrigin = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:')) offOrigin.push(r.url()); });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const seen = new Set();

  await page.goto(URL + '#/welcome');
  await step(page, seen);
  await expect(page.locator('#kc-back')).toBeHidden();
  await page.click('[data-primary]'); await step(page, seen);                       // age-select
  await page.click('[data-component=choice-card]:not(.is-locked)'); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);                       // avatar
  await page.locator('[data-primary-group] [data-component=choice-card]').first().click(); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);                       // parent-gate
  await passGate(page); await step(page, seen);                                     // home

  // 5. idle hint after 6.5 s on Home
  await page.waitForTimeout(6500);
  await expect(page.locator('#kc-screen')).toHaveAttribute('data-hint-active', /\d/);

  // First run: Save path, perfect sort → full first-completion reward
  const before = await page.evaluate(() => ({ coins: KC.state.coins, xp: KC.state.xp }));
  await playLostCoins(page, seen, 'save');
  const first = await page.evaluate(() => KC.state.lastReward);
  expect(first.replay).toBe(false);
  expect(first.coins).toBe(40);   // 30 first reward + 10 perfect-sort bonus
  expect(first.xp).toBe(50);
  expect(first.badges).toEqual(['badge.hard_worker', 'badge.smart_sorter']);
  await page.click('[data-primary]'); await step(page, seen);                       // home
  const after = await page.evaluate(() => ({ coins: KC.state.coins, xp: KC.state.xp, savings: KC.state.savings }));
  expect(after.xp - before.xp).toBe(50);
  expect(after.savings).toBe(48);                                                   // 40 + 8 saved

  await page.click('[data-route=wallet]'); await step(page, seen);
  await page.click('[data-route=progress]'); await step(page, seen);

  // 8. Spend path also reaches Reward; the replay gives only 5 XP (gentle wrong jar on the way).
  // REGRESSION (002 code review): a replay used to pay the found coins again and re-apply save/spend,
  // and switching choice on a replay deleted the first run's history line. Check the wallet itself.
  const walletBefore = await walletView(page);
  const xpBefore = await page.evaluate(() => KC.state.xp);
  await page.click('[data-route=home]'); await step(page, seen);
  await playLostCoins(page, seen, 'spend', { wrongOnce: true, switchFrom: 'save' });
  const replay = await page.evaluate(() => KC.state.lastReward);
  expect(replay).toMatchObject({ replay: true, coins: 0, xp: 5, badges: [] });
  await page.click('[data-primary]'); await step(page, seen);                       // home
  const walletAfter = await walletView(page);
  expect(walletAfter.coins).toBe(walletBefore.coins);
  expect(walletAfter.savings).toBe(walletBefore.savings);
  expect(walletAfter.items).toEqual(walletBefore.items);
  expect(walletAfter.events).toBe(walletBefore.events);
  expect(walletAfter.shown).toEqual(walletBefore.shown);
  expect(walletAfter.history).toEqual(walletBefore.history);
  expect(walletAfter.history.some((h) => h.startsWith('Saved in my jar Today'))).toBe(true); // first run's save line kept
  expect(await page.evaluate(() => KC.state.xp)).toBe(xpBefore + 5);

  // 1. all required screens visited
  for (const s of REQUIRED_SCREENS) expect(seen.has(s), `visited ${s}`).toBe(true);
  // 7. nothing left the page's own origin
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
  // the parent-gate values were never kept anywhere
  const stored = await page.evaluate(() => JSON.stringify(sessionStorage) + JSON.stringify(localStorage) + JSON.stringify(KC.state));
  expect(stored).not.toContain('parent@example.com');
  expect(stored).not.toContain('2580');
});

test('first run: changing save → spend leaves exactly one choice line and the right balances', async ({ page }) => {
  const seen = new Set();
  await page.goto(URL + '#/home');
  const start = await page.evaluate(() => ({ coins: KC.state.coins, savings: KC.state.savings, events: KC.state.events.length }));
  await playLostCoins(page, seen, 'spend', { switchFrom: 'save' });
  const s = await page.evaluate(() => ({ coins: KC.state.coins, savings: KC.state.savings, items: KC.state.items.length,
    choiceLines: KC.state.events.filter((e) => e.kind === 'save' || e.kind === 'spend').map((e) => e.kind) }));
  expect(s.choiceLines).toEqual(['spend']);
  expect(s.savings).toBe(start.savings);                 // the undone save left no trace
  expect(s.items).toBe(1);
  expect(s.coins).toBe(start.coins + 8 - 8 + 40);        // +8 counted, −8 spent, +40 first-run reward
});

test('regions: coin art follows the region, coin counts never change, no currency symbol in 4–6 amounts (assertion 6)', async ({ page }) => {
  await page.goto(URL + '?review=1#/home');
  const reads = {};
  for (const region of ['gh', 'ng', 'uk']) {
    await page.click(`[data-region-choice="${region}"]`);
    await expect(page.locator('[data-currency-label]')).toContainText(SYMBOLS);
    const label = await page.locator('[data-currency-label]').innerText();
    expect(label).toContain({ gh: 'GH₵', ng: '₦', uk: '£' }[region]);
    await page.click('[aria-label="Close"]');
    const values = [];
    // Every screen that shows money or coins (SC-006). Each visit runs on a snapshot of the state, so
    // screens that apply a choice (result-*) can't shift the counts being compared across regions.
    for (const screen of ['home', 'activity-find', 'activity-sort', 'activity-count', 'decision', 'result-save', 'result-spend', 'summary', 'reward', 'wallet']) {
      await page.evaluate((s) => {
        window.__kcSnap = JSON.stringify(KC.state);
        KC.state.lastReward = KC.state.lastReward || { coins: 30, xp: 40, badges: [], replay: false };
        KC.state.lostCoins.rewarded = true; KC.state.lostCoins.found = 8;
        KC.go(s);
      }, screen);
      await page.waitForTimeout(100);
      const r = await page.evaluate(() => ({
        money: [...document.querySelectorAll('#kc-screen [data-money]')].map((m) => ({ region: m.getAttribute('data-region'), text: m.innerText.trim() })),
        coinImgs: [...document.querySelectorAll('#kc-screen img')].filter((i) => /\/coins\//.test(i.getAttribute('src'))).map((i) => i.getAttribute('data-region')),
      }));
      await page.evaluate(() => { const region = KC.state.region; KC.state = JSON.parse(window.__kcSnap); KC.state.region = region; });
      expect(r.coinImgs.length, `${screen} shows region coins`).toBeGreaterThan(screen === 'decision' ? -1 : 0);
      for (const m of r.money) { expect(m.region).toBe(region); expect(m.text).not.toMatch(SYMBOLS); }
      for (const g of r.coinImgs) expect(g).toBe(region);
      values.push(...r.money.map((m) => m.text));
    }
    reads[region] = values;
    await page.evaluate(() => KC.go('home'));
    await page.evaluate(() => KC.openReviewer());
  }
  expect(reads.ng).toEqual(reads.gh);
  expect(reads.uk).toEqual(reads.gh);
});
