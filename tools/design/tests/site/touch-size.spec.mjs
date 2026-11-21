// 005 T053 (FR-020): every visible interactive element on every adult-surface page is at least 44×44 CSS px at phone and desktop width.
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../lib.mjs';

const load = (f) => (existsSync(path.join(ROOT, f)) ? JSON.parse(readFileSync(path.join(ROOT, f), 'utf8')) : null);
const dash = load('dashboard/screens.manifest.json');
const PAGES = [
  ['hub', 'index.html', ['index']],
  ...(((load('website/screens.manifest.json') || {}).screens || []).map((s) => ['website', `website/${s.id}.html`, [s.id]])),
  ...((dash && dash.parent.screens) || []).map((s) => ['parent', `dashboard/parent/index.html#/${s.id}`, [s.id]]),
  ...((dash && dash.team.screens) || []).map((s) => ['team', `dashboard/team/index.html#/${s.id}`, [s.id]])
];
const MIN = 44;
for (const [surface, url, [id]] of PAGES) for (const width of [320, 1280]) {
  test(`${surface}/${id} at ${width}px: interactive targets are at least ${MIN}×${MIN}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const small = await page.evaluate((min) => [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab]')]
      .filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden]') && !e.classList.contains('kc-skip') && !(e.tagName === 'A' && cs.display === 'inline')   /* inline links inside a sentence are exempt (WCAG 2.5.8) */ && !(e.tagName === 'INPUT' && /^(checkbox|radio)$/.test(e.type)); })
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width < min - 0.5 || r.height < min - 0.5; })
      .map((e) => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`), MIN);
    expect(small, small.join('\n')).toEqual([]);
  });
}
