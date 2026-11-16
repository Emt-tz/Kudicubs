// E6 (004 FR-023–FR-032, FR-047): real play data. Break it: seed preset start values in mock-data.js, or write the PIN.
import { test, expect } from '@playwright/test';
import { noTts, fresh, guard, onboard, playLostCoins, screenIs } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

async function shown(page) {
  const out = {};
  await page.evaluate(() => KC.go('home'));
  out.home = await page.evaluate(() => ({
    coins: document.querySelector('[data-stat=coins] .kc-money-n').textContent,
    xp: document.querySelector('[data-stat=xp]').getAttribute('data-value'),
    level: document.querySelector('[data-stat=level] .kc-level-n').textContent,
    daily: document.querySelector('[data-daily]').getAttribute('data-daily'),
    emptyDaily: !!document.querySelector('[data-empty=daily]'),
    badges: document.querySelectorAll('#kc-screen .kc-badge-row [data-component=badge-tile]').length,
    nickname: document.querySelector('[data-nickname]').textContent,
  }));
  await page.evaluate(() => KC.go('wallet'));
  out.wallet = await page.evaluate(() => ({
    coins: document.querySelector('[data-stat=coins] .kc-money-n').textContent,
    savings: document.querySelector('[data-stat=savings] .kc-money-n').textContent,
    rows: document.querySelectorAll('#kc-screen .kc-history li').length,
    chart: !!document.querySelector('#kc-screen [data-component=bar-chart]'),
    invite: !!document.querySelector('#kc-screen .kc-bubble'),
  }));
  await page.evaluate(() => KC.go('progress'));
  out.progress = await page.evaluate(() => ({
    badges: Number(document.querySelector('[data-badges-earned]').getAttribute('data-badges-earned')),
    pillars: [...document.querySelectorAll('[data-pillar]')].map((p) => p.getAttribute('data-pillar') + ':' + p.getAttribute('data-value')),
    emptyPillars: !!document.querySelector('[data-empty=pillars]'),
    invite: !!document.querySelector('#kc-screen .kc-bubble'),
    current: document.querySelector('[data-component=level-path-node].is-current .kc-node').textContent,
  }));
  return out;
}

test('fresh start: all zeros, level 1, no badges, empty history, friendly invitations (FR-023, FR-030)', async ({ page }) => {
  const g = guard(page);
  await page.goto('./#/welcome');
  const s = await shown(page);
  expect(s.home).toMatchObject({ coins: '0', xp: '0', level: '1', daily: '0', emptyDaily: true, badges: 0, nickname: 'Hi there!' });   // never a preset name (FR-024)
  expect(s.wallet).toEqual({ coins: '0', savings: '0', rows: 0, chart: false, invite: true });
  expect(s.progress).toEqual({ badges: 0, pillars: [], emptyPillars: true, invite: true, current: '1' });
  g.expectClean();
});

test('one run equals exactly what it earned; survives a refresh; Restart clears it; nothing from the gate is stored', async ({ page }) => {
  await page.goto('./#/welcome');
  const gate = await onboard(page, null, { avatar: 1, nickname: 'Kofi' });
  await playLostCoins(page, null, 'save', { check: false });                  // save, perfect sort
  await page.click('[data-primary]'); await screenIs(page, 'home');
  const expected = {
    home: { coins: '40', xp: '50', level: '1', daily: '1', emptyDaily: false, badges: 3, nickname: 'Hi, Kofi!' },
    wallet: { coins: '40', savings: '8', rows: 4, chart: true, invite: false },
    progress: { badges: 3, pillars: ['know:20', 'understand:15', 'decide:0', 'invest:0', 'share:0'], emptyPillars: false, invite: false, current: '1' },
  };
  expect(await shown(page)).toEqual(expected);

  await page.reload(); await page.waitForTimeout(400);                         // FR-027: kept on the device
  expect(await shown(page)).toEqual(expected);
  expect(await page.evaluate(() => KC.state.onboarded)).toBe(true);
  await page.evaluate(() => KC.go('welcome')); await page.click('[data-primary]');
  await screenIs(page, 'home');                                                // returning players skip onboarding

  // FR-028: no email, PIN, maths answer or gate key anywhere in device storage
  const all = await page.evaluate(() => {
    const dump = (st) => Object.keys(st).map((k) => [k, st.getItem(k)]);
    return [...dump(localStorage), ...dump(sessionStorage)];
  });
  const blob = JSON.stringify(all);
  for (const bad of ['@', 'example.com', '2580', `"${gate.answer}"`, `:${gate.answer},`, `:${gate.answer}}`]) expect(blob, `storage contains ${bad}`).not.toContain(bad);
  for (const [k] of all) expect(k).not.toMatch(/email|pin|gate|answer/i);

  await page.evaluate(() => KC.openReviewer());
  await page.click('[data-reviewer-action=restart]');
  await screenIs(page, 'welcome');
  const s = await shown(page);
  expect(s.home).toMatchObject({ coins: '0', xp: '0', badges: 0 });
  expect(s.wallet.rows).toBe(0);
  await page.reload(); await page.waitForTimeout(300);
  expect((await shown(page)).home.coins).toBe('0');
});

test('Load sample data fills every screen; Restart clears it (FR-029)', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => KC.openReviewer());
  await page.click('[data-reviewer-action=sample]');
  await screenIs(page, 'home');
  const s = await shown(page);
  expect(s.home).toMatchObject({ coins: '120', xp: '360', level: '2', badges: 3 });
  expect(s.wallet).toMatchObject({ coins: '120', savings: '40', rows: 6, chart: true });
  expect(s.progress.badges).toBe(3);
  await page.evaluate(() => KC.openReviewer());
  await page.click('[data-reviewer-action=restart]');
  expect((await shown(page)).wallet.rows).toBe(0);
});

test('damaged or older saved data starts fresh without an error (FR-031); blocked storage still plays (FR-032)', async ({ page }) => {
  const g = guard(page, { reloads: true });
  await page.goto('./#/welcome');
  for (const bad of ['{bad', JSON.stringify({ schema: 0, profile: {}, events: [], sample: false }),
    JSON.stringify({ schema: 1, profile: { nickname: 'Not A Preset', avatarId: 'cub-friend-1', band: 'b4_6', region: 'gh', onboarded: true }, events: [], sample: false })]) {
    await page.evaluate((v) => localStorage.setItem('kudicubs.proto.progress', v), bad);
    await page.reload(); await page.waitForTimeout(250);
    expect((await shown(page)).home.coins).toBe('0');
    expect(await page.evaluate(() => localStorage.getItem('kudicubs.proto.progress'))).toBeNull();
  }
  g.expectClean();
});

test('storage blocked: the prototype still plays for the session, with a reviewer-only note', async ({ page }) => {
  await page.addInitScript(() => {
    const deny = () => { throw new DOMException('blocked', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: deny, configurable: true });
  });
  await page.goto('./#/welcome');
  await screenIs(page, 'welcome');
  await page.evaluate(() => { KC.loadSample(); KC.go('home'); });
  expect((await shown(page)).home.coins).toBe('120');
  await page.evaluate(() => KC.openReviewer());
  await expect(page.locator('[data-memory-only]')).toBeVisible();
});

test('over 500 events, the oldest are folded into summary events: totals, badges and "played before" never change', async ({ page }) => {
  await page.goto('./#/welcome');
  const r = await page.evaluate(() => {
    const ev = [];
    for (let i = 0; i < 620; i++) {
      const t = ['earn', 'save', 'spend', 'xp', 'badge', 'pillar', 'mission_done', 'bonus'][i % 8];
      ev.push({ t, n: t === 'badge' || t === 'mission_done' ? 0 : 3, date: '2026-0' + (1 + (i % 9)) + '-10', run: i, mission: 'lost-coins', label: t === 'earn' ? 'history.found' : t,
                badge: t === 'badge' ? (i < 40 ? 'badge.first_coins' : 'badge.hard_worker') : undefined, pillar: t === 'pillar' ? 'know' : undefined });
    }
    ev.forEach((e) => { Object.keys(e).forEach((k) => e[k] === undefined && delete e[k]); });
    const before = KC.derive(ev, '2026-11-15');
    KC.state.events = ev; KC.state.onboarded = true; KC.store.save();
    const after = KC.derive(KC.state.events, '2026-11-15');
    const pick = (v) => ({ coins: v.coins, savings: v.savings, xp: v.xp, badges: v.badges.slice().sort(), pillars: v.pillars, items: v.items >= 0 });
    return { before: pick(before), after: pick(after), n: KC.state.events.length, done: KC.state.events.some((e) => e.t === 'mission_done') };
  });
  expect(r.n).toBeLessThanOrEqual(500);
  expect(r.after).toEqual(r.before);
  expect(r.done).toBe(true);
  await page.reload(); await page.waitForTimeout(300);
  expect(await page.evaluate(() => KC.state.events.length)).toBe(r.n);                    // still valid when loaded back
});

