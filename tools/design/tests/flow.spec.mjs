// 002 contracts/screen-flow.md §4 (assertions 1–9) + 003 contracts/interaction-moments.md §6 (assertions 1–6).
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const URL = pathToFileURL(path.join(ROOT, 'prototype/index.html')).href;

const COMPONENTS = ['primary-button', 'secondary-button', 'icon-button', 'choice-card', 'speaker-cue', 'kudi-bubble', 'illustration',
  'coin-counter', 'xp-bar', 'level-badge', 'streak-daily', 'badge-tile', 'jar', 'coin-token', 'progress-dots', 'bottom-nav', 'region-coin-set',
  'parent-gate-pad', 'pin-pad', 'action-result', 'bar-chart', 'level-path-node', 'celebration-overlay', 'gentle-hint', 'reviewer-menu',
  'replay-button', 'narration-caption', 'count-badge'];
const LOST_COINS = ['mission-intro', 'activity-find', 'activity-sort', 'activity-count', 'decision', 'result-save', 'summary', 'reward'];
const REQUIRED_SCREENS = ['welcome', 'age-select', 'avatar', 'parent-gate', 'home', ...LOST_COINS, 'wallet', 'progress'];
const SYMBOLS = /GH₵|₦|£/;

/* Synthetic speech must never be used (003 FR-014, SC-003): count any call. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__tts = 0;
    const fake = { speak() { window.__tts += 1; }, cancel() {}, getVoices() { return []; } };
    try { Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true }); } catch (e) { /* ignore */ }
  });
});

/** Checks that hold on every screen state. Returns the screen id. */
async function audit(page) {
  return page.evaluate(({ components }) => {
    const root = document.getElementById('kc-screen');
    const id = root.getAttribute('data-screen');
    const child = root.getAttribute('data-audience') === 'child';
    const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const problems = [];
    if (child) {                                                            // 002 §4.2 one main action at a time
      const n = [...root.querySelectorAll('[data-primary]')].filter(visible).length + [...root.querySelectorAll('[data-primary-group]')].filter(visible).length;
      if (n !== 1) problems.push(`${id}: ${n} main actions (want exactly 1)`);
      if (root.querySelector('[data-child-action][data-primary]')) problems.push(`${id}: a child action is marked data-primary`);
    }
    if (document.querySelector('[data-failure]')) problems.push(`${id}: data-failure present`);   // 002 §4.3
    const phone = document.getElementById('kc-phone');
    phone.querySelectorAll('button, [role=button], [data-component=choice-card]').forEach((el) => {   // 002 §4.4
      if (!visible(el) || el.closest('[hidden]') || el.getAttribute('aria-disabled') === 'true' || el.disabled) return;
      const r = el.getBoundingClientRect();
      if (r.width < 47.5 || r.height < 47.5) problems.push(`${id}: touch target ${Math.round(r.width)}×${Math.round(r.height)} < 48 (${el.outerHTML.slice(0, 90)})`);
      if (child && el.hasAttribute('data-primary') && (r.width < 63.5 || r.height < 63.5)) problems.push(`${id}: main action ${Math.round(r.width)}×${Math.round(r.height)} < 64`);
    });
    phone.querySelectorAll('button, [role=button], img, svg').forEach((el) => {                    // traceability
      if (!visible(el) || el.closest('[hidden]')) return;
      if (!el.closest('[data-component]')) problems.push(`${id}: ${el.tagName.toLowerCase()} outside any data-component (${el.outerHTML.slice(0, 80)})`);
    });
    phone.querySelectorAll('[data-component]').forEach((el) => {
      if (!components.includes(el.getAttribute('data-component'))) problems.push(`${id}: unknown component "${el.getAttribute('data-component')}"`);
    });
    if (/bizkid/i.test(document.body.innerText)) problems.push(`${id}: old product name visible`);   // 002 §4.9
    if (!document.querySelector('[data-replay]') || !visible(document.querySelector('[data-replay]'))) problems.push(`${id}: no visible replay button`); // 003 §6.5
    if (window.__tts) problems.push(`${id}: synthetic speech was called`);                          // 003 §6.4
    return { id, problems };
  }, { components: COMPONENTS });
}

async function step(page, seen) {
  const { id, problems } = await audit(page);
  expect(problems, problems.join('\n')).toEqual([]);
  seen.add(id);
  return id;
}

/** 003 §6.1–6.2 + SC-005: on render a child action (or main action) is enabled within 1 s; every child action reacts. */
async function checkChildActions(page) {
  const r = await page.evaluate(() => {
    const root = document.getElementById('kc-screen');
    const enabled = [...root.querySelectorAll('[data-child-action]')].filter((el) => {
      const b = el.getBoundingClientRect(); return b.width > 0 && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
    });
    return { id: root.getAttribute('data-screen'), n: enabled.length };
  });
  if (LOST_COINS.includes(r.id) || r.id.startsWith('result-')) expect(r.n, `${r.id} has a child action besides Next`).toBeGreaterThan(0);
  // tap the first "hear"/"tap" action and check it reacted without navigating
  const target = page.locator('#kc-screen [data-child-action="hear"], #kc-screen [data-child-action="tap"]').first();
  if (await target.count()) {
    const before = await page.evaluate(() => ({ screen: document.getElementById('kc-screen').getAttribute('data-screen'), sfx: document.body.getAttribute('data-sfx-log') || '', line: document.body.getAttribute('data-last-line') }));
    await target.click({ force: true });
    const after = await page.evaluate(() => ({ screen: document.getElementById('kc-screen').getAttribute('data-screen'), sfx: document.body.getAttribute('data-sfx-log') || '', line: document.body.getAttribute('data-last-line'), cap: document.getElementById('kc-caption').getAttribute('data-caption-state') }));
    expect(after.screen, 'child action never navigates').toBe(before.screen);
    expect(after.sfx.length > before.sfx.length || after.line !== before.line || ['playing', 'pending', 'ready'].includes(after.cap), `${r.id}: child action reacted`).toBe(true);
  }
}

async function passGate(page) {
  const hold = page.locator('.kc-hold');
  const box = await hold.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(3200); await page.mouse.up();
  const q = await page.getAttribute('[data-question]', 'data-question');
  const [a, b] = q.split('x').map(Number);
  for (const d of String(a * b)) await page.click(`[data-component=parent-gate-pad] [data-key="${d}"]`);
  await page.click('[data-primary]');
  for (const d of '2580') await page.click(`[data-component=pin-pad] [data-key="${d}"]`);
  await page.click('[data-primary]');
  await page.click('[data-primary]');
  await page.fill('input[type=email]', 'parent@example.com');
  await page.click('[data-primary]');
  await page.waitForFunction(() => document.getElementById('kc-screen').getAttribute('data-screen') === 'home', null, { timeout: 5000 });
}

/** Drag a coin onto a jar with a real pointer drag (003 FR-024, §6.3). */
async function drag(page, coin, jar) {
  const c = await coin.boundingBox(); const j = await jar.boundingBox();
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
  await page.mouse.down();
  await page.mouse.move(j.x + j.width / 2, j.y + j.height / 2, { steps: 8 });
  await page.mouse.up();
}

/** Plays The Lost Coins from Home to Reward (sorting by real drag; one wrong drop when asked). */
async function playLostCoins(page, seen, choice, { wrongOnce = false, switchFrom = null } = {}) {
  await page.click('[data-primary]'); await step(page, seen); await checkChildActions(page);          // → mission-intro
  await page.click('#kc-screen [data-child-action="answer"]'); await step(page, seen);               // call and response
  await page.click('[data-primary]'); await step(page, seen); await checkChildActions(page);          // → activity-find
  while (await page.locator('.kc-scene [data-component=coin-token]:not(.is-found)').count()) {
    await page.locator('.kc-scene [data-component=coin-token]:not(.is-found)').first().click();
  }
  await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen); await checkChildActions(page);          // → activity-sort
  if (wrongOnce) {
    const c = page.locator('.kc-tray [data-component=coin-token]').first();
    const d = await c.getAttribute('data-denom');
    const wrong = page.locator(`[data-component=jar]:not([data-jar="${d}"])`).first();
    const badgeBefore = await wrong.locator('[data-component=count-badge]').getAttribute('data-count');
    await drag(page, c, wrong);
    expect(await wrong.locator('[data-component=count-badge]').getAttribute('data-count')).toBe(badgeBefore);
    expect(await page.getAttribute('img[data-kudi-pose]', 'data-kudi-pose')).toBe('fist');
    expect(await page.evaluate(() => document.body.getAttribute('data-sfx-log'))).toContain('boop');
    await page.waitForTimeout(700);                                   // the coin floats back to the tray (240 ms) + gentle bounce
    await step(page, seen);
  }
  while (await page.locator('.kc-tray [data-component=coin-token]').count()) {
    const c = page.locator('.kc-tray [data-component=coin-token]').first();
    const d = await c.getAttribute('data-denom');
    const jar = page.locator(`[data-component=jar][data-jar="${d}"]`);
    const before = Number(await jar.locator('[data-component=count-badge]').getAttribute('data-count'));
    await drag(page, c, jar);
    expect(Number(await jar.locator('[data-component=count-badge]').getAttribute('data-count')), 'count badge +1 per coin').toBe(before + 1);
  }
  await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);                                         // → activity-count
  for (let j = 0; j < 3; j++) {
    const g = page.locator('[data-primary-group] [data-component=coin-token]:not(.is-counted)');
    while (await g.count()) await g.first().click();
    await page.waitForTimeout(650);
    await step(page, seen);
  }
  expect(await page.locator('[data-primary]').count(), 'Next waits for the answer').toBe(0);
  const most = await page.evaluate(() => KC.region().lostCoinsSet[KC.jarCounts().indexOf(Math.max.apply(null, KC.jarCounts()))]);
  await page.click(`[data-component=jar][data-jar="${most}"]`); await step(page, seen);              // "Which jar has the most coins?"
  await page.click('[data-primary]'); await step(page, seen); await checkChildActions(page);          // → decision
  if (switchFrom) {
    await page.click(`[data-choice=${switchFrom}]`); await step(page, seen);
    await page.click('[data-primary]'); await step(page, seen);
    await page.click('#kc-back');
    await page.waitForFunction(() => document.getElementById('kc-screen').getAttribute('data-screen') === 'decision');
    await step(page, seen);
  }
  await page.click(`[data-choice=${choice}]`); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen); await checkChildActions(page);          // → result-*
  await page.click('[data-primary]'); await step(page, seen);                                         // → summary
  expect(await page.locator('[data-primary]').count(), 'Next waits for the answer').toBe(0);
  await page.click(`[data-answer=${choice}]`); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen); await checkChildActions(page);          // → reward
}

async function walletView(page) {
  await page.click('[data-route=wallet]');
  return page.evaluate(() => ({
    coins: KC.state.coins, savings: KC.state.savings, items: KC.state.items.slice(), events: KC.state.events.length,
    shown: [...document.querySelectorAll('#kc-screen .kc-panel [data-money]')].map((m) => m.innerText.trim()),
    history: [...document.querySelectorAll('#kc-screen .kc-history li')].map((li) => li.innerText.replace(/\s+/g, ' ').trim()),
  }));
}

test('full journey: one main action, child actions on every Lost Coins screen, drag counts, no TTS, replay economy (002 §4 + 003 §6)', async ({ page }) => {
  const offOrigin = [];
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) offOrigin.push(r.url()); });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const seen = new Set();

  await page.goto(URL + '#/welcome');
  await step(page, seen);
  await expect(page.locator('#kc-back')).toBeHidden();
  await page.click('[data-primary]'); await step(page, seen);
  await page.click('[data-component=choice-card]:not(.is-locked)'); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);
  await page.locator('[data-primary-group] [data-component=choice-card]').first().click(); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);
  await passGate(page); await step(page, seen);

  await page.waitForTimeout(6500);                                                                    // idle hint
  await expect(page.locator('#kc-screen')).toHaveAttribute('data-hint-active', /\d/);
  expect(await page.getAttribute('img[data-kudi-pose]', 'data-kudi-pose')).toBe('fist');             // encourage pose

  const before = await page.evaluate(() => ({ coins: KC.state.coins, xp: KC.state.xp }));
  await playLostCoins(page, seen, 'save');
  const first = await page.evaluate(() => KC.state.lastReward);
  expect(first).toMatchObject({ replay: false, coins: 40, xp: 50, badges: ['badge.hard_worker', 'badge.smart_sorter'] });
  await page.click('[data-primary]'); await step(page, seen);
  const after = await page.evaluate(() => ({ coins: KC.state.coins, xp: KC.state.xp, savings: KC.state.savings }));
  expect(after.xp - before.xp).toBe(50);
  expect(after.savings).toBe(48);

  await page.click('[data-route=wallet]'); await step(page, seen); await checkChildActions(page);
  await page.click('[data-route=progress]'); await step(page, seen); await checkChildActions(page);

  // REGRESSION (002 code review): replay must not pay coins again or touch the first run's history
  const walletBefore = await walletView(page);
  const xpBefore = await page.evaluate(() => KC.state.xp);
  await page.click('[data-route=home]'); await step(page, seen);
  await playLostCoins(page, seen, 'spend', { wrongOnce: true, switchFrom: 'save' });
  expect(await page.evaluate(() => KC.state.lastReward)).toMatchObject({ replay: true, coins: 0, xp: 5, badges: [] });
  await page.click('[data-primary]'); await step(page, seen);
  const walletAfter = await walletView(page);
  expect(walletAfter).toEqual({ ...walletBefore });
  expect(walletAfter.history.some((h) => h.startsWith('Saved in my jar Today'))).toBe(true);
  expect(await page.evaluate(() => KC.state.xp)).toBe(xpBefore + 5);

  for (const s of REQUIRED_SCREENS) expect(seen.has(s), `visited ${s}`).toBe(true);
  expect(offOrigin).toEqual([]);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => window.__tts)).toBe(0);
  const stored = await page.evaluate(() => JSON.stringify(sessionStorage) + JSON.stringify(localStorage) + JSON.stringify(KC.state));
  expect(stored).not.toContain('parent@example.com');
  expect(stored).not.toContain('2580');
});

test('first run: changing save → spend leaves exactly one choice line and the right balances', async ({ page }) => {
  const seen = new Set();
  await page.goto(URL + '#/home');
  const start = await page.evaluate(() => ({ coins: KC.state.coins, savings: KC.state.savings }));
  await playLostCoins(page, seen, 'spend', { switchFrom: 'save' });
  const s = await page.evaluate(() => ({ coins: KC.state.coins, savings: KC.state.savings, items: KC.state.items.length,
    choiceLines: KC.state.events.filter((e) => e.kind === 'save' || e.kind === 'spend').map((e) => e.kind) }));
  expect(s.choiceLines).toEqual(['spend']);
  expect(s.savings).toBe(start.savings);
  expect(s.items).toBe(1);
  expect(s.coins).toBe(start.coins + 8 - 8 + 40);
});

test('voice: no recordings → every line shows its caption with "Recording pending"; replay re-shows it', async ({ page }) => {
  await page.goto(URL + '#/home');
  for (const screen of ['welcome', 'home', 'mission-intro', 'activity-sort', 'decision', 'wallet']) {
    await page.evaluate((s) => KC.go(s), screen);
    await page.waitForTimeout(450);
    await expect(page.locator('#kc-caption')).toHaveAttribute('data-caption-state', 'pending');
    await expect(page.locator('#kc-caption')).toContainText('Recording pending');
    await page.evaluate(() => document.getElementById('kc-caption').setAttribute('data-caption-state', 'hidden'));
    await page.click('[data-replay]');
    await expect(page.locator('#kc-caption')).toHaveAttribute('data-caption-state', 'pending');
  }
  expect(await page.evaluate(() => window.__tts)).toBe(0);
});

test('voice: dropping in 3 recordings makes them play with no code change (003 SC-008)', async ({ page }) => {
  let ffmpeg = true;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) { ffmpeg = false; }
  test.skip(!ffmpeg, 'ffmpeg not installed: cannot generate sample .m4a files');
  const dir = path.join(ROOT, 'prototype/assets/audio/en-GH');
  const tmp = path.join(ROOT, 'tools/design/.tmp/audio');
  const ids = ['welcome.say', 'intro.say', 'find.say'];
  mkdirSync(tmp, { recursive: true });
  try {
    for (const id of ids) {
      const f = path.join(tmp, `${id}.m4a`);
      if (!existsSync(f)) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '1.5', '-c:a', 'aac', '-b:a', '64k', f]);
      copyFileSync(f, path.join(dir, `${id}.m4a`));
    }
    execFileSync('node', [path.join(ROOT, 'tools/design/build-narration.mjs')]);
    await page.goto(URL + '#/welcome');
    await page.mouse.click(5, 5);                                       // a user gesture so the browser allows playback
    for (const [screen, id] of [['welcome', 'welcome.say'], ['mission-intro', 'intro.say'], ['activity-find', 'find.say']]) {
      await page.evaluate(({ s, l }) => { KC.go(s); KC.voice.play(l); }, { s: screen, l: id });
      await expect(page.locator('#kc-caption')).toHaveAttribute('data-caption-state', /playing|done/);
      expect(await page.evaluate(() => KC.audioManifest.lines['en-GH'][document.body.getAttribute('data-last-line')].status)).toBe('recorded');
    }
    await page.evaluate(() => KC.go('decision'));                        // a line still pending → caption
    await page.waitForTimeout(450);
    await expect(page.locator('#kc-caption')).toHaveAttribute('data-caption-state', 'pending');
    expect(await page.evaluate(() => window.__tts)).toBe(0);
  } finally {
    for (const id of ids) rmSync(path.join(dir, `${id}.m4a`), { force: true });
    execFileSync('node', [path.join(ROOT, 'tools/design/build-narration.mjs')]);
  }
});

test('regions: coin art follows the region, coin counts never change, no currency symbol in 4–6 amounts (002 §4.6)', async ({ page }) => {
  await page.goto(URL + '?review=1#/home');
  const reads = {};
  for (const region of ['gh', 'ng', 'uk']) {
    await page.click(`[data-region-choice="${region}"]`);
    const label = await page.locator('[data-currency-label]').first().innerText();
    expect(label).toContain({ gh: 'GH₵', ng: '₦', uk: '£' }[region]);
    await page.click('#kc-reviewer [aria-label="Close"]');
    const values = [];
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
    await page.evaluate(() => { KC.go('home'); KC.openReviewer(); });
  }
  expect(reads.ng).toEqual(reads.gh);
  expect(reads.uk).toEqual(reads.gh);
});

/* Regressions from the round-1 code review (T058). */
test('keyboard: avatar, nickname and save-or-spend cards select with Enter; Sort is playable by keyboard alone', async ({ page }) => {
  await page.goto(URL + '#/avatar');
  await page.locator('#kc-screen [data-component=choice-card][role=radio]').nth(1).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#kc-screen .kc-choice-grid [role=radio]').nth(1)).toHaveAttribute('aria-checked', 'true');
  const chip = page.locator('#kc-screen .kc-chip').nth(2);
  await chip.focus(); await page.keyboard.press(' ');
  await expect(chip).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => KC.state.nickname)).toBe(await chip.innerText());

  await page.evaluate(() => KC.go('decision'));
  await page.locator('#kc-screen [data-choice=spend]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#kc-screen [data-choice=spend]')).toHaveAttribute('aria-checked', 'true');

  await page.evaluate(() => { KC.resetRun(); KC.go('activity-sort'); });
  for (let guard = 0; guard < 20 && await page.locator('.kc-tray [data-component=coin-token]').count(); guard++) {
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
  await page.goto(URL + '#/home');
  // confetti pieces have a real brand colour (the v0.1.0 token names were removed)
  const colours = await page.evaluate(() => {
    KC.celebrate();
    return [...document.querySelectorAll('.kc-confetti:not(.kc-confetti--coin)')].map((el) => getComputedStyle(el).backgroundColor);
  });
  expect(colours.length).toBeGreaterThan(0);
  expect(colours.filter((c) => c === 'rgba(0, 0, 0, 0)' || c === 'transparent')).toEqual([]);
  // a bottom-nav label is not replaced by the screen prompt
  await page.click('#kc-bottom-nav [data-route=wallet]');
  await page.clock.runFor(1000);
  expect(await page.evaluate(() => document.body.getAttribute('data-last-line'))).toBe('nav.wallet');
  // long idle (20 s) → wave + welcome back
  await page.evaluate(() => KC.go('mission-intro'));
  await page.clock.runFor(20500);
  await expect(page.locator('#kc-screen img[data-kudi-pose]')).toHaveAttribute('data-kudi-pose', 'wave');
  expect(await page.evaluate(() => document.body.getAttribute('data-last-line'))).toBe('hint.welcome_back');
  // tapping a word plays its line; with no recording its caption is highlighted
  await page.locator('#kc-screen .kc-ask .kc-child-text').click();
  await expect(page.locator('#kc-caption')).toHaveClass(/is-highlight/);
  expect(await page.evaluate(() => document.body.getAttribute('data-last-line'))).toBe('intro.help');
  expect(await page.evaluate(() => window.__tts)).toBe(0);
});
