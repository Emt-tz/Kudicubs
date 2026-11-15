# Feature Specification: Client Feedback Round 1: Official Brand, Natural Voice, More Interaction

**Feature Branch**: `003-brand-voice-interactive`

**Created**: 2026-11-14

**Status**: Draft

**Builds on**: [specs/002-ux-prototype](../002-ux-prototype/spec.md) (UX design system and
clickable prototype v0.1.0) and [specs/001-kudicubs-mvp](../001-kudicubs-mvp/spec.md).

**Source**: `docs/source/KudiCubs Brand.pdf` (client brand guide, 8 pages: logo, logo versions,
mascots, primary colours, supporting colours, typography, recommendations), plus the client's
round-1 feedback on prototype v0.1.0.

**Input**: User description: "Client feedback round 1 for the KudiCubs prototype: apply the
official brand, replace synthetic narration with natural human voice, and make the experience more
interactive. This builds on the 002 UX design and prototype. No production app code." (The full
brief covers brand colours, typography, logo and mascot, brand rules, voice, interactivity,
acceptance and out-of-scope items. All of it is captured in the requirements below.)

## Clarifications

### Session 2026-11-14

- Q: Which Warm Cream value is correct? → A: `#FEF5E0`, the swatch value. **Provisional, still
  open, pending Jefferson's confirmation** (FR-003).
- Q: What is the first recording language? → A: Ghanaian English (`en-GH`). **Provisional, still
  open, pending Jefferson's confirmation** (FR-021).

## Open decisions for the client

These are carried into the before/after summary (FR-031):

1. Warm Cream value: provisionally `#FEF5E0`.
2. First recording language: provisionally Ghanaian English.
3. Charcoal value: assumed `#231F20`.
4. Success green: proposed, needs approval (FR-007).
5. Any derived shades proposed for accessibility (FR-004).
6. The approved yellow logo's white tagline contrast.
7. Product name in text: "KudiCubs", "Kudicubs" or "Kudicub's".
8. The mascot pose mapping, identified visually.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The client sees KudiCubs in its official brand (Priority: P1)

The client, Jefferson, opens the updated prototype and recognises his brand straight away:

- the official logo, the cub holding a "K" coin, with "Play. Earn. Roar!"
- the Sunshine Yellow, Mane Brown and orange palette
- the five official Kudi mascot poses in place of the placeholder cub

Every screen still reads clearly, because every colour pairing has been checked for contrast.

**Why this priority**: the client supplied a brand guide. A prototype in placeholder colours
can't be approved as "what will be built".

**Independent Test**: open every prototype screen and confirm the official logo and mascot
appear, only brand colours (and their recorded tints and shades) are used, and every text or
icon pairing passes the contrast check.

**Acceptance Scenarios**:

1. **Given** the Welcome screen, **When** it loads, **Then** the official logo (the cub holding a
   "K" coin, the wordmark and "Play. Earn. Roar!") appears on an approved background, unchanged
   in shape and colour.
2. **Given** any screen, **When** its colours are inspected, **Then** main buttons are Sunshine
   Yellow, secondary buttons are Adventure Orange, headings, borders and outlines are Mane Brown,
   backgrounds are Warm Cream or White, coins and reward icons are Golden Orange, and character
   highlights are Soft Gold.
3. **Given** any yellow or orange surface, **When** it carries text, **Then** that text is Mane
   Brown, never white.
4. **Given** a success message, **When** it is shown, **Then** it uses the proposed accessible
   success green, which is marked "pending client approval" in the design documents.
5. **Given** any screen where Kudi appears, **When** it loads, **Then** Kudi is one of the five
   supplied poses, never the old placeholder drawing and never a newly drawn cub.

---

### User Story 2 - Kudi speaks with a natural human voice (Priority: P1)

The client found the device voice too robotic. In the updated prototype every line Kudi speaks
is played from a **pre-recorded human audio file**, chosen by its line ID. Until the recordings
exist, each line shows its caption with a clear "recording pending" marker. There is **never** a
synthetic voice anywhere.

Alongside the prototype the team gets four things:

- a **narration script** listing every line
- an **audio manifest**, so recordings can be dropped in without changing the prototype
- a **voice direction brief** for a human voice actor
- the confirmed **first recording language**

**Why this priority**: the voice is how pre-readers experience KudiCubs (Constitution VII). The
client rejected the synthetic voice, so the voice can't be approved until a real voice is
possible.

**Independent Test**: search the prototype for any speech-synthesis use (none found). Play
through The Lost Coins with no recordings present: every line shows its caption and a "recording
pending" marker. Drop in sample recordings for 3 line IDs: they play with no other change.

**Acceptance Scenarios**:

1. **Given** a screen with narration, **When** the recording for a line exists, **Then** that
   recording plays, and the Kudi "headphones" pose shows while it plays.
2. **Given** a line with no recording yet, **When** it would play, **Then** its caption appears
   with a "recording pending" marker, and no sound is synthesised.
3. **Given** the narration script, **When** a voice actor reads it, **Then** every line has an
   ID, a screen, the text and a delivery note, and fits in about 8 seconds with one idea per line.
4. **Given** new recordings named after their line IDs, **When** they are placed in the location
   the manifest gives for their language, **Then** the prototype plays them, with no other change.
5. **Given** any screen, **When** the child taps the replay button, **Then** the last narration
   line on that screen plays again (or its caption re-appears, if the recording is pending).

---

### User Story 3 - The child is always doing something (Priority: P1)

The client wants the experience less passive. In The Lost Coins, the child acts every few seconds:

- they drag coins into jars by hand, and the count rises with each coin
- they tap coins, items and words to hear their names
- they answer Kudi's questions by tapping (call and response)
- they hear a sound and see a small celebration on each correct step
- a mistake gets a gentle "try again" and never a failure screen

Kudi reacts to every action with the mapped pose.

**Why this priority**: this is the client's third explicit request. More doing and less
listening is also the constitution's "learn by doing" principle (II).

**Independent Test**: play The Lost Coins and confirm every screen has at least one child action
besides "Next". There is never more than about 8 seconds of listening without something to tap,
and every action gets a visible Kudi reaction and a sound.

**Acceptance Scenarios**:

1. **Given** the sort activity, **When** the child drags a coin into its matching jar, **Then**
   the coin drops in, that jar's count goes up by one straight away, a short success sound plays,
   a small celebration shows, and Kudi shows "thumbs up".
2. **Given** the sort activity, **When** the child drags a coin into a jar that doesn't match,
   **Then** the coin returns gently, Kudi shows "fist" (encourage), a soft "try again" sound and
   line play, and no failure screen or "wrong" signal appears.
3. **Given** any coin, item, picture or word on a child screen, **When** the child taps it,
   **Then** its spoken name plays (or its caption shows, if the recording is pending).
4. **Given** a call-and-response moment, **When** Kudi asks a question (for example "Which jar
   has the most coins?"), **Then** the child answers by tapping one of the choices on screen, and
   Kudi reacts to the answer.
5. **Given** any screen of The Lost Coins, **When** it is reviewed, **Then** it has at least one
   child action besides "Next".
6. **Given** the child finishes a step correctly, **When** the step completes, **Then** Kudi
   shows "peace sign" (celebrate) with a small celebration.

---

### User Story 4 - The client sees what changed, screen by screen (Priority: P2)

With the updated prototype, the client receives a **before/after summary**. For each screen it
shows the v0.1.0 version next to the round-1 version, and lists what changed and why: brand,
voice and interaction.

**Why this priority**: this lets the client confirm his feedback was understood and approve
round 1 quickly. It depends on Stories 1–3 being done.

**Independent Test**: open the summary. Every prototype screen has a before image, an after
image, and a short list of changes, each linked to brand, voice or interaction.

**Acceptance Scenarios**:

1. **Given** the summary, **When** the client reads it, **Then** each screen shows a before and
   an after view and 1–5 plain-language change notes.
2. **Given** the summary, **When** it lists open decisions, **Then** they include the success
   green, any brand colour adjusted for accessibility, the logo tagline contrast, and anything
   still marked pending.

---

### User Story 5 - A voice actor can record without extra help (Priority: P3)

A voice actor, or a recording studio, receives the narration script and the voice direction
brief, and can record every line in the right tone and length without asking the team questions.

**Why this priority**: recording is out of scope for this feature, but the materials must be
ready so recording can start as soon as this round is approved.

**Independent Test**: give the script and brief to someone who hasn't seen the project. They can
say, for each line, what to say, how to say it, how long it should be, and what to name the file.

**Acceptance Scenarios**:

1. **Given** the brief, **When** the actor reads it, **Then** it describes the voice, pace,
   accent, smile and energy, gives examples of good and bad delivery, and states the file format
   and naming rules.
2. **Given** the tone reference link in the brief, **When** it is used, **Then** it is labelled as
   a reference for tone only, and the brief states that the reference voice must not be copied,
   imitated closely or cloned.

---

### Edge Cases

- **A recording file is missing, empty or fails to play**: show the caption with "recording
  pending". Never synthesise speech and never block the child. The screen stays usable.
- **The child taps several things quickly**: only the most recent spoken name plays. Earlier
  audio stops, so sounds never pile up.
- **The device is muted or the sound is off**: captions show for every line. Sound effects and
  narration stay silent. Kudi's poses still react.
- **A coin is dropped between jars or outside any jar**: it floats gently back to the tray,
  without the "try again" line.
- **The child drags two coins at once (two fingers)**: only the first is moved, and the second
  stays put.
- **A brand colour fails contrast in a needed pairing**: the brand colour is kept unchanged. A
  recorded, derived shade is proposed for that pairing only, and the change is flagged for client
  approval.
- **The approved yellow logo has a white tagline (contrast 1.5:1)**: the logo is used as
  supplied, because logos are exempt from text-contrast rules. The finding is flagged to the
  client, and the white and Mane Brown logo versions are preferred where they fit.
- **A tapped word has no individual recording**: its caption is highlighted. Nothing is spoken.

## Requirements *(mandatory)*

### Functional Requirements

**Brand: colours and tokens**

- **FR-001**: The design tokens MUST be replaced with the official palette.
  - **Primary colours**:
    - Sunshine Yellow `#FBCE16` (main buttons)
    - Mane Brown `#3E2312` (headings, borders, outlines)
    - Adventure Orange `#F68C1F` (secondary buttons)
    - Golden Orange `#FBAA19` (coins and reward icons)
  - **Supporting colours**:
    - Soft Gold `#FBE57E` (character highlights)
    - Peach Cream `#FCE6C6`
    - Warm Cream (main backgrounds), value per FR-003
    - White `#FFFFFF` (main backgrounds)
    - Charcoal (value per Assumptions)
  - The placeholder palette from v0.1.0 MUST be removed.
- **FR-002**: Every derived tint, shade and state colour (hover, pressed, disabled, focus,
  selected) MUST be recorded in the tokens, with the brand colour it is derived from. No colour
  may appear in the prototype that is not a brand colour, a recorded derivation, or the flagged
  success green.
- **FR-003**: Warm Cream MUST use **`#FEF5E0`**, the swatch value. **OPEN, provisional, pending
  Jefferson's confirmation**: the guide prints `#F68C1F` (Adventure Orange's value) by mistake. If
  Jefferson gives a different value, only the token changes.
- **FR-004**: Every text and meaningful-graphic pairing MUST be checked against WCAG 2.x AA: 4.5:1
  for text, 3:1 for large text, icons and the outlines of controls. Each failure MUST be listed
  with the nearest passing alternative. **A brand colour MUST never be silently altered.** An
  alternative is either a different brand-colour pairing (preferred), or a derived shade
  recorded as a proposal for client approval.
- **FR-005**: Text on Sunshine Yellow, Adventure Orange and Golden Orange MUST be Mane Brown,
  never white.
- **FR-006**: Coins, reward icons, yellow buttons and orange buttons on Warm Cream or White MUST
  have a Mane Brown outline or edge, so the shape meets 3:1 non-text contrast. This is the guide's
  own "borders and outlines in Mane Brown" rule. (Measured: Golden Orange on Warm Cream is 1.8:1,
  Sunshine Yellow on White is 1.5:1, Adventure Orange on Warm Cream is 2.2:1.)
- **FR-007**: Success messages MUST use a separate accessible green that is **not part of the
  brand palette**. It MUST meet 4.5:1 as text on Warm Cream and White, and with white text on it.
  It MUST be recorded as "proposed, pending client approval".
- **FR-008**: The prototype MUST be re-skinned **only through tokens**. No colour values may be
  written directly in prototype styles or scripts. This is checked automatically, as in spec 002
  FR-024.

**Brand: logo, mascot and type**

- **FR-009**: The prototype MUST use the official logo from the brand guide: the cub holding a
  "K" coin, the wordmark and the tagline "Play. Earn. Roar!". It MUST use only the three approved
  versions: on White, on Sunshine Yellow, and on Mane Brown. The logo MUST never be redrawn,
  recoloured, stretched, cropped or re-typeset.
- **FR-010**: Kudi MUST be shown only with the **five supplied mascot poses**. No new or modified
  cub artwork may be made. The poses map to states:

  | Pose | State |
  |---|---|
  | wave | greeting |
  | peace sign | celebrate |
  | fist | encourage (including the gentle "try again") |
  | thumbs up | correct |
  | headphones | narration playing |

  The placeholder Kudi from v0.1.0 MUST be removed everywhere.
- **FR-011**: The logo font (Sobas Play) and the tagline font (Skia) MUST appear **only inside the
  supplied logo artwork**. They are not set as live text, so no font embedding licence is needed
  for this round.
- **FR-012**: A licensed, rounded, highly legible UI font for body text and buttons MUST be
  proposed, together with the reason it pairs with the logo and tagline fonts. Its licence MUST
  allow embedding in the web prototype and in Android and iOS apps.
- **FR-013**: The design documents MUST be updated for the new brand: tokens, components, Kudi
  usage rules (now pose-based) and design references. Every rule that mentioned the old palette or
  the old Kudi drawing MUST be revised.

**Voice: natural, human, never synthetic**

- **FR-014**: All text-to-speech and synthesised voice MUST be removed from the prototype. Nothing
  may generate speech at runtime.
- **FR-015**: All narration MUST be played from **pre-recorded human audio files**, chosen by line
  ID.
- **FR-016**: When a recording is missing or can't play, the line's **caption MUST be shown with
  a clear "recording pending" marker**. The prototype MUST never fall back to a synthetic voice.
- **FR-017**: A **narration script** (`docs/design/narration-script.md`) MUST list every spoken
  line with: a line ID, the screen it belongs to, the text, a delivery note (for example
  "excited", "gentle, slow", "celebrating"), and a target length. It MUST include every name the
  child can tap (coins for each region, items, words) and every call-and-response question and
  reaction.
- **FR-018**: Each line MUST be short: **about 8 seconds or less, one idea per line**.
- **FR-019**: An **audio manifest** MUST map each line ID to a file path **per language**, so
  recordings can be added or replaced without changing the prototype.
- **FR-020**: A **voice direction brief** for a human voice actor MUST describe:
  - the voice: a warm, friendly female storyteller with a smiling tone, never robotic
  - pace and accent: natural pace for ages 4–6, and a natural local accent for the recording
    language
  - energy for each delivery note, with examples of good and bad delivery
  - pronunciation of local words and currency names
  - recording format and file naming

  It MUST include the reference https://www.youtube.com/watch?v=47MNn4bsmSw, **labelled as a tone
  reference only**, and state that the reference voice must not be copied, closely imitated or
  cloned.
- **FR-021**: The first recording language and accent MUST be **Ghanaian English** (`en-GH`).
  **OPEN, provisional, pending Jefferson's confirmation.** The manifest MUST already hold slots for
  the other launch regions (`en-NG`, `en-GB`), so the first language can be changed without
  changing the prototype.

**More interactive**

- **FR-022**: On every child screen, the child MUST have something to do within about **8
  seconds** of any narration ending. No screen may consist only of listening.
- **FR-023**: Every screen in The Lost Coins MUST have **at least one child action besides
  "Next"**. Mission Intro, Decision, Result, Summary and Reward MUST each gain one (for example:
  tap the lost coins in the intro picture, tap a coin to hear it, answer Kudi's question, pop the
  celebration).
- **FR-024**: In the sort activity, coins MUST be **moved by hand by dragging**, with tap-to-move
  as a fallback for children who can't drag yet. Each jar's count MUST update **for every coin**,
  the moment it lands.
- **FR-025**: Kudi MUST react to **every** child action with the mapped pose:

  | Action | Kudi pose |
  |---|---|
  | Correct | thumbs up |
  | Encourage, try again | fist |
  | Step complete, celebrate | peace sign |
  | Greeting | wave |
  | While a line plays | headphones |

- **FR-026**: Tapping **any item, coin, picture or word** on a child screen MUST play its spoken
  name, or show its caption if the recording is pending.
- **FR-027**: The Lost Coins MUST include **call-and-response moments**, where Kudi asks and the
  child answers by tapping. There MUST be at least one in each of: Intro, Count, Decision and
  Summary.
- **FR-028**: Each correct step MUST give a **sound effect and a small celebration**. A mistake
  for ages 4–6 MUST give a **gentle "try again"** (a soft sound, the fist pose and an encouraging
  line), with **no failure screen** and no "wrong" sound or symbol (Constitution III).
- **FR-029**: Every screen MUST show a **replay button** for the last narration line spoken on
  that screen.
- **FR-030**: Sound effects MUST be original or properly licensed for commercial use, and MUST
  NOT contain synthesised speech.

**Delivery**

- **FR-031**: A **per-screen before/after summary** MUST be produced for the client. It shows the
  v0.1.0 and round-1 versions of every screen, with plain-language change notes and the list of
  open decisions.
- **FR-032**: The prototype version MUST be bumped to **0.2.0** and the tokens version to
  **0.2.0** (semver, constitution). The v0.1.0 prototype MUST remain recoverable for the
  before/after comparison.

**Carried over from the 002 code review (2026-11-14)**

The 002 code review deferred these findings to this round, because round 1 rewrites the same
files. Line references are to the prototype as committed in 002 (`prototype/assets/…`). Each
finding MUST be closed or explicitly re-deferred with a reason.

*Spec gaps (002 review, Spec a1–a6):*

- **FR-033 (a1, currency in narration)**: The currency MUST be named in narration and labels per
  region, as 002 FR-022 and US4-1 require: "the cedi (GH₵), naira (₦) or pound (£) is named in
  labels and narration".
  - Add per-region narration lines and caption overrides. The `strings_<region>` overrides
    promised in `data/mock-data.js:55` don't exist yet.
  - Today the currency appears only in `KC.currencyLabel()`, at `app.js:279` (reviewer menu) and
    `screens.js:457` (Wallet caption).
  - The narration script (FR-017) MUST include these lines.
- **FR-034 (a2, market examples)**: Market examples MUST change by region on every screen that
  shows them (002 FR-022).
  - Today only the Decision subtitle uses `marketExamples.treat` (`screens.js:309`). The
    `drink` and `snack` examples (`data/regions.js:22, 41, 61`) are never used.
  - The spend result, the item added (`screens.js:345`) and the history label `history.sticker`
    "Sun sticker" (`data/mock-data.js:144`, used by the sample entry at `:37`) are the same in
    every region.
- **FR-035 (a3, spoken hint at 6 s)**: The first idle hint, at 6 s, MUST replay the screen's
  recorded prompt (002 research D9, US5-1: "visual and spoken hint"). Today speech starts only
  at level 2 (`app.js:248`, `if (level >= 1 …)`). With FR-014 this means replaying the recorded
  line, or showing its caption if pending, never synthetic speech.
- **FR-036 (a4, bottom-nav labels heard)**: Tapping a bottom-nav tab MUST let its spoken label
  finish (002 contract §1: "Each tab has a narrated label"). Today `app.js:342` speaks, then
  `KC.go` → `render` calls `KC.stopSpeech()` at `app.js:196`, cutting it off. Fix: play the tab
  label after the screen change, or don't stop label clips on navigation.
- **FR-037 (a5, caption fallback)**: When a line can't be played, its caption MUST be shown. This
  supersedes 002 D8's "caption on reviewer screens". FR-016 now requires it for everyone, with a
  "recording pending" marker. Today the failure path does nothing visible
  (`app.js:137`, `catch … the cue still animates`).
- **FR-038 (a6, long-idle pose)**: The 002 placeholder `idle` pose is never used (the 20 s hint
  still uses `point`, `app.js:247`). Under FR-010 only the five supplied poses are allowed.
  - The long-idle state MUST use a mapped supplied pose: **wave** (greeting) to welcome the
    child back.
  - The placeholder `kudi/idle.svg` and the other placeholder poses MUST be removed.
  - `docs/design/kudi-the-cub.md` MUST be updated to the five-pose mapping.

*Code smells (002 review, Standards; refactors to do while re-skinning):*

- **FR-039 (duplicated code: number pad)**: The parent-gate and PIN number pads are written twice
  (`screens.js:157` and `:177`). Extract one shared keypad builder used by both.
- **FR-040 (duplicated code: coin image)**: Coin and note images are built by hand in about 8
  places: `activities.js:28, 36, 77, 95, 162`, `celebrate.js:18`, `screens.js:363`, and
  `screens.js:193`, which builds the path without `KC.coinSrc`.
  - Add one helper (for example `KC.coinImg(denomId, opts)`) that always sets `src` via
    `KC.coinSrc` and sets `data-region`, and use it everywhere.
  - The "pick one card" selection code is also repeated (`screens.js:88, 100, 317`). Extract one
    single-select helper.
- **FR-041 (primitive obsession: positional lists)**: Lists read by position (`bands` `b[2]` at
  `screens.js:53`, `opts` `o[3]` at `:312`, `cats` `c[2]` at `:462`) MUST become named objects
  (for example `{ label, band, enabled }`).
- **FR-042 (repeated switches: save/spend)**: The save/spend branches repeat at `screens.js:320,
  342–345, 355, 361, 371–372, 399, 475`. Replace them with **one choice table** (icon, labels,
  sub-label, wallet effect, result art, summary line, history kind) that every screen reads.
- **FR-043 (magic number: 8 coins)**: The coin count `8` is hard-coded at `screens.js:261`
  (`'× 8'`), `:338, :359, :388` (`|| 8`), and `activities.js:35, 37, 50, 188` (the progress dots
  and labels "of 8", "Find 8", `|| 8`). `KC.data.lostCoins.hidden` (`data/mock-data.js:48`)
  exists but isn't used. All of these MUST read the configured count, so the mission can be
  retuned in one place.
- **FR-044 (shotgun surgery: offline file list)**: `sw.js:3` keeps the offline file list by
  hand, and its `CACHE` name (`sw.js:2`) repeats the prototype version. The list MUST be generated
  (for example by a `tools/design` script, checked in CI) and the cache name derived from
  `KC.version`, so new assets such as recordings (FR-019) are cached without hand edits.
- **FR-045 (mysterious name: button label key)**: The Wallet's "Back to Home" button reuses the
  key `reward.home` (`screens.js:444` and Wallet at `:480`). Use a neutral key (for example
  `nav.back_home`) for both.

*Also found while fixing the 002 review:*

- **FR-046 (externalise screen-reader text)**: Screen-reader labels and image alt text MUST come
  from the strings file, like all other child-facing text (Constitution VI). They are still
  English literals at:
  - `activities.js:37, 76, 83, 161`
  - `screens.js:86, 96, 232, 362, 365, 473, 492, 494`
  - `app.js:147`

### Key Entities

- **Brand Colour**: one official colour, with its name, value, role from the guide, and whether
  it is primary or supporting.
- **Derived Colour**: a tint, shade or state colour, with the brand colour it comes from, its
  purpose, and whether it needs client approval.
- **Contrast Finding**: a foreground and background pairing, its ratio, the requirement it must
  meet, pass or fail, and for failures the proposed nearest passing option.
- **Mascot Pose**: one of the five supplied poses, and the state it represents.
- **Narration Line**: line ID, screen, text, delivery note, target length, and language.
- **Audio Manifest Entry**: line ID, language, file location, and status (recorded or pending).
- **Sound Effect**: an ID, the moment it plays, and its source and licence.
- **Interaction Moment**: a screen, the child action, the Kudi pose shown, the sound or line
  played, and the outcome.
- **Before/After Entry**: a screen, the before view, the after view, change notes, and the
  category (brand, voice or interaction).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of prototype screens use only brand colours, recorded derivations, or the
  flagged success green. 0 unrecorded colour values are found by the automated token check.
- **SC-002**: 100% of text and meaningful-graphic pairings used in the prototype pass WCAG 2.x AA.
  Every failure found during design is listed with its accepted alternative.
- **SC-003**: 0 uses of synthetic or generated speech remain in the prototype, verified by an
  automated search and by playing every screen.
- **SC-004**: 100% of screens in The Lost Coins have at least one child action besides "Next".
- **SC-005**: In a timed walkthrough of The Lost Coins, the child is never more than about 8
  seconds without something to tap or drag.
- **SC-006**: 100% of child actions produce a visible Kudi pose change and a sound (or a caption,
  if the recording is pending), within a moment the child perceives as instant.
- **SC-007**: 100% of narration lines in the script are 8 seconds or shorter when read at the
  brief's pace, and each carries exactly one idea.
- **SC-008**: Adding a recording for any line ID makes it play with **0 changes** to the
  prototype, verified with at least 3 sample files.
- **SC-009**: The client approves round 1, or returns a single consolidated list of changes,
  within one review cycle of receiving the prototype and the before/after summary.
- **SC-010**: A first-time reviewer finds, for any screen, its before view, after view and change
  notes in under 30 seconds.

## Assumptions

- **Charcoal**: the guide prints `#000000`, but the swatch shows about `#231F20`. That is the
  usual result of printing 100% black, so `#231F20` is assumed for screens, with a note for the
  client to confirm. Charcoal isn't assigned a role in the guide's recommendations, so it is
  reserved and not used for UI text, where Mane Brown is the heading and text colour.
- **Fonts**: Sobas Play and Skia appear only inside the supplied logo artwork (FR-011), so no
  embedding licence is needed now. The UI font proposed under FR-012 will be a free,
  commercially licensed rounded font, such as the OFL fonts already used in v0.1.0. If the client
  later wants Sobas Play or Skia as live text, their licences must be checked first.
- **Logo files**: the logo and mascots are taken from the supplied brand guide at the highest
  available quality, without altering them. The client will be asked for master files (vector
  logo, transparent mascot images) for production.
- **Mascot pose order**: the five poses are identified visually from the brand guide's mascots
  page and mapped as the client specified. The mapping is shown in the design documents for the
  client to confirm.
- **Avatars**: the four child avatars (animal friends) from v0.1.0 are not the mascot and stay as
  placeholders. They are re-coloured only through tokens.
- **Product name in text**: the wordmark artwork reads "Kudicub's" and the guide's body text says
  "Kudicubs". In-product text keeps "KudiCubs" (spec 001 FR-001) until the client says otherwise.
  This is listed as an open decision in the before/after summary.
- **Logo tagline contrast**: the approved yellow logo version sets "Play. Earn. Roar!" in white on
  Sunshine Yellow (1.5:1). Logos are exempt from WCAG text-contrast rules, so it is used unchanged
  and flagged to the client. The white and Mane Brown versions are preferred where possible.
- **Captions**: captions for pending recordings are a reviewer and fallback aid. Pre-reader
  testing with children (spec 002 US5) should wait until recordings exist.
- **Regions**: the Ghana, Nigeria and UK coin sets and the reviewer menu from v0.1.0 remain. Coin
  names per region are included in the narration script.
- **Out of scope**: recording the audio itself, new or modified mascot artwork, and production
  Flutter code.
