# Feature Specification: Complete UI/UX and Prototypes for the Mobile App, Website and Dashboard

**Feature Branch**: `005-platform-ux-prototypes` (not yet created; no branch hook is registered)

**Created**: 2026-11-20

**Status**: Draft

**Builds on**: [001 MVP](../001-kudicubs-mvp/spec.md) (requirements and user stories),
[002 UX prototype](../002-ux-prototype/spec.md), [003 round 1](../003-brand-voice-interactive/spec.md)
and [004 round 2](../004-prototype-round-2/spec.md) (the clickable mobile prototype, v0.3.0, which
covers only the 4–6 "Lost Coins" journey).

**Input**: User description: "UI/UX and Prototype for the mobile app, Website and Dashboard. Our main
goal is to arrange our UI/UX and Prototypes for all this platform without missing a single user
journey or user story and based on what we already have we can also find useful designs around
dribbble so that we have perfect of this so as to be able to share them."

## Clarifications

### Session 2026-11-20 (defaults confirmed by the developer on 2026-11-20; client sign-off still to come)

- "Dashboard" means two things here: the **Parent Dashboard** (a web view of a family's children,
  progress and account) and a small **Team Console** for the KudiCubs staff (families, content
  status). Teacher and school dashboards stay out of scope, as in 001.
- "Website" means the public marketing and information site for parents, plus the web sign-in that
  leads into the Parent Dashboard. It is not a web version of the child game.
- Dribbble and similar galleries are **inspiration only**. Nothing is copied; the originality rules
  in [design-references.md](../../docs/design/design-references.md) apply to every new reference.

## Constitution Alignment: Principles, Age Bands and Child Data

**Principles this feature touches** (see `.specify/memory/constitution.md`):

- **I Child-First Flow, II Learn by Doing, III Failure Is Safe, VII Pre-Reader Accessible**: apply to
  every new child screen in the mobile app (FR-005 to FR-009).
- **IV Age-Adaptive Progression**: each new mission follows its band's rules (FR-006). The website
  and dashboards show each child at their own band.
- **V Child Safety & Privacy**: the parent area stays behind the gate (FR-010); the website and
  dashboards collect no child data and carry no ads or tracking (FR-014, FR-026); support views show
  nicknames only (FR-018); no real money anywhere.
- **VI Localised by Configuration**: coins and examples on every new screen come from region
  configuration (FR-007, FR-017).

**Age bands**: 4–6 (no failure screen, fully playable without reading), 7–9, 10–12 and 13–15 (retry
offered, nothing earned is lost). Website and dashboards are adult surfaces and have no band
behaviour of their own.

**Child data stored**: none new. The app keeps its existing local play record (nickname, age band,
region, avatar, progress events). The website, Parent Dashboard and Team Console use only one
fictional sample family and store nothing but a demo sign-in state for the session.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One map shows every journey and story, and every one has a design (Priority: P1)

The design lead opens a single journey and story map. It lists every user, every journey and every
user story across the mobile app, website and dashboards. Each row shows which platform it lives on
and where its screens are in the prototype. Anything without a design is visibly marked as a gap.
Nothing in the 001 MVP spec, and no journey the client listed, is missing from the map.

**Why this priority**: The client's main goal is "without missing a single user journey or user
story". A complete map is the proof, and it drives the work for every other story.

**Independent Test**: Take every user story and journey in the 001 spec and the client's brief. Find
each one in the map and follow its link to a screen. Count the rows without a screen. The count must
be zero for in-scope rows.

**Acceptance Scenarios**:

1. **Given** the 001 MVP user stories, **When** each is looked up in the map, **Then** it appears
   once with its platform, its actor, and links to its prototype screens.
2. **Given** a journey with no design yet, **When** the map is opened, **Then** the gap is shown
   plainly and counted in a coverage summary.
3. **Given** a journey that was deliberately left out, **When** the map is opened, **Then** it is
   listed as out of scope with the reason.
4. **Given** the client names a journey nobody listed, **When** it is added, **Then** the coverage
   summary changes and the new row shows its design status.

---

### User Story 2 - A child can play every journey in the mobile app prototype (Priority: P1)

On a phone, a reviewer can follow a child's whole experience in all four age bands. That covers
welcome, age band, avatar and nickname, the parent gate at sign-up, the home screen with Continue and
the daily challenge, the path of missions, all six screen types (Decision, Resource Management,
Action Result, Market Simulation, Round Summary and Activity), reward and level-up, wallet,
progress, badges, profile, and the idle hints from Kudi. Each age band looks and behaves as its band
rules say, and the region changes coins and examples (Ghana, Nigeria, United Kingdom).

**Why this priority**: The mobile app is the product. Today only one 4–6 mission is clickable, so
most of the app cannot yet be shown or tested.

**Independent Test**: Start at the welcome screen for each age band and reach the reward, wallet,
progress and profile screens using only taps. Repeat for each of the three regions.

**Acceptance Scenarios**:

1. **Given** a new reviewer on a phone, **When** they choose each age band in turn, **Then** each
   band shows a home screen and at least one complete mission built from the band's own screen
   types and tone.
2. **Given** a child makes a poor choice in a 4–6 mission, **When** the result shows, **Then** the
   outcome is gentle and the game continues with no failure screen.
3. **Given** a child makes a poor choice in a 7–15 mission, **When** the result shows, **Then** a
   retry is offered and nothing already earned is lost.
4. **Given** any child screen, **When** it opens, **Then** it has exactly one obvious primary action
   and a way back or forward, so no screen is a dead end.
5. **Given** the child is idle, **When** a short time passes, **Then** Kudi guides them to the next
   step.
6. **Given** the region is changed, **When** any money screen opens, **Then** the coins and examples
   match that region.

---

### User Story 3 - A parent can do everything on the phone behind the grown-up gate (Priority: P1)

A parent passes the parent gate and enters their PIN. They see all their children, each child's
progress, and the settings: age band, region, sound and narration, PIN and email management, adding
a child, "this is my phone" versus "family device", signing in on a new device with a one-time
emailed code, signing out, and deleting the family account with its warnings. A reviewer can try
wrong PINs, forgotten PINs and expired codes and see a friendly, safe path in each case.

**Why this priority**: The parent area carries the child-safety rules (Constitution V). A child
experience without it is not shareable as the full product.

**Independent Test**: From the child profile, reach the parent area, complete every settings action
once, sign in on a "new device" with a code, and delete the account, using only taps.

**Acceptance Scenarios**:

1. **Given** a child taps the parent entry, **When** the gate shows, **Then** a child cannot pass it
   by guessing and the child is returned to play without losing anything.
2. **Given** a parent enters a wrong PIN several times, **When** the limit is reached, **Then** a
   calm lock-out message and a recovery route are shown.
3. **Given** a parent signs in on a new phone, **When** they enter the emailed code, **Then** they
   choose "This is my phone" or "Family device" and land in the matching view.
4. **Given** a parent starts to delete the account, **When** the confirmation shows, **Then** it
   states what will be erased, offers a way back, and cannot be completed by a child.

---

### User Story 4 - A parent visiting the website understands KudiCubs and gets the app (Priority: P2)

A parent lands on the website from a link or a search. In under a minute they learn what KudiCubs is,
how it teaches money skills through play, what each age band does, how their child's safety and
privacy are protected, and how to get the app on Android or iOS. The site also has an FAQ, a contact
route, a family sign-in that leads to the Parent Dashboard, and the legal pages (privacy, terms,
children's privacy). It works on a phone, a tablet and a desktop.

**Why this priority**: The website is the front door for parents and partners and is the first thing
many people will be sent. It needs to exist and be shareable, but the app comes first.

**Independent Test**: Give a parent who has never heard of KudiCubs the website prototype on their
phone. Ask them what it is, what ages it is for, and how to get it. They answer all three correctly
and find the privacy page without help.

**Acceptance Scenarios**:

1. **Given** the home page, **When** it opens, **Then** it shows the brand, the promise "Play. Earn.
   Roar!", one primary "Get the app" action, and Kudi.
2. **Given** a parent wants to know about safety, **When** they look for it, **Then** a page explains
   the parent gate, the PIN, no real payments and how data is handled, in plain words.
3. **Given** a visitor on Android or iOS, **When** they choose the download action, **Then** they
   reach the right store route, and desktop visitors see a way to send the link to their phone.
4. **Given** a visitor with a question, **When** they use the FAQ or contact form, **Then** they see
   an answer or a confirmation, and an error state if the form is incomplete.
5. **Given** any page, **When** it is viewed at phone, tablet and desktop widths, **Then** nothing is
   cut off and the main action stays visible.

---

### User Story 5 - A parent follows their family on the web Parent Dashboard (Priority: P2)

A parent signs in on the website with their email and a one-time code. The dashboard shows each child
with their age band, level, recent play, the skills they are growing (Know, Understand, Decide,
Invest, Share), badges, and what their coins taught them. The parent can switch children, change
a child's age band or region, manage the PIN and email, see the devices signed in, export or delete
family data, and read the monthly summary. Empty, new-family and loading states are designed too.

**Why this priority**: The 001 clarifications say parents follow progress from their own device.
The web dashboard is the larger-screen version of that and is a named client deliverable.

**Independent Test**: Sign in as a sample family with two children in different age bands. Find each
child's recent play and strongest skill, change a setting, and sign out, in under three minutes.

**Acceptance Scenarios**:

1. **Given** a sample family, **When** the dashboard opens, **Then** each child's level, recent
   missions and skill progress are visible without scrolling on a desktop.
2. **Given** a brand-new family with no play yet, **When** the dashboard opens, **Then** an
   encouraging empty state explains the next step instead of blank charts.
3. **Given** an expired or wrong sign-in code, **When** it is entered, **Then** a clear message and a
   way to request a new code appear.
4. **Given** the parent chooses to delete the data, **When** the confirmation shows, **Then** it
   names the data, the 12-month inactivity rule and a way back.
5. **Given** the dashboard on a phone, **When** it is opened, **Then** the layout reorganises for the
   narrow screen and keeps every function.

---

### User Story 6 - The three platforms look like one brand and one system (Priority: P2)

A reviewer moves between the app, the website and the dashboards and feels one product: the same
logo, palette, type, Kudi poses, icon style, tone of voice, and component behaviour, adapted for
each platform's size and audience. The design system documents every shared and platform-specific
component, state (default, hover or press, focus, disabled, loading, error, empty) and size.

**Why this priority**: Consistency is what makes the set look "perfect" and keeps later development
cheap. It builds on the existing tokens and components.

**Independent Test**: Pick ten components at random from the system and find each in the app, the
website and the dashboard where it applies. Their look and states match the documented version.

**Acceptance Scenarios**:

1. **Given** the existing design tokens and components, **When** a website or dashboard component is
   needed, **Then** the system either reuses an existing one or adds one, and the addition is
   documented.
2. **Given** any new screen, **When** it is checked, **Then** it uses only approved colours, type and
   icons, and the text and controls meet the accessibility contrast and size rules.
3. **Given** the child app and the adult surfaces, **When** compared, **Then** child screens stay
   large, playful and pre-reader friendly, while adult surfaces are calmer and denser but still on
   brand.

---

### User Story 7 - The team collects, checks and records design references from galleries (Priority: P2)

The designers search Dribbble and similar galleries for ideas on mobile app, website and dashboard
patterns that fit KudiCubs. For each idea they record the link, what pattern was learned, which
screen it influenced, and how KudiCubs differs. A reviewer can check that nothing was copied.

**Why this priority**: The client wants the best of what exists, and also needs it to be original and
safe to share.

**Independent Test**: Choose any five screens at random. Each cites its references, names the adopted
pattern and shows what is different from the source, and no source image, mascot, colour palette or
layout was reproduced.

**Acceptance Scenarios**:

1. **Given** a reference from a gallery, **When** it is added to the record, **Then** it has a link,
   the platform, the pattern adopted, and a "how we differ" note.
2. **Given** the reference record, **When** the originality review is done, **Then** it states
   method, reviewer and date, and every reviewed screen passes or is reworked.
3. **Given** a gallery design that conflicts with the brand or the child-safety rules (for example,
   dark patterns, urgency timers or manipulative rewards), **When** considered, **Then** it is
   rejected and the reason is recorded.

---

### User Story 8 - The client shares the whole set with one link and a guide (Priority: P1)

The client opens one stable link and sees the three platforms side by side: mobile app, website and
dashboards. A short guide explains how to open each, which journeys to try, which role to use, and
how to leave feedback. The set opens on a phone and a laptop without installing anything and can be
sent to others (investors, partners, parents, advisers) without extra setup.

**Why this priority**: "To be able to share them" is part of the main goal. If it cannot be shared,
the work is not finished.

**Independent Test**: Send the link to three people who have never seen the project. Each reaches all
three platforms and completes one journey on each, without help.

**Acceptance Scenarios**:

1. **Given** the share link, **When** it opens, **Then** a landing page lists the three platforms and
   the journeys to try, with version and date.
2. **Given** a recipient on a phone, **When** they open the mobile app prototype, **Then** it fits the
   screen; **When** they open the website and dashboard, **Then** each adapts to the size they use.
3. **Given** the sample data, **When** a reviewer loads it, **Then** the dashboard and app show the
   same family and children consistently.
4. **Given** a new round of changes, **When** the set is updated, **Then** the same link shows the
   new version and the change list.
5. **Given** the set is shared, **When** it is searched for online, **Then** it is not indexed.

---

### User Story 9 - KudiCubs staff manage families and content in a Team Console (Priority: P3)

A staff member signs in to a Team Console. They look up a family to help with support (without seeing
more than they need), see which missions and worlds are live or planned, and see the status of the
voice recordings for each line of narration. Roles limit what each staff member can see.

**Why this priority**: It completes the "Dashboard" scope, but the family-facing surfaces matter
more at this stage. The staff view can follow later.

**Independent Test**: Sign in as support staff and as a content editor. Each can complete their own
tasks and cannot reach the other's restricted views.

**Acceptance Scenarios**:

1. **Given** a support role, **When** a family is looked up, **Then** only the minimum needed to help
   is shown, and children's names are shown as nicknames only.
2. **Given** a content role, **When** the content view opens, **Then** each mission shows its age
   band, region coverage and voice-recording status.
3. **Given** a role without access, **When** a restricted page is requested, **Then** a clear
   "no access" state is shown.

---

### Edge Cases

- A screen or journey exists in the 001 spec but has no prototype: it shows as a gap on the map, never
  silently missing.
- A reviewer opens the set on a very small phone (about 320 px wide), on a tablet, and on a wide
  desktop: layouts adapt, and nothing needs sideways scrolling.
- No network, slow network and sound off: the prototype stays usable, and narration has a visual
  equivalent.
- A child tries to enter the parent area, the website sign-in or the dashboard: child surfaces never
  link into adult ones without the gate.
- A parent has several children in different age bands and regions: the dashboard shows each with its
  own region currency.
- Very long nicknames, empty progress, zero badges and a first-ever visit are all designed.
- Reviewer language and region differ from the default: coins, examples and spellings follow the
  chosen region.
- A gallery reference uses a mascot, brand colours or layout too close to another product: it is
  rejected or reworked.
- The shared link is opened years later or in a restricted browser: the version and date remain visible
  and an offline-capable core works.

## Requirements *(mandatory)*

### Functional Requirements

**Journey and story coverage**

- **FR-001**: The set MUST include one journey and story map listing every actor, journey and user
  story for the mobile app, website, Parent Dashboard and Team Console.
- **FR-002**: Every row of the map MUST show its platform, actor, priority, design status and links to
  the screens that cover it.
- **FR-003**: Every user story in the 001 MVP spec and every journey in this spec MUST appear in the
  map, and rows without a design MUST be shown as gaps with a running coverage count.
- **FR-004**: Deliberately excluded journeys MUST be listed as out of scope with the reason.

**Mobile app**

- **FR-005**: The mobile prototype MUST cover onboarding, home, daily challenge, the mission path,
  mission intro, all six screen types, reward and level-up, wallet, progress, badges, profile and
  idle hints.
- **FR-006**: The prototype MUST include at least one complete playable mission for each of the four
  age bands (4–6, 7–9, 10–12, 13–15), each following that band's rules for tone, reading level and
  complexity.
- **FR-007**: The prototype MUST show the region differences for Ghana, Nigeria and the United
  Kingdom wherever money appears.
- **FR-008**: Every child screen MUST have exactly one obvious primary action and MUST NOT dead-end
  (Constitution I). Ages 4–6 MUST NOT see a failure screen; ages 7–15 MUST be offered a retry and
  lose no earned progress (Constitution III).
- **FR-009**: Child screens MUST be usable by pre-readers through narration, icons and Kudi (Constitution
  VII), with a visual equivalent for every spoken cue.
- **FR-010**: The mobile prototype MUST cover the parent area: gate, PIN set and confirm, wrong PIN
  and lock-out, PIN recovery, children list, per-child progress, settings, add child, region,
  device mode ("This is my phone" / "Family device"), new-device sign-in with an emailed code,
  sign-out, and account deletion with warnings.

**Website**

- **FR-011**: The website MUST include a home page, how-it-works, age bands, safety and privacy for
  parents, a get-the-app page with Android and iOS routes, FAQ, contact, family sign-in, and the
  privacy, terms and children's privacy pages.
- **FR-012**: The website MUST adapt to phone, tablet and desktop widths.
- **FR-013**: Every form MUST have its empty, filled, error, success and loading states designed.
- **FR-014**: The website MUST NOT contain any child-directed play, ad content or manipulative
  prompts, and MUST NOT collect children's personal data.

**Dashboards**

- **FR-015**: The Parent Dashboard MUST include sign-in with a one-time emailed code (with wrong,
  expired and resend states), a family overview, a per-child view, skills by pillar, badges, recent
  play, settings, devices, data export and deletion, and sign-out.
- **FR-016**: The Parent Dashboard MUST design its empty, loading, error and new-family states.
- **FR-017**: The Parent Dashboard MUST adapt to desktop, tablet and phone, and show money in each
  child's own region currency.
- **FR-018**: The Team Console MUST include role-based sign-in, family lookup for support, a content
  and mission status view with voice-recording status, and a no-access state. Support views MUST show
  nicknames only and the minimum data needed.

**Design system and references**

- **FR-019**: One design system MUST serve all platforms, extending the existing tokens and
  components, and documenting each new component with its states and sizes.
- **FR-020**: All screens on all platforms MUST use only approved brand colours, fonts, Kudi poses and
  icons and MUST meet the contrast and touch-size rules already in force.
- **FR-021**: Every screen influenced by an outside gallery design MUST cite the reference, the
  pattern adopted and how KudiCubs differs. No outside assets, mascots, colours, fonts, copy or
  layouts may be reproduced.
- **FR-022**: The reference record MUST include an originality review with method, reviewer and date,
  and a list of rejected references with reasons (including manipulative or dark-pattern designs).

**Sharing and review**

- **FR-023**: The complete set MUST be reachable through one stable link that works on a phone and a
  laptop with nothing to install.
- **FR-024**: The share page MUST list the three platforms, the journeys to try per role, the version
  and date, the change list and how to send feedback.
- **FR-025**: A single shared sample family MUST be used consistently across the app, website sign-in
  and dashboards.
- **FR-026**: The shared set MUST be kept out of search engines, and MUST contain no real personal
  data.
- **FR-027**: The existing automated checks (tokens, contrast, brand, narration, audio, tests) MUST
  continue to pass and MUST be extended to cover the new platforms and the coverage map.

### Key Entities

- **Platform**: Mobile app, website, Parent Dashboard or Team Console.
- **Actor**: A child (by age band), a parent, a website visitor, a support staff member, or a content
  editor.
- **Journey**: A start-to-finish path an actor follows on a platform.
- **User story**: A statement of what an actor wants and why, linked to its journeys, with a priority.
- **Coverage row**: One entry on the map: story, journey, platform, actor, design status, screen
  links.
- **Screen**: A designed, clickable view with states, belonging to a platform and journey.
- **Component**: A reusable design piece with states and sizes, shared or platform-specific.
- **Design reference**: An outside inspiration with link, pattern adopted, difference, and review
  result.
- **Sample family**: The shared fictional family used across all platforms.
- **Release (share set)**: A versioned, dated bundle of all platforms with a change list.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of in-scope user stories from the 001 spec and this spec appear in the map, and
  100% of them link to at least one designed screen.
- **SC-002**: A first-time reviewer reaches the reward, wallet and profile screens in each of the four
  age bands in under 5 minutes per band, with no dead ends.
- **SC-003**: A parent who has never seen the website can say what KudiCubs is, which ages it is for
  and how to get it within 60 seconds, in at least 4 of 5 tests.
- **SC-004**: In at least 4 of 5 tests, a parent finds a child's recent play and strongest skill on the
  Parent Dashboard in under 90 seconds.
- **SC-005**: Every screen on all platforms passes the contrast and touch-size checks, and every shared
  component appears consistently on every platform where it applies.
- **SC-006**: 100% of reviewed screens have either no outside reference or a complete reference entry,
  and the originality review finds zero copied assets, mascots, palettes or layouts.
- **SC-007**: Three people who have never seen the project each open the share link and complete one
  journey on each of the three platforms without help.
- **SC-008**: No layout needs sideways scrolling at phone (320 px), tablet and desktop widths on the
  website and Parent Dashboard.
- **SC-009**: The share link stays the same across new versions, and each version shows its number,
  date and change list.
- **SC-010**: Client reviewers report no missing journey in the first full review round, or each
  reported gap is added to the map within one working day.

## Assumptions

- The Parent Dashboard and the Team Console are the two meanings of "Dashboard"; teacher and school
  dashboards remain out of scope (001). The client will confirm this.
- The website is a parent and partner information site with the dashboard sign-in. It has no child
  play and no online purchases, because the product has no real payments (001).
- The deliverable is design and clickable prototypes with fictional sample data. No production
  app, back end or real sign-in is built.
- The existing brand (client brand guide), design tokens, Kudi poses, narration approach and age-band
  rules are reused. The scratch voice remains a demo-only placeholder, with human recordings still
  required before any public release.
- The 001 decisions still apply: three regions (Ghana, Nigeria, UK), Android and iOS phones and
  tablets, a one-time emailed code for parent sign-in, and a 12-month inactivity rule for accounts.
- At least one full mission per age band is enough to demonstrate the 7–9, 10–12 and 13–15 worlds in
  the prototype; the full mission list stays in the 001 MVP scope.
- Website copy for legal pages is placeholder text pending review by the client's legal adviser.
- Gallery research uses publicly viewable pages only, and no screenshots of other designs are
  committed to the repository, as in earlier rounds.
- The existing hosting and automated checks for the prototype are reused for the shared link.
