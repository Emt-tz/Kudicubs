# Implementation Plan: KudiCubs UX Design System & Clickable Prototype

**Branch**: `002-ux-prototype` (stacked on `001-kudicubs-mvp`) | **Date**: 2026-11-14 |
**Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-ux-prototype/spec.md`. The user gave no extra
architecture brief ("for 002"), so the approach below was proposed during planning and every
choice is justified in [research.md](./research.md) (D1–D14).

**Artifacts**:

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/tokens.schema.json](./contracts/tokens.schema.json)
- [contracts/screen-flow.md](./contracts/screen-flow.md)
- [quickstart.md](./quickstart.md)

No `tasks.md` yet; that comes from `/speckit-tasks`.

## Summary

The aim is to show the client, Jefferson, what KudiCubs will look and feel like before any app
code is written. The deliverables are:

1. **A design system in `docs/design/`**:
   - Tokens with one source, `tokens.json`. It generates CSS now, and Flutter theme values later.
   - A component list (25 components).
   - Kudi the Cub rules (7 poses, with no sad or angry pose).
   - The four age-band UI rules.
   - The design-references record.
   - A plain-language review guide for the client.
2. **A clickable, phone-sized prototype in `prototype/`**:
   - Plain HTML, CSS and JavaScript, with no build step. It works from `file://`, from a zip, or
     from a link.
   - It covers 13 screens from Welcome to Progress, with **The Lost Coins** for ages 4–6,
     including the find, sort and count activities.
   - It uses original SVG art for Kudi, the avatars and the coins.
   - Narration is a placeholder using the device's speech engine.
   - A hidden reviewer menu switches between Ghana, Nigeria and the UK.
   - It uses only made-up data and makes no network calls.
   - It is shared through an unlisted Cloudflare Pages link, **only with your go-ahead**.

Machine checks verify the measurable success criteria: contrast, token use, a flow walk, touch
sizes, region switching and "nothing sent".

## Technical Context

| Item | Value |
|---|---|
| **Language/Version** | HTML5, CSS (custom properties), JavaScript (ES2020, classic scripts; no modules, for `file://` compatibility). Node.js 20+ for dev tools only. |
| **Primary Dependencies** | Prototype: **none**. Fonts are Baloo 2 and Nunito (OFL, bundled). Dev tools: `@playwright/test`, and `ajv` (validating `tokens.json` against `contracts/tokens.schema.json`). |
| **Storage** | None. `sessionStorage` holds prototype preferences only (region, sound, current screen). No personal data is stored anywhere (FR-012). |
| **Testing** | `check-contrast.mjs`, `check-tokens-usage.mjs`, and the Playwright `flow.spec.mjs` (contract: [screen-flow.md §4](./contracts/screen-flow.md)); manual scenarios V1–V12 in the quickstart. |
| **Target Platform** | Mobile Safari (iOS 15+) and Chrome for Android, plus desktop browsers in a centred phone frame (390 × 844). |
| **Project Type** | Static design prototype plus design documentation. **Not** app code. |
| **Performance Goals** | First load ≤ 2 s on 4G; tap feedback ≤ 100 ms; animations at 60 fps on a mid-range phone (SC-010). |
| **Constraints** | Works offline once opened (FR-023). Total prototype size ≤ 3 MB, including fonts. No third-party scripts, CDNs, analytics or trackers. Respects `prefers-reduced-motion`. |
| **Scale/Scope** | 13 screens (17 including sub-screens), 25 components, 7 Kudi poses, 4 avatars, 3 region coin sets, 1 mission. |

There are no remaining NEEDS CLARIFICATION items. Every unknown is resolved in research D1–D14.

## Constitution Check

*GATE: must pass before Phase 0 research, and is re-checked after the Phase 1 design.*

**Constitution v1.0.0**

| Principle | Pre-design | Post-design evidence |
|---|---|---|
| I. Child-First Flow | ✅ | Exactly one main action at a time per child screen: one `data-primary` button or one `data-primary-group` of equal choices (asserted by test); a 6-second idle hint; no dead ends ([screen-flow.md §1, §4](./contracts/screen-flow.md)) |
| II. Learn by Doing | ✅ | The Lost Coins is shown as do, decide, outcome. The saving/spending explainer is a skippable narrated line, not a lesson. |
| III. Failure Is Safe | ✅ | No `data-failure` anywhere for 4–6 (asserted); no error colour; Kudi has no sad pose; a wrong jar gives a gentle bounce |
| IV. Age-Adaptive | ✅ | `age-band-rules.md` covers all four bands with the values from spec 001; the prototype shows 4–6 only, which matches the spec's scope |
| V. Child Safety & Privacy | ✅ | Parent gate (hold, maths, PIN); nothing stored or sent (asserted by "zero off-origin requests"); reviewer menu hidden behind a long-press; no trackers or CDNs; made-up data only. **⚠ P1**: the shared link is unlisted but public, so it needs your go-ahead. |
| VI. Localised by Configuration | ✅ | `regions.js` holds three coin sets; switching changes presentation only, never counts (asserted) |
| VII. Pre-Reader Accessible | ✅ with a note | Speaker cue on every prompt; icon-first 4–6 screens; 64/76 px targets. **⚠ P2**: narration is the device's synthetic voice, a labelled placeholder until real recordings (plan 001, O3). |
| Workflow | ✅ | PR per feature (002); semver for the prototype (0.1.0) and tokens (0.1.0 → 1.0.0 at sign-off); commits authored by you; fastlane doesn't apply (no store build) |

**Gate result: PASS** before and after design. There are no violations, so no complexity
justification is needed.

### Flags

| # | Flag | Resolution |
|---|---|---|
| **P1** | An unlisted Cloudflare Pages link can be opened by anyone who has it | It holds made-up data and placeholder art only. Deploying is a **separate, confirm-first task**. Cloudflare Access can restrict it to Jefferson's email if wanted. |
| **P2** | Synthetic narration may make the client judge the voice harshly | The review guide says clearly that it is a placeholder, and asks him to judge *where* narration plays, not the voice itself. |
| **P3** | Art is placeholder | It is original SVG and labelled. Final illustration remains plan 001 open item O4. The review asks about *direction* (a lion cub, a warm market, the coins). |
| **P4** | The user's screen list skips the find, sort and count activities | Included, per the spec's Assumptions (they are The Lost Coins). |

## Decision log (full text in research.md)

| Decision | Rejected | Ref |
|---|---|---|
| Plain HTML, CSS and JavaScript (classic scripts), no build step, hash routes | Figma; React/Vite; Flutter web | D1 |
| Cloudflare Pages unlisted link, plus a zip fallback and offline caching | GitHub Pages (paid for private repos, public anyway); zip only | D2 |
| `tokens.json` (W3C format) generates the CSS and the markdown tables | Hand-kept CSS and markdown; Style Dictionary | D3 |
| Original warm market palette with contrast verified; gold always uses cocoa text | Bright green (too close to Duolingo); a red error colour | D4 |
| Baloo 2 + Nunito (OFL), bundled | System fonts; commercial fonts | D5 |
| Hand-built original SVG Kudi (7 poses), avatars and scenes | AI or stock images; emoji | D6 |
| Stylised coin tokens per region, not replicas of real money | Photo-real money | D7 |
| Web Speech API narration as a labelled placeholder | Pre-generated TTS clips; silence | D8 |
| Drag or tap-tap sorting; gentle bounce; idle hints at 6/12/20 s; reduced-motion respected | Drag only | D9 |
| Reviewer menu behind a 2-second logo long-press or `?review=1` | A visible gear icon | D10 |
| In-memory state; preferences in `sessionStorage`; the gate values discarded | `localStorage` or any backend | D11 |
| Node checks plus a Playwright flow test | Manual only; visual regression | D12 |
| Patterns-only references, with the differences documented | — | D13 |
| Prototype 0.1.0 and tokens 0.1.0; deployed after PR review | — | D14 |

## Project Structure

### Documentation (this feature)

```text
specs/002-ux-prototype/
├── spec.md
├── plan.md               # This file
├── research.md           # D1–D14
├── data-model.md         # Tokens, components, poses, band rules, screens, mock data, regions, state
├── quickstart.md         # Open, check, share; V1–V12
├── contracts/
│   ├── tokens.schema.json
│   └── screen-flow.md
├── checklists/requirements.md
└── tasks.md              # /speckit-tasks (not created yet)
```

### Deliverables (repository root)

```text
docs/design/
├── README.md               # Index of the design system + how to use it
├── tokens.json             # SOURCE OF TRUTH (contracts/tokens.schema.json)
├── tokens.md               # Usage guidance + generated token tables
├── components.md           # 25 components: purpose, states, min touch, tokens, screens, band notes
├── kudi-the-cub.md         # Character, personality, 7 poses, voice and line rules, placement, never-do list
├── age-band-rules.md       # 4–6 / 7–9 / 10–12 / 13–15 table + examples (matches spec 001 R9)
├── design-references.md    # Patterns adopted from Duolingo, Khan Academy Kids, Toca Boca + differences + originality review record
├── review-guide.md         # Plain-language guide for Jefferson: open, click path, what feedback we need
└── diagrams.md             # (exists, from 001)

prototype/
├── index.html              # Shell: phone frame, logo (reviewer long-press), screen root, bottom nav
├── manifest.webmanifest    # "Add to Home Screen"
├── sw.js                   # Offline cache (active only over http(s))
└── assets/
    ├── tokens.css          # GENERATED from docs/design/tokens.json; do not edit
    ├── base.css            # Reset, typography, layout, phone frame, reduced-motion
    ├── components.css      # One block per component (data-component)
    ├── app.js              # KC namespace: router, state, idle-hint timer, narration, reviewer menu
    ├── screens.js          # Screen registry + render functions (contracts/screen-flow.md)
    ├── activities.js       # find / sort / count interactions (pointer + tap-tap)
    ├── celebrate.js        # Coin and confetti burst
    ├── data/
    │   ├── mock-data.js    # window.KC.data (data-model §6)
    │   └── regions.js      # window.KC.regions (data-model §7)
    ├── art/
    │   ├── kudi/{welcome,explain,point,think,cheer,gentle,idle}.svg
    │   ├── avatars/cub-friend-{1..4}.svg
    │   ├── coins/{gh,ng,uk}/*.svg
    │   ├── scenes/{market-park,stall,jars}.svg
    │   └── icons/*.svg     # home, wallet-jar, path, speaker, back, lock, badge set
    └── fonts/{Baloo2,Nunito}-*.woff2 + OFL.txt

tools/design/
├── package.json            # devDependencies: @playwright/test, ajv
├── build-tokens.mjs
├── check-contrast.mjs
├── check-tokens-usage.mjs
├── playwright.config.mjs   # 390×844, hasTouch, chromium + webkit, file:// base URL
└── tests/flow.spec.mjs     # contracts/screen-flow.md §4
```

**Structure decision**: there are three roots, each with one job:

- `docs/design/`: the durable design system that spec 001's app will use.
- `prototype/`: the throwaway demo, which is static and has no build.
- `tools/design/`: dev-only checks.

None of them touches the future `app/`, `supabase/` or `content/` folders from plan 001
("no app code").

## Complexity Tracking

No constitution violations, so no entries are needed.
