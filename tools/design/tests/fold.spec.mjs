// E2 (004 FR-001, FR-002, FR-042): on every screen, at 360×640 and 390×844, the main action is fully in view
// without scrolling — after render and after every interaction. Runs in all four projects (both sizes).
// It also runs the shared audit at every step, so the 48 × 48 rule (E7) is checked at 360×640.
// Break it: remove the sticky footer (.kc-screen > .kc-actions); make the Count jar coins smaller than 48 px
// (the global child-action min-size has to be overridden too, or it keeps them at 48).
import { test, expect } from '@playwright/test';
import { noTts, fresh, guard, mainActionHidden, passGate, drag, screenIs, audit } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

async function fold(page, label) {
  await page.waitForTimeout(80);
  const r = await page.evaluate(() => document.getElementById('kc-screen').getAttribute('data-screen'));
  const m = await mainActionHidden(page);
  expect(m.none, `${label} (${r}): has a main action`).toBeFalsy();
  expect(m.scrollTop, `${label} (${r}): no scrolling`).toBe(0);
  expect(m.hidden, `${label} (${r}): main action "${m.what}" is ${m.hidden}px out of view`).toBe(0);
  // FR-002: Kudi's prompt (the bubble and an asked question) is never pushed out of view or under the pinned footer
  const covered = await page.evaluate(() => {
    const scr = document.getElementById('kc-screen'), s = scr.getBoundingClientRect();
    const foot = scr.querySelector(':scope > .kc-actions');
    const limit = foot && foot.children.length ? foot.getBoundingClientRect().top : Math.min(innerHeight, s.bottom);
    return [...scr.querySelectorAll('.kc-bubble, .kc-ask')].filter((e) => e.getClientRects().length && !e.closest('[hidden]'))
      .map((e) => ({ t: e.innerText.trim().slice(0, 30), r: e.getBoundingClientRect() }))
      .filter((x) => x.r.bottom > limit + 1 || x.r.top < s.top - 1).map((x) => `"${x.t}" ${Math.round(x.r.bottom - limit)}px under`);
  });
  expect(covered, `${label} (${r}): Kudi's prompt covered: ${covered.join(', ')}`).toEqual([]);
  const { problems } = await audit(page);                     // E7 at this size too: one main action, every target ≥ 48 × 48
  expect(problems, `${label}: ${problems.join('\n')}`).toEqual([]);
}

test('fold: the main action is always fully in view, through onboarding and The Lost Coins', async ({ page }) => {
  const g = guard(page);
  await page.goto('./#/welcome');
  await fold(page, 'welcome');
  await page.click('[data-primary]'); await fold(page, 'age');
  await page.click('[data-component=choice-card]:not(.is-locked)'); await fold(page, '1. age after picking (Next)');
  await page.click('[data-primary]'); await fold(page, 'avatar');
  await page.locator('[data-primary-group] [data-component=choice-card]').first().click(); await fold(page, "2. avatar after picking (That's me!)");
  await page.click('.kc-chip >> nth=1'); await fold(page, 'avatar after a nickname');
  await page.click('[data-primary]'); await fold(page, 'gate: hold');
  await passGate(page);
  await fold(page, 'home (first visit)');
  await page.click('[data-primary]'); await screenIs(page, 'mission-intro'); await fold(page, 'intro');
  await page.click('#kc-screen [data-child-action="answer"]'); await fold(page, '3. intro after "Yes!" (Start)');
  await page.click('[data-primary]'); await fold(page, 'find');
  let n = 0;
  while (await page.locator('.kc-scene [data-component=coin-token]:not(.is-found)').count()) {
    await page.locator('.kc-scene [data-component=coin-token]:not(.is-found)').first().click();
    await fold(page, `find after coin ${++n}`);
  }
  await page.click('[data-primary]'); await fold(page, 'sort');
  n = 0;
  while (await page.locator('.kc-tray [data-component=coin-token]').count()) {
    const c = page.locator('.kc-tray [data-component=coin-token]').first();
    const d = await c.getAttribute('data-denom');
    await drag(page, c, page.locator(`[data-component=jar][data-jar="${d}"]`));
    await fold(page, `sort after coin ${++n}`);
  }
  await page.click('[data-primary]'); await fold(page, 'count');
  for (let j = 0; j < 3; j++) {
    const grp = page.locator('[data-primary-group] [data-component=coin-token]:not(.is-counted)');
    while (await grp.count()) { await grp.first().click(); await fold(page, `count jar ${j + 1}`); }
    await page.waitForTimeout(650);
  }
  await fold(page, 'count: "Which jar has the most coins?"');
  await expect(page.locator('[data-count-total]')).toBeHidden();              // FR-007
  const most = await page.evaluate(() => KC.region().lostCoinsSet[KC.jarCounts().indexOf(Math.max.apply(null, KC.jarCounts()))]);
  await page.click(`[data-component=jar][data-jar="${most}"]`); await fold(page, '4. count after answering (Next)');
  await page.click('[data-primary]'); await fold(page, 'decision');
  await page.click('[data-choice=save]'); await fold(page, 'decision after choosing (OK)');
  await page.click('[data-primary]'); await fold(page, 'result');
  await page.click('#kc-screen [data-child-action="tap"]'); await fold(page, 'result after tapping the jar');
  await page.click('[data-primary]'); await screenIs(page, 'summary'); await fold(page, '5. summary before answering (answer cards)');
  await page.click('[data-answer=save]'); await fold(page, '6. summary after answering (Next)');
  await page.click('[data-primary]'); await screenIs(page, 'reward'); await fold(page, '7. reward (Back to Home)');
  await page.click('[data-primary]'); await screenIs(page, 'home'); await fold(page, 'home after a run');
  await page.click('[data-route=wallet]'); await fold(page, 'wallet after a run');
  await page.click('[data-route=progress]'); await fold(page, 'progress after a run');
  g.expectClean();
});

test('fold: hub screens with a first visit and with full sample data', async ({ page }) => {
  await page.goto('./#/welcome');
  for (const id of ['home', 'wallet', 'progress']) { await page.evaluate((s) => KC.go(s), id); await fold(page, `${id} (empty)`); }
  await page.evaluate(() => KC.loadSample());
  for (const id of ['home', 'wallet', 'progress']) { await page.evaluate((s) => KC.go(s), id); await fold(page, `${id} (sample data)`); }
});

/* FR-002: the fold is fixed by layout, never by smaller text. Text sizes at 360×640 equal those at 390×844. */
test('fold: no text is smaller on the small phone', async ({ browser }) => {
  const sizes = async (viewport) => {
    const ctx = await browser.newContext({ viewport, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto('./#/welcome');
    const out = await p.evaluate(() => {
      KC.loadSample();
      const r = {};
      for (const id of ['welcome', 'age-select', 'avatar', 'home', 'mission-intro', 'activity-find', 'activity-sort', 'activity-count', 'decision', 'result-save', 'summary', 'wallet', 'progress']) {
        if (KC.MISSION.indexOf(id) > 0) { KC.resetRun(); KC.run.reached = KC.MISSION.indexOf('summary'); KC.state.lostCoins.choice = 'save'; }
        KC.go(id, { force: true });
        document.querySelectorAll('#kc-screen .kc-title, #kc-screen .kc-child-text, #kc-screen .kc-label, #kc-screen .kc-display, #kc-screen .kc-counter, #kc-screen .kc-jar-count, #kc-screen .kc-big, #kc-screen button').forEach((el, i) => {
          r[id + ':' + i] = parseFloat(getComputedStyle(el).fontSize);
        });
      }
      KC.resetRun(); KC.go('activity-count', { force: true });
      r.counter = parseFloat(getComputedStyle(document.querySelector('.kc-counter')).fontSize);
      r.displayXl = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--kc-typography-display-xl-size'));
      return r;
    });
    await ctx.close();
    return out;
  };
  const big = await sizes({ width: 390, height: 844 });
  const small = await sizes({ width: 360, height: 640 });
  const smaller = Object.keys(big).filter((k) => !['counter', 'displayXl'].includes(k) && small[k] !== undefined && small[k] < big[k]).map((k) => `${k}: ${small[k]} < ${big[k]}`);
  expect(smaller, smaller.join('\n')).toEqual([]);
  // and against round 1 (003): the Count counter keeps its 1.6 × display-xl size at both sizes (it went 64 → 40 px once)
  for (const v of [big, small]) expect(v.counter).toBeCloseTo(v.displayXl * 1.6, 0);
});

/* 005 (FR-005, FR-008): every new child screen keeps its main action in view at 360×640 and 390×844, after render and after
   every choice, and passes the shared audit (one main action, targets ≥ 48×48). */
const BAND_RUNS = [
  { band: 'b7_9', m: 'm7', steps: [['m7-decision', 'smart', 'fancy']], label: 'The Birthday Party' },
  { band: 'b10_12', m: 'm10', steps: [['m10-resource', 'savings', 'loan'], ['m10-market', '5', '8']], label: 'The Clothing Brand' },
  { band: 'b13_15', m: 'm13', steps: [['m13-budget', '20', '25'], ['m13-market', '9', '12']], label: 'Side Hustle' },
];
for (const def of BAND_RUNS) {
  test(`fold: the ${def.band} mission, from Home to Reward, with a poor result and a retry`, async ({ page }) => {
    const g = guard(page);
    await page.goto('./#/welcome');
    await page.evaluate((b) => { KC.loadSample(); KC.state.band = b; KC.go('home'); }, def.band);
    await fold(page, `${def.band} home`);
    await page.click('[data-primary]'); await screenIs(page, `${def.m}-intro`); await fold(page, `${def.m} intro`);
    await page.click('[data-primary]');
    for (let round = 0; round < 2; round++) {                                       // round 0 is poor (retry), round 1 is good
      for (const [id, good, poor] of def.steps) {
        await screenIs(page, id); await fold(page, `${id} before choosing`);
        await page.click(`[data-choice="${round === 0 ? poor : good}"]`); await fold(page, `${id} after choosing`);
        await page.click('[data-primary]');
      }
      await screenIs(page, `${def.m}-result`); await fold(page, `${def.m} result (${round === 0 ? 'poor: Try again' : 'good: Next'})`);
      if (round === 0) await page.click('#kc-screen .kc-actions [data-primary]');
    }
    await page.click('#kc-screen .kc-actions [data-primary]'); await screenIs(page, `${def.m}-summary`); await fold(page, `${def.m} summary`);
    await page.click('[data-primary]'); await screenIs(page, 'reward'); await fold(page, `${def.band} reward`);
    await page.click('[data-primary]'); await screenIs(page, 'home');
    await page.click('[data-route=wallet]'); await fold(page, `${def.band} wallet`);
    await page.click('[data-route=progress]'); await fold(page, `${def.band} progress`);
    g.expectClean();
  });
}

test('fold: age select with all four bands, profile, daily challenge, level-up and badge detail', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => KC.go('age-select'));
  await fold(page, 'age select');
  for (let i = 1; i < 4; i++) { await page.locator('.kc-choice-grid [data-component=choice-card]').nth(i).click(); await fold(page, `age select after card ${i + 1}`); }
  for (const b of ['b4_6', 'b7_9', 'b10_12', 'b13_15']) {
    await page.evaluate((x) => { KC.loadSample(); KC.state.band = x; }, b);
    for (const id of ['profile', 'daily-challenge', 'level-up', 'badge-detail', 'home', 'wallet', 'progress']) {
      await page.evaluate((i) => KC.jumpTo(i), id); await fold(page, `${b} ${id}`);
    }
    await page.evaluate(() => KC.jumpTo('badge-detail'));
    await page.click('[data-badge="badge.hard_worker"]'); await fold(page, `${b} badge detail (locked)`);
  }
  await page.evaluate(() => { KC.state.events = []; KC.state.sample = false; KC.go('daily-challenge'); }); await fold(page, 'daily challenge (empty)');
  await page.evaluate(() => KC.go('badge-detail')); await fold(page, 'badge detail (empty)');
});

test('fold: the band decision screens fit in all three regions (longer example names)', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); });
  for (const r of ['gh', 'ng', 'uk']) {
    for (const [band, id] of [['b7_9', 'm7-decision'], ['b10_12', 'm10-resource'], ['b10_12', 'm10-market'], ['b13_15', 'm13-budget'], ['b13_15', 'm13-market']]) {
      await page.evaluate(([b, region, screenId]) => { KC.state.band = b; KC.setRegion(region); KC.jumpTo(screenId); }, [band, r, id]);
      await fold(page, `${r} ${id}`);
      await page.locator('#kc-screen [data-choice]').first().click(); await fold(page, `${r} ${id} after choosing`);
    }
  }
});
