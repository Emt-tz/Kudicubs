# Contract: Audio Manifest 2.0.0 (scratch status)

**Extends** [003 contracts/audio-manifest.md](../../003-brand-voice-interactive/contracts/audio-manifest.md)
(1.x) · **Spec**: FR-012–FR-022 · **Research**: R4–R6

**Breaking change**: entries can now carry a `scratch` status, so the major version is bumped.

## 1. Files

| Kind | Path | Format | Who makes it |
|---|---|---|---|
| Human recording | `prototype/assets/audio/<lang>/<lineId>.m4a` | AAC, as in 003 | Voice actor (`encode-audio.mjs`) |
| **Scratch** | `prototype/assets/audio-scratch/<lang>/<lineId>.mp3` | MP3, 24 kHz mono | `scripts/generate-scratch-voice` |

The two folders are never mixed. Deleting `audio-scratch/` and running `build-narration.mjs`
removes every scratch line.

## 2. Generated `prototype/assets/data/audio-manifest.js`

```text
KC.audioManifest = {
  version: '2.0.0',
  languages: ['en-GH', 'en-NG', 'en-GB'], defaultLanguage, regionLanguage,
  counts: { 'en-GH': { recorded, scratch, pending }, … },        // FR-020
  lines: { '<lang>': { '<lineId>': { status, file, scratchFile, text, maxSeconds } } }
}
```

| `status` | `file` | `scratchFile` |
|---|---|---|
| `recorded` | `assets/audio/<lang>/<id>.m4a` | the scratch path if one exists, else `null` |
| `scratch` | `assets/audio-scratch/<lang>/<id>.mp3` | the same path |
| `pending` | `null` | `null` |

## 3. Playback (`KC.voice`)

1. Try `recorded` in the order `voiceLang` → `regionLanguage[region]` → `defaultLanguage`.
2. Otherwise try `scratch` in the same order.
3. Otherwise show the caption, as in 003 FR-037. Nothing is ever spoken by synthesis (FR-012).

**Caption badge** (FR-019): `voice.scratch` ("Scratch voice") or `voice.pending` ("Recording
pending"). It is rendered **only when reviewer notes are on**. The caption itself also follows
FR-008 (it is hidden when it repeats Kudi's bubble).

**`KC.voice.stop()`**: unchanged from 003 round 1 (called on every navigation; a tab label goes
through `KC.go(route, { say })`).

## 4. Checks

| Check | Fails when |
|---|---|
| `check-no-tts.mjs` | any `speechSynthesis` or `SpeechSynthesisUtterance` use, or a network TTS URL in `prototype/`; a file in `audio-scratch/` not listed as `scratch` |
| `check-no-tts.mjs --release` | **any** scratch file or status exists (RB-1) |
| `check-audio.mjs` | a listed file is missing or under 1 KB; duration over 8 s (over the line's `maxSeconds` pace estimate is a warning); an unlisted file; a Lost Coins line for the default region without a recorded or scratch file |
| `build-narration.mjs --check` | the generated manifest is out of date |
