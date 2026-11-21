// T047 (on demand): save one thumbnail per component to docs/design/img/components/{id}.png.
// Run: node capture-components.mjs   (not part of `npm run check`)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './lib.mjs';

const OUT = path.join(ROOT, 'docs/design/img/components');
mkdirSync(OUT, { recursive: true });
const URL = pathToFileURL(path.join(ROOT, 'prototype/index.html')).href;
const done = new Set();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });

async function grab(selector, id) {
  if (done.has(id)) return;
  const el = page.locator(selector).first();
  if (!(await el.count())) return;
  await el.scrollIntoViewIfNeeded();
  await el.screenshot({ path: path.join(OUT, `${id}.png`) });
  done.add(id);
}
async function grabAll() {
  const ids = await page.evaluate(() => [...new Set([...document.querySelectorAll('#kc-phone [data-component]')]
    .filter((e) => e.getBoundingClientRect().width > 0 && !e.closest('[hidden]')).map((e) => e.getAttribute('data-component')))]);
  for (const id of ids) await grab(`#kc-phone [data-component="${id}"]:visible`, id);
}
async function go(screen, prep) {
  await page.evaluate(({ screen, prep }) => { if (prep) (new Function(prep))(); KC.go(screen, { force: true }); }, { screen, prep });
  await page.waitForTimeout(250);
}

await page.goto(URL + '#/welcome');
await page.waitForTimeout(300);
await grabAll();
for (const s of ['age-select', 'avatar']) { await go(s); await grabAll(); }
// 004: full screens come from the reviewer's sample data, and mission screens need a run (the route guard)
await page.evaluate(() => KC.loadSample());
const RUN = 'KC.resetRun(); KC.run.reached = KC.MISSION.indexOf("summary"); KC.state.lostCoins.found = 8; KC.state.lostCoins.choice = "save";';
await go('home'); await grabAll();
for (const s of ['mission-intro', 'activity-find', 'activity-sort', 'activity-count', 'decision']) { await go(s, RUN); await grabAll(); }
await go('result-save', RUN); await grabAll();
await go('summary', RUN); await grabAll();
await go('reward', RUN + ' KC.run.pendingReward = true;'); await page.waitForTimeout(200); await grabAll();
await go('wallet'); await grabAll();
await go('progress'); await grabAll();

// gentle-hint is a state of the main action
await go('home');
await page.evaluate(() => document.querySelector('[data-primary]').classList.add('kc-hint'));
await grab('[data-primary].kc-hint', 'gentle-hint');

// celebration overlay (motion allowed for this one shot)
await page.emulateMedia({ reducedMotion: 'no-preference' });
await page.evaluate(() => KC.celebrate());
await page.waitForTimeout(450);
await page.locator('#kc-phone').screenshot({ path: path.join(OUT, 'celebration-overlay.png') });
done.add('celebration-overlay');
await page.emulateMedia({ reducedMotion: 'reduce' });

// parent gate pads
await go('parent-gate');
const hold = page.locator('.kc-hold');
const box = await hold.boundingBox();
await page.mouse.move(box.x + 20, box.y + 20); await page.mouse.down(); await page.waitForTimeout(3150); await page.mouse.up();
await grab('[data-component="parent-gate-pad"]', 'parent-gate-pad');
const q = await page.getAttribute('[data-question]', 'data-question');
const [a, b] = q.split('x').map(Number);
for (const d of String(a * b)) await page.click(`[data-component=parent-gate-pad] button:text-is("${d}")`);
await page.click('[data-primary]');
await grab('[data-component="pin-pad"]', 'pin-pad');

// reviewer menu + region coin set
await go('home');
await page.evaluate(() => KC.openReviewer());
await page.waitForTimeout(200);
await grab('.kc-reviewer-sheet', 'reviewer-menu');
await grab('.kc-reviewer-sheet [data-component="region-coin-set"]', 'region-coin-set');
await grab('.kc-reviewer-sheet [data-component="secondary-button"]', 'secondary-button');

await browser.close();
console.log(`captured ${done.size} components: ${[...done].sort().join(', ')}`);
