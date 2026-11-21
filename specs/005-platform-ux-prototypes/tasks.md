---

description: "Task list for 005: complete UI/UX and prototypes for the mobile app, website and dashboards"
---

# Tasks: Complete UI/UX and Prototypes for the Mobile App, Website and Dashboard

**Input**: `specs/005-platform-ux-prototypes/`: spec.md (FR-001–FR-027, SC-001–SC-010, stories 1–9),
plan.md, research.md (R1–R12), data-model.md, contracts/, quickstart.md (Q1–Q10).

**Prerequisites**: plan.md and spec.md (both present).

**Tests**: FR-027 requires the automated checks to be extended, so test tasks sit inside the story
they prove.

**Global rules for every task** (constitution, spec and plan):

- **No production app code.** Touch only `prototype/`, `website/`, `dashboard/`, `hub/`, `shared/`,
  `tools/design/`, `docs/design/`, `.github/workflows/`, the root `README.md` and
  `specs/005-platform-ux-prototypes/`.
- **Static HTML, CSS and classic scripts only**: no framework, no bundler, no new runtime
  dependency, no network request at runtime. Every surface must still open from `file://`.
- **Never live or browser speech synthesis.** Scratch audio stays demo-only (RB-1).
- **Never redraw, recolour or stretch** the logo or Kudi. Only `var(--kc-*)` tokens in CSS and JS.
- **Child screens**: one obvious primary action, no dead ends, 48×48 minimum targets, no failure
  screen for 4–6, retry and no lost progress for 7–15.
- **Only fictional data.** No real email, name or child data anywhere. Support views show nicknames
  only.
- **No outside assets.** Never save or copy gallery screenshots, mascots, colours or copy.
- **Outward-facing steps always ask first**: creating the branch, any push, the deploy, the PR.

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[USn]**: the user story in spec.md

---

## Phase 1: Setup

- [X] T001 Ask the developer to create branch `005-platform-ux-prototypes` from `004-prototype-round-2`; do nothing else until it exists (Constitution: PR per feature)
- [X] T002 [P] Create empty folders with a placeholder `README.md` each: `website/`, `dashboard/parent/`, `dashboard/team/`, `hub/`, `shared/`, `docs/design/mission-extracts/`
- [X] T003 [P] Bump versions to 0.4.0 in `tools/design/package.json`, `docs/design/tokens.json` and the prototype build info source `tools/design/build-info.mjs`
- [X] T004 Extract (with `python-pptx` run through `uv`, or by reading the slides directly if that fails) the first mission of each world (7–9, 10–12, 13–15) from `docs/source/BIZ KIDS Content.pptx` into `docs/design/mission-extracts/{7-9,10-12,13-15}.md` (steps, decisions, outcomes, concepts, regional examples), per research R4

---

## Phase 2: Foundational (blocks all stories)

- [X] T005 Copy `specs/005-platform-ux-prototypes/contracts/journey-map.schema.json` and `references-record.schema.json` to `docs/design/schemas/` and add them to the ajv setup in `tools/design/lib/`
- [X] T006 Extend `tools/design/build-tokens.mjs` to also emit `shared/tokens.css` from `docs/design/tokens.json`, with a `data-surface="adult"` density override (named tokens: `--kc-adult-type-scale`, `--kc-adult-space-unit`, `--kc-adult-radius`, `--kc-adult-target-min` = 44px), per research R7
- [X] T007 [P] Move brand art and fonts into `shared/brand/` and `shared/fonts/` with the build copying them; update `tools/design/check-brand.mjs` to scan `website/`, `dashboard/`, `hub/` and `shared/`
- [X] T008 [P] Write `shared/adult-components.css`: `top-nav`, `side-nav`, `table`, `form-field`, `button` (primary, quiet), `card`, `tabs`, `stat-tile`, `chart-shell`, `empty-state`, `toast`, `modal`, each with default, hover/press, focus, disabled, loading, error and empty states, compact and comfortable sizes, 44 px minimum targets
- [X] T009 Build the sample family source `shared/sample-family.json` (at least three children across at least three bands and two regions, nicknames only, events, two devices, no real email) and generate `shared/sample-family.js` from it; add a check in `tools/design/check-brand.mjs` that fails on anything shaped like a real email address, phone number or a child name outside the sample list (FR-026); make the app's "Load sample data" in `prototype/assets/data/mock-data.js` read the same source (research R6)
- [X] T010 Add a skeleton of `docs/design/journey-map.json` listing every story id (001-US1…US6, 005-US1…US9) with all rows as `gap`, so coverage starts at zero and rises (spec FR-001–FR-003)
- [X] T011 Write `tools/design/check-coverage.mjs`: validate the map against the schema, require every story id in at least one row, fail on any in-scope `gap` only with `--strict` (default is progress mode: print the gaps and exit 0), resolve each screen link and state in the platform manifests, print counts per platform (contract `validation-suite.md`)
- [X] T012 Write `tools/design/build-site.mjs` (assembles `dist/` per `contracts/share-hub-and-deploy.md`, generates the four screen manifests from the screen registries, writes `dist/release.json`, supports `--check`) and wire `check-coverage`, `build-site --check` and `check-references` into `npm run check` in `tools/design/package.json`, all in progress mode (`check-references` passes with a warning until `references.json` exists); add a script `npm run check:strict` that runs them with `--strict` (used by T080 and the final CI run)
- [X] T013 [P] Add `prototype/assets/data/screens.manifest.json` generation for the app by reading the registry in `prototype/assets/screens.js` (route id, title, states)
- [X] T014 [P] Extend `tools/design/playwright.config.mjs` with phone (320, 360, 390), tablet (768) and desktop (1280) projects and a shared helper `tools/design/tests/helpers.mjs` for overflow and console-error checks
- [X] T015 Add `tools/design/tests/routes.spec.mjs`: every manifest id of every surface loads with no console error and no failed request (starts passing as each surface is added)

**Checkpoint**: tokens, shared styles, sample family, coverage and site build all run; the map shows every row as a gap.

---

## Phase 3: User Story 1 - One map shows every journey and story (Priority: P1)

**Goal**: every actor, journey and story is listed, with design status and links, and gaps are counted.

**Independent Test**: take all 001 and 005 story ids, find each in the map, follow its links; in-scope gap count is zero (quickstart Q2).

- [X] T016 [US1] Enumerate every journey from `specs/001-kudicubs-mvp/spec.md` stories 1–6 and `spec.md` stories 1–9 into rows in `docs/design/journey-map.json` (id pattern `J-APP|WEB|PD|TC-NN`, actor, priority, platform, status `gap`)
- [X] T017 [US1] Mark deliberate exclusions as `out-of-scope` with a reason (teacher and school dashboards, multiplayer, real payments, the full 17-mission list beyond one per band) in `docs/design/journey-map.json`
- [X] T018 [P] [US1] Generate `docs/design/journey-map.md` and a coverage summary table from the JSON in `tools/design/check-coverage.mjs --write`
- [X] T019 [US1] Add a negative test in `tools/design/tests/coverage.spec.mjs` proving the check fails when a story id is dropped, a link is broken, or an in-scope row is a gap (like 004's "prove the rule fails")
- [X] T020 [US1] Print the coverage summary (designed, gap, out-of-scope per platform) at the end of `node tools/design/check-coverage.mjs` and in `dist/release.json`, so each surface phase below shows its progress; each surface phase updates its own rows from `gap` to `designed`

**Checkpoint**: map exists, is checked, and drives the remaining work.

---

## Phase 4: User Story 2 - A child can play every journey in the mobile app (Priority: P1)

**Goal**: complete child journeys in all four age bands and all three regions.

**Independent Test**: from welcome, reach reward, wallet, progress and profile in each band, and change region (quickstart Q4).

- [X] T021 [US2] Audit the 22 existing app screens against 001 stories 1–5 and list missing child screens (home states, daily challenge, badges, level-up, band-specific home) in `docs/design/app-gap-audit.md`
- [X] T022 [P] [US2] Add per-band mission data files `prototype/assets/missions/band-7-9.js`, `band-10-12.js`, `band-13-15.js` from the T004 extracts, built only from the six existing screen types; text and numbers from `regions.js`, never hard-coded
- [X] T023 [US2] Extend the mission loader in `prototype/assets/app.js` and `prototype/assets/screens.js` to run any band's mission through the same route guard and event log (004 contracts unchanged)
- [X] T024 [P] [US2] Build the 7–9 Decision, Round Summary and retry screens in `prototype/assets/screens.js` per `docs/design/age-band-rules.md` (reading level, two variables, no time pressure)
- [X] T025 [P] [US2] Build the 10–12 Resource Management and Market Simulation screens in `prototype/assets/screens.js` (more variables, light time cue, retry that loses nothing earned)
- [X] T026 [P] [US2] Build the 13–15 "Side Hustle" screens in `prototype/assets/screens.js` (profit and loss, budget, retry with no penalty, no failure framing)
- [X] T027 [US2] Add the daily challenge, level-up and badge detail screens per band in `prototype/assets/screens.js` and `prototype/assets/celebrate.js`, with icon-first design and narration or visual equivalents (Constitution VII)
- [X] T028 [US2] Add the band-aware home, wallet, progress and profile variants in `prototype/assets/screens.js` and styles in `prototype/assets/components.css` using only tokens
- [X] T029 [P] [US2] Add narration lines for new child screens in `docs/design/narration/` and regenerate with `tools/design/build-narration.mjs`; mark audio as scratch via the existing script
- [X] T030 [US2] Add region entries for the new missions to `prototype/assets/data/regions.js` for Ghana, Nigeria and the United Kingdom
- [X] T031 [US2] Add reviewer jumps for every new screen to the reviewer menu in `prototype/assets/app.js` and regenerate `screens.manifest.json`
- [X] T032 [P] [US2] Add `tools/design/tests/bands.spec.mjs`: per band reach reward, wallet, progress and profile; 4–6 never shows a failure; 7–15 offers retry and loses nothing earned; with sound off every narrated screen still shows its text or caption and the mission is completable (FR-009)
- [X] T033 [P] [US2] Add `tools/design/tests/regions.spec.mjs` (app part): coins and examples change by region on every new money screen
- [X] T034 [US2] Extend `tools/design/tests/fold.spec.mjs` and `contrast.spec.mjs` to cover every new child screen at 360×640 and 390×844 (primary action visible, targets ≥ 48×48)
- [X] T035 [US2] Update the journey-map rows for the app child journeys to `designed` with screen links in `docs/design/journey-map.json`

**Checkpoint**: all four bands playable; story 2 independently testable.

---

## Phase 5: User Story 3 - A parent can do everything on the phone (Priority: P1)

**Goal**: the full parent area behind the gate.

**Independent Test**: from profile, reach the parent area, complete every settings action, sign in on a "new device" with a code and reach delete-account (quickstart Q5).

- [X] T036 [US3] Audit the existing parent area against FR-010 and add its missing screens as a second section of `docs/design/app-gap-audit.md` (the file T021 creates)
- [X] T037 [P] [US3] Add PIN recovery and wrong-PIN lock-out screens (calm message, way back, a child can return to play without loss) in `prototype/assets/screens.js`
- [X] T038 [P] [US3] Add the new-device sign-in with one-time code (default, wrong, expired, resend) and the "This is my phone" / "Family device" choice in `prototype/assets/screens.js`
- [X] T039 [P] [US3] Add children list, per-child progress, add child, region and band change screens in `prototype/assets/screens.js`
- [X] T040 [US3] Add sign-out and delete-account confirmation (names what is erased, 12-month inactivity rule, way back, cannot be completed by a child) in `prototype/assets/screens.js`
- [X] T041 [US3] Extend the route guard in `prototype/assets/app.js` so no child screen links into the parent area without the gate, following the guard rules in `specs/004-prototype-round-2/contracts/navigation.md`, and add the parent-area flow to the screen-flow diagram in `docs/design/diagrams.md`
- [X] T042 [P] [US3] Add `tools/design/tests/parent-area.spec.mjs` covering wrong PIN, lock-out, recovery, new-device code, device mode and delete confirm
- [X] T043 [US3] Update journey-map rows for the parent-phone journeys to `designed` in `docs/design/journey-map.json`

**Checkpoint**: parent area complete on the phone.

---

## Phase 6: User Story 8 - Share the whole set with one link and a guide (Priority: P1)

**Goal**: one stable hub link, three platforms, a guide.

**Independent Test**: three people who haven't seen the project open the link and finish one journey on each platform (quickstart Q10).

- [X] T044 [US8] Build the hub page `hub/index.html`, `hub/hub.css`, `hub/hub.js`: three platform cards, role switcher listing journeys from the map, version, date, coverage counts, change list, feedback route, RB-1 note
- [X] T045 [US8] Make `tools/design/build-site.mjs` publish the app at `/app/`, write `robots.txt` (disallow all), `noindex` meta on every page, and the retirement `sw.js` at the root that unregisters itself and clears the old cache (research R3)
- [X] T046 [US8] Rescope the app service worker to `/app/` in `tools/design/build-sw.mjs` and `prototype/sw.js`; add forwarding of old `/#/…` links to `/app/#/…` in `hub/hub.js`
- [X] T047 [P] [US8] Update `.github/workflows/prototype-ci.yml` to run the extended `npm run check` and `.github/workflows/prototype-pages.yml` to deploy `dist/` from the 005 branch (temporary until merge)
- [X] T048 [P] [US8] Write the three-platform guide in `docs/design/review-guide.md` (how to open each, role, journeys to try, how to leave feedback)
- [X] T049 [P] [US8] Add `tools/design/tests/hub.spec.mjs` and `noindex.spec.mjs`: cards, role lists from the map, values match `dist/release.json`, old hash links forward, no horizontal overflow at 320/768/1280, every page has `noindex, nofollow`
- [X] T087 [P] [US8] Add `tools/design/tests/perf-offline.spec.mjs`: each surface's first screen is interactive within 2 seconds on a throttled mid-range profile, each page stays under 1 MB (excluding fonts and shared brand art), and the app reloads offline after the first visit (plan Performance Goals and Constraints)
- [X] T050 [US8] Update the README live-demo section and layout table in `README.md` for the hub and the new folders

**Checkpoint**: P1 stories done. This is the suggested MVP: map, full app, parent area and a share link.

---

## Phase 7: User Story 6 - One brand and one system on all platforms (Priority: P2)

**Goal**: documented, consistent components across surfaces.

**Independent Test**: pick ten components and find each on every surface where it applies, matching the docs.

- [X] T051 [US6] Document every shared, child and adult component with states and sizes in `docs/design/components.md` (adds the T008 set)
- [X] T052 [P] [US6] Add an adult-surface section to `docs/design/tokens.md` and `docs/design/age-band-rules.md` explaining density, type scale and the "calmer, denser, still on brand" rule
- [X] T053 [US6] Widen `tools/design/check-tokens-usage.mjs` and `check-contrast.mjs` to `website/`, `dashboard/`, `hub/` and `shared/` and fail on off-palette colours, off-system fonts or low contrast; add `tools/design/tests/touch-size.spec.mjs` failing on any interactive element under 44×44 px on adult surfaces (48×48 on child screens)
- [X] T054 [P] [US6] Add `tools/design/tests/consistency.spec.mjs`: sample-family values match between the app's sample data and the dashboard; shared components render identically in a component sheet at `shared/component-sheet.html`
- [X] T055 [US6] Capture component sheets with `tools/design/capture-components.mjs` for the new components and store under `docs/design/img/`

---

## Phase 8: User Story 7 - Gallery references, checked and original (Priority: P2)

**Goal**: collect public gallery ideas, record them, prove nothing was copied.

**Independent Test**: any five screens cite their references, the pattern adopted and how they differ (quickstart Q9).

- [X] T056 [US7] Research public Dribbble and similar gallery pages for: parent-facing kids-finance landing pages, family dashboards, progress charts, empty states and OTP sign-in; record candidates (link, pattern) in `docs/design/references.json`; save no screenshots
- [X] T057 [US7] For each candidate set verdict `adopted`, `adapted` or `rejected`, write the `differs` note, and record rejections (dark patterns, urgency timers, streak-shaming, real-money imagery) with `rejectReason`
- [X] T058 [P] [US7] Write `tools/design/check-references.mjs`: schema validation, unknown `REF-` ids cited by screens fail, missing `differs` fails, at least one review round required
- [X] T059 [US7] Extend `docs/design/design-references.md` with the new references table and the originality review record (method, reviewer, date, result); the developer countersigns
- [X] T060 [US7] After the website and dashboard screens exist, add the `refs` field (see `contracts/platform-manifest.md`) to each influenced screen in the screen registries so the generated manifests carry it, and rerun `check-references.mjs` in strict mode

---

## Phase 9: User Story 4 - A parent visiting the website gets the app (Priority: P2)

**Goal**: a responsive website that explains KudiCubs in under a minute.

**Independent Test**: a first-time parent answers what it is, ages and how to get it, and finds privacy unaided (quickstart Q6).

- [X] T061 [US4] Write the website shell `website/assets/site.css`, `website/assets/site.js` (header, footer, nav, breakpoints at 640/1024/1280) using `shared/tokens.css` and `shared/adult-components.css`
- [X] T062 [P] [US4] Build `website/index.html`, `how-it-works.html`, `age-bands.html` (four bands with region examples) following `contracts/site-and-dashboard-structure.md`
- [X] T063 [P] [US4] Build `website/safety.html` (parent gate, PIN, no real money, data handling in plain words) and `website/get-the-app.html` (Android and iOS routes; desktop "send me the link" with sent state)
- [X] T064 [P] [US4] Build `website/faq.html` (expand and collapse, empty search state) and `website/contact.html` (empty, filled, error, sending, sent)
- [X] T065 [P] [US4] Build `website/sign-in.html` linking to the Parent Dashboard sign-in, and placeholder legal pages `privacy.html`, `terms.html`, `children-privacy.html`
- [X] T066 [US4] Generate `website/screens.manifest.json` through `build-site.mjs` and add `tools/design/tests/website-flows.spec.mjs` (download route per platform, FAQ, contact states, sign-in leads to dashboard, no overflow at 320/768/1280)
- [X] T088 [P] [US4] Add `tools/design/tests/no-tracking.spec.mjs` for the website and dashboards: no external request, no cookie, no analytics or ad script, no `localStorage` write on the website, and no form field asking for a child's name or details (FR-014, FR-026)
- [X] T067 [US4] Update the website journey-map rows to `designed` in `docs/design/journey-map.json`

---

## Phase 10: User Story 5 - Parent Dashboard on the web (Priority: P2)

**Goal**: sign in with a code and follow the family.

**Independent Test**: sign in as the sample family, find a child's recent play and strongest skill in under 90 seconds (quickstart Q7).

- [X] T068 [US5] Build the dashboard shell `dashboard/index.html` (entrance chooser), `dashboard/assets/dashboard.css`, `dashboard/assets/dashboard.js` (hash router, sample-family loader, reviewer menu for states)
- [X] T069 [P] [US5] Build `dashboard/parent/` sign-in and code views with demo-code behaviour: wrong, expired and resend triggered by named reviewer inputs (research R10)
- [X] T070 [P] [US5] Build the overview, child, skills, badges and activity views with hand-built SVG and CSS charts (research R5), money in each child's region currency, new-family empty and loading states
- [X] T071 [P] [US5] Build settings (child, family), devices, data export and delete confirm, monthly summary and signed-out views
- [X] T072 [US5] Make the layout switch to top or bottom navigation below 1024 px and keep every function on phone width
- [X] T073 [US5] Generate `dashboard/screens.manifest.json` (key `parent`) and add `tools/design/tests/dashboard-flows.spec.mjs` (code states, overview, empty state, child view, each child's money shown in their own region currency, settings, data, overflow at 320/768/1280)
- [X] T074 [US5] Update the Parent Dashboard journey-map rows to `designed` in `docs/design/journey-map.json`

---

## Phase 11: User Story 9 - Team Console for staff (Priority: P3)

**Goal**: support and content roles with minimum data.

**Independent Test**: sign in as support, then as content editor; each completes their tasks and cannot reach the other's views (quickstart Q8).

- [X] T075 [US9] Build `dashboard/team/` sign-in with a role chooser, plus the `families`, `family` (nicknames, age band, region, last-active only) and `no-access` views
- [X] T076 [P] [US9] Build the `content` and `mission` views (age band, region coverage, voice-recording status from the audio manifest)
- [X] T077 [US9] Add role gating in `dashboard/assets/dashboard.js` and generate the `team` manifest key
- [X] T078 [P] [US9] Add `tools/design/tests/team-roles.spec.mjs` (support sees nicknames only, content cannot open family views, no-access state, no overflow at 320/768/1280)
- [X] T079 [US9] Update the Team Console journey-map rows to `designed` in `docs/design/journey-map.json`

---

## Phase 12: Polish and cross-cutting

- [X] T080 Run `cd tools/design && npm run check:strict` (coverage, references and site build in strict mode) and switch `.github/workflows/prototype-ci.yml` to that script; fix every remaining gap or move it to `out-of-scope` with a reason; confirm zero in-scope gaps (SC-001)
- [X] T081 Run `cd tools/design && npm run check` and fix all failures, including `routes`, overflow, bands, regions, parent-area, website, dashboard, team, hub, consistency and noindex specs
- [X] T082 [P] Run the quickstart scenarios Q1–Q10 in `specs/005-platform-ux-prototypes/quickstart.md` and record the results in `docs/design/child-session-results.md` or a new `docs/design/round5-review.md`
- [ ] T083 [P] Run a three-person share test (SC-007), a parent website test (SC-003) and a parent dashboard test (SC-004: find a child's recent play and strongest skill within 90 seconds, at least 4 of 5 parents) and record findings; add any new journey to the map within a day (SC-010)
- [ ] T084 [P] Run the originality review (SC-006) and have the developer countersign in `docs/design/design-references.md`
- [X] T085 Update `docs/design/diagrams.md`, `docs/design/README.md` and `README.md` for the new surfaces, versions and RB-1 note
- [ ] T086 Review the diff, then ask the developer before committing, pushing, deploying or opening the PR (Constitution: review before commit; human authorship; no attribution lines)

---

## Dependencies and order

- **Phase 1 → Phase 2 → everything else.** T001 gates all work.
- **Phase 2 foundations**: T005–T012 before any story; T013–T015 before story tests.
- **US1 (Phase 3)** can start right after Phase 2 and runs alongside the others, since each surface phase updates its rows.
- **US2 → US3 → US8**: P1 stories. US3 depends on US2's guard (T023). US8 needs the app manifest (T013) and the build (T012).
- **US6 (Phase 7)** needs T008; it should finish before US4 and US5 styling is final.
- **US7 (Phase 8)** research (T056–T057) should happen before US4 and US5 design, so ideas inform them; T060 comes after those screens exist.
- **US4 and US5** both need Phases 2 and 7; they are independent of each other. US5's sign-in is linked from US4's T065.
- **US9** needs the dashboard shell from T068.
- **Polish** last.

## Parallel examples

- After Phase 2: T022, T024, T025 and T026 (different band files) can run together.
- Website pages T062–T065 are separate files and can run together.
- Dashboard views T069–T071 can run together once T068 exists.
- T032, T033, T042 and T049 (separate test files) can run together with their stories.

## Implementation strategy

1. **MVP**: Phases 1–6 (setup, foundations, map, full app, parent area, share hub). This gives the client one link with complete app journeys and a proven coverage map.
2. **Increment 2**: Phases 7–8, then Phases 9–10 (design system, references, website, Parent Dashboard).
3. **Increment 3**: Phase 11 (Team Console), then Phase 12.
4. After each increment, update the map and rerun `npm run check` so the share link always shows a consistent, checked set.

## Summary

| Phase | Story | Tasks |
|---|---|---|
| 1 Setup | n/a | T001–T004 (4) |
| 2 Foundational | n/a | T005–T015 (11) |
| 3 | US1 (P1) | T016–T020 (5) |
| 4 | US2 (P1) | T021–T035 (15) |
| 5 | US3 (P1) | T036–T043 (8) |
| 6 | US8 (P1) | T044–T050, T087 (8) |
| 7 | US6 (P2) | T051–T055 (5) |
| 8 | US7 (P2) | T056–T060 (5) |
| 9 | US4 (P2) | T061–T067, T088 (8) |
| 10 | US5 (P2) | T068–T074 (7) |
| 11 | US9 (P3) | T075–T079 (5) |
| 12 Polish | n/a | T080–T086 (7) |
| **Total** | | **88** (T087 and T088 were added after the analysis; IDs are not in phase order) |


---

## Implementation notes (2026-11-20)

`npm run check:strict` passes: 490 tests passed, 2 skipped, strict coverage (48 designed, 0 gaps, 2 out of scope) and strict references.

**Deviations from the plan, all deliberate:**

- **T007**: fonts and the brand files the adult surfaces need are *copied* into `shared/` by `build-site.mjs` (and checked with `--check`), not moved. The app keeps its own copies.
- **T009**: the app does not read `shared/sample-family.json` at runtime. The build fails if Ama's events differ from `KC.sample` in the app, which keeps one family everywhere without coupling the app to `shared/`.
- **T013 and the manifests**: the four screen manifests are hand-maintained and verified by `routes.spec.mjs` and `check-coverage.mjs`, not generated.
- **T022**: the band missions come from the client's content deck (7–9 Birthday Party budget, 10–12 Clothing Brand funding, 13–15 Side Hustle simulator), not the placeholder names used in the plan. See `docs/design/mission-extracts/`.
- **App code**: the band engine and the parent area live in new files `prototype/assets/screens-bands.js` and `screens-parent.js`.

**Left open (need a person, not code):**

- ~~T055, T082~~: done afterwards: screenshots are in `docs/design/img/round5/` and results are in `docs/design/round5-review.md` (Q4–Q8 are automated only; Q10 is not run).
- **T083**: the three-person share test and the parent tests (SC-003, SC-004, SC-007) have not been run.
- **T084**: the developer has not yet opened the linked Dribbble shots and countersigned the originality review.
- **T086**: review the diff, then commit, push, deploy and open the PR (nothing is committed or pushed).

**Known limits:** the app's wallet and progress charts are the same across bands (only the Continue route, empty-state lines and button size are band-aware); new narration lines show as "Recording pending" because no audio was generated; the 004 saved-progress schema in `specs/004-prototype-round-2/contracts/` still says `b4_6` only; parent views on the Parent Dashboard are not hard-gated.
