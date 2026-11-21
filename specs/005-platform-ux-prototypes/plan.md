# Implementation Plan: Complete UI/UX and Prototypes for the Mobile App, Website and Dashboard

**Branch**: `005-platform-ux-prototypes` (**not yet created**: the working tree is still on
`004-prototype-round-2`; create it from there before the first task, per Constitution "PR per
feature") | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification `specs/005-platform-ux-prototypes/spec.md` (FR-001–FR-027,
SC-001–SC-010, user stories 1–9).

**Artifacts**:

- [research.md](./research.md) (R1–R12)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/):
  - `journey-map.schema.json`
  - `platform-manifest.md`
  - `site-and-dashboard-structure.md`
  - `references-record.schema.json`
  - `share-hub-and-deploy.md`
  - `validation-suite.md`
- [quickstart.md](./quickstart.md) (Q1–Q10)

No `tasks.md` yet.

## Summary

This feature turns the single-journey prototype (v0.3.0, 4–6 "Lost Coins" only) into a complete,
shareable set for four surfaces, with no production code:

1. **Coverage map first.** A machine-readable journey and story map (`journey-map.json`) lists every
   001 story and every 005 journey. A check fails the build when an in-scope row has no resolvable
   screen, and prints the coverage count shown on the share page.
2. **Mobile app (`prototype/` → `/app/`).** Extend the existing static prototype: one complete
   mission for each of 7–9, 10–12 and 13–15 (the 4–6 mission already exists), the remaining parent-
   area screens (PIN recovery, lock-out, new-device sign-in, device mode, delete account), and
   region coverage for all of them. The existing 6 screen types, tokens, narration and age-band rules
   are reused.
3. **Website (`website/` → `/website/`).** A responsive multi-page static site for parents: home,
   how it works, age bands, safety and privacy, get the app, FAQ, contact, sign-in, and legal pages.
4. **Dashboards (`dashboard/` → `/dashboard/`).** One static app with two entrances: the Parent
   Dashboard (OTP sign-in, family, child, skills, settings, data) and the Team Console (roles,
   family lookup, content status). Both read one fictional sample family.
5. **One design system.** Tokens stay the single source (`docs/design/tokens.json`), emitted to a
   shared stylesheet used by all four surfaces, plus a small set of adult-surface components (nav,
   table, form, card, chart, empty state) documented in `docs/design/components.md`.
6. **References.** `docs/design/references.json` plus the existing design-references note record every
   gallery idea (Dribbble and others), with a "how we differ" entry and an originality review.
7. **Share hub.** The existing public link (`https://emt-tz.github.io/Kudicubs/`) becomes a hub page
   listing the three platforms, journeys to try, version, date and change list. The mobile app moves
   to `/app/`. Deploy and CI extend the 004 workflows.

## Technical Context

**Language/Version**: Static HTML, CSS and classic (non-module) scripts for all four surfaces, so
every surface also works from `file://` as the 002–004 prototype does. Node ≥ 20 for the dev-only
tools.

**Primary Dependencies**: None at runtime. Dev-only, already present in `tools/design`:
`@playwright/test` 1.65.1 and `ajv` 8.20.0. No new runtime or build dependency. The chart and table
visuals for the dashboard are hand-built SVG/CSS, as the icons already are (research R5).

**Storage**: The app keeps its `localStorage` event log (schema 1, from 004). Website and dashboards
store nothing but the signed-in demo state in `sessionStorage`. All family data is the fictional
sample family; no real data is stored or sent (Constitution V).

**Testing**: Playwright (chromium and webkit) at phone, tablet and desktop viewports; ajv for the
JSON contracts; existing contrast, token, brand, narration and audio checks, extended to the new
surfaces; a new coverage check and references check.

**Target Platform**: Modern mobile and desktop browsers for review. Phone portrait for the app;
320 px–1440 px for the website and dashboards.

**Project Type**: Design prototype set (static multi-surface web), plus design documentation.

**Performance Goals**: Each surface's first screen is interactive within 2 seconds on a mid-range
phone over a typical mobile connection. The app keeps its 004 budget. Each page's own weight stays
under 1 MB excluding fonts and shared brand art.

**Constraints**: Works offline after first load for the app (existing service worker, rescoped to
`/app/`); no sideways scrolling at 320 px; `noindex, nofollow` on every page; scratch voice stays
demo-only (RB-1).

**Scale/Scope**: Four surfaces; roughly 45 app screens (22 existing + about 23 new), about 12 website
pages, about 14 Parent Dashboard views, about 5 Team Console views, 1 hub page, about 70 journey-map
rows. Counts are estimates to size the work; the coverage check is the authority.

## Constitution Check

*GATE: passes before research; re-checked after design (below).*

| Principle | Touched? | How this plan complies |
|---|---|---|
| I. Child-First Flow | Yes (app) | New child screens use the existing one-primary-action pattern, idle hints and route guard. The website and dashboards have no child flow. |
| II. Learn by Doing | Yes (app) | New band missions are decision and outcome loops with no quizzes or text walls. |
| III. Failure Is Safe | Yes (app) | 4–6 has no failure screen; 7–15 missions offer retry and lose nothing earned. Checked by tests per band. |
| IV. Age-Adaptive Progression | Yes (app) | One mission per band built on the same structure; behaviour per band follows `docs/design/age-band-rules.md`. Parent dashboard shows each child at their own band. |
| V. Child Safety & Privacy | Yes | Child surfaces never link to adult ones without the gate. Website and dashboards hold only fictional data; no tracking, no ads, no child data collection. Support views show nicknames only. No real money. |
| VI. Localised by Configuration | Yes | Currency and examples for all new screens come from `regions.js`; the dashboard shows each child's own region. |
| VII. Pre-Reader Accessible | Yes (app) | New child screens have narration or visual equivalents, icon-first, 48 px targets. Adult surfaces may be text-heavy (allowed by Product & Content Standards). |
| Data stored about a child | Declared | Nickname, age band, region, avatar, progress events (existing). Dashboard and console read the fictional sample only. |
| Workflow | Yes | Own branch and PR required (branch still to be created). Semantic versions: prototype 0.3.0 → 0.4.0, tokens 0.3.0 → 0.4.0, new contract schemas 1.0.0. Builds and store uploads: none in this feature; Pages deploy is CI, not a store upload. |

**Result**: PASS, no violations. Complexity Tracking is not needed.

**Post-design re-check (after Phase 1)**: PASS. The one new risk, moving the app from the site root
to `/app/`, is handled in research R3 and the deploy contract, and does not touch a principle.

## Project Structure

### Documentation (this feature)

```text
specs/005-platform-ux-prototypes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── journey-map.schema.json
│   ├── platform-manifest.md
│   ├── site-and-dashboard-structure.md
│   ├── references-record.schema.json
│   ├── share-hub-and-deploy.md
│   └── validation-suite.md
├── checklists/requirements.md
└── tasks.md              # created by /speckit-tasks
```

### Source Code (repository root)

```text
prototype/                     # mobile app (existing; extended). Published at /app/
├── index.html
├── sw.js                      # rescoped to /app/ (R3)
└── assets/
    ├── screens.js, activities.js, app.js, …   # extended
    ├── missions/              # NEW: one data file per band mission (7–9, 10–12, 13–15)
    └── data/                  # regions.js, mock-data.js (sample family now shared, R6)

website/                       # NEW. Published at /website/
├── index.html, how-it-works.html, age-bands.html, safety.html, get-the-app.html,
│   faq.html, contact.html, sign-in.html, privacy.html, terms.html, children-privacy.html
└── assets/site.css, site.js

dashboard/                     # NEW. Published at /dashboard/
├── index.html                 # entrance chooser (parent / team)
├── parent/                    # Parent Dashboard views
├── team/                      # Team Console views
└── assets/dashboard.css, dashboard.js

hub/                           # NEW. Published at the site root
└── index.html, hub.css, hub.js

shared/                        # NEW: built, not hand-edited
├── tokens.css                 # emitted from docs/design/tokens.json
├── adult-components.css       # nav, table, form, card, chart, empty state
├── sample-family.js           # one fictional family, all surfaces
└── brand/, fonts/             # copied once

docs/design/
├── journey-map.json           # NEW: the coverage map (source of truth)
├── journey-map.md             # NEW: generated, human-readable
├── references.json            # NEW: gallery references and review
├── design-references.md       # extended
├── components.md, tokens.json # extended
└── review-guide.md            # extended with the three-platform guide

tools/design/
├── build-site.mjs             # NEW: assembles dist/ for Pages (R3)
├── check-coverage.mjs         # NEW
├── check-references.mjs       # NEW
├── tests/                     # extended: per-platform specs
└── …existing checks

.github/workflows/             # prototype-ci and prototype-pages extended
```

**Structure Decision**: Keep the app where it is and add sibling folders for each new surface, then
assemble them into one deployable `dist/` with a build script. This avoids moving the 004 code, keeps
every surface runnable from `file://`, and lets the share hub sit at the existing public link.

## Complexity Tracking

No Constitution violations; nothing to justify.
