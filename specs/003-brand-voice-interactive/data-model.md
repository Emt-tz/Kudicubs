# Data Model: Client Feedback Round 1

**Feature**: `003-brand-voice-interactive` | **Date**: 2026-11-15 | **Plan**: [plan.md](./plan.md)

There is no database. These are the structured content files and in-page state that round 1
adds or changes. Everything in 002's data model still applies unless replaced here.

## 1. Brand Colour (`docs/design/tokens.json → color.brand.*`)

| Field | Rule |
|---|---|
| Key | `color.brand.<snake_name>`: `sunshine_yellow`, `mane_brown`, `adventure_orange`, `golden_orange`, `soft_gold`, `peach_cream`, `warm_cream`, `white`, `charcoal` |
| `$value` | **Exactly** the guide's hex (research R3). `check-brand.mjs` compares each against a fixed copy of the guide. |
| `$description` | The guide's role ("Main buttons", …) |
| `$extensions.kudicubs.source` | `"brand-guide"` |
| `$extensions.kudicubs.tier` | `"primary"` or `"supporting"` |
| `$extensions.kudicubs.status` | `"confirmed"`, or `"provisional"` for Warm Cream (FR-003) and `"assumed"` for Charcoal |

**Rule**: a brand colour's value MUST NEVER differ from the guide (FR-004). Any change goes
through the client and a new brand-guide revision, never a token edit alone.

## 2. Derived Colour (`color.derived.*`, `color.success.*`)

| Field | Rule |
|---|---|
| `$value` | Hex |
| `$extensions.kudicubs.derivedFrom` | A brand token path, e.g. `color.brand.sunshine_yellow` |
| `$extensions.kudicubs.rule` | e.g. `"mix 12% color.brand.mane_brown"` (sRGB mix) |
| `$extensions.kudicubs.purpose` | e.g. `"main button pressed"` |
| `$extensions.kudicubs.needsApproval` | `true` for every derived colour until the client approves it (R3, B6) |
| `color.success.green` | `derivedFrom: null`, `notInPalette: true`, `needsApproval: true` (FR-007) |

**Rule**: `check-brand.mjs` fails if any colour value in `tokens.json` is neither a brand colour
nor a recorded derived or success colour.

**Semantic aliases** (the names the components use) point only at brand or derived tokens:

| Alias | Points at |
|---|---|
| `color.bg.app` | `brand.warm_cream` |
| `color.bg.card` | `brand.white` |
| `color.bg.tray` | `derived.cream_shade` |
| `color.text.primary` | `brand.mane_brown` |
| `color.text.secondary` | `derived.brown_80` |
| `color.text.locked` | `derived.brown_60` |
| `color.text.on_dark` | `brand.warm_cream` |
| `color.action.primary.bg` | `brand.sunshine_yellow` |
| `color.action.primary.pressed` | `derived.yellow_pressed` |
| `color.action.primary.fg` | `brand.mane_brown` |
| `color.action.primary.outline` | `brand.mane_brown` |
| `color.action.secondary.bg` | `brand.adventure_orange` |
| `color.action.secondary.pressed` | `derived.orange_pressed` |
| `color.action.secondary.fg` | `brand.mane_brown` |
| `color.reward.coin` | `brand.golden_orange` |
| `color.reward.rim` | `brand.mane_brown` |
| `color.character.highlight` | `brand.soft_gold` |
| `color.parent.bg` | `brand.mane_brown` |
| `color.parent.fg` | `brand.warm_cream` |
| `color.parent.accent` | `brand.sunshine_yellow` |
| `color.feedback.success` | `success.green` |
| `color.feedback.hint_ring` | `brand.mane_brown`, with a `brand.sunshine_yellow` glow |

## 2b. Illustration Colour (`color.illustration.*`, FR-047)

| Field | Rule |
|---|---|
| `$value` | Hex |
| `$extensions.kudicubs.purpose` | e.g. `"coin metal: silver"`, `"GH coin accent: red"`, `"scene: leaf green"` |
| `$extensions.kudicubs.needsApproval` | `true` |

**Rule**: allowed **only** in placeholder art (`prototype/assets/art/**`), and never in UI CSS or
JS. `check-brand.mjs --art` fails on any fill or stroke in placeholder SVGs that isn't a brand,
derived or illustration token value. Supplied brand artwork (`prototype/assets/brand/**`) is
exempt.

## 3. Contrast Finding (generated: `docs/design/contrast-report.md`)

| Field | Rule |
|---|---|
| `fg`, `bg` | Token references |
| `usage` | Where the pairing is used |
| `kind` | `text` (4.5:1), `large-text` (3:1), `non-text` (3:1, outlines, coin rims, icons) |
| `ratio` | Computed |
| `result` | `pass` or `fail` |
| `resolution` | **Required when the pairing fails**: the nearest passing alternative (another brand pairing, or a derived shade marked `needsApproval`), or "not used" |

**Source**: `tokens.json → pairs` (pairs that are used, all of which must pass) and
`tokens.json → rejectedPairs` (failures, each with a resolution, listed for the client).

## 4. Mascot Pose (`prototype/assets/brand/kudi-*.webp`, `KC.poses`)

| Pose ID | File | State | Status |
|---|---|---|---|
| `wave` | `kudi-wave.webp` | greeting, base pose, think, long idle | confirmed mapping |
| `celebrate` | `kudi-celebrate.webp` | celebrate (client: "peace sign") | **provisional** (B2) |
| `fist` | `kudi-fist.webp` | encourage, try again, idle hint | confirmed mapping |
| `thumbs-up` | `kudi-thumbs-up.webp` | correct | confirmed mapping |
| `headphones` | `kudi-headphones.webp` | narration playing | confirmed mapping |

## 5. Narration Line (`docs/design/narration/lines.json`)

The schema is [contracts/narration-lines.schema.json](./contracts/narration-lines.schema.json).

**Rules**:

- `maxSeconds` ≤ 8.
- The estimated length, `words × 60 / wordsPerMinute`, must be ≤ `maxSeconds`.
- `idea` is one short phrase (one idea per line, FR-018).
- `id` is unique and is the audio file name.
- Every key the prototype speaks (`KC.voice.play` or `data-say`) MUST exist (`build-narration.mjs
  --check`).
- Region-specific lines (coin names, currency, market examples) carry `region`, and one line
  exists per region.

**Expected size**: about 70–90 lines. That's the 002 prompts, plus tap-to-hear names (the coins
for 3 regions, avatars, badges, levels, pillars, categories), plus call-and-response questions and
answers, plus try-again and celebration reactions.

## 6. Audio Manifest Entry (generated: `prototype/assets/data/audio-manifest.js`)

| Field | Rule |
|---|---|
| `lang` | One of `languages` |
| `lineId` | From `lines.json` |
| `file` | `assets/audio/<lang>/<lineId>.m4a` |
| `status` | `recorded` if the file exists, else `pending` |

**State transitions**:

```text
pending ──(file added + manifest rebuilt)──▶ recorded
recorded ──(file removed + rebuilt)──▶ pending
```

## 7. Sound Effect (`KC.sfx`)

The fields are `id`, `recipe` and `use`. They are listed in
[contracts/interaction-moments.md §3](./contracts/interaction-moments.md).

**Rule**: tones only; no speech (FR-030).

## 8. Interaction Moment (`KC.screens[id].moments`, documented in `interaction-moments.md §4`)

| Field | Rule |
|---|---|
| `screen` | Screen ID |
| `action` | A `data-child-action` kind: `hear`, `answer`, `drag`, `tap`, `find`, `count` |
| `target` | What the child taps or drags |
| `pose` | Kudi's pose after the action |
| `sfx` | A sound-effect ID, or none |
| `line` | A line ID, or none |
| `outcome` | What changes on screen |

**Rule**: every Lost Coins screen has at least one moment besides the main action (FR-023).

## 9. Prototype state additions (`KC.state`)

| Field | Persisted? | Notes |
|---|---|---|
| `voice.last` | no | The last line ID on the current screen, for replay |
| `voice.lang` | session (`voiceLang`) | The reviewer's language override, set from the reviewer menu; default from `regionLanguage`. No personal data. **Supersedes 002 research D11's list**: the stored preferences are now `region`, `sound`, `notes` and `voiceLang`. |
| `kudiPose` | no | The current pose |
| `answers` | no | Call-and-response answers for this run (for the reactions only; never stored) |

## 10. Before/After Entry (`docs/design/round1/notes.json`, generated into `round1-before-after.md`)

| Field | Rule |
|---|---|
| `screen` | Screen ID |
| `before` | `round1/before/<screen>.png`, from tag `prototype-v0.1.0` |
| `after` | `round1/after/<screen>.png` |
| `changes` | 1–5 items `{ category: brand\|voice\|interaction, note }`, in plain language |

The open decisions (B1–B8, V1) are listed once, at the end.
