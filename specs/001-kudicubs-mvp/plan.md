# Implementation Plan: KudiCubs MVP

**Branch**: `001-kudicubs-mvp` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-kudicubs-mvp/spec.md`, plus the architecture
brief given to `/speckit-plan` (2026-11-14).

**Artifacts**:

- [research.md](./research.md): every decision, with its rationale and the alternatives rejected
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)

No `tasks.md` yet; that comes from `/speckit-tasks`.

## Summary

KudiCubs is a family financial-literacy game for children aged 4–15 on Android and iOS, phones
and tablets. It ships in four stages: Stage 1 is the full app plus the 4–6 world, then one world
per stage.

**Technical approach**:

- **Client**: one **Flutter** app, local-first. Riverpod for state, go_router for navigation,
  Drift (SQLite) for storage. It is fully playable offline.
- **Mission engine**: missions are **versioned JSON content**, not code, interpreted by a
  pure-Dart engine.
  - Every step maps to one of six reusable screen types: the original five plus an `activity`
    mini-game host (Flag F2, now in FR-017).
  - The engine also owns the Mission Intro and Reward framing screens.
  - **Per-band rules** live in the app binary: no failure screens for 4–6, retry for 7–15, soft
    timers from 7–9.
- **Coins and XP**: an **append-only event log**. Balances are always derived, so syncing several
  offline devices can't lose or duplicate rewards.
- **Backend**: **Supabase**.
  - Auth: parents only, with an email one-time code.
  - Postgres with RLS on every table, scoped to the parent.
  - Storage for versioned content packs.
  - Edge Functions for OTP lockout, PIN, export and delete, retention and crash intake.
- **Animation**: Rive drives Kudi the Cub and the rewards. Flame runs only inside mini-game
  scenes.
- **Localisation**: all strings are in ARB files, both in the app and inside content packs.
  Currency, denominations and market examples come from region packs (Ghana, Nigeria, UK).
- **Privacy**: no third-party SDKs that track. Analytics are first-party mission events only, and
  **opt-in**.

## Technical Context

| Item | Value |
|---|---|
| **Language/Version** | Dart 3 / Flutter stable (pinned in `app/.flutter-version`). TypeScript on Deno for Supabase Edge Functions. SQL (Postgres 15+) for migrations and RLS. |
| **Primary Dependencies** | Client: `flutter_riverpod` + `riverpod_generator`, `go_router`, `drift` + `sqlite3_flutter_libs`, `rive`, `flame` (scenes only), `just_audio` + `audio_session`, `supabase_flutter`, `flutter_secure_storage`, `connectivity_plus`, `intl` / `flutter_localizations` (gen-l10n), `archive` (unpacking packs), `crypto` (SHA-256, PBKDF2). Backend: Supabase Auth, Postgres, Storage, Edge Functions, `pg_cron`; Amazon SES via custom SMTP. Tooling: `json_schema` validation in `packages/kudi_content`, `mocktail`, `integration_test`, pgTAP, `deno test`. |
| **Storage** | Device: SQLite (Drift) as the source of truth for the UI, plus an outbox; the PIN hash in Keychain or Keystore; content packs in app support storage. Server: Postgres (Supabase, London `eu-west-2`); content packs in Supabase Storage at immutable versioned paths. |
| **Testing** | Unit tests (engine, economy, sync merge, band rules, regions); widget tests per screen type × band × region, with phone and tablet goldens; **one** integration test for the full loop (The Lost Coins); pgTAP RLS and merge tests; `deno test` for functions; `content_cli validate`; profile-mode performance runs on a 2 GB device. See research R26. |
| **Target Platform** | Android 8.0+ (API 26, including Go edition), iOS 15+; phones and tablets (FR-047). |
| **Project Type** | Mobile app (Flutter) + BaaS backend (Supabase) + content pipeline. |
| **Performance Goals** | Mission load ≤ 3 s and cold start ≤ 4 s on the minimum device (SC-010). UI at 60 fps target with no frame over 32 ms; Flame scenes ≥ 45 fps (SC-014). Cross-device sync visible in ≤ 60 s (SC-011). |
| **Constraints** | Fully offline gameplay (FR-045). Play download ≤ 45 MB including the bundled Lost Coins starter, and each world pack ≤ 60 MB. App memory ≤ 250 MB on 2 GB RAM. No real money, chat, multiplayer, ads or third-party tracking (Constitution V). Narration for every prompt in every band (VII). |
| **Scale/Scope** | 4 worlds, 17 missions, 3 regions, ~25 screens, 7 features. Pilot: hundreds of families. Design target for year 1: 50,000 families, 100,000 child profiles, about 50 wallet events per child per week (about 260 million rows a year; partition `wallet_events` by month once it passes 50 million rows). |

There are no remaining NEEDS CLARIFICATION items. Every unknown is resolved in
[research.md](./research.md) (R1–R31). Four open items (O1–O4) are actions for people outside
engineering and don't block the design.

## Constitution Check

*GATE: must pass before Phase 0 research, and is re-checked after the Phase 1 design.*

**Constitution v1.0.0** (`.specify/memory/constitution.md`)

### Pre-research gate (architecture brief compared with the constitution)

| Principle | Status | Notes |
|---|---|---|
| I. Child-First Flow | ✅ PASS | One primary action per screen; idle hints (R9, FR-012); every step resumable. |
| II. Learn by Doing | ✅ PASS | Missions are decisions and outcomes. Explainers are short, skippable and never block (mission schema `explainer`). |
| III. Failure Is Safe | ✅ PASS | Band rules: no failure outcomes for 4–6; retry for 7–15 that keeps rewards. |
| IV. Age-Adaptive Progression | ✅ PASS | One engine and set of screen types; complexity comes from band rules plus content. |
| V. Child Safety & Privacy | ⚠️ **PASS with corrections** | Gate = challenge **and** PIN (**F4**). Analytics must be opt-in and off by default (**F5**). Compliance sign-off is outside engineering (**F6**). |
| VI. Localised by Configuration | ✅ PASS | Region packs and ARB files; no region logic in code. |
| VII. Pre-Reader Accessible | ❌ → ✅ **corrected** | The brief limits narration to the 4–6 band. The constitution requires narration of **every** child-facing prompt in all bands (**F1**). The plan applies it to all bands. |
| Workflow: human authorship, PR per feature | ⚠️ **corrected** | Not mentioned in the brief. CI is read-only: it never commits, tags or bumps (**F7**). |
| Workflow: semantic versioning on all artifacts | ⚠️ **corrected** | The brief versions only the app and the packs. The plan also versions the schemas, sync protocol, database and API (**F8**). |
| Workflow: fastlane `beta` / `release` / `bump` only | ⚠️ **corrected** | Not mentioned in the brief. Added (**F7**). |

**Gate result: PASS.** Every deviation is corrected in the design. None needs a constitutional
exception.

### Flags raised (conflicts with the brief, the spec or the constitution)

| # | Flag | Conflicts with | Resolution in this plan | Needs your action? |
|---|---|---|---|---|
| **F1** | Narration "for every instruction in the 4–6 band" | Constitution VII, FR-044 (all bands) | Narration in all bands. Only 4–6 must also be fully playable without reading. | No |
| **F2** | Five screen types don't cover Mission Intro, Reward, or The Lost Coins find/sort/count | Spec FR-016, FR-017, FR-019 | Intro and Reward are engine-owned framing screens. A sixth step kind, `activity` (a Flame mini-game host), is added. | **Done**: FR-017 amended on 2026-11-14 (O1) |
| **F3** | "Last-write-wins per mission attempt" could overwrite a completed attempt | FR-007d (never lose completions) | Last-write-wins plus a monotonic status guard; replays are new attempts. | No |
| **F4** | "Parent gate (PIN)" | FR-006 (gate challenge **and** PIN) | 3 s hold plus a spoken multiplication, then the PIN. | No |
| **F5** | "Privacy-light analytics" without saying opt-in | Constitution V; UK AADC high-privacy defaults; spec pilot assumption | First-party, mission events only, **parent opt-in, default off**, kept 12 months. | No (confirm if you disagree) |
| **F6** | Children's data stored in London for GH, NG and UK families | Constitution V ("MUST comply … in every region") | London region; consent and safeguards in the design. A **DPIA, legal review and any regulator registration are required before Stage 1**. | **Yes**: client and legal (O2) |
| **F7** | No fastlane or commit-authorship rules in the brief | Constitution Development Workflow; global deployment rule | CI analyses, tests and builds only. Releases only via fastlane lanes, run by the developer. | No |
| **F8** | Versioning only for the app and packs | Constitution ("all artifacts") | Semantic versions for schemas, band rules, region config, sync protocol, database and function API (R28). | No |

### Post-design re-check (after Phase 1)

| Principle | Status | Evidence in the design artifacts |
|---|---|---|
| I | ✅ | `band-rules.schema.json` `idleHints`; routes guard 6 sends a locked mission to `/world` with a hint; the resume point is `mission_attempts.current_step_id` |
| II | ✅ | The mission schema has no quiz or test step kind; `explainer` is optional and non-blocking |
| III | ✅ | The band-rules schema makes `failureAllowed=false`, `render_gentle_variant` and timers off **mandatory** for `b4_6` (checked by a negative schema test); the validator rejects 4–6 content without gentle variants; `retry.keepsEarnedRewards` is fixed to true; wallet events can't be deleted |
| IV | ✅ | One step-kind set for all bands; per-band rules plus per-band worlds; `age_band` on the profile; band changes keep rewards |
| V | ✅ | Child tables hold only nickname, avatar, band and progress (pgTAP column whitelist); RLS on every table; `parent_secrets` has no policies; no chat or multiplayer tables; the gate guards `/parent/**` and external links; no AD_ID; analytics are opt-in; export, delete and 12-month retention are implemented. **F6 sign-off pending.** |
| VI | ✅ | `region-config.schema.json`; coins are region-neutral integers; regions matrix test (SC-008) |
| VII | ✅ | `narration.requiredForAllPrompts: true` (const) in every band; every prompt in the schema requires a `narrationKey`; `content_cli` fails on missing audio per locale |
| Workflow | ✅ | Read-only CI (R27); fastlane lanes (quickstart §5); semantic versions everywhere (R28); one PR per feature |

**Post-design gate result: PASS.**

## Decision log (summary; full text in research.md)

| Area | Decision | Rejected alternative(s) | Ref |
|---|---|---|---|
| Client | Flutter, one codebase | Two native apps; React Native; Unity | R1 |
| Minimum OS | Android 8.0 (API 26), iOS 15 | API 21–23; iOS 13/14 | R2 |
| State | Riverpod with codegen | Bloc; Provider; GetX | R3 |
| Navigation | go_router: 3 shells + a global redirect guard | auto_route; raw Navigator 2.0 | R4 |
| Character animation | Rive state machines | Lottie; sprite sheets | R5 |
| Mini-games | Flame, scoped to one step and disposed after | Flame everywhere; no Flame | R6 |
| Narration | Recorded AAC via just_audio, preloaded | On-device TTS; cloud TTS; Opus | R7 |
| Missions | Versioned JSON plus a pure-Dart engine | Missions as Dart code; Lua scripting | R8 |
| Band rules | Config shipped in the binary, schema-enforced | Rules in mission JSON; `if (band)` in widgets | R9 |
| Economy | Integer coins, region-neutral, append-only events; first completion pays, replays give small XP | Stored balances with last-write-wins; real exchange rates; decimals | R10 |
| Content delivery | World and region packs in Supabase Storage with SHA-256; Lost Coins bundled | Everything bundled; Play Asset Delivery / iOS ODR; streaming | R11 |
| Offline and sync | Drift + outbox + `sync_push` / `sync_pull` with per-entity merge rules | PowerSync / ElectricSQL; Realtime everywhere; snapshot last-write-wins | R12 |
| Sign-in | Email OTP code via a verify wrapper with lockout | Magic links; passwords | R13 |
| PIN | Local PBKDF2 hash plus a server hash with no client policy | Local-only PIN; client-readable hash | R14 |
| Parent gate | Hold plus spoken multiplication, then PIN | PIN only (F4) | R15 |
| Backend | Supabase | Firebase; a custom API; Amplify | R16 |
| Regions | Region packs, Ghana fallback | Code `if`s; device locale only | R17 |
| Localisation | ARB in the app and ARB inside packs | Plain JSON tables; compiled content strings | R18 |
| Analytics | First-party, mission events, opt-in | Firebase / Mixpanel; on by default | R19 |
| Crashes | First-party Dart crash capture | Sentry / Crashlytics (third-party on a kids app) | R20 |
| Store | Play Families policy; App Store Education category built to Kids rules | Kids Category 9–11 | R21 |
| Residency | Supabase London; DPIA required | US regions; self-hosting in Africa | R22 |
| Email | Amazon SES (eu-west-2) | Postmark (fallback); Supabase default SMTP | R23 |
| Retention | `pg_cron` → `retention-sweep`; cascade delete | Manual clean-up | R24 |
| Folders | Feature-first plus a pure-Dart `kudi_content` package | Layer-first; a single package | R25 |
| Testing | Unit, widget, one integration test, pgTAP, Deno, content, performance | Patrol / Appium | R26 |
| CI and releases | GitHub Actions, read-only; fastlane lanes by the developer | CI auto-bumps or uploads | R27 |
| Versioning | Semantic versions on every artifact | App and packs only (F8) | R28 |
| Budgets | ≤ 45 MB download, ≤ 250 MB memory, 60/45 fps | — | R29 |
| Parent curriculum later | ParentSection registry, reserved `parent` pack type and `/parent/learn/**` | Hard-coded parent menu | R30 |
| Nickname | Pick-list or typed, filtered, family-only | Unfiltered; pick-list only | R31 |

## Project Structure

### Documentation (this feature)

```text
specs/001-kudicubs-mvp/
├── spec.md
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R31, flags, open items
├── data-model.md        # Phase 1: server and device schema, state machines, validation
├── quickstart.md        # Phase 1: local setup and validation scenarios V1–V10
├── contracts/           # Phase 1
│   ├── mission-content.schema.json
│   ├── band-rules.schema.json
│   ├── region-config.schema.json
│   ├── content-pack-manifest.schema.json
│   ├── sync-api.md
│   ├── edge-functions.md
│   ├── analytics-events.md
│   ├── routes.md
│   └── examples/        # mc.lost_coins.json, band-rules.b4_6.json, region.uk.json (validated)
├── checklists/requirements.md
└── tasks.md             # Phase 2: /speckit-tasks (not created yet)
```

### Source code (repository root)

```text
app/                                  # Flutter app (Android + iOS)
├── lib/
│   ├── main.dart
│   ├── app/                          # App widget, router (shells + global redirect), theme, bootstrap
│   ├── core/
│   │   ├── database/                 # Drift schema, DAOs, migrations, outbox
│   │   ├── sync/                     # Sync worker, push/pull clients, merge rules
│   │   ├── auth/                     # Supabase session, OTP flow, device registration
│   │   ├── content/                  # Pack installer, SHA verify, runtime ARB loader, asset resolver
│   │   ├── region/                   # Region config, currency formatting, fallback to gh
│   │   ├── audio/                    # Narration player, preloading, ducking
│   │   ├── analytics/                # Opt-in-gated mission event queue
│   │   ├── crash/                    # First-party crash capture and queue
│   │   └── design_system/            # Icon-first components, Kudi Rive widget, tap feedback
│   ├── features/
│   │   ├── onboarding/               # data/ domain/ presentation/: welcome → … → joined the Pride
│   │   ├── home/                     # Dashboard, Continue resolver, daily challenge, world map
│   │   ├── mission_engine/
│   │   │   ├── domain/               # PURE DART: engine state machine, band rules, conditions, economy, rewards
│   │   │   ├── data/                 # Mission repository (packs → models), attempt and event writers
│   │   │   └── presentation/
│   │   │       ├── framing/          # mission_intro, reward (engine-owned)
│   │   │       ├── screens/          # decision, resource_management, action_result, market_simulation, round_summary, activity_host
│   │   │       └── games/            # Flame: find_items, sort_into_jars, count_items, market_crowd
│   │   ├── wallet/                   # Balance and savings folds, history, bar charts
│   │   ├── progress/                 # Level path, badge grid, pillar progress, level-up
│   │   ├── profile/                  # Profile, settings, profile picker
│   │   └── parent/                   # Gate (challenge + PIN), ParentShell, ParentSection registry,
│   │                                 # children overview, child detail, settings, export, delete
│   └── l10n/                         # app_en.arb, app_en_GH.arb, app_en_NG.arb, app_en_GB.arb
├── assets/
│   ├── band_rules/                   # b4_6.json … b13_15.json (in the binary, R9)
│   └── bundled_packs/                # world.money_choices starter (Lost Coins) + region.gh|ng|uk
├── test/
│   ├── unit/                         # mission_engine/, economy/, sync/, region/, parent_gate/
│   └── widget/                       # One suite per screen type, regions matrix, goldens
├── integration_test/
│   ├── core_loop_test.dart           # The single full-loop test
│   └── perf_lost_coins_test.dart     # Profile-mode performance run (R29)
├── android/  ios/                    # Platform projects; fastlane/ per platform (beta / release / bump)
└── pubspec.yaml                      # version: MAJOR.MINOR.PATCH+build

packages/
└── kudi_content/                     # Pure Dart: content models, JSON-Schema validation, band-rule lints

content/                              # Content source (versioned, reviewed through PRs)
├── schema/                           # Canonical copies of contracts/*.schema.json
├── worlds/{money_choices,build_grow,founder_mode,side_hustle}/
│   ├── world.json                    # Levels, badges, daily pool, cosmetic items
│   ├── missions/*.json
│   ├── l10n/{en,en_GH,en_NG,en_GB}.arb
│   ├── art/  rive/  audio/{locale}/
└── regions/{gh,ng,uk}/region.json + art/ + audio/

tools/
├── content_cli/                      # validate | build | publish (uses packages/kudi_content)
└── sync_soak/                        # 100-cycle multi-device sync soak test (SC-011)

supabase/
├── config.toml                       # Auth OTP (6 digits, 600 s), SMTP, pg_cron
├── migrations/                       # Tables, enums, RLS, views, sync_push / sync_pull, app_meta
├── functions/                        # otp-verify, pin-set, pin-verify, family-export, family-delete,
│                                     # retention-sweep, crash-report (+ *_test.ts)
├── seed.sql                          # Catalogue: missions, badges, content_versions
└── tests/                            # pgTAP: RLS, merge rules, cascade, column whitelist

.github/workflows/ci.yml              # analyze · test · content · supabase · build · integration (read-only)
```

**Structure decision**: one Flutter app with the **feature-first folders** requested
(onboarding, home, mission_engine, wallet, progress, profile, parent). Shared infrastructure
lives in `core/`. Two extra roots:

- `packages/kudi_content`, so content tools and the app validate with the same code.
- `content/`, so missions are data reviewed through PRs rather than code.

The backend is fully described by `supabase/`, which runs locally with `supabase start`.

## Complexity Tracking

None of the items below violates the constitution. They are recorded because each adds moving
parts beyond the simplest possible build.

| Added complexity | Why needed | Simpler alternative rejected because |
|---|---|---|
| Two animation runtimes (Rive + Flame) | Rive for character acting and rewards (small vector files); Flame for physics and crowd scenes | Rive alone can't run drag physics or a crowd simulation efficiently; Flame alone loses Flutter accessibility and ARB text |
| Custom sync (outbox + 2 RPCs + merge rules) | Offline-first play on several devices with no lost or duplicated rewards (FR-007d, SC-011) | Snapshot last-write-wins loses rewards; a third-party sync engine adds a vendor and cost for a narrow model |
| Content pack pipeline (`content/`, `content_cli`, `kudi_content`) | 17 missions × 3 regions × 4 stages, changed without app releases, with safety rules validated before shipping | Missions in Dart mean an app release per content fix, and safety rules can't be checked mechanically |
| Edge Function wrappers for OTP verify and PIN | Exact 5-try lockouts (FR-007g, FR-037), and PIN hashes never readable by clients | Direct client calls can't enforce per-email lockouts or hide hashes |

## Follow-ups before `/speckit-tasks`

1. ~~**O1 (Flag F2)**: amend FR-017~~ **Done (2026-11-14)**. FR-017 now lists Activity
   (mini-game) as a sixth screen type, with Mission Intro and Reward as framing screens.
2. **O2 (Flag F6)**: the client arranges the DPIA, legal review and regulator registration (GH,
   NG, UK) **before the Stage 1 release**. It does not block tasks or development.
3. **O3 and O4**: narration voices and scripts, and final art direction, are content workstreams
   that run alongside development.
