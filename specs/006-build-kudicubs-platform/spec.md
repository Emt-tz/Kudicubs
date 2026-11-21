# Feature Specification: Build the KudiCubs Platform

**Feature Branch**: `006-build-kudicubs-platform`
**Created**: 2026-11-21
**Status**: Draft
**Input**: User description: "The prototype is accepted. Build the entire product from the 168 KudiCubs screens: a phone app, a web product (website, Parent Dashboard, Team Console), a backend, tested end to end, with an installable build and an online test link."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A child plays a mission on a phone (Priority: P1)

A child opens the app, picks an age band and avatar, passes the grown-up gate once, and plays missions for their band. Coins and XP are earned, badges unlock, and the wallet and progress screens reflect it. Ages 4–6 never see a failure screen; ages 7–15 can always retry and lose nothing earned.

**Why this priority**: This is the product. Without a playable loop nothing else has value.

**Independent Test**: On a fresh install, complete setup and one mission in each age band; check the wallet, progress and badges update, and that a failed 7–15 attempt offers retry with no loss.

**Acceptance Scenarios**:

1. **Given** a fresh install, **When** the family completes onboarding, the grown-up gate, PIN, country and email-code steps, **Then** they land on the child's home screen.
2. **Given** a child aged 4–6, **When** they make a sub-optimal choice, **Then** they see a gentle result and the mission continues, never a failure screen.
3. **Given** a child aged 7–15, **When** a mission outcome is unsuccessful, **Then** they are offered try again and keep every coin, badge and XP already earned.
4. **Given** no connection, **When** the child plays, **Then** the mission still works and progress is saved on the device and synced later.

---

### User Story 2 - A parent signs in and manages their family (Priority: P1)

A parent signs in with an emailed code, adds and edits children, sets country and device mode, changes the PIN, exports or deletes the family's data, and reviews each child's progress, on the phone's parent area and on the web Parent Dashboard.

**Why this priority**: Child safety and trust depend on the parent controls working.

**Independent Test**: Sign in on the web with a code, view a child's overview, change the PIN, export data, then delete the account and confirm everything is gone.

**Acceptance Scenarios**:

1. **Given** a valid email, **When** the parent enters the emailed code, **Then** they are signed in; a wrong or expired code shows its own error state.
2. **Given** a signed-in parent, **When** they open a child's page, **Then** wallet, skills, activity and badges match what the child did on the phone.
3. **Given** a parent confirms deletion, **When** it completes, **Then** all family data is removed and the deleted screen shows.
4. **Given** repeated wrong PIN attempts, **When** the limit is hit, **Then** the lock-out screen appears and waits.

---

### User Story 3 - A visitor learns about KudiCubs on the website (Priority: P2)

A visitor reads the website (home, how it works, age bands, safety, FAQ, privacy, terms), finds the get-the-app page, and contacts the team through a form that has success, error and sending states.

**Why this priority**: It is how new families find and trust the product.

**Independent Test**: Visit every public page, submit the contact form valid and invalid, and request the app link.

**Acceptance Scenarios**:

1. **Given** the home page, **When** a visitor follows any navigation link, **Then** the target page exists, including a 404 for unknown addresses.
2. **Given** a filled contact form, **When** it is sent, **Then** the message is stored and the thank-you state shows; an invalid email shows its error.

---

### User Story 4 - The team supports families and content (Priority: P2)

Staff sign in to the Team Console, search families and missions, view a family or mission, and see no-access, loading, empty and server-error states. Staff see only what they are allowed to.

**Why this priority**: Support and content upkeep need a safe internal tool.

**Independent Test**: Sign in as a staff user, search families, open one, and confirm a non-staff user is refused.

**Acceptance Scenarios**:

1. **Given** a staff account, **When** they search families with no match, **Then** the empty state shows.
2. **Given** a non-staff account, **When** it opens the console, **Then** the no-access screen shows and no family data is returned.

---

### User Story 5 - The team tests it online and on a device (Priority: P2)

The client's team opens a web link and installs an Android build that both talk to the same backend, so they can test without any setup.

**Why this priority**: Acceptance depends on stakeholders actually trying the product.

**Independent Test**: Open the web link on any computer; install the build on an Android phone; sign in with a sample family on each and see the same data.

**Acceptance Scenarios**:

1. **Given** the web link, **When** it is opened, **Then** the website and sign-in work without local setup.
2. **Given** the installed build, **When** it is opened with the same sample family, **Then** it shows the same children and balances as the web.

---

### Edge Cases

- Lost connection mid-mission: progress is kept on the device and syncs later without duplicating rewards.
- Same family on two devices at once: balances stay correct (rewards are recorded as events, not overwritten).
- Wrong, expired or reused email code; too many attempts.
- Child with no avatar chosen; parent with no children yet (empty states).
- Update-required, maintenance and server-error states at app start.
- A parent deletes the account while a child is mid-mission.
- Staff user whose access is removed while signed in.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The phone app MUST implement every one of the 108 mobile screens from the accepted design set (launch, setup, grown-up gate, PIN, country and email-code sign-in, home states, all four age-band missions, wallet, progress, badges, profile, parent area, system states).
- **FR-002**: The web product MUST implement every one of the 18 website screens, 30 Parent Dashboard screens and 12 Team Console screens from the accepted design set.
- **FR-003**: Every screen MUST show each of its designed states (success, failure, loading, empty, error, offline) in real behaviour, not only as a static picture.
- **FR-004**: Children aged 4–6 MUST never see a failure screen; ages 7–15 MUST always be offered retry; no band may lose earned progress, currency or badges as a penalty.
- **FR-005**: Only fictional currency may be used (Ghana GH₵, Nigeria ₦, UK £); no real payment is ever taken.
- **FR-006**: Parents MUST sign in with an emailed one-time code; children never sign in with an email.
- **FR-007**: A parent gate and PIN MUST protect the parent area on the phone; repeated wrong attempts MUST lock out for a time.
- **FR-008**: A family's data MUST be visible only to that family's parent; staff access MUST be limited by role and enforced by the backend, not only hidden in screens.
- **FR-009**: Parents MUST be able to export and permanently delete their family's data.
- **FR-010**: Wallet and XP MUST be derived from an append-only event record so that syncing several devices cannot lose or duplicate rewards.
- **FR-011**: The phone app MUST work offline for gameplay and sync when the connection returns.
- **FR-012**: The website contact form MUST store each valid message and show its success, error and sending states.
- **FR-013**: The same sample family MUST be loadable into the backend so every surface can be tried with real data.
- **FR-014**: The web product MUST use only dependencies with no known vulnerabilities at build time, and the build MUST fail when one is found.
- **FR-015**: An installable Android build connected to the backend MUST be produced, and a web link MUST be available for testing online.
- **FR-016**: Every user journey MUST have an automated check that runs the real screens: the web in a browser, and the phone app on a simulator.
- **FR-017**: Children's data collected MUST be limited to a nickname, age band, avatar, region and gameplay events; no third-party tracking.

### Key Entities

- **Family account**: the parent's sign-in identity, country and settings.
- **Child profile**: nickname, age band, avatar, region, belonging to one family.
- **Wallet event**: one coin or XP change (earn, spend, save, bonus), never edited, only added.
- **Mission and attempt**: catalogue entries per band, and each time a child plays one with its outcome.
- **Badge**: catalogue plus which children earned which.
- **Device**: a phone or tablet registered to a family, with its mode.
- **Contact message**: a website enquiry.
- **Staff user**: a team member with a role and access to the Team Console.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of the 168 designed screens exist and are reachable in the running products (verified by an automated coverage check against the journey map).
- **SC-002**: A new family completes setup and a first mission in under 5 minutes.
- **SC-003**: Every age band has at least one fully playable mission with its success and, for 7–15, failure-and-retry paths.
- **SC-004**: A parent can sign in, find a child's progress and change the PIN in under 3 minutes.
- **SC-005**: Data a child earns on the phone appears in the parent's web dashboard within 1 minute of reconnecting.
- **SC-006**: Zero known-vulnerable dependencies in the web product at release.
- **SC-007**: A non-staff user and another family's parent receive no data from any other family (verified by automated access checks).
- **SC-008**: The team can open the web product from a link and install the phone build with no setup beyond the link and a sample sign-in.

## Assumptions

- The accepted design is the 168 screens in the Design canvas and the repo prototype; where they differ, the canvas wins for look and the prototype for behaviour.
- Fixed technology choices from the request: a Next.js web product, a Flutter phone app, and a Supabase backend, run locally first and moved online afterwards.
- The earlier MVP plan (001) already sets the architecture (local-first app, event-log wallet, row-level security); this feature builds the accepted prototype on it. Heavy items from 001 not needed for the prototype's look (animated mascot runtime, game-engine mini-games, content-pack downloads) are deferred and listed in the plan.
- Email codes are delivered by the backend's mail service; locally they are read from its test inbox. A real mail provider is a later step.
- Going online needs a hosting account and a backend project; until those exist, the online link is a temporary public tunnel to the local stack, and the move to permanent hosting is a configuration change only.
- Content for missions beyond those already written in the prototype (all four bands) is placeholder-quality but playable.
- Sample data is fictional; nothing here is a real family.
