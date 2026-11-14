# Research & Decisions: KudiCubs MVP

**Feature**: `001-kudicubs-mvp` | **Date**: 2026-11-14 | **Plan**: [plan.md](./plan.md)

Each decision below has the same four parts: what was decided, why, what was rejected, and which
spec or constitution item it serves. Library versions are not pinned here. They are pinned in
`pubspec.lock` and `supabase/config.toml` at project setup and changed only through reviewed PRs.

Items marked **⚠ Flag** conflict with the user's architecture input, the spec, or the
constitution, or need an outside sign-off. All flags are collected in
[plan.md → Constitution Check](./plan.md#constitution-check).

---

## A. Client platform

### R1. Flutter (Dart), one codebase for Android and iOS

- **Decision**: Flutter stable channel, a single app in `app/`, targeting Android and iOS phones
  and tablets (FR-047).
- **Rationale**: One codebase covers both stores at Stage 1, as the clarifications require. The
  Impeller renderer gives predictable frame times on low-end Android. First-class runtimes exist
  for Rive and Flame. Layouts adapt to phone and tablet sizes without extra code bases.
- **Rejected**:
  - **Two native apps (Kotlin and Swift)**: double the build and test cost for every one of the
    17 missions.
  - **React Native**: weaker support for interactive vector animation and game scenes, and frame
    rates on 2 GB Android devices depend on the JavaScript bridge and threading.
  - **Unity**: the base install is large for budget phones, and native-feeling forms,
    accessibility and ARB localisation for the parent area are poor.

### R2. Minimum operating systems

- **Decision**: Android 8.0 (API 26) and later, including Android Go devices. iOS 15 and later.
  Both are confirmed against Flutter's current support floor when the project is created.
- **Rationale**: The budget Android phones sold in Ghana and Nigeria ship with Android 10 or later
  (often Go edition), so API 26 covers the pilot fleet with headroom. iOS 15 covers every iPhone
  and iPad still in common family use in the UK. Older OS versions add testing cost but almost no
  reach.
- **Rejected**:
  - **API 21–23**: below Flutter's practical floor, and adds test devices no one in the pilot
    uses.
  - **iOS 13/14**: very small share among families, and limits newer SwiftUI-backed plugins.
- **Serves**: FR-047.

### R3. State management with Riverpod

- **Decision**: Riverpod (current major version) with code generation and `riverpod_lint`.
  Providers are scoped per feature, and repositories are exposed as providers so tests can
  override them.
- **Rationale**: Every dependency can be overridden in tests, including the mission engine,
  repositories, clock and connectivity. That is what the required unit, widget and integration
  tests need. Riverpod is compile-safe, needs no `BuildContext` for domain logic, and handles the
  async state from database streams well.
- **Rejected**:
  - **Bloc**: more boilerplate per screen type, and with 5+ screen types and 7 features the
    event/state classes multiply.
  - **Provider**: superseded by Riverpod, and its overrides are weaker for tests.
  - **GetX**: global service locator and implicit lifecycles, which make testing harder.

### R4. Navigation with go_router

- **Decision**: go_router with three `StatefulShellRoute` branches: `ChildShell` (home, world,
  wallet, progress, profile), `MissionRoute` (full-screen, no bottom navigation) and
  `ParentShell` (`/parent/**`). A global `redirect` enforces the onboarding state, the device mode
  (family or parent, FR-007h) and the parent-gate session.
- **Rationale**: Redirect-based guards in one place make "a child can never reach the parent area
  without the gate" a single, testable rule (Constitution V). A dedicated `/parent` subtree
  leaves room for a later parent curriculum (R30) without restructuring.
- **Rejected**:
  - **auto_route**: extra code generation for little gain at this size.
  - **Raw Navigator 2.0**: far more code for the same guards.
  - **Navigator 1.0 push/pop**: guards would be scattered across screens.
- **Contract**: [contracts/routes.md](./contracts/routes.md).

### R5. Rive for Kudi the Cub and reward animations

- **Decision**: Rive runtime for Kudi (idle, talk, point, celebrate and hint states, driven by a
  state machine), reward bursts, level-ups and the dashboard avatar.
- **Rationale**: Vector files with state machines are small (tens of kilobytes). One file can
  serve phone and tablet without extra bitmaps. Inputs such as `isTalking` or `hintLevel` let the
  engine drive Kudi directly from narration and idle timers, which serves the idle-hint rule in
  FR-012 and SC-003.
- **Rejected**:
  - **Lottie**: no interactive state machines, and JSON files are larger.
  - **Sprite sheets**: memory-heavy on 2 GB devices, and each screen density needs its own
    assets.
  - **Hand-coded Flutter animations**: too slow to author for character acting.

### R6. Flame only inside mini-game scenes

- **Decision**: Flame is used only for physics or sprite-heavy scenes: Find Items, Sort Into Jars,
  Count Items and the Market Simulation crowd. Each scene runs in a `GameWidget` hosted by one
  step screen and is fully disposed when the step ends. Everything else is plain Flutter widgets.
- **Rationale**: A game loop is the right tool for drag-and-drop with snapping, hidden-object
  taps and dozens of customer sprites. Plain widgets stay accessible, localisable and cheap for
  forms, cards and summaries. Scoping Flame to a step keeps its memory bounded on 2 GB devices.
- **Rejected**:
  - **Flame for the whole app**: loses Flutter accessibility, text layout and ARB localisation
    in the parent area and decision cards.
  - **No Flame (all widgets)**: the market simulation's many animated customers and the sorting
    physics would mean writing a game loop by hand.

### R7. Narration audio

- **Decision**: Pre-recorded human narration, played with `just_audio` and with an
  `audio_session` configuration so other audio is ducked. Clips are keyed by
  `{stringKey}.{locale}` inside content packs. The next step's clips are preloaded while the
  current step plays. Files are AAC-LC (`.m4a`), mono, around 48 kbps.
- **Rationale**: Pre-readers need warm, clear, regional voices (Constitution VII). On-device
  text-to-speech voices vary widely on budget Android and may be missing offline. AAC plays on
  both platforms without extra native code. At 48 kbps mono, a minute of narration is about
  360 KB.
- **Rejected**:
  - **On-device text-to-speech**: inconsistent quality, sometimes missing offline, and robotic
    to young children.
  - **Cloud text-to-speech at runtime**: breaks offline play (FR-045).
  - **Opus**: smaller files, but uneven support on older iOS through the plugin.
- **⚠ Flag F1 (narration scope)**: The architecture input says "audio narration for every
  instruction in the 4–6 band". **Constitution VII and FR-044 require narration of every
  child-facing instruction, prompt and outcome in all bands.** The plan applies narration to all
  four bands. Only the 4–6 band is additionally required to be fully playable without reading
  (FR-028).

---

## B. Mission engine and content

### R8. Missions are versioned JSON content interpreted by the engine

- **Decision**: Each mission is a JSON document validated against
  [contracts/mission-content.schema.json](./contracts/mission-content.schema.json) (JSON Schema
  2020-12). It declares an id, a semantic version, the age band, world, pillars, concepts, an
  ordered list of steps, rewards and badge rules. The engine (`features/mission_engine/domain`)
  is pure Dart. It loads a mission, applies the band rules (R9), runs the steps as a state
  machine, and emits wallet events (R10). Screens render whatever the engine says to render.
- **Rationale**: 17 missions in 4 stages, in 3 regions, is a content problem rather than a code
  problem. Writers and designers can add or change missions without an app release, and
  shipping new content needs no store review. One engine, tested once, enforces the safety
  rules for all missions.
- **Rejected**:
  - **Missions as Dart code**: every content change becomes an app release, and band rules
    would be re-implemented per mission.
  - **A general scripting language (for example, Lua)**: too powerful. Content could bypass the
    band rules, and it adds a runtime.
- **⚠ Flag F2 (screen-type coverage)**: The five screen types (Decision, Resource Management,
  Action Result, Market Simulation, Round Summary) don't cover three things the spec and core
  loop need:
  1. **Mission Intro** and **Reward**, which are core-loop stages in FR-016 but not one of the
     five types.
  2. The Lost Coins **find / sort / count** activities (FR-019), which aren't decisions, resource
     management, results, market simulations or summaries.

  **Resolution in the design**:
  - Mission Intro and Reward become **engine-owned framing screens**. Every mission gets them
    automatically, and content only provides their copy and art.
  - A sixth step kind, **`activity`**, hosts a registered Flame mini-game: `find_items`,
    `sort_into_jars`, `count_items` at first, with more added for later stages.

  The five content screen types are unchanged. FR-017 has been amended to add "Activity (mini-game)" as a sixth reusable screen type
  (approved 2026-11-14).

### R9. Per-band rules are engine configuration

- **Decision**: One `band-rules.json` per band, validated by
  [contracts/band-rules.schema.json](./contracts/band-rules.schema.json) and shipped in the app
  binary (not in downloadable packs), so content can never weaken safety rules.

  | Setting | 4–6 | 7–9 | 10–12 | 13–15 |
  |---|---|---|---|---|
  | Failure outcomes allowed | **no**: negative outcomes are mapped to "gentle" variants | yes | yes | yes |
  | Retry offered after an unsuccessful outcome | n/a (never fails) | **always** | **always** | **always** |
  | Time pressure | off | light (soft timer, at least 45 s, never ends a round) | allowed | allowed |
  | Narration of every prompt | required | required | required | required |
  | Text on screen | icons + ≤ 3 words | short sentences | full sentences | full sentences |
  | Numbers | counting to 20 | +/− to 1,000 | %, simple ratios | %, interest, charts |
  | Idle hint at | 6 s, then escalates at 12 s / 20 s | 8 s | 10 s | 12 s |
  | Choices per Decision screen | 2 | 2–3 | 2–3 | 2–3 |

- **Rationale**: Constitution III and IV become machine-checked settings instead of per-mission
  care.
  - The content validator (R27) **rejects** any 4–6 mission that declares a `fail` outcome
    without a `gentle` variant, or that uses a timer.
  - The engine refuses at runtime to render a failure-tagged outcome for a 4–6 profile, even if
    bad content reaches the device.
  - The idle-hint thresholds implement FR-012 and keep SC-003 measurable.
- **Rejected**:
  - **Rules written inside each mission's JSON**: content could weaken safety rules.
  - **Rules as `if (band == …)` checks scattered in widgets**: untestable, and easy to miss in
    new screens.

### R10. Coin economy: simulated, integer, event-sourced

- **Decision**:
  - All money in the game is an integer count of **coins**, which are region-neutral. The region
    config (R17) supplies only the name, symbol, art and display format.
  - Balances are never stored as mutable numbers. They are **derived from an append-only
    `wallet_events` log** (earn, bonus, spend, save, unsave, interest). Each event carries
    `coins_delta`, `savings_delta` and `xp_delta`.
  - Domain invariants: the available coin balance and savings are never negative. Spend and save
    are refused rather than allowed to go below zero. Events are never edited or deleted (FR-027).
  - **Replay economy**: completing a mission for the first time grants its full reward and its
    badges. Replays grant a small amount of XP and no coin reward, so children can't farm coins
    by repeating, while practice is still recognised. Daily challenges grant their own fixed
    reward once per day.
  - **Region switching** (FR-043): coin counts stay the same and only the symbol, name and art
    change.
  - Real-world price levels are **not** simulated per region. Prices stay small, child-friendly
    integers in every region.
- **Rationale**: An event log makes the multi-device merge trivial and exact (R12: union of
  events, no lost or duplicated rewards, FR-007d and SC-011). It gives the Wallet its history and
  charts for free (FR-033), and it can be audited. Integers avoid rounding bugs. Region-neutral
  coins keep "shown in the new currency" honest, because the number doesn't change.
- **Rejected**:
  - **Stored balances with last-write-wins**: two offline devices would overwrite each other
    and lose rewards.
  - **Converting with real exchange rates or price levels**: a ₦ price in hundreds is beyond
    4–6 numeracy, and amounts would change meaning when a parent switches region.
  - **Decimal currency amounts**: rounding issues, and not needed for teaching.
- **Constitution V**: no real money anywhere. There are no purchase APIs, no in-app purchase
  plugins and no conversion. Coins are not transferable between children.

### R11. Content packs

- **Decision**: Content ships as **versioned packs**, each a zip with a `manifest.json`
  ([contracts/content-pack-manifest.schema.json](./contracts/content-pack-manifest.schema.json)):
  - **World pack**, one per age band (for example, `world.money_choices`): mission JSON, art
    (WebP), Rive files, ARB string tables and narration for all three regions.
  - **Region pack**, one per region (`region.gh`, `region.ng`, `region.uk`): region config,
    coin and note art, and regional voice overrides.
  - **Bundled starter**: The Lost Coins plus the 4–6 shell art and all three region packs are
    bundled in the app binary, so a family's first session works fully offline even before an
    account exists (FR-045).
  - **Hosting**: packs are stored in Supabase Storage at immutable paths
    `content/{packId}/{semver}/pack.zip`. The `content_versions` table lists the released packs
    with their SHA-256 hash, size, `minAppVersion` and `schemaVersion`. The client downloads a
    pack only if the hash matches, unpacks it into app support storage, and keeps the previous
    version until the new one has been verified.
  - **Download rules**: only the child's own band's world pack is downloaded. Downloads over
    mobile data show the size to the parent and need their go-ahead (behind the gate).
- **Rationale**: Per-band downloads keep the install small for budget phones. Bundling the first
  mission guarantees the first-run experience offline. Immutable versioned paths with hashes give
  safe rollbacks and make cache invalidation trivial. Keeping the old version until the new one
  is verified means an interrupted download never breaks play.
- **Rejected**:
  - **Bundling all 17 missions in the binary**: too large, and every content fix would need a
    store release.
  - **Play Asset Delivery and iOS On-Demand Resources**: two platform-specific systems, and a
    store release is still needed per content change.
  - **Streaming assets on demand**: breaks offline play.

---

## C. Data, offline and sync

### R12. Local-first store with an outbox sync

- **Decision**:
  - **Local store**: SQLite via Drift. It is the single source of truth for the UI, which reads
    reactive Drift streams.
  - **Outbox**: every local write that must sync (wallet events, attempts, badges, items,
    profiles) is also written to an `outbox` table in the same transaction.
  - **Push**: one RPC, `sync_push(batch)`, a Postgres function running under RLS
    ([contracts/sync-api.md](./contracts/sync-api.md)). It is idempotent by client-generated
    UUIDs.
  - **Pull**: `sync_pull(cursor)` returns every row changed since a server-assigned, increasing
    `server_seq`.
  - **Merge rules per entity**:

    | Entity | Rule |
    |---|---|
    | `wallet_events` | Append-only. Insert, or do nothing if the id already exists. Union across devices. |
    | `mission_attempts` | **Last-write-wins per attempt** on `(client_updated_at, device_id)`, **plus a status guard**: `completed` can never be overwritten by `in_progress`. |
    | `child_badges`, `child_items` | Grow-only sets. The unique key is `(child_id, badge_id)` or `(child_id, item_id)`. |
    | `child_profiles` | Last-write-wins per row. Deletion is a tombstone (`deleted_at`). |

  - **Triggers**: push right after a mission step that emits events, on app foreground, on
    connectivity regained, and every 30 s while in the foreground and online. Pull on the same
    triggers.
  - **Consent gate**: no push happens until the family account has consent recorded
    (FR-007a). Until then the outbox simply accumulates.
- **Rationale**: Fully offline play (FR-045) needs a local source of truth. The merge rules
  guarantee "never lose or duplicate earned coins, XP, badges or completions" (FR-007d) by
  construction, not by timing. A 30-second pull cadence meets "within 1 minute" (SC-011) without
  a constant socket on budget phones.
- **Rejected**:
  - **PowerSync, ElectricSQL or another sync engine**: an extra vendor, cost and moving part for
    a deliberately narrow sync model.
  - **Supabase Realtime for every device**: a constant WebSocket costs battery and data on
    prepaid mobile plans. It may be added later for parent devices only.
  - **Pure last-write-wins on a whole snapshot**: loses rewards earned on concurrent offline
    devices.
- **⚠ Flag F3 (last-write-wins wording)**: Applied as written, "last-write-wins per mission
  attempt" could let a stale `in_progress` write overwrite a `completed` attempt, which would
  lose a completion (FR-007d). The plan adds the status guard above. A replay always creates a
  **new** attempt (R10), so the guard never blocks legitimate play.

### R13. Parent sign-in: emailed one-time code, no password

- **Decision**:
  - Supabase Auth email OTP (`signInWithOtp`), with the email template set to **show a 6-digit
    code only**, not a magic link.
  - The OTP expires after 600 s. Requesting a new code makes the old one invalid, which is
    Supabase's default behaviour.
  - Verification goes through the Edge Function `otp-verify`. It counts failures per hashed
    email, locks for 15 minutes after 5 failures (FR-007g), and then calls Auth verify.
  - **The first successful verification is the consent event**: `parents.consented_at` and a
    `consent_records` row are written (FR-007a).
  - Sessions are refreshed silently, and refresh tokens are stored in the platform's secure
    storage.
- **Rationale**: Matches the clarification answer, with no password to forget. A code typed into
  the app works on a shared family tablet, where a magic link would open a browser and possibly
  the wrong account. Wrapping verify in a function lets us enforce the 5-attempt rule exactly.
- **Rejected**:
  - **Magic links**: they open a browser on the child's device, and deep-link handling is
    fragile on budget Android launchers.
  - **Passwords**: rejected in clarification.
  - **Calling Auth verify directly from the client**: can't enforce a per-email 5-try lockout.

### R14. Parent PIN

- **Decision**:
  - The PIN is 4 digits (FR-006).
  - **On the device**: a PBKDF2-HMAC-SHA256 hash with a per-device salt and a high iteration
    count, kept in `flutter_secure_storage` (Keychain or Keystore). This lets the gate work
    offline.
  - **On the server**: the hash is stored in `parent_secrets`, which has **no client-readable
    policy**. It is touched only by the `pin-set` and `pin-verify` Edge Functions.
  - **New device**: after OTP sign-in, the PIN is verified online once, then cached locally.
  - **Lockout**: after 5 local failures, a cooling-off period of 1, 5, then 15 minutes (FR-037).
  - **Reset**: needs a fresh OTP session (authenticated within the last 10 minutes), then
    `pin-set`.
- **Rationale**: Works offline, never exposes the hash to other clients, and the reset path
  reuses the email proof the spec already relies on.
- **Rejected**:
  - **Storing only a local PIN**: the PIN can't be reused on a parent's second device (FR-007c).
  - **Storing the PIN hash in a client-readable column**: a 4-digit hash can be reversed
    offline in seconds.

### R15. Parent gate challenge

- **Decision**: The gate is passed only when **both** are done:
  1. A **press-and-hold of 3 seconds** on a marked button.
  2. A **multiplication with the numbers written and spoken in words** ("seven times eight"),
     answered on a number pad. The question is random each time.

  The PIN then follows. The gate also guards external links, settings, the dashboard and data
  sharing (FR-042). On parent devices, the PIN alone suffices after the first gate of the session.
- **Rationale**: Written-out multiplication is the pattern Apple and Google parental-gate
  guidance accepts. The press-and-hold defeats random tapping by toddlers. SC-006 is verified
  with this design in the pilot.
- **⚠ Flag F4**: The architecture input says "Parent gate (PIN)". **FR-006 requires a gate
  challenge as well as the PIN**, so the design uses both.

---

## D. Backend

### R16. Supabase: Auth, Postgres, Storage, Edge Functions

- **Decision**: One Supabase project per environment (`dev`, `staging`, `prod`). The schema lives
  in `supabase/migrations`. Edge Functions are written in TypeScript (Deno). Storage has a
  `content` bucket that anyone can read, holding packs at immutable paths.
- **Rationale**: Managed Postgres with RLS gives per-family isolation in the database itself.
  Auth OTP, Storage and functions cover every server need with one vendor and a local emulator
  (`supabase start`) for tests.
- **Rejected**:
  - **Firebase**: Firestore security rules are harder to test than SQL, and Google SDKs need care
    under the Families and kids store rules.
  - **A custom Node or Go API**: more code and operations for a small team.
  - **AWS Amplify**: heavier setup, and no local emulator parity for RLS-style tests.

### R17. Region configuration

- **Decision**: `region.{gh|ng|uk}` packs carry a region config
  ([contracts/region-config.schema.json](./contracts/region-config.schema.json)):
  - Currency code, symbol, and names for the major and minor units (cedi/pesewa, naira/kobo,
    pound/penny).
  - The denomination set for money-handling activities, with art ids and face labels. For
    example, the "50p" coin in The Lost Coins is region data.
  - Number and currency formatting locale: `en_GH`, `en_NG`, `en_GB`.
  - Market-example substitutions (goods, foods, places) referenced by key from mission JSON.
  - The narration voice id.

  **Default and fallback region is Ghana** (the pilot context). Any missing key falls back to
  Ghana's value (spec edge case).
- **Rationale**: Constitution VI. Adding a region means adding a pack, with no code changes.
  SC-008 is checked by a CI test that renders every mission step under each region.
- **Rejected**:
  - **Region `if`s in Dart**: violates Constitution VI.
  - **Device locale only**: a UK family abroad, or a Nigerian family on an en_US phone, would
    get the wrong currency.

### R18. Localisation with ARB files

- **Decision**:
  - App UI strings are in `app/lib/l10n/*.arb`, compiled by `flutter gen-l10n`. Locales are `en`
    (base), `en_GH`, `en_NG` and `en_GB`.
  - Mission strings ship **inside content packs as ARB files** (`l10n/{locale}.arb`), loaded at
    runtime by a small ARB reader in `core/content`, with the same fallback chain.
  - No child-facing literal strings appear in Dart. A lint rule plus a test scans for them.
- **Rationale**: Meets "all strings in ARB files" for both compiled UI and downloadable content.
  Translators work in one format.
- **Rejected**:
  - **Plain JSON string tables for content**: a second format for translators.
  - **Compiling content strings into the app**: needs a release per copy change.

### R19. Analytics: first-party, mission events only, off by default

- **Decision**:
  - The only events are mission events: `mission_started`, `step_completed`, `hint_shown`,
    `retry_selected`, `mission_completed` and `mission_abandoned`, with the fields in
    [contracts/analytics-events.md](./contracts/analytics-events.md).
  - Events are stored in our own `analytics_events` table through `sync_push`.
  - **No third-party analytics SDK, no advertising ids** (the Android `AD_ID` permission is
    removed from the merged manifest, and iOS App Tracking Transparency is never shown), and no
    device fingerprinting.
  - **Collected only if the parent opts in** from onboarding or the parent area. The default is
    **off**.
  - Events are kept for 12 months, then deleted.
- **Rationale**: Mission funnels and hint counts are what the team needs to improve missions.
  Keeping them first-party and opt-in satisfies Constitution V, FR-041, and the UK Age
  Appropriate Design Code standard that settings should be "high privacy by default".
- **Rejected**:
  - **Firebase Analytics or Mixpanel**: third-party behavioural tracking on child profiles,
    which Constitution V forbids.
  - **On by default**: conflicts with high-privacy defaults for children.
- **⚠ Flag F5**: The architecture input asks for "privacy-light analytics" but doesn't say
  opt-in. **Constitution V and the spec's pilot assumption (success measured in moderated
  sessions, "not by tracking children") require it to be opt-in and off by default.** The pilot
  success criteria are still measured in moderated sessions, and analytics are a supplement.

### R20. Crash reporting: first-party

- **Decision**: `FlutterError.onError` and `PlatformDispatcher.onError` capture Dart-level crashes
  into a local queue. The queue is sent to the `crash-report` Edge Function, which stores the
  stack, app version, OS version and device model class. It sends **no** user, child, family or
  device id. This is on by default, because it carries no personal data, and the privacy notice
  says so.
- **Rationale**: Third-party crash SDKs are third-party services on a children's app. The
  Families policy and kids-category rules restrict them, and Constitution V forbids third-party
  tracking. Dart-level capture covers almost all Flutter crashes.
- **Rejected**:
  - **Sentry, Firebase Crashlytics**: third-party SDKs on a child-directed app. They could be
    reconsidered later in crash-only mode with no personal data, if legal review clears them.
- **Accepted gap**: native-only crashes (NDK, iOS signals) are not captured. They are covered by
  Play Console Android vitals and Xcode Organizer.

### R21. Store listing

- **Decision**:
  - **Google Play**: target audience 5–15, so the Families policy applies in full.
  - **App Store**: **Education** category, built to meet Kids Category rules (parental gate,
    no third-party analytics or ads) even though it isn't listed there. The Kids Category allows
    one age range of 11 or younger, and KudiCubs spans 4–15.
- **Rationale**: Families and Kids rules are the strictest we could face, so the design meets
  them either way.
- **Rejected**:
  - **Kids Category "9–11"**: misrepresents the 4–6 and 13–15 audiences.
- **Release**: always through fastlane lanes `beta`, `release` and `bump` (constitution and
  global rule).

### R22. Data residency and compliance

- **Decision**: Supabase `prod` is hosted in the **London (eu-west-2)** region.
- **Rationale**: Supabase has no African region at the time of writing (to be re-checked at
  project creation). London meets UK GDPR directly. Ghana's Data Protection Act 2012 and
  Nigeria's NDPA 2023 allow transfers abroad with appropriate safeguards and consent, which the
  consent flow (R13) and a data processing agreement provide.
- **Rejected**:
  - **US regions**: weaker position under UK GDPR and the African data laws.
  - **Self-hosting in Africa**: operations burden is too high for an MVP.
- **⚠ Flag F6 (outside sign-off)**: **A data protection impact assessment (DPIA) and legal
  review covering Ghana, Nigeria and the UK, plus registration with Ghana's Data Protection
  Commission and Nigeria's NDPC if needed, must be done before the Stage 1 release.** The
  constitution requires compliance in every region (V). The design supports it, but sign-off is
  outside engineering.

### R23. Transactional email

- **Decision**: Supabase Auth custom SMTP through **Amazon SES (eu-west-2)**, with DKIM, SPF and
  DMARC on a KudiCubs sending domain. Templates are OTP code, retention warnings and deletion
  confirmation.
- **Rationale**: Supabase's built-in SMTP is rate-limited and not for production. SES is cheap,
  in the same jurisdiction as the data, and has good deliverability with proper DNS.
- **Rejected**:
  - **Postmark**: strong deliverability but higher cost. Kept as the fallback if SES
    deliverability to Ghanaian or Nigerian mail providers is poor in the pilot.
  - **Supabase default SMTP**: not for production.

### R24. Retention, deletion and export jobs

- **Decision**:
  - **Retention sweep**: `pg_cron` runs the `retention-sweep` Edge Function daily. It finds
    parents whose `last_active_at` is older than 11 months (sends the 30-day warning) and older
    than 12 months minus 7 days (sends the 7-day warning), logging each in
    `retention_notices`. Accounts older than 12 months are deleted (FR-007i).
  - `last_active_at` is updated by every `sync_push` and every sign-in.
  - **Deletion** (`family-delete`, used by both the parent and the sweep): deletes the
    `auth.users` row through the admin API. All family tables cascade (`ON DELETE CASCADE`).
  - **Export** (`family-export`): returns a JSON document of the family's data (FR-007e), which
    the parent saves through the share sheet behind the gate.
  - **Offline device of a deleted account**: on its next sync, the server responds
    `account_deleted`. The client wipes local data and returns to onboarding (spec edge case).
- **Rationale**: Meets FR-007i and SC-015 with a single, testable job. The cascade guarantees
  nothing is left behind.

---

## E. Quality, delivery and operations

### R25. Folder structure (feature-first)

- **Decision**:
  - The app is in `app/lib/features/{onboarding,home,mission_engine,wallet,progress,profile,parent}`.
    Each feature has `data/`, `domain/` and `presentation/` folders.
  - Shared building blocks live in `app/lib/core/`: database, sync, auth, content, region,
    audio, analytics, crash, design system.
  - Content models and validation live in a pure-Dart local package, `packages/kudi_content`,
    shared by the app and the content tooling.
  - The mission engine's domain is pure Dart (no Flutter imports, enforced by an import lint).
- **Rationale**: Matches the requested feature folders. Keeping the engine and the content
  models in pure Dart lets the content CLI validate missions with exactly the code the app runs,
  and lets engine tests run fast without Flutter.
- **Rejected**:
  - **Layer-first folders** (`models/`, `views/`): scatter each feature across the tree.
  - **Everything in one package**: the content CLI couldn't reuse the validation without
    depending on Flutter.

### R26. Testing strategy

- **Decision**:

  | Layer | Tooling | Scope |
  |---|---|---|
  | Unit | `dart test` / `flutter_test`, `mocktail` | Mission engine (step state machine, band rules, outcome mapping, the gentle variant for 4–6, retry), coin economy (event folding, invariants, replay rewards), sync merge rules, region formatting, parent-gate logic |
  | Widget | `flutter_test`, golden tests at phone and tablet sizes | One suite per screen type: Decision, Resource Management, Action Result, Market Simulation (host), Round Summary, Activity host, Mission Intro, Reward. Each under every band's rules and every region. |
  | Integration | `integration_test` on an Android emulator in CI | **One full-loop test**: The Lost Coins, Mission Intro → Activities → Decision → Result → Summary → Reward → Home, with the wallet, XP and badge checked |
  | Database | `supabase test db` (pgTAP) | RLS: a parent can read and write only their own family's rows. `parent_secrets` can't be read by anyone. Merge rules in `sync_push`. Cascade on delete. |
  | Edge Functions | `deno test` | `otp-verify` lockout, `pin-*`, `family-export`, `family-delete`, `retention-sweep` timing |
  | Content | `tools/content_cli validate` | Schema, band rules, missing ARB keys and audio for all 3 regions (FR-046), reachable steps, no failure outcomes for 4–6 |
  | Performance | `flutter drive --profile` on a physical 2 GB Android device | Mission load ≤ 3 s (SC-010), frame build and raster ≤ 16 ms on UI screens and ≥ 45 fps in Flame scenes (SC-014), memory ≤ 250 MB |

- **Rationale**: Covers the requested unit, widget and integration tests. Adds the RLS and
  content tests that the constitution's safety and localisation rules depend on.
- **Rejected**:
  - **Patrol or Appium for end-to-end tests**: one more tool for the single integration test
    asked for.

### R27. CI on every PR

- **Decision**: GitHub Actions jobs on every PR:
  1. `analyze`: `dart format --set-exit-if-changed`, `flutter analyze`, `riverpod_lint`, and the
     import lint for pure-Dart layers.
  2. `test`: unit and widget tests with coverage.
  3. `content`: content validation for every pack.
  4. `supabase`: `supabase start`, run the migrations, pgTAP, `deno test`.
  5. `build`: an Android release app bundle (`flutter build appbundle`, not signed for upload) and
     iOS `flutter build ios --no-codesign`.
  6. `integration`: the full-loop test on an Android emulator.

  CI **never commits, tags or bumps versions**. Store uploads are done only by a developer
  running the fastlane lanes `beta`, `release` or `bump`.
- **Rationale**: Covers the requested analyse, test and build steps. Keeping CI read-only meets
  the constitution's rules that commits must be authored by the human developer and that
  automation must never be the author.
- **⚠ Flag F7**: The architecture input's quality section doesn't mention fastlane or commit
  authorship. **The constitution (Development Workflow) and your global rule require builds,
  version bumps and uploads through the fastlane lanes `beta`, `release` and `bump` only, and
  forbid automation as the commit author.** The plan adds both. Fastlane is set up with the
  `fastlane-onboard` skill when the app scaffold exists.

### R28. Semantic versioning on all artifacts

- **Decision**:

  | Artifact | Version source | Compatibility rule |
  |---|---|---|
  | App | `pubspec.yaml` `version: MAJOR.MINOR.PATCH+build` (changed by the fastlane `bump` lane) | — |
  | Content packs | `manifest.json` `version` | `minAppVersion` is checked before install |
  | Mission content schema | `$id` with `schemaVersion` | The app supports one major schema version, and packs declare theirs |
  | Band rules | `band-rules.json` `version` | Shipped in the binary |
  | Region config schema | `schemaVersion` | Same as the content schema |
  | Sync protocol | `protocolVersion` in every `sync_push` and `sync_pull` | The server accepts the current and previous major version |
  | Database schema | Migration file names plus `app_meta.schema_version` (semver) | Migrations are additive within a major version |
  | Edge Function API | `/v1/` path prefix plus semver in each function's response header | — |
  | Constitution | Already semver | — |

- **Rationale**: Constitution, Development Workflow ("all artifacts").
- **⚠ Flag F8**: The architecture input versions only "the app and, separately, content packs".
  **The constitution requires semantic versions on schemas and APIs too.** The plan adds the
  rows above.

### R29. Install size, memory and frame-rate budgets

- **Decision**:

  | Budget | Target |
  |---|---|
  | Play Store download (arm64, includes the bundled Lost Coins starter) | ≤ 45 MB |
  | 4–6 world pack (rest of the missions, all 3 regions' narration) | ≤ 60 MB |
  | App memory in a Flame scene on a 2 GB device | ≤ 250 MB |
  | Image cache cap | 50 MB |
  | Texture atlases per scene | ≤ 2048² |
  | UI frame rate | 60 fps target, no frame over 32 ms on the minimum device |
  | Flame scenes | ≥ 45 fps sustained |
  | Cold start to home dashboard | ≤ 4 s |

  **Techniques**: per-ABI splits, `--obfuscate --split-debug-info`, icon tree-shaking, WebP art,
  Rive instead of bitmaps, and one Flame game alive at a time.
- **Rationale**: Turns the user's "small install, 2 GB RAM" goal and SC-010 and SC-014 into
  numbers that can fail a check. They are checked in the performance job (R26) on a
  reference device.
- **Reference test devices**: a 2 GB Android Go phone of a brand common in Ghana and Nigeria (for
  example, Tecno, itel or Samsung A0x), a mid-range Android tablet, an iPhone that supports
  iOS 15+, and an iPad.

### R30. Room for a parent curriculum later

- **Decision**:
  - The `parent` feature exposes a **ParentSection registry**: a list of providers, each giving a
    route, an icon, a title key and a gate requirement. The dashboard and settings are the first
    two sections.
  - The pack manifest's `packType` enum already reserves `parent`, and the router reserves
    `/parent/learn/**`.
  - A future parent curriculum adds one section plus `parent` content packs. Routing, the gate,
    storage and the schema don't change.
- **Rationale**: Meets "leave room for a parent curriculum later without restructuring" at zero
  cost now.
- **Rejected**:
  - **Building parent lessons now**: out of scope.
  - **Hard-coded parent menu**: adding a section later would need edits across the shell.

### R31. Child nickname handling

- **Decision**:
  - The nickname is 2–16 characters. It can be picked from a list of fun suggestions or typed.
  - A local word filter blocks offensive words in English and the main local languages, and
    blocks anything that looks like an email, phone number or URL.
  - The nickname is shown only on the family's own devices and to the parent. It is never shown
    to any other user, because no other users exist in the MVP.
- **Rationale**: Constitution V: minimal data, and no user-generated content shared between
  users. Typed nicknames are the only free text a child enters, so they're kept contained and
  filtered.
- **Rejected**:
  - **Free typing without a filter**: children might enter a real full name or a phone number.
  - **Pick-list only**: children strongly want to personalise their name, and the filter covers
    the risk.

---

## Open items carried into the plan

| # | Item | Owner | Needed before |
|---|---|---|---|
| O1 | ~~Amend spec FR-017 to add the Activity (mini-game) screen type (Flag F2)~~ **Done 2026-11-14** | Product (you) | — |
| O2 | DPIA, legal review and regulator registration for GH, NG and UK (Flag F6) | Client and legal | Stage 1 release |
| O3 | Narration recording: voices for 3 regions, scripts per mission | Client and content | Each stage's content freeze |
| O4 | Final art direction for Kudi the Cub and the 4 worlds (the mockups are only references) | Client and design | Stage 1 art lock |
