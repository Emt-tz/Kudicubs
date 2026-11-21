/// Shared building blocks for the 4–6 and 7–9 mission screens (both folders are one area).
library;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';

/// Leaves the mission area for the home screen (falls back to popping when there is no router).
void goHome(BuildContext context) {
  final router = GoRouter.maybeOf(context);
  if (router != null) {
    router.go('/home');
  } else {
    Navigator.of(context).maybePop();
  }
}

/// White/coloured rounded box with the brand brown outline.
BoxDecoration kBox(
  Color fill, {
  double radius = 18,
  double width = 2,
  bool shadow = false,
}) => BoxDecoration(
  color: fill,
  borderRadius: BorderRadius.circular(radius),
  border: Border.all(color: Kc.brown, width: width),
  boxShadow: shadow
      ? const [BoxShadow(color: Kc.brown, offset: Offset(0, 5))]
      : null,
);

TextStyle display(double size, {Color? color}) =>
    KcText.headline.copyWith(fontSize: size, height: 1.05, color: color);

TextStyle body(
  double size, {
  int weight = 700,
  Color? color,
  double height = 1.35,
}) => TextStyle(
  fontFamily: 'Nunito',
  fontSize: size,
  fontWeight: FontWeight.values[(weight ~/ 100) - 1],
  fontVariations: [FontVariation('wght', weight.toDouble())],
  height: height,
  color: color ?? Kc.brown,
);

/// Cream page: safe area, 20 dp gutters. [banner] sits above everything (offline strip).
class MissionFrame extends StatelessWidget {
  const MissionFrame({
    super.key,
    required this.child,
    this.banner,
    this.padding = const EdgeInsets.fromLTRB(20, 10, 20, 16),
  });

  final Widget child;
  final Widget? banner;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Kc.cream,
    body: SafeArea(
      child: Padding(
        padding: padding,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (banner != null) ...[banner!, const SizedBox(height: 10)],
            Expanded(child: child),
          ],
        ),
      ),
    ),
  );
}

/// Centres [child] when it is short and scrolls when it is tall.
class CenterScroll extends StatelessWidget {
  const CenterScroll({super.key, required this.child, this.center = true});
  final Widget child;
  final bool center;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) => SingleChildScrollView(
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: box.maxHeight),
        child: Align(
          alignment: center ? Alignment.center : Alignment.topCenter,
          child: child,
        ),
      ),
    ),
  );
}

/// Round 48/52 dp icon button used for back and leave.
class RoundButton extends StatelessWidget {
  const RoundButton({
    super.key,
    required this.label,
    required this.onTap,
    required this.child,
    this.size = 48,
  });

  final String label;
  final VoidCallback? onTap;
  final Widget child;
  final double size;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: label,
    excludeSemantics: true,
    child: GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: Kc.white,
          border: Border.fromBorderSide(BorderSide(color: Kc.brown, width: 2)),
        ),
        child: child,
      ),
    ),
  );
}

class BackButtonCircle extends StatelessWidget {
  const BackButtonCircle({super.key, required this.onTap});
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => RoundButton(
    label: 'Back',
    onTap: onTap,
    child: Text('<', style: display(24).copyWith(height: 1)),
  );
}

class LeaveButtonCircle extends StatelessWidget {
  const LeaveButtonCircle({super.key, required this.onTap});
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => RoundButton(
    label: 'Leave mission',
    onTap: onTap,
    size: 52,
    child: const Icon(Icons.close_rounded, color: Kc.brown, size: 26),
  );
}

/// "Money & Choices · Mission 1" style label.
class WorldLabel extends StatelessWidget {
  const WorldLabel(this.text, {super.key, this.size = 15});
  final String text;
  final double size;

  @override
  Widget build(BuildContext context) => Text(
    text.toUpperCase(),
    style: body(
      size,
      weight: 800,
      color: Kc.brown80,
    ).copyWith(letterSpacing: size * 0.04),
  );
}

/// Kudi on the left, speech bubble on the right.
class KudiBubble extends StatelessWidget {
  const KudiBubble(
    this.text, {
    super.key,
    this.pose = KudiPose.wave,
    this.kudiWidth = 84,
    this.fontSize = 18,
    this.weight = 800,
  });

  final String text;
  final KudiPose pose;
  final double kudiWidth;
  final double fontSize;
  final int weight;

  @override
  Widget build(BuildContext context) => Row(
    crossAxisAlignment: CrossAxisAlignment.center,
    children: [
      KudiImage(pose, width: kudiWidth),
      const SizedBox(width: 10),
      Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          decoration: kBox(Kc.white),
          child: Text(
            text,
            style: body(fontSize, weight: weight, height: 1.28),
          ),
        ),
      ),
    ],
  );
}

/// Round counter pill ("3 / 8") or any short text pill.
class CounterPill extends StatelessWidget {
  const CounterPill(
    this.text, {
    super.key,
    this.coin = false,
    this.fill = Kc.white,
  });
  final String text;
  final bool coin;
  final Color fill;

  @override
  Widget build(BuildContext context) => Container(
    padding: EdgeInsets.symmetric(
      horizontal: coin ? 14 : 16,
      vertical: coin ? 8 : 6,
    ),
    decoration: kBox(fill, radius: Kc.rPill),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (coin) ...[
          const CoinDisc(size: 22, border: 2),
          const SizedBox(width: 8),
        ],
        Text(text, style: display(coin ? 20 : 22).copyWith(height: 1.1)),
      ],
    ),
  );
}

/// A drawn coin. [letter] puts the Kudi "K" on it.
class CoinDisc extends StatelessWidget {
  const CoinDisc({
    super.key,
    this.size = 56,
    this.color = Kc.gold,
    this.border = 3,
    this.label,
    this.borderColor = Kc.brown,
    this.labelSize,
  });

  final double size;
  final Color color;
  final double border;
  final String? label;
  final Color borderColor;
  final double? labelSize;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    alignment: Alignment.center,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: color,
      border: Border.all(color: borderColor, width: border),
    ),
    child: label == null
        ? null
        : Text(
            label!,
            style: display(labelSize ?? size * 0.42).copyWith(height: 1),
          ),
  );
}

/// Dots, one per step, filled (gold) when done.
class CoinDots extends StatelessWidget {
  const CoinDots({
    super.key,
    required this.total,
    required this.done,
    this.emptyBrown = false,
  });
  final int total;
  final int done;

  /// ms-01 draws the empty dots white with a brown border; app-07 uses a pale tray colour.
  final bool emptyBrown;

  @override
  Widget build(BuildContext context) => Semantics(
    label: '$done of $total',
    child: Wrap(
      alignment: WrapAlignment.center,
      spacing: 8,
      children: [
        for (var i = 0; i < total; i++)
          i < done
              ? const CoinDisc(size: 22, border: 2)
              : CoinDisc(
                  size: 22,
                  border: 2,
                  color: emptyBrown ? Kc.white : Kc.creamShade,
                  borderColor: emptyBrown ? Kc.brown : Kc.brown60,
                ),
      ],
    ),
  );
}

/// Static SVG art taken from the canvas.
class Art extends StatelessWidget {
  const Art(this.svg, {super.key, this.width, this.height});
  final String svg;
  final double? width;
  final double? height;

  @override
  Widget build(BuildContext context) =>
      SvgPicture.string(svg, width: width, height: height);
}

const String kJarSvg =
    '''<svg width="96" height="110" viewBox="0 0 96 110" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="22" width="68" height="82" rx="16" fill="#fff" stroke="#3E2312" stroke-width="4"/><rect x="26" y="8" width="44" height="16" rx="6" fill="#F68C1F" stroke="#3E2312" stroke-width="4"/><circle cx="48" cy="82" r="13" fill="#FBAA19" stroke="#3E2312" stroke-width="4"/><circle cx="36" cy="64" r="11" fill="#FBAA19" stroke="#3E2312" stroke-width="4"/></svg>''';

const String kTreatSvg =
    '''<svg width="96" height="110" viewBox="0 0 96 110" xmlns="http://www.w3.org/2000/svg"><ellipse cx="48" cy="70" rx="38" ry="28" fill="#F68C1F" stroke="#3E2312" stroke-width="4"/><path d="M20 62c10-24 46-24 56 0" fill="#FBE57E" stroke="#3E2312" stroke-width="4"/><circle cx="38" cy="38" r="5" fill="#3E2312"/><circle cx="58" cy="30" r="5" fill="#3E2312"/></svg>''';

const String kStickerSvg =
    '''<svg width="110" height="110" viewBox="0 0 110 110" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="40" width="82" height="34" rx="17" fill="#F68C1F" stroke="#3E2312" stroke-width="5"/><rect x="26" y="26" width="58" height="26" rx="13" fill="#FBAA19" stroke="#3E2312" stroke-width="5"/><rect x="34" y="62" width="44" height="22" rx="11" fill="#F68C1F" stroke="#3E2312" stroke-width="5"/></svg>''';

const String kAlertSvg =
    '''<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><circle cx="22" cy="22" r="20" fill="#fff" stroke="#3E2312" stroke-width="3"/><path d="M22 12v13" stroke="#3E2312" stroke-width="4" stroke-linecap="round"/><circle cx="22" cy="32" r="2.6" fill="#3E2312"/></svg>''';

const String kCheckSvg =
    '''<svg width="26" height="26" viewBox="0 0 26 26" xmlns="http://www.w3.org/2000/svg"><circle cx="13" cy="13" r="12" fill="#16793A"/><path d="M7 13l4 4 8-9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>''';

/// Loading skeleton (canvas ms-08). [title] is the mission name under the spinner.
class MissionLoadingView extends StatelessWidget {
  const MissionLoadingView({super.key, required this.title});
  final String title;

  Widget _bar(double h, double r) => Container(
    height: h,
    decoration: BoxDecoration(
      color: Kc.creamShade,
      borderRadius: BorderRadius.circular(r),
    ),
  );

  @override
  Widget build(BuildContext context) => MissionFrame(
    padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Kc.creamShade,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(child: _bar(30, 12)),
          ],
        ),
        Expanded(
          child: CenterScroll(
            child: Semantics(
              liveRegion: true,
              label: 'Getting things ready',
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const KudiImage(KudiPose.headphones, width: 190),
                  const SizedBox(height: 14),
                  const SizedBox(
                    width: 64,
                    height: 64,
                    child: CircularProgressIndicator(
                      color: Kc.orange,
                      backgroundColor: Kc.creamShade,
                      strokeWidth: 8,
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Getting things ready...',
                    style: display(28).copyWith(height: 1.1),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 14),
                  Text(title, style: body(18, color: Kc.brown80)),
                ],
              ),
            ),
          ),
        ),
        _bar(150, 28),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(child: _bar(60, 20)),
            const SizedBox(width: 10),
            Expanded(child: _bar(60, 20)),
            const SizedBox(width: 10),
            Expanded(child: _bar(60, 20)),
          ],
        ),
      ],
    ),
  );
}

/// Text link used under main buttons ("Not now", "Back to home").
class UnderlineLink extends StatelessWidget {
  const UnderlineLink(this.label, {super.key, required this.onTap});
  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: label,
    excludeSemantics: true,
    child: GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: Kc.touchMin),
        alignment: Alignment.center,
        child: Text(
          label,
          style: body(
            17,
            weight: 800,
          ).copyWith(decoration: TextDecoration.underline),
        ),
      ),
    ),
  );
}

/// Offline strip shown over the summary / saving screens.
class OfflineStrip extends StatelessWidget {
  const OfflineStrip({super.key});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    decoration: kBox(Kc.softGold, radius: 16),
    child: Row(
      children: [
        const Icon(Icons.wifi_off_rounded, color: Kc.brown, size: 26),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            'You are offline. Your play is saved on this device.',
            style: body(16, weight: 800, height: 1.3),
          ),
        ),
      ],
    ),
  );
}
