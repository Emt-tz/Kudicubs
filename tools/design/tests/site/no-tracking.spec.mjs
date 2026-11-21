// 005 T088 (website part): no external request, no cookie, no analytics or ad script, no storage write,
// and no form field asking for a child's name or details (FR-014, FR-026).
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from '../../lib.mjs';

const manifest = JSON.parse(readFileSync(path.join(ROOT, 'website/screens.manifest.json'), 'utf8'));
const IDS = manifest.screens.map((s) => s.id);
const url = (id) => `website/${id}.html`;
const read = (f) => readFileSync(path.join(ROOT, 'website', f), 'utf8');
const TRACKERS = /google-analytics|googletagmanager|gtag\s*\(|\bga\s*\(|fbq\s*\(|connect\.facebook|doubleclick|adsbygoogle|googlesyndication|hotjar|mixpanel|segment\.(com|io)|plausible|matomo|clarity\.ms|amplitude|sentry|_gaq|adservice|taboola|outbrain/i;
const CHILD_FIELD = /\b(child|children|kid|kids|son|daughter|birthday|birth|dob|age|years old)\b/i;

test('every page: no request leaves the site, no cookie, no storage write, no third-party script or link', async ({ page, context, baseURL }) => {
  const origin = new URL(baseURL).origin;
  const foreign = [];
  page.on('request', (r) => { const u = r.url(); if (!/^(data|blob|about):/.test(u) && new URL(u).origin !== origin) foreign.push(u); });
  await page.addInitScript(() => {
    window.__writes = [];
    for (const S of [Storage.prototype]) {
      const set = S.setItem; S.setItem = function (k, v) { window.__writes.push('setItem ' + k); return set.call(this, k, v); };
    }
    const dc = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
    Object.defineProperty(document, 'cookie', { get() { return dc.get.call(document); }, set(v) { window.__writes.push('cookie ' + v); return dc.set.call(document, v); } });
  });
  for (const id of IDS) {
    await page.goto(url(id));
    await page.waitForLoadState('networkidle');
    const found = await page.evaluate((o) => ({
      scripts: [...document.querySelectorAll('script[src]')].map((s) => s.src).filter((s) => new URL(s).origin !== o),
      links: [...document.querySelectorAll('link[href]')].map((l) => l.href).filter((s) => new URL(s).origin !== o),
      embeds: [...document.querySelectorAll('iframe, embed, object, img[src], source[src], form[action]')].map((e) => e.src || e.data || e.action).filter((s) => s && new URL(s, location.href).origin !== o),
      ls: localStorage.length, ss: sessionStorage.length, cookie: document.cookie, writes: window.__writes
    }), origin);
    expect(found.scripts, `${id}: foreign script`).toEqual([]);
    expect(found.links, `${id}: foreign link`).toEqual([]);
    expect(found.embeds, `${id}: foreign embed or form action`).toEqual([]);
    expect(found.ls + found.ss, `${id}: storage used`).toBe(0);
    expect(found.cookie, `${id}: cookie`).toBe('');
    expect(found.writes, `${id}: storage or cookie writes`).toEqual([]);
  }
  // exercise every form on the site, then check again: still nothing sent, stored or set
  await page.goto(url('contact'));
  await page.locator('#c-name').fill('Ama Example'); await page.locator('#c-email').fill('ama@example.com'); await page.locator('#c-message').fill('Hello');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.locator('#contact-sent')).toBeVisible();
  await page.goto(url('get-the-app'));
  await page.locator('#l-email').fill('ama@example.com');
  await page.getByRole('button', { name: 'Send me the link' }).click();
  await expect(page.locator('#link-sent')).toBeVisible();
  const after = await page.evaluate(() => ({ ls: localStorage.length, ss: sessionStorage.length, cookie: document.cookie, writes: window.__writes }));
  expect(after).toEqual({ ls: 0, ss: 0, cookie: '', writes: [] });
  expect(await context.cookies()).toEqual([]);
  expect(foreign, 'requests to another origin').toEqual([]);
});

test('no form field is named, labelled or hinted for a child\'s name, age or birthday', async ({ page }) => {
  for (const id of IDS) {
    await page.goto(url(id));
    const fields = await page.evaluate(() => [...document.querySelectorAll('input, select, textarea')].map((e) => {
      const label = (e.labels && [...e.labels].map((l) => l.textContent).join(' ')) || '';
      return { name: e.name, id: e.id, placeholder: e.placeholder || '', ac: e.autocomplete || '', aria: e.getAttribute('aria-label') || '', label };
    }));
    for (const f of fields) {
      for (const [k, v] of Object.entries(f)) expect(CHILD_FIELD.test(v), `${id}: field ${f.id || f.name} ${k}="${v}" asks about a child`).toBe(false);
    }
  }
  // the one free-text field warns parents off giving child details
  await page.goto(url('contact'));
  await expect(page.locator('#c-message-hint')).toContainText('do not include your child');
});

test('page sources: no analytics, advertising or tracking text, no external URL in any script, link or style', () => {
  for (const f of [...IDS.map((i) => i + '.html'), 'assets/site.js', 'assets/site.css']) {
    const t = read(f);
    expect(TRACKERS.test(t), `${f}: tracker or ad text`).toBe(false);
    expect(/(?:src|href)=["'](?:https?:)?\/\//i.test(t), `${f}: external src/href`).toBe(false);
    expect(/url\(\s*["']?(?:https?:)?\/\//i.test(t), `${f}: external url()`).toBe(false);
    expect(/@import|fetch\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|document\.cookie|indexedDB/.test(t), `${f}: network or storage API`).toBe(false);
  }
});
