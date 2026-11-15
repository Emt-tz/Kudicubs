# Implementation Plan: Client Feedback Round 1: Official Brand, Natural Voice, More Interaction

**Branch**: `003-brand-voice-interactive` (from `002-ux-prototype` @ `c83436c`) | **Date**:
2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification `specs/003-brand-voice-interactive/spec.md` (FR-001–FR-046) and
the client's brand guide `docs/source/KudiCubs Brand.pdf`.

**Artifacts**:

- [research.md](./research.md) (R1–R13)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/): `narration-lines.schema.json`, `audio-manifest.md`,
  `interaction-moments.md`, `brand-assets.md`, `tokens.schema.json` (1.2.0, extends the 002
  version with `$extensions` and `rejectedPairs`)
- [quickstart.md](./quickstart.md) (W1–W14)

No `tasks.md` yet.

## Summary

Round 1 updates the 002 prototype in place to version **0.2.0**. There is still no production
app code. The work comes in three parts, plus a summary for the client.

**1. Official brand**

- The logo and the five mascot poses are **extracted from the guide without redrawing**: a
  vector viewBox crop for the logo, and each mascot image recombined with its mask and scaled in
  proportion.
- `tokens.json` v0.2.0 replaces the placeholder palette:
  - the exact brand colours, checked against the guide
  - recorded derived pressed, secondary-text and locked shades (pending approval)
  - a separate success green, `#16793A`, also pending approval
- Contrast failures are resolved without changing any brand colour: Mane Brown text everywhere,
  and Mane Brown outlines and coin rims, as the guide already recommends.
- The prototype is re-skinned through tokens only.

**2. Natural human voice**

- All text-to-speech is removed.
- `docs/design/narration/lines.json` is the source for every line. It generates the voice
  actor's script and a per-language audio manifest that scans for `<lineId>.m4a` files.
- Lines with no recording show their caption with a "Recording pending" badge. There is no
  synthetic fallback.
- A voice direction brief covers casting a Ghanaian English female storyteller (provisional).

**3. More interaction**

- Every screen gets child actions that never navigate (`data-child-action`): tap-to-hear,
  call-and-response answers, drag-to-sort with a count per coin, and tap-to-finish animations.
- Kudi reacts to every action with the mapped pose.
- Sound effects are generated tones, never speech.
- Every screen gets a replay button.

**4. Before/after summary for the client**, generated from tag `prototype-v0.1.0` against the
current prototype.

**5. Clean-up from the 002 code review**: FR-033–FR-046, done while these files are rewritten.

## Technical Context

| Item | Value |
|---|---|
| **Language/Version** | Same as 002: HTML5, CSS custom properties, ES2020 classic scripts (they must work from `file://`). Node.js 20+ for the tools. Python 3 with Pillow, through `uv`, for mask recombination only. |
| **Primary Dependencies** | Prototype: none (Web Audio API and `HTMLAudioElement` are built into the browser). Tools: `@playwright/test`, `ajv` (as 002), poppler `pdfimages` and `pdftocairo`, Pillow, and `ffmpeg` (optional, for encoding masters). |
| **Storage** | None. `sessionStorage` holds preferences: `region`, `sound`, `notes`, plus the new `voiceLang` (the reviewer's language override). Recorded audio files live in `prototype/assets/audio/<lang>/`. |
| **Testing** | 002 checks, plus `check-brand.mjs`, `check-no-tts.mjs`, `build-narration.mjs --check`, and an extended `flow.spec.mjs` (interaction-moments §6). Manual scenarios W1–W14. |
| **Target Platform** | Same as 002: iOS Safari 15+, Android Chrome, and desktop browsers inside a phone frame |
| **Project Type** | Static design prototype and design documentation, still not app code |
| **Performance Goals** | Tap feedback (pose, sound, caption) ≤ 100 ms. Recorded line starts ≤ 300 ms after a tap. Screen render ≤ 50 ms with 4× CPU throttling. |
| **Constraints** | Never synthetic speech. Brand values never altered. No hard-coded colours. Works offline. Size ≤ 8 MB including future recordings (≤ 3 MB without them). |
| **Scale/Scope** | 13 screens (17 including sub-screens). About 80 narration lines × 3 language slots. 5 poses, 3 logo versions, 6 sound effects. About 14 interaction moments plus call-and-response on 4 screens. 46 functional requirements. |

There are no NEEDS CLARIFICATION items. FR-003 (Warm Cream) and FR-021 (recording language) have
provisional answers and are listed as open client decisions (B4, V1). They don't block the design:
each is a single token or manifest value.

## Constitution Check

*GATE: must pass before Phase 0, and is re-checked after Phase 1.*

**Constitution v1.0.0**

| Principle | Pre | Post-design evidence |
|---|---|---|
| I. Child-First Flow | ✅ | Child actions never navigate and are never `data-primary`, so there is still exactly one main action at a time (interaction-moments §1). Replay is on every screen. Actions are enabled at render. |
| II. Learn by Doing | ✅ ↑ | Call and response, drag-to-sort, and tap-to-hear on every screen move the experience from listening to doing (R9) |
| III. Failure Is Safe | ✅ | Try again uses `fist` and a soft boop. There is no buzzer and no `data-failure` (asserted). Reactions to call-and-response answers are always kind. |
| IV. Age-Adaptive | ✅ | The prototype is still 4–6. The band rules are unchanged. |
| V. Child Safety & Privacy | ✅ | No new data is collected. Answers stay in page memory and are never stored. Recordings are human, with written actor consent (R7). No voice cloning (FR-020). |
| VI. Localised by Configuration | ✅ | Coin names, currency and market examples are region-specific lines (FR-033, FR-034). The audio manifest is keyed by language, and language is chosen per region. FR-046 externalises screen-reader text. |
| VII. Pre-Reader Accessible | ⚠️ **PASS with note** | Every prompt is narrated by human recordings. **Until they are recorded, lines show captions with "Recording pending"**, and pre-readers can't use captions. The constitution is met at the design level. **Child sessions (002 US5) must wait for the recordings.** Flag N1. |
| Workflow | ✅ | Version 0.2.0 for both the prototype and the tokens. Tag `prototype-v0.1.0`. Commits authored by you. One PR per feature. Fastlane doesn't apply. |

**Gate result: PASS** before and after design. There are no violations, so there is no
Complexity Tracking.

### Flags

| # | Flag | Resolution in the design | Owner |
|---|---|---|---|
| **B1** | The approved yellow logo's tagline is white on Sunshine Yellow (1.51:1) | Logos are exempt from WCAG 1.4.3, so it is used as supplied. The White and Mane Brown versions are preferred. | Client |
| **B2** | **No peace-sign pose** among the five supplied poses | The "wink with a sparkling coin" pose is used for `celebrate`, provisionally | Client |
| **B3** | Success green `#16793A` is not in the palette | Proposed and marked pending. Used only on cream or white (4.51:1 on Peach is too close to the limit). | Client |
| **B4** | Warm Cream `#FEF5E0` | Provisional (FR-003). It is one token. | Client |
| **B5** | Charcoal `#231F20` | Assumed, and reserved. It is not used for UI. | Client |
| **B6** | Derived shades (pressed, secondary text, locked) | Recorded with their rule and marked `needsApproval` | Client |
| **B7** | Product name: KudiCubs, Kudicubs or Kudicub's | In-product text stays "KudiCubs" until decided | Client |
| **B8** | Master files are needed | For now, extracted by script from the guide | Client |
| **B9** | UI font proposal (FR-012) | Baloo 2 and Nunito (OFL) kept; pairing rationale in research R4 and `brand.md` | Client |
| **B10** | Illustration palette for placeholder art (FR-047) | Recorded `color.illustration.*` tokens marked `needsApproval`; checked by `check-brand.mjs --art` | Client |
| **B11** | App icon is the cub-and-coin crop of the yellow logo (FR-009 exception) | Cropped by frame only from `logo-on-yellow.svg`, nothing redrawn; the full logo is unreadable at 192 px | Client |
| **V1** | First recording language | Ghanaian English (provisional, FR-021). The manifest already has slots for en-NG and en-GB. | Client |
| **N1** | Pre-readers need real recordings | Captions are a reviewer aid only. Child sessions wait until recordings exist. | Team |

## Decision log (full text in research.md)

| Decision | Rejected | Ref |
|---|---|---|
| Extract the logo (vector viewBox crop) and the poses (recombine each image with its mask, scale in proportion) by a repeatable script | Tracing; screenshots; waiting for master files | R1 |
| Pose mapping, with "wink + sparkle coin" as celebrate (provisional) | Generating a peace-sign pose (forbidden) | R2 |
| Exact brand tokens plus recorded derivations and a pending success green. Resolve failures with Mane Brown text, outlines and rims. | Darkening brand colours; reusing the old green | R3 |
| Keep Baloo 2 and Nunito (OFL) for the UI. Sobas Play and Skia appear only inside the logo artwork. | Fredoka; licensing Sobas Play; Skia for the UI | R4 |
| `lines.json` generates the script and the per-language manifest (by scanning audio files). Play by line ID; caption fallback; no text-to-speech. | Web Speech or cloud TTS; voice cloning; one file per screen; a hand-written manifest | R5 |
| WAV masters, then `.m4a` AAC, 64 kbps, mono | MP3; Opus | R6 |
| A voice direction brief with tone-only reference, pronunciation, delivery examples and actor consent | — | R7 |
| Web Audio generated tones for sound effects | CC0 libraries; recorded sound effects | R8 |
| `data-child-action` hook; actions never navigate; enabled at render | Locking taps during narration; auto-advance | R9 |
| Drag first, tap fallback, per-coin count badge | Tap only | R10 |
| Tag `prototype-v0.1.0`; capture before and after from a git worktree | Hand-made screenshots | R11 |
| New checks: brand, no-TTS, narration length; extended flow test | Manual only | R12 |
| Versions 0.2.0; remove the placeholder Kudi; budget raised to 8 MB with audio | — | R13 |

## Project Structure

### Documentation (this feature)

```text
specs/003-brand-voice-interactive/
├── spec.md · plan.md · research.md · data-model.md · quickstart.md
├── contracts/
│   ├── narration-lines.schema.json
│   ├── audio-manifest.md
│   ├── interaction-moments.md
│   └── brand-assets.md
├── checklists/requirements.md
└── tasks.md                       # /speckit-tasks (not created yet)
```

### Deliverables (changes to the 002 layout)

```text
docs/design/
├── tokens.json / tokens.md          # CHANGED → v0.2.0 brand palette, derivations, pairs + rejectedPairs
├── contrast-report.md               # NEW (generated): every pairing, ratio, pass/fail, resolution
├── brand.md                         # NEW: logo versions, clear space, pose mapping, brand rules, open decisions
├── components.md                    # CHANGED: re-skinned + 3 new components (replay-button, narration-caption, count-badge)
├── kudi-the-cub.md                  # CHANGED: 5 supplied poses, state mapping; placeholder drawings removed
├── design-references.md             # CHANGED: palette and Kudi sections updated to the official brand
├── narration/lines.json             # NEW: source of truth for every spoken line
├── narration-script.md              # NEW (generated): the voice actor's script
├── voice-direction-brief.md         # NEW: casting and recording brief
├── round1-before-after.md           # NEW (generated + notes): the client summary
├── round1/{before,after}/*.png      # NEW (generated screenshots)
└── round1/notes.json                # NEW: per-screen change notes (brand/voice/interaction)

prototype/
├── index.html                       # CHANGED: logo, replay button in the header, caption slot
├── manifest.webmanifest / sw.js     # CHANGED: brand icons; generated cache list (FR-044)
└── assets/
    ├── brand/                       # NEW: logo-on-{white,yellow,brown}.svg/.png, kudi-{wave,celebrate,fist,thumbs-up,headphones}.webp/.png, app-icon-*.png, SOURCES.md
    ├── audio/{en-GH,en-NG,en-GB}/   # NEW: empty except .gitkeep and README (recordings dropped here)
    ├── data/audio-manifest.js       # NEW (generated)
    ├── data/mock-data.js            # CHANGED: narration text moves to lines.json; strings_<region>; aria/alt strings (FR-046)
    ├── app.js                       # CHANGED: TTS removed → KC.voice; KC.sfx; KC.kudiReact; KC.coinImg; keypad and single-select helpers
    ├── screens.js / activities.js   # CHANGED: child actions, call-and-response, drag-first sort with count badges, choice table, no magic 8
    └── art/kudi/                    # REMOVED (placeholder Kudi)

tools/design/
├── extract-brand-assets.mjs         # NEW
├── build-narration.mjs              # NEW (+ --check)
├── encode-audio.mjs                 # NEW (optional; needs ffmpeg)
├── check-brand.mjs                  # NEW
├── check-no-tts.mjs                 # NEW
├── build-sw.mjs                     # NEW (FR-044: generates the sw.js list + cache name from KC.version)
├── capture-before-after.mjs         # NEW
├── build-tokens.mjs / check-contrast.mjs   # CHANGED: $extensions, rejectedPairs, contrast-report.md
└── tests/flow.spec.mjs              # CHANGED: interaction-moments §6 + TTS stub + drop-in audio test
```

**Structure decision**: round 1 changes the 002 prototype in place, because it's the same product
demo. The "before" stays recoverable through the tag `prototype-v0.1.0` (FR-032). All brand
inputs come from the guide through scripts. All voice inputs come from `lines.json` through
scripts. Nothing generated is edited by hand.

## Complexity Tracking

There are no constitution violations, so no entries are needed.
