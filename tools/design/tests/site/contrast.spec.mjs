// 005 T053: computed WCAG AA contrast for every visible text node on every adult-surface page (4.5:1, or 3:1 for large text).
import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../lib.mjs';

const load = (f) => (existsSync(path.join(ROOT, f)) ? JSON.parse(readFileSync(path.join(ROOT, f), 'utf8')) : null);
const dash = load('dashboard/screens.manifest.json');
const PAGES = [
  ['hub', 'index.html'], ['component-sheet', 'shared/component-sheet.html'],
  ...(((load('website/screens.manifest.json') || {}).screens || []).map((s) => ['website/' + s.id, `website/${s.id}.html`])),
  ...((dash && dash.parent.screens) || []).map((s) => ['parent/' + s.id, `dashboard/parent/index.html#/${s.id}`]),
  ...((dash && dash.team.screens) || []).map((s) => ['team/' + s.id, `dashboard/team/index.html#/${s.id}`])
];

for (const [name, url] of PAGES) for (const width of [320, 1280]) {
  test(`${name} at ${width}px: text contrast meets WCAG AA`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const bad = await page.evaluate(() => {
      const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
      const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const over = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
      const bgOf = (el) => {
        const stack = [];
        for (let e = el; e; e = e.parentElement) {
          const cs = getComputedStyle(e);
          if (cs.backgroundImage !== 'none') return null;           // over an image or gradient: covered by recorded pairs elsewhere
          const c = parse(cs.backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a === 1) break; }
        }
        let base = { r: 254, g: 245, b: 224, a: 1 };            // page background fallback: Warm Cream
        for (const c of stack.reverse()) base = over(c, base);
        return base;
      };
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement; if (!el || el.closest('[hidden], script, style, noscript')) continue;
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
        if (el.closest('.kc-sr-only, .kc-skip')) continue;
        const bg = bgOf(el); if (!bg) continue;
        let fg = parse(cs.color); if (!fg) continue; if (fg.a < 1) fg = over(fg, bg);
        const L1 = lum(fg), L2 = lum(bg), ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        const px = parseFloat(cs.fontSize), bold = Number(cs.fontWeight) >= 700;
        const need = px >= 24 || (px >= 18.66 && bold) ? 3 : 4.5;
        if (el.matches(':disabled, [aria-disabled=true]')) continue;   // disabled controls are exempt from AA
        if (ratio < need) out.push(`"${n.textContent.trim().slice(0, 28)}" ${ratio.toFixed(2)} < ${need} (${cs.color} on rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}))`);
      }
      return [...new Set(out)];
    });
    expect(bad, bad.join('\n')).toEqual([]);
  });
}
