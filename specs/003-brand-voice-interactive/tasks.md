---

description: "Task list for 003: client feedback round 1 (official brand, natural voice, more interaction)"
---

# Tasks: Client Feedback Round 1: Official Brand, Natural Voice, More Interaction

**Input**: `specs/003-brand-voice-interactive/` (spec.md, plan.md, research.md R1–R13, data-model.md,
contracts/, quickstart.md W1–W14).

**Prerequisites**: plan.md and spec.md (both present).

**Tests**: no TDD was requested. The spec's success criteria are verified by machine (plan R12),
so check and test tasks sit inside the stories they prove.

**Global rules for every task** (from the constitution, spec and plan):

- **No production app code.** Touch only `prototype/`, `tools/design/` and `docs/design/`.
- **Never synthetic speech.** No `speechSynthesis`, `SpeechSynthesisUtterance` or any
  text-to-speech, ever (FR-014).
- **Never redraw, recolour or stretch** the logo or mascots. Extract them by script only (R1).
- **Never alter a brand colour value** (FR-004). Text on yellow and orange is always Mane Brown
  (FR-005).
- **No raw colours** in prototype CSS or JS. Use only `var(--kc-*)` (FR-008).
- **One main action at a time** (`data-primary` or `data-primary-group`). Child actions use
  `data-child-action` and never navigate (interaction-moments §1).
- **No failure states for 4–6.** Never `data-failure`, never red, never a buzzer.
- Classic scripts only, no `fetch` of local files, so `file://` works. Example data only, and
  nothing is sent.
- Commits are authored by the developer, with no AI co-author lines. Review before every commit.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [X] T001 Tag the 002 prototype commit so the "before" is recoverable: `git tag -a prototype-v0.1.0 c83436c -m "KudiCubs prototype v0.1.0 (before client round 1)"`. Push the tag to the remote **only when the developer approves the push** (FR-032, R11).
- [X] T002 Create the folders `prototype/assets/brand/`, `prototype/assets/audio/{en-GH,en-NG,en-GB}/` (each with `.gitkeep`), `docs/design/narration/` and `docs/design/round1/{before,after}/`. Add `prototype/assets/audio/README.md` explaining where recordings go and how to name them (`<lineId>.m4a`), and that `node tools/design/build-narration.mjs` must be re-run afterwards (contracts/audio-manifest.md).
- [X] T003 [P] Add `.gitignore` entries for `tools/design/.tmp/` (used for the before/after worktree and test sample audio) and `prototype/assets/audio/**/*.wav` (studio masters stay out of git).

---

## Phase 2: Foundational (blocks every story)

**Purpose**: brand assets, the token model, the voice engine, the sound engine and the shared
helpers that every story uses.

- [X] T004 Implement `tools/design/extract-brand-assets.mjs`, a repeatable extraction from `docs/source/KudiCubs Brand.pdf` (research R1, contracts/brand-assets.md). It must:
  - **Logos**: run `pdftocairo -svg` on pages 2 and 3. Find each logo panel's bounds by rendering the page to PNG and locating the panel (white panel on p.2; the yellow left half and the Mane Brown box on p.3). Write `logo-on-white.svg`, `logo-on-yellow.svg` and `logo-on-brown.svg` by **only changing the root `viewBox`/`width`/`height`**, leaving every path untouched. Then render a 2× PNG of each.
  - **Mascots**: run `pdfimages -png -f 4 -l 4`. Recombine each image `m-00(2i)` with its mask `m-00(2i+1)`, using `uv run --no-project --with pillow python -I` and a helper script in `tools/design/lib/`. Scale **in proportion** to 640 px tall. Write `kudi-{wave,celebrate,headphones,fist,thumbs-up}.{webp,png}`, mapping image 1 to wave, 2 to celebrate, 3 to headphones, 4 to fist and 5 to thumbs-up (R2).
  - **App icons**: render `app-icon-192.png` and `app-icon-512.png` from `logo-on-yellow.svg`.
  - **Sources**: write `prototype/assets/brand/SOURCES.md` with each file's source page, image index, the command used and its SHA-256.
- [X] T005 Run `node tools/design/extract-brand-assets.mjs`. Visually check a contact sheet of all outputs: the logo artwork is unchanged and uncropped, and the poses aren't stretched. Commit the outputs in `prototype/assets/brand/`.
- [X] T006 Rewrite `docs/design/tokens.json` to **v0.2.0** (research R3, data-model §1–3):
  - **Brand tokens**: `color.brand.{sunshine_yellow:#FBCE16, mane_brown:#3E2312, adventure_orange:#F68C1F, golden_orange:#FBAA19, soft_gold:#FBE57E, peach_cream:#FCE6C6, warm_cream:#FEF5E0, white:#FFFFFF, charcoal:#231F20}`. Each has `$extensions.kudicubs = { source: "brand-guide", tier, status }`. The status is `"provisional"` for warm_cream, `"assumed"` for charcoal, and `"confirmed"` for the rest.
  - **Derived tokens**: `color.derived.{yellow_pressed:#E4B916, orange_pressed:#DA7C1D, golden_pressed:#E49A18, brown_80:#644D3B, brown_60:#8B7764, cream_shade:#F2E8D4, peach_shade:#EDD6B8}`. Each has `$extensions.kudicubs = { derivedFrom, rule, purpose, needsApproval: true }`.
  - **Success green**: `color.success.green:#16793A`, with `{ notInPalette: true, needsApproval: true }`.
  - **Illustration palette** (FR-047, data-model §2b): `color.illustration.*` for placeholder art only. Coin metals (`silver`, `silver_rim`, `bronze`, `bronze_rim`); per-region flag accents (`gh_red`, `gh_green`, `ng_green`, `uk_navy`, `uk_red`); and scene greens and greys (`leaf`, `leaf_dark`, `stone`). Each has `{ purpose, needsApproval: true }`.
  - **Semantic aliases** exactly per data-model §2.
  - **Remove** every 002 placeholder colour (sand, gold, cocoa, terracotta, indigo, green, teal, hibiscus).
  - **`pairs`**: every used pairing, including the non-text 3:1 pairs (Mane Brown outline against Warm Cream, coin rim against Warm Cream).
  - **`rejectedPairs`**: each failure from R3 with `{ fg, bg, ratio, resolution }`.
  - Keep the 002 type, space, radius, size and motion groups. Add `size.border.brand = 2px`.
- [X] T007 Extend `specs/002-ux-prototype/contracts/tokens.schema.json` into `specs/003-brand-voice-interactive/contracts/tokens.schema.json` (version 1.1.0). Allow `$extensions` on tokens and a `rejectedPairs` array of `{fg,bg,usage,ratio,resolution}`. Point `tools/design/lib.mjs` `TOKENS_SCHEMA` at the new file.
- [X] T008 Update `tools/design/build-tokens.mjs` to handle `$extensions` (ignore it in CSS; show it in the `tokens.md` tables as Source / Derived from / Needs approval). Update `tools/design/check-contrast.mjs` so it also writes **`docs/design/contrast-report.md`**: every used pair with its ratio and PASS, then every rejected pair with its ratio, FAIL and resolution (data-model §3).
- [X] T009 [P] Implement `tools/design/check-brand.mjs`. It fails if any `color.brand.*` value differs from a hard-coded copy of the guide (R3 table), or if any colour token is neither `brand.*`, `derived.*` (with `derivedFrom` and `rule`), `success.green` nor `illustration.*` (with `purpose`) (FR-001, FR-002, FR-004, SC-001). With `--art`, it also scans every `fill`, `stroke` and `stop-color` in `prototype/assets/art/**/*.svg` and fails on any value that isn't a brand, derived or illustration token. `prototype/assets/brand/**` is exempt (FR-047). `npm run check` runs it with `--art`.
- [X] T010 [P] Implement `tools/design/check-no-tts.mjs`. It fails if any file under `prototype/` contains `speechSynthesis`, `SpeechSynthesisUtterance`, `webkitSpeech` or `getVoices` (FR-014, SC-003).
- [X] T011 Add the scripts `brand`, `notts` and `narration` to `tools/design/package.json`. Change `check` to run, in order: `tokens → contrast → brand → notts → usage → narration --check → test`.
- [X] T012 Implement **`KC.voice`** in `prototype/assets/app.js`, replacing all of `KC.say`, the speech code and the voice unlock (contracts/audio-manifest.md "Playback contract"):
  - `play(lineId, vars)`: uses one `HTMLAudioElement`, so a new line stops the old one. Language order: `regionLanguage[region]` if recorded, then `defaultLanguage` if recorded, otherwise caption only.
  - The caption fills `{vars}` in `KC.audioManifest.text[lineId]`.
  - Kudi shows `headphones` while a line plays and goes back to its previous pose afterwards.
  - Sets `KC.voice.last`. Audio `error` or a rejected `play()` falls back to the `pending` caption.
  - `replay()` and `stop()`.
  - Keep a `KC.say` alias that calls `KC.voice.play`, so existing call sites work during the migration, and **remove it in T051**.
  - **Delete every `speechSynthesis` reference.** `check-no-tts.mjs` must pass.
- [X] T013 Implement **`KC.sfx(id)`** in `prototype/assets/app.js`: Web Audio generated tones `pop`, `chime`, `tick`, `boop`, `sparkle` and `tap`, exactly per interaction-moments §3. They follow `KC.state.sound` and append each ID to `document.body.dataset.sfxLog` for tests. **Tones only, no speech** (FR-030).
- [X] T014 Implement **`KC.kudiReact(state)`** and the base-pose handling in `prototype/assets/app.js`, using the pose map in interaction-moments §2. It sets `img.src` to `assets/brand/kudi-<pose>.webp` and sets `data-kudi-pose`. It follows the **pose order** in interaction-moments §2: reaction pose for about 0.6 s, then `headphones` while a line plays, then the base pose. With no line, the reaction holds for 1.2 s. `hear` actions go straight to `headphones` (U1). Update `KC.kudi()` to use the brand poses (`wave` by default), with Kudi 96–320 px tall in proportion (brand-assets "Rules").
- [X] T015 Add the shared helpers in `prototype/assets/app.js`:
  - `KC.coinImg(denomId, opts)`: always uses `KC.coinSrc`, always sets `data-region`, and allows `alt` and `class` (FR-040).
  - `KC.singleSelect(cards, onPick)` (FR-040).
  - `KC.keypad(onKey)` (FR-039).
  - `KC.childAction(el, kind, onAct)`: sets `data-child-action`, adds `KC.resetIdle`, and calls `onAct` (interaction-moments §1).
- [X] T016 Implement `tools/design/build-narration.mjs` and its `--check` mode (research R5, contracts/narration-lines.schema.json, contracts/audio-manifest.md). It must:
  - Validate `docs/design/narration/lines.json` with ajv.
  - Generate `docs/design/narration-script.md`, grouped by screen. Each row has the ID, the text, the delivery note, the target length (seconds), the idea, the pronunciation, and the file name `<id>.m4a`. The file ends with a file-naming table.
  - Generate `prototype/assets/data/audio-manifest.js` (a classic script), scanning `prototype/assets/audio/<lang>/<id>.m4a` for `recorded` vs `pending`. Every ID appears in every language.
  - `--check`: fail if any line's estimate (`words × 60 / wordsPerMinute`) is greater than its `maxSeconds`; if `maxSeconds` is greater than 8; or if any key used in `prototype/assets/*.js` via `KC.voice.play('…')`, `data-say="…"` or `say:` is missing from `lines.json` (FR-017, FR-018, SC-007).
- [X] T017 Add `<script src="assets/data/audio-manifest.js">` to `prototype/index.html`, after `regions.js` and before `app.js`. In the header, replace the right-hand spacer with the **replay button** (`#kc-replay`, `data-component="replay-button"`, `data-replay`, `aria-label` from the strings file), and add a **caption slot** (`#kc-caption`, `data-component="narration-caption"`, `data-caption-state="hidden"`). Replace the wordmark text in `#kc-logo` with `<img src="assets/brand/logo-on-white.svg">`, keeping the 2-second long-press for the reviewer menu.

**Checkpoint**: all 13 screens open, the brand tokens load, `KC.voice` shows pending captions,
`check-no-tts` passes, and `check-brand` passes.

---

## Phase 3: User Story 1: the client sees the official brand (P1) 🎯 MVP

**Independent test**: every screen shows the official logo and poses and only brand or recorded
colours, and passes contrast (US1, W1–W3).

- [X] T018 [US1] Re-skin `prototype/assets/base.css` with the brand aliases only:
  - The app background is `color.bg.app` (Warm Cream). Text is `color.text.primary` (Mane Brown).
  - The phone frame border is Mane Brown. The desk around it is `color.derived.cream_shade`.
  - The parent area is `color.parent.bg` (Mane Brown) with Warm Cream text.
  - Focus rings are Mane Brown with a Sunshine Yellow glow.
- [X] T019 [US1] Re-skin `prototype/assets/components.css` for all 002 components, using aliases only:
  - **Main button**: Sunshine Yellow with a Mane Brown label and a **2 px Mane Brown outline**, plus a Mane Brown bottom edge. Pressed uses `derived.yellow_pressed` (FR-005, FR-006).
  - **Secondary button**: Adventure Orange with a Mane Brown label and outline.
  - **Coins, coin counter and reward icons**: Golden Orange with a **Mane Brown rim**.
  - **Choice cards**: White with a Mane Brown border. Selected uses Soft Gold.
  - **Hint ring**: `color.feedback.hint_ring`.
  - **Success text and badges**: `color.feedback.success`, on cream or white only.
  - Locked uses `derived.brown_60`.
  - **No white text on yellow, orange or Golden Orange, anywhere.**
- [X] T020 [US1] Add the CSS for the three new components to `prototype/assets/components.css`:
  - `replay-button`: 48 px round, Adventure Orange, Mane Brown outline and icon.
  - `narration-caption`: a White card with a Mane Brown border, plus a "Recording pending" badge in Mane Brown on Soft Gold.
  - `count-badge`: a Mane Brown pill with a Warm Cream number, sitting on each jar.
- [X] T021 [P] [US1] Re-colour the placeholder art that stays (avatars, scenes, the 002 coins, icons) so it sits well with the brand palette. Regenerate it with the 002 art generator copied to `tools/design/lib/art.py`, changing **only** the palette constants, to brand, derived or `color.illustration.*` values (FR-047). `check-brand.mjs --art` must pass. Remove `prototype/assets/art/kudi/` (the placeholder Kudi), and add a Mane Brown outline to coin tokens (FR-006, FR-010, R13).
- [X] T022 [US1] Replace every use of the placeholder Kudi in `prototype/assets/screens.js` and `activities.js` with `KC.kudi(<pose>)` and the mapped poses: `wave` as the base and for think and long idle, `thumbs-up`, `celebrate`, `fist` and `headphones` (R2, FR-038). Update `prototype/manifest.webmanifest` icons to `assets/brand/app-icon-*.png`, and set the theme and background to the hex of `brand.sunshine_yellow` and `brand.warm_cream`. The manifest is the only place hex is allowed, because it isn't CSS.
- [X] T023 [US1] Use the official logo versions in `prototype/assets/screens.js`, `app.js` and `index.html`: `logo-on-white` on Welcome (hero) and in the header; `logo-on-brown` in the parent gate and the reviewer menu. **Never** draw the logo on a background that doesn't match its version (brand-assets "Files").
- [X] T024 [US1] Run `npm run check` in `tools/design`. Tokens, contrast (with `contrast-report.md` written), brand, no-TTS and token usage must all pass. Fix any CSS that still uses a removed placeholder token.
- [X] T025 [P] [US1] Write `docs/design/brand.md`:
  - The logo versions with previews and where each is used.
  - Clear space and minimum size.
  - The pose-to-state table, with B2 (no peace sign) flagged.
  - The brand rules: Mane Brown text on yellow and orange, Mane Brown outlines and rims.
  - The success green (pending).
  - The derived shades (pending).
  - **The UI font proposal** (FR-012, B9): Baloo 2 + Nunito (OFL), the reason they pair with Sobas Play and Skia, and their embedding licence.
  - **What "character highlights" means** (US1-2, A1): the Kudi speech-bubble fill and the selected choice-card fill, both Soft Gold.
  - The illustration palette (FR-047, B10), with swatches.
  - The open decisions B1–B10.
- [X] T026 [P] [US1] Update `docs/design/tokens.md` (the hand-written sections), `docs/design/kudi-the-cub.md` (five supplied poses only; mapping; delete the placeholder drawing specs; keep the "never" list), and `docs/design/design-references.md` (palette and Kudi sections now describe the official brand). Remove every mention of the 002 placeholder palette (FR-013).

**Checkpoint**: W1–W3 pass. The prototype looks like the brand guide.

---

## Phase 4: User Story 2: Kudi speaks with a natural human voice (P1)

**Independent test**: there is no text-to-speech anywhere. Pending captions show on every line.
Three dropped-in files play with no code change (US2, W4–W7).

- [X] T027 [US2] Create `docs/design/narration/lines.json` (contracts/narration-lines.schema.json), with `languages: ["en-GH","en-NG","en-GB"]`, `defaultLanguage: "en-GH"`, `regionLanguage: {gh:"en-GH", ng:"en-NG", uk:"en-GB"}` and `wordsPerMinute: 130`. It holds **every** spoken line (about 80), each ≤ 8 s with one `idea`:
  - **Every 002 prompt and hint**, moved out of `mock-data.js` `strings`.
  - **Tap-to-hear names**: every coin for each region (`coin.gh.p10` … `coin.uk.gbp2`, each with `region`), the 4 avatars, the 4 name chips, the 8 badges, the 5 levels, the 5 pillars, the wallet categories, and the bottom-nav labels (`kind: "label"`).
  - **Call and response**: the questions and reactions for Intro, Count, Decision and Summary (interaction-moments §4).
  - **Reactions**: `sort.try_again` (encouraging), and celebrations per step.
  - **Currency and market examples per region (FR-033, FR-034)**: for example `wallet.currency.gh` "These are Ghana cedis and pesewas", `decide.spend_sub.ng` "A puff-puff sticker", `result.spend.say.uk` "Yum! A biscuit sticker!", and the sticker history label for each region.
  - **Pronunciation hints** for pesewas, cedis, kelewele, sobolo, kobo, naira, puff-puff and zobo.
- [X] T028 [US2] Run `node tools/design/build-narration.mjs`, so that `docs/design/narration-script.md` and `prototype/assets/data/audio-manifest.js` are generated, with every line `pending`. Then run `--check` and fix any line that is too long or any key that is missing.
- [X] T029 [US2] Migrate every speech call site in `prototype/assets/screens.js`, `activities.js` and `app.js` to `KC.voice.play('<lineId>', vars)`, with region-specific IDs where FR-033 and FR-034 apply.
  - Remove narration text from `prototype/assets/data/mock-data.js` `strings`, keeping only non-spoken UI strings. Spoken captions come from the manifest `text`.
  - Implement the empty `strings_<region>` override in `mock-data.js` (FR-033), and use it in `KC.t` for region-specific visible labels.
- [X] T030 [US2] Make the idle hint replay the recorded prompt **at level 1 (6 s)** as well as later. Use the `fist` pose (encourage) instead of the 002 "point" pose (FR-035, R2). This is in `prototype/assets/app.js` (`startIdle`).
- [X] T031 [US2] Fix the bottom-nav labels being cut off (FR-036). In `prototype/assets/app.js`, play the tab's label line **after** `KC.render` for the new screen, and don't call `KC.voice.stop()` for `kind: "label"` lines during navigation.
- [X] T032 [US2] Wire the header replay button (`#kc-replay`) to `KC.voice.replay()`. On a screen where nothing has played yet, it plays the screen's first `narration` line (FR-029). Wire `#kc-caption` states `hidden`, `playing` and `pending` per contracts/audio-manifest.md "Caption states" (FR-016, FR-037).
- [X] T033 [US2] Rename the button key `reward.home` to `nav.back_home` in `prototype/assets/screens.js` (Reward and Wallet) and in `mock-data.js` (FR-045).
- [X] T034 [US2] Extend `tools/design/tests/flow.spec.mjs` with voice assertions (interaction-moments §6, items 4–6):
  - Use `page.addInitScript` to stub `window.speechSynthesis = { speak(){ window.__tts = (window.__tts||0)+1 }, cancel(){}, getVoices(){return []} }`, and assert `window.__tts` is undefined or 0 at the end.
  - With no recordings, every screen's first line ends with `data-caption-state="pending"` and the visible badge "Recording pending".
  - `[data-replay]` is visible on every screen, and clicking it re-shows the last caption.
  - **Drop-in test**: in `beforeAll`, generate 3 short silent `.m4a` files (for `welcome.say`, `intro.say` and `find.say`) in `tools/design/.tmp/audio/en-GH/` with `ffmpeg -f lavfi -i anullsrc=r=48000:cl=mono -t 0.5 -c:a aac` (skip with a clear message if ffmpeg is missing). Copy them into `prototype/assets/audio/en-GH/`, run `build-narration.mjs`, and assert those 3 lines reach `data-caption-state="playing"`. Then remove the files and rebuild, in `afterAll` (SC-008).

- [X] T035 [US2] Add a **Voice language** control (en-GH · en-NG · en-GB, default from `regionLanguage`) to the reviewer menu in `prototype/assets/app.js`. It sets `KC.state.voiceLang`, which is stored in `sessionStorage` as `voiceLang`, and `KC.voice.play` uses it before the region's language (data-model §9, C2). Record the new stored-preference list (`region`, `sound`, `notes`, `voiceLang`) in `docs/design/README.md`.

**Checkpoint**: W4–W7 pass, and `npm run check` is green.

---

## Phase 5: User Story 3: the child is always doing something (P1)

**Independent test**: every Lost Coins screen has a child action besides Next. Every action
gives a pose change and a sound. Dragging updates the count per coin (US3, W8–W11).

- [X] T036 [US3] Replace the save/spend branching with **one choice table**, `KC.choices = { save: {...}, spend: {...} }`, in `prototype/assets/screens.js`. Each entry holds the icon, label key, sub-label key, wallet effect, result art, summary line and history kind. Use it in Decision, `KC.applyChoice`, Result, Summary and Wallet (FR-042, at the old `screens.js:320, 342–345, 355, 361, 371–372, 399, 475`).
- [X] T037 [US3] Replace the lists read by position with named objects in `prototype/assets/screens.js`: `bands` becomes `{label, band, enabled}`, the Decision `opts` come from `KC.choices`, and the wallet `cats` become `{category, icon, fill}` (FR-041). Replace every hard-coded `8` with `KC.data.lostCoins.hidden`: `screens.js` (`'× 8'` and `|| 8`) and `activities.js` (the progress dots, "of 8", "Find 8", `|| 8`) (FR-043).
- [X] T038 [US3] Use `KC.keypad` for both the parent-gate and PIN pads, and `KC.singleSelect` for the age, avatar, name-chip and Decision cards, in `prototype/assets/screens.js` (FR-039, FR-040). Use `KC.coinImg` at every coin image site in `activities.js`, `celebrate.js` and `screens.js` (FR-040).
- [X] T039 [US3] Make **drag the primary way to sort**, with a **per-coin count badge**, in `prototype/assets/activities.js` (FR-024, R10):
  - Each jar has a `count-badge` that goes up by 1 the instant a coin lands, with `KC.sfx('chime')`, `KC.kudiReact('correct')` (`thumbs-up`) and a sparkle.
  - A wrong jar: the coin floats back, `KC.sfx('boop')`, `KC.kudiReact('encourage')` (`fist`), and `KC.voice.play('sort.try_again')`.
  - A drop outside any jar: the coin floats back silently.
  - Only the first pointer drags (multi-touch is ignored).
  - Tap-coin-then-tap-jar stays as a fallback.
  - When all coins are sorted: `KC.kudiReact('celebrate')` and `KC.sfx('sparkle')`.
- [X] T040 [US3] Add the find and count child actions in `prototype/assets/activities.js`:
  - **Find**: each coin found plays `pop`, speaks its region name (`coin.<region>.<id>`) and shows `thumbs-up`. All found gives `celebrate`.
  - **Count**: each counted coin plays `tick` and speaks the number line. After the last jar, a **call and response**: `count.which_most` "Which jar has the most coins?", answered by tapping a jar (`data-child-action="answer"`). The right jar gets `thumbs-up`, `sparkle` and a line. Any other jar gets a kind line and `fist`, with no failure. Next appears only after an answer.
- [X] T041 [US3] Add **call and response** to Mission Intro in `prototype/assets/screens.js`. Kudi asks `intro.help` "Can you help me find them?" A 👍 answer card (`data-child-action="answer"`, `data-primary-group`) reveals Start (FR-027). Also make the stall picture tap-to-hear.
- [X] T042 [US3] Add the Decision, Result and Summary interactions in `prototype/assets/screens.js`:
  - **Decision**: each card speaks on tap. The choice is the answer.
  - **Result**: tap the jar to drop in the last coin (save), or tap the sticker to stick it on (spend) (`data-child-action="tap"`, `sparkle`). Tap the amount to hear it.
  - **Summary**: a call and response, `summary.what_did_you_do` "What did you do with your coins?", answered by tapping the save or spend picture. The matching answer gets `thumbs-up`; the other gets a kind hint.
  - Each recap tile speaks on tap (FR-023, FR-027).
- [X] T043 [US3] Add tap-to-hear (`data-say` plus `data-child-action="hear"`) and Kudi reactions on the remaining screens in `prototype/assets/screens.js`:
  - **Welcome**: Kudi and the logo coin.
  - **Age**: the cards.
  - **Avatar**: the friends and name chips.
  - **Home**: the coin counter ("You have N coins"), badges and the daily sun.
  - **Reward**: badges, and tapping the coin burst re-plays `celebrate` (`tap`).
  - **Wallet**: bars and history lines.
  - **Progress**: level nodes, badges and pillars.

  Every child action must change the Kudi pose or play a line, and play a sound effect (FR-025, FR-026, SC-006).
- [X] T044 [US3] In `prototype/assets/screens.js` and `activities.js`, make sure every `data-child-action` is **enabled at render** and is never disabled while a line plays. No screen waits for narration before allowing actions (FR-022, R9). Make sure child actions never call `KC.go`.
- [X] T045 [US3] Extend `tools/design/tests/flow.spec.mjs` with interaction-moments §6 items 1–3:
  - Every Lost Coins screen has at least one enabled `[data-child-action]` straight after render.
  - Tapping each one changes `data-kudi-pose` or the caption state, adds to `data-sfx-log` or plays a line, and doesn't change `data-screen`.
  - **Sort by real drag** (`mouse.down/move/up` to the jar centre): the matching jar's count badge goes up by exactly 1. A wrong jar leaves it unchanged, shows `fist` and logs `boop`.
  - The call-and-response answers on Intro, Count and Summary are required before the next main action appears.
  - **SC-005 timing (C4)**: on every Lost Coins screen, and after each step, at least one `[data-child-action]` or main action is enabled and visible within 1 s.
  - Keep all 002 assertions (one main action at a time, no `data-failure`, touch sizes, traceability with the **3 new component IDs** added to the allowed list, regions, replay economy, wallet regression).

**Checkpoint**: W8–W11 pass, and `npm run check` is green.

---

## Phase 6: User Story 4: the client sees what changed (P2)

**Independent test**: the before/after document shows every screen with before, after and change
notes, plus the open decisions (US4, W13, SC-010).

- [X] T046 [US4] Implement `tools/design/capture-before-after.mjs`:
  - `git worktree add tools/design/.tmp/before prototype-v0.1.0`.
  - Screenshot every screen ID at 390 × 844 from that worktree's `prototype/index.html`, then from the current prototype, with reduced motion and the same example state.
  - Write `docs/design/round1/before/<screen>.png` and `after/<screen>.png`.
  - Remove the worktree when done.
- [X] T047 [US4] Write `docs/design/round1/notes.json` (per screen, 1–5 changes, each `{category: brand|voice|interaction, note}`, in plain language). Generate `docs/design/round1-before-after.md` from it with the capture script, or a small `build-round1.mjs`. For each screen it shows a before and after image table and its notes. It ends with **Open decisions B1–B8 and V1**, copied from the spec (FR-031).

**Checkpoint**: W13 passes.

---

## Phase 7: User Story 5: a voice actor can record without extra help (P3)

**Independent test**: someone new can tell, from the script and brief alone, what to say, how,
how long, and what to name each file (US5, W12).

- [X] T048 [P] [US5] Write `docs/design/voice-direction-brief.md` (FR-020, research R6–R7). It covers:
  - The voice: a warm, friendly female storyteller, natural Ghanaian English (provisional, V1), smiling, never robotic, flat or sing-song.
  - Pace: 120–140 words per minute, with short pauses between ideas.
  - A table of delivery notes, with a good and a bad example for each.
  - Pronunciation of local words and currency.
  - Session tips: lines ≤ 8 s, one idea, three takes, best take marked.
  - File format: WAV masters, 48 kHz, 24-bit, mono, 150 ms room tone, peaks ≤ −3 dBFS, about −16 LUFS, named `<lineId>.wav`; plus `.m4a` for the prototype.
  - Delivery folder structure.
  - **Consent and usage**: the recordings are for the KudiCubs app and marketing; no synthetic re-use or voice training without separate written consent.
  - The tone reference https://www.youtube.com/watch?v=47MNn4bsmSw, **labelled tone only**, with an explicit "do not copy, closely imitate or clone".
- [X] T049 [P] [US5] Implement the optional `tools/design/encode-audio.mjs`. It converts `prototype/assets/audio/<lang>/*.wav` to `.m4a` (AAC-LC, mono, 64 kbps) with ffmpeg if it's present, and otherwise exits with a clear message. Then it re-runs `build-narration.mjs`. Document it in `prototype/assets/audio/README.md`.

**Checkpoint**: W12 passes.

---

## Phase 8: Polish & cross-cutting

- [X] T050 Implement `tools/design/build-sw.mjs` (FR-044). It generates `prototype/sw.js` with every prototype file, including brand assets and any audio, and a cache name `kc-proto-<KC.version.prototype>` read from `mock-data.js`. Add it to `npm run check` before the tests. Never edit `sw.js` by hand.
- [X] T051 **Remove the temporary `KC.say` alias** from `prototype/assets/app.js` (left from T012; I2), and make sure every call site uses `KC.voice.play`. Then externalise the screen-reader labels and alt text (FR-046) at the old `activities.js:37, 76, 83, 161`, `screens.js:86, 96, 232, 362, 365, 473, 492, 494` and `app.js:147`, plus any new ones from T039–T043, into `mock-data.js` strings, using `KC.t`.
- [X] T052 Bump the versions (FR-032): `KC.version = { prototype: '0.2.0', tokens: '0.2.0' }` in `prototype/assets/data/mock-data.js`, and `tokens.json` `version: "0.2.0"`. The reviewer menu shows them.
- [X] T053 Update `docs/design/components.md`:
  - Re-skinned descriptions.
  - The 3 new components (`replay-button`, `narration-caption`, `count-badge`), so there are **28** in total.
  - The `data-child-action` rule next to "one main action at a time".
  - Refresh the thumbnails with `node tools/design/capture-components.mjs`, extending it for the 3 new components.
- [X] T054 Update `docs/design/review-guide.md` for round 1 (C3): the official brand, the new things to tap and drag, the replay button, and that **voices are being recorded** (captions show "Recording pending" until then). Remove the "robot voice" paragraph. Add the open decisions Jefferson must answer (B1–B10, V1), in plain language. Add to `docs/design/child-session-protocol.md`: **sessions with children must wait until the recordings exist**, because pre-readers can't use captions (plan N1).
- [X] T055 Update `docs/design/README.md`: the file index (brand.md, contrast-report.md, narration files, the brief, round1), the new checks in "How to change something", and a **round-1 validation record**.
- [X] T056 Run a size and performance pass. `prototype/` without audio must be ≤ 3 MB; with future audio the budget is ≤ 8 MB. Tap feedback ≤ 100 ms; screen render ≤ 50 ms with 4× CPU throttling. Record the results in `docs/design/README.md` (plan Technical Context).
- [X] T057 Run the quickstart scenarios W1–W13 and record pass or fail in `docs/design/README.md`. **W14 (real phones) stays open** for the developer. Rebuild the zip as `prototype-v0.2.0.zip`. It isn't committed.
- [X] T058 Request a code review of `prototype/`, `tools/design/` and `docs/design/` (two axes: standards and spec) of the whole round-1 change. Fix the findings, or record them as deferred in a follow-up spec. Show the developer the diff and the check results.
- [X] T059 **Confirm first** (`git` on `prototype/`, `tools/design/`, `docs/design/`, `specs/003-brand-voice-interactive/`): after the developer approves, commit as the developer (no AI co-author lines), push `003-brand-voice-interactive`, push the tag `prototype-v0.1.0`, and open the PR "003: Client feedback round 1 (brand, voice, interaction), prototype v0.2.0", stacked on `002-ux-prototype`.

---

## Dependencies & execution order

| Phase | Depends on |
|---|---|
| Setup (T001–T003) | Nothing |
| Foundational (T004–T017) | Setup. **Blocks all stories.** Inside it: T004 → T005; T006 → T007 → T008; T009, T010 run alongside; T012 → T013 → T014 → T015 (all in `app.js`, so sequential); T016 needs nothing else; T017 needs T012 and T016. |
| US1 (T018–T026) | Foundational |
| US2 (T027–T035) | Foundational. T027 → T028 → T029; T030–T033 and T035 after T029; T034 after those. |
| US3 (T036–T045) | Foundational plus T029 (line IDs exist). In practice it runs after US2's T029, because it uses `KC.voice` line IDs. The `screens.js` and `activities.js` tasks are sequential. |
| US4 (T046–T047) | US1–US3 finished (the "after" must be final) plus T001 (the tag) |
| US5 (T048–T049) | T027 (lines exist). It can run alongside US3 and US4. |
| Polish (T050–T059) | Everything wanted. T058 → T059. |

### Parallel opportunities

- **Phase 2**: T009 and T010 run alongside T006–T008, and T016 runs alongside the `app.js` chain (T012–T015).
- **US1**: T021 (art), T025 (brand.md) and T026 (docs) run alongside the CSS work (T018–T020).
- **US5**: T048 and T049 run alongside US3 once T027 exists.

### Parallel example: User Story 1

```text
T018–T020  CSS re-skin           → prototype/assets/base.css, components.css (sequential, shared files)
T021 [P]   recolour placeholder art → tools/design/lib/art.py, prototype/assets/art/
T025 [P]   brand.md              → docs/design/brand.md
T026 [P]   tokens/kudi/references docs → docs/design/*.md
```

## Implementation strategy

1. **MVP = Phases 1–3 (US1)**: the official brand is visible. Show this internally first.
2. Then **US2** (the voice engine and the full script) and **US3** (interaction). These are what
   the client asked for, along with the brand.
3. Then **US4** (the before/after summary) and **US5** (the brief), which are the client package.
4. Then Polish, the code review (T058), and the **confirm-first** commit and PR (T059).

### Task counts

| Phase | Count |
|---|---|
| Setup | 3 |
| Foundational | 14 |
| US1 | 9 |
| US2 | 9 |
| US3 | 10 |
| US4 | 2 |
| US5 | 2 |
| Polish | 10 |
| **Total** | **59** |

## Notes

- `[P]` means a different file and no unfinished dependency. `app.js`, `screens.js`,
  `activities.js` and `components.css` are shared, so tasks editing them are sequential.
- Every change goes through `npm run check`.
- T001's tag push and T059's commit, push and PR are outward-facing, and **always ask first**.

## Implementation notes (2026-11-15, `/speckit-implement`)

- **Done**: T001–T059. T059 was approved by the developer on 2026-11-15.
- **T001**: the `prototype-v0.1.0` tag was created **locally only**. Pushing it is part of T059.
- **T012/T051**: no temporary `KC.say` alias was kept. Every call site moved straight to
  `KC.voice.play`, so `check-no-tts` passed from the start of the migration.
- **T004**: mascot PNG fallbacks are **320 px, palette-quantised** (WebP at 640 px is what the
  prototype uses). This keeps `prototype/` at 2.2 MB, under the 3 MB budget (it was 4.1 MB).
  Recorded in research R1 and brand-assets.
- **T027**: 142 lines, more than the ~80 estimated. Recorded lines can't hold variables, so
  counting uses `num.1`–`num.20`, and region-specific lines exist for each region (coins, treat,
  currency, history).
- **T039**: the 8 coins split **3 / 4 / 1** (was 3 / 3 / 2), so "Which jar has the most coins?"
  has exactly one right answer. The split is computed from `KC.data.lostCoins.hidden` (FR-043).
- **Caption states**: besides `playing`, `pending` and `hidden` (contract), the caption also uses
  `ready` (a recording exists but the browser needs a tap first), `muted` and `done`.
- **Bugs found and fixed during validation** (see `docs/design/README.md`):
  - the count-question tap;
  - layout shifts while dragging, from the caption slot and the pose proportions;
  - caption clipping;
  - the white speaker icon;
  - wrapper component IDs;
  - the gate logo shifting the hold button;
  - PNG size.
- **The flow test** waits 700 ms after a wrong drop, so the coin finishes floating back before the
  next grab (WebKit timing; a child can't re-grab that fast).
- **T058 (code review, two axes)**: 9 Standards and 9 Spec findings. **All fixed**, none deferred:
  - *Standards*:
    - Sort is now playable by keyboard (`activities.js`, click with `detail 0`).
    - `KC.childAction` no longer swallows Enter/Space on native buttons.
    - `KC.singleSelect` became `KC.markSelected`, called from each card's own action; the age
      cards use it too.
    - `KC.promoteOnce` replaces three copies of the "promote once" guard.
    - Raw px became `size.*` tokens.
    - The round-1 CSS overrides were folded into the rules they changed. A computed-style
      comparison of all 32 screen states showed two intended differences: parent screens drop
      the hidden caption slot, and answer cards get their 64 px size.
    - The tools share one `walk` in `lib.mjs`.
    - `kc-center` replaces the inline `text-align`.
    - The keypad uses a key map.
  - *Spec*:
    - Confetti uses brand tokens and `KC.coinImg`; the unused `accent` fields are gone.
    - FR-009 gained the app-icon exception as client decision **B11**.
    - Bottom-nav labels play through `KC.go(route, { say })` in place of the prompt (FR-036).
    - The 20 s long idle is `wave` with "Welcome back!"; the 45 s state was removed (FR-038).
    - The region picker and Summary tile use `KC.coinImg` (FR-040).
    - Tints and faded states are `tint.*` and `opacity.*` tokens. Schema 1.2.0 adds the `tint`
      type (FR-002).
    - Bars, dots and fills have Mane Brown edges, with 5 pairs and 4 rejected pairs recorded
      (FR-004/006).
    - Words are tap-to-hear, and the caption is highlighted when there's no recording (FR-026).
    - The `index.html` screen-reader labels come from the strings file (FR-046).
  - *Found while verifying*: the child-action `display:flex` rule had collapsed the wallet bars
    and progress pillars. It now uses `:where()` (zero specificity).
  - `check-tokens-usage.mjs` now fails on undefined `var(--kc-*)` names (this would have caught
    the confetti), raw px in any property, `color-mix` and raw opacity.
  - 2 new flow tests: 14/14 pass on Chromium and WebKit.

