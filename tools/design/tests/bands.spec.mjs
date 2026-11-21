// 005 US2 (FR-005, FR-006, FR-008, FR-009): every age band is playable from Welcome to Reward, Wallet, Progress and Profile.
//   4–6 never shows a failure; 7–15 are offered Try again and lose nothing earned; with sound off every narrated screen still
//   shows its words, and the mission can be finished.
// Break it: make a retry remove coins (call KC.state.events.pop() in the retry handler), or hide Try again on a poor result.
import { test, expect } from '@playwright/test';
import { noTts, fresh, guard, step, passGate, screenIs, playLostCoins, checkChildActions } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

const BANDS = [
  { band: 'b7_9', card: 1, mission: 'm7', steps: ['m7-decision'], good: ['smart'], poor: ['fancy'], title: 'The Birthday Party' },
  { band: 'b10_12', card: 2, mission: 'm10', steps: ['m10-resource', 'm10-market'], good: ['savings', '5'], poor: ['loan', '8'], title: 'The Clothing Brand' },
  { band: 'b13_15', card: 3, mission: 'm13', steps: ['m13-budget', 'm13-market'], good: ['20', '9'], poor: ['25', '12'], title: 'Side Hustle' },
];
const totals = (page) => page.evaluate(() => { const v = KC.view(); return { coins: v.coins, xp: v.xp, badges: v.badges.length, history: v.history.length }; });
const screen = (page) => page.evaluate(() => document.getElementById('kc-screen').getAttribute('data-screen'));

/** Welcome → age (card n) → avatar → gate → Home. */
async function onboardBand(page, card, seen) {
  await page.click('[data-primary]'); await step(page, seen);
  await page.locator('[data-primary-group] [data-component=choice-card]').nth(card).click(); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);
  await page.locator('[data-primary-group] [data-component=choice-card]').first().click(); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);
  return passGate(page);
}

/** Picks the options for a plan (list of choice ids, one per step) and goes through to the Result screen. */
async function choose(page, def, picks, seen) {
  for (let i = 0; i < def.steps.length; i++) {
    await screenIs(page, def.steps[i]); await step(page, seen);
    await page.click(`[data-choice="${picks[i]}"]`); await step(page, seen);        // the group becomes one primary button
    await page.click('[data-primary]');
  }
  await screenIs(page, `${def.mission}-result`); await step(page, seen);
}

for (const def of BANDS) {
  test(`${def.band}: Welcome → mission with a poor result, Try again keeps everything, → Reward, Wallet, Progress, Profile`, async ({ page }) => {
    const g = guard(page);
    const seen = new Set();
    await page.goto('./#/welcome');
    await onboardBand(page, def.card, seen);
    expect(await page.evaluate(() => KC.state.band)).toBe(def.band);
    await expect(page.locator('[data-primary]')).toContainText(def.title);             // the band's own mission on Home
    const start = await totals(page);

    await page.click('[data-primary]'); await screenIs(page, `${def.mission}-intro`); await step(page, seen);
    await page.click('[data-primary]');                                               // Start

    await choose(page, def, def.poor, seen);                                          // a poor outcome
    await expect(page.locator('[data-result="poor"]')).toBeVisible();
    expect(await page.locator('#kc-screen').innerText()).not.toMatch(/\b(wrong|failed?|incorrect|game over|stupid|bad)\b/i);   // explained, not judged
    const retry = page.locator('#kc-screen .kc-actions [data-primary]');
    await expect(retry).toContainText(/try again/i);                                  // Try again comes first
    await expect(page.locator('#kc-screen .kc-actions [data-component=secondary-button]')).toBeVisible();   // and a way to carry on
    expect(await totals(page)).toEqual(start);                                        // nothing earned or lost yet

    await retry.click(); await screenIs(page, def.steps[0]);                           // replays the decision
    expect(await totals(page)).toEqual(start);                                        // a retry loses nothing
    await choose(page, def, def.good, seen);                                          // a good outcome
    await expect(page.locator('[data-result]')).not.toHaveAttribute('data-result', 'poor');
    await expect(page.locator('#kc-screen .kc-actions [data-primary]')).not.toContainText(/try again/i);
    await page.click('#kc-screen .kc-actions [data-primary]'); await screenIs(page, `${def.mission}-summary`); await step(page, seen);
    expect(await totals(page)).toEqual(start);
    await page.click('[data-primary]'); await screenIs(page, 'reward'); await step(page, seen);

    const after = await totals(page);
    expect(after.coins).toBeGreaterThan(start.coins);                                 // Reward alone grants (coins, XP, a badge)
    expect(after.xp).toBeGreaterThan(start.xp);
    expect(after.badges).toBe(start.badges + 1);
    await page.click('[data-primary]'); await screenIs(page, 'home'); await step(page, seen);
    for (const id of ['wallet', 'progress']) { await page.click(`[data-route=${id}]`); await screenIs(page, id); await step(page, seen); }
    await page.click('[data-route=home]'); await page.click('[data-profile-entry]'); await screenIs(page, 'profile'); await step(page, seen);
    await expect(page.locator('[data-band-label]')).toHaveText(new RegExp(def.band === 'b7_9' ? '7–9' : def.band === 'b10_12' ? '10–12' : '13–15'));
    for (const id of def.steps.concat([`${def.mission}-intro`, `${def.mission}-result`, `${def.mission}-summary`])) expect(seen.has(id), `visited ${id}`).toBe(true);
    for (const id of ['reward', 'wallet', 'progress', 'profile', 'home']) expect(seen.has(id), `visited ${id}`).toBe(true);
    g.expectClean();
  });

  test(`${def.band}: a replay of the mission grants XP only, and Back never lands on Reward or Result`, async ({ page }) => {
    await page.goto('./#/welcome');
    await page.evaluate((b) => { KC.loadSample(); KC.state.band = b; KC.store.save(); KC.go('home'); }, def.band);
    await page.click('[data-primary]'); await page.click('[data-primary]');
    await choose(page, def, def.good, null);
    await page.click('#kc-screen .kc-actions [data-primary]'); await page.click('[data-primary]'); await screenIs(page, 'reward');
    const first = await totals(page);
    await page.click('[data-primary]'); await screenIs(page, 'home');
    await page.click('[data-primary]'); await page.click('[data-primary]');
    await choose(page, def, def.good, null);
    await page.click('#kc-screen .kc-actions [data-primary]'); await page.click('[data-primary]'); await screenIs(page, 'reward');
    await page.click('[data-primary]'); await screenIs(page, 'home');
    const second = await totals(page);
    expect(second.coins).toBe(first.coins);                                           // replays change nothing in the wallet
    expect(second.xp).toBe(first.xp + 5);
    for (let i = 0; i < 6; i++) {
      await page.goBack(); await page.waitForTimeout(200);
      const s = await screen(page);
      expect(['reward', 'm7-result', 'm10-result', 'm13-result', 'parent-gate'], `Back #${i + 1} landed on ${s}`).not.toContain(s);
    }
    expect((await totals(page)).xp).toBe(second.xp);                                  // going back grants nothing
  });
}

test('mission screens opened by hand do not skip ahead: a later screen without its run goes to the intro, Result with no choice goes Home', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.go('home'); });
  for (const def of BANDS) {
    for (const id of def.steps.concat([`${def.mission}-summary`])) {
      await page.goto(`./#/${id}`); await page.waitForTimeout(200);
      expect(await screen(page), `#/${id} without a run`).toBe(`${def.mission}-intro`);
    }
    await page.goto(`./#/${def.mission}-result`); await page.waitForTimeout(200);
    expect(await screen(page), `#/${def.mission}-result without a run`).toBe(`${def.mission}-intro`);
  }
  const zero = await totals(page);
  await page.goto('./#/reward'); await page.waitForTimeout(200);
  expect(await screen(page)).toBe('home');
  expect(await totals(page)).toEqual(zero);
});

test('4–6: The Lost Coins never shows a failure, a Try again, or a wrong-answer word (Constitution III)', async ({ page }) => {
  const g = guard(page);
  const words = [];
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.state.band = 'b4_6'; KC.go('home'); });
  const watch = setInterval(() => {}, 1000);
  await page.exposeFunction('kcSeen', (t) => words.push(t));
  await page.evaluate(() => { new MutationObserver(() => kcSeen(document.getElementById('kc-screen').innerText)).observe(document.getElementById('kc-screen'), { childList: true, subtree: true }); });
  await playLostCoins(page, new Set(), 'save', { wrongOnce: true, check: false });
  clearInterval(watch);
  const bad = words.filter((w) => /\b(wrong|failed?|failure|incorrect|game over|try again)\b/i.test(w));
  expect(bad, bad.join('\n---\n')).toEqual([]);
  await expect(page.locator('[data-failure]')).toHaveCount(0);
  g.expectClean();
});

test('sound off: every narrated child screen still shows its words, and a mission can be finished', async ({ page }) => {
  const g = guard(page);
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.state.sound = false; KC.state.narration = false; });
  const ids = await page.evaluate(() => KC.order.filter((id) => KC.screens[id].audience === 'child'));
  const missing = [];
  for (const id of ids) {
    await page.evaluate((i) => { KC.jumpTo(i); }, id);
    await page.waitForTimeout(550);
    const r = await page.evaluate(() => {
      const norm = (t) => String(t || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      const here = norm(document.getElementById('kc-screen').innerText + ' ' + document.getElementById('kc-caption').innerText);
      const narr = (KC.current._narr || []).slice(0, 1);          // the prompt that plays on arrival; hints and taps show a caption when voiced
      return { id: KC.current.id, lost: narr.filter((l) => !here.includes(norm(KC.lineText(l)))) };
    });
    if (r.lost.length) missing.push(`${r.id}: ${r.lost.join(', ')}`);
  }
  expect(missing, `narrated lines with no visible words (sound off):\n${missing.join('\n')}`).toEqual([]);
  // and the 7–9 mission is completable with sound and narration off
  await page.evaluate(() => { KC.state.band = 'b7_9'; KC.go('home'); });
  await page.click('[data-primary]'); await page.click('[data-primary]');
  await page.click('[data-choice="smart"]'); await page.click('[data-primary]'); await screenIs(page, 'm7-result');
  await page.click('[data-primary]'); await page.click('[data-primary]'); await screenIs(page, 'reward');
  expect(await page.evaluate(() => document.body.getAttribute('data-last-voice'))).not.toBe('recorded');   // nothing played, captions only
  g.expectClean();
});

test('age select: all four bands can be chosen and the choice is kept; the band decides Home\'s mission and its rules', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => KC.go('age-select'));
  await expect(page.locator('[data-primary-group] [data-component=choice-card].is-locked')).toHaveCount(0);
  for (const [i, b] of ['b4_6', 'b7_9', 'b10_12', 'b13_15'].entries()) {
    await page.locator('.kc-choice-grid [data-component=choice-card]').nth(i).click();
    expect(await page.evaluate(() => KC.state.band)).toBe(b);
  }
  // age-band-rules: the first idle hint is later for older children; 10–15 prompts play when tapped
  const rules = await page.evaluate(() => {
    const out = {};
    for (const b of ['b4_6', 'b7_9', 'b10_12', 'b13_15']) { KC.state.band = b; out[b] = [KC.autoNarrates({ band: 'auto' })]; }
    return out;
  });
  expect(rules).toEqual({ b4_6: [true], b7_9: [true], b10_12: [false], b13_15: [false] });
});

test('new child screens: daily challenge, level-up, badge detail and the profile switches work and are reachable from Home or Progress', async ({ page }) => {
  const g = guard(page);
  const seen = new Set();
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.go('home'); });
  await page.click('#kc-screen [data-component=secondary-button]'); await screenIs(page, 'daily-challenge'); await step(page, seen);
  await expect(page.locator('[data-component=streak-daily]')).toBeVisible();
  await page.click('[data-primary]'); await screenIs(page, 'mission-intro');          // Continue goes to the band's mission
  await page.evaluate(() => KC.go('progress'));
  await page.click('#kc-screen [data-component=secondary-button]'); await screenIs(page, 'badge-detail'); await step(page, seen);
  await expect(page.locator('[data-badge-state=earned]')).toBeVisible();
  await page.click('[data-badge="badge.hard_worker"]');                              // a locked badge shows how to earn it
  await expect(page.locator('[data-badge-state=locked]')).toBeVisible();
  await expect(page.locator('[data-badge-how]')).not.toBeEmpty();
  await step(page, seen);
  await page.evaluate(() => KC.go('level-up')); await step(page, seen);
  await expect(page.locator('[data-level-name]')).toBeVisible();
  await page.evaluate(() => KC.go('profile')); await step(page, seen);
  const sw = page.locator('[data-switch=sound]');
  await sw.click(); expect(await page.evaluate(() => KC.state.sound)).toBe(false);
  await page.locator('[data-switch=narration]').click(); expect(await page.evaluate(() => KC.state.narration)).toBe(false);
  await page.evaluate(() => KC.voice.play('home.say'));
  await expect(page.locator('#kc-caption')).not.toHaveAttribute('data-caption-state', 'playing');   // the caption still shows
  await sw.click(); expect(await page.evaluate(() => KC.state.sound)).toBe(true);
  g.expectClean();
});

test('Reward after a level change offers the level-up screen; the primary action stays "Back to Home"', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.state.band = 'b13_15'; KC.go('home'); });
  await page.click('[data-primary]'); await page.click('[data-primary]');
  await page.click('[data-choice="20"]'); await page.click('[data-primary]');
  await page.click('[data-choice="9"]'); await page.click('[data-primary]'); await screenIs(page, 'm13-result');
  await page.click('#kc-screen .kc-actions [data-primary]'); await page.click('[data-primary]'); await screenIs(page, 'reward');
  await expect(page.locator('.kc-levelup')).toBeVisible();
  await expect(page.locator('#kc-screen .kc-actions [data-primary]')).toContainText(/home/i);
  await page.click('#kc-screen .kc-actions [data-component=secondary-button]'); await screenIs(page, 'level-up');
  await page.goBack(); await page.waitForTimeout(250);
  expect(await screen(page)).not.toBe('reward');
});

test('a checkChildActions pass over the new mission screens: taps react and never navigate', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.state.band = 'b7_9'; });
  for (const id of ['m7-intro', 'm7-decision', 'm7-result', 'm7-summary', 'profile', 'daily-challenge', 'level-up', 'badge-detail']) {
    await page.evaluate((i) => KC.jumpTo(i), id);
    await checkChildActions(page);
  }
});

test('daily challenge: the done state shows when three suns are lit, and a missed day costs nothing', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); for (let i = 0; i < 3; i++) KC.state.events.push({ t: 'mission_done', n: 0, date: KC.today(), run: 50 + i, mission: 'sample', label: 'mission' }); KC.go('daily-challenge'); });
  await expect(page.locator('[data-component=streak-daily]')).toHaveAttribute('data-daily', '3');
  await expect(page.locator('#kc-screen [data-primary]')).toContainText(/home/i);
  await page.evaluate(() => { KC.state.events = KC.state.events.filter((e) => e.t !== 'mission_done'); KC.go('daily-challenge'); });
  await expect(page.locator('[data-component=streak-daily]')).toHaveAttribute('data-daily', '0');
  await expect(page.locator('#kc-screen')).not.toContainText(/missed|lost your|streak broken/i);
});

test('screens.manifest.json lists exactly the screens that are built, each with a reviewer jump that opens it', async ({ page }) => {
  const { readFileSync } = await import('node:fs');
  const manifest = JSON.parse(readFileSync(new URL('../../../prototype/assets/data/screens.manifest.json', import.meta.url), 'utf8'));
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.go('home'); KC.openReviewer(); });
  const options = await page.$$eval('.kc-reviewer-sheet select option', (os) => os.map((o) => o.value).filter(Boolean));
  const ids = manifest.screens.map((s) => s.id);
  expect(new Set(ids).size).toBe(ids.length);
  expect(options.sort(), 'the reviewer menu lists every screen, and only built screens are in the manifest').toEqual([...ids].sort());
  for (const id of ids) {
    await page.evaluate((i) => { KC.jumpTo(i); }, id); await page.waitForTimeout(60);
    const here = await page.evaluate(() => document.getElementById('kc-screen').getAttribute('data-screen'));
    expect(here, `jump to ${id}`).toBe(id === 'reward' ? 'home' : id);              // Reward alone opens only after a run (FR-005)
  }
});
