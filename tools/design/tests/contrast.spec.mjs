// E8 (004 FR-049, research R15): every visible text on every screen passes WCAG AA against its effective
// background (4.5:1; 3:1 for large text ≥ 24 px, or ≥ 18.66 px bold), and every pair found is recorded in
// docs/design/tokens.json "pairs". check-contrast.mjs still checks the recorded pairs themselves.
// Break it: white text on a yellow button.
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, tokenMap, resolve, contrast, TOKENS_JSON } from '../lib.mjs';
import { noTts, fresh } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

const tokens = readJson(TOKENS_JSON);
const map = tokenMap(tokens);
const hex = (v) => resolve(v, map).toUpperCase();
const recorded = new Set(tokens.pairs.map((p) => `${hex(p.fg)}/${hex(p.bg)}`));

test('every visible text passes WCAG AA, and every pair in use is recorded', async ({ page }) => {
  await page.goto('./#/welcome');
  const found = await page.evaluate(async () => {
    const out = [];
    const toHex = (c) => { const m = c.match(/\d+(\.\d+)?/g); if (!m) return null; const [r, g, b, a] = m.map(Number); if (a === 0) return null;
      return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('').toUpperCase(); };
    const scan = (label) => {
      const walker = document.createTreeWalker(document.getElementById('kc-phone'), NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent.trim()) continue;
        const el = n.parentElement;
        if (!el.getClientRects().length || el.closest('[hidden], #kc-overlay, [aria-hidden=true]')) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || Number(cs.opacity) === 0) continue;
        let bg = null, overImage = false;
        for (let a = el; a; a = a.parentElement) {
          const s = getComputedStyle(a);
          if (s.backgroundImage !== 'none' && !/gradient/.test(s.backgroundImage)) { overImage = true; break; }
          const nums = (s.backgroundColor.match(/[\d.]+/g) || []).map(Number);
          const alpha = /rgba|color\(/.test(s.backgroundColor) ? nums[nums.length - 1] : 1;
          if (alpha === 0) continue;                                          // transparent: look further up
          if (alpha < 1) { overImage = true; break; }                         // a see-through tint: judged by the recorded tint pairs
          bg = toHex(s.backgroundColor); break;
        }
        const size = parseFloat(cs.fontSize), weight = Number(cs.fontWeight) || 400;
        out.push({ screen: label, text: n.textContent.trim().slice(0, 30), fg: toHex(cs.color), bg, overImage, large: size >= 24 || (size >= 18.66 && weight >= 700) });
      }
    };
    KC.loadSample();
    for (const id of KC.order) {
      if (KC.MISSION.indexOf(id) > 0) { KC.resetRun(); KC.run.reached = KC.MISSION.indexOf('summary'); KC.state.lostCoins.choice = 'save'; }
      if (id === 'reward') KC.run.pendingReward = true;
      KC.go(id, { force: true });
      await new Promise((r) => setTimeout(r, 30));
      scan(id);
    }
    KC.openReviewer(); scan('reviewer-menu'); KC.closeReviewer();
    return out;
  });
  const fails = [], unrecorded = new Set(), skipped = [];
  for (const f of found) {
    if (f.overImage || !f.bg || !f.fg) { skipped.push(`${f.screen}: "${f.text}"`); continue; }
    const ratio = contrast(f.fg, f.bg);
    const min = f.large ? 3 : 4.5;
    if (ratio < min) fails.push(`${f.screen}: "${f.text}" ${f.fg} on ${f.bg} = ${ratio.toFixed(2)} < ${min}`);
    if (!recorded.has(`${f.fg}/${f.bg}`)) unrecorded.add(`${f.fg} on ${f.bg} (e.g. ${f.screen}: "${f.text}")`);
  }
  console.log(`contrast: ${found.length - skipped.length} text nodes checked, ${skipped.length} over images or tints (covered by the recorded pairs)`);
  expect(fails, fails.join('\n')).toEqual([]);
  expect([...unrecorded], [...unrecorded].join('\n')).toEqual([]);
});
