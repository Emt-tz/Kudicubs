# Contract: Automated Validation Suite (1.0.0)

**Spec**: FR-040–FR-049, SC-001–SC-012 · Runs on every pull request ([ci-and-deploy.md](./ci-and-deploy.md)).

Every row has at least one test, and the test is **proven to fail** when its rule is broken
(SC-010). Each test file states its "break it" check in a comment.

| Brief | Test (in `tools/design/tests/`) | Viewports | Asserts | Proven by breaking |
|---|---|---|---|---|
| E1 | `flow.spec.mjs` › full journey | 390×844, Chromium + WebKit | Welcome → age → avatar → gate (hold, maths, PIN, **confirm PIN**, region, email) → Home → the Lost Coins screens → Reward → Home; **0 console errors, 0 failed requests**; plus the 002/003 audits (one main action, components, no TTS, replay button) | throwing in a screen render; requesting a missing asset |
| E2 | `fold.spec.mjs` | **360×640 and 390×844** | Includes the 7 measured cases (spec FR-001). On every screen, after render and after each scripted interaction, the main action (`[data-primary]`, else `[data-primary-group]`) is fully inside the viewport and the visible screen area, with **no scrolling** | removing the sticky footer, or showing the counter while asking |
| E3 | `navigation.spec.mjs` | 390×844 | No Back on Home, Wallet or Progress. The Back chains from navigation.md §3. Reward and Result opened directly or refreshed → Home, wallet unchanged (G1, G2) | dropping guard G1; using `push` when leaving Reward |
| E4 | `flow.spec.mjs` › replay | 390×844 | The second run changes no coins or history; XP +5 exactly; the `data-last-line` and caption line are `reward.replay`; the title is "Great practice!" | the 002 `completedOnce` guard; deciding narration after render |
| E5 | `check-audio.mjs` + `voice.spec.mjs` | — | Every Lost Coins line for the default region has a recorded or scratch file that exists, is ≥ 1 KB and is ≤ 8 s (`ffprobe`); no manifest entry points at a missing file; recorded beats scratch beats caption; the badge appears only with notes on | deleting one scratch file; a 9 s file |
| E6 | `data.spec.mjs` | 390×844 | Fresh start: coins, savings and XP are 0, level 1, 0 badges, 0 history rows, pillars 0, friendly empty states. After one save + perfect-sort run: coins 40, savings 8, XP 50, 3 badges, 4 history rows (data-model §3). The values survive `page.reload()`. Restart → zeros. **No storage key or value** (local or session) contains the email typed, the PIN digits, the maths answer, `@`, or the keys `email`, `pin`, `gate` or `answer` | seeding mock start values; saving the PIN |
| E7 | `audit()` in every spec, plus `fold.spec.mjs` at 360×640 | both | Every interactive element on a child screen (`button`, `[role=button]`, `[data-child-action]`, choice cards, coins in jars) is ≥ 48×48 | a 47 px coin |
| E8 | `check-contrast.mjs` + `contrast.spec.mjs` | 390×844 | Every recorded pair passes; every visible text node on every screen passes WCAG AA against its effective background (4.5:1, or 3:1 for large text); a pair found at runtime that isn't recorded fails | white text on a yellow button |
| E9 | `flow.spec.mjs` › regions | 390×844 | For gh, ng and uk on every money screen (`home`, `wallet`, `decision`, `result-save`, `result-spend`, `summary`, `reward`): the coin art is `coins/<region>/…`, the treat name is the region's, and amounts carry no currency symbol | a hard-coded `coins/gh/` path |
| A9 | `navigation.spec.mjs` › load failure | 390×844 | With `screens.js`, `data/mock-data.js` or `data/regions.js` blocked: the Kudi "Tap to try again" panel is visible, the button is ≥ 64 px, and no uncaught error is shown. With the file restored, one tap starts the app (Welcome renders) | removing the boot guard; reloading automatically |
| A8 | `flow.spec.mjs` › gate | 390×844 | A PIN mismatch shows the "try again" message and doesn't continue; a match continues; neither entry is in storage | skipping the confirm step |

**Shared rules for every spec**:

- The synthetic-speech stub (`window.__tts` stays 0).
- `requestfailed` and `console.error` listeners fail the test.
- The local static server (no `file://`).
- Each spec starts from cleared storage.
