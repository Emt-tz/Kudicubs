<!--
Sync Impact Report
==================
Version change: (unversioned template) → 1.0.0
Bump rationale: Initial ratification; all placeholders replaced with project-specific content.

Modified principles (template slot → new title):
  - [PRINCIPLE_1_NAME] → I. Child-First Flow
  - [PRINCIPLE_2_NAME] → II. Learn by Doing
  - [PRINCIPLE_3_NAME] → III. Failure Is Safe
  - [PRINCIPLE_4_NAME] → IV. Age-Adaptive Progression
  - [PRINCIPLE_5_NAME] → V. Child Safety & Privacy (NON-NEGOTIABLE)
Added principles:
  - VI. Localised by Configuration
  - VII. Pre-Reader Accessible
Added sections:
  - Product & Content Standards (template SECTION_2)
  - Development Workflow (template SECTION_3)
Removed sections: none

Templates reviewed (read at runtime, not modified by this command):
  - .specify/templates/plan-template.md      ✅ "Constitution Check" gate reads this file
  - .specify/templates/spec-template.md      ✅ no change required
  - .specify/templates/tasks-template.md     ✅ no change required
  - .specify/templates/checklist-template.md ✅ no change required

Deferred TODOs: none
-->

# KudiCubs Constitution

KudiCubs is a family financial literacy and entrepreneurship game for children aged 4–15 and
their parents.

## Core Principles

### I. Child-First Flow

A child MUST never have to wonder "what do I do next?"

- Every screen MUST present exactly one obvious primary action, visually emphasised.
- After any period of inactivity, the game MUST proactively guide the child
  (animation, highlight, or narrated hint) toward the next step.
- No child-facing flow may dead-end; every state MUST have a clear way forward or back.
- Features that require adult input MUST route through the parent area, never block the
  child mid-flow without explanation.

**Rationale**: Confusion is the fastest way to lose a young player. Clarity of next action
is a usability requirement, not a polish item.

### II. Learn by Doing

Financial and entrepreneurial concepts are taught only through decisions and their outcomes.

- Child-facing content MUST NOT include lectures, quizzes, graded tests, or blocking
  explanatory text walls.
- Every learning objective MUST be expressed as a decision the child makes and a visible,
  consequential outcome (e.g., price a lemonade too high → fewer customers).
- Concepts MAY be named or reinforced after an outcome, but never as a gate to continue.

**Rationale**: Children internalise cause and effect through play; testing creates anxiety
and turns a game into homework.

### III. Failure Is Safe

Mistakes are part of learning and MUST never feel punishing.

- Ages 4–6: MUST NOT show a failure, game-over, or "wrong" screen. Sub-optimal choices
  produce gentle, constructive outcomes and the game continues.
- Ages 7–15: MUST always offer a retry after an unsuccessful outcome, with no loss of
  progress already earned outside the attempt.
- No band may lose persistent progress, currency, or collectibles as a penalty.
- Outcome feedback MUST explain what happened, not judge the child.

**Rationale**: Fear of failure suppresses experimentation, which is the core learning
mechanic.

### IV. Age-Adaptive Progression

All content shares one structure, with complexity rising across four age bands:
**4–6, 7–9, 10–12, 13–15**.

- Every game loop and feature MUST define its behaviour for each of the four bands (or
  explicitly declare a band unsupported, with justification).
- Bands differ in complexity (number of variables, numeracy level, text vs. icon, time
  pressure), not in core structure or navigation.
- A child's band MUST be set by the parent and MAY be adjusted by the parent at any time.

**Rationale**: A shared structure lets siblings and parents play together and lets a child
grow within the same game.

### V. Child Safety & Privacy (NON-NEGOTIABLE)

- **Parent gate**: Purchases, settings, external links, account management, and any data
  sharing MUST sit behind a parent gate that a young child cannot pass by chance.
- **Minimal data**: Collect only the child data strictly required for gameplay (e.g.,
  nickname, age band, progress). No precise location, contacts, photos, or third-party
  behavioural advertising or tracking SDKs on child profiles.
- **No real money**: All in-game currency is fictional and MUST NOT be convertible to or
  from real money, crypto, or tradeable assets. Children MUST NOT be able to make real
  purchases.
- **No open chat**: No free-text chat or user-generated content shared between users.
  Any social features MUST be limited to predefined, safe interactions.
- The product MUST comply with applicable children's privacy and app-store kids-category
  rules (e.g., COPPA, GDPR-K/UK Age Appropriate Design Code) in every region it ships to.

**Rationale**: Trust from parents is a precondition for the product to exist.

### VI. Localised by Configuration

- Currency names, symbols, denominations, prices, and market examples (goods, businesses,
  settings) MUST come from per-region configuration, never hard-coded in game logic.
- Adding a new region MUST NOT require code changes to game mechanics — only new
  configuration and content assets.
- All child-facing strings and narration MUST be externalised for translation.

**Rationale**: Financial concepts only land when the examples match the child's world.

### VII. Pre-Reader Accessible

- Every child-facing instruction, prompt, and outcome MUST be available as audio narration.
- Child-facing UI MUST be icon-first; for the 4–6 band, gameplay MUST be fully completable
  without reading.
- Interactive targets MUST be sized and spaced for small hands; colour MUST NOT be the only
  carrier of meaning.

**Rationale**: The youngest players cannot read yet, and many older players are still
building reading confidence.

## Product & Content Standards

- Every feature spec MUST state which principles it touches and how each age band is
  handled (Principle IV).
- Every feature spec MUST identify which data, if any, it stores about a child and
  justify it (Principle V).
- New content MUST ship with narration audio and regional configuration entries for every
  supported region before release (Principles VI, VII).
- Parent-facing areas MAY use text-heavy UI, but MUST remain behind the parent gate.

## Development Workflow

- **Human authorship**: All commits MUST be authored under the human developer's git
  identity. AI or automation tools MUST NOT be configured as the commit author.
- **Review before commit**: Every change MUST undergo code review before it is committed.
- **PR per feature**: Each feature (one Spec Kit feature spec) MUST be delivered on its
  own branch through its own pull request; unrelated features MUST NOT be bundled.
- **Semantic versioning**: All artifacts — app builds, content/region packs, data schemas,
  APIs, and this constitution — MUST be versioned using `MAJOR.MINOR.PATCH`.
- **Build & release**: Builds, version bumps, and store uploads MUST go through fastlane
  using the standard lanes `beta`, `release`, and `bump`. Manual Xcode archives or manual
  store uploads are prohibited.

## Governance

- This constitution supersedes all other practices. Where a spec, plan, or task conflicts
  with it, the constitution wins until it is formally amended.
- Every `/speckit-plan` MUST pass the Constitution Check gate; any violation MUST be
  recorded in the plan's Complexity Tracking with justification, or the plan is rejected.
- Every PR review MUST verify compliance with the principles the feature touches.
- **Amendments** are made via a PR that updates this file, includes a Sync Impact Report,
  and is approved by the project owner.
- **Versioning policy**: MAJOR for removing or redefining a principle; MINOR for adding a
  principle or section or materially expanding guidance; PATCH for clarifications and
  wording fixes.
- Compliance is reviewed at each feature's plan stage, at PR review, and before each
  `release` lane run.

**Version**: 1.0.0 | **Ratified**: 2026-11-14 | **Last Amended**: 2026-11-14
