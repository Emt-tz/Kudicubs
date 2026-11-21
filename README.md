# KudiCubs

KudiCubs is a family financial-literacy game for children aged 4–15. Kudi the Cub guides
children through short, playful missions about earning, saving, spending and sharing, with
coins from Ghana, Nigeria or the UK. A parent area sits behind a grown-up gate.

**Status**: specifications and a clickable design prototype. **There is no production app code
yet.** The Flutter app is specified in `specs/001-kudicubs-mvp/`.

## Live demo

**Design set (v0.4.0)**: **https://emt-tz.github.io/Kudicubs/**

The link opens a hub with three platforms: the mobile app (`/app/`), the website (`/website/`) and the dashboards (`/dashboard/`). Old links that end in `#/home` are forwarded to the app.

It is published automatically by `prototype-pages` on every merge to `main`. The reviewer menu
shows the version, build date and commit.

- Use it on a phone in portrait, with the sound on.
- Hold the KudiCubs logo for 2 seconds to open the reviewer menu (country, voice, jump to a
  screen, Load sample data, Restart).
- The site is kept out of search engines (`noindex, nofollow`).

## What's here

| Path | What it is |
|---|---|
| `specs/` | Spec Kit features: 001 MVP architecture, 002 design system and prototype, 003 client round 1, 004 prototype round 2, 005 complete UI/UX and prototypes for the app, website and dashboards |
| `prototype/` | The mobile app prototype (published at `/app/`): static HTML, CSS and classic scripts. It works from `file://` or any static host |
| `website/` | The parents' website prototype (published at `/website/`) |
| `dashboard/` | The Parent Dashboard and the Team Console prototypes (published at `/dashboard/`) |
| `hub/` | The share hub, published at the root |
| `shared/` | Tokens, adult-surface components, brand files and the one fictional sample family used by every surface |
| `docs/design/` | The design system: tokens, components, brand, narration script, voice brief, review guide |
| `tools/design/` | Generators, checks and Playwright tests for the design system and prototype |
| `scripts/generate-scratch-voice` | Makes the temporary scratch voice track (see RB-1 below) |
| `.github/workflows/` | `prototype-ci` runs every check on each pull request; `prototype-pages` publishes the prototype on merge to `main` |

## Run the checks

```bash
cd tools/design
npm ci && npx playwright install chromium webkit   # first time (needs ffmpeg for ffprobe)
npm run check     # tokens, contrast, brand, no-TTS, token usage, narration, audio, sw.js, all Playwright tests
npm run serve     # the app only, on http://127.0.0.1:4173/
npm run serve:site # the whole set (hub, app, website, dashboards) on http://127.0.0.1:4173/
npm run coverage  # journey and story coverage map (docs/design/journey-map.md)
npm run check:strict # the full check with strict coverage and references
```

## Release blocker

> **RB-1**: the prototype's scratch voice is pre-generated AI audio, used only for demos. It must
> be replaced by human recordings before any public release
> (`node tools/design/check-no-tts.mjs --release`). Live or browser speech synthesis is never
> used.
