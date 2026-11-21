import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';

/// Shared building blocks for the 10-12 and 13-15 mission screens
/// (kept inside this folder: nothing here is a core widget).

/// Records one finished or abandoned attempt (the host adds child and mission).
typedef AttemptSink = Future<void> Function(AttemptOutcome outcome, DateTime startedAt);

/// Leaves the mission: back to the previous route, or home when there is none.
void leaveMission(BuildContext context) {
  final router = GoRouter.maybeOf(context);
  if (router == null) {
    Navigator.of(context).maybePop();
  } else if (router.canPop()) {
    router.pop();
  } else {
    router.go('/home');
  }
}

/// Goes to the home screen (used after the reward flow).
void goHome(BuildContext context) {
  final router = GoRouter.maybeOf(context);
  if (router == null) {
    Navigator.of(context).popUntil((r) => r.isFirst);
  } else {
    router.go('/home');
  }
}

/// Wraps [normal] with the loading / empty / error / offline gallery states,
/// keyed so each canvas id is found on screen.
class StateGate extends StatelessWidget {
  const StateGate({super.key, required this.state, required this.normal, this.onRetry});

  final ScreenState state;
  final Widget normal;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => ScreenStateView(
        state: state,
        normal: normal,
        onRetry: onRetry,
        empty: const EmptyView(title: 'Add a child first', message: 'Missions need a child profile to play.'),
      );
}

/// Round white "<" button with the eyebrow and title from the canvas header.
class FlowHeader extends StatelessWidget {
  const FlowHeader({super.key, this.eyebrow, this.title, this.onBack});

  final String? eyebrow;
  final String? title;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        if (onBack != null) ...[
          Semantics(
            button: true,
            label: 'Back',
            excludeSemantics: true,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: onBack,
              child: Container(
                width: 48,
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Kc.white,
                  shape: BoxShape.circle,
                  border: Border.all(color: Kc.brown, width: Kc.border),
                ),
                child: Text('<', style: KcText.headline.copyWith(fontSize: 24)),
              ),
            ),
          ),
          const SizedBox(width: 10),
        ],
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (eyebrow != null) Text(eyebrow!.toUpperCase(), style: _eyebrow, maxLines: 1, overflow: TextOverflow.ellipsis),
              if (title != null)
                Text(title!, style: KcText.title.copyWith(fontWeight: FontWeight.w800, fontSize: 26, height: 1.1)),
            ],
          ),
        ),
      ],
    );
  }
}

final TextStyle _eyebrow = KcText.caption.copyWith(fontWeight: FontWeight.w800, fontSize: 13, letterSpacing: 0.5);

/// Small caps line used above titles.
class Eyebrow extends StatelessWidget {
  const Eyebrow(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Text(text.toUpperCase(), style: _eyebrow);
}

/// White (or tinted) rounded card with the brand's brown outline.
class Panel extends StatelessWidget {
  const Panel({
    super.key,
    required this.child,
    this.color = Kc.white,
    this.radius = 18,
    this.border = Kc.border,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  });

  final Widget child;
  final Color color;
  final double radius;
  final double border;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: padding,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(radius),
          border: Border.all(color: Kc.brown, width: border),
        ),
        child: child,
      );
}

/// Kudi next to a speech bubble.
class KudiSays extends StatelessWidget {
  const KudiSays(this.text, {super.key, this.pose = KudiPose.headphones, this.width = 84, this.size = 18});

  final String text;
  final KudiPose pose;
  final double width;
  final double size;

  @override
  Widget build(BuildContext context) => Row(
        children: [
          KudiImage(pose, width: width),
          const SizedBox(width: 10),
          Expanded(
            child: Panel(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Text(text, style: KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: size, height: 1.3)),
            ),
          ),
        ],
      );
}

/// A label on the left and a bold value on the right.
class AmountRow extends StatelessWidget {
  const AmountRow(this.label, this.value, {super.key, this.big = false});

  final String label;
  final String value;
  final bool big;

  @override
  Widget build(BuildContext context) {
    final lStyle = big ? KcText.headline.copyWith(fontSize: 24, height: 1.1) : KcText.label.copyWith(fontSize: 17);
    final vStyle = big ? lStyle : KcText.label.copyWith(fontSize: 17, fontWeight: FontWeight.w800);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: Text(label, style: lStyle)),
        const SizedBox(width: 8),
        Text(value, style: vStyle),
      ],
    );
  }
}

class RuleLine extends StatelessWidget {
  const RuleLine({super.key});

  @override
  Widget build(BuildContext context) => Container(height: 2, color: Kc.brown);
}

class SafeNote extends StatelessWidget {
  const SafeNote({super.key});

  @override
  Widget build(BuildContext context) => Row(
        children: [
          const Icon(Icons.check_circle_rounded, color: Kc.success, size: 26),
          const SizedBox(width: 10),
          Expanded(
            child: Text('Your coins, XP and badges are safe.',
                style: KcText.label.copyWith(fontWeight: FontWeight.w800, color: Kc.success)),
          ),
        ],
      );
}

/// "You earned 60 coins and 60 XP" strip.
class EarnedStrip extends StatelessWidget {
  const EarnedStrip({super.key, required this.coins, required this.xp});

  final int coins;
  final int xp;

  @override
  Widget build(BuildContext context) => Panel(
        color: Kc.softGold,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: Kc.gold,
                shape: BoxShape.circle,
                border: Border.all(color: Kc.brown, width: Kc.border),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text('You earned $coins coins and $xp XP', style: KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: 18))),
          ],
        ),
      );
}

/// Big number with a caption, on a gold tile (summary screens).
class RewardTile extends StatelessWidget {
  const RewardTile(this.value, this.caption, {super.key, this.big = 24});

  final String value;
  final String caption;
  final double big;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Kc.softGold,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Kc.brown, width: Kc.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FittedBox(fit: BoxFit.scaleDown, child: Text(value, style: KcText.headline.copyWith(fontSize: big))),
            Text(caption, style: KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: 14)),
          ],
        ),
      );
}

/// A horizontal slider in the brand look: orange fill, yellow thumb with a brown ring.
class KcSlider extends StatelessWidget {
  const KcSlider({
    super.key,
    required this.label,
    required this.valueText,
    required this.value,
    required this.min,
    required this.max,
    required this.onChanged,
    this.divisions,
    this.labelSize = 16,
  });

  final String label;
  final String valueText;
  final int value;
  final int min;
  final int max;
  final int? divisions;
  final ValueChanged<int> onChanged;
  final double labelSize;

  @override
  Widget build(BuildContext context) {
    final style = KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: labelSize);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(children: [Expanded(child: Text(label, style: style)), const SizedBox(width: 8), Text(valueText, style: style)]),
        SizedBox(
          height: 40,
          child: SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 6,
              activeTrackColor: Kc.orange,
              inactiveTrackColor: Kc.creamShade,
              thumbShape: const _RingThumb(),
              overlayShape: SliderComponentShape.noOverlay,
              tickMarkShape: SliderTickMarkShape.noTickMark,
              trackShape: const RoundedRectSliderTrackShape(),
            ),
            child: Semantics(
              label: label,
              value: valueText,
              child: Slider(
                value: value.clamp(min, max).toDouble(),
                min: min.toDouble(),
                max: max.toDouble(),
                divisions: divisions,
                onChanged: max > min ? (v) => onChanged(v.round()) : null,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _RingThumb extends SliderComponentShape {
  const _RingThumb();

  @override
  Size getPreferredSize(bool isEnabled, bool isDiscrete) => const Size.fromRadius(14);

  @override
  void paint(
    PaintingContext context,
    Offset center, {
    required Animation<double> activationAnimation,
    required Animation<double> enableAnimation,
    required bool isDiscrete,
    required TextPainter labelPainter,
    required RenderBox parentBox,
    required SliderThemeData sliderTheme,
    required TextDirection textDirection,
    required double value,
    required double textScaleFactor,
    required Size sizeWithOverflow,
  }) {
    final c = context.canvas;
    c.drawCircle(center, 12.5, Paint()..color = Kc.yellow);
    c.drawCircle(
      center,
      12.5,
      Paint()
        ..color = Kc.brown
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );
  }
}

/// Orange dot + one calm sentence.
class SoftNote extends StatelessWidget {
  const SoftNote(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => Panel(
        radius: 16,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Row(
          children: [
            Container(width: 14, height: 14, decoration: const BoxDecoration(color: Kc.orange, shape: BoxShape.circle)),
            const SizedBox(width: 10),
            Expanded(child: Text(text, style: KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: 15))),
          ],
        ),
      );
}

/// Pinned bottom actions: one primary, optional quieter secondary.
class BottomActions extends StatelessWidget {
  const BottomActions({super.key, required this.primary, this.secondary});

  final Widget primary;
  final Widget? secondary;

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          primary,
          if (secondary != null) ...[const SizedBox(height: 8), secondary!],
        ],
      );
}

/// Page body used by every stage: scrolling content over a pinned [bottom].
class StagePage extends StatelessWidget {
  const StagePage({super.key, required this.children, this.bottom, this.gap = 12});

  final List<Widget> children;
  final Widget? bottom;
  final double gap;

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      bottom: bottom,
      child: LayoutBuilder(
        builder: (context, box) => SingleChildScrollView(
          padding: const EdgeInsets.only(top: Kc.s3, bottom: Kc.s2),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: box.maxHeight - Kc.s3 - Kc.s2),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (var i = 0; i < children.length; i++) ...[
                  if (i > 0) SizedBox(height: gap),
                  children[i],
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// White outlined pill for the quiet second action ("Keep this result").
class GhostButton extends StatelessWidget {
  const GhostButton({super.key, required this.label, required this.onPressed, this.height = 56});

  final String label;
  final VoidCallback? onPressed;
  final double height;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: label,
        excludeSemantics: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onPressed,
          child: Container(
            height: height,
            width: double.infinity,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Kc.white,
              borderRadius: BorderRadius.circular(Kc.rPill),
              border: Border.all(color: Kc.brown, width: Kc.border),
            ),
            child: Text(label, style: KcText.buttonSmall),
          ),
        ),
      );
}

/// Green round tick used by success headers.
class SuccessTick extends StatelessWidget {
  const SuccessTick({super.key, this.size = 40});
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(color: Kc.success, shape: BoxShape.circle),
        child: Icon(Icons.check_rounded, color: Kc.white, size: size * 0.7),
      );
}
