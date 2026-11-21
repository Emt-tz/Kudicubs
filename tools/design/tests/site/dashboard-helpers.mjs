// 005 T073/T078: shared bits for the Parent Dashboard and Team Console specs.
import { expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../lib.mjs';

export const manifest = JSON.parse(readFileSync(path.join(ROOT, 'dashboard/screens.manifest.json'), 'utf8'));
export const PARENT = 'dashboard/parent/index.html';
export const TEAM = 'dashboard/team/index.html';

/** Every visible control on the page that is smaller than 44x44 (WCAG-style: inline text links are exempt). */
export async function smallTargets(page) {
  return page.evaluate(() => {
    const out = [];
    const sel = 'button, a[href], input:not([type=hidden]), select, textarea, summary, [role=tab]';
    for (const el of document.querySelectorAll(sel)) {
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (el.matches('a') && cs.display === 'inline') continue;                       // a link inside a sentence
      const box = (el.matches('input[type=checkbox], input[type=radio]') && el.closest('label')) || el;
      const r = box.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.bottom < 0 || r.top > 100000 || (el.classList.contains('kc-skip') && r.bottom <= 0)) continue;   // the skip link waits off-screen
      if (r.width < 43.5 || r.height < 43.5) out.push(`${el.tagName.toLowerCase()}.${el.className} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return out;
  });
}
export async function expectTouchSizes(page, label) {
  const bad = await smallTargets(page);
  expect(bad, `targets under 44x44 on ${label}`).toEqual([]);
}
/** Every request stays on the page's own origin and no cookie is set (FR-014). */
export function sameOriginOnly(page) {
  const bad = [];
  page.on('request', (r) => { const u = new URL(r.url()); if (!/^(http:\/\/127\.0\.0\.1|data:|blob:)/.test(u.protocol === 'http:' ? `http://${u.hostname}` : u.protocol)) bad.push(r.url()); });
  return { assert: async (context) => { expect(bad, 'external requests').toEqual([]); expect(await context.cookies(), 'cookies').toEqual([]); } };
}
