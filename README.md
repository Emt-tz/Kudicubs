# KudiCubs

KudiCubs is a family financial-literacy game for children aged 4–15. Kudi the Cub guides
children through short, playful missions about earning, saving, spending and sharing, with
coins from Ghana, Nigeria or the UK. A parent area sits behind a grown-up gate.

**Status**: specifications and a clickable design prototype. **There is no production app code
yet.** The Flutter app is specified in `specs/001-kudicubs-mvp/`.

## Live demo

**Prototype (v0.3.0)**: *(the stable link is added here after the first GitHub Pages deploy;
see `specs/004-prototype-round-2/contracts/ci-and-deploy.md`)*

- Use it on a phone in portrait, with the sound on.
- Hold the KudiCubs logo for 2 seconds to open the reviewer menu (country, voice, jump to a
  screen, Load sample data, Restart).
- The site is kept out of search engines (`noindex, nofollow`).

## What's here

| Path | What it is |
|---|---|
| `specs/` | Spec Kit features: 001 MVP architecture, 002 design system and prototype, 003 client round 1, 004 prototype round 2 |
| `prototype/` | The clickable prototype: static HTML, CSS and classic scripts. It works from `file://` or any static host |
| `docs/design/` | The design system: tokens, components, brand, narration script, voice brief, review guide |
| `tools/design/` | Generators, checks and Playwright tests for the design system and prototype |
| `scripts/generate-scratch-voice` | Makes the temporary scratch voice track (see RB-1 below) |
| `.github/workflows/` | `prototype-ci` runs every check on each pull request; `prototype-pages` publishes the prototype on merge to `main` |

## Run the checks

```bash
cd tools/design
npm ci && npx playwright install chromium webkit   # first time (needs ffmpeg for ffprobe)
npm run check     # tokens, contrast, brand, no-TTS, token usage, narration, audio, sw.js, all Playwright tests
npm run serve     # local preview on http://127.0.0.1:4173/
```

## Release blocker

> **RB-1**: the prototype's scratch voice is pre-generated AI audio, used only for demos. It must
> be replaced by human recordings before any public release
> (`node tools/design/check-no-tts.mjs --release`). Live or browser speech synthesis is never
> used.
