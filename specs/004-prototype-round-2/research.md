# Research: Prototype Round 2

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md) · **Date**: 2026-11-15

Each entry gives the decision, the reason, and the alternatives considered. Findings marked
**verified** were checked on this machine on 2026-11-15.

---

## R1. Hosting the stable demo link (FR-034, FR-035)

- **Facts (verified, re-checked 2026-11-15)**:
  - `Emt-tz/Kudicubs` is **private**, and GitHub Pages isn't enabled (`GET /repos/…/pages` →
    404).
  - The account plan can't be read: the token's scopes are `repo`, `workflow`, `gist`,
    `read:org` and `write:packages`, with no `user` scope.
- **Facts (GitHub documentation)**:
  - Pages for a private repository needs GitHub Pro, Team or Enterprise.
  - Even then, the site is **public to anyone with the link**. Access control on Pages
    ("private Pages") is available only on Enterprise Cloud.
- **Decision**: GitHub Pages with the official Actions deploy (`actions/upload-pages-artifact` +
  `actions/deploy-pages`) on push to `main`. The site is served from `prototype/` as-is, with no
  build step. **Task T001 is a confirm-first precondition check**: read the plan and the Pages
  availability. If Pages can't be enabled, **stop** and give the developer these options:
  1. Upgrade the account to GitHub Pro (the repo stays private; the demo link is public by URL,
     with noindex).
  2. Publish only the built prototype to a **separate public repo** (`Emt-tz/kudicubs-demo`) with
     Pages; the source stays private. This needs consent, because it creates public content.
  3. Cloudflare Pages (free; works with private repos; already proposed in 002 T067; needs
     `wrangler login`).
  4. Make this repository public. Not recommended, and **never done without explicit consent**.
- **Rationale**: the brief names GitHub Pages and requires a stop-and-ask if the plan or
  visibility blocks it.
- **Alternatives**: Netlify or Vercel (another account; not asked for). Keeping the tunnel
  (unstable, which is the problem being solved).

## R2. Scratch voice generation (FR-016–FR-018)

- **Facts (verified)**: `edge-tts` 7.3.1 runs with no account or key. The voice
  `en-NG-EzinneNeural` (female, en-NG) exists. `uv` is installed, so the script needs no
  global Python setup.
- **Decision**:
  - `scripts/generate-scratch-voice` is an executable Python script with PEP 723 inline
    metadata (`#!/usr/bin/env -S uv run --script`, dependency `edge-tts==7.3.1`).
  - Voice `en-NG-EzinneNeural`, rate `-10%`, output **MP3**. Edge's default format is 24 kHz
    mono, 48 kbit/s CBR.
  - Files go to `prototype/assets/audio-scratch/<lang>/<lineId>.mp3`.
  - Options:
    - `--lang` (default `en-GH`).
    - `--batch lost-coins` (default; the Lost Coins flow lines for the default region) or
      `--batch all`.
    - `--only <id,…>`.
    - `--retries 3`.
    - `--dry-run`.
  - Each line is written to a `.part` file and renamed only after a non-empty write, so a
    failure never leaves a "valid" partial file.
  - After writing, the script runs `build-narration.mjs` so the manifest picks the files up.
  - It prints `generated / skipped / failed` and lists failed IDs. The exit code is non-zero if
    any line failed.
- **Rationale**:
  - The brief names the library, voice and rate.
  - PEP 723 with `uv` gives a one-command run with no virtualenv.
  - MP3 plays in every target browser, including Playwright's Chromium, which has no AAC.
- **Privacy**: only the narration text goes to the service. No child or parent data exists at
  generation time, so none can be sent.
- **Alternatives**: OS voices with `say` (inconsistent across machines; macOS only). Paid TTS
  APIs (need accounts and keys; the brief rules them out).

## R3. Which lines make the first batch (FR-018)

- **Decision**: the generator builds the batch from `lines.json`:
  - every line whose `screen` is in The Lost Coins flow (`mission-intro`, `activity-find`,
    `activity-sort`, `activity-count`, `decision`, `result-save`, `result-spend`, `summary`,
    `reward`), **excluding** lines for other regions (`*.ng.*`, `*.uk.*`): **50 lines**;
  - plus the shared lines the flow speaks: `num.1`–`num.8`, `hint.welcome_back`, the two badge
    names the run can award (`badge.hard_worker`, `badge.smart_sorter`, plus
    `badge.first_coins`), and the level-up lines.

  That's about 60–65 lines (the exact count is printed by `--dry-run`).
- **Rationale**: matches "only the lines used in The Lost Coins flow for the default region" and
  is computed rather than hand-listed, so it stays in step with `lines.json`.

## R4. Scratch status in the manifest and playback order (FR-013–FR-015, FR-019, FR-020)

- **Decision**:
  - `build-narration.mjs` scans `audio/<lang>/<id>.m4a` → `recorded` and
    `audio-scratch/<lang>/<id>.mp3` → `scratch`. Everything else is `pending`.
  - Each manifest entry gets `{ status, file, scratchFile? }`, so a line with both keeps both.
  - `pickFile` tries, in order: `recorded` in `voiceLang` → region language → default language,
    then `scratch` in the same order, then the caption.
  - The caption badge text comes from the status (`voice.scratch` "Scratch voice",
    `voice.pending` "Recording pending"). It is rendered only when `KC.state.notes` is true.
  - The reviewer menu reads `KC.audioManifest.counts[lang] = { recorded, scratch, pending }`,
    generated by the build.
- **Rationale**: the folders are kept apart, so removing scratch is one `rm -r`; a human file
  always wins.
- **Alternatives**: one folder with a suffix (`id.scratch.mp3`) was rejected because it is easy
  to mix up and harder to delete in one step.

## R5. No-synthesis check, amended (FR-012, RB-1)

- **Decision**:
  - `check-no-tts.mjs` keeps failing on `speechSynthesis`, `SpeechSynthesisUtterance` and any
    network TTS endpoint in `prototype/`.
  - It now also requires every file in `audio-scratch/` to be listed with status `scratch`.
  - A new `--release` flag fails if **any** scratch file or scratch status exists. This is the
    RB-1 gate for any future release pipeline, and the docs say so.
- **Rationale**: the amended rule (no live synthesis) stays machine-checked, and the release
  blocker has a ready-made gate.

## R6. Audio duration and integrity checks (FR-021, FR-045)

- **Decision**: a new `tools/design/check-audio.mjs`:
  - Every manifest file exists and is larger than 1 KB.
  - Duration comes from `ffprobe` (verified locally; installed in CI with `apt-get` if missing)
    and must be ≤ the line's `maxSeconds` and ≤ 8 s.
  - No file in `audio/` or `audio-scratch/` is unlisted, and no listed file is missing.
  - Every Lost Coins flow line for the default region has a recorded or scratch file. This check
    is required once the first batch exists; `--allow-missing` is used only before that.
- **Rationale**: `ffprobe` reads MP3 and M4A reliably.
- **Alternatives**: estimating MP3 duration from frame headers (fragile with VBR or M4A);
  browser `audio.duration` in Playwright (no AAC in Chromium).

## R7. Saved progress on the device (FR-023–FR-032)

- **Decision**:
  - `localStorage` key `kudicubs.proto.progress`, holding
    `{ schema: 1, profile, events[], daily }`. The format is in
    [contracts/saved-progress.schema.json](./contracts/saved-progress.schema.json).
  - It is written after each committed event and on onboarding choices.
  - Preferences stay in `sessionStorage` (as 003).
  - On load, a `schema` mismatch or a parse or validation failure discards the data and the player
    starts fresh (FR-031).
  - If `localStorage` throws, the prototype runs from memory and shows a reviewer-only note
    (FR-032).
- **Rationale**: the data is small and synchronous, and works from `file://` and Pages alike.
- **Origin note**: on Pages, every `emt-tz.github.io/*` site shares one origin, so the key is
  namespaced.
- **Alternatives**: IndexedDB (async; overkill); cookies (sent to the server; not wanted).

## R8. Event-derived state (FR-025, FR-026, FR-033)

- **Decision**: state is **derived from an append-only event log**, as in the 001 architecture
  (coin economy as events). `KC.derive(events, today)` returns coins, savings, XP, level,
  badges, pillars, history rows, chart totals and daily progress. Screens read only derived
  values. The rules are in [data-model.md](./data-model.md) §3.
- **Economy fix found in research**: today the choice *subtracts* the found coins from a
  pre-filled balance (`screens.js:31,38`). From zero that would go negative. In round 2, Result
  first records **earning the coins found**, then the save or spend.
- **Rationale**: one source of truth makes the data tests (FR-047) exact, Restart is "clear the
  log", and sample data is "a fixed log".

## R9. Navigation guard (FR-003–FR-005)

- **Decision**:
  - The hash router gets a guard that runs on every navigation, including Back
    ([contracts/navigation.md](./contracts/navigation.md)).
  - Mission screens after the intro need an **active run** in memory. Result and Reward also need
    a run that reached them **in this visit**; otherwise they redirect to Home with
    `history.replaceState`.
  - Leaving Reward, a Result screen or the gate uses `location.replace`, so their history
    entries never stay behind.
  - The Back button is hidden on `home`, `wallet` and `progress`.
- **Cause of A4, found in research**: Reward's `narration` function runs **before** `render`
  sets `lastReward` (`screens.js:428` vs `434`). On the first replay it reads the previous run's
  `replay: false`. The fix is to decide "replay" from `completedOnce` **before** rendering.

## R10. Keeping the main action in view (FR-001, FR-002)

- **Decision**:
  - `.kc-actions` becomes a **sticky footer** inside the scrolling `#kc-screen`
    (`position: sticky; bottom: 0`, with a Warm Cream background and top fade token). Wherever a
    main action is promoted, it is visible at once.
  - For short viewports (`max-height: 700px`), Kudi sizes step down to `kudi.min` and the title
    gap tightens. 96 px stays the smallest Kudi.
  - Main-action *groups* (choice grids, tray and jars) must also fit. Count hides the big
    counter while asking (FR-007), which frees the space the failing case needs.
- **Measured failures it must fix** (360×640, pixels hidden): Age after picking, Next 60; Avatar
  after picking, That's me! 22; Intro after "Yes!", Start 34; Count after answering, Next 198;
  Summary before answering, answer cards 143; Summary after answering, Next 60; Reward, Back to
  Home 138. The sticky footer fixes every *button* case at once. Summary-before (a main-action
  **group**) and Reward also need the content above to fit: the recap tiles become one compact
  row and Kudi drops to `kudi.min` at `max-height: 700px`. Text sizes are never reduced.
- **Fold test**: at 360×640 and 390×844, after render and after every scripted interaction,
  `[data-primary]`, or else `[data-primary-group]`, must lie fully inside both the viewport and
  `#kc-screen`'s visible rectangle, with no scrolling.

## R11. Captions vs Kudi's bubble (FR-008)

- **Decision**: when a line plays, the text is normalised (lower-case, punctuation and spaces
  collapsed) and compared with every visible `.kc-bubble`, `.kc-ask` or title text on the screen.
  On a match the caption state is `hidden`; the line still plays, and replay still works.
- **Note**: with notes on, the voice badge isn't shown for hidden captions. The reviewer sees
  the status in the reviewer menu counts.

## R12. Tap targets for words (FR-048 vs 003 FR-026)

- **Finding**: 003 made bare titles tap-to-hear at their natural height (about 30 px), which
  breaks "no interactive element under 48×48".
- **Decision**: the tappable unit becomes the **row** that holds the words and their speaker cue
  (`.kc-row`, bubble or ask panel), which is ≥ 48 px tall. The words themselves are no longer
  separate child actions.
- **Count jars**: coins inside the jars become 48×48 targets. Two per row fit in a 109 px jar at
  360 px width (FR-009).

## R13. CI and deploy (FR-038, FR-040)

- **Decision**:
  - `.github/workflows/prototype-ci.yml` runs on `pull_request`:
    - `ubuntu-latest`, Node 22, `npm ci` in `tools/design`;
    - `npx playwright install --with-deps chromium webkit`;
    - `ffmpeg` installed if missing;
    - `npm run check` (all generators in `--check` mode, plus the full test suite).
  - The suite runs against a **local static server** (`tools/design/serve.mjs`, Node built-ins
    only), started by Playwright's `webServer`. That catches failed requests the same way the
    Pages site would.
  - `.github/workflows/prototype-pages.yml` runs on `push` to `main` and has three jobs:
    1. `build`: writes `build-info.js` with the version, the UTC build date and the short SHA,
       then uploads `prototype/`.
    2. `deploy`: `deploy-pages`.
    3. `smoke`: Playwright `smoke.spec.mjs` against the live URL. It checks that the app starts
       (`#kc-screen[data-screen=welcome]`) and that every file in `sw.js`'s list and every
       manifest audio file returns 200.
  - Actions minutes: about 6 minutes per PR run, well within the free private-repo allowance.
- **Merge-order note**: `main` gets the prototype only after PRs #1 → #2 → #3 → #4 merge.
  The first deploy happens then.

## R14. Build info and versions (FR-037, FR-050)

- **Decision**:
  - `prototype/assets/data/build-info.js` is generated with
    `{ version: '0.3.0', builtAt, commit }`. Locally it shows `builtAt: "local"`; the deploy job
    stamps the date.
  - The reviewer menu shows `v0.3.0 · built 2026-11-20 · abc1234`.
  - `KC.version.prototype` and `tokens.json` become `0.3.0`, and the service worker cache becomes
    `kc-proto-0.3.0`.

## R15. Runtime contrast scan (FR-049)

- **Decision**:
  - `check-contrast.mjs` (recorded pairs) stays.
  - A Playwright test walks every visible text node on every screen. It computes the effective
    background colour (the first non-transparent ancestor; elements over images are skipped and
    counted) and asserts ≥ 4.5:1, or ≥ 3:1 for large text (≥ 24 px, or ≥ 18.66 px bold).
  - Pairs it finds that `tokens.json` doesn't record fail the test, so "in use" and "recorded"
    can't drift apart.

## R16. Fastlane rule

- **Finding**: the constitution and the developer's global rule route builds, version bumps and
  store uploads through fastlane (`beta`, `release`, `bump`).
- **Decision**: this doesn't apply here. The prototype is static files with no app build, no
  binary and no store upload. The "deploy" is a Pages artifact upload. Versions are semver fields
  in files, as in 002 and 003. When the Flutter app exists (001), its builds go through fastlane.

## R17. Load-failure screen (FR-051)

- **Decision**:
  - `index.html` gets a hidden `#kc-boot-fail` panel, written in plain HTML: Kudi
    (`assets/brand/kudi-wave.webp`, with the PNG fallback), one short line, and a large
    "Tap to try again" button with the replay icon.
  - A tiny inline script, the only inline script, runs before the others:
    - it defines `kcBootFail()`, which shows the panel and hides the phone UI;
    - every `<script src>` gets `onerror="kcBootFail()"`;
    - on `DOMContentLoaded` it checks that `KC.start`, `KC.data`, `KC.regions`, `KC.screens` and
      `KC.audioManifest` exist, then calls `KC.start()` inside `try/catch`;
    - any of these failing calls `kcBootFail()`.
  - The button calls `location.reload()`. Nothing reloads without a tap, so there's no loop.
  - The service worker never caches a failed response, so a reload can recover.
- **Words**: built into the panel, not the strings file, because the strings file may be what
  failed (spec exception, Constitution VI). The panel is tap-only and pre-reader friendly: a big
  icon button.
- **Test**: Playwright `page.route` aborts one of `screens.js`, `data/mock-data.js` or
  `data/regions.js`. The panel is visible, no uncaught error reaches the page, and the button is
  ≥ 64 px. The route is then restored and the button tapped: the app starts. The E1 journey still
  asserts 0 console errors and 0 failed requests.
- **Alternatives**: `window.onerror` alone, rejected because it misses a 404 on a classic script
  (no exception is thrown, `KC.screens` is just missing). A service-worker offline page,
  rejected because it doesn't cover `file://` or a bad deploy.

