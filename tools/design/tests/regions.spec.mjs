// 005 FR-007 (app part): coins and market examples change with the region (Ghana, Nigeria, United Kingdom) on every money
// screen the band missions added. Coins always come from KC.regions (the region's coin picture); examples from marketExamples.
// Break it: hard-code a currency name or symbol in a mission file, or draw a coin without KC.coinImg.
import { test, expect } from '@playwright/test';
import { noTts, fresh, guard } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

const REGIONS = ['gh', 'ng', 'uk'];
const MONEY_SCREENS = ['m7-intro', 'm7-decision', 'm7-result', 'm10-intro', 'm10-resource', 'm10-market', 'm10-result',
  'm13-intro', 'm13-budget', 'm13-market', 'm13-result', 'daily-challenge', 'home', 'wallet'];
const SYMBOLS = /GH₵|₦|£|\bcedis?\b|\bnaira\b|\bpounds?\b|\bpesewas?\b|\bkobo\b|\bpence\b/i;

async function look(page, region, id) {
  return page.evaluate(([r, screenId]) => {
    KC.setRegion(r);
    KC.jumpTo(screenId);
    const coins = [...document.querySelectorAll('#kc-screen [data-money] img')].map((i) => ({ src: i.getAttribute('src'), region: i.getAttribute('data-region') }));
    return { id: document.getElementById('kc-screen').getAttribute('data-screen'), coins, text: document.getElementById('kc-screen').innerText, ex: KC.regions[r].marketExamples,
             icon: KC.regions[r].coinIcon };
  }, [region, id]);
}

test('every new money screen shows the region\'s own coin, in all three regions', async ({ page }) => {
  const g = guard(page);
  await page.goto('./#/welcome');
  await page.evaluate(() => KC.loadSample());
  const srcs = {};
  for (const id of MONEY_SCREENS) {
    for (const r of REGIONS) {
      const v = await look(page, r, id);
      expect(v.coins.length, `${id}/${r}: no coin shown`).toBeGreaterThan(0);
      for (const c of v.coins) {
        expect(c.region, `${id}/${r}`).toBe(r);
        expect(c.src, `${id}/${r}`).toContain(`coins/${r}/${v.icon}.svg`);
      }
      (srcs[id] ||= new Set()).add(v.coins[0].src);
    }
    expect(srcs[id].size, `${id}: coin picture changes with the region`).toBe(3);
  }
  g.expectClean();
});

test('market examples change with the region: the party, the clothing brand and the hustle name the region\'s own things', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => KC.loadSample());
  const seen = { cake: new Set(), drink: new Set(), clothes: new Set() };
  for (const r of REGIONS) {
    let v = await look(page, r, 'm7-decision');
    expect(v.text).toContain(v.ex.cake.label); expect(v.text).toContain(v.ex.drink.label); expect(v.text).toContain(v.ex.snack.label);
    v = await look(page, r, 'm10-market');
    expect(v.text).toContain(v.ex.clothes.label);
    v = await look(page, r, 'm13-budget');
    expect(v.text).toContain(v.ex.drink.label);
    for (const k of Object.keys(seen)) seen[k].add(v.ex[k].label);
  }
  for (const k of Object.keys(seen)) expect(seen[k].size, `${k} examples differ by region`).toBe(3);
  // a region that has no example for the new missions would fall back silently: every region defines them
  const missing = await page.evaluate(() => Object.keys(KC.regions).filter((r) => !['cake', 'clothes', 'drink', 'snack', 'treat'].every((k) => KC.regions[r].marketExamples[k])));
  expect(missing).toEqual([]);
});

test('no currency name or symbol is written into a mission screen: coins are pictures and numbers', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => KC.loadSample());
  const bad = [];
  for (const id of ['m7-intro', 'm7-decision', 'm7-result', 'm7-summary', 'm10-intro', 'm10-resource', 'm10-market', 'm10-result', 'm10-summary',
    'm13-intro', 'm13-budget', 'm13-market', 'm13-result', 'm13-summary', 'daily-challenge']) {
    for (const r of REGIONS) {
      const v = await look(page, r, id);
      const m = v.text.match(SYMBOLS);
      if (m) bad.push(`${id}/${r}: "${m[0]}"`);
    }
  }
  expect(bad, bad.join('\n')).toEqual([]);
});

test('the region chosen by a grown-up reaches the mission and the wallet; the choice is kept after a reload', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.state.band = 'b7_9'; KC.parent.unlocked = true; KC.go('parent-region', { force: true }); });
  await page.click('[data-region-choice="ng"]');
  await page.evaluate(() => { KC.parent.unlocked = false; KC.go('home'); });
  await page.click('[data-primary]');                                                 // m7-intro
  await expect(page.locator('#kc-screen [data-money] img').first()).toHaveAttribute('data-region', 'ng');
  await page.click('[data-primary]');
  await expect(page.locator('#kc-screen')).toContainText('coconut cake');
  await page.reload(); await page.waitForTimeout(300);
  expect(await page.evaluate(() => KC.state.region)).toBe('ng');
});
