# Contract: Validation Suite (1.0.0)

**Spec**: FR-027, SC-001, SC-005, SC-006, SC-008 · **Extends** 004 `contracts/validation-suite.md`

`npm run check` in `tools/design` keeps every existing step and adds these.

| Step | Script | Fails when |
|---|---|---|
| Journey map valid | `check-coverage.mjs` | The map does not validate against `journey-map.schema.json`; a story id in `stories` is missing from every row; an in-scope row is a `gap`; a screen link does not resolve in its manifest; a named state is not listed |
| Manifests current | `build-site.mjs --check` | A manifest differs from what the screen registries would generate |
| References valid | `check-references.mjs` | `references.json` does not validate; a screen cites an unknown `REF-` id; an `adopted` or `adapted` entry has no `differs`; no review round exists |
| Brand and tokens on new surfaces | existing `check-brand`, `check-tokens-usage`, `check-contrast` | Scope widened to `website/`, `dashboard/`, `hub/` and `shared/`; any off-palette colour, off-system font or low contrast |
| Per-surface tests | Playwright | See below |

## Progress and strict modes

`check-coverage`, `check-references` and `build-site --check` run in **progress mode** during the
build (they print gaps and warnings and exit 0 on gaps only; schema, broken-link and unknown-id
errors still fail). `npm run check:strict` runs them with `--strict`, where any in-scope gap or
missing review fails. CI switches to `check:strict` in the last phase (task T080).

Added specs: `touch-size` (44 px adult, 48 px child), `no-tracking` (website and dashboards: no
external request, cookie, analytics or child-data field), `perf-offline` (first screen, page weight,
app offline reload).

## Playwright coverage

| Spec | Surfaces | Asserts |
|---|---|---|
| `routes` | all | Every manifest id loads, no console error, no failed request |
| `overflow` | website, dashboards, hub, app | No horizontal overflow at 320, 768 and 1280 px (app at 360 and 390 only) |
| `bands` | app | For each band: reach reward, wallet, progress and profile; 4–6 never shows a failure; 7–15 offers retry and loses nothing earned |
| `regions` | app, dashboard | Coins and examples change by region; dashboard shows each child's own currency |
| `parent-area` | app | Wrong PIN, lock-out, recovery, new-device code, device mode, delete confirm |
| `website-flows` | website | Download route per platform, FAQ, contact states, sign-in leads to dashboard |
| `dashboard-flows` | dashboard | OTP wrong/expired/resend, overview, new-family empty, child view, settings, data export and delete confirm |
| `team-roles` | team | Support sees nicknames only; content cannot open family views; no-access state |
| `hub` | hub | Cards, role lists from the map, release values match `release.json`, old hash links forward |
| `consistency` | all | Sample-family values match across the app's sample data and the dashboard |
| `noindex` | all | Every page has `noindex, nofollow`; `robots.txt` disallows all |

## Release gate

`check-no-tts --release` (RB-1) is unchanged and still blocks a public release while scratch audio is
present.
