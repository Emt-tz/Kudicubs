// 005 T087: plan Performance Goals and Constraints: first screen interactive within 2 s on a throttled profile,
// each page under 1 MB (excluding fonts and shared brand art), and the app reloads offline after the first visit.
import { test, expect } from '@playwright/test';

const PAGES = ['index.html', 'website/index.html', 'dashboard/index.html', 'dashboard/parent/index.html', 'dashboard/team/index.html'];
for (const url of PAGES) {
  test(`${url}: under 1 MB and interactive within 2 s (throttled CPU)`, async ({ page, context }) => {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let bytes = 0;
    page.on('response', async (r) => {
      const u = r.url();
      if (/\/shared\/(fonts|brand)\//.test(u)) return;
      try { bytes += (await r.body()).length; } catch { /* redirects have no body */ }
    });
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    const ms = Date.now() - t0;
    await page.waitForLoadState('networkidle');
    expect(ms, `first screen took ${ms} ms`).toBeLessThan(2000);
    expect(bytes, `page weight ${bytes} bytes`).toBeLessThan(1_000_000);
  });
}

test('the app reloads offline after the first visit', async ({ page, context }) => {
  await page.goto('app/#/welcome');
  await page.waitForFunction(() => document.getElementById('kc-screen'));
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.waitForTimeout(1500);                       // let the worker finish caching
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#kc-screen')).toBeVisible();
  await context.setOffline(false);
});
