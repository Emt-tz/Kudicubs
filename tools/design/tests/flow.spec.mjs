// E1, E4, E9 and A8 (004 FR-041, FR-044, FR-046, FR-010) + the 002/003 journey audits and regressions.
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { noTts, fresh, guard, step, onboard, playLostCoins, walletView, passGate, screenIs, checkChildActions, REQUIRED_SCREENS, SYMBOLS } from './helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

/* E1: Welcome → onboarding → parent gate → Home → The Lost Coins → Reward → Home, with 0 console errors and
   0 failed requests; plus E4: a replay changes no coins or history, adds replay XP only and speaks reward.replay. */
test('full journey and replay: one main action, child actions, drag counts, no TTS, replay economy, 0 errors (E1, E4)', async ({ page }) => {
  const g = guard(page);
  const seen = new Set();
  await page.goto('./#/welcome');
  await step(page, seen);
  await expect(page.locator('#kc-back')).toBeHidden();
  await onboard(page, seen, { avatar: 2, nickname: 'Zara' });
  await step(page, seen);
  await expect(page.locator('[data-nickname]')).toHaveText('Hi, Zara!');                       // FR-024: the child's choice
  await expect(page.locator('#kc-screen img[src*="cub-friend-3"]')).toHaveCount(1);

  await page.waitForTimeout(6500);                                                             // idle hint
  await expect(page.locator('#kc-screen')).toHaveAttribute('data-hint-active', /\d/);
  // encourage (fist), then headphones while the hint line plays (interaction-moments §2)
  expect(['fist', 'headphones']).toContain(await page.getAttribute('img[data-kudi-pose]', 'data-kudi-pose'));

  await playLostCoins(page, seen, 'save');
  expect(await page.evaluate(() => KC.state.lastReward)).toMatchObject({ replay: false, coins: 40, xp: 50, badges: ['badge.hard_worker', 'badge.smart_sorter'] });
  expect(await page.evaluate(() => document.body.getAttribute('data-last-line'))).toBe('reward.say');
  await page.click('[data-primary]'); await screenIs(page, 'home'); await step(page, seen);
  expect(await page.evaluate(() => { const v = KC.view(); return { coins: v.coins, savings: v.savings, xp: v.xp }; })).toEqual({ coins: 40, savings: 8, xp: 50 });

  await page.click('[data-route=wallet]'); await step(page, seen); await checkChildActions(page);
  await page.click('[data-route=progress]'); await step(page, seen); await checkChildActions(page);

  // E4 REPLAY: no coins or history change, XP +5 only, and the replay line/title (004 FR-006, FR-033)
  const walletBefore = await walletView(page);
  const xpBefore = await page.evaluate(() => KC.view().xp);
  await page.click('[data-route=home]'); await step(page, seen);
  await page.evaluate(() => { KC.state.notes = true; });                                     // caption line visible with notes on
  await playLostCoins(page, seen, 'spend', { wrongOnce: true, switchFrom: 'save' });
  expect(await page.evaluate(() => KC.state.lastReward)).toMatchObject({ replay: true, coins: 0, xp: 5, badges: [] });
  await expect(page.locator('[data-reward-title]')).toHaveText('Great practice!');
  expect(await page.evaluate(() => document.body.getAttribute('data-last-line'))).toBe('reward.replay');
  expect(await page.evaluate(() => KC.current._narr)).toEqual(['reward.replay']);
  await page.evaluate(() => { KC.state.notes = false; });
  await page.click('[data-primary]'); await step(page, seen);
  const walletAfter = await walletView(page);
  expect(walletAfter).toEqual(walletBefore);
  expect(await page.evaluate(() => KC.view().xp)).toBe(xpBefore + 5);

  for (const s of REQUIRED_SCREENS) expect(seen.has(s), `visited ${s}`).toBe(true);
  expect(await page.evaluate(() => window.__tts)).toBe(0);
  g.expectClean();                                                                             // 0 console errors, 0 failed requests
});

test('first run: changing save → spend leaves exactly one choice event and the right balances', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.state.onboarded = true; KC.go('home'); });
  await playLostCoins(page, new Set(), 'spend', { switchFrom: 'save', check: false });
  const s = await page.evaluate(() => {
    const v = KC.view();
    return { coins: v.coins, savings: v.savings, items: v.items, choices: KC.state.events.filter((e) => e.t === 'save' || e.t === 'spend').map((e) => e.t) };
  });
  expect(s.choices).toEqual(['spend']);
  expect(s).toMatchObject({ savings: 0, items: 1, coins: 8 - 8 + 40 });
});

test('Count: the big counter is hidden while Kudi asks (FR-007); the caption never repeats Kudi\'s bubble (FR-008)', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.resetRun(); KC.run.reached = 3; KC.go('activity-count'); });
  await expect(page.locator('[data-count-total]')).toBeVisible();
  for (let j = 0; j < 3; j++) {
    const grp = page.locator('[data-primary-group] [data-component=coin-token]:not(.is-counted)');
    while (await grp.count()) await grp.first().click();
  }
  await expect(page.locator('.kc-jar-row.is-asking')).toHaveCount(1);
  await expect(page.locator('[data-count-total]')).toBeHidden();
  // FR-008: the prompt is in Kudi's bubble, so the caption bar stays hidden; a line not on screen shows.
  await page.evaluate(() => KC.go('mission-intro'));
  await page.evaluate(() => KC.voice.play('intro.say'));
  await expect(page.locator('#kc-caption')).toHaveAttribute('data-caption-state', 'hidden');
  await page.evaluate(() => KC.voice.play('intro.stall'));                         // "The market!" is not on screen
  await expect(page.locator('#kc-caption')).toHaveAttribute('data-caption-state', /playing|done|ready|pending/);
  await expect(page.locator('#kc-caption .kc-caption-text')).toHaveText('The market!');
});

/* A8 (FR-010, FR-011): confirm PIN. */
test('gate: a different confirm PIN asks again and does not continue; a match continues; nothing is stored', async ({ page }) => {
  await page.goto('./#/parent-gate');
  await passGate(page, { pin: '2580', confirm: '2581' });
  await expect(page.locator('.kc-parent-msg')).toHaveText("Those PINs don't match. Let's try again.");
  await expect(page.locator('#kc-screen')).toContainText('Choose a 4-digit parent PIN');
  for (const d of '2580') await page.click(`[data-component=pin-pad] [data-key="${d}"]`);
  await page.click('[data-primary]');
  for (const d of '2580') await page.click(`[data-component=pin-pad] [data-key="${d}"]`);
  await page.click('[data-primary]');
  await expect(page.locator('.kc-region-pick')).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify(localStorage) + JSON.stringify(sessionStorage));
  expect(stored).not.toContain('2580');
  expect(stored).not.toContain('2581');
});

/* E9 (FR-046): switching region changes the coins and the treat name on every money screen; no currency symbols. */
test('regions: coin art and treat names follow the region on every money screen; coin counts never change', async ({ page }) => {
  await page.goto('./?review=1#/welcome');
  await page.evaluate(() => KC.loadSample());
  const reads = {};
  for (const region of ['gh', 'ng', 'uk']) {
    await page.evaluate((r) => { KC.openReviewer(); }, region);
    await page.click(`[data-region-choice="${region}"]`);
    expect(await page.locator('[data-currency-label]').first().innerText()).toContain({ gh: 'GH₵', ng: '₦', uk: '£' }[region]);
    await page.click('#kc-reviewer [aria-label="Close"]');
    const treat = await page.evaluate(() => KC.region().marketExamples.treat.label);
    const values = [];
    for (const screen of ['home', 'wallet', 'decision', 'result-save', 'result-spend', 'summary', 'reward']) {
      await page.evaluate((s) => {
        KC.loadSample();                                              // each screen from the same sample state (not a replay)
        if (s !== 'home' && s !== 'wallet') { KC.resetRun(); KC.run.reached = KC.MISSION.indexOf('summary'); KC.state.lostCoins.found = 8; KC.state.lostCoins.choice = 'spend'; }
        if (s === 'reward') KC.run.pendingReward = true;
        KC.go(s, { force: true });
      }, screen);
      await page.waitForTimeout(80);
      const r = await page.evaluate(() => ({
        id: document.getElementById('kc-screen').getAttribute('data-screen'),
        text: document.getElementById('kc-screen').innerText,
        money: [...document.querySelectorAll('#kc-screen [data-money]')].map((m) => ({ region: m.getAttribute('data-region'), text: m.innerText.trim() })),
        coinImgs: [...document.querySelectorAll('#kc-screen img')].filter((i) => /\/coins\//.test(i.getAttribute('src'))).map((i) => i.getAttribute('src')),
      }));
      expect(r.id).toBe(screen);
      if (screen !== 'decision') expect(r.coinImgs.length, `${screen} shows region coins`).toBeGreaterThan(0);
      for (const src of r.coinImgs) expect(src, `${screen} coin art`).toContain(`/coins/${region}/`);
      for (const m of r.money) { expect(m.region).toBe(region); expect(m.text).not.toMatch(SYMBOLS); }
      if (screen === 'decision') expect(r.text, 'treat name on Decision').toContain(treat);
      if (screen === 'result-spend') expect(await page.evaluate(() => KC.current._narr[0]), 'the treat line on Result is the region\'s').toBe(`result.spend.say.${region}`);
      if (screen === 'wallet') expect(r.text, 'treat name in the wallet history').toContain(await page.evaluate(() => KC.t('history.sticker')));
      values.push(...r.money.map((m) => m.text));
    }
    reads[region] = values;
  }
  expect(reads.ng).toEqual(reads.gh);                                // coin counts are region-neutral
  expect(reads.uk).toEqual(reads.gh);
});

test('file:// still works (no server needed for a local review)', async ({ page }) => {
  const url = pathToFileURL(path.join(ROOT, 'prototype/index.html')).href;
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url + '#/welcome');
  await screenIs(page, 'welcome');
  await expect(page.locator('#kc-boot-fail')).toBeHidden();
  expect(errors).toEqual([]);
});

test('reviewer menu: version and build date, recorded/scratch/pending counts per language; pages are noindex (FR-020, FR-036, FR-037)', async ({ page }) => {
  await page.goto('./?review=1#/welcome');
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex, nofollow');
  const build = page.locator('[data-build]');
  await expect(build).toContainText('Prototype v0.3.0 · built ');
  for (const l of ['en-GH', 'en-NG', 'en-GB']) await expect(page.locator(`[data-voice-count="${l}"]`)).toContainText(/recorded \d+ · scratch \d+ · pending \d+/);
});

/* Regressions from the round-1 code review (003 T058). */
test('keyboard: avatar, nickname and save-or-spend cards select with Enter; Sort is playable by keyboard alone', async ({ page }) => {
  await page.goto('./#/avatar');
  await page.locator('#kc-screen [data-component=choice-card][role=radio]').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#kc-screen .kc-choice-grid [role=radio]').nth(1)).toHaveAttribute('aria-checked', 'true');
  const chip = page.locator('#kc-screen .kc-chip').nth(2);
  await chip.focus(); await page.keyboard.press(' ');
  await expect(chip).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => KC.state.nickname)).toBe(await chip.innerText());

  await page.evaluate(() => { KC.resetRun(); KC.run.reached = 4; KC.go('decision'); });
  await page.locator('#kc-screen [data-choice=spend]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#kc-screen [data-choice=spend]')).toHaveAttribute('aria-checked', 'true');

  await page.evaluate(() => { KC.resetRun(); KC.go('activity-sort'); });
  for (let n = 0; n < 20 && await page.locator('.kc-tray [data-component=coin-token]').count(); n++) {
    const coin = page.locator('.kc-tray [data-component=coin-token]').first();
    const d = await coin.getAttribute('data-denom');
    await coin.focus(); await page.keyboard.press('Enter');
    await expect(coin).toHaveClass(/is-picked/);
    await page.locator(`[data-component=jar][data-jar="${d}"]`).focus();
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('.kc-tray [data-component=coin-token]')).toHaveCount(0);
  await expect(page.locator('#kc-screen [data-primary]')).toBeVisible();
});

test('review regressions: confetti uses real tokens, tab labels finish, long idle waves, tapped words show their caption', async ({ page }) => {
  await page.clock.install();
  await page.goto('./#/home');
  const colours = await page.evaluate(() => {
    KC.celebrate();
    return [...document.querySelectorAll('.kc-confetti:not(.kc-confetti--coin)')].map((el) => getComputedStyle(el).backgroundColor);
  });
  expect(colours.length).toBeGreaterThan(0);
  expect(colours.filter((c) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent')).toEqual([]);
  await page.click('#kc-bottom-nav [data-route=wallet]');
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => document.body.getAttribute('data-last-line'))).toBe('nav.wallet');
  await page.evaluate(() => KC.go('mission-intro'));
  await page.clock.runFor(20500);
  await expect(page.locator('#kc-screen img[data-kudi-pose]')).toHaveAttribute('data-kudi-pose', 'wave');
  expect(await page.evaluate(() => document.body.getAttribute('data-last-line'))).toBe('hint.welcome_back');
  await page.evaluate(() => { KC.audioManifest.lines['en-GH']['intro.help'] = { status: 'pending', file: null, scratchFile: null }; });
  await page.locator('#kc-screen .kc-ask').click({ position: { x: 20, y: 20 } });     // a tapped word with no audio
  await expect(page.locator('#kc-caption')).toHaveClass(/is-highlight/);
  expect(await page.evaluate(() => document.body.getAttribute('data-last-line'))).toBe('intro.help');
  expect(await page.evaluate(() => window.__tts)).toBe(0);
});
