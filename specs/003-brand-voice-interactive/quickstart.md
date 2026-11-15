# Quickstart & Validation Guide: Client Feedback Round 1

**Feature**: `003-brand-voice-interactive` | **Plan**: [plan.md](./plan.md)

Prerequisites, opening the prototype and the base checks are the same as
[002 quickstart](../002-ux-prototype/quickstart.md). This page covers only what round 1 adds.

## 1. Extra prerequisites

| Item | Why |
|---|---|
| poppler (`pdfimages`, `pdftocairo`) | Extracting the brand assets from the guide. Already installed on the dev Mac. |
| Python with Pillow (via `uv run --with pillow`) | Recombining each mascot image with its mask |
| ffmpeg (optional) | Converting studio WAV masters to `.m4a` |

## 2. Build steps

```bash
cd tools/design
node extract-brand-assets.mjs   # → prototype/assets/brand/ (logos, 5 poses, app icons, SOURCES.md)
node build-narration.mjs        # lines.json → narration-script.md + audio-manifest.js (scans audio/)
npm run check                   # tokens → contrast → brand → no-TTS → token usage → narration --check → flow tests
node capture-before-after.mjs   # tag prototype-v0.1.0 vs now → docs/design/round1/*
```

## 3. Validation scenarios

| # | Scenario | Steps | Expected | Spec |
|---|---|---|---|---|
| W1 | Official brand on every screen | Walk through all screens | The official logo on Welcome; the five official poses only; yellow main buttons and orange secondary buttons with Mane Brown text and outlines; cream or white backgrounds | US1, FR-001, FR-005, FR-006, FR-009, FR-010 |
| W2 | Brand values untouched | `node check-brand.mjs` | Every brand token equals the guide; every other colour is a recorded derivation or the flagged success green | FR-002, FR-004, SC-001 |
| W3 | Contrast | `node check-contrast.mjs` and open `docs/design/contrast-report.md` | All used pairs pass; failures are listed with resolutions | FR-004, SC-002 |
| W4 | No synthetic voice | `node check-no-tts.mjs`, then play every screen with DevTools open | 0 matches; `speechSynthesis.speak` is never called | FR-014, SC-003 |
| W5 | Pending captions | Run with no recordings | Every line shows its caption and a "Recording pending" badge; nothing is spoken | FR-016 |
| W6 | Drop-in recordings | Copy 3 files to `prototype/assets/audio/en-GH/<lineId>.m4a`, run `node build-narration.mjs`, reload | Those 3 lines play and the headphones pose shows; no code change | FR-019, SC-008 |
| W7 | Replay | Tap the replay button on every screen | The last line replays, or its caption re-appears | FR-029 |
| W8 | Something to do on every screen | Play The Lost Coins; try each screen's child actions (interaction-moments §4) | At least one action besides Next on every screen; actions work straight away, without waiting for narration | FR-022, FR-023, SC-004, SC-005 |
| W9 | Drag with live counts | Sort: drag coins by finger; drop one in a wrong jar and one outside the jars | The count badge rises by 1 per correct coin; a wrong jar gives a gentle float back, `fist` and a soft boop; outside the jars, a silent float back | FR-024, FR-028 |
| W10 | Kudi reacts | Every action | The pose changes per the mapping, and a sound plays (sound on) | FR-025, SC-006 |
| W11 | Call and response | Intro, Count, Decision, Summary | Kudi asks, the child taps an answer, Kudi reacts | FR-027 |
| W12 | Script and brief | Read `narration-script.md` and `voice-direction-brief.md` as a voice actor | Every line has an ID, screen, text, delivery note and length ≤ 8 s; the brief covers voice, pace, accent, smile, pronunciation, format, naming and the tone-only reference | FR-017, FR-018, FR-020, US5, SC-007 |
| W13 | Before/after | Open `docs/design/round1-before-after.md` | Every screen has before and after images plus change notes; open decisions B1–B8 and V1 are listed | FR-031, US4, SC-010 |
| W14 | Real phones | iPhone (Safari) and Android (Chrome), via the preview link | Dragging feels natural; audio plays after the first tap; captions are readable | 002 T064 carried over |

## 4. Recording handover (after round-1 approval)

Send the voice actor `docs/design/voice-direction-brief.md`, `docs/design/narration-script.md`,
and the file-naming table (generated at the end of the script). Put the returned files in
`prototype/assets/audio/en-GH/`, then run `node build-narration.mjs` (W6).
