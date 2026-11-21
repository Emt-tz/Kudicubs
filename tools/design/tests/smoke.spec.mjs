// Post-deploy smoke check (004 FR-038, contracts/ci-and-deploy.md §3). Runs only with SMOKE_URL set:
//   SMOKE_URL=https://emt-tz.github.io/Kudicubs/ npx playwright test --project=smoke
// The app starts with no console errors or failed requests; every file in sw.js's list and every audio file in
// the manifest returns 200; pages are noindex; the reviewer menu shows the deployed version and build date.
import { test, expect } from '@playwright/test';
import { guard } from './helpers.mjs';

const BASE = process.env.SMOKE_URL;
test.skip(!BASE, 'set SMOKE_URL to the live link to run the smoke check');

test('live link: the hub, website and dashboards answer, and the retired root worker is in place (005)', async ({ page, request }) => {
  const base = BASE.endsWith('/') ? BASE : BASE + '/';
  for (const f of ['', 'website/index.html', 'dashboard/index.html', 'dashboard/parent/index.html', 'dashboard/team/index.html', 'release.json', 'robots.txt']) {
    expect((await request.get(base + f)).status(), base + f).toBe(200);
  }
  await page.goto(base);
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('h1')).toContainText('KudiCubs design set');
  /* an old link with a hash still reaches the app */
  await page.goto(base + '#/welcome');
  await page.waitForURL(/\/app\/#\/welcome$/);
});

test('live link: the app starts and every listed asset and audio file is reachable', async ({ page, request }) => {
  const base = (BASE.endsWith('/') ? BASE : BASE + '/') + 'app/';
  const g = guard(page);
  await page.goto(base + '#/welcome');
  await page.waitForFunction(() => document.getElementById('kc-screen')?.getAttribute('data-screen') === 'welcome', null, { timeout: 15000 });
  await expect(page.locator('#kc-boot-fail')).toBeHidden();
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', 'noindex, nofollow');
  const info = await page.evaluate(() => ({ build: KC.build, audio: Object.values(KC.audioManifest.lines).flatMap((l) => Object.values(l)).flatMap((e) => [e.file, e.scratchFile]).filter(Boolean) }));
  expect(info.build.builtAt, 'deployed builds carry a build date').toMatch(/^\d{4}-\d{2}-\d{2}$/);
  await page.evaluate(() => KC.openReviewer());
  await expect(page.locator('[data-build]')).toContainText(`Prototype v${info.build.version} · built ${info.build.builtAt}`);

  const sw = await (await request.get(base + 'sw.js')).text();
  const files = [...sw.matchAll(/^\s*'([^']+)',$/gm)].map((m) => m[1]).filter((f) => f !== './');
  const all = [...new Set([...files, ...info.audio])];
  const bad = [];
  for (let i = 0; i < all.length; i += 12) {
    const res = await Promise.all(all.slice(i, i + 12).map(async (f) => ({ f, s: (await request.get(base + f)).status() })));
    bad.push(...res.filter((r) => r.s !== 200).map((r) => `${r.s} ${base}${r.f}`));
  }
  console.log(`smoke: ${all.length} files checked on ${base} (v${info.build.version}, built ${info.build.builtAt})`);
  expect(bad, `unreachable files:\n${bad.join('\n')}`).toEqual([]);
  g.expectClean();
});
