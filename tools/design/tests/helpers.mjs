// Shared test helpers (004 T005). Every spec: synthetic-speech stub, console/request guards, fresh storage.
import { expect } from '@playwright/test';

export const COMPONENTS = ['primary-button', 'secondary-button', 'icon-button', 'choice-card', 'speaker-cue', 'kudi-bubble', 'illustration',
  'coin-counter', 'xp-bar', 'level-badge', 'streak-daily', 'badge-tile', 'jar', 'coin-token', 'progress-dots', 'bottom-nav', 'region-coin-set',
  'parent-gate-pad', 'pin-pad', 'action-result', 'bar-chart', 'level-path-node', 'celebration-overlay', 'gentle-hint', 'reviewer-menu',
  'replay-button', 'narration-caption', 'count-badge'];
export const LOST_COINS = ['mission-intro', 'activity-find', 'activity-sort', 'activity-count', 'decision', 'result-save', 'summary', 'reward'];
export const REQUIRED_SCREENS = ['welcome', 'age-select', 'avatar', 'parent-gate', 'home', ...LOST_COINS, 'wallet', 'progress'];
export const SYMBOLS = /GH₵|₦|£/;

/** Synthetic speech must never be used (003 FR-014, 004 FR-012): count any call. */
export async function noTts(page) {
  await page.addInitScript(() => {
    window.__tts = 0;
    const fake = { speak() { window.__tts += 1; }, cancel() {}, getVoices() { return []; } };
    try { Object.defineProperty(window, 'speechSynthesis', { value: fake, configurable: true }); } catch (e) { /* ignore */ }
  });
}

/** Start from empty device storage, once per test (survives page.reload, so persistence can be tested). */
export async function fresh(page) {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('__kc_test_fresh')) {
      localStorage.clear(); sessionStorage.clear(); sessionStorage.setItem('__kc_test_fresh', '1');
    }
  });
}

/** Collect console errors, page errors, failed requests and HTTP errors (004 FR-041). */
/* opts.reloads: the test reloads on purpose, which cancels in-flight downloads (images, the service-worker
   precache); those cancellations are ignored, but HTTP errors, page errors and console errors still count. */
export function guard(page, opts = {}) {
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console.error: ${m.text()}`); });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  // Starting a new line interrupts the previous audio download; that is by design, not a failed request
  // (Chromium: net::ERR_ABORTED, WebKit: "cancelled"). Every other failure, and every HTTP error, counts.
  const interrupted = (r) => (opts.reloads || /\.(m4a|mp3)(\?|$)/.test(r.url())) && /ERR_ABORTED|cancelled/i.test(r.failure()?.errorText || '');
  page.on('requestfailed', (r) => { if (!interrupted(r)) problems.push(`request failed: ${r.url()} ${r.failure()?.errorText}`); });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  return { problems, expectClean: () => expect(problems, problems.join('\n')).toEqual([]) };
}

/** How many px of the element lie outside the viewport or outside #kc-screen's visible rectangle (0 = fully in view). */
export async function hiddenPx(page, selector) {
  return page.evaluate((sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.getClientRects().length && !e.closest('[hidden]'));
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const s = document.getElementById('kc-screen').getBoundingClientRect();
    const top = Math.max(0, s.top), bottom = Math.min(innerHeight, s.bottom);
    return Math.max(0, Math.round(r.bottom - bottom)) + Math.max(0, Math.round(top - r.top));
  }, selector);
}

/** The current main action: the visible [data-primary], else the visible [data-primary-group]. */
export const MAIN = '#kc-screen [data-primary], #kc-screen [data-primary-group]';
export async function mainActionHidden(page) {
  return page.evaluate(() => {
    const vis = (e) => e.getClientRects().length && !e.closest('[hidden]');
    const el = [...document.querySelectorAll('#kc-screen [data-primary]')].find(vis) || [...document.querySelectorAll('#kc-screen [data-primary-group]')].find(vis);
    if (!el) return { none: true };
    const scr = document.getElementById('kc-screen');
    const r = el.getBoundingClientRect(), s = scr.getBoundingClientRect();
    const top = Math.max(0, s.top), bottom = Math.min(innerHeight, s.bottom);
    return { hidden: Math.max(0, Math.round(r.bottom - bottom)) + Math.max(0, Math.round(top - r.top)), scrollTop: scr.scrollTop,
             what: (el.getAttribute('data-primary') !== null ? 'button ' : 'group ') + (el.innerText || '').trim().slice(0, 30) };
  });
}

/** Checks that hold on every screen state. Returns the screen id and problems. */
export async function audit(page) {
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
    const interactive = 'button, [role=button], [data-component=choice-card]' + (child ? ', #kc-screen [data-child-action]' : '');
    phone.querySelectorAll(interactive).forEach((el) => {                 // 002 §4.4 + 004 FR-009/FR-048: ≥ 48 × 48
      if (!visible(el) || el.closest('[hidden]') || el.closest('#kc-overlay') || el.getAttribute('aria-disabled') === 'true' || el.disabled) return;
      if (el.matches('.kc-scene [data-component=coin-token]')) return;   // hidden-object coins carry an 8 px invisible hit slop (size.hit_slop)
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
    if (!document.querySelector('[data-replay]') || !visible(document.querySelector('[data-replay]'))) problems.push(`${id}: no visible replay button`);
    if (window.__tts) problems.push(`${id}: synthetic speech was called`);
    return { id, problems };
  }, { components: COMPONENTS });
}

export async function step(page, seen) {
  const { id, problems } = await audit(page);
  expect(problems, problems.join('\n')).toEqual([]);
  if (seen) seen.add(id);
  return id;
}

export const screenIs = (page, id, timeout = 5000) =>
  page.waitForFunction((s) => document.getElementById('kc-screen')?.getAttribute('data-screen') === s, id, { timeout });

/** 003 §6.1–6.2: a child action is enabled at render, and tapping one reacts without navigating. */
export async function checkChildActions(page) {
  const r = await page.evaluate(() => {
    const root = document.getElementById('kc-screen');
    const enabled = [...root.querySelectorAll('[data-child-action]')].filter((el) => {
      const b = el.getBoundingClientRect(); return b.width > 0 && !el.disabled && el.getAttribute('aria-disabled') !== 'true';
    });
    return { id: root.getAttribute('data-screen'), n: enabled.length };
  });
  if (LOST_COINS.includes(r.id) || r.id.startsWith('result-')) expect(r.n, `${r.id} has a child action besides Next`).toBeGreaterThan(0);
  const target = page.locator('#kc-screen [data-child-action="hear"], #kc-screen [data-child-action="tap"]').first();
  if (await target.count()) {
    const before = await page.evaluate(() => ({ screen: document.getElementById('kc-screen').getAttribute('data-screen'), sfx: document.body.getAttribute('data-sfx-log') || '', line: document.body.getAttribute('data-last-line') }));
    await target.click({ force: true });
    const after = await page.evaluate(() => ({ screen: document.getElementById('kc-screen').getAttribute('data-screen'), sfx: document.body.getAttribute('data-sfx-log') || '', line: document.body.getAttribute('data-last-line'), cap: document.getElementById('kc-caption').getAttribute('data-caption-state') }));
    expect(after.screen, 'child action never navigates').toBe(before.screen);
    expect(after.sfx.length > before.sfx.length || after.line !== before.line || ['playing', 'pending', 'ready', 'hidden', 'muted'].includes(after.cap), `${r.id}: child action reacted`).toBe(true);
  }
}

/** Parent gate: hold 3 s → maths → PIN → confirm PIN (004 FR-010) → region → email. */
export async function passGate(page, { pin = '2580', confirm = pin, email = 'parent@example.com' } = {}) {
  const hold = page.locator('.kc-hold');
  const box = await hold.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(3200); await page.mouse.up();
  const q = await page.getAttribute('[data-question]', 'data-question');
  const [a, b] = q.split('x').map(Number);
  for (const d of String(a * b)) await page.click(`[data-component=parent-gate-pad] [data-key="${d}"]`);
  await page.click('[data-primary]');
  for (const d of pin) await page.click(`[data-component=pin-pad] [data-key="${d}"]`);
  await page.click('[data-primary]');
  for (const d of confirm) await page.click(`[data-component=pin-pad] [data-key="${d}"]`);
  await page.click('[data-primary]');
  if (confirm !== pin) return { answer: a * b };
  await page.click('[data-primary]');                                   // region (default)
  await page.fill('input[type=email]', email);
  await page.click('[data-primary]');
  await screenIs(page, 'home');
  return { answer: a * b };
}

/** Drag a coin onto a jar with a real pointer drag (003 FR-024). */
export async function drag(page, coin, jar) {
  await coin.scrollIntoViewIfNeeded();
  const c = await coin.boundingBox(); const j = await jar.boundingBox();
  await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
  await page.mouse.down();
  await page.mouse.move(j.x + j.width / 2, j.y + j.height / 2, { steps: 8 });
  await page.mouse.up();
}

/** Onboarding from Welcome through the gate to Home. */
export async function onboard(page, seen, { avatar = 0, nickname = null } = {}) {
  await page.click('[data-primary]'); await step(page, seen);                                      // → age
  await page.click('[data-component=choice-card]:not(.is-locked)'); await step(page, seen);
  await page.click('[data-primary]'); await step(page, seen);                                      // → avatar
  await page.locator('[data-primary-group] [data-component=choice-card]').nth(avatar).click(); await step(page, seen);
  if (nickname) await page.click(`.kc-chip:has-text("${nickname}")`);
  await page.click('[data-primary]'); await step(page, seen);                                      // → gate
  return passGate(page);
}

/** Plays The Lost Coins from Home (or wherever Continue is) to Reward. */
export async function playLostCoins(page, seen, choice, { wrongOnce = false, switchFrom = null, check = true } = {}) {
  const st = async () => { await step(page, seen); };
  const ca = async () => { if (check) await checkChildActions(page); };
  await page.click('[data-primary]'); await screenIs(page, 'mission-intro'); await st(); await ca();
  await page.click('#kc-screen [data-child-action="answer"]'); await st();                        // call and response
  await page.click('[data-primary]'); await st(); await ca();                                       // → activity-find
  while (await page.locator('.kc-scene [data-component=coin-token]:not(.is-found)').count()) {
    await page.locator('.kc-scene [data-component=coin-token]:not(.is-found)').first().click();
  }
  await st();
  await page.click('[data-primary]'); await st(); await ca();                                       // → activity-sort
  if (wrongOnce) {
    const c = page.locator('.kc-tray [data-component=coin-token]').first();
    const d = await c.getAttribute('data-denom');
    const wrong = page.locator(`[data-component=jar]:not([data-jar="${d}"])`).first();
    const badgeBefore = await wrong.locator('[data-component=count-badge]').getAttribute('data-count');
    await drag(page, c, wrong);
    expect(await wrong.locator('[data-component=count-badge]').getAttribute('data-count')).toBe(badgeBefore);
    expect(await page.getAttribute('img[data-kudi-pose]', 'data-kudi-pose')).toBe('fist');
    expect(await page.evaluate(() => document.body.getAttribute('data-sfx-log'))).toContain('boop');
    await page.waitForTimeout(700);
    await st();
  }
  while (await page.locator('.kc-tray [data-component=coin-token]').count()) {
    const c = page.locator('.kc-tray [data-component=coin-token]').first();
    const d = await c.getAttribute('data-denom');
    const jar = page.locator(`[data-component=jar][data-jar="${d}"]`);
    const before = Number(await jar.locator('[data-component=count-badge]').getAttribute('data-count'));
    await drag(page, c, jar);
    expect(Number(await jar.locator('[data-component=count-badge]').getAttribute('data-count')), 'count badge +1 per coin').toBe(before + 1);
  }
  await st();
  await page.click('[data-primary]'); await st();                                                   // → activity-count
  for (let j = 0; j < 3; j++) {
    const g = page.locator('[data-primary-group] [data-component=coin-token]:not(.is-counted)');
    while (await g.count()) await g.first().click();
    await page.waitForTimeout(650);
    await st();
  }
  expect(await page.locator('[data-primary]').count(), 'Next waits for the answer').toBe(0);
  const most = await page.evaluate(() => KC.region().lostCoinsSet[KC.jarCounts().indexOf(Math.max.apply(null, KC.jarCounts()))]);
  await page.click(`[data-component=jar][data-jar="${most}"]`); await st();
  await page.click('[data-primary]'); await st(); await ca();                                       // → decision
  if (switchFrom) {
    await page.click(`[data-choice=${switchFrom}]`); await st();
    await page.click('[data-primary]'); await st();
    await page.click('#kc-back');
    await screenIs(page, 'decision');
    await st();
  }
  await page.click(`[data-choice=${choice}]`); await st();
  await page.click('[data-primary]'); await st(); await ca();                                       // → result-*
  await page.click('[data-primary]'); await st();                                                   // → summary
  expect(await page.locator('[data-primary]').count(), 'Next waits for the answer').toBe(0);
  await page.click(`[data-answer=${choice}]`); await st();
  await page.click('[data-primary]'); await screenIs(page, 'reward'); await st(); await ca();      // → reward
}

/** Derived numbers + what the wallet shows. */
export async function walletView(page) {
  await page.click('[data-route=wallet]');
  return page.evaluate(() => {
    const v = KC.view();
    return {
      coins: v.coins, savings: v.savings, items: v.items, history: v.history.length,
      shown: [...document.querySelectorAll('#kc-screen .kc-panel [data-money]')].map((m) => m.innerText.trim()),
      rows: [...document.querySelectorAll('#kc-screen .kc-history li')].map((li) => li.innerText.replace(/\s+/g, ' ').trim()),
    };
  });
}
