# Contract: CI, Deploy and Smoke Check (1.0.0)

**Spec**: FR-034–FR-040 · **Research**: R1, R13, R14

## 0. Precondition (T001, confirm-first)

Before any workflow or Pages setting is created:

1. Read the account plan and the Pages availability for `Emt-tz/Kudicubs`.
2. If Pages for this private repository isn't available, **stop** and present research R1's
   options. The repository is **never** made public without explicit consent.
3. Enabling Pages (source: GitHub Actions) is outward-facing, so **ask first**.

## 1. `.github/workflows/prototype-ci.yml`

| | |
|---|---|
| Trigger | `pull_request` (all branches), plus `workflow_dispatch` |
| Runner | `ubuntu-latest`, Node 22 |
| Steps | checkout → `npm ci` (in `tools/design`) → `npx playwright install --with-deps chromium webkit` → install `ffmpeg` if `ffprobe` is missing → `npm run check` |
| `npm run check` | `build-tokens` → `check-contrast` → `check-brand --art` → `check-no-tts` → `check-tokens-usage` → `build-narration --check` → `check-audio` → `build-sw --check` → `playwright test` |
| Artifacts | the Playwright report and screenshots, uploaded on failure |
| Result | a pass/fail check on the PR (FR-040) |

The tests run against `tools/design/serve.mjs`, a static server for `prototype/` on
`127.0.0.1:4173`, started by Playwright `webServer`. Any 4xx/5xx response or failed request is
recorded (FR-041).

## 2. `.github/workflows/prototype-pages.yml`

| Job | Does | Needs |
|---|---|---|
| `build` | Writes `prototype/assets/data/build-info.js` (`version` from `KC.version`, `builtAt` = today UTC, `commit` = short SHA), then `actions/upload-pages-artifact` with `path: prototype` | — |
| `deploy` | `actions/deploy-pages` (environment `github-pages`) | build |
| `smoke` | `npx playwright test smoke.spec.mjs` with `SMOKE_URL` = the deploy's page URL | deploy |

- **Trigger**: `push` to `main`, plus `workflow_dispatch`.
- **Permissions**: `pages: write`, `id-token: write`, `contents: read`.
- **Concurrency**: `pages`, with in-progress runs cancelled.

## 3. Smoke check (`tools/design/tests/smoke.spec.mjs`, FR-038)

1. Load `SMOKE_URL`, and wait for `#kc-screen[data-screen="welcome"]` (the app started).
2. There must be no console errors and no failed requests while loading.
3. Every path in the generated `sw.js` file list, and every `file` in `KC.audioManifest`, must
   return 200 on a `GET`.
4. `<meta name="robots" content="noindex, nofollow">` must be present (FR-036).
5. The reviewer menu must show the deployed version and build date (FR-037).

If any check fails, the job fails, and the failing URLs are listed in the job summary.

## 4. Live URL

Expected: `https://emt-tz.github.io/Kudicubs/` (confirmed after the first deploy). It goes into
`docs/design/README.md` and `quickstart.md` (FR-039), and it replaces the tunnel link in
`docs/design/review-guide.md`.
