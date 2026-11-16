# Feature Specification: Prototype Round 2: Testing Fixes, Scratch Voice, Real Play Data, Stable Demo Link and Automated Validation

**Feature Branch**: `004-prototype-round-2`

**Created**: 2026-11-15

**Status**: Draft

**Builds on**: [003 Client feedback round 1](../003-brand-voice-interactive/spec.md) (prototype
v0.2.0). **Prototype version**: 0.2.0 → **0.3.0**. **Tokens version**: 0.2.0 → **0.3.0**.

**Input**: User description: "Prototype round 2: fixes from testing, a temporary scratch voice,
real play data in place of mock data, a stable demo link, and automated validation. Builds on
003. No production app code." (Full brief, sections A–E and Out of scope, is in the feature
request; every numbered item maps to a requirement below.) **Updated 2026-11-15** with the
second brief: measured fold failures (A1), the general 48×48 rule (A7), a load-failure screen
(A9), the repository README (D4) and the pre-commit live-link check (Workflow).

## Context

Round 1 (003) put the official brand, the human-voice pipeline and much more interaction into the
clickable prototype. Testing it showed four gaps that stop the client and children from judging it
fairly:

1. **Layout and navigation slips.** Some main actions fall below the fold after the child
   answers, Back can lead somewhere odd, and opening Reward directly can grant a reward.
2. **Silence.** No human recordings exist yet, so every line shows "Recording pending" and
   pre-readers can't play. A clearly marked, temporary **scratch voice** lets the flow be
   heard and demonstrated until the human recordings arrive.
3. **Mock numbers.** The wallet, badges and level start pre-filled with sample data, so nothing
   the child does is reflected truthfully.
4. **No stable link.** The demo link is a temporary tunnel that stops when the developer's
   machine or session does; it dropped twice during testing.

Round 2 fixes all four and adds automated validation that runs on every change.

## Amendments to earlier specs

| Earlier rule | Amended to | Why |
|---|---|---|
| 003: "Never fall back to a synthetic voice" (FR-014, SC-003) | **No live or browser speech synthesis, ever.** Pre-generated AI audio is allowed **only** as a marked, temporary **scratch** track for demos (FR-012–FR-022). | Pre-readers can't evaluate a silent prototype. A pre-generated, labelled scratch track keeps the human recording as the only release voice, while the demo can be heard now. |
| 002 research D11, superseded by 003 data-model §9: storage is limited to session preferences (`region`, `sound`, `notes`, `voiceLang`) | **The player's progress is also saved on the device** and survives a refresh or reopening the link (FR-027). The list of what is saved is fixed (Key Entities), and parent-gate input is never saved (FR-028). | Real play data is meaningless if a refresh erases it; reviewers and children return to the link across days. Everything saved is fictional game data the constitution already permits (nickname from a preset list, age band, progress). |
| 003 FR-016: every pending line shows its caption with a "Recording pending" badge to everyone | The voice status badge ("Scratch voice" or "Recording pending") is shown **only when reviewer notes are on** (FR-019). Captions still appear whenever a line cannot be played (003 FR-037 stands). | Children and the client should hear a natural demo, not see production notes. |

## Release blocker

> **⚠ RB-1: Scratch audio MUST be replaced by human recordings before any public release.**
> No build that contains any line with the "scratch" status may be released to the public, an
> app store, or children outside supervised testing. The scratch track exists for internal and
> client demos only. (Constitution VII; 003 voice direction brief.)

## Principles touched *(Constitution, Product & Content Standards)*

- **I. Child-First Flow**: the main action must be fully visible without scrolling on small
  phones (FR-001–FR-002); Back never leads to a dead or rewarding state (FR-003–FR-005);
  first-time empty screens invite the child to play (FR-036).
- **III. Failure Is Safe**: unchanged. Fixes must not add any failure state.
- **IV. Age-Adaptive Progression**: only the 4–6 band is playable in the prototype. Bands 7–9,
  10–12 and 13–15 stay "Coming soon" and are not changed. The scratch voice rate is set for
  ages 4–6.
- **V. Child Safety & Privacy**: device storage of progress is introduced and justified
  (Data stored about the child, below). Parent email, PIN and anything typed in the parent gate
  are never stored or sent. The demo link stays out of search engines.
- **VI. Localised by Configuration**: coins and treat names come from the region configuration
  on every money screen (FR-046). One recorded exception: the load-failure screen (FR-051) has
  its few words built in, because it must work when the strings file is what failed to load.
- **VII. Pre-Reader Accessible**: a scratch voice makes the flow audible now (temporary,
  RB-1); captions remain the fallback for anything that can't play.

## Data stored about the child *(Constitution V)*

| Data | Where | Why it's needed | Never |
|---|---|---|---|
| Nickname (picked from the preset list) | This device only | Shown on Home and greeting lines | Free text, real names |
| Avatar choice, age band, region | This device only | Shown on screens; selects coins and voice | Photos, location |
| Game progress: coin events, savings, XP, level, badges, pillars, daily-activity count, whether onboarding is done | This device only | Real play data (FR-023–FR-027) | Converted to real money; sent anywhere |
| Preferences: sound, reviewer notes, voice language | This device only (as in 003) | Reviewer and sound settings | — |
| **Parent email, PIN, maths answers, anything typed in the parent gate** | **Nowhere** | — | Stored, logged or sent (FR-028) |

Nothing leaves the device. "Restart" in the reviewer menu erases all of it (FR-029).

## Clarifications

### Session 2026-11-15 (from the brief)

- Q: Which voice for the scratch track? → A: The neural voice "en-NG-EzinneNeural" at a speaking
  rate about 10% slower than default, for ages 4–6. This is a stock voice, not a clone of the
  tone-reference video (003 brief still applies).
- Q: What goes in the first scratch batch? → A: Only the lines used in "The Lost Coins" flow
  for the default region (Ghana), about 60 lines, so the developer can approve the voice by ear
  before the rest are generated.
- Q: Where is the stable link hosted? → A: GitHub Pages, deployed automatically on merge to the
  main branch. If the account plan or the repository's private visibility doesn't allow it,
  work stops and the developer is given the options. The repository is **never** made public
  without asking.
- Q: Does progress persistence amend the session-only storage rule? → A: Yes; recorded in
  Amendments, with the reason.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A child plays The Lost Coins on a small phone without getting stuck (Priority: P1)

A 5-year-old opens the prototype on a small phone (360×640) and plays The Lost Coins from start
to finish. On every screen the next step is fully in view without scrolling, including straight
after they answer on Count and Summary. Back never takes them to a reward or the parent gate,
the caption bar doesn't repeat what Kudi's bubble already says, and the coins inside the count
jars are big enough to tap.

**Why this priority**: These are the defects testers hit. A child who can't see the next
button, or lands on an odd screen, can't complete the core loop (Constitution I).

**Independent Test**: At 360×640 and 390×844, play the flow; on each screen, before and after
every interaction, the main action is fully inside the visible area; press Back from every
screen and check where it lands.

**Acceptance Scenarios**:

1. **Given** the Count screen at 360×640, **When** the child answers "Which jar has the most
   coins?", **Then** the Next button is fully visible without scrolling.
2. **Given** the Summary screen at 360×640, **When** the child taps their answer, **Then** Next
   is fully visible without scrolling.
3. **Given** the child is on Home, Wallet or Progress, **Then** no Back button is shown.
4. **Given** the child has just reached Home from Reward, **When** they press the browser or app
   Back, **Then** they do not return to Reward, a Result screen or the parent gate.
5. **Given** no run has been completed in this visit, **When** Reward is opened directly or
   refreshed, **Then** nothing is granted and the child is taken to Home.
6. **Given** a completed mission is replayed, **When** Reward appears, **Then** the title
   "Great practice!", the spoken line and the caption all use the replay line.
7. **Given** Kudi asks "Which jar has the most coins?", **Then** the big running counter is
   hidden until the question is answered.
8. **Given** Kudi's bubble shows a line, **Then** the caption bar does not also show the same
   text.
9. **Given** a script or data file fails to load, **When** the prototype opens, **Then** a
   friendly screen with Kudi and a "Tap to try again" button appears instead of a blank or broken
   page, and tapping it reloads the prototype.
10. **Given** any child screen at 360×640, **Then** every interactive element is at least 48×48.

---

### User Story 2 - The client hears the flow in a scratch voice (Priority: P1)

Jefferson opens the demo and hears Kudi speak every line of The Lost Coins in a natural scratch
voice, with no "Recording pending" badges in his way. The developer generated the voice with one
command, listened to the first batch, and approved it before generating the rest. With reviewer
notes on, each line shows whether it is scratch, recorded or still pending, and the reviewer
menu shows the counts per language.

**Why this priority**: Pre-readers and the client can't judge a silent game. This is the
quickest honest way to make the demo audible before human recordings exist.

**Independent Test**: Generate the first batch; play The Lost Coins for Ghana with sound on and
notes off: every line plays audio and no voice badge is visible. Turn notes on: lines show
"Scratch voice"; the reviewer menu counts match the files present.

**Acceptance Scenarios**:

1. **Given** a line has both a human recording and a scratch file, **When** it plays, **Then**
   the human recording is used.
2. **Given** a line has only a scratch file, **When** it plays, **Then** the scratch file plays.
3. **Given** a line has neither, **When** it is due, **Then** its caption is shown and nothing is
   spoken; no speech is ever synthesised in the browser.
4. **Given** reviewer notes are off, **Then** no "Scratch voice" or "Recording pending" badge is
   shown; **Given** notes are on, **Then** the badge shows the line's status.
5. **Given** the generator is run twice, **Then** the second run skips every line that already
   has a file and reports how many were generated, skipped and failed.
6. **Given** a line fails to generate, **Then** the generator retries it and, if it still fails,
   reports it by ID and carries on with the rest.

---

### User Story 3 - The child's own play shows up truthfully and is kept (Priority: P1)

A new player starts with nothing: 0 coins, 0 savings, 0 XP, level 1, no badges, an empty wallet
history and empty learning pillars. Kudi greets them with an invitation to play instead of blank
charts. After one run of The Lost Coins, the wallet, its history and chart, badges, XP, level,
pillars and the daily challenge show exactly what that run earned, under the nickname and avatar
the child picked. Closing the tab and opening the link again keeps everything.

**Why this priority**: Real data is what makes the prototype a credible preview of the product:
the child sees cause and effect (Constitution II).

**Independent Test**: Restart; check every value is zero and every empty state is friendly; play
one run; compare every screen's values with that run's earnings; refresh; values are unchanged;
Restart; values are zero again.

**Acceptance Scenarios**:

1. **Given** a fresh start, **When** Home, Wallet and Progress are opened, **Then** coins,
   savings and XP are 0, the level is 1, there are no badges, history is empty and pillars are
   at zero, each shown with a friendly Kudi invitation, not an empty chart or list.
2. **Given** the child chose a nickname and avatar in onboarding, **Then** those (not a preset)
   appear on Home and wherever the child is shown.
3. **Given** one completed run, **Then** the wallet, history entries, chart, badges, XP, level
   and pillars equal exactly what that run earned, and nothing else.
4. **Given** the child played today, **Then** the daily challenge shows today's real activity;
   **Given** a new day, **Then** it starts again from zero.
5. **Given** saved progress, **When** the page is refreshed or the link reopened, **Then** all
   values are unchanged.
6. **Given** the reviewer chooses Restart, **Then** all saved progress is erased and the next
   screen shows a fresh start; **Given** they choose "Load sample data", **Then** every screen
   shows full sample values for demonstrating.
7. **Given** the parent gate was completed, **Then** no email, PIN or other typed gate input
   exists anywhere in device storage.

---

### User Story 4 - The client always uses the same, current demo link (Priority: P2)

Jefferson keeps one link on his phone. Every time a change is merged, the link updates by
itself, and the reviewer menu shows which prototype version and build date he is looking at.
Search engines don't list it. After each publish, an automatic check confirms the live link
starts and every file it needs is reachable.

**Why this priority**: Removes the dependency on the developer's machine, but the prototype is
reviewable without it (zip and local run still work).

**Independent Test**: Merge a change; the live link shows the new version and build date in the
reviewer menu; the post-publish check passes.

**Acceptance Scenarios**:

1. **Given** a change is merged to the main branch, **Then** the live link is updated
   automatically, without anyone uploading files by hand.
2. **Given** the live link, **Then** pages tell search engines not to index or follow them.
3. **Given** the reviewer menu is opened, **Then** it shows the prototype version and build
   date.
4. **Given** a publish finished, **Then** an automatic check loads the live link, confirms the
   app starts, and confirms every listed asset and audio file is reachable; any failure is
   reported.
5. **Given** hosting can't be used because of the account plan or the private repository,
   **Then** work stops and the developer gets the options; the repository is not made public.

---

### User Story 5 - Every change is checked automatically (Priority: P2)

On every pull request, the full validation suite runs without anyone's machine: the whole
journey, the fold test at both sizes, navigation, replay economy, voice files, saved data, tap
targets, contrast and regions. A failure blocks the change with a readable report.

**Why this priority**: Prevents regressions of every fix above; the suite largely exists
locally from 002/003 and needs extending and running automatically.

**Independent Test**: Open a pull request that deliberately breaks one rule (for example, a
47 px tap target); the automated run fails and names it. Revert; it passes.

**Acceptance Scenarios**:

1. **Given** a pull request, **Then** the suite runs automatically and reports pass/fail on it.
2. **Given** the full journey Welcome → onboarding → parent gate → Home → The Lost Coins →
   Reward → Home, **Then** there are zero console errors and zero failed requests.
3. **Given** each check in E1–E9 of the brief, **Then** it has at least one automated test that
   fails when the rule is broken.

---

### User Story 6 - The parent confirms the PIN (Priority: P3)

When setting the parent PIN, the grown-up enters it twice. If the two don't match, they are
gently asked to try again; the PIN is never saved.

**Why this priority**: A small, expected safety step; the rest of round 2 doesn't depend on it.

**Independent Test**: Enter 2580 then 2581: asked to try again; enter 2580 twice: continue.

**Acceptance Scenarios**:

1. **Given** the PIN step, **When** a PIN is entered, **Then** a "confirm PIN" step follows.
2. **Given** the confirmation differs, **Then** a calm message asks to enter it again and the
   flow doesn't continue; **Given** it matches, **Then** the flow continues.
3. **Given** any outcome, **Then** neither entry is stored.

### Edge Cases

- **Reward or a Result screen opened by link or refresh, mid-run or with no run**: nothing is
  granted and the child goes to Home. An in-progress mission run is not resumed after a
  refresh; completed outcomes are already saved.
- **Back after Reward**: lands on Home (or leaves the app), never on Reward, Result or the gate.
- **Back from the first onboarding screen**: stays in the app (Welcome).
- **Returning player with saved progress opens the link**: onboarding and the parent gate are
  skipped; Welcome's main action goes straight to Home.
- **Storage unavailable or full** (private browsing, blocked storage): the prototype still
  plays for the session; nothing breaks; a reviewer-notes-only note says progress won't be kept.
- **Saved data from an older prototype version** or damaged data: it is discarded safely and the
  player starts fresh; the app never crashes on load.
- **Midnight during play**: the daily challenge counts by the device's local date; activity after
  midnight counts for the new day.
- **"Load sample data" then play**: the run adds to the sample values; Restart clears both.
- **Replay**: wallet balance and history are unchanged; only replay XP is added; the replay line
  is spoken.
- **Scratch file present but empty, corrupt or longer than 8 seconds**: validation fails before
  merge; at runtime an unplayable file falls back to the caption.
- **A scratch file whose line no longer exists** in the narration lines: validation reports it;
  the manifest never points at a missing file.
- **Caption and bubble differ only in punctuation or spacing**: treated as the same text; the
  caption bar stays hidden.
- **Generator run without network**: every line fails, is reported, and nothing partial is
  written as a valid file.
- **Hosting blocked** by plan or visibility: stop and present options (US4).
- **A script or data file fails to load** (offline before the first visit completes, a bad
  deploy, a blocked file): the load-failure screen appears (FR-051). It needs nothing from the
  file that failed, so its words are built in rather than taken from the strings file (the only
  exception to Constitution VI, because the strings file itself may be what failed).
- **The load-failure screen's reload fails again**: the same screen appears again; it never
  loops on its own (reload happens only on a tap).

## Requirements *(mandatory)*

### Functional Requirements

#### A. Layout and navigation

- **FR-001**: On every screen, the main action MUST be fully visible without scrolling at both
  360×640 and 390×844, before and after each interaction on that screen. Measured failures at
  360×640 (pixels hidden) that MUST be fixed:

  | Screen and moment | Main action | Hidden |
  |---|---|---|
  | Age selection, after picking | Next | 60 px |
  | Avatar, after picking | That's me! | 22 px |
  | Mission intro, after "Yes!" | Start | 34 px |
  | Count, after answering | Next | 198 px |
  | Summary, before answering | the answer cards | 143 px |
  | Summary, after answering | Next | 60 px |
  | Reward | Back to Home | 138 px |

- **FR-002**: FR-001 MUST be fixed by layout: smaller illustrations, tighter spacing, or a main
  action pinned to the bottom of the screen. It MUST NOT shrink text, MUST NOT shrink any
  interactive element below 48×48, and MUST NOT hide Kudi's prompt.
- **FR-003**: Home, Wallet and Progress MUST NOT show a Back button.
- **FR-004**: Back MUST never return to Reward, a Result screen or the parent gate.
- **FR-005**: Opening or refreshing Reward (and, by the same rule, a Result screen) without a
  completed run in the current visit MUST grant nothing and redirect to Home.
- **FR-006**: On a replay, the spoken line and the caption on Reward MUST be the replay line
  ("reward.replay"), matching the "Great practice!" title.
- **FR-007**: The big running counter on Count MUST be hidden while Kudi asks "Which jar has the
  most coins?", and may return after the answer.
- **FR-008**: The caption bar MUST appear only when its text differs from the text in Kudi's
  bubble on the same screen (ignoring case, spacing and punctuation).
- **FR-009**: Every interactive element on a child screen MUST be at least 48×48. This includes
  the coins inside the Count jars and any words that can be tapped to hear them (003 FR-026).
- **FR-010**: The parent gate MUST include a "confirm PIN" step after the PIN step. A mismatch
  shows a calm "try again" message and does not continue; a match continues.
- **FR-011**: Neither PIN entry MAY be stored (FR-028).
- **FR-051 (A9)**: If any script or data file fails to load, or the app fails while starting,
  the prototype MUST show a friendly screen with Kudi and a large "Tap to try again" button,
  instead of crashing or showing a blank page. Tapping it MUST reload the prototype. The screen
  MUST work without any of the prototype's scripts or data files, and MUST never reload by
  itself.

#### B. Scratch voice (temporary)

- **FR-012**: No live or browser speech synthesis MAY be used, ever. The existing no-synthesis
  check MUST keep failing on any use.
- **FR-013**: Each line in the audio manifest MUST have one of three statuses per language:
  **recorded** (human), **scratch** (pre-generated AI) or **pending** (no audio).
- **FR-014**: Playback MUST prefer recorded, then scratch, then show the caption (003 FR-037).
- **FR-015**: Scratch files MUST be kept apart from human recordings and clearly labelled as
  scratch, so they can be listed, counted and removed in one step, and so a recording can never
  be mistaken for scratch or vice versa.
- **FR-016**: A scratch-voice generator MUST read the narration lines file and write one audio
  file per line ID, using the voice "en-NG-EzinneNeural" at a rate about 10% slower than default
  (ages 4–6). It MUST need no account or key.
- **FR-017**: The generator MUST skip lines that already have a file, retry failed lines, and
  finish with a summary of how many lines were generated, skipped and failed (failed listed by
  ID). It MUST be able to generate a chosen subset of lines.
- **FR-018**: The first batch MUST contain only the lines used in The Lost Coins flow for the
  default region (Ghana), about 60 lines. The remaining lines are generated only after the
  developer approves the voice by ear.
- **FR-019**: The voice status badge ("Scratch voice" for scratch, "Recording pending" for
  pending) MUST be small and shown **only when reviewer notes are on**.
- **FR-020**: The reviewer menu MUST show recorded, scratch and pending counts for each language.
- **FR-021**: Every scratch file MUST be non-empty, playable and 8 seconds or shorter, matching
  the narration line limit (003).
- **FR-022**: The release blocker RB-1 MUST be recorded in this spec, in the design docs and in
  the voice direction brief: scratch audio must be replaced by human recordings before any
  public release.

#### C. Real play data

- **FR-023**: A new player MUST start at 0 coins, 0 savings, 0 XP, level 1, no badges, an empty
  wallet history and all learning pillars at zero.
- **FR-024**: The nickname and avatar shown anywhere MUST be the ones chosen in onboarding, never
  a preset. If the child picks no nickname, no name is shown ("Hi there!"); nothing is preselected.
- **FR-025**: Wallet history, the wallet chart, badges, level and pillars MUST be built only from
  events the child actually caused in play.
- **FR-026**: The daily challenge MUST reflect the child's real activity for the current local
  day and start again each new day.
- **FR-027**: Progress (the data listed in "Data stored about the child") MUST be saved on the
  device and survive a refresh or reopening the link. This amends the session-only storage rule
  (Amendments).
- **FR-028**: Parent email, PIN, maths answers, real names and anything typed in the parent gate
  MUST never be stored or sent.
- **FR-029**: The reviewer menu MUST keep "Restart", which erases all saved progress and
  preferences, and MUST gain "Load sample data", which fills every screen with sample values for
  demonstrating.
- **FR-030**: First-time empty states MUST be friendly: Kudi invites the child to play. No blank
  charts, empty lists or "0 items" tables are shown to a child.
- **FR-031**: Saved data from an older version, or damaged data, MUST be discarded safely,
  starting the player fresh without an error.
- **FR-032**: If device storage is unavailable, the prototype MUST still play for the session.
- **FR-033**: A replay MUST change no coins or wallet history, MUST add only the replay XP, and
  MUST speak "reward.replay" (002 replay economy rule stands).
  - **Clarified at code review (2026-11-15)**: this is the mission's own reward. The daily
    challenge (FR-026) counts replays as real play. When a replay completes the day's goal, the
    once-a-day daily reward (+10 coins and one "Market day" history row) is paid by the daily
    challenge, not by the mission. It is never paid twice on one date.

#### D. Stable demo link

- **FR-034**: The prototype MUST be published to a stable link by an automated deploy on every
  merge to the main branch, using GitHub Pages, replacing the temporary tunnel link.
- **FR-035**: Before any hosting is set up, the account plan and repository visibility MUST be
  checked. If they don't allow it, work MUST stop and the developer MUST be given the options.
  The repository MUST NOT be made public without the developer's explicit consent.
- **FR-036**: Every page MUST keep telling search engines not to index or follow it.
- **FR-037**: The reviewer menu MUST show the prototype version and the build date.
- **FR-038**: After each publish, an automatic smoke check MUST load the live link, confirm the
  app starts, and confirm every listed asset and audio file returns success. Any failure MUST be
  reported on the run.
- **FR-039**: The live link MUST be added to the repository README (created if it doesn't exist),
  the design README and the 004 quickstart.

#### E. Automated validation (run on every pull request)

- **FR-040**: The full validation suite MUST run automatically on every pull request and report
  pass or fail on it.
- **FR-041**: Full flow: Welcome → onboarding → parent gate → Home → The Lost Coins → Reward →
  Home with zero console errors and zero failed requests.
- **FR-042**: Fold test: FR-001 on every screen at both sizes, before and after each interaction.
- **FR-043**: Navigation tests for FR-003–FR-005, and a failed-script test for FR-051 (a script
  or data file is blocked → the load-failure screen appears; tapping it with the file restored
  starts the app).
- **FR-044**: Replay test for FR-033.
- **FR-045**: Voice test: every line in The Lost Coins flow has an audio file (recorded or
  scratch) that exists, is non-empty and lasts 8 seconds or less; the manifest has no entry
  pointing at a missing file.
- **FR-046**: Region test: switching Ghana, Nigeria and UK changes the coins and the treat names
  on every money screen.
- **FR-047**: Data test: a fresh start shows all zeros; after one run, wallet, history, badges
  and XP equal exactly what the run earned; values survive a refresh; Restart clears them;
  nothing from the parent gate is in storage.
- **FR-048**: Tap-target test: no interactive element on a child screen under 48×48 (FR-009), at
  both sizes.
- **FR-049**: Contrast test: every text/background pairing in use passes WCAG AA.

#### Workflow

- **FR-050**: Each commit MUST follow a code review. Commits are authored as the developer, with
  no AI co-author line. The work is delivered as **one pull request**, closed when merged. The
  prototype and tokens versions are bumped to 0.3.0. **Before committing**, the developer is
  shown the diff, all test results, and the live link together with the version number it
  reports.

### Key Entities *(include if feature involves data)*

- **Player profile**: nickname (from the preset list), avatar, age band, region, onboarding
  completed. One per device.
- **Play event**: something the child caused: coins found, saved, spent, XP earned, badge earned,
  mission completed or replayed; with the local date. The wallet, history, chart, badges, level,
  pillars and daily challenge are all derived from these events.
- **Saved progress**: the player profile, the play events, and a data version, kept on the
  device; erased by Restart; replaced by "Load sample data".
- **Sample data set**: a fixed, fictional set of events used only by "Load sample data".
- **Narration line**: as in 003 (ID, text, screen, max 8 s), now with a per-language status:
  recorded, scratch or pending.
- **Scratch track**: the set of pre-generated scratch files, one per line ID, kept apart and
  labelled; temporary (RB-1).
- **Build information**: prototype version and build date shown in the reviewer menu.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On 100% of child screens, at both 360×640 and 390×844, the main action is fully
  visible without scrolling, before and after every interaction.
- **SC-002**: 0 routes by which Back reaches Reward, a Result screen or the parent gate; 0 Back
  buttons on Home, Wallet and Progress.
- **SC-003**: Opening or refreshing Reward without a completed run grants 0 coins, 0 XP and 0
  badges in 100% of attempts.
- **SC-004**: With the first scratch batch in place and notes off, 100% of The Lost Coins lines
  for Ghana play audio, and 0 voice badges are visible.
- **SC-005**: 0 uses of live or browser speech synthesis anywhere (automated check).
- **SC-006**: A fresh start shows 0 coins, 0 savings, 0 XP, level 1, 0 badges and 0 history
  entries; after one run, every value equals that run's earnings exactly.
- **SC-007**: 100% of saved values are unchanged after a refresh; 100% are cleared by Restart.
- **SC-008**: 0 items of parent-gate input in device storage after any path through the gate.
- **SC-009**: After each merge, the live link shows the new version within 10 minutes and the
  smoke check reports 0 unreachable files.
- **SC-010**: The full validation suite runs on 100% of pull requests; each of the nine
  validation areas (E1–E9) has at least one test proven to fail when its rule is broken.
- **SC-011**: The full journey completes with 0 console errors and 0 failed requests.
- **SC-012**: A first-time child sees a Kudi invitation, not an empty chart or list, on 100% of
  screens that would otherwise be empty.
- **SC-013**: With any one script or data file blocked, 100% of loads show the load-failure screen
  (0 blank pages, 0 uncaught errors shown to the child); after the file is restored, one tap
  starts the app.
- **SC-014**: 0 interactive elements under 48×48 on any child screen at either size.

## Assumptions

- **003 lands first.** 004 builds on the 003 work (prototype v0.2.0), which is awaiting the
  developer's approval to commit (003 T059). 004 work starts on its own branch from 003 once
  that commit exists.
- **Hosting precondition (FR-035)**: the repository is currently **private**, and GitHub Pages
  is not yet enabled. Publishing a Pages site from a private repository needs a paid GitHub plan,
  and on most plans the published site is reachable by anyone who has the link (only search
  engines are kept out, by noindex). The plan could not be read with the current access (checked
  again on 2026-11-15: the GitHub token has no `user` scope), so the developer confirms it at plan
  review, before any setup.
- **The scratch voice service** generates audio from the line text over the internet. Only the
  scripted narration lines are sent, never child or parent data. Its terms are suitable for an
  internal, temporary demo track only, which RB-1 already limits it to.
- **Voice and region**: the scratch voice is Nigerian English for every region, including Ghana
  (default). The human casting brief (a Ghanaian female storyteller) is unchanged; the scratch
  voice is not a casting decision.
- **Daily challenge**: counts completed missions (first runs and replays) on the device's local
  date; its goal stays as configured in 003.
- **Replay XP**: the amount already defined for replays in 002/003 is used.
- **Mid-run refresh**: an unfinished mission run is not saved; only completed outcomes are.
- **Returning players** skip onboarding and the parent gate. The PIN is only demonstrated (it is
  never stored, so it can't be checked later).
- **"Load sample data"** uses the sample values that 002/003 showed by default, now only on
  request.
- **Versions**: prototype and tokens both go to 0.3.0 (minor: new behaviour, no breaking token
  renames planned).
- **Out of scope**: human recordings, new mascot art, production Flutter code, accounts, and any
  server or database.
