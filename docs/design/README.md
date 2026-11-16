# KudiCubs Design System

This is the design system for KudiCubs: the **durable** source the clickable prototype and the
real app (spec 001) are built from. **`prototype/` is a throwaway demonstration. This folder is
what lasts.**

- **Specs**:
  - [002](../../specs/002-ux-prototype/spec.md): UX design system and prototype v0.1.0.
  - [003](../../specs/003-brand-voice-interactive/spec.md): client feedback round 1. **Official
    brand, human voice, more interaction**: prototype v0.2.0.
  - [004](../../specs/004-prototype-round-2/spec.md): prototype round 2. **Testing fixes, a
    temporary scratch voice, real play data, a stable demo link and automated validation**:
    prototype v0.3.0.
- **Live demo**: *(the stable GitHub Pages link is added here after the first deploy)*
- **Tokens version**: `0.3.0`, which becomes `1.0.0` when the client signs off.
- **Prototype version**: `0.3.0`. Earlier states: `prototype-v0.1.0`, and v0.2.0 at commit `594bd8c`.

## Files

| File | What it's for |
|---|---|
| [brand.md](./brand.md) | **How the brand guide is applied**: logo versions, the five Kudi poses, colour rules, fonts, open decisions B1–B11 and V1 |
| [tokens.json](./tokens.json) | **Source of truth**: brand, derived, success and illustration colours, type, space, radius, elevation, size, motion, and the contrast pairs |
| [tokens.md](./tokens.md) | Principles and the generated token tables |
| [contrast-report.md](./contrast-report.md) | Generated: every pairing with its ratio; failures and how they're avoided |
| [components.md](./components.md) | **28 components**, the one-main-action rule and child actions |
| [kudi-the-cub.md](./kudi-the-cub.md) | Kudi's character, the five poses and their states, pose order, size, voice, never-do list, idle behaviour |
| [age-band-rules.md](./age-band-rules.md) | 4–6 / 7–9 / 10–12 / 13–15 UI rules |
| [narration/lines.json](./narration/lines.json) | **Source of truth for every spoken line**: 146 lines × 3 language slots |
| [narration-script.md](./narration-script.md) | Generated: the voice actor's script, with the file-naming table |
| [voice-direction-brief.md](./voice-direction-brief.md) | Casting and recording brief: a warm, friendly female storyteller with a natural Ghanaian accent; consent; tone reference only, never copied |
| [round1-before-after.md](./round1-before-after.md) | **The client summary**: every screen before and after, the changes, and the open decisions |
| [design-references.md](./design-references.md) | Patterns learned from the references, how KudiCubs differs, and the originality record |
| [review-guide.md](./review-guide.md) | A plain-language guide for Jefferson (round 1) |
| [child-session-protocol.md](./child-session-protocol.md) and [child-session-results.md](./child-session-results.md) | Optional child test. **Waits for the recordings.** |
| [diagrams.md](./diagrams.md) | Architecture and flow diagrams (spec 001) |
| `img/components/`, `round1/` | Generated screenshots |

## How to change something

```bash
cd tools/design
npm ci && npx playwright install chromium webkit   # first time
npm run check                 # tokens → contrast → brand (+art) → no-TTS → token usage → narration --check → audio → build info → sw.js --check → all Playwright tests
npm run serve                 # local preview on http://127.0.0.1:4173/ (the tests use the same server)
../../scripts/generate-scratch-voice   # the temporary scratch voice (Lost Coins batch; --batch all after approval)
node extract-brand-assets.mjs # re-extract the logo and poses from docs/source/KudiCubs Brand.pdf (or the client's master files)
node build-narration.mjs      # after editing lines.json, adding recordings or scratch audio
node build-sw.mjs             # after adding or removing any prototype file
node encode-audio.mjs         # optional: studio .wav → .m4a (needs ffmpeg)
node capture-components.mjs   # refresh component thumbnails
node capture-before-after.mjs # refresh the before/after summary
```

**Rules:**

- **Brand colours are never changed.** `check-brand.mjs` compares them with the guide.
- **No live or browser speech synthesis, ever.** `check-no-tts.mjs` scans for it, and a test stub
  fails on any use. Pre-generated **scratch** audio (`assets/audio-scratch/`) is allowed only as a
  marked, temporary demo track (004 amendment).
- **⚠ RB-1: scratch audio must be replaced by human recordings before any public release.**
  `node check-no-tts.mjs --release` is the gate (it fails while any scratch file exists).
- Never edit generated files: `tokens.css`, the token tables, `contrast-report.md`,
  `narration-script.md`, `audio-manifest.js`, `build-info.js`, `sw.js`, and the screenshots.
- **Adding a recording:** put `prototype/assets/audio/<lang>/<lineId>.m4a` in place and run
  `node build-narration.mjs`. No code change is needed.
- **Stored on the device** (amended in 004, FR-027):
  - **Preferences** (sessionStorage): `region`, `sound`, `notes` and `voiceLang`.
  - **Progress** (localStorage `kudicubs.proto.progress`, schema 1): the preset nickname, avatar,
    age band, region, whether onboarding is done, and the event log of what the child did.
  - **Why**: real play data is meaningless if a refresh erases it, and reviewers come back to the
    link over days. Everything stored is fictional game data the constitution already permits.
    This supersedes 002 research D11 and 003 data-model §9.
  - **Never stored or sent**: the parent email, the PIN, maths answers, real names, or anything
    typed in the parent gate (FR-028; a data test scans all storage).
  - **Restart** in the reviewer menu erases all of it.

## Validation record: round 1 (2026-11-15)

### Automated

| Scenario | Check | Result |
|---|---|---|
| W1–W3 Brand | `check-brand.mjs --art`, `check-contrast.mjs`, `check-tokens-usage.mjs` | ✅ The 9 brand colours match the guide. 17 UI and 31 art colours are all recorded, and every see-through tint and faded state is a token (`tint.*`, `opacity.*`). All **29** pairings in use pass WCAG AA, and 12 failing pairings are listed with how they're avoided. Only **defined** `var(--kc-*)` tokens in the prototype (the check now fails on a removed or misspelt token). |
| W4 No synthetic voice | `check-no-tts.mjs` + the runtime stub in `flow.spec.mjs` | ✅ 0 references, and `speechSynthesis.speak` was called 0 times |
| W5 Pending captions | flow test "voice: no recordings" | ✅ Every line shows its caption and "Recording pending" |
| W6 Drop-in recordings | flow test "voice: dropping in 3 recordings" (ffmpeg-generated silent samples) | ✅ They play, with no code change |
| W7 Replay | flow test + audit | ✅ A replay button on every screen re-shows or replays the last line |
| W8 Something to do | flow test `checkChildActions` | ✅ Every Lost Coins screen has at least one enabled child action at render, and each one reacts without navigating |
| W9 Drag with live counts | flow test (real pointer drags) | ✅ Count badge +1 per coin. A wrong jar leaves the count unchanged, shows `fist` and plays a boop. No failure state. |
| W10 Kudi reacts | flow test (pose and sound-effect log) | ✅ |
| W11 Call and response | flow test | ✅ Intro, Count and Summary hold Next back until the child answers. Decision is answered by the choice. |
| W12 Script and brief | `build-narration.mjs --check` | ✅ 142 lines, each ≤ 8 s at 130 wpm, one idea each; every spoken key exists |
| W13 Before/after | `capture-before-after.mjs` | ✅ 16 screens × 2, with change notes and 12 open decisions |
| 002 regressions | flow tests on Chromium and WebKit | ✅ **14/14 passed.** The replay economy regression test still fails when the bug is put back (re-proven). |
| Code review (T058) | 2 new flow tests: keyboard-only play, and confetti / tab label / long idle / tapped word | ✅ Both fail when the review's bugs are put back (re-proven) |
| Offline | Served over HTTP, loaded once, then offline | ✅ The service worker takes control; Kudi and the logo load offline |
| Size | `du` | ✅ `prototype/` is **2.2 MB** without audio (budget 3 MB; 8 MB with recordings) |
| Speed | 4× CPU throttling | ✅ First load 238 ms; the slowest screen renders in 17 ms (budget 50 ms) |

### Bugs found and fixed while validating

- **Count question:** tapping a jar did nothing, because the counted coins caught the tap.
- **Layout shifts while dragging:** they came from the caption appearing and from the five poses'
  different proportions. Fixed with a fixed caption slot and a fixed Kudi box.
- **Caption text clipped.**
- **Placeholder speaker icon** was white on orange. It's now Mane Brown.
- **Wrapper elements** were missing component IDs.
- **Parent-gate logo** moved the hold button while it loaded.
- **Mascot PNG fallbacks** were 4.1 MB in total, now 0.1 MB.

### Fixed after the round-1 code review (T058)

- **Keyboard**: the Sort coins couldn't be picked with Enter/Space, and the avatar and nickname
  cards spoke but never got selected. Both work now, and a test plays Sort by keyboard alone.
- **Confetti** was invisible: it still used the removed v0.1.0 colour names.
- **Bottom-nav labels** were cut off or replaced by the screen prompt. The label now plays in
  place of the prompt.
- **Long idle** (20 s) now shows `wave` with "Welcome back!", as FR-038 asks. The extra 45 s
  state is gone.
- **Tap any word**: titles and Kudi's words play their line, and with no recording the caption
  flashes Soft Gold (FR-026).
- **Bars, dots and fills** have Mane Brown edges, with their contrast recorded (FR-004/006).
- **Wallet bars and Progress pillars** had collapsed: the child-action layout rule overrode
  their grid. Found while checking the new screenshots.
- CSS overrides were folded into the rules they changed (checked with a computed-style
  comparison of every screen), raw sizes became tokens, and the screen-reader labels left in
  `index.html` moved to the strings file.

### Manual, on real devices (still to do, 002 T064 and 003 W14)

| Scenario | Status |
|---|---|
| Drag-to-sort feel by finger on an iPhone (Safari) and an Android phone (Chrome) | ☐ |
| Audio plays after the first tap; captions readable in daylight | ☐ (needs at least a few recordings) |
| First-time walkthrough in under 5–7 minutes | ☐ |
| Originality countersignature ([design-references.md](./design-references.md)) | ☐ The developer signs |
| Child session (optional) | ☐ **Only after the recordings exist** |

## Validation record: round 2 (spec 004, 2026-11-15)

### Automated (`npm run check`, also on every pull request in `prototype-ci`)

| Area | Check | Result |
|---|---|---|
| E1 Full journey | `flow.spec.mjs` › full journey: Welcome → onboarding → gate (with confirm PIN) → Home → The Lost Coins → Reward → Home | ✅ 0 console errors, 0 failed requests, 0 HTTP errors |
| E2 Fold | `fold.spec.mjs` at **360×640 and 390×844**, after render and after every interaction, including the 7 measured cases | ✅ main action 0 px out of view, no scrolling, no smaller text |
| E3 Navigation | `navigation.spec.mjs` | ✅ no Back on the hub screens; Back never lands on Reward, Result or the gate; Reward and Result opened directly or refreshed → Home, nothing granted |
| A9 Load failure | `navigation.spec.mjs` › load failure (screens.js, mock-data.js, regions.js blocked; an error while starting) | ✅ Kudi "Tap to try again"; never reloads by itself; one tap with the file back starts the app |
| E4 Replay | `flow.spec.mjs` | ✅ no coin or history change, +5 XP only, "Great practice!" + `reward.replay` |
| E5 Voice | `check-audio.mjs` + `voice.spec.mjs` | ✅ all 146 en-GH lines have scratch audio (temporary, RB-1); every Lost Coins line has audio, ≤ 8 s, > 1 KB, nothing missing or unlisted; recorded beats scratch beats caption; badge only with notes on |
| E6 Data | `data.spec.mjs` | ✅ fresh start is all zeros; one run = coins 40, savings 8, XP 50, 3 badges, 4 history rows; kept after refresh; Restart clears; nothing from the gate in storage; damaged data starts fresh |
| E7 Tap targets | `audit()` in every spec, both sizes | ✅ nothing interactive on a child screen under 48×48 |
| E8 Contrast | `check-contrast.mjs` + `contrast.spec.mjs` (every visible text node) | ✅ all AA, and every pair in use is recorded |
| E9 Regions | `flow.spec.mjs` › regions | ✅ coin art and treat names follow the region on every money screen |

### Bugs found and fixed while validating round 2

- **Stale audio results** overwrote the caption of the line that replaced them (the earlier
  line's `play()` rejected late).
- **The screen prompt** played over a line the child had tapped in the first 350 ms.
- **Locked level and badge names** were Brown 60 on Warm Cream (3.93:1, below AA for small text).
  They now use Brown 80.
- **The "Savings" label** on the wallet panel was success green on Peach Cream, a pairing the
  tokens reject. It's Mane Brown there now.
- **Count**: there was a 500 ms gap between jars with no main action.

