// 005 T049: the hub: cards, role lists from the journey map, release values, old links, overflow, noindex.
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../lib.mjs';
import { VIEWPORTS, watch, expectNoOverflow } from './helpers.mjs';

const map = JSON.parse(readFileSync(path.join(ROOT, 'docs/design/journey-map.json'), 'utf8'));

test('hub shows the three platforms, version, date and coverage that match release.json', async ({ page, request }) => {
  const w = watch(page);
  await page.goto('index.html');
  await expect(page.locator('h1')).toHaveText('The KudiCubs design set');
  for (const name of ['Mobile app', 'Website', 'Dashboards']) await expect(page.getByRole('heading', { name, level: 3 })).toBeVisible();
  const rel = await (await request.get('release.json')).json();
  await expect(page.locator('#hub-version')).toHaveText(`Version ${rel.version}`);
  await expect(page.locator('#hub-date')).toHaveText(rel.date);
  await expect(page.locator('#hub-coverage')).toContainText(String(rel.coverage.designed));
  await expect(page.locator('#hub-changes li').first()).not.toContainText('Loading');
  w.assertClean();
});

test('role tabs list the journeys of that role from the map, and designed ones link to screens', async ({ page }) => {
  await page.goto('index.html');
  const expected = (actors) => map.rows.filter((r) => actors.includes(r.actor) && r.status !== 'out-of-scope').length;
  const ROLES = { child: ['child-4-6', 'child-7-9', 'child-10-12', 'child-13-15'], parent: ['parent'], visitor: ['visitor'], staff: ['support', 'content-editor'], reviewer: ['reviewer'] };
  for (const [role, actors] of Object.entries(ROLES)) {
    await page.locator(`#hub-roles [data-role=${role}]`).click();
    await expect(page.locator(`#hub-roles [data-role=${role}]`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#hub-journeys li')).toHaveCount(expected(actors));
  }
  await page.locator('#hub-roles [data-role=child]').click();
  const first = page.locator('#hub-journeys .hub-links a').first();
  await expect(first).toHaveAttribute('href', /^app\/#\/[a-z0-9-]+$/);
});

test('old 004 links with a hash are forwarded to the app', async ({ page }) => {
  await page.goto('index.html#/home');
  await page.waitForURL(/\/app\/#\/home$/);
});

for (const [name, vp] of Object.entries(VIEWPORTS)) {
  test(`hub has no horizontal overflow at ${name}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('index.html');
    await expectNoOverflow(page, name);
  });
}

test('every page in the set is noindex and robots.txt disallows all', async ({ request }) => {
  const dist = path.join(ROOT, process.env.KC_DIST || 'dist');
  const walk = (d) => readdirSync(d).flatMap((f) => { const p = path.join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
  const pages = walk(dist).filter((f) => f.endsWith('.html'));
  expect(pages.length).toBeGreaterThan(0);
  for (const f of pages) expect(readFileSync(f, 'utf8'), path.relative(dist, f)).toMatch(/<meta[^>]+name=["']robots["'][^>]+noindex/i);
  expect(await (await request.get('robots.txt')).text()).toContain('Disallow: /');
});

test('the retired root service worker unregisters itself and the app is under /app/', async ({ request }) => {
  const sw = await (await request.get('sw.js')).text();
  expect(sw).toContain('unregister');
  expect((await request.get('app/')).status()).toBe(200);
});
