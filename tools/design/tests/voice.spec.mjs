// E5 runtime (004 FR-012–FR-021): recorded beats scratch beats the caption; the voice badge shows only with
// reviewer notes on; no speech is ever synthesised. Files themselves are checked by check-audio.mjs.
// Break it: delete a scratch file (check-audio fails), or show the badge without notes.
import { test, expect } from '@playwright/test';
import { noTts, fresh, guard } from './helpers.mjs';
import { batch } from '../lib/batches.mjs';

test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

test('every Lost Coins line (Ghana) plays audio with notes off, and no voice badge is shown (SC-004)', async ({ page }) => {
  const g = guard(page);
  await page.goto('./#/mission-intro');
  await page.mouse.click(5, 5);                                                // a user gesture so the browser allows playback
  const ids = batch('lost-coins', { region: 'gh' });
  for (const id of ids) {
    const r = await page.evaluate((l) => { KC.voice.play(l); return { voice: document.body.getAttribute('data-last-voice'), src: document.querySelector('audio') ? null : null }; }, id);
    expect(r.voice, `${id} has audio`).toMatch(/^(recorded|scratch)$/);
    await expect(page.locator('#kc-caption [data-voice-badge]')).toHaveCount(0);
  }
  await page.evaluate(() => KC.voice.stop());
  expect(await page.evaluate(() => window.__tts)).toBe(0);
  g.expectClean();
});

test('with reviewer notes on, the badge names the status: "Scratch voice" or "Recording pending" (FR-019)', async ({ page }) => {
  await page.goto('./#/mission-intro');
  await page.evaluate(() => { KC.state.notes = true; KC.voice.play('intro.stall'); });  // scratch, and not in Kudi's bubble
  await expect(page.locator('#kc-caption [data-voice-badge=scratch]')).toHaveText('Scratch voice');
  await page.evaluate(() => { KC.audioManifest.lines['en-GH']['home.coins'] = { status: 'pending', file: null, scratchFile: null, maxSeconds: 3 }; KC.voice.play('home.coins'); });   // no audio → pending, caption only
  await expect(page.locator('#kc-caption')).toHaveAttribute('data-caption-state', 'pending');
  await expect(page.locator('#kc-caption [data-voice-badge=pending]')).toHaveText('Recording pending');
  await page.evaluate(() => { KC.state.notes = false; KC.voice.play('home.coins'); });
  await expect(page.locator('#kc-caption')).toHaveAttribute('data-caption-state', 'pending');  // the caption stays (003 FR-037)
  await expect(page.locator('#kc-caption [data-voice-badge]')).toHaveCount(0);
});

test('a human recording always wins over the scratch file (FR-014)', async ({ page }) => {
  await page.goto('./#/mission-intro');
  const r = await page.evaluate(() => {
    const e = KC.audioManifest.lines['en-GH']['intro.stall'];
    const was = { ...e };
    e.status = 'recorded'; e.file = 'assets/audio-scratch/en-GH/intro.say.mp3';        // stand-in "recording"
    KC.voice.play('intro.stall');
    const out = document.body.getAttribute('data-last-voice');
    Object.assign(e, was);
    KC.voice.play('intro.stall');
    return { withRecording: out, scratchOnly: document.body.getAttribute('data-last-voice') };
  });
  expect(r).toEqual({ withRecording: 'recorded', scratchOnly: 'scratch' });
});
