# Implementation Plan: Prototype Round 2: Testing Fixes, Scratch Voice, Real Play Data, Stable Demo Link and Automated Validation

**Branch**: `004-prototype-round-2` (from `003-brand-voice-interactive` @ `594bd8c`) | **Date**:
2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification `specs/004-prototype-round-2/spec.md` (FR-001–FR-051,
SC-001–SC-014, release blocker RB-1). **Revised 2026-11-15** for the second brief (A1 measured
failures, A7, A9, D4, the pre-commit live-link check).

**Artifacts**:

- [research.md](./research.md) (R1–R17)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/):
  - `saved-progress.schema.json`
  - `navigation.md`
  - `audio-manifest.md` (2.0.0)
  - `scratch-voice-cli.md`
  - `ci-and-deploy.md`
  - `validation-suite.md`
- [quickstart.md](./quickstart.md) (Q1–Q15)

No `tasks.md` yet.

## Summary

Round 2 updates the prototype in place to **v0.3.0**, with tokens at **v0.3.0**. There is still
no production app code.

**A. Layout and navigation.**

- The action area becomes a sticky footer, and Kudi and the illustrations step down in size on
  short screens, so the main action is always in view at 360×640 and 390×844. That fixes all 7
  measured failures (Age, Avatar, Intro, Count, Summary before and after, Reward) without
  shrinking text or tap targets (research R10).
- Every interactive element on a child screen is 48×48 or larger: tap-to-hear moves from bare
  words to their row, and the coins in the jars grow (research R12).
- **Load-failure screen (A9)**: `index.html` carries a tiny inline boot guard and a hidden
  fallback panel (Kudi + "Tap to try again"). Any script `onerror`, a missing `KC.data`, or an
  exception in `KC.start()` shows it; a tap reloads (research R17).
- A route guard plus `location.replace` keep Back away from Reward, Result and the gate, and
  stop Reward granting on a refresh.
- The replay narration is decided before render. The bug is at `screens.js:428`.
- The counter is hidden while Kudi asks, captions are hidden when they repeat the bubble, the
  coins in the jars become 48×48, and the gate gains a confirm-PIN step.

**B. Scratch voice.**

- `scripts/generate-scratch-voice` (Python with inline `uv` metadata, `edge-tts` 7.3.1) writes
  MP3s for `en-NG-EzinneNeural` at −10% into a separate `audio-scratch/` folder.
- The manifest goes to 2.0.0 with a `scratch` status and per-language counts. Playback order is
  recorded, then scratch, then caption.
- Voice badges show only with notes on.
- `check-no-tts` keeps banning live synthesis and gains a `--release` gate for RB-1. A new
  `check-audio` checks that files exist, aren't empty, and last ≤ 8 s.

**C. Real play data.**

- An append-only event log in `localStorage` (schema 1) holds the profile and events; every
  number on every screen is derived from it.
- A run now **earns** the coins it finds before saving or spending them, which fixes balances
  that would otherwise go negative from zero.
- Friendly empty states; reviewer Restart and "Load sample data". Gate input is never stored.

**D. Stable link.**

- GitHub Pages through the Actions deploy on merge to `main`, with build info (version, date,
  commit) in the reviewer menu and a post-deploy smoke check.
- The live URL goes in a new repository `README.md`, the design README and the quickstart.
- **T001 checks the plan and visibility first, and stops with options if Pages isn't allowed.**

**E. Validation in CI.**

- A PR workflow runs every generator in check mode plus the Playwright suite (flow, fold,
  navigation, replay, voice, data, tap targets, runtime contrast, regions) against a local
  static server, failing on any console error or failed request.

## Technical Context

**Language/Version**:

- Prototype: HTML, CSS and ES5-style classic scripts (it must keep working from `file://`, as in
  002/003).
- Tools: Node 22 ESM.
- Scratch voice: Python ≥ 3.10 through `uv run --script`.

**Primary Dependencies**:

- Existing: `@playwright/test` 1.65.1 and `ajv` 8.20.0.
- New, script-local only: `edge-tts==7.3.1`, pinned in the script's inline metadata.
- System: `ffprobe` (from ffmpeg).
- GitHub Actions: `actions/checkout@v4`, `actions/setup-node@v4`,
  `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`.

**Storage**:

- `localStorage["kudicubs.proto.progress"]` (schema 1, device only) for progress.
- `sessionStorage` for preferences, unchanged.
- No server and no database.

**Testing**:

- Playwright on Chromium and WebKit, against `tools/design/serve.mjs` (Node built-ins only).
- Node check scripts: contrast, brand, no-TTS (plus `--release`), token usage, narration, audio,
  service worker.
- Every new rule has a test proven to fail when the rule is broken.

**Target Platform**:

- Phone browsers (iOS Safari, Android Chrome) at 360×640 and up.
- Desktop browsers show the phone frame.
- GitHub Pages hosting.

**Project Type**: a static web prototype plus a design-tools package (an existing structure).

**Performance Goals**:

- First load ≤ 1 s on a mid phone, and each screen renders in ≤ 50 ms (003 budgets).
- Deriving state from 500 events takes ≤ 5 ms.
- The live link updates ≤ 10 minutes after a merge (SC-009).

**Constraints**:

- `prototype/` stays ≤ 3 MB without audio and ≤ 8 MB with audio (003 budget). The first scratch
  batch is about 65 lines × about 20 KB, so about 1.3 MB.
- It works offline after the first load (service worker cache `kc-proto-0.3.0`).
- It works from `file://` and from a sub-path (`/Kudicubs/`).
- No network requests at runtime.

**Scale/Scope**:

- 17 screens; about 150 narration lines (142 plus about 8 new: empty states and confirm PIN).
- 3 regions.
- About 6 new or extended test specs; 2 workflows.

## Constitution Check

*GATE: checked before Phase 0 research, and again after Phase 1 design.*

| Principle | Status | How |
|---|---|---|
| I. Child-First Flow | ✅ | The main action is always visible (sticky footer, fold test). Back never dead-ends or leads to a reward; the guard redirects to Home. One main action per screen is still audited. |
| II. Learn by Doing | ✅ | Real cause and effect: every number comes from the child's own events. No new text-heavy content. |
| III. Failure Is Safe | ✅ | No failure states are added. A PIN mismatch is for grown-ups, behind the gate, with a calm retry. |
| IV. Age-Adaptive | ✅ | Only 4–6 is playable; 7–15 stay "Coming soon". The scratch rate is set for 4–6. The spec states the band handling. |
| V. Child Safety & Privacy (NON-NEGOTIABLE) | ✅ | The new device storage is justified in the spec ("Data stored about the child"). It holds only a preset nickname, avatar, band, region and fictional progress. The gate email, PIN and answers are never stored (a data test scans all storage). Nothing is sent. Scratch generation sends only the scripted line text, at build time, never at runtime. The demo link has noindex/nofollow. |
| VI. Localised by Configuration | ✅ | Coins and treats come from region config on every money screen (region test). New strings and lines are externalised (`mock-data.js` strings, `lines.json`). One recorded exception: the load-failure panel's few words are built into `index.html`, because the strings file may be what failed (spec FR-051). |
| VII. Pre-Reader Accessible | ✅ (temporary) | The scratch voice makes every Lost Coins line audible now. Captions remain the fallback. **RB-1**: a human voice is required before release, and `check-no-tts --release` is the gate. |
| Content standards: "new content MUST ship with narration audio … before release" | ✅ | New lines get scratch audio for demos and human recordings before release (RB-1). |
| Workflow: authorship, review, PR, semver | ✅ | Commits as the developer, no AI co-author lines. A two-axis review before each commit. One PR (#4) stacked on #3. Prototype and tokens 0.3.0; audio manifest 2.0.0; saved-progress schema 1.0.0. |
| Workflow: build and release through fastlane | ✅ N/A | No app build, binary or store upload: static files deployed to Pages (research R16). Fastlane applies when the 001 Flutter app ships. |

**Post-design re-check**: still passes. The design adds no data beyond the table above, no
runtime network calls and no failure states. Pages hosting depends on T001 and is stopped with
options if blocked (research R1), so no gate is bypassed.

## Project Structure

### Documentation (this feature)

```text
specs/004-prototype-round-2/
├── spec.md
├── plan.md                  # this file
├── research.md              # R1–R16
├── data-model.md
├── quickstart.md            # Q1–Q13
├── contracts/
│   ├── saved-progress.schema.json
│   ├── navigation.md
│   ├── audio-manifest.md
│   ├── scratch-voice-cli.md
│   ├── ci-and-deploy.md
│   └── validation-suite.md
├── checklists/requirements.md
└── tasks.md                 # /speckit-tasks (not yet)
```

### Source code (repository root)

```text
.github/workflows/
├── prototype-ci.yml             # NEW: PR checks (FR-040)
└── prototype-pages.yml          # NEW: deploy on merge to main + smoke (FR-034, FR-038)

scripts/
└── generate-scratch-voice       # NEW: uv inline-metadata Python, edge-tts (FR-016–FR-018)

prototype/
├── index.html                   # version 0.3.0; build-info script; inline boot guard +
│                                #   load-failure panel (FR-051)
├── sw.js                        # generated, cache kc-proto-0.3.0, includes audio-scratch files
└── assets/
    ├── app.js                   # KC.store (load/save/validate/clear), KC.derive, route guard,
    │                            #   sticky actions, caption de-dupe, voice order + badges, build info
    ├── screens.js               # derived values everywhere, empty states, confirm PIN,
    │                            #   replay decided before render, earn-then-choose economy
    ├── activities.js            # counter hidden while asking; 48×48 coins in the jars
    ├── components.css           # sticky .kc-actions, short-screen sizes, empty states
    ├── data/mock-data.js        # → no preset start; KC.sample.events; new strings
    ├── data/build-info.js       # NEW: generated (version, builtAt, commit)
    ├── data/audio-manifest.js   # generated, manifest 2.0.0
    └── audio-scratch/<lang>/*.mp3   # NEW: scratch track (temporary, RB-1)

tools/design/
├── serve.mjs                    # NEW: static server for tests and local preview
├── build-narration.mjs          # scratch scan, counts, manifest 2.0.0
├── build-sw.mjs                 # --check mode; includes scratch audio
├── build-info.mjs               # NEW: writes data/build-info.js
├── check-no-tts.mjs             # amended rule + --release (RB-1)
├── check-audio.mjs              # NEW: exists, ≥ 1 KB, ≤ 8 s (ffprobe), nothing missing or unlisted
├── playwright.config.mjs        # webServer, 360×640 and 390×844 projects
└── tests/
    ├── helpers.mjs              # NEW: audit, step, console/request guards, storage reset
    ├── flow.spec.mjs            # E1, E4, E9, confirm PIN
    ├── fold.spec.mjs            # NEW: E2
    ├── navigation.spec.mjs      # NEW: E3 + failed-script test (FR-051)
    ├── voice.spec.mjs           # NEW: E5 (runtime order + badges)
    ├── data.spec.mjs            # NEW: E6
    ├── contrast.spec.mjs        # NEW: E8 (runtime)
    └── smoke.spec.mjs           # NEW: post-deploy (SMOKE_URL)

README.md                        # NEW: what the repo is, the live demo URL, how to run checks

docs/design/
├── README.md                    # live URL, validation record, storage rule amended
├── tokens.json                  # 0.3.0 (sticky footer fade, empty-state tokens)
├── narration/lines.json         # new lines (empty states, confirm PIN, scratch badge string)
├── voice-direction-brief.md     # RB-1 + scratch track note
└── review-guide.md              # stable link, scratch voice explained
```

**Structure decision**: the existing 002/003 layout is kept. The new top-level directories are
`.github/workflows/` and `scripts/`, the latter at the path the brief asks for. All new tooling
stays in `tools/design/`.

## Flags and risks

| # | Flag | Resolution | Owner |
|---|---|---|---|
| **H1** | GitHub Pages on a private repo needs a paid plan, and the site is public by URL | T001 checks first and stops with options (research R1); the repo is never made public without consent | Developer |
| **H2** | The first deploy needs `main` to contain the prototype | PRs merge in order #1 → #2 → #3 → #4; until then the CI still runs on every PR | Developer |
| **V2** | Scratch voice is en-NG for every region, including Ghana | Recorded in the spec assumptions; the casting brief is unchanged; RB-1 | Developer |
| **V3** | The voice service's terms for this use | Internal, temporary demos only (RB-1); replaced by human recordings | Developer |
| **D1** | Pages origins are shared across the account's Pages sites | Namespaced storage key; the schema validates on load | Team |
| **H3** | The workflow asks to see the live link and its version **before committing**, but Pages can only publish pushed commits, and it deploys on merge to `main`, which doesn't yet contain #1–#3 | **Decision needed at plan review.** Recommended: after you approve the diff and tests, commit and push the 004 branch, run the Pages deploy once from that branch (manual `workflow_dispatch`, environment allowing `004-prototype-round-2`), show you the live link and version, then open the PR. Alternative: show the local build's version before the commit, and the live link right after the merge | Developer |
| **H4** | The GitHub plan can't be read (the token lacks the `user` scope) | You confirm the plan at review, or run `gh auth refresh -s user` | Developer |
| **T1** | Runtime contrast can't evaluate text over images | Skipped elements are counted and listed in the test output; the recorded-pair check still covers them | Team |

## Complexity Tracking

No constitution violations to justify. The fastlane rule doesn't apply (no app build;
research R16).
