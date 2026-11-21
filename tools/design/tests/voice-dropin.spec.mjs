// 003 SC-008 (kept in 004): dropping human recordings in makes them play with no code change.
// It adds files to prototype/assets/audio/ and rebuilds the manifest, so it runs in its own project, after all the
// other specs (playwright.config.mjs), never alongside tests that load the app.
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { noTts, fresh } from './helpers.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

test('voice: dropping in 3 human recordings makes them play with no code change (003 SC-008)', async ({ page }) => {
  let ffmpeg = true;
  try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch (e) { ffmpeg = false; }
  test.skip(!ffmpeg, 'ffmpeg not installed: cannot generate sample .m4a files');
  const dir = path.join(ROOT, 'prototype/assets/audio/en-GH');
  const tmp = path.join(ROOT, 'tools/design/.tmp/audio');
  const ids = ['welcome.say', 'home.coins', 'wallet.say'];
  mkdirSync(tmp, { recursive: true });
  try {
    for (const id of ids) {
      const f = path.join(tmp, `${id}.m4a`);
      if (!existsSync(f)) execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=mono', '-t', '1.5', '-c:a', 'aac', '-b:a', '64k', f]);
      copyFileSync(f, path.join(dir, `${id}.m4a`));
    }
    execFileSync('node', [path.join(ROOT, 'tools/design/build-narration.mjs')]);
    await page.goto('./#/welcome');
    for (const id of ids) {
      expect(await page.evaluate((l) => { KC.voice.play(l); return document.body.getAttribute('data-last-voice'); }, id)).toBe('recorded');
    }
    expect(await page.evaluate(() => KC.audioManifest.counts['en-GH'].recorded)).toBe(3);
    expect(await page.evaluate(() => window.__tts)).toBe(0);
  } finally {
    for (const id of ids) rmSync(path.join(dir, `${id}.m4a`), { force: true });
    execFileSync('node', [path.join(ROOT, 'tools/design/build-narration.mjs')]);
  }
});
