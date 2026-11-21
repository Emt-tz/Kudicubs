// 005 T014: shared helpers for the specs under tests/site/ (they run against dist/, see playwright.config.mjs).
import { expect } from '@playwright/test';

export const VIEWPORTS = { phone: { width: 320, height: 640 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1280, height: 800 } };

/** Collect console errors and failed requests; call assertClean() at the end of a test. */
export function watch(page) {
  const problems = [];
  page.on('console', (m) => { if (m.type() === 'error') problems.push('console: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('request failed: ' + r.url()));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`HTTP ${r.status()}: ${r.url()}`); });
  return { assertClean: () => expect(problems, problems.join('\n')).toEqual([]) };
}

/** No horizontal overflow at the given viewport (SC-008). */
export async function expectNoOverflow(page, label = '') {
  const over = await page.evaluate(() => {
    const d = document.documentElement;
    return { sw: d.scrollWidth, cw: d.clientWidth, wide: [...document.querySelectorAll('body *')].filter((e) => e.getBoundingClientRect().right > d.clientWidth + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.kc-table-wrap, .kc-tabs, [data-scroll-x]')).slice(0, 3).map((e) => e.tagName + '.' + e.className) };
  });
  expect(over.sw, `horizontal overflow ${label}: ${over.sw} > ${over.cw}; ${over.wide.join(', ')}`).toBeLessThanOrEqual(over.cw + 1);
}
