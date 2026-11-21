# KudiCubs app foundation

Flutter 3.38 / Dart 3.10, Riverpod 3, go_router, supabase_flutter. Real backend only (no sample fallback).
Every screen is `Widget build_<id_with_underscores>(BuildContext, ScreenState)` in `lib/screens/<group>/<id>.dart`.

## Commands (run in `app/`)

```bash
flutter pub get
flutter analyze                       # must stay clean
flutter test                          # 108 screens x 5 states + router + band rules + widgets
python3 tool/gen_screens.py           # regenerate registry.dart + design/coverage-map.json ("app" key). Never overwrites existing screen files; --force does.
flutter build ios --simulator --debug --no-codesign
flutter run -d "Vuusha Test iPhone"   # booted simulator (xcrun simctl list devices booted)
flutter run -d <android> --dart-define=SUPABASE_URL=http://10.0.2.2:56321   # Android emulator
```
Backend: `supabase start` in the repo root (API `http://127.0.0.1:56321`); seed with `scripts/seed.mjs`.
Override with `--dart-define=SUPABASE_URL=... --dart-define=SUPABASE_ANON_KEY=...` (see `lib/core/env.dart`).
Open any screen directly in the app: `/screens` (index of all 108) or `/screen/<id>?state=normal|loading|empty|error|offline`
(e.g. `xcrun simctl openurl booted` is not needed: `context.go('/screen/app-14-wallet?state=empty')` or edit `initialLocation`).

iOS notes: deployment target raised to 15.0 (Podfile, project, AppFrameworkInfo) and `EXCLUDED_ARCHS[sdk=iphonesimulator*]=x86_64`
added to `ios/Flutter/*.xcconfig` (Flutter 3.38 + Xcode 26 otherwise fails with "does not contain architectures arm64 x86_64").
Run `LANG=en_US.UTF-8 pod install` if CocoaPods complains about encoding.

## Layout

```
lib/main.dart, app.dart          bootstrap (ProviderScope, Supabase.initialize, portrait lock, MaterialApp.router)
lib/core/env.dart                SUPABASE_URL / SUPABASE_ANON_KEY (--dart-define)
lib/core/theme/                  Kc (colours, spacing, radii, sizes), KcText (text styles), AppTheme  -> import theme/theme.dart
lib/core/widgets/widgets.dart    all shared widgets (README comment at top)
lib/core/band_rules.dart         pure band rules (tested)
lib/core/screen_state.dart       ScreenState + ScreenBuilder
lib/core/router.dart             routes + redirect guards (redirectFor is a pure function)
lib/core/data/                   models.dart, repositories.dart, outbox.dart, providers.dart
lib/screens/<group>/<id>.dart    the 108 screens (stubs now); registry.dart is generated
assets/brand (logos, Kudi poses), assets/fonts (Baloo2.ttf, Nunito.ttf: variable fonts, bundled, no runtime fetch)
```
Fonts: families `Baloo2` and `Nunito`. Use `KcText.*` (it sets the variable `wght` axis); do not use google_fonts.

## Widgets (`import '../../core/widgets/widgets.dart'`, `import '../../core/theme/theme.dart'`)

| Widget | Signature |
|---|---|
| PrimaryButton | `(label, onPressed, {icon, height = 76})`; null onPressed = disabled; use `mainButtonHeight(band)` for older bands |
| SecondaryButton | `(label, onPressed, {icon})` orange 56 dp |
| ScreenScaffold | `({key, title, child, bottom, showBack, onBack, background = Kc.cream, padding, scrollable})`; `bottom` pinned for the main action; `background: Kc.brown` = parent dark look |
| KudiImage | `(KudiPose pose, {width = 220})`; poses wave, celebrate, fist, headphones, thumbsUp |
| KudiLogo | `({width, on: LogoOn.white/yellow/brown})` (SVG via flutter_svg) |
| StateBanner | `(message, {kind: BannerKind.info/success/error/offline, onRetry})` |
| LoadingView / EmptyView / ErrorView | `({message})` / `(title, {message, pose, actionLabel, onAction})` / `({title, message, onRetry})` |
| AsyncValueView<T> | `(value: AsyncValue<T>, data: (T) => Widget, {onRetry, isEmpty, empty, loadingMessage})` |
| ScreenStateView | `(state, normal, {empty, onRetry})` maps the gallery `ScreenState` to the state views |
| ProgressDots | `(count, index)` zero-based |
| CoinChip | `(amount, {prefix})` |
| NumberPad | `(onDigit(String), onDelete, {dark, enabled})` 64 dp keys |
| PinDots | `(filled, {length = 4, error, dark})` |
| TextFieldKc | `({controller, label, hint, errorText, keyboardType, onChanged, onSubmitted, obscure, maxLength, autofocus, textInputAction})` |

Rules: one PrimaryButton per screen; text on yellow/orange is always brown; touch targets >= 48 dp; 4-6 screens use <= 3 words.

## Data (`lib/core/data/providers.dart`)

Models: `Parent, Child, WalletEvent, Attempt, Badge (earnedAt set when owned), Mission, Balances`, enums `AgeBand (db 'b4_6', label '4–6'), Region (symbol GH₵/₦/£), WalletKind, AttemptOutcome, PinResult`.

Reads (all `AsyncValue`, wrap with `AsyncValueView` or `ScreenStateView`):

```dart
final child = ref.watch(currentChildProvider);                 // AsyncValue<Child?> (null data = no children)
final bal   = ref.watch(balancesProvider(child.id));            // AsyncValue<Balances> (works offline: cached + queued)
final ev    = ref.watch(walletEventsProvider(child.id));        // AsyncValue<List<WalletEvent>> newest first
final bd    = ref.watch(badgesProvider(child.id));              // all badges, .earned / .earnedAt
final ms    = ref.watch(missionsProvider(child.ageBand));
final at    = ref.watch(attemptsProvider(child.id));
final kids  = ref.watch(childrenProvider);                      // + notifier: add(...), edit(child), remove(id), reload()
final me    = ref.watch(parentProvider);                        // AsyncValue<Parent?>
final sess  = ref.watch(sessionProvider);                       // AsyncValue<Session?>
final on    = ref.watch(onlineProvider);                        // bool, polled every 10 s; notifier.check()
```
Flags: `onboardedProvider` (persisted; `.notifier.set(true)`), `soundOnProvider` (persisted), `parentUnlockedProvider` (memory; `.unlock()/.lock()`), `systemStatusProvider` (`.set(SystemStatus.maintenance)` etc.), `currentChildIdProvider` (`.select(id)`, persisted).

Writes (repositories via `ref.read(xRepositoryProvider)`):

```dart
await ref.read(authRepositoryProvider).sendCode(email);           // then verifyCode(email, code) (throws AuthException when wrong/expired)
final a = await ref.read(attemptsRepositoryProvider).record(childId:, missionId:, outcome: outcomeFor(band, succeeded: ok));
await ref.read(walletRepositoryProvider).addEvent(childId:, kind: WalletKind.earn, amount: 10, label:, attemptId: a.attempt.id);
ref.invalidate(balancesProvider); ref.invalidate(walletEventsProvider);
await ref.read(badgesRepositoryProvider).award(childId, 'badge.first_coins');   // idempotent
final r = await ref.read(parentRepositoryProvider).verifyPin(pin);               // PinResult.ok/wrong/locked; setPin throws PostgrestException 'pin_weak'/'pin_format'
```
`addEvent` / `record` never throw on network failure: they queue in shared_preferences (`queued: true`) and `onlineProvider` replays them (attempts first, then wallet) on reconnect; ids are client uuids and duplicates are ignored. A failed 7-15 attempt writes no negative event: nothing is ever taken away.

Children are soft-deleted (`deleted_at`). Seed ids/keys: see `supabase/` and `scripts/seed.mjs`. Verify PIN is a SQL function (5 wrong = 5 min lock).

## Tests

`test/support/fakes.dart`: `await fakeOverrides(prefs: {...}, online: true)` gives in-memory repositories for `ProviderScope(overrides: ...)`; no network. Screen tests should pump
`MaterialApp(theme: AppTheme.light, home: Builder(builder: (c) => build_xxx(c, ScreenState.normal)))` inside that scope at 390x844 (`tester.view.physicalSize`).
`test/gallery_test.dart` renders all 108 in all 5 states and expects `Key('screen-<id>')` on each root: keep that key when replacing a stub.

## Router (`lib/core/router.dart`)

Initial `/splash`. Flow routes (`flowScreens` map): /splash /welcome /intro/1..3 /age /avatar /gate /pin/create /region /email /code /joined /signin /home /daily /wallet /progress /badges /profile /parent /parent/child/:id /parent/settings;
`/mission/:band` (4-6, 7-9, 10-12, 13-15 -> the band's intro); `/system/:kind` (update-required, maintenance, server-error, no-connection, loading, empty);
debug `/screen/:id?state=` and `/screens`.

Redirects (`redirectFor`, pure and tested): system status != ok -> matching `/system/*`; offline on /email /code /signin /parent -> `/system/no-connection` (gameplay stays offline-capable);
not onboarded and outside the onboarding set -> `/welcome`; `/parent*` without `parentUnlockedProvider` -> `/gate?next=<location>`.

Add real navigation: from a screen call `context.go('/wallet')` / `context.push('/mission/7-9')`. Screens that are not on a flow route (e.g. error variants, result screens) are reached
either by `context.push('/screen/<id>')` or, better, by switching the widget inside the parent screen via `ScreenState`. To make another screen a flow route add it to `flowScreens` and to `FLOW_ROUTES` in `tool/gen_screens.py`.
After onboarding completes call `ref.read(onboardedProvider.notifier).set(true)` then `context.go('/home')`; after gate + PIN success call `parentUnlockedProvider.notifier.unlock()` then `context.go(next)`.

## Known gaps

- No Android build was attempted here beyond what `flutter build apk --debug` needs (licences not touched). Run it where the SDK is set up.
- The design has no error colour; `Kc.error` (#B42318) is a placeholder for small icons/text, errors otherwise use brown on a peach banner.
- Logos are SVG (`flutter_svg`); the app icon PNG is in assets/brand but the iOS/Android launcher icons are still Flutter defaults.
