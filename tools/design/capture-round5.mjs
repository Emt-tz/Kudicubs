// 005 T055: screenshots of the shared components and one screen per surface, for docs/design/img/round5/.
//   node build-site.mjs && PORT=4199 node serve.mjs --root dist &   then   node capture-round5.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const BASE = process.env.BASE || 'http://127.0.0.1:4199/';
const OUT = path.join(ROOT, 'docs/design/img/round5');
mkdirSync(OUT, { recursive: true });
const SHOTS = [
  ['components-desktop', 'shared/component-sheet.html', 1280, 1100],
  ['components-phone', 'shared/component-sheet.html', 390, 1400],
  ['hub-desktop', 'index.html', 1280, 900],
  ['website-home-desktop', 'website/index.html', 1280, 900],
  ['website-home-phone', 'website/index.html', 390, 844],
  ['parent-overview-desktop', 'dashboard/parent/index.html#/overview', 1280, 900],
  ['parent-child-phone', 'dashboard/parent/index.html#/child', 390, 844],
  ['team-content-desktop', 'dashboard/team/index.html#/content?role=content', 1280, 800]
];
const browser = await chromium.launch();
for (const [name, url, width, height] of SHOTS) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(BASE + url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(OUT, name + '.png'), fullPage: false });
  await page.close();
  console.log('captured', name);
}
await browser.close();
