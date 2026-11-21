// 005 T015: every id in every surface manifest loads without a console error or failed request.
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../lib.mjs';
import { watch } from './helpers.mjs';

const load = (f) => (existsSync(path.join(ROOT, f)) ? JSON.parse(readFileSync(path.join(ROOT, f), 'utf8')) : null);
const dash = load('dashboard/screens.manifest.json');
const SURFACES = [
  ['website', load('website/screens.manifest.json'), (id) => `website/${id === 'index' ? 'index' : id}.html`],
  ['parent-dashboard', dash && dash.parent, (id) => `dashboard/parent/index.html#/${id}`],
  ['team-console', dash && dash.team, (id) => `dashboard/team/index.html#/${id}`],
  ['hub', load('hub/screens.manifest.json'), () => 'index.html']
];

for (const [name, manifest, url] of SURFACES) {
  for (const s of (manifest && manifest.screens) || []) {
    test(`${name}: ${s.id} loads cleanly`, async ({ page }) => {
      const w = watch(page);
      await page.goto(url(s.id));
      await page.waitForLoadState('networkidle');
      await expect(page.locator('body')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
      w.assertClean();
    });
  }
}
test('app: every manifest id is a registered screen', async ({ page }) => {
  const m = load('prototype/assets/data/screens.manifest.json');
  await page.goto('app/');
  await page.waitForFunction(() => window.KC && window.KC.screens);
  const ids = await page.evaluate(() => Object.keys(window.KC.screens));
  for (const s of m.screens) expect(ids, `app screen ${s.id}`).toContain(s.id);
});
