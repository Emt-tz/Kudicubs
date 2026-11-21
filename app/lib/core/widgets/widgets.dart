/// KudiCubs shared widgets. Import `package:kudicubs/core/widgets/widgets.dart`.
///
/// README (all const-constructible where possible; colours/sizes from `Kc`):
///
/// - `PrimaryButton(label:, onPressed:, icon:, height: 76)`  one per screen; null onPressed = disabled.
/// - `SecondaryButton(label:, onPressed:, icon:)`            orange, 56 dp, parent area / "Maybe later".
/// - `ScreenScaffold(title:, child:, bottom:, showBack:, onBack:, background:, padding:, scrollable:)`
///     cream page + SafeArea. `bottom` is pinned (put the PrimaryButton there).
///     `background: Kc.brown` gives the dark parent look (title/back turn cream).
/// - `KudiImage(KudiPose.wave|celebrate|fist|headphones|thumbsUp, width: 220)`; `KudiLogo(width:, on: LogoOn.white|yellow|brown)`.
/// - `StateBanner(message:, kind: BannerKind.info|success|error|offline, onRetry:)`  inline strip.
/// - `LoadingView(message:)`, `EmptyView(title:, message:, pose:, actionLabel:, onAction:)`,
///   `ErrorView(title:, message:, onRetry:)`  full-area state views.
///   Wire to Riverpod with `AsyncValueView` (async_value_view.dart) or `ScreenStateView`.
/// - `ProgressDots(count:, index:)`  zero-based step dots.
/// - `CoinChip(amount:, prefix:)`    gold coin + number pill.
/// - `NumberPad(onDigit:, onDelete:, dark:, enabled:)`  3x4 keypad, 64 dp keys.
/// - `PinDots(length: 4, filled:, error:, dark:)`.
/// - `TextFieldKc(controller:, label:, hint:, errorText:, keyboardType:, onChanged:, obscure:, maxLength:)`.
library;

export 'async_value_view.dart';
export 'buttons.dart';
export 'inputs.dart';
export 'kudi.dart';
export 'scaffold.dart';
export 'states.dart';
