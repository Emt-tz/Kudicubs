# Research: Complete UI/UX and Prototypes for the Mobile App, Website and Dashboard

**Spec**: [spec.md](./spec.md) · **Plan**: [plan.md](./plan.md)

No `NEEDS CLARIFICATION` markers remained in the spec. These are the design decisions the plan needed.

## R1. How to prove "no missed journey or story"

- **Decision**: A JSON journey map (`docs/design/journey-map.json`) is the source of truth. Each row
  has an id, source story (001 or 005), platform, actor, priority, status (`designed`, `gap`,
  `out-of-scope`) and screen links. `check-coverage.mjs` validates it against a schema, resolves
  every screen link to a real route in that platform's manifest, fails if any in-scope row is a gap
  or is unlinked, and fails if a 001 story id or 005 story id is missing from the map. A markdown and
  HTML view are generated from it.
- **Rationale**: A human-edited table drifts. A checked file makes the claim testable (SC-001).
- **Alternatives**: A spreadsheet (not checked, hard to review in a PR); a Figma-only index (not in
  the repo, cannot be CI-checked).

## R2. Where and how to build the prototypes

- **Decision**: Static HTML, CSS and classic scripts for all four surfaces, extending the existing
  approach. No framework, no bundler.
- **Rationale**: The 002–004 prototype works this way, passes its checks, and opens from `file://`.
  One approach for every surface keeps the share set simple and the checks reusable.
- **Alternatives**: A framework such as React for the dashboards (adds a build chain and a second
  way of working for a prototype); Figma prototypes (not testable in CI, cannot show real state
  such as the sample family, and the repo has no Figma workflow).

## R3. One stable link for three platforms, without breaking the current link

- **Decision**: The existing `https://emt-tz.github.io/Kudicubs/` becomes the hub. The mobile app
  moves to `/app/`, with `/website/` and `/dashboard/` beside it. `build-site.mjs` assembles `dist/`
  and the Pages workflow publishes that folder. The old root service worker is retired by a small
  root `sw.js` that unregisters itself and clears the old cache, so returning visitors are not stuck
  on the old app. A visit to the root that carries the old hash routes forwards to `/app/` with the
  same hash.
- **Rationale**: SC-009 needs one link that never changes. The hub is the only place a three-part set
  can be introduced.
- **Alternatives**: Keep the app at root and put the hub elsewhere (the shared link would then show
  only the app); three separate links (violates FR-023).

## R4. Content for the 7–9, 10–12 and 13–15 missions

- **Decision**: Use the first mission of each world from `docs/source/BIZ KIDS Content.pptx`
  (extracted to text during the first task and kept under `docs/design/mission-extracts/`). Each is
  built from the six existing screen types, with the band's reading level, number of variables and
  time pressure taken from `age-band-rules.md`. Missions are data files, so the engine is unchanged.
- **Rationale**: Uses the client's own curriculum and keeps the structure the same across bands
  (Constitution IV).
- **Alternatives**: Invent missions (risks diverging from the client's content); build every mission
  (the full list is MVP scope in 001, not this design round).

## R5. Dashboard visuals

- **Decision**: Hand-built inline SVG and CSS for skill bars, the activity strip and the level ring.
  No chart library.
- **Rationale**: No new dependency, full control of the brand colours and contrast, works offline and
  from `file://`, and the data is a fixed sample.
- **Alternatives**: A chart library (new dependency and licence check for a few simple shapes).

## R6. One sample family across surfaces

- **Decision**: `shared/sample-family.js` defines one fictional family: two parents' view and three
  children, one in each of several bands and at least two regions, with their events. The app's
  "Load sample data" and the dashboard both read it. The file is built from one JSON source so the
  numbers agree everywhere.
- **Rationale**: FR-025 and SC-007; the reviewer sees the same child in the app and on the dashboard.
- **Alternatives**: Separate samples per surface (numbers would disagree and confuse reviewers).

## R7. Design system for adult surfaces

- **Decision**: Keep `tokens.json` as the only source. Add adult components to
  `shared/adult-components.css`: top navigation, side navigation, table, form fields, card, tabs,
  stat tile, chart shell, empty state, toast, modal. Adult surfaces use a smaller type scale and
  denser spacing, selected by a `data-surface="adult"` attribute, from the same tokens.
- **Rationale**: Same brand, different density (spec Story 6). No second token set to keep in sync.
- **Alternatives**: A separate adult token set (two sources of truth).

## R8. Responsive behaviour

- **Decision**: Mobile-first CSS with three breakpoints (≥ 640, ≥ 1024, ≥ 1280 px). Playwright runs
  each surface at 320, 768 and 1280 px and fails on horizontal overflow.
- **Rationale**: SC-008 as a test, not a review opinion.
- **Alternatives**: Visual review only.

## R9. Gallery research (Dribbble and similar)

- **Decision**: Browse public pages only, in the browser tools, for patterns: a parent-facing
  finance-for-kids landing page, family dashboards, progress charts, empty states and OTP sign-in.
  Record each in `references.json` (link, platform, pattern, screen influenced, how we differ,
  verdict). Do not save screenshots or assets. Reject dark patterns, streak-shaming, urgency timers
  and real-money imagery.
- **Rationale**: Gives the client "the best of what exists" while keeping the originality rule from
  002 and the child-safety principle. `check-references.mjs` fails when a screen cites a missing
  entry or when an entry lacks a "differs" note.
- **Alternatives**: Download shots into the repo (copyright and originality risk); skip research (misses
  the client's request).

## R10. Parent sign-in on the web without a real back end

- **Decision**: A scripted demo. Any email on the sample family accepts the fixed demo code shown on
  the screen's reviewer note. Wrong, expired and resend states are triggered by named reviewer
  inputs. No real email is sent and nothing is validated against a server.
- **Rationale**: Designs the full flow without production code (spec assumption).
- **Alternatives**: A mock server (production-like code is out of scope).

## R11. Team Console privacy by design

- **Decision**: Role is chosen in a reviewer menu (support, content). Support views render
  nicknames, age band, region and last-active only. No emails or full names exist in the sample for
  children.
- **Rationale**: FR-018 and Constitution V.
- **Alternatives**: Show all fields and rely on policy (violates minimal data).

## R12. Versions, release and workflow

- **Decision**: Prototype and tokens go to 0.4.0; the new JSON contracts start at 1.0.0. The
  `prototype-ci` workflow runs the extended `npm run check`; the `prototype-pages` workflow publishes
  `dist/`. The temporary deploy-from-004 rule is switched to the 005 branch until it reaches `main`.
  No store upload happens, so the fastlane rule does not apply. The release blocker RB-1 (scratch
  voice) is unchanged.
- **Rationale**: Reuses the pipeline the client already trusts.
- **Alternatives**: A second pipeline per surface (more to maintain, more links).
