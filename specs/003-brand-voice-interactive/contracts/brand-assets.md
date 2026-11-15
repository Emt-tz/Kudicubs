# Contract: Brand Assets & Usage (1.0.0)

**Source**: `docs/source/KudiCubs Brand.pdf` (client brand guide).

**Extracted by**: `tools/design/extract-brand-assets.mjs` (research R1). It is repeatable and never
redraws anything.

## Files (`prototype/assets/brand/`)

| File | From | Use | Never |
|---|---|---|---|
| `logo-on-white.svg` (+ `.png`) | Guide p.2, vector, viewBox-cropped | Welcome, loading, the header on cream or white | Recolour, stretch, crop into the artwork, or re-typeset |
| `logo-on-yellow.svg` (+ `.png`) | Guide p.3, left panel | Splash and app icon on Sunshine Yellow. **⚠ B1**: its white tagline is 1.51:1 (logo-exempt); prefer the other versions where possible. | Place on anything other than Sunshine Yellow |
| `logo-on-brown.svg` (+ `.png`) | Guide p.3, right panel | Parent area, reviewer menu, dark headers | Place on anything other than Mane Brown |
| `kudi-wave.webp` (640 px; + 320 px `.png` fallback) | Guide p.4, image 1 (raises the K coin) | `wave`: greeting; the base pose | Mirror or tint |
| `kudi-celebrate.webp` (+ `.png`) | Guide p.4, image 2 (wink, sparkling coin) | `celebrate`, **provisional for "peace sign"** (⚠ B2) | — |
| `kudi-headphones.webp` (+ `.png`) | Guide p.4, image 3 | `headphones`: while a line plays | — |
| `kudi-fist.webp` (+ `.png`) | Guide p.4, image 4 | `fist`: encourage, try again, idle hint | — |
| `kudi-thumbs-up.webp` (+ `.png`) | Guide p.4, image 5 | `thumbs-up`: correct | — |
| `app-icon-192.png`, `app-icon-512.png` | Rendered from `logo-on-yellow.svg` (the cub and coin only, on Sunshine Yellow; FR-009 exception, **⚠ B11**) | Web manifest icons | Redraw or recolour; if B11 is declined, render the full yellow logo instead |
| `SOURCES.md` | — | Records the page, image index, extraction command and SHA-256 of every file | — |

## Rules

- **Scaling only in proportion.** Mascots: at least 96 px tall, at most 320 px. Logo: at least
  120 px wide.
- **Clear space**: at least the height of the "K" coin around the logo.
- **One Kudi per screen**, facing the content. Kudi never covers the main action, a choice or a
  coin.
- **Placeholder art from 002**:
  - Remove: `prototype/assets/art/kudi/*.svg` and the old `icon-*.png`.
  - Keep, as placeholders and recoloured only through tokens: avatars, scenes, coins, icons.
- **Master files** (vector logo, transparent mascots) are requested from the client for production
  (⚠ B8). When they arrive, the extract script is replaced by a copy step. File names stay the
  same.
