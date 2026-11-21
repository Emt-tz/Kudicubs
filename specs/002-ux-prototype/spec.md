# Feature Specification: KudiCubs UX Design System & Clickable Prototype

**Feature Branch**: `002-ux-prototype`

**Created**: 2026-11-14

**Status**: Draft

**Depends on**: [specs/001-kudicubs-mvp/spec.md](../001-kudicubs-mvp/spec.md) (requirements),
[plan.md](../001-kudicubs-mvp/plan.md) (architecture, tag `v0.2.0-architecture`), and
[docs/design/diagrams.md](../../docs/design/diagrams.md) (flows).

**Input**: User description: "UX design and clickable prototype for KudiCubs, to show the client
what will be built before any app code is written. Deliverables: docs/design/: design tokens
(colour, type, spacing, radius), component list, Kudi the Cub usage rules, per-age-band UI rules.
prototype/: a clickable, phone-sized HTML prototype with mock data, covering Welcome → Age
Selection → Avatar → Parent Gate → Home → Mission Intro → Decision → Result → Summary → Reward →
Wallet → Progress, using "The Lost Coins" mission for ages 4–6. Design references (patterns only,
never copy assets, mascots, colours or layouts): Duolingo for the level path, streaks, big
single-action buttons and celebration moments; Khan Academy Kids and Toca Boca for pre-reader
navigation and gentle feedback. KudiCubs must look like its own brand: lion-cub character, warm
African-market feel, localised coins."

## Clarifications

### Session 2026-11-14 (from `/speckit-analyze`, approved by the developer)

- Q: How is "exactly one main action" met on choice and activity screens? → A: One `data-primary`
  button, or one group of equal choices or targets while a choice or activity is in progress
  (FR-013).
- Q: How are coins shown for 4–6 when the region changes? → A: As the region's coin picture plus
  a number, never as a currency-symbol price. The currency name and symbol go in labels and
  narration (FR-022, SC-006, US4; matches spec 001's coin display rule).
- Q: Which components were missing from the list? → A: `illustration` and `action-result` are
  added, and `gentle-hint` is a state of the main action (FR-004, now 25 components).
- Q: Must the prototype narrate every prompt? → A: Yes, every child-facing prompt is spoken, with
  a placeholder voice allowed (FR-015).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The client clicks through the whole 4–6 journey on a phone (Priority: P1)

The client, Jefferson Agbai, opens the prototype on his phone or in a phone-sized browser window
and taps through the full journey a 4–6 year old will have:

1. Welcome (Kudi the Cub, "Join the Pride").
2. Age selection.
3. Avatar.
4. Parent gate.
5. Home.
6. The Lost Coins mission: Mission Intro → find, sort and count the coins → the save-or-spend
   Decision → Result → Summary → Reward.
7. Wallet and Progress.

Every screen looks and behaves like the real app will, using made-up example data. It's clear to
him what will be built and how it will feel before any app code exists.

**Why this priority**: The whole point of this feature is to get the client's approval of the
look, feel and flow before development starts. Changing a prototype is far cheaper than changing
an app.

**Independent Test**: Give the prototype link or file to someone who hasn't seen it. Without
help, they can reach the Reward screen and then the Wallet and Progress screens from the Welcome
screen using only taps, and nothing is broken or dead-ends.

**Acceptance Scenarios**:

1. **Given** the prototype is opened on a phone, **When** the Welcome screen loads, **Then** it
   fills the phone screen and shows Kudi the Cub, the KudiCubs name, and one large "Let's Go"
   button.
2. **Given** the Welcome screen, **When** the client taps through, **Then** the screens appear in
   this order: Age Selection → Avatar → Parent Gate → Home. Each screen has one obvious main
   button.
3. **Given** Home, **When** the client taps Continue, **Then** The Lost Coins Mission Intro opens,
   followed by the find, sort and count activities, the save-or-spend Decision, the Result, the
   Summary and the Reward.
4. **Given** the Decision screen, **When** the client picks **Save**, **Then** the Result shows
   coins going into savings. **When** they go back and pick **Spend**, **Then** the Result shows
   a treat. Both outcomes are happy, never framed as a mistake.
5. **Given** the Reward screen, **When** the client taps "Back to Home", **Then** Home shows the
   updated coins, XP and new badge from the example data.
6. **Given** Home, **When** the client opens Wallet and Progress, **Then** Wallet shows the
   balance, savings, a history and simple bar charts, and Progress shows a level path, badges and
   the five pillars.
7. **Given** any screen, **When** the client wants to go back or start again, **Then** a back
   control and a "restart prototype" option are available. "Restart prototype" is shown only in
   a reviewer menu that children won't see.

---

### User Story 2 - Designers and developers get one design system to build from (Priority: P1)

A designer or developer opens `docs/design/` and finds everything needed to build screens the
same way every time:

- **Design tokens**: colour, type, spacing, corner radius and elevation, with names and values.
- **Component list**: every reusable piece (buttons, choice cards, coin counter, XP bar, badge,
  jar, speech bubble, bottom navigation and so on), with its states and where it's used.

The prototype uses exactly these tokens and components.

**Why this priority**: The tokens and components carry the client's approval into the real app.
Without them, the Flutter build would drift from what the client approved.

**Independent Test**: Pick any 3 prototype screens. Every colour, font size, spacing and corner
radius on them can be traced to a named token in `docs/design/`, and every element to a
component in the component list.

**Acceptance Scenarios**:

1. **Given** `docs/design/`, **When** a reader opens the tokens document, **Then** it lists
   colour, typography, spacing, radius and elevation tokens. Each has a name, a value, and
   when to use it.
2. **Given** the colour tokens, **When** text-and-background pairs are checked, **Then** every
   pair used for text meets the WCAG AA contrast ratio (4.5:1 for normal text, 3:1 for large
   text and icons).
3. **Given** the component list, **When** a reader looks up a component, **Then** it shows the
   component's purpose, its states (for example default, pressed, disabled, celebrating), its
   minimum touch size, and which screens use it.
4. **Given** the prototype, **When** it's compared with the tokens and components, **Then** no
   screen uses a colour, size or element that isn't documented.

---

### User Story 3 - Everyone uses Kudi the Cub and the age bands consistently (Priority: P2)

The design documents include:

- **Kudi the Cub usage rules**: who Kudi is, personality, poses and expressions, when Kudi
  speaks, where Kudi stands on screen, what Kudi never does, and minimum size.
- **Per-age-band UI rules**: how screens change across 4–6, 7–9, 10–12 and 13–15, using the same
  structure with rising complexity.

**Why this priority**: These rules keep 17 missions and 4 worlds feeling like one product, and
they put the constitution's child-first rules into practice. They're needed before content is
written, but the client walkthrough (User Story 1) comes first.

**Independent Test**: A reviewer with only the rules documents can decide, for 5 sample
situations (for example "a 4–6 child drops a coin in the wrong jar" or "a 10–12 round ends at a
loss"), what Kudi does and what the screen shows. Their answers match the prototype or the spec
001 rules in all 5.

**Acceptance Scenarios**:

1. **Given** the Kudi rules, **When** a reader looks up a situation (welcome, intro, hint, good
   choice, gentle redirect, celebration, idle), **Then** the matching pose, expression, line
   style and screen position are given.
2. **Given** the Kudi rules, **When** a reader checks what Kudi must never do, **Then** it states
   that Kudi never scolds, never shows disappointment at a child's choice, never pressures a
   child to spend, and never appears in the parent area as a salesperson.
3. **Given** the age-band rules, **When** a reader compares the four bands, **Then** a single
   table shows text amount, icon use, number of choices, timers, failure handling, retry, number
   ranges, narration and button sizes for each band. These match the band rules in spec 001 and
   plan 001.

---

### User Story 4 - The client sees that coins and examples change by country (Priority: P2)

From a reviewer menu in the prototype, the client switches the region between Ghana, Nigeria and
the United Kingdom. The coin art and the market examples change on every prototype screen,
including the coins found and sorted in The Lost Coins. The currency name and symbol change in
labels and narration. In-game coins on 4–6 screens are always shown as the region's coin picture
plus a number, never as a price such as "GH₵120" (spec 001: coins are not real money, and 4–6
uses coin pictures).

**Why this priority**: Localised coins are a core brand promise and a constitution principle
(VI). Seeing it working reassures the client before regional art is commissioned.

**Independent Test**: Switch the region three times and check that the Lost Coins, Wallet and
Home screens show the right currency for each, with the coin counts unchanged.

**Acceptance Scenarios**:

1. **Given** the reviewer menu, **When** the region is set to Ghana, Nigeria or the UK, **Then**
   that country's coin designs appear on the find, sort and count screens and in every coin
   counter. The cedi (GH₵), naira (₦) or pound (£) is named in labels and narration.
2. **Given** a region change, **When** the client returns to Wallet, **Then** the same number of
   coins is shown with the new region's coin picture, as spec 001 FR-043 requires.

---

### User Story 5 - A few young children try the prototype without reading (Priority: P3)

A facilitator hands the prototype on a phone to a small number of 4–6 year olds (with parental
permission) and watches. The children move through the Lost Coins journey using pictures, sounds
and Kudi's guidance, without being read to.

**Why this priority**: This is early evidence for the "pre-reader" and "never wonder what to do
next" principles. It's valuable, but optional for client sign-off.

**Independent Test**: Three or more 4–6 year olds each start at Home and reach the Reward screen.
The facilitator records where any child hesitated for more than 10 seconds.

**Acceptance Scenarios**:

1. **Given** a child on any child-facing prototype screen, **When** they wait without tapping,
   **Then** Kudi gives a visual and spoken hint toward the main action within a few seconds.
2. **Given** the sort activity, **When** a child drops a coin in the wrong jar, **Then** the coin
   bounces back with a friendly cue. No "wrong" sound, red cross or failure message is ever
   shown.

---

### Edge Cases

- **Prototype opened on a large screen** (laptop or tablet): it shows inside a centred,
  phone-sized frame, not stretched to full width.
- **No sound or muted device**: every narrated prompt also has a visual cue (an animated speaker
  icon and a Kudi pose). The prototype stays usable for the client, though not for pre-readers.
- **No internet connection**: once opened or downloaded, the prototype keeps working, so the
  client can demo it anywhere.
- **The client taps a screen element that isn't wired up in the prototype**: nothing breaks, and a
  small reviewer-only note says "Not in this prototype". Child-facing screens never dead-end.
- **Parent gate in the prototype**: the email and PIN fields accept example values only. Nothing
  is sent or stored anywhere, and the screen says so in the reviewer notes.
- **Wrong parent-gate answer**: the gate stays closed and gently resets, so the client can see
  how a child is kept out.
- **The client goes back from Reward and replays**: the example data doesn't award first-time
  rewards twice, so the replay rules from spec 001 R10 are visible.

## Requirements *(mandatory)*

### Functional Requirements

**Design documents (`docs/design/`)**

- **FR-001**: The design documents MUST define **design tokens** for colour, typography, spacing,
  corner radius and elevation. Each token has a name, a value and usage guidance.
- **FR-002**: The colour palette MUST be original to KudiCubs and have a **warm African-market
  feel**: sun-baked earth tones, market-fabric accents, a lion-cub golden primary colour. Every
  text-and-background pair used MUST meet WCAG AA contrast.
- **FR-003**: Typography tokens MUST include a friendly, highly legible display style and a body
  style. Child-facing body text MUST be at least 18 pt, and button labels for 4–6 at least 22 pt.
  The fonts used MUST be licensed for commercial app use.
- **FR-004**: The documents MUST include a **component list** covering at least these 25
  components:
  - Primary button, secondary button, icon button
  - Choice card, narration speaker cue
  - Kudi speech bubble, illustration (scenes and a standalone Kudi), coin counter, XP bar,
    level badge, daily sun (`streak-daily`)
  - Badge tile, jar, coin and note token, progress dots
  - Bottom navigation, region coin set, parent-gate pad, PIN pad
  - Action result, bar chart, level-path node, celebration overlay, gentle hint (a state of the
    main action), reviewer menu

  Each component lists its purpose, states, minimum touch size, and the screens that use it.
- **FR-005**: The documents MUST include **Kudi the Cub usage rules**:
  - Character description (a lion cub; warm and encouraging; curious)
  - At least 7 situational poses: welcome, explain, point or hint, think, cheer, gentle
    redirect, sleep or idle
  - When Kudi speaks, and the rules for Kudi's lines (short, positive, never scolding)
  - Placement, minimum size, and what Kudi must never do
- **FR-006**: The documents MUST include **per-age-band UI rules** for 4–6, 7–9, 10–12 and 13–15:
  text amount, icon use, choices per screen, button sizes, timers, failure and retry handling,
  number ranges, narration, and feedback style. These MUST match the band rules in spec 001
  (FR-028–FR-031) and plan 001 (R9).
- **FR-007**: The documents MUST include a **design references** section. It records which
  patterns were learned from Duolingo, Khan Academy Kids and Toca Boca:
  - Duolingo: level path, streaks, big single-action buttons, celebration moments
  - Khan Academy Kids and Toca Boca: pre-reader navigation, gentle feedback

  It MUST state how KudiCubs differs from each in character, colour and layout.

**Clickable prototype (`prototype/`)**

- **FR-008**: The prototype MUST be **phone-sized and clickable**. On a phone it fills the screen;
  on larger screens it sits in a centred phone frame.
- **FR-009**: The prototype MUST cover these screens, in order:
  1. Welcome
  2. Age Selection
  3. Avatar
  4. Parent Gate (challenge, PIN, email)
  5. Home
  6. Mission Intro
  7. Lost Coins activities: find, sort, count
  8. Decision (save or spend)
  9. Result
  10. Summary
  11. Reward
  12. Wallet
  13. Progress
- **FR-010**: The mission shown MUST be **"The Lost Coins" for ages 4–6**, following spec 001
  FR-019–FR-024: find, sort by value, count, then a save-or-spend choice, with the save outcome
  and the spend outcome both reachable and both positive.
- **FR-011**: The find, sort and count activities MUST be interactive enough to show the idea:
  tap to find coins, drag or tap to place coins in jars, tap to count. A wrong jar MUST bounce
  the coin back with a gentle cue.
- **FR-012**: All data in the prototype MUST be example data, for example a child called "Ama"
  with 120 coins, level 2 and 3 badges. The prototype MUST NOT send or store any real personal
  information anywhere.
- **FR-013**: At any moment, each child-facing screen MUST have exactly **one visually dominant
  main action**. That is either a single main button, or, on choice and activity screens, a
  single group of equal choices or activity targets (for example the two Save/Spend cards, or
  the coins to find), which becomes a single main button once the choice or activity is done.
  Each screen MUST show an idle hint (a Kudi pose plus a pulsing highlight on the main action)
  after about 6 seconds without input.
- **FR-014**: Child-facing screens MUST be **icon-first**. The 4–6 screens MUST be usable by
  someone who can't read: pictures, coin images, numerals and Kudi's gestures carry the meaning.
- **FR-015**: Each child-facing prompt MUST show a narration cue (a speaker icon the child can tap
  to replay). The prototype MUST speak every child-facing prompt aloud. A placeholder voice is
  allowed, labelled as such.
- **FR-016**: No 4–6 screen in the prototype may show a failure, "wrong", game-over or red-cross
  state.
- **FR-017**: The Parent Gate screen MUST show the gate challenge from spec 001: press and hold,
  then a spoken or written multiplication answered on a number pad. Then a 4-digit PIN, the
  region choice, and a parent email field. These are clearly separated from child screens by a
  calmer, more grown-up style.
- **FR-018**: The Home screen MUST show the avatar, XP bar, coin balance, current level,
  a Continue button, a daily challenge card with the daily sun, and a badge preview. The daily
  sun MUST NOT show any penalty or "streak lost" message for 4–6 (spec 001 edge case).
- **FR-019**: The Reward screen MUST include a celebration moment (an animated burst, Kudi
  cheering) and show coins, XP and the badge earned, with a single "Back to Home" button.
- **FR-020**: The Wallet MUST show the balance, savings (a piggy bank or jar), a picture-based
  history, and simple bar charts of where coins came from and went. The Progress screen MUST
  show a winding level path, a badge grid with earned and locked badges, and the five pillars
  (Know, Understand, Decide, Invest, Share).
- **FR-021**: A **reviewer menu**, opened by a hidden or adult-style control, MUST let the
  reviewer:
  - Switch the region (Ghana, Nigeria, UK)
  - Jump to any screen
  - Toggle sound
  - Restart the prototype

  It MUST NOT be reachable by an accidental child tap.
- **FR-022**: Region switching MUST change the coin art and market examples on all prototype
  screens, and the currency name and symbol in labels and narration, while keeping the coin
  counts the same. For 4–6, coin amounts MUST be shown as the region's coin picture plus a
  number, never as a currency-symbol price.
- **FR-023**: The prototype MUST keep working without an internet connection once opened or
  downloaded.
- **FR-024**: The prototype MUST use only the documented tokens and components (FR-001, FR-004).

**Brand and originality**

- **FR-025**: All artwork, including Kudi the Cub, coins, icons and backgrounds, MUST be original
  to KudiCubs, or properly licensed for commercial use. No assets, mascots, colours, layouts,
  fonts or sounds may be copied from Duolingo, Khan Academy Kids, Toca Boca or any other product.
- **FR-026**: KudiCubs MUST look like its own brand:
  - A lion-cub guide (not an owl, a monster, or any other app's mascot)
  - A warm African-market setting (for example, market stalls, woven fabric patterns, sunlight)
  - Localised coins
  - A palette that can't be mistaken for the reference apps
- **FR-027**: The prototype MUST use the name "KudiCubs" everywhere, never "BizKids" or "BizKidz"
  (spec 001 FR-001).

**Review and sign-off**

- **FR-028**: The deliverables MUST include a short **client review guide**. It explains how to
  open the prototype, the suggested click path, and what feedback is wanted (look and feel, Kudi,
  colours, flow, coins), so a non-technical client can review it alone.

### Key Entities

- **Design Token**: a named design value (colour, type style, spacing step, radius, elevation)
  with its value and usage rule.
- **Component**: a reusable interface element with a purpose, states, minimum touch size, and the
  screens that use it.
- **Kudi Pose**: a named expression and gesture for Kudi the Cub, with the situations it's used
  in.
- **Age-Band UI Rule**: one band's settings for text, icons, choices, timers, failure handling,
  numbers, narration and feedback.
- **Prototype Screen**: one clickable screen, with its main action, the next screen, and the
  example data it shows.
- **Example Data Set**: the made-up child, coins, XP, level, badges, wallet history and region
  used throughout the prototype.
- **Region Coin Set**: the coin and note art, currency name and symbol for Ghana, Nigeria or the
  UK.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time reviewer reaches the Reward screen from Welcome in under 5 minutes,
  without help, on a phone.
- **SC-002**: 100% of the 13 screens in FR-009 can be reached by tapping, and 0 child-facing
  screens are dead ends.
- **SC-003**: 100% of the text-and-background colour pairs in the prototype meet WCAG AA
  contrast.
- **SC-004**: 100% of interactive elements on child-facing screens are at least 48 × 48 points,
  and at least 64 × 64 points for 4–6 main actions.
- **SC-005**: On an audit of 3 random screens, 100% of colours, sizes and elements trace back to a
  named token or a listed component.
- **SC-006**: Switching between the 3 regions changes the coin art on 100% of the screens that
  show money, and the currency name in labels and narration, with the coin counts unchanged.
- **SC-007**: In an originality review, 0 assets, colours, mascots or layouts are found to be
  copied from the reference apps.
- **SC-008**: The client gives written sign-off on the look and feel, Kudi the Cub and the flow,
  or a list of changes, within one review round of receiving the prototype and review guide.
- **SC-009**: If the optional child test runs (User Story 5), at least 3 of every 4 children aged
  4–6 reach the Reward screen without being read to, and no child sees a failure state.
- **SC-010**: Every screen responds to a tap with visible feedback that feels instant, on a
  typical mid-range phone.

## Assumptions

- **No app code**: this feature produces design documents and a stand-alone prototype only. No
  part of the Flutter app or the backend is built here. The prototype is a throwaway
  demonstration, not the start of the app's code.
- **Prototype data**: example data only, no accounts, no network calls, nothing stored beyond the
  page itself.
- **Default region** is **Ghana** (the pilot context and spec 001's fallback region). The
  reviewer menu switches to Nigeria and the UK.
- **Find, sort and count activities**: they aren't in the screen list given by the user, but
  they're included between Mission Intro and Decision because they are The Lost Coins (spec 001
  FR-019) and the "Activity" screen type (FR-017 as amended). They're simplified for the
  prototype.
- **Artwork**: final illustration hasn't been commissioned yet (plan 001, open item O4). The
  prototype uses **original placeholder artwork** made for KudiCubs: a simple, consistent
  lion-cub character and coin art, clearly labelled "placeholder art" in the review guide. It is
  enough to judge the style direction, not the final drawings.
- **Narration audio**: real voice recordings come later (plan 001, open item O3). Placeholder
  recordings or clearly labelled synthetic voice may be used to show where narration plays.
- **Phone size** is a typical modern phone (about 390 × 844 points). Tablet layouts are described
  in the design documents but not prototyped.
- **Parent area**: only the Parent Gate is prototyped, because it is in the requested flow. The
  wider parent area (dashboard, settings) is not.
- **Sharing**: the prototype is shared with the client in a way he can open on his phone, for
  example a link or a file. The exact method is decided at planning.
- **Design references** are used only for interaction patterns, as the brief says. The
  originality review (SC-007) is done before the prototype is sent to the client.
- **Out of scope**: the 7–15 worlds, other missions, tablet prototypes, the parent dashboard,
  final art, final narration, and app development.
