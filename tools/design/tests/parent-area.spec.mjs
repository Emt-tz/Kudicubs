// 005 US3 (FR-010): the parent area on the phone. Behind the gate and PIN; wrong PIN and lock-out; PIN recovery; new-device
// sign-in with a one-time code (wrong, expired, resend); "This is my phone" / "Family device"; sign-out; delete with a
// confirmation a child cannot reach. Nothing typed at the gate, the PIN or the code is ever stored (004 FR-028).
// Break it: let parent-delete open without the guard (drop G8), or store the PIN in KC.parent.
import { test, expect } from '@playwright/test';
import { noTts, fresh, guard, audit, screenIs } from './helpers.mjs';

test.beforeEach(async ({ page }) => { await noTts(page); await fresh(page); });

const PARENT_IDS = ['parent-home', 'parent-child', 'parent-add-child', 'parent-settings', 'parent-region', 'parent-delete',
  'parent-device-mode', 'parent-signin', 'parent-pin-recover', 'parent-lockout', 'parent-signed-out'];
const screen = (page) => page.evaluate(() => document.getElementById('kc-screen').getAttribute('data-screen'));
const totals = (page) => page.evaluate(() => { const v = KC.view(); return { coins: v.coins, xp: v.xp, badges: v.badges.length, onboarded: KC.state.onboarded }; });
const keys = async (page, pad, s) => { for (const d of s) await page.click(`[data-component=${pad}] [data-key="${d}"]`); };

async function sample(page) {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.go('home'); });
}
/** Child side: Profile → "For grown-ups" → hold 3 s → maths. Leaves the PIN step open. */
async function toPinStep(page) {
  await page.evaluate(() => KC.go('profile'));
  await page.click('#kc-screen [data-component=secondary-button]');
  await screenIs(page, 'parent-gate');
  const hold = page.locator('.kc-hold'); const box = await hold.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(3200); await page.mouse.up();
  const q = await page.getAttribute('[data-question]', 'data-question');
  const [a, b] = q.split('x').map(Number);
  await keys(page, 'parent-gate-pad', String(a * b));
  await page.click('[data-primary]');
  await expect(page.locator('[data-component=pin-pad]')).toBeVisible();
}
async function enterPin(page, pin) { await keys(page, 'pin-pad', pin); await page.click('[data-primary]'); }
async function openArea(page) { await toPinStep(page); await enterPin(page, '2580'); await screenIs(page, 'parent-home'); }

test('a child cannot reach any parent screen: by id, by hash or by going forward; unknown routes still go Home', async ({ page }) => {
  await sample(page);
  for (const id of PARENT_IDS) {
    await page.goto(`./#/${id}`); await page.waitForTimeout(200);
    expect(await screen(page), `#/${id} opened by a child`).toBe('home');
  }
  await page.goto('./#/parent-gate'); await page.waitForTimeout(200);
  expect(await screen(page), 'the gate by hand once onboarded').toBe('home');       // G4/G5
  await page.goto('./#/nothing-here'); await page.waitForTimeout(200);
  expect(await screen(page)).toBe('home');
  // no child screen links into the parent area except through the gate: the only entry is Profile's "For grown-ups"
  const links = await page.evaluate(() => {
    const bad = [];
    const spy = KC.go; KC.go = function (id, o) { if (/^parent-/.test(id) && id !== 'parent-gate') bad.push(id); return spy.apply(this, arguments); };
    for (const id of KC.order.filter((i) => KC.screens[i].audience === 'child')) {
      KC.jumpTo(id);
      document.querySelectorAll('#kc-screen button').forEach((b) => { if (!b.hasAttribute('data-child-action')) { try { b.click(); } catch (e) { /* ignore */ } } });
    }
    KC.go = spy;
    return bad;
  });
  expect(links, 'a child screen led straight into the parent area').toEqual([]);
});

test('gate re-entry: hold, maths, then the PIN; a wrong PIN is gentle; three wrong PINs lock out calmly and the child can go back to play', async ({ page }) => {
  const g = guard(page);
  await sample(page);
  const before = await totals(page);
  await toPinStep(page);
  await enterPin(page, '1111');
  await expect(page.locator('.kc-parent-msg')).toContainText(/2 tries left/);
  expect(await screen(page)).toBe('parent-gate');
  await enterPin(page, '2222');
  await expect(page.locator('.kc-parent-msg')).toContainText(/1 tries? left/);
  await enterPin(page, '3333');
  await screenIs(page, 'parent-lockout');
  expect((await audit(page)).problems).toEqual([]);
  const text = await page.locator('#kc-screen').innerText();
  expect(text).toMatch(/resting|paused/i);
  expect(text).toMatch(/safe/i);                                                    // calm, and nothing is lost
  await expect(page.locator('[data-primary]')).toContainText(/reset/i);             // a recovery route
  // the gate stays shut while locked
  await page.evaluate(() => { KC.parent.intent = true; KC.go('parent-gate'); });
  await screenIs(page, 'parent-lockout');
  // a way back to play, with nothing lost
  await page.click('#kc-screen [data-component=secondary-button]'); await screenIs(page, 'home');
  expect(await totals(page)).toEqual(before);
  // and the area can't be opened by Back or by hand while locked
  await page.goto('./#/parent-home'); await page.waitForTimeout(200);
  expect(await screen(page)).toBe('home');
  g.expectClean();
});

test('lock-out ends by itself after the pause (the clock is faked); the PIN can be tried again', async ({ page }) => {
  await page.clock.install();
  await sample(page);
  await toPinStep(page);
  for (const p of ['1111', '2222', '3333']) await enterPin(page, p);
  await screenIs(page, 'parent-lockout');
  await page.clock.fastForward('06:00');
  await expect(page.locator('[data-lock-left]')).toContainText(/over/i);
  await page.click('[data-primary]'); await screenIs(page, 'parent-gate');
});

test('PIN recovery: a one-time code, then a new PIN entered twice (a mismatch asks again); the PIN is dropped', async ({ page }) => {
  await sample(page);
  await toPinStep(page);
  for (const p of ['1111', '2222', '3333']) await enterPin(page, p);
  await screenIs(page, 'parent-lockout');
  await page.click('[data-primary]'); await screenIs(page, 'parent-pin-recover');
  await expect(page.locator('[data-email-masked]')).toContainText('•');             // masked: no real address, none typed
  await page.click('[data-primary]');                                                // Send me a code
  await keys(page, 'pin-pad', '123456'); await page.click('[data-primary]');
  await expect(page.locator('.kc-pin-dot')).toHaveCount(4);                          // now the new PIN
  await keys(page, 'pin-pad', '4680'); await page.click('[data-primary]');
  await keys(page, 'pin-pad', '4681'); await page.click('[data-primary]');          // mismatch
  await expect(page.locator('.kc-parent-msg')).toContainText(/match/i);
  await keys(page, 'pin-pad', '4680'); await page.click('[data-primary]');
  await keys(page, 'pin-pad', '4680'); await page.click('[data-primary]');
  await expect(page.locator('[data-recover-done]')).toBeVisible();
  const stored = await page.evaluate(() => JSON.stringify([localStorage, sessionStorage].map((s) => Object.keys(s).map((k) => [k, s.getItem(k)]))));
  for (const bad of ['4680', '4681', '2580', '123456', '@']) expect(stored, `storage has ${bad}`).not.toContain(bad);
  await page.click('[data-primary]'); await screenIs(page, 'parent-home');
  // the lock is gone
  expect(await page.evaluate(() => KC.parent.locked)).toBe(false);
});

test('new-device sign-in: a wrong code, three wrong codes expire it, resend works, the right code leads to device mode', async ({ page }) => {
  const g = guard(page);
  await sample(page);
  await toPinStep(page);
  await page.click('#kc-screen [data-component=secondary-button]:has-text("code")');   // "New device? Sign in with a code"
  await screenIs(page, 'parent-signin');
  expect((await audit(page)).problems).toEqual([]);
  await page.click('[data-primary]');                                                // Send me a code
  const state = () => page.getAttribute('[data-otp-state]', 'data-otp-state');
  expect(await state()).toBe('default');
  await keys(page, 'pin-pad', '111111'); await page.click('[data-primary]');
  expect(await state()).toBe('wrong');
  await expect(page.locator('.kc-parent-msg')).toContainText(/not right/i);
  await keys(page, 'pin-pad', '222222'); await page.click('[data-primary]');
  await keys(page, 'pin-pad', '333333'); await page.click('[data-primary]');        // three wrong: the code stops working
  expect(await state()).toBe('expired');
  await keys(page, 'pin-pad', '123456'); await page.click('[data-primary]');        // even the right code is refused now
  expect(await state()).toBe('expired');
  await page.click('[data-go=resend]');
  expect(await state()).toBe('resent');
  await expect(page.locator('.kc-parent-msg')).toContainText(/new code/i);
  await keys(page, 'pin-pad', '123456'); await page.click('[data-primary]');
  await screenIs(page, 'parent-device-mode');
  expect((await audit(page)).problems).toEqual([]);
  await page.click('[data-device="family"]');
  expect(await page.evaluate(() => KC.state.deviceMode)).toBe('family');
  await page.click('[data-primary]'); await screenIs(page, 'parent-home');
  g.expectClean();
});

test('a one-time code expires after its time (the clock is faked) and resend gives a fresh one', async ({ page }) => {
  await page.clock.install();
  await sample(page);
  await toPinStep(page);
  await page.click('#kc-screen [data-component=secondary-button]:has-text("code")');
  await page.click('[data-primary]');
  await expect(page.locator('[data-otp-left]')).toContainText(/valid for 10:00/);
  await page.clock.fastForward('11:00');
  await keys(page, 'pin-pad', '123456'); await page.click('[data-primary]');
  expect(await page.getAttribute('[data-otp-state]', 'data-otp-state')).toBe('expired');
  await expect(page.locator('.kc-parent-msg')).toContainText(/expired/i);
  await page.click('[data-go=resend]');
  await keys(page, 'pin-pad', '123456'); await page.click('[data-primary]');
  await screenIs(page, 'parent-device-mode');
});

test('the area: children list, one child, add a child, settings, region; leaving it locks it again', async ({ page }) => {
  const g = guard(page);
  await sample(page);
  await openArea(page);
  expect((await audit(page)).problems).toEqual([]);
  await expect(page.locator('[data-child-row]')).toHaveCount(3);
  await page.click('[data-child-row="Kofi"]'); await screenIs(page, 'parent-child');
  await expect(page.locator('[data-child-name]')).toHaveText('Kofi');
  await expect(page.locator('[data-child-stats]')).toContainText('520 XP');
  expect((await audit(page)).problems).toEqual([]);
  await page.click('[data-primary]'); await screenIs(page, 'parent-home');
  await page.click('[data-child-row="Ama"]'); await expect(page.locator('[data-child-stats]')).toContainText('360 XP');
  await page.goBack(); await screenIs(page, 'parent-home');
  await page.click('[data-go="add-child"]'); await screenIs(page, 'parent-add-child');
  expect((await audit(page)).problems).toEqual([]);
  await page.click('[data-nick="Tobi"]'); await page.click('[data-band="b10_12"]'); await page.click('[data-primary]');
  await screenIs(page, 'parent-home');
  await expect(page.locator('[data-child-row]')).toHaveCount(4);
  await page.click('[data-go="settings"]'); await screenIs(page, 'parent-settings');
  expect((await audit(page)).problems).toEqual([]);
  const before = await totals(page);
  await page.click('[data-band="b13_15"]');
  expect(await page.evaluate(() => KC.state.band)).toBe('b13_15');
  expect(await totals(page)).toEqual(before);                                        // the band changes missions, not what was earned
  await page.click('[data-switch=sound]'); expect(await page.evaluate(() => KC.state.sound)).toBe(false);
  await page.click('[data-switch=narration]'); expect(await page.evaluate(() => KC.state.narration)).toBe(false);
  await page.click('[data-go="region"]'); await screenIs(page, 'parent-region');
  expect((await audit(page)).problems).toEqual([]);
  await page.click('[data-region-choice="ng"]');
  expect(await page.evaluate(() => KC.state.region)).toBe('ng');
  await expect(page.locator('[data-region-examples="ng"]')).toContainText('zobo');
  await page.click('[data-region-choice="uk"]');
  await expect(page.locator('[data-region-examples="uk"]')).toContainText('lemonade');
  await page.click('[data-primary]'); await screenIs(page, 'parent-home');
  await page.click('[data-primary]'); await screenIs(page, 'home');                  // Back to play
  await page.goto('./#/parent-home'); await page.waitForTimeout(200);
  expect(await screen(page), 'the area locks when it is left').toBe('home');
  g.expectClean();
});

test('sign out: signed-out screen with a way back to play and a way to sign in again; the area is closed', async ({ page }) => {
  await sample(page);
  await openArea(page);
  await page.click('[data-go="sign-out"]'); await screenIs(page, 'parent-signed-out');
  expect((await audit(page)).problems).toEqual([]);
  await page.goto('./#/parent-home'); await page.waitForTimeout(200);
  expect(await screen(page), 'signed out: the area is closed').not.toBe('parent-home');
  await page.evaluate(() => KC.go('profile'));                                       // (the area is still not reachable from a child screen)
  await page.evaluate(() => { KC.parent.gated = true; KC.go('parent-signed-out'); });
  await page.click('#kc-screen [data-component=secondary-button]'); await screenIs(page, 'parent-signin');
  await page.evaluate(() => { KC.parent.gated = true; KC.go('parent-signed-out'); });
  await page.click('[data-primary]'); await screenIs(page, 'home');
});

test('delete the family account: names what is erased, the 12-month rule, a way back; it needs the gate and the PIN again, so a child cannot finish it', async ({ page }) => {
  const g = guard(page);
  await sample(page);
  const s0 = await totals(page);
  await page.goto('./#/parent-delete'); await page.waitForTimeout(200);
  expect(await screen(page), 'a child cannot open it').toBe('home');
  await openArea(page);
  await page.click('[data-go="delete"]'); await screenIs(page, 'parent-delete');
  expect((await audit(page)).problems).toEqual([]);
  const text = await page.locator('#kc-screen').innerText();
  for (const w of [/child profile/i, /coins, savings, XP, badges/i, /sign-in/i, /12 months/i, /cannot be undone|can be undone/i, /child cannot/i]) expect(text).toMatch(w);
  await expect(page.locator('[data-primary]')).toContainText(/keep my family/i);     // the way back is the main action
  await page.click('#kc-screen .kc-actions [data-component=secondary-button]');      // Erase everything → asks for the PIN again
  await expect(page.locator('[data-component=pin-pad]')).toBeVisible();
  await keys(page, 'pin-pad', '9999'); await page.click('[data-go=erase-confirm]');
  await expect(page.locator('.kc-parent-msg')).toContainText(/nothing was erased/i);
  expect(await totals(page)).toEqual(s0);
  await page.click('[data-primary]'); await screenIs(page, 'parent-home');           // way back
  expect(await totals(page)).toEqual(s0);
  await page.click('[data-go="delete"]');
  await page.click('#kc-screen .kc-actions [data-component=secondary-button]');
  await keys(page, 'pin-pad', '2580'); await page.click('[data-go=erase-confirm]');
  await expect(page.locator('[data-erased]')).toBeVisible();
  expect(await page.evaluate(() => [KC.state.onboarded, KC.view().coins, KC.state.events.length, localStorage.getItem('kudicubs.proto.progress')])).toEqual([false, 0, 0, null]);
  await page.click('[data-primary]'); await screenIs(page, 'welcome');
  g.expectClean();
});

test('nothing typed at the gate, the PIN, the one-time code or the device choice is stored (004 FR-028)', async ({ page }) => {
  await sample(page);
  await openArea(page);
  await page.click('[data-go="device-mode"]'); await page.click('[data-device="family"]');
  const all = await page.evaluate(() => JSON.stringify([localStorage, sessionStorage].map((s) => Object.keys(s).map((k) => [k, s.getItem(k)]))));
  for (const bad of ['2580', '123456', '@', 'example.com']) expect(all, `storage has ${bad}`).not.toContain(bad);
  const keysSeen = await page.evaluate(() => [localStorage, sessionStorage].flatMap((s) => Object.keys(s)));
  for (const k of keysSeen) expect(k).not.toMatch(/email|pin|gate|answer|code/i);
});

test('every parent screen passes the shared audit (targets ≥ 48×48, traceability, replay button) and has a reviewer jump', async ({ page }) => {
  await page.goto('./#/welcome');
  await page.evaluate(() => { KC.loadSample(); KC.go('home'); KC.openReviewer(); });
  const options = await page.$$eval('.kc-reviewer-sheet select option', (os) => os.map((o) => o.value));
  const problems = [];
  for (const id of PARENT_IDS) {
    expect(options, `reviewer jump for ${id}`).toContain(id);
    await page.selectOption('.kc-reviewer-sheet select', id);
    await page.waitForTimeout(120);
    expect(await screen(page)).toBe(id);
    const a = await audit(page); problems.push(...a.problems);
    await page.evaluate(() => KC.openReviewer());
  }
  expect(problems, problems.join('\n')).toEqual([]);
});
