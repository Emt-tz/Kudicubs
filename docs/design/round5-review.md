# Round 5 (spec 005) Review Record

**Version**: prototype and tokens 0.4.0 · **Date**: 2026-11-20 · **Branch**: `005-platform-ux-prototypes`

This records what was checked against `specs/005-platform-ux-prototypes/quickstart.md`, and what still
needs a person. Screenshots are in `img/round5/` (regenerate with `tools/design/capture-round5.mjs`).

| Quickstart | What it checks | Result | How |
|---|---|---|---|
| Q1 | Every automated check | **Passed**: `npm run check:strict`, 490 passed, 2 skipped | Automated |
| Q2 | Coverage is complete (SC-001) | **Passed**: 48 designed, 0 gaps, 2 out of scope on purpose, 15 of 15 stories | `check-coverage --strict` |
| Q3 | Build and preview the whole set | **Passed**: hub, app, website and dashboards serve from one `dist/` | Automated and a manual load of each surface |
| Q4 | Mobile app, all bands (SC-002) | **Automated only**: every band reaches reward, wallet, progress and profile; 4–6 shows no failure; 7–15 offers a retry and loses nothing earned; region changes coins and examples | `bands.spec`, `regions.spec`. No timed human run yet |
| Q5 | Parent area on the phone | **Automated only**: wrong PIN, lock-out, recovery, new-device code, device mode, delete confirm | `parent-area.spec` |
| Q6 | Website (SC-003, SC-008) | **Automated only**: no overflow at 320, 768 and 1280, download routes, FAQ, contact states, legal pages | `website-flows.spec`, `touch-size`, `contrast` |
| Q7 | Parent Dashboard (SC-004) | **Automated only**: states, currency per child, derived numbers equal the app's. The 90-second parent test has **not** been run | `dashboard-flows.spec` |
| Q8 | Team Console | **Passed** in automation: support sees nicknames only; content cannot open families | `team-roles.spec` |
| Q9 | References and originality (SC-006) | **Partly passed**: the record validates. The developer's visual check and countersign are **pending** | `check-references --strict` |
| Q10 | Share test (SC-007, SC-009) | **Not run**: needs three people who have not seen the project | Person |

## Still needs a person

- Open each linked gallery shot once, then countersign the originality review in `design-references.md`.
- Run Q10 and the SC-003 and SC-004 tests with real parents, and record the findings here.
- Listen to a child try the 7–15 missions (optional, see `child-session-protocol.md`).

## Known limits

- The app's wallet and progress charts are the same in every band.
- New narration lines show "Recording pending" because no audio was made; the scratch voice (RB-1) still blocks a public release.
- Parent Dashboard views open without signing in (a labelled reviewer shortcut); the Team Console is gated by role.
- The Team Console page loads the whole fictional sample family file; support views just do not render the extra fields.
- The 004 saved-progress schema in `specs/004-prototype-round-2/contracts/` still lists `b4_6` only.
