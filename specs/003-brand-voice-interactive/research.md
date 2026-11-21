# Research & Decisions: Client Feedback Round 1

**Feature**: `003-brand-voice-interactive` | **Date**: 2026-11-15 | **Plan**: [plan.md](./plan.md)

Each decision gives what was decided, why, what was rejected, and which requirements it serves.
Items marked **⚠ Flag** go to the client as open decisions; they are listed in the spec's "Open
decisions for the client".

---

## R1. Brand assets are extracted from the brand guide, not redrawn

- **Decision**:
  - **Logo**: export the three approved logo versions as **vector SVG** with `pdftocairo -svg`
    (guide page 2 is on White; page 3 has on Sunshine Yellow and on Mane Brown).
    - Each version is cropped **only by setting the SVG `viewBox`** to its own panel.
    - The artwork paths are untouched. The lettering is already outlined as glyph paths in the
      PDF, so no font is needed.
    - A PNG fallback is rendered from each SVG, at the original aspect ratio.
  - **Mascots**: the five poses on guide page 4 are raster images, each with a separate
    transparency mask.
    - They are extracted at full resolution (`pdfimages -png`) and each image is recombined with
      its own mask.
    - They are then scaled down **in proportion** to 640 px tall as WebP (used by the prototype), plus a
      320 px palette PNG fallback, so the prototype stays under its 3 MB budget. Nothing is painted, recoloured
      or re-posed.
  - The extraction is a repeatable script, `tools/design/extract-brand-assets.mjs`. The source
    PDF is the input and `prototype/assets/brand/` is the output.
- **Rationale**: FR-009 and FR-010 say never redraw, recolour or stretch, and never create new cub
  art. Cropping the viewBox and scaling in proportion keep the artwork exactly as supplied. A
  script makes the process repeatable when the client sends master files.
- **Rejected**:
  - **Tracing or redrawing the logo**: forbidden by FR-009.
  - **Screenshots of the PDF**: lossy and blurry on high-density phones.
  - **Waiting for master files**: blocks round 1. Master files are still requested for production
    (spec Assumptions).

## R2. Mascot pose mapping

Visual inspection of the five extracted images, in page order:

| # | What the image shows | Client mapping | Decision |
|---|---|---|---|
| 1 | Raises a "K" coin high in a waving gesture, open smile | wave = greeting | `wave` |
| 2 | Winks, raises a sparkling "K" coin | peace sign = celebrate | `celebrate`, provisional ⚠ |
| 3 | Wears headphones with a microphone, raises a "K" coin | headphones = narration playing | `headphones` |
| 4 | Fist pump, determined smile | fist = encourage | `fist` |
| 5 | Thumbs up with sparkle lines | thumbs up = correct | `thumbs-up` |

- **⚠ Flag B2**: **none of the five supplied poses shows a peace sign.** The closest match to
  "celebrate" is pose 2 (wink with a sparkling coin), so it is used for celebrate until the client
  confirms or supplies a peace-sign pose.
- **States not in the mapping**: the 002 states "think" (Decision), "point" (idle hint) and
  "idle" (long idle) have no pose of their own. Under FR-010 only these five may be used:
  - "think" (Decision) uses `wave`.
  - The idle hint uses `fist` (encourage), plus the pulsing ring on the main action.
  - Long idle uses `wave` (greeting the child back), as in 003 FR-038.

## R3. Palette, derived colours and contrast

- **Decision**: `docs/design/tokens.json` v0.2.0 replaces the whole placeholder palette.

  **Brand colours** come from the guide and are exact. They carry
  `$extensions.kudicubs.source = "brand-guide"`, and `check-brand.mjs` checks them against the
  guide.

  | Token | Hex | Guide role |
  |---|---|---|
  | `color.brand.sunshine_yellow` | `#FBCE16` | Main buttons |
  | `color.brand.mane_brown` | `#3E2312` | Headings, borders, outlines |
  | `color.brand.adventure_orange` | `#F68C1F` | Secondary buttons |
  | `color.brand.golden_orange` | `#FBAA19` | Coins and reward icons |
  | `color.brand.soft_gold` | `#FBE57E` | Character highlights |
  | `color.brand.peach_cream` | `#FCE6C6` | (supporting) |
  | `color.brand.warm_cream` | `#FEF5E0` | Main backgrounds. **⚠ Provisional** (FR-003) |
  | `color.brand.white` | `#FFFFFF` | Main backgrounds |
  | `color.brand.charcoal` | `#231F20` | Reserved; not used for UI text. **⚠ Assumed** |

  **Derived colours** are recorded with `$extensions.kudicubs.derivedFrom`, the mix rule, and
  `needsApproval`:

  | Token | Hex | Derivation | Purpose |
  |---|---|---|---|
  | `color.derived.yellow_pressed` | `#E4B916` | Sunshine Yellow + 12% Mane Brown | Main button pressed |
  | `color.derived.orange_pressed` | `#DA7C1D` | Adventure Orange + 15% Mane Brown | Secondary button pressed |
  | `color.derived.golden_pressed` | `#E49A18` | Golden Orange + 12% Mane Brown | Coin pressed and picked |
  | `color.derived.brown_80` | `#644D3B` | Mane Brown + 20% Warm Cream | Secondary text |
  | `color.derived.brown_60` | `#8B7764` | Mane Brown + 40% Warm Cream | Locked and disabled labels (large only) |
  | `color.derived.cream_shade` | `#F2E8D4` | Warm Cream + 6% Mane Brown | Card on cream, tray |
  | `color.derived.peach_shade` | `#EDD6B8` | Peach Cream + 8% Mane Brown | Pressed card |
  | `color.success.green` | `#16793A` | **Not a brand colour** (FR-007) | Success messages. **⚠ Pending approval** |

  The mix rule is the same everywhere: a straight sRGB mix with Mane Brown (to darken) or Warm
  Cream (to lighten). There are no new hues.

- **Contrast findings** (WCAG 2.x; computed 2026-11-15; checked again by `check-contrast.mjs`):

  | Pairing | Ratio | Status | Resolution |
  |---|---|---|---|
  | Mane Brown on Sunshine Yellow / pressed | 9.59 / 7.74 | ✅ | Main button label |
  | Mane Brown on Adventure Orange / pressed | 5.98 / 4.73 | ✅ | Secondary button label |
  | Mane Brown on Golden Orange | 7.47 | ✅ | Coin numerals |
  | Mane Brown on Warm Cream / White / Peach / Soft Gold | 13.31 / 14.44 / 11.88 / 11.42 | ✅ | Headings and body text |
  | `brown_80` on Warm Cream / Peach | 7.26 / 6.48 | ✅ | Secondary text |
  | `brown_60` on Peach (large text and icons) | 3.51 | ✅ (3:1) | Locked "Coming soon" |
  | `brown_40` on Warm Cream | 2.63 | ❌ | **Not used.** `brown_60` is the lightest allowed. |
  | Warm Cream, Soft Gold, Peach or Yellow on Mane Brown | 9.59–13.31 | ✅ | Parent area and reviewer menu |
  | Success green on Warm Cream / White / white text on it | 5.05 / 5.48 / 5.48 | ✅ | Success messages |
  | Success green on Peach | 4.51 | ✅ (barely) | **Avoided.** Success green is used only on cream or white. |
  | Sunshine Yellow shape vs Warm Cream | 1.39 | ❌ (3:1 non-text) | **Mane Brown 2 px outline** on every yellow control (FR-006) |
  | Adventure Orange shape vs Warm Cream | 2.23 | ❌ | Mane Brown 2 px outline |
  | Golden Orange coin vs Warm Cream / White | 1.78 / 1.93 | ❌ | Mane Brown rim on every coin and reward icon |
  | White on Sunshine Yellow / Adventure Orange | 1.51 / 2.42 | ❌ | **Never used** (FR-005) |
  | Adventure Orange text on Warm Cream | 2.23 | ❌ | **Never used as text.** Orange is a fill only. |
  | **White tagline on the yellow logo** | 1.51 | ❌, but logos are exempt (WCAG 1.4.3) | **⚠ Flag B1**: used as supplied; the White and Mane Brown versions are preferred |

- **No brand colour was changed.** Every failure is solved by a different brand pairing (Mane
  Brown text or outlines), or by not using that pairing. The only derived colours are pressed
  states, secondary text and locked text, all marked `needsApproval: true` for the client review.
- **Rejected**:
  - **Darkening Sunshine Yellow or the oranges** so white text works: that silently alters brand
    colours, which is forbidden by FR-004.
  - **A green from the old palette**: it doesn't meet the "not part of the palette, separately
    approved" rule as clearly as a new named proposal.

## R4. UI typography

- **Decision**: keep **Baloo 2** (display: titles, numbers, buttons) and **Nunito** (body), both
  under the SIL Open Font License 1.1, which allows embedding in web, Android and iOS (FR-012).
  They are already bundled and subset with ₵, ₦ and £.
  - **Pairing rationale**: Sobas Play is a heavy, rounded, playful display face. Baloo 2's rounded
    heavy weights echo it without imitating it, and Nunito's rounded terminals keep body text soft
    and very legible for early readers.
  - Skia (the tagline font) is a flared humanist face. Nunito's open shapes sit comfortably next
    to it.
- **Sobas Play and Skia** are used **only inside the logo artwork** (FR-011). They are never live
  text, so no embedding licence is needed. (The PDF embeds subsets of them for print only.)
- **Rejected**:
  - **Fredoka (OFL)**: very close in style to Sobas Play, so the two would compete visually.
  - **Licensing Sobas Play** for UI text: there is no need now, and a cost and licence question.
  - **Skia for UI**: it's an Apple system font and can't be embedded on Android or the web.

## R5. Narration: human recordings only, keyed by line ID

- **Decision**:
  - **Source of truth**: `docs/design/narration/lines.json`
    ([contracts/narration-lines.schema.json](./contracts/narration-lines.schema.json)). Each line
    has `id`, `screen`, `text`, `delivery`, `maxSeconds` (≤ 8), `idea` (one idea, as a short
    phrase), `kind` (prompt / reaction / name / question / answer / hint), and optionally `region`.
  - `tools/design/build-narration.mjs` generates two things from it:
    1. `docs/design/narration-script.md`: the actor's script, grouped by screen, with IDs,
       delivery notes, target lengths and file names.
    2. `prototype/assets/data/audio-manifest.js`: `window.KC.audioManifest = { languages,
       defaultLanguage, regionLanguage, lines: { [lang]: { [lineId]: { file, status } } } }`
       ([contracts/audio-manifest.md](./contracts/audio-manifest.md)).

     It **scans `prototype/assets/audio/<lang>/`** and marks each line `recorded` if
     `<lineId>.m4a` exists, and `pending` otherwise. Adding a recording plus re-running the
     script (or `npm run check`) needs **no code change** (FR-019, SC-008).
  - **Playback**: one `HTMLAudioElement`. A new line stops the previous one, so taps never pile
    up (spec edge case). The order of choice is:
    1. The region's language (`gh` → `en-GH`, `ng` → `en-NG`, `uk` → `en-GB`).
    2. The first recording language (`en-GH`).
    3. The **caption with a "recording pending" badge**.

     **There is no synthetic step anywhere** (FR-014–016). An audio `error` event also falls
     through to the caption.
  - **Captions**: a `narration-caption` component shows the line text. Its status is "playing"
    (with the headphones pose) or "recording pending".
  - **Replay**: a header button replays the last line on the screen (FR-029).
- **Rationale**: line IDs separate the words from the code. The generated script and manifest
  can't drift from the source. Playing from local files works from `file://` and offline.
- **Rejected**:
  - **Web Speech or cloud text-to-speech**: forbidden by FR-014.
  - **A voice clone of the reference video**: forbidden by FR-020, and unethical.
  - **One long audio file per screen**: breaks "one idea per line" and tap-to-hear.
  - **A hand-written manifest**: drifts from the files on disk.

## R6. Audio file format and actor delivery

- **Decision**:
  - **Masters**: the studio delivers WAV, 48 kHz, 24-bit, mono, with 150 ms of room tone before
    and after each line, peaks no higher than −3 dBFS, and loudness around −16 LUFS (spoken word).
    Each file is named `<lineId>.wav`.
  - **Prototype files**: AAC-LC `.m4a`, mono, 64 kbps, named `<lineId>.m4a`, in
    `prototype/assets/audio/<lang>/`. `tools/design/encode-audio.mjs` converts the masters if
    `ffmpeg` is present. It is optional; the studio can deliver `.m4a` directly.
- **Rationale**: AAC plays in Safari, Chrome and Android WebView, and matches spec 001's app
  format (research R7). Mono at 64 kbps keeps an 8-second line under 70 KB.
- **Rejected**:
  - **MP3**: fine, but AAC matches the production app.
  - **Opus/WebM**: older iOS Safari doesn't play it.

## R7. Voice direction

- **Decision**: `docs/design/voice-direction-brief.md`. It is a casting and recording brief for
  **a warm, friendly female storyteller with a natural Ghanaian English accent** (provisional,
  FR-021). It covers:
  - Pace for ages 4–6 (about 120–140 words per minute), smiling tone, short pauses between ideas,
    and never robotic, flat or sing-song.
  - What each delivery note means ("excited", "gentle, slow", "celebrating", "curious question",
    "encouraging"), with good and bad examples.
  - Pronunciation of local words and currencies (pesewas, cedis, kelewele, sobolo; and for later
    regions kobo, naira, puff-puff, zobo; pence, pounds).
  - File naming and format (R6).
  - The tone reference https://www.youtube.com/watch?v=47MNn4bsmSw, **for tone only**, with an
    explicit ban on copying, closely imitating or cloning that voice.
  - Consent and usage: the actor agrees in writing to recordings being used in the KudiCubs app
    and marketing. There is no synthetic re-use or voice training without separate written
    consent.
- **Rationale**: FR-020 and US5: an actor can record without asking the team questions.
  Consent protects the actor and the client.

## R8. Sound effects: original, generated tones, no speech

- **Decision**: sound effects are **short tones built in the page with the Web Audio API**:
  - a pop when a coin is found
  - a two-note chime when a coin lands in a jar
  - a soft low "boop" for try again (never a buzzer)
  - a rising four-note sparkle for a step celebration
  - a tick when counting

  They are **musical tones only, never speech** (FR-030). They follow the reviewer and profile
  sound toggle. With sound off, none play, and the visual feedback (poses, sparkles, count
  badges) still runs. The sound IDs and recipes are
  in [contracts/interaction-moments.md](./contracts/interaction-moments.md).
- **Rationale**: original by construction, so there are no licences to track. There are no files
  to download, and they work offline.
- **Rejected**:
  - **CC0 sound libraries**: licences to track for every file.
  - **Recorded sound effects**: a separate studio job, which can come later.

## R9. Interaction model: every screen has a child action

- **Decision**: a new DOM hook, `data-child-action`, marks every child tap or drag target that
  isn't "Next": tap-to-hear items, call-and-response answers, coins and jars.
  - **They never navigate.** So the "exactly one main action" rule still holds, because child
    actions are never `data-primary` (Constitution I).
  - The per-screen design is in [contracts/interaction-moments.md](./contracts/interaction-moments.md).
    Summary:
    - **Intro**: "Can you help me find them?" Tap the thumbs-up answer.
    - **Find**: every coin speaks its name when tapped.
    - **Sort**: drag only, with tap as a fallback. A count badge on each jar rises per coin.
    - **Count**: after counting, "Which jar has the most coins?" Tap a jar.
    - **Decision**: tap each card to hear it. The choice itself is the answer.
    - **Result**: tap the jar or sticker to finish the animation.
    - **Summary**: "What did you do with your coins?" Tap save or spend.
    - **Reward**: tap each badge to hear it, and tap the coins burst.
  - Kudi reacts to every action through `KC.kudiReact(state)`, using the R2 mapping. The
    `headphones` pose shows while a line plays.
- **Listening limit (FR-022, SC-005)**: no screen ever *waits* for narration before enabling its
  actions. Every `data-child-action` is enabled as soon as the screen renders. Combined with lines
  of 8 seconds or less, the child can always act within about 8 seconds.
- **Rejected**:
  - **Disabling taps while Kudi talks**: the passive pattern the client rejected.
  - **Auto-advancing screens**: takes control away from the child.

## R10. Drag-to-sort with a per-coin count

- **Decision**:
  - Keep Pointer Events dragging from 002, and make **drag the primary method**. Tap-coin-then-
    tap-jar stays as an accessibility fallback (FR-024).
  - Each jar shows a **count badge** that goes up by one the moment a coin lands, with a tick
    sound, the `thumbs-up` pose and a small sparkle.
  - A wrong jar: the coin floats back, Kudi shows `fist`, a soft boop plays, and the line
    `sort.try_again` plays.
  - A coin dropped outside any jar: it floats back silently.
  - Only one pointer drags at a time (spec edge cases).
- **Testing**: Playwright drags with `mouse.down/move/up` on the coin's centre, and also tests
  the tap fallback. Real-touch feel stays a manual check (002 T064).

## R11. Before/after summary for the client

- **Decision**:
  - Tag the 002 prototype commit `c83436c` as **`prototype-v0.1.0`**, so the "before" is
    recoverable (FR-032).
  - `tools/design/capture-before-after.mjs` checks out that tag into a temporary git worktree,
    screenshots every screen at 390 × 844, and does the same for the current prototype. Output
    goes to `docs/design/round1/before/*.png` and `after/*.png`.
  - `docs/design/round1-before-after.md` shows a table for each screen: before, after, 1–5 change
    notes tagged **Brand / Voice / Interaction**, then the open-decisions list.
- **Rationale**: FR-031 and SC-010. Generated screenshots are faithful and easy to redo.

## R12. Verification additions

| Check | New or changed | Proves |
|---|---|---|
| `check-brand.mjs` | New | Brand tokens equal the guide's values exactly. Every non-brand colour is a recorded derivation or the flagged success green (FR-001, FR-002, FR-004). |
| `check-no-tts.mjs` | New | No `speechSynthesis`, `SpeechSynthesisUtterance` or text-to-speech API names anywhere in `prototype/` (FR-014, SC-003) |
| `build-narration.mjs --check` | New | Every narration line is ≤ 8 s at 130 wpm (word count × 60/130 ≤ maxSeconds ≤ 8), has exactly one `idea`, and every `KC.say` or `data-say` key in the prototype exists in `lines.json` (FR-017, FR-018, SC-007) |
| `check-contrast.mjs` | Changed | New `pairs` list, including the non-text 3:1 pairs for outlines and coin rims (FR-004, FR-006) |
| `check-tokens-usage.mjs` | Unchanged rule | No raw colours in the prototype (FR-008) |
| `flow.spec.mjs` | Changed | `speechSynthesis` is stubbed to count calls, and the count must be 0. Every Lost Coins screen has at least one `data-child-action` that is enabled at render. Each child action changes the Kudi pose and logs a sound or line. Drag sorts with per-coin counts. A replay button is on every screen. Pending lines show a caption and a "recording pending" badge. Dropping in 3 sample recordings makes them play with no code change (FR-022–FR-029, SC-004, SC-006, SC-008). |

Sample recordings for the SC-008 test: three short **silent `.m4a` files** generated in the test
setup (not committed). They prove the "drop in, it plays" path without any synthetic voice.

## R13. Versioning, assets and size

- Prototype **0.2.0** and tokens **0.2.0** (FR-032).
- Brand assets (logo SVGs, 5 mascot WebP and PNG files at 640 px) add about 0.6 MB. Recordings,
  when they arrive, add about 70 KB per line. The total stays under the 3 MB budget until
  recordings (about 60 lines, 4 MB, which is acceptable for a demo). The budget is raised to
  **8 MB including audio**, as recorded in the plan.
- The 002 placeholder Kudi art (`prototype/assets/art/kudi/*.svg`, except `icon.svg` which is
  replaced by the brand cub) is **removed** (FR-010). The app icon is rendered from the
  official "on yellow" logo cub.

## Open items carried into the plan

| # | Item | Owner |
|---|---|---|
| B1 | The yellow logo has a white tagline (1.51:1, logo-exempt). Keep it, or supply a Mane Brown tagline version? | Client |
| B2 | No peace-sign pose was supplied. Use the "wink + sparkle coin" pose for celebrate, or supply one? | Client |
| B3 | Approve the success green `#16793A`, or propose another | Client |
| B4 | Warm Cream `#FEF5E0` (provisional) | Client |
| B5 | Charcoal `#231F20` (assumed; reserved) | Client |
| B6 | Approve the derived pressed, secondary-text and locked shades (R3) | Client |
| B7 | Product name in text: KudiCubs, Kudicubs or Kudicub's | Client |
| B8 | Master files: vector logo and transparent mascots | Client |
| V1 | First recording language: Ghanaian English (provisional) | Client |
| V2 | Cast the voice actor and record (out of scope here) | Client and team |
