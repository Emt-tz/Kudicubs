// 005 T066: website flows (Story 4, FR-011..FR-014). Runs against dist/ through the 'site' project.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../lib.mjs';
import { VIEWPORTS, expectNoOverflow, watch } from './helpers.mjs';

const manifest = JSON.parse(readFileSync(path.join(ROOT, 'website/screens.manifest.json'), 'utf8'));
const IDS = manifest.screens.map((s) => s.id);
const url = (id) => `website/${id}.html`;
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';
const IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';

test('manifest lists the eleven pages the contract names', () => {
  expect(IDS).toEqual(['index', 'how-it-works', 'age-bands', 'safety', 'get-the-app', 'faq', 'contact', 'sign-in', 'privacy', 'terms', 'children-privacy']);
});

for (const id of IDS) {
  test(`${id}: page basics, no overflow at 320/768/1280, clean console`, async ({ page }) => {
    const w = watch(page);
    for (const [name, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp);
      await page.goto(url(id));
      await page.waitForLoadState('networkidle');
      await expectNoOverflow(page, `${id} @${name}`);
    }
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
    await expect(page.locator('body')).toHaveAttribute('data-surface', 'adult');
    await expect(page.locator('footer a[href="privacy.html"], footer a[href="terms.html"], footer a[href="children-privacy.html"]')).toHaveCount(3);
    await expect(page.locator('a.kc-skip')).toHaveCount(1);
    await expect(page.locator('nav[aria-label="Main"] a[aria-current="page"]')).toHaveCount(['index', 'privacy', 'terms', 'children-privacy'].includes(id) ? 0 : 1);
    w.assertClean();
  });

  for (const vw of [320, 1280]) {
    test(`${id}: every visible interactive element is at least 44x44 at ${vw}`, async ({ page }) => {
      await page.setViewportSize({ width: vw, height: 800 });
      await page.goto(url(id));
      const menu = page.locator('.site-menu-btn');
      if (await menu.isVisible()) await menu.click();      // open the small-screen menu so its links are measured too
      const small = await page.evaluate(() => [...document.querySelectorAll('a, button, input, select, textarea, summary, [role="button"]')].filter((e) => {
        const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
        if (e.type === 'hidden' || cs.visibility === 'hidden' || !e.getClientRects().length || r.width === 0) return false;
        return !(r.bottom <= 0 || r.right <= 0);              // the skip link waits off screen until focused
      }).filter((e) => { const r = e.getBoundingClientRect(); return r.width < 43.5 || r.height < 43.5; })
        .map((e) => `${e.tagName}${e.id ? '#' + e.id : ''} "${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`));
      expect(small, `too small on ${id} @${vw}`).toEqual([]);
    });
  }
}

test('home: brand, promise, one primary action that leads to get-the-app, Kudi', async ({ page }) => {
  await page.goto(url('index'));
  await expect(page.locator('h1')).toHaveText('Play. Earn. Roar!');
  await expect(page.locator('main .kc-btn:not(.kc-quiet)')).toHaveCount(1);
  await expect(page.locator('main img[src$="kudi-wave.webp"]')).toHaveCount(1);
  await page.locator('main .kc-btn:not(.kc-quiet)').click();
  await expect(page).toHaveURL(/website\/get-the-app\.html$/);
});

test('age bands: four bands, each names Ghana (cedi), Nigeria (naira) and the UK (pound)', async ({ page }) => {
  await page.goto(url('age-bands'));
  const cards = page.locator('.site-bandgrid .kc-card');
  await expect(cards).toHaveCount(4);
  for (const c of await cards.all()) {
    await expect(c).toContainText('Ghana (cedi)');
    await expect(c).toContainText('Nigeria (naira)');
    await expect(c).toContainText('United Kingdom (pound)');
  }
  for (const b of ['4 to 6', '7 to 9', '10 to 12', '13 to 15']) await expect(page.locator('.site-band', { hasText: b }).first()).toBeVisible();
});

test('safety: covers gate, PIN, no real money, no open chat, minimal data, no ads or tracking; primary leads to privacy', async ({ page }) => {
  await page.goto(url('safety'));
  for (const h of [/parent gate/i, /parent PIN/i, /no real money/i, /no open chat/i, /very little data/i, /no ads, no tracking/i]) await expect(page.locator('main h2', { hasText: h })).toHaveCount(1);
  await page.getByRole('link', { name: 'Read the privacy page' }).click();
  await expect(page).toHaveURL(/privacy\.html$/);
});

test.describe('get the app: Android route', () => {
  test.use({ userAgent: ANDROID_UA });
  test('Android is recommended and its button reveals a store-coming-soon note', async ({ page }) => {
    await page.goto(url('get-the-app'));
    await expect(page.locator('body')).toHaveAttribute('data-platform', 'android');
    await expect(page.locator('[data-store-card="android"] .site-badge')).toBeVisible();
    await expect(page.locator('[data-store-card="ios"] .site-badge')).toBeHidden();
    const b = page.locator('button[data-store="android"]');
    await expect(b).toHaveAttribute('aria-expanded', 'false');
    await b.click();
    await expect(b).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#note-android')).toContainText('Store listing coming soon');
    await expect(page.locator('#note-ios')).toBeHidden();
  });
});
test.describe('get the app: iOS route', () => {
  test.use({ userAgent: IOS_UA });
  test('iPhone is recommended and its button reveals a store-coming-soon note', async ({ page }) => {
    await page.goto(url('get-the-app'));
    await expect(page.locator('body')).toHaveAttribute('data-platform', 'ios');
    await expect(page.locator('[data-store-card="ios"] .site-badge')).toBeVisible();
    await expect(page.locator('[data-store-card="android"] .site-badge')).toBeHidden();
    await page.locator('button[data-store="ios"]').click();
    await expect(page.locator('#note-ios')).toContainText('Store listing coming soon');
    await expect(page.locator('#note-android')).toBeHidden();
  });
});
test('get the app: desktop has both routes, no dead "#" store links, and a send-me-the-link form with error and sent states', async ({ page }) => {
  await page.goto(url('get-the-app'));
  await expect(page.locator('body')).toHaveAttribute('data-platform', 'desktop');
  await expect(page.locator('.site-badge.is-on')).toHaveCount(0);
  await expect(page.locator('a[href="#"]')).toHaveCount(0);
  await expect(page.locator('button[data-store]')).toHaveCount(2);
  const sent = [];
  page.on('request', (r) => { if (r.method() !== 'GET') sent.push(r.method() + ' ' + r.url()); });
  await page.getByRole('button', { name: 'Send me the link' }).click();                      // empty -> error
  await expect(page.locator('#l-email-err')).toBeVisible();
  await page.locator('#l-email').fill('not-an-email');
  await page.getByRole('button', { name: 'Send me the link' }).click();                      // not email-shaped -> error
  await expect(page.locator('#l-email-err')).toContainText('does not look like an email');
  await expect(page.locator('#link-sent')).toBeHidden();
  await page.locator('#l-email').fill('parent@example.com');
  await page.getByRole('button', { name: 'Send me the link' }).click();
  await expect(page.locator('button[type="submit"][aria-busy="true"]')).toBeVisible();      // loading
  await expect(page.locator('#link-sent')).toBeVisible();                                    // sent
  await expect(page.locator('#link-sent')).toContainText('Nothing was sent');
  expect(sent).toEqual([]);
});

test('FAQ: expand and collapse, search narrows, empty search shows the empty state, clear restores', async ({ page }) => {
  await page.goto(url('faq'));
  const first = page.locator('.site-faq details').first();
  await expect(first).not.toHaveAttribute('open', '');
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await first.locator('summary').click();
  await expect(first).not.toHaveAttribute('open', '');
  const total = await page.locator('.site-faq details').count();
  expect(total).toBeGreaterThanOrEqual(8);
  await page.locator('#faq-search').fill('ads');
  const shown = await page.locator('.site-faq details:visible').count();
  expect(shown).toBeGreaterThan(0);
  expect(shown).toBeLessThan(total);
  await expect(page.locator('#faq-empty')).toBeHidden();
  await page.locator('#faq-search').fill('zzzzqq');
  await expect(page.locator('.site-faq details:visible')).toHaveCount(0);
  await expect(page.locator('#faq-empty')).toBeVisible();
  await expect(page.locator('#faq-empty')).toContainText('No questions match');
  await page.locator('#faq-clear').click();
  await expect(page.locator('#faq-empty')).toBeHidden();
  await expect(page.locator('.site-faq details:visible')).toHaveCount(total);
  await expect(page.getByRole('link', { name: 'Contact us' })).toBeVisible();
});

test('contact: empty -> error (inline, announced) -> filled -> sending -> sent, and nothing leaves the page', async ({ page }) => {
  const nonGet = [];
  page.on('request', (r) => { if (r.method() !== 'GET') nonGet.push(r.method() + ' ' + r.url()); });
  await page.goto(url('contact'));
  await expect(page.locator('#c-name')).toHaveValue('');
  await page.getByRole('button', { name: 'Send', exact: true }).click();                     // empty -> error
  for (const id of ['c-name', 'c-email', 'c-message']) {
    await expect(page.locator(`#${id}-err`)).toBeVisible();
    await expect(page.locator(`#${id}`)).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator(`#${id}-err`)).toHaveAttribute('aria-live', 'polite');
  }
  await expect(page.locator('.site-status')).toContainText('Please fix');
  await page.locator('#c-name').fill('Ama Example');                                         // fixing a field clears its error
  await expect(page.locator('#c-name-err')).toBeHidden();
  await page.locator('#c-email').fill('ama@example');                                        // still wrong
  await expect(page.locator('#c-email-err')).toContainText('does not look like an email');
  await page.locator('#c-email').fill('ama@example.com');
  await page.locator('#c-message').fill('Hello, is there a version for older children?');    // filled
  await expect(page.locator('.is-error')).toHaveCount(0);
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  const busy = page.locator('button[type="submit"][aria-busy="true"]');                      // sending
  await expect(busy).toBeVisible();
  await expect(busy).toHaveText('Sending...');
  await expect(page.locator('#contact-sent')).toBeVisible();                                 // sent
  await expect(page.locator('form[data-form="contact"]')).toBeHidden();
  await expect(page.locator('#contact-sent')).toContainText('Nothing was sent');
  await page.getByRole('button', { name: 'Write another message' }).click();                 // back to empty
  await expect(page.locator('#c-message')).toHaveValue('');
  expect(nonGet).toEqual([]);
});

test('manifest states: reviewer hash links render contact error/loading/success, sign-in error/loading, get-the-app success, faq empty', async ({ page }) => {
  const fresh = async (p, u) => { await p.goto('about:blank'); await p.goto(u); };      // a hash-only change would not reload the page
  await fresh(page, url('contact') + '#state-error');
  await expect(page.locator('#c-email-err')).toBeVisible();
  await fresh(page, url('contact') + '#state-loading');
  await expect(page.locator('button[aria-busy="true"]')).toBeVisible();
  await fresh(page, url('contact') + '#state-success');
  await expect(page.locator('#contact-sent')).toBeVisible();
  await fresh(page, url('sign-in') + '#state-error');
  await expect(page.locator('#s-email-err')).toBeVisible();
  await fresh(page, url('sign-in') + '#state-loading');
  await expect(page.locator('button[aria-busy="true"]')).toBeVisible();
  await fresh(page, url('get-the-app') + '#state-success');
  await expect(page.locator('#link-sent')).toBeVisible();
  await fresh(page, url('faq') + '#state-empty');
  await expect(page.locator('#faq-empty')).toBeVisible();
  const states = Object.fromEntries(manifest.screens.map((s) => [s.id, s.states]));
  expect(states.contact).toEqual(['default', 'error', 'loading', 'success']);
  expect(states.faq).toEqual(['default', 'empty']);
  expect(states['get-the-app']).toEqual(['default', 'success']);
  expect(states['sign-in']).toEqual(['default', 'error', 'loading']);
});

test('sign-in: invalid email shows an error, a valid one shows loading and then goes to the Parent Dashboard code step', async ({ page }) => {
  await page.goto(url('sign-in'));
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.locator('#s-email-err')).toBeVisible();
  await page.locator('#s-email').fill('nope');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.locator('#s-email-err')).toContainText('does not look like an email');
  await expect(page).toHaveURL(/website\/sign-in\.html/);
  await page.locator('#s-email').fill('parent@example.com');
  await page.getByRole('button', { name: 'Send code' }).click();
  await expect(page.locator('button[type="submit"][aria-busy="true"]')).toBeVisible();
  await page.waitForURL(/dashboard\/parent\/index\.html#\/code$/);
  expect(page.url()).not.toContain('example.com');           // no email in the address bar
});

test('legal pages carry a placeholder-pending-legal-review notice', async ({ page }) => {
  for (const id of ['privacy', 'terms', 'children-privacy']) {
    await page.goto(url(id));
    await expect(page.locator('.site-notice')).toContainText('waiting for legal review');
  }
});

test('mobile menu opens and closes at 320 and is not needed at 1280', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS.phone);
  await page.goto(url('index'));
  const btn = page.locator('.site-menu-btn');
  await expect(page.locator('#site-nav')).toBeHidden();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#site-nav a', { hasText: 'How it works' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#site-nav')).toBeHidden();
  await page.setViewportSize(VIEWPORTS.desktop);
  await expect(btn).toBeHidden();
  await expect(page.locator('#site-nav')).toBeVisible();
});
