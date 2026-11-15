---

description: "Task list for 002: KudiCubs UX design system & clickable prototype"
---

# Tasks: KudiCubs UX Design System & Clickable Prototype

**Input**: Design documents from `specs/002-ux-prototype/`:

- [plan.md](./plan.md)
- [spec.md](./spec.md)
- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)

**Prerequisites**: plan.md and spec.md are required.

**Tests**: The spec has no TDD request, so there are no test-first tasks. Its **success criteria
must be verified by machine** (plan, research D12), so verification tools are included as normal
tasks inside the story they prove.

**Organization**: Tasks are grouped by user story, so each story can be built and checked on its
own.

**Global rules for every task** (from the constitution and the spec):

- No app code. Touch only `docs/design/`, `prototype/` and `tools/design/`.
- **No raw colours, sizes or radii** in prototype CSS. Use only `var(--kc-*)` from the generated
  `prototype/assets/tokens.css` (FR-024).
- **No network requests** beyond the prototype's own files. No CDNs, analytics or trackers
  (FR-012).
- **No failure, "wrong", red-cross or buzzer states** on any child screen (FR-016, Constitution
  III). Never use `data-failure`.
- All art is **original** (FR-025). Use the name "KudiCubs" everywhere, never "BizKids" (FR-027).
- Use **classic `<script>` files** (no ES modules) and no `fetch()` of local files, so
  `file://` works (research D1).
- Every child screen shows **exactly one main action at a time**: one `data-primary` button, or
  one `data-primary-group` of equal choices or activity targets while a choice or activity is in
  progress (FR-013 as clarified). It also follows the DOM hooks in
  [contracts/screen-flow.md §3](./contracts/screen-flow.md).
- Commits are authored by the developer. There is one PR for the feature.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on unfinished tasks)
- **[Story]**: US1–US5 from spec.md

---

## Phase 1: Setup (shared infrastructure)

**Purpose**: Create the folders, dev tooling and font assets.

- [X] T001 Create the folder layout from plan.md "Deliverables": `docs/design/`, `prototype/assets/{data,art/kudi,art/avatars,art/coins/gh,art/coins/ng,art/coins/uk,art/scenes,art/icons,fonts}`, `tools/design/tests/`. Add `.gitkeep` files where needed.
- [X] T002 [P] Create `tools/design/package.json`:
  - `"private": true`, `"type": "module"`, `"engines": {"node": ">=20"}`
  - devDependencies `@playwright/test` and `ajv` (pinned exact versions)
  - scripts `tokens` (`node build-tokens.mjs`), `contrast` (`node check-contrast.mjs`), `usage` (`node check-tokens-usage.mjs`), `test` (`playwright test`), `check` (all four in order)

  Then run `npm install` to create `tools/design/package-lock.json`.
- [X] T003 [P] Add the OFL fonts in `prototype/assets/fonts/`:
  - `Baloo2-SemiBold.woff2`, `Baloo2-ExtraBold.woff2`, `Nunito-Regular.woff2`, `Nunito-Bold.woff2`, `Nunito-ExtraBold.woff2`
  - Download them from the official upstream repositories (google/fonts or the projects' own releases). Keep the Latin subset only.
  - Add `OFL.txt` with both fonts' copyright lines (research D5).
- [X] T004 [P] Add `.gitignore` entries for `tools/design/node_modules/`, `tools/design/test-results/`, `tools/design/playwright-report/` and `prototype-*.zip` in the repository root `.gitignore`.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Tokens, the app shell, state, narration, idle hints, mock data and core art that
**every** story needs.

**⚠️ No user-story work starts until this phase is done.**

- [X] T005 Create `docs/design/tokens.json` (version `"0.1.0"`). It must validate against `specs/002-ux-prototype/contracts/tokens.schema.json` and contain every group in data-model §1:
  - **Colour**: the palette from research D4 (`color.sand.50 #FFF6E8`, `sand.100 #FCE9CC`, `gold.500 #F0A830`, `gold.600 #D98A12`, `cocoa.900 #3A2315`, `cocoa.700 #6B4A33`, `terracotta.600 #B04A26`, `indigo.700 #2B3A75`, `green.700 #1F6B45`, `teal.700 #0F6670`, `hibiscus.600 #C23B5A`, `white #FFFFFF`), plus the semantic aliases `color.bg.app`, `color.text.primary`, `color.action.primary.bg/fg`, `color.feedback.positive`, `color.parent.bg`, `color.celebrate`.
  - **Typography**: the scale in research D5 (`display-xl 40`, `display-l 32`, `title 26`, `button-4-6 24`, `button 20`, `body-child 20`, `body 18`, `label 16`, `caption 14`). Families are `Baloo 2` and `Nunito`.
  - **Space**: a 4-pt scale, `space.1 = 4` … `space.12 = 48`, plus `space.16 = 64`.
  - **Radius**: `radius.sm = 8`, `md = 16`, `lg = 24`, `xl = 32`, `pill = 999`.
  - **Elevation**: `elevation.1–3`, soft warm shadows.
  - **Size**: `size.touch.min = 48`, `size.touch.primary_4_6 = 64`, `size.button.height = 64`, `size.button.height_4_6 = 76`, `size.kudi.min = 96`.
  - **Motion**: `motion.fast = 120ms`, `motion.base = 240ms`, `motion.celebrate = 1200ms`.
  - **Pairs**: every text or icon on background combination used. `minRatio` is `4.5` for normal text and `3` for large text or icons. Include the rule that **gold surfaces use cocoa text** (no white-on-gold pair).
  - **No token** may be named or described as an "error" colour for child screens.
- [X] T006 Implement `tools/design/build-tokens.mjs`:
  - Validate `docs/design/tokens.json` against `specs/002-ux-prototype/contracts/tokens.schema.json` with ajv (2020-12) and exit 1 on error.
  - Resolve `{alias}` references.
  - Write `prototype/assets/tokens.css` as `:root { --kc-<path-with-dashes>: <value>; }`, with a "GENERATED — do not edit" header, the `@font-face` rules for the T003 fonts, and typography as `--kc-type-<name>-size/-weight/-line/-family`.
  - Rewrite the token tables in `docs/design/tokens.md` between `<!-- tokens:start -->` and `<!-- tokens:end -->`, creating the file if it's missing.
  - The output must be deterministic, so running it twice produces no diff.
- [X] T007 [P] Implement `tools/design/check-contrast.mjs`:
  - Load `docs/design/tokens.json` and resolve the `pairs`.
  - Compute the WCAG 2.x contrast ratio (relative luminance formula) for each pair.
  - Print a table of fg, bg, usage, ratio and pass/fail. Exit 1 if any ratio is below its `minRatio` (SC-003).
- [X] T008 Run `node tools/design/build-tokens.mjs` to generate `prototype/assets/tokens.css`. Run `node tools/design/check-contrast.mjs` and fix `tokens.json` until every pair passes (depends on T005–T007).
- [X] T009 Create `prototype/assets/base.css`:
  - A minimal reset, and body type from tokens (`--kc-type-body-*`, Nunito) on the `--kc-color-bg-app` background.
  - **A phone frame**: full viewport below 500 px wide; above that, a centred 390 × 844 device frame with `--kc-radius-xl` and `--kc-elevation-3` (FR-008, quickstart V9).
  - A screen-root layout of header (logo and back), content, and footer/bottom nav.
  - Focus-visible rings, and `@media (prefers-reduced-motion: reduce)` turning off non-essential animation.
  - Only `var(--kc-*)` values.
- [X] T010 Create `prototype/index.html`:
  - `lang="en"`, a viewport meta with `viewport-fit=cover`, title "KudiCubs prototype".
  - Links to `assets/tokens.css`, `assets/base.css` and `assets/components.css`.
  - The phone frame markup: a `#kc-logo` button with the KudiCubs wordmark (used for the reviewer long-press), a `#kc-back` button, `#kc-screen` as the screen root, `#kc-bottom-nav`, and `#kc-reviewer` as a hidden dialog.
  - Classic `<script>` tags in this order: `data/mock-data.js`, `data/regions.js`, `app.js`, `activities.js`, `celebrate.js`, `screens.js`.
  - No external URLs at all.
- [X] T011 [P] Create `prototype/assets/data/mock-data.js`, defining `window.KC = window.KC || {}; KC.data = {…}` exactly per data-model §6:
  - `child.nickname: "Ama"` (nickname rule: "2–16 characters"), `child.avatarId: "cub-friend-2"`, `child.band: "b4_6"`.
  - `start: { coins: 120, savings: 40, xp: 260, level: { n: 2, nameKey: "level.market_helper" } }`.
  - `levels`: 5 entries with `xpFrom` 0, 150, 400, 700, 1100.
  - `badges`: 8 entries `{id, nameKey, icon, earned}`, with 3 earned and including `badge.hard_worker` and `badge.smart_sorter` unearned.
  - `walletHistory`: 6 entries `{kind, amount, category, labelKey, icon, daysAgo}` using spec 001 kinds and categories.
  - `pillars: { know: 0.3, understand: 0.2, decide: 0.1, invest: 0, share: 0.1 }`.
  - `daily: { titleKey, progress: 1, goal: 3, rewardCoins: 10 }`.
  - `lostCoins: { hidden: 8, jars: 3, firstReward: { coins: 30, xp: 40, badge: "badge.hard_worker" }, perfectSortBonus: { coins: 10, xp: 10, badge: "badge.smart_sorter" }, replay: { xp: 5 } }`.
  - A `strings` map holding every label and narration line as English text, with an `en-GH`/`en-NG`/`en-GB` override slot.
  - **No real names, emails, photos or locations.**
- [X] T012 [P] Create `prototype/assets/data/regions.js`, defining `KC.regions = { gh, ng, uk }` and `KC.defaultRegion = "gh"` per data-model §7 and research D7:
  - **gh**: `{ iso: "GHS", symbol: "GH₵", majorName: "cedi", minorName: "pesewa" }`, denominations 10p, 20p, 50p (coins), GH₵1, GH₵2 (coins), GH₵5 (note), `voiceLang: "en-GH"`.
  - **ng**: `{ "NGN", "₦", "naira", "kobo" }`, denominations 50k, ₦1, ₦2 (coins), ₦5, ₦10 (notes), `voiceLang: "en-NG"`.
  - **uk**: `{ "GBP", "£", "pound", "penny" }`, denominations 10p, 20p, 50p, £1, £2 (coins), £5 (note), `voiceLang: "en-GB"`.
  - Each denomination is `{ id, kind: "coin"|"note", label, faceValueMinor, accent }`, where `accent` is a token name.
  - `marketExamples: { treat, drink, snack }` per region, each `{ labelKey, art }` (e.g. GH treat "kelewele", NG treat "puff-puff", UK treat "biscuit").
- [X] T013 Implement the core of `prototype/assets/app.js`, under a `KC` namespace:
  - **Router**: a hash router (`#/{screen-id}`) that calls `KC.screens[id].render(root)`. It sets `data-screen`, `data-audience` and `data-band` on `#kc-screen`, and updates the back button and bottom-nav visibility. Bottom nav shows only on `home`, `wallet` and `progress` (screen-flow §1).
  - **State**: `KC.state` is initialised from `KC.data.start` (coins, savings, xp, badges, level, `lostCoins: { found: 0, sortedCorrectFirstTry: true, choice: null, completedOnce: false }`). Only `region`, `sound` and `screen` persist in `sessionStorage` (research D11). Nothing goes in `localStorage`.
  - **Helpers**:
    - `KC.money(amount)` renders in-game coins as the active region's **coin picture plus a number**, wrapped in `<span data-money data-region="{region}">`. It **never** outputs a currency symbol (spec 001 `coinDisplay: coin_icon_amount`; 4–6 always uses coin pictures).
    - `KC.currencyLabel()` returns the currency name and symbol (e.g. "Ghana cedis · GH₵") for labels and narration only.
    - `KC.t(key)` looks up strings.
  - **Level**: `KC.levelFor(xp)`, computed from `KC.data.levels`.
- [X] T014 Add narration to `prototype/assets/app.js`:
  - `KC.say(key)` uses `speechSynthesis`, picking a voice whose `lang` matches the region's `voiceLang`, with any `en-*` as the fallback. It's unlocked on the first user gesture and respects `KC.state.sound` (research D8).
  - `KC.speakerCue(key)` returns a `data-component="speaker-cue"` button with `data-narration="{key}"`. Tapping it replays the line, and it animates while speaking. If no voice is available it still animates, and a caption is shown only when the reviewer notes are on.
- [X] T015 Add the idle-hint engine to `prototype/assets/app.js`:
  - On each child screen, a timer starts at **6 s**, then **12 s** and **20 s** (band rules `b4_6`). Any pointer or key input resets it.
  - Level 1: `#kc-screen` gets `data-hint-active`, the current `[data-primary]` or `[data-primary-group]` gets the `hint` state (the documented `gentle-hint` state: a pulsing ring), and Kudi switches to `point`.
  - Level 2: the prompt is narrated again.
  - Level 3: a stronger pulse plus the narration again.
  - All timers are cleared when the route changes (FR-013, research D9).
- [X] T016 [P] Draw the 7 original Kudi the Cub SVG poses in `prototype/assets/art/kudi/`: `welcome.svg`, `explain.svg`, `point.svg`, `think.svg`, `cheer.svg`, `gentle.svg`, `idle.svg`.
  - The character is a lion cub with a round head, a short spiky golden mane (`#F0A830` / `#D98A12`), big warm eyes and a small head tuft (research D6). The same proportions are used in every pose.
  - Each file has a `viewBox`, a `<title>` such as "Kudi the Cub — cheering", and no embedded raster images or external references.
  - **No sad, angry or disappointed pose** (data-model §3).
- [X] T017 [P] Draw the original UI icons in `prototype/assets/art/icons/`: `home.svg`, `wallet-jar.svg`, `path.svg`, `speaker.svg`, `back.svg`, `lock.svg`, `sun-daily.svg`, `piggy.svg`, `treat-sticker.svg`, plus 8 badge icons (`badge-hard-worker.svg`, `badge-smart-sorter.svg`, `badge-smart-saver.svg`, and 5 others). All use a single stroke style and token colours.
- [X] T018 Create the foundation of `prototype/assets/components.css`: the shared components every screen needs, each styled by `[data-component="…"]` and using only `var(--kc-*)`:
  - `primary-button`: gold background with cocoa text; height `--kc-size-button-height-4-6` on `[data-band=b4_6]`; states default, pressed, disabled, hint (pulse).
  - `secondary-button`, `icon-button` (minimum `--kc-size-touch-min`), `speaker-cue`, `kudi-bubble` (Kudi image plus speech bubble; Kudi at least `--kc-size-kudi-min`), `progress-dots`.
  - `illustration`: a wrapper for every scene image and every Kudi image shown without a speech bubble (decorative ones get `aria-hidden="true"`).
  - The `hint` state (the `gentle-hint` component in FR-004): a pulsing ring applied to `[data-primary]` or `[data-primary-group]`.
- [X] T019 Create the screen registry skeleton in `prototype/assets/screens.js`. `KC.screens` holds an entry for every id in [contracts/screen-flow.md §1](./contracts/screen-flow.md) (`welcome`, `age-select`, `avatar`, `parent-gate`, `home`, `mission-intro`, `activity-find`, `activity-sort`, `activity-count`, `decision`, `result-save`, `result-spend`, `summary`, `reward`, `wallet`, `progress`).
  - Each entry is `{ id, title, audience, band, primary, next, narration, components, notes, render }`, following data-model §5.
  - At this stage each `render` is a placeholder that shows the title and one `data-primary` "Next" button going to `next`, so the full route chain works end to end.

**Checkpoint**: open `prototype/index.html` from disk. Every route is reachable through placeholder
"Next" buttons, tokens load, and narration and idle hints work on the placeholders.

---

## Phase 3: User Story 1: The client clicks through the whole 4–6 journey on a phone (P1) 🎯 MVP

**Goal**: real, polished screens for the whole journey, Welcome → … → Reward → Wallet / Progress,
using The Lost Coins with made-up data.

**Independent test**: someone new reaches Reward, Wallet and Progress from Welcome using only
taps, with no dead ends (spec US1). Automated by T040.

- [X] T020 [P] [US1] Draw 4 original avatar SVGs in `prototype/assets/art/avatars/` (`cub-friend-1.svg` … `cub-friend-4.svg`): friendly animal friends that are different from Kudi and from each other (for example a hare, a tortoise, a guinea fowl and a young elephant), with warm token colours.
- [X] T021 [P] [US1] Draw the scene art in `prototype/assets/art/scenes/`:
  - `market-park.svg`: a market-day park with stalls, awnings in terracotta and gold, and an original woven-strip pattern band. It has 8 named hiding-spot groups (`#spot-1` … `#spot-8`) for the find activity.
  - `stall.svg`: a Mission Intro backdrop.
  - `jars.svg`: 3 clear jars with lids.
- [X] T022 [P] [US1] Draw the Ghana coin and note tokens in `prototype/assets/art/coins/gh/` (`p10.svg`, `p20.svg`, `p50.svg`, `ghs1.svg`, `ghs2.svg`, `ghs5-note.svg`).
  - These are **stylised tokens, not replicas of real currency** (research D7). Each shows the denomination text, the symbol, and a distinct size and colour so 4–6 year olds can tell them apart.
- [X] T023 [US1] Implement `welcome` in `prototype/assets/screens.js`:
  - Kudi `welcome` pose, large; the "KudiCubs" wordmark; the line "Join the Pride!" with a speaker cue.
  - One `data-primary` "Let's Go" button (76 px, gold). Tapping it unlocks audio and goes to `age-select` (US1-1).
- [X] T024 [US1] Implement `age-select` in `prototype/assets/screens.js`:
  - 4 large picture cards: 4–6 (active), and 7–9, 10–12, 13–15 shown greyed with a lock icon and "Coming soon" (spec 001 FR-015b). Locked cards are not selectable and give a gentle wiggle when tapped.
  - The band cards form the `data-primary-group`. Choosing 4–6 replaces the group's main-action role with a single `data-primary` "Next" button. Narrated.
- [X] T025 [US1] Implement `avatar` in `prototype/assets/screens.js`:
  - Pick 1 of 4 avatars (T020) from a carousel or grid of `choice-card`s.
  - A nickname chosen from suggestion chips: "Ama" (default), "Kofi", "Zara", "Tobi". There is no free-text field in the prototype, and the nickname rule is "2–16 characters".
  - One `data-primary` "That's me!" button, which saves the choice into `KC.state` and goes to `parent-gate`.
- [X] T026 [US1] Implement `parent-gate` in `prototype/assets/screens.js`, with `data-audience="parent"` and the indigo `color.parent.bg` style. Its steps:
  1. **Hold** a button for 3 s with a ring progress; letting go early resets it gently.
  2. **Maths**: a random "seven times eight"-style question, shown and spoken in words, answered on a `parent-gate-pad` number pad. A wrong answer gives a calm reset with a new question.
  3. **PIN**: a 4-digit `pin-pad`; `0000`, `1234` and repeated digits get a gentle "choose a harder PIN".
  4. **Region**: Ghana, Nigeria or UK, preselected from `KC.state.region`.
  5. **Email**: an input with format validation only.
  6. "Join the Pride" as `data-primary`, leading to a brief "You joined the Pride!" moment with Kudi `cheer`, then `home`.

  **The email and PIN values are never stored, logged or sent** (FR-012, FR-017, research D11). Add a reviewer note: "Prototype only, nothing is saved or sent".
- [X] T027 [US1] Add the Home components to `prototype/assets/components.css`: `coin-counter` (coin icon plus `data-money` amount), `xp-bar`, `level-badge`, `streak-daily` (the "market day" sun, **with no penalty or "streak lost" state**, FR-018), `badge-tile` (earned and locked states), `bottom-nav` (3 icon tabs with narrated labels, minimum 64 px).
- [X] T028 [US1] Implement `home` in `prototype/assets/screens.js`:
  - Avatar plus nickname, `xp-bar` toward the next level, `coin-counter`, `level-badge` with the level name.
  - A large `data-primary` "Continue" button showing The Lost Coins card; the `streak-daily` card with progress 1/3 and a reward; a badge preview of the last 3 earned.
  - Kudi `explain` beside Continue. Bottom nav visible. All values come from `KC.state` (FR-018).
- [X] T029 [US1] Implement `mission-intro` in `prototype/assets/screens.js`:
  - The `stall.svg` backdrop, Kudi `explain` with a `kudi-bubble` "Oh no! Coins are lost in the market. Let's find them!", a speaker cue (autoplay), and a goal icon showing 8 coins.
  - One `data-primary` "Start" button (FR-010).
- [X] T030 [US1] Add the activity components to `prototype/assets/components.css`: `coin-token` (a coin or note image with its label; states default, picked, placed, `gentle` bounce, hint glow), `jar` (states default, `hint` glow, filled with a stacked-coin fill level), and the `progress-dots` style for "coins left to find".
- [X] T031 [US1] Implement the find activity in `prototype/assets/activities.js` and register `activity-find` in `prototype/assets/screens.js`:
  - Render `market-park.svg` and place 8 `coin-token`s from the active region's coin denominations at `#spot-1…8`.
  - Each tap pops the coin with a sparkle, a soft sound and Kudi `cheer` for a moment. `KC.state.lostCoins.found` goes up, and the progress dots update.
  - While searching, the hidden coins' container is the `data-primary-group`. When all 8 are found, a single `data-primary` "Next" replaces it. **No timer** (FR-011).
- [X] T032 [US1] Implement the sort activity in `prototype/assets/activities.js` and register `activity-sort`:
  - Show 3 `jar`s, each labelled with a big picture of one denomination from the found coins; the 8 found coins sit in a tray.
  - Moving coins works by **drag** (Pointer Events, snapping on drop) **or tap-coin-then-tap-jar**.
  - **Correct jar**: the coin drops in and the fill rises.
  - **Wrong jar**: the coin bounces back with a soft "boing", Kudi switches to `gentle`, and a narrated hint plays ("Hmm, let's find this coin's jar!"). `sortedCorrectFirstTry = false`. After **2 wrong tries for the same coin**, the right jar glows.
  - **No red, no X, no buzzer, no `data-failure`** (FR-011, FR-016).
  - While sorting, the coin tray is the `data-primary-group`. When all coins are placed, a single `data-primary` "Next" replaces it.
- [X] T033 [US1] Implement the count activity in `prototype/assets/activities.js` and register `activity-count`:
  - The coins in the current jar are the `data-primary-group`. Tapping each coin counts it: a big numeral (Baloo 2, `display-xl`) ticks up and the number is spoken.
  - When a jar is done, show **how many coins** it holds, as a numeral from 1 to 8 next to the jar's coin picture. **Do not show a money total or add up face values**, because 4–6 numbers are limited to "count to 20" (data-model §4).
  - When all jars are done, run `KC.state.coins += found` (earn) and show a single `data-primary` "Next" (data-model §8).
- [X] T034 [US1] Implement `decision` in `prototype/assets/screens.js`:
  - A Kudi `think` prompt "What will you do with your coins?" with a speaker cue.
  - A short, skippable narrated explainer: "Saving keeps coins for later. Spending gets something now."
  - Two equally prominent `choice-card`s inside one `data-primary-group`: **Save it** (piggy/jar icon) and **Spend it** (treat-sticker icon, using the region's `marketExamples.treat`).
  - Selecting a card highlights it, removes the group's main-action role, and shows one `data-primary` "OK", leading to `result-save` or `result-spend`.
  - Add the `choice-card` component (states default, selected, hint; at least 64 px) to `prototype/assets/components.css`.
- [X] T035 [US1] Implement `result-save` and `result-spend` in `prototype/assets/screens.js` (US1-4):
  - **Save**: coins fly from the counter into the piggy/jar (CSS animation; reduced-motion just fades). Run `savings += found; coins -= found`. Kudi `cheer`: "Great saving! Your coins are safe for later."
  - **Spend**: a sticker treat is unwrapped. Run `coins -= found` and add the sticker to the state. Kudi `cheer`: "Yum! Spending gets you something now."
  - Both use `action-result` styling and positive tone only, with one `data-primary` "Next".
  - Add the `action-result` component to `prototype/assets/components.css`.
- [X] T036 [US1] Implement `summary` in `prototype/assets/screens.js`:
  - A celebratory recap: one picture-and-number tile each for coins found, sorted and counted, plus the choice made (save or spend icon), each narrated.
  - "What went well" lines only. **No right/wrong wording.** One `data-primary` "Next" (FR-016).
- [X] T037 [US1] Implement `prototype/assets/celebrate.js` and `reward` in `prototype/assets/screens.js`:
  - `KC.celebrate(root)` runs a coins-and-confetti burst for `motion.celebrate`, in token colours (gold, terracotta, hibiscus, green). It's skipped under `prefers-reduced-motion`.
  - The **Reward** screen shows Kudi `cheer`, and +coins, +XP and the badge earned as `badge-tile`s:
    - **First run**: `firstReward` (30 coins, 40 XP, `badge.hard_worker`), plus `perfectSortBonus` (10 coins, 10 XP, `badge.smart_sorter`) if `sortedCorrectFirstTry`.
    - **Replay** (`completedOnce`): only `replay.xp` (5 XP), with no badges. This shows the replay rule.
  - If an XP threshold is crossed, show a "Level Up" banner with the new level name.
  - Set `completedOnce = true`. One `data-primary` "Back to Home" goes to `home` with updated values (FR-019, US1-5).
  - Add `celebration-overlay` to `prototype/assets/components.css`.
- [X] T038 [US1] Implement `wallet` in `prototype/assets/screens.js`, and add the `bar-chart` component to `prototype/assets/components.css`:
  - A big `coin-counter` balance and a savings jar showing `savings`.
  - A picture-based history list from `KC.data.walletHistory` plus this session's events (icon, amount via `KC.money`, and "today" / "2 days ago" text).
  - A simple bar chart "Where your coins came from / went" grouped by category, using only CSS bars with token colours and numeric labels.
  - Bottom nav, and one `data-primary` "Back to Home" (FR-020).
- [X] T039 [US1] Implement `progress` in `prototype/assets/screens.js`, and add `level-path-node` to `prototype/assets/components.css`:
  - A winding **market-road level path** of 5 `level-path-node`s with the current level highlighted and future ones locked (a pattern only, not a copy of any reference layout, research D13).
  - A badge grid (8 `badge-tile`s, earned and locked).
  - Five pillar bars (Know, Understand, Decide, Invest, Share) from `KC.data.pillars`, plus the gain from this session.
  - Bottom nav, and one `data-primary` "Continue" (FR-020).
- [X] T040 [US1] Add a minimal reviewer menu to `prototype/assets/app.js` and `components.css` (the `reviewer-menu` component, indigo style, `data-reviewer`; never `data-primary`):
  - Opens on a **2-second long-press on `#kc-logo`** or with `?review=1`.
  - Controls: Jump to (every screen id), Sound on/off, Show screen notes, Restart prototype (reset `KC.state` to `KC.data.start`), and the version `prototype 0.1.0 · tokens 0.1.0`.
  - When notes are on, untouched elements show "Not in this prototype" (research D10, US1-7).
- [X] T041 [US1] Wire the back control in `prototype/assets/app.js`: `#kc-back` appears on every screen except `welcome` and goes to the previous route (going back from a result returns to `decision`). It's styled as a small `icon-button`, never `data-primary` (contract §1).
- [X] T042 [US1] Create `tools/design/playwright.config.mjs`:
  - Viewport 390 × 844, `hasTouch: true`, `isMobile: true`; projects `chromium` and `webkit`.
  - The base URL is `file://` + the absolute path to `prototype/index.html`.
  - Retries 0; reporter `list`.
- [X] T043 [US1] Implement `tools/design/tests/flow.spec.mjs`, covering assertions 1, 2, 3, 4, 5, 7 and 8 of [contracts/screen-flow.md §4](./contracts/screen-flow.md):
  - Walk welcome → progress tapping only `[data-primary]` plus the required choices (band 4–6, an avatar, the gate steps with the maths answer read from the DOM, all find/sort/count interactions, Save). **All 13 screens are visited.**
  - At every step of every child screen, exactly 1 visible `[data-primary]` **or** `[data-primary-group]` (assertion 2). No `[data-failure]` ever.
  - Sort coins with the **tap-coin-then-tap-jar** path (dragging is checked by hand).
  - No visible text matches `/bizkid/i` (assertion 9, FR-027).
  - Interactive elements are at least 48 × 48, and child primaries at least 64 × 64.
  - `data-hint-active` is set after 6.5 s idle on `home`.
  - **No request leaves the origin** (`page.on('request')` allows only `file:` URLs).
  - The Spend path also reaches `reward`, and the second run awards only 5 XP.

**Checkpoint**: run `cd tools/design && npx playwright test`; it passes. Quickstart V1–V4 and V6
pass by hand on a phone, using `npx serve prototype`.

---

## Phase 4: User Story 2: designers and developers get one design system to build from (P1)

**Goal**: documented tokens and components that the prototype provably follows.

**Independent test**: audit 3 random screens. Every style traces to a token and every element to a
listed component (SC-005).

- [X] T044 [P] [US2] Write the hand-written parts of `docs/design/tokens.md` (outside the generated markers):
  - The principles: warm market palette, gold uses cocoa text, no error colour on child screens, a 4-pt spacing scale, 48/64/76 px touch sizes.
  - **When to use and when not to use** each colour family, the type pairing rationale (Baloo 2 + Nunito, OFL), and how the tokens will later map to Flutter `ThemeData` (spec 001).
  - Re-run `node tools/design/build-tokens.mjs` to refresh the tables.
- [X] T045 [P] [US2] Write `docs/design/components.md`, with one section for each of the **25 components** in spec FR-004:
  - `primary-button`, `secondary-button`, `icon-button`, `choice-card`, `speaker-cue`, `kudi-bubble`, `illustration`, `coin-counter`, `xp-bar`, `level-badge`, `streak-daily`, `badge-tile`, `jar`, `coin-token`, `progress-dots`, `bottom-nav`, `region-coin-set`, `parent-gate-pad`, `pin-pad`, `action-result`, `bar-chart`, `level-path-node`, `celebration-overlay`, `gentle-hint`, `reviewer-menu`.
  - Document `gentle-hint` as a **state** (the pulsing ring applied to the main action), not a separate element.
  - Add a section "**One main action at a time**" that defines `data-primary` and `data-primary-group`, so Constitution I is met literally on choice and activity screens.
  - Each section has: purpose (one sentence), states, minimum touch size (≥ 48; 4–6 primaries ≥ 64), tokens used, the screen ids that use it, and band notes for 4–6, 7–9, 10–12 and 13–15 (data-model §2).
  - Add a static thumbnail of each, taken from the prototype, as `docs/design/img/components/{id}.png` (captured in T047).
- [X] T046 [US2] Implement `tools/design/check-tokens-usage.mjs`:
  - Scan `prototype/assets/base.css` and `components.css` (**not** the generated `tokens.css`) plus inline `style=` attributes in `screens.js` and `activities.js`.
  - Fail on hex or rgb colours, on `px` `font-size`, `border-radius`, `padding`, `margin` and `gap` values not written as `var(--kc-…)`, and on `font-family` declarations other than `var(--kc-…)`.
  - Allow `0`, `1px` hairlines, `%`, and `vw`/`vh`. Print the file and line for each violation (SC-005, FR-024).
  - Also fail if any file in `prototype/` or `docs/design/` contains `BizKid` (case-insensitive; FR-027). `docs/design/design-references.md` may mention the old name only inside a clearly marked "former name" note.
- [X] T047 [US2] Add a component-traceability check to `tools/design/tests/flow.spec.mjs`. On every visited screen:
  - Every visible `button`, `[role=button]`, `img` and `svg` sits inside an element with `data-component`.
  - Every `data-component` value is one of the 25 ids in `docs/design/components.md` (`gentle-hint` is checked as the `hint` state, not as an element).
  - Also write `tools/design/tests/capture-components.spec.mjs`, which saves one screenshot per component id to `docs/design/img/components/{id}.png`. It is run on demand, not part of `npm run check`.
- [X] T048 [US2] Write `docs/design/README.md` as the index of the design system. It covers:
  - What each file is for, with links to `tokens.md`, `components.md`, `kudi-the-cub.md`, `age-band-rules.md`, `design-references.md`, `review-guide.md` and `diagrams.md`.
  - How to change a token (edit `tokens.json`, then `npm run check` in `tools/design`).
  - The token version (`0.1.0`; `1.0.0` at client sign-off).
  - The rule that `prototype/` is throwaway while `docs/design/` is durable.

**Checkpoint**: `npm run check` in `tools/design` passes: tokens, contrast, usage and flow with
traceability.

---

## Phase 5: User Story 3: everyone uses Kudi and the age bands consistently (P2)

**Goal**: Kudi usage rules and the per-band UI rules, consistent with spec 001.

**Independent test**: a reviewer uses only these documents to resolve 5 sample situations, and the
answers match the prototype and spec 001 (spec US3).

- [X] T049 [P] [US3] Write `docs/design/kudi-the-cub.md`:
  - **Character**: a lion cub, warm, encouraging and curious; the guide who brings children into "the Pride".
  - **Visual spec**: proportions, mane colours from tokens, line weight, minimum size `size.kudi.min` (96).
  - **The 7 poses** with an embedded image of each (`../../prototype/assets/art/kudi/*.svg`) and when each is used (the data-model §3 table).
  - **Voice and line rules**: at most 10 words for 4–6, positive, second person, never scolding; 10 example lines.
  - **Placement**: one Kudi per screen, facing the main action, not covering it.
  - **Never-do list**: never scolds, never sad or angry or disappointed, never pressures spending, never sells in the parent area, never appears in the reviewer or parent gate except the "joined" moment (FR-005, US3-2).
  - **Idle behaviour** at 6, 12 and 20 s.
- [X] T050 [P] [US3] Write `docs/design/age-band-rules.md`:
  - The full band table from data-model §4: text per prompt, choices, button height, body size, failure handling, timers, number ranges, narration, first idle hint, feedback style, Kudi presence for 4–6, 7–9, 10–12 and 13–15. **The values must match spec 001 FR-028–FR-031 and plan 001 research R9**, with links to them.
  - One annotated example per band of the same Decision screen at rising complexity (4–6 shown in the prototype; 7–15 as described wireframe sketches in text).
  - Tablet layout guidance (spec Assumptions: described, not prototyped).
- [X] T051 [US3] Add a "Five sample situations" section to `docs/design/age-band-rules.md`, worked from the rules alone:
  1. A 4–6 child drops a coin in the wrong jar.
  2. A 4–6 child is idle for 15 s on Decision.
  3. A 7–9 round ends at a loss.
  4. A 10–12 child is choosing equity or debt.
  5. A 13–15 "Temptation Alert" appears.

  For each, give what Kudi does and what the screen shows. Situations 1 and 2 must match the prototype's behaviour (T032, T015) (US3 independent test).

**Checkpoint**: a reviewer resolves the 5 situations from the documents alone, and the answers
match.

---

## Phase 6: User Story 4: the client sees coins and examples change by country (P2)

**Goal**: switching region between Ghana, Nigeria and the UK changes the currency presentation
everywhere, with the counts unchanged.

**Independent test**: switch the region 3 times. The Lost Coins, Wallet and Home show the right
currency, and the counts are unchanged (SC-006).

- [X] T052 [P] [US4] Draw the Nigeria tokens in `prototype/assets/art/coins/ng/` (`k50.svg`, `ngn1.svg`, `ngn2.svg`, `ngn5-note.svg`, `ngn10-note.svg`), in the same stylised, non-replica style as T022 (research D7).
- [X] T053 [P] [US4] Draw the UK tokens in `prototype/assets/art/coins/uk/` (`p10.svg`, `p20.svg`, `p50.svg`, `gbp1.svg`, `gbp2.svg`, `gbp5-note.svg`), in the same stylised, non-replica style.
- [X] T054 [US4] Add a **Region** control (Ghana · Nigeria · UK) to the reviewer menu in `prototype/assets/app.js`:
  - It sets `KC.state.region`, persists it in `sessionStorage`, and re-renders the current screen.
  - Every money display goes through `KC.money` (`data-money` and `data-region`, coin picture plus number, **no currency symbol**). Every coin image is resolved from `KC.regions[region].denominations` and carries `data-region`. The currency name and symbol appear only through `KC.currencyLabel()` in labels and narration.
  - **Coin counts in `KC.state` never change** on a switch (FR-022, data-model §7).
  - The find, sort and count activities use the active region's coins. The Decision's treat label uses `marketExamples.treat`.
  - Narration voice lang follows `voiceLang`.
- [X] T055 [US4] Add the `region-coin-set` component to `prototype/assets/components.css` (it shows a region's set side by side in the reviewer menu), and document it in `docs/design/components.md`.
- [X] T056 [US4] Add assertion 6 of [contracts/screen-flow.md §4](./contracts/screen-flow.md) to `tools/design/tests/flow.spec.mjs`. For each of `gh`, `ng` and `uk`:
  - Switch the region through the reviewer menu.
  - Visit `home`, `activity-find`, `activity-count`, `wallet` and `reward`.
  - Assert that every `[data-money]` and coin image has `data-region` equal to the region, that **no** `[data-money]` contains a currency symbol, that the numbers match the previous region's, and that the reviewer menu's currency label shows `GH₵`, `₦` or `£`.

**Checkpoint**: quickstart V5 passes, and the flow test with assertion 6 passes.

---

## Phase 7: User Story 5: a few young children try it without reading (P3, optional)

**Goal**: a safe, repeatable way to watch 4–6 year olds use the prototype.

**Independent test**: 3 or more children reach Reward from Home, and hesitations over 10 s are
recorded (SC-009).

- [X] T057 [P] [US5] Write `docs/design/child-session-protocol.md`:
  - **Consent first**: a parent permission script and consent checklist, with no recording of faces or voices unless the parent separately agrees, and no personal data written down beyond first name or initials and age.
  - Setup: a phone with the sound on, the prototype served or opened from the link, the reviewer menu used to restart before each child.
  - **The facilitator must not read text aloud or point.** Start at Home.
  - An observation sheet: per screen, whether there was hesitation over 10 s, where the child tapped first, gentle feedback seen, and whether Reward was reached.
  - Stop rules if the child is upset or bored. Thank the child with a printed sticker, not a gift of money.
- [X] T058 [US5] Create `docs/design/child-session-results.md`: a results template with a table (child code, age, reached Reward Y/N, hesitations over 10 s by screen, notes), and a summary formula for SC-009 (≥ 3 of 4 reach Reward, 0 failure states seen).

**Checkpoint**: the protocol is ready to run, or is explicitly skipped for client sign-off.

---

## Phase 8: Polish & cross-cutting concerns

**Purpose**: originality, the client package, offline use, size, and delivery.

- [X] T059 [P] Write `docs/design/design-references.md`:
  - The D13 table: the patterns adopted from Duolingo (level path, daily indicator, big single-action buttons, celebration), Khan Academy Kids and Toca Boca (pre-reader navigation, gentle feedback).
  - **How KudiCubs differs** in character, colour and layout.
  - An **Originality review record**: date, reviewer, method (side-by-side comparison done privately; **no screenshots of other apps are committed**), and the result for mascot, palette, layouts, icons and sounds, with an explicit "0 copied assets" statement (SC-007, FR-025).
- [X] T060 [P] Write `docs/design/review-guide.md` for Jefferson, in plain, non-technical language:
  - How to open the link on his phone (and "Add to Home Screen").
  - The suggested click path (Welcome → … → Reward → Wallet → Progress, about 5 minutes).
  - How to open the reviewer menu (hold the logo 2 s) to switch Ghana, Nigeria or UK.
  - **What is placeholder**: the art direction is real but the drawings are draft; the narration is the phone's own robot voice, so judge *when* Kudi speaks, not the voice.
  - **Questions we need answered**: look and feel, Kudi the Cub, colours, flow, coins, anything missing.
  - How to send feedback: a WhatsApp voice note or text is fine (FR-028, SC-008).
- [X] T061 [P] Create `prototype/manifest.webmanifest` (name "KudiCubs prototype", `display: standalone`, `theme_color` and `background_color` from `color.gold.500` and `color.sand.50`, an icon made from the Kudi `welcome` pose exported to `prototype/assets/art/kudi/icon-192.png` and `icon-512.png`).
  - Create `prototype/sw.js`: a cache-first service worker precaching every prototype file, versioned `kc-proto-0.1.0`. Register it from `prototype/assets/app.js` **only when `location.protocol` starts with `http`** (FR-023, research D2).
- [X] T062 Run a size and performance pass on `prototype/` and record the results in `docs/design/README.md`:
  - Total size of `prototype/` must be ≤ 3 MB (`du -sh prototype`).
  - Minify the SVGs (remove editor metadata).
  - Confirm tap feedback appears within 100 ms and animations stay smooth on a mid-range phone with `npx serve prototype` (SC-010).
  - Record the results in `docs/design/README.md`.
- [X] T063 Do an accessibility pass across `prototype/assets/screens.js` and `components.css`:
  - Every icon-only button has an `aria-label`; images have `alt` or are `aria-hidden` with a labelled parent; focus order is logical; the gate pads work with a keyboard; reduced motion is respected.
  - Re-run `npm run check` in `tools/design`.
- [ ] T064 Run every quickstart scenario V1–V11 from `specs/002-ux-prototype/quickstart.md` on a real phone (iOS Safari and Android Chrome, if available) and on a laptop. Fix any failures, and record pass/fail with the date in `docs/design/README.md` under "Validation".
- [X] T065 Package the laptop fallback: `cd prototype && zip -r ../prototype-v0.1.0.zip .`. Check that it opens from an unzipped folder by double-clicking `index.html`. **Do not commit the zip** (it is ignored by T004).
- [ ] T066 Commit `docs/design/`, `prototype/` and `tools/design/` as the developer (git author Emmanuel Mtera, no AI co-author trailer), push `002-ux-prototype`, and open the PR "002: UX design system & clickable prototype (prototype v0.1.0)" against `001-kudicubs-mvp` or `main`, whichever has merged by then. **Ask the developer before pushing or opening the PR.**
- [ ] T067 **Confirm-first, outward-facing.** After the PR is reviewed and the developer explicitly approves, deploy with `npx wrangler pages deploy prototype --project-name kudicubs-prototype --branch main`. The developer runs `wrangler login` first. Record the URL in `docs/design/review-guide.md`, then send Jefferson the link and the review guide only with the developer's go-ahead (research D2, flag P1).

---

## Dependencies & execution order

### Phase dependencies

| Phase | Depends on |
|---|---|
| Setup (T001–T004) | Nothing |
| Foundational (T005–T019) | Setup. **Blocks every story.** Inside it: T005 → T006 → T008; T007 ∥ T006; T009, T010 → T013 → T014, T015; T019 needs T013. |
| US1 (T020–T043) | Foundational. The core of the MVP. |
| US2 (T044–T048) | Foundational. Its doc tasks (T044, T045, T048) can run alongside US1. T046 needs the CSS from US1. T047 needs `flow.spec.mjs` (T043). |
| US3 (T049–T051) | Foundational (Kudi art T016). It's otherwise independent of US1 and US2, apart from T051 checking T015 and T032. |
| US4 (T052–T056) | Foundational plus US1 screens that show money (T028, T031, T033, T038). T056 needs T043. |
| US5 (T057–T058) | Only US1 to run the session. The documents can be written any time. |
| Polish (T059–T067) | All the stories wanted for the client round. T066 → T067. |

### User story dependencies

- **US1 (P1)**: the MVP; no dependency on other stories.
- **US2 (P1)**: its documents are independent. Its usage and traceability checks build on US1's CSS and test.
- **US3 (P2)**: independent.
- **US4 (P2)**: extends US1's money screens.
- **US5 (P3)**: optional; needs US1 to exist.

### Parallel opportunities

- **Setup**: T002, T003 and T004 run together.
- **Foundational**:
  - T007 runs alongside T006.
  - T011, T012, T016 and T017 (data and art) run together while T009, T010 and T013 are being built.
- **US1**: art T020, T021 and T022 run together. The screens in `screens.js` are sequential, because they share one file.
- **US2 and US3 documents** (T044, T045, T049, T050) can run alongside US1 implementation.
- **US4**: art T052 and T053 run together.
- **Polish**: T059, T060 and T061 run together.

## Parallel example: User Story 1

```text
# After Phase 2 checkpoint, launch together:
T020 Draw 4 avatar SVGs           → prototype/assets/art/avatars/
T021 Draw scene SVGs              → prototype/assets/art/scenes/
T022 Draw Ghana coin tokens       → prototype/assets/art/coins/gh/
# Meanwhile (different files), docs from other stories:
T045 Write components.md          → docs/design/components.md
T049 Write kudi-the-cub.md        → docs/design/kudi-the-cub.md
```

## Implementation strategy

### MVP first (User Story 1)

1. Phase 1 Setup, then Phase 2 Foundational. Check: every route works with placeholders.
2. Phase 3 (US1). Check: `npx playwright test` passes, and V1–V4 and V6 pass on a phone.
3. **Stop and show internally.** This alone is enough for an internal walkthrough.

### Incremental delivery to the client

1. Add **US2** (design system documents and checks) and **US4** (regions), because the client
   review asks about coins.
2. Add **US3** (Kudi and band rules) before any content writers start.
3. Polish: originality review (T059), review guide (T060), offline use (T061), validation
   (T064), then the PR (T066). Only after review and approval: deploy and share (T067).
4. **US5** child session: optional, any time after US1.

### Task counts

| Phase | Tasks | Count |
|---|---|---|
| Setup | T001–T004 | 4 |
| Foundational | T005–T019 | 15 |
| US1 | T020–T043 | 24 |
| US2 | T044–T048 | 5 |
| US3 | T049–T051 | 3 |
| US4 | T052–T056 | 5 |
| US5 | T057–T058 | 2 |
| Polish | T059–T067 | 9 |
| **Total** | | **67** |

## Notes

- `[P]` tasks touch different files and have no unfinished dependencies.
- `prototype/assets/screens.js` and `components.css` are shared files, so tasks editing them are
  **not** marked `[P]`.
- Commit after each phase checkpoint. The constitution requires a review before every commit.
- T066 (push and PR) and T067 (deploy and send to the client) are outward-facing and **always need
  the developer's explicit go-ahead.**

## Implementation notes (2026-11-14, `/speckit-implement`)

- **Done**: T001–T063 and T065. **Open**: T064 (on-device checks V1, V3, V8 and V11 still need a real
  iPhone, an Android phone and a countersignature; everything that can be automated has passed, as
  recorded in `docs/design/README.md`), plus T066 and T067, which are confirm-first.
- **T003**: Baloo 2 and Nunito are bundled as **two variable WOFF2 files**
  (`Baloo2-Variable.woff2`, weights 600–800; `Nunito-Variable.woff2`, weights 400–800) instead of
  five static files. They are subset to Latin plus ₵ ₦ £. Same OFL licence, 65 KB in total.
- **T019**: the screen registry was built straight away with real renderers instead of placeholder
  screens. Every route has worked end to end since the start.
- **T021 and T031**: the 8 find-activity hiding spots are coordinates in `activities.js` rather
  than `#spot-n` groups in the SVG, because SVGs loaded through `<img>` can't host buttons.
- **T047**: component thumbnails come from `tools/design/capture-components.mjs`, a plain Node
  script run on demand, instead of a Playwright spec file. All 25 are captured.
- **Data**: `start.xp` is 360 instead of 260, so the first run shows the Level Up moment. This is
  updated in data-model.md.
- **Navigation**: `KC.go` renders immediately and then records the hash. This gives instant
  feedback, and fixed a race that the automated flow test found.

- **Code-review fixes (2026-11-14, before the first commit of the build)**:
  - **Replay**: a replay no longer pays coins at the count step or moves save/spend money
    (`activities.js`, `KC.applyChoice`).
  - **History**: undoing a save/spend choice only removes the current run's line, tracked by a
    run ID.
  - **Region tag**: the Summary coin image now carries `data-region`.
  - **Strings**: hard-coded visible and spoken text moved to `mock-data.js` strings.
  - **Tests**: a wallet-level regression test for replay and change of mind; it fails when the
    bug is put back. The region test now covers all 10 money screens and every coin image.
  - **Docs**: the Progress → Continue contract row now says `mission-intro`, and D11 records
    `notes` in `sessionStorage`.
  - **Deferred to `specs/003-brand-voice-interactive/spec.md`**: FR-033 to FR-046.
