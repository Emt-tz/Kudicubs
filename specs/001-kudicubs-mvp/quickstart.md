# Quickstart & Validation Guide: KudiCubs MVP

**Feature**: `001-kudicubs-mvp` | **Plan**: [plan.md](./plan.md)

This guide shows how to run the system locally and **prove each user story and success criterion
works**. It describes commands and expected results. The implementation itself comes from
`tasks.md`. Paths refer to the layout in [plan.md → Project Structure](./plan.md#project-structure).

---

## 1. Prerequisites

| Tool | Notes |
|---|---|
| Flutter stable and Dart | Version pinned in `app/.flutter-version` (or via FVM) |
| Xcode | Only for building and running iOS |
| Android SDK and an emulator | API 26 image for the minimum OS, API 34 for CI |
| Docker and the Supabase CLI | For the local Postgres, Auth, Storage and Edge Functions |
| Deno | For Edge Function tests |
| Ruby and fastlane | Releases only, set up with the `fastlane-onboard` skill. Lanes: `beta`, `release`, `bump`. |

**Reference devices for performance checks** (R29): a 2 GB Android Go phone, a mid-range Android
tablet, an iPhone on iOS 15+, and an iPad.

## 2. One-time local setup

```bash
# Backend: local Supabase stack, schema, seed catalogue, Edge Functions
supabase start
supabase db reset                 # applies supabase/migrations + supabase/seed.sql (missions, badges, content_versions)
supabase functions serve          # serves otp-verify, pin-*, family-*, retention-sweep, crash-report

# Content: validate and build packs into the local storage bucket
dart run tools/content_cli validate content/
dart run tools/content_cli build content/ --out build/packs
dart run tools/content_cli publish build/packs --target local

# App
cd app
flutter pub get
dart run build_runner build --delete-conflicting-outputs   # Drift, Riverpod, l10n
flutter run --dart-define-from-file=env/local.json         # SUPABASE_URL / SUPABASE_ANON_KEY of the local stack
```

Local Auth emails (the OTP codes) appear in the Supabase **Inbucket/Mailpit** UI that
`supabase start` prints.

## 3. Automated checks (the same as CI)

| Command | Proves |
|---|---|
| `cd app && dart format --set-exit-if-changed . && flutter analyze` | Lints, including Riverpod lints, the import boundaries for pure-Dart layers, and that `url_launcher` is only used under `features/parent/` |
| `cd app && flutter test` | Unit tests (mission engine, coin economy, sync merge, band rules, region formatting, parent gate) and widget tests (every screen type × band rules × 3 regions, phone and tablet goldens) |
| `cd app && flutter test integration_test/core_loop_test.dart -d <emulator>` | **The full loop** Mission Intro → Activities → Decision → Result → Summary → Reward → Home for The Lost Coins. Asserts wallet, XP and badge. |
| `supabase test db` | RLS isolation between two families, no client access to `parent_secrets` or `otp_attempts`, merge rules, `ON DELETE CASCADE`, column whitelist on child tables |
| `cd supabase/functions && deno test` | OTP lockout, PIN rules and lockout, export shape, delete cascade, retention timing |
| `dart run tools/content_cli validate content/` | Schema; band rules (no 4–6 failure outcomes, no 4–6 timers); every ARB key and narration clip present for `en_GH`, `en_NG` and `en_GB` (FR-046); every step reachable; badge and item ids exist |

**Expected**: all of them pass. `content_cli` exits non-zero and lists file, step and key for any
violation.

## 4. Manual validation scenarios

Run on the reference Android phone unless noted. Each scenario lists what proves it.

### V1. Onboarding and family account (US1; FR-003–FR-008, FR-007a; SC-001)

1. Fresh install, with **Wi-Fi off**.
2. Go through Welcome → age band (7–15 show "Coming soon" in Stage 1) → avatar and nickname.
3. **Parent gate**: random taps and short presses don't open it. A 3-second hold plus "seven
   times eight = 56" opens it.
4. Choose the region (Ghana is preselected on a GH SIM or locale) → set a PIN (`1234` is rejected)
   → enter the email.
5. Offline, so the "Confirm later" path is taken → "You joined the Pride!" → Home.
   **Expected**: The Lost Coins is playable (it's bundled), and the parent area shows "Confirm
   your email".
6. Turn Wi-Fi on → parent area → confirm the email → enter the code from Mailpit.
   **Expected**: `parents.consented_at` is set, and a `consent_records` row exists. The outbox
   drains within 30 s, and the rows appear in Supabase.
7. Kill the app during step 4 and relaunch. **Expected**: it resumes at step 4 with earlier
   choices kept.
8. **Timing**: steps 1–6 take under 4 minutes with a parent and child (SC-001, in the pilot).

### V2. The Lost Coins (US2; FR-019–FR-024; SC-002, SC-004)

1. Continue → the Intro is narrated, with one Start button.
2. **Find**: each tap is celebrated, and the "left to find" count goes down.
3. **Sort**: drop a coin in the wrong jar. **Expected**: it bounces back with a narrated hint.
   After three wrong drops the right jar glows. No failure text or sound plays.
4. **Count**: numbers are narrated with visual support.
5. **Decide**: the explainer plays and can be skipped. Pick **Save**. **Expected**: coins fly to
   the piggy bank, and the wallet's savings go up by the found amount.
6. The Summary recap is celebratory. **Reward**: coins, XP, and the badges `badge.hard_worker`
   and, after a perfect sort, `badge.smart_sorter`. Back to Home.
7. Replay and pick **Spend**. **Expected**: the sticker is added to the inventory and the
   outcome is positive. The replay gives only replay XP, with no first-completion coins.
8. Kill the app during Sort and relaunch → Continue. **Expected**: it resumes at the start of
   Sort.
9. **SC-004**: with an engineering build flag, force the mission's negative outcomes. **Expected**:
   only gentle variants render for 4–6. A widget test also asserts this.
10. **Narration off and screen-reader off**: complete the mission without reading (US2
    independent test).

### V3. Home and Continue (US3; FR-009–FR-012)

1. Check the XP bar, coins, level name, Continue, the daily card and the badge preview against
   the database folds.
2. Stay idle for 6 s. **Expected**: Kudi points and a narrated hint plays. It escalates at 12 s
   and 20 s.
3. Change the device date to tomorrow. **Expected**: a new daily challenge appears. The first
   completion awards once, and completing again that day awards nothing.

### V4. Wallet and Progress (US4; FR-033, FR-034, FR-026)

1. **Wallet**: every earn, spend and save is listed in order. The bar chart buckets match the
   `category` sums.
2. **Progress**: the level path, badge grid (earned and locked), and the pillar bars for Know and
   Understand are above zero after The Lost Coins.
3. Cross an XP threshold. **Expected**: a Level Up animation with the level name and what it
   unlocked.

### V5. Bands and screen types (US5; FR-015a/b, FR-016–FR-018, FR-028–FR-032)

- **Stage 1**: 7–15 bands can't be selected.
- **Stage 2+ builds**: for each world, play every mission and check:
  - Resource Management: budget, item cards, quantity selectors, remaining balance.
  - Market Simulation: computer-controlled rivals only, and the demand and satisfaction
    indicators react to price.
  - A loss on the Summary offers Try Again. A retry keeps all earlier rewards (SC-005).
  - 7–9 timers are soft and never end the round.

### V6. Profile and parent area (US6; FR-035–FR-038, FR-007e, FR-007h)

1. **Profile**: the sound and narration toggles take effect immediately.
2. **Parent area**: the gate and PIN are both required. Five wrong PINs give a 1-minute lockout.
   **Reset PIN** uses a fresh OTP, then a new PIN.
3. Add a second child. **Expected**: onboarding skips the parent steps, and the profile picker
   appears at launch.
4. **Change band** (once its stage is released). **Expected**: rewards are kept, and an
   in-progress attempt is `abandoned`.
5. **Export**: a JSON file is saved through the share sheet, matching
   [edge-functions.md](./contracts/edge-functions.md#get-family-export).
6. **Delete family**: confirm. **Expected**: the `auth.users` row and every family row are gone,
   and the device returns to onboarding.

### V7. Sync across two devices (FR-007b–d; SC-011)

1. **Device A** (family) and **device B**: sign in with the same email and choose "This is my
   phone" (parent).
   **Expected**: B opens to the parent view after the PIN. There's no profile picker and no
   gameplay route (try `/home`; it redirects).
2. Play a mission on A online. **Expected**: B's parent view updates within 60 s.
3. **Conflict**: put two family devices (A, C) offline. Play different missions on each and earn
   badges on both. Reconnect both.
   **Expected**: the folded coins and XP equal the sum from both devices, both badges appear
   once, and no completed attempt reverts.
4. Script this 100 times with `tools/sync_soak` against local Supabase. **Expected**: zero lost
   or duplicated rewards (SC-011).

### V8. Regions (FR-043, FR-046; SC-008)

1. Parent area → switch the region GH → NG → UK.
   **Expected**: the currency name, symbol, coin art and market examples change everywhere. The
   coin count is unchanged.
2. `flutter test test/widget/regions_matrix_test.dart` renders every step of every released
   mission under each region and fails on any missing key, art or audio (SC-008).

### V9. Retention and privacy (FR-007i, FR-041; SC-015)

1. Seed test families with `last_active_at` 336, 359 and 366 days ago (`supabase/seed_retention.sql`).
2. `curl -X POST …/functions/v1/retention-sweep -H "Authorization: Bearer $SERVICE_KEY"`.
   **Expected**: the warning emails are in Mailpit, and the right families are deleted only
   after both notices have been sent.
3. **Analytics**: off by default. With it off, `analytics_events` gets no rows. Turning it on
   adds a `consent_records` row, and rows appear. Turning it off deletes them within 24 h.
4. Inspect the release APK manifest: there is no `AD_ID` permission. Inspect the dependency
   tree: no third-party analytics, ads or crash SDKs.

### V10. Performance on the minimum device (SC-010, SC-014; R29)

```bash
cd app && flutter drive --profile --driver=test_driver/perf_driver.dart \
  --target=integration_test/perf_lost_coins_test.dart -d <2GB-android-device>
```

**Expected**:

- Mission load ≤ 3 s.
- No UI frame over 32 ms.
- Flame scenes ≥ 45 fps average.
- Memory ≤ 250 MB.
- Play Store download size ≤ 45 MB, from `flutter build appbundle --analyze-size`.

## 5. Release (constitution: fastlane only)

Builds, version bumps and store uploads are **only** done with the fastlane lanes `bump`, `beta`
and `release`, run by the developer under their own git identity. CI never commits or uploads.
Content packs are published with `tools/content_cli publish --target prod` after review, and
their semantic version is checked against `minAppVersion`.
