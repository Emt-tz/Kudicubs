/// Building blocks for the Mane Brown parent area (canvas 15-17). Everything here is
/// presentation only; behaviour lives in the screens.
library;

import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'parent_logic.dart';

// ---- Text styles (cream on brown) --------------------------------------------------

TextStyle _style(String family, double size, int w, {Color color = Kc.cream, double height = 1.4}) => TextStyle(
  fontFamily: family,
  fontSize: size,
  fontWeight: FontWeight.values[(w ~/ 100) - 1],
  fontVariations: [FontVariation('wght', w.toDouble())],
  height: height,
  color: color,
);

abstract final class PT {
  static TextStyle display(double size, {Color color = Kc.cream}) =>
      _style('Baloo2', size, 800, color: color, height: 1.1);
  static TextStyle heading(double size) => _style('Baloo2', size, 700, height: 1.15);
  static TextStyle body(double size, {Color color = Kc.cream, int weight = 400}) =>
      _style('Nunito', size, weight, color: color);
  static TextStyle strong(double size, {Color color = Kc.cream}) =>
      _style('Nunito', size, 800, color: color, height: 1.3);
  static final eyebrow = _style('Nunito', 14, 800, color: Kc.softGold).copyWith(letterSpacing: 0.56);
}

/// Dark page: safe area, 20 dp gutters, scrolling content and an optional pinned [bottom].
/// [scroll] false lets [child] fill the height (empty and loading states).
class ParentPage extends StatelessWidget {
  const ParentPage({super.key, required this.child, this.bottom, this.scroll = true, this.overlay});

  final Widget child;
  final Widget? bottom;
  final bool scroll;

  /// Drawn over the whole page (toast or dialog).
  final Widget? overlay;

  @override
  Widget build(BuildContext context) {
    final body = scroll ? SingleChildScrollView(child: child) : child;
    return Scaffold(
      backgroundColor: Kc.brown,
      body: SafeArea(
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(Kc.s5, Kc.s2, Kc.s5, Kc.s5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(child: body),
                  if (bottom != null)
                    Padding(
                      padding: const EdgeInsets.only(top: Kc.s3),
                      child: bottom,
                    ),
                ],
              ),
            ),
            ?overlay,
          ],
        ),
      ),
    );
  }
}

/// Vertical stack with a gap, for page content.
class Gap extends StatelessWidget {
  const Gap({super.key, required this.children, this.gap = 14, this.crossAxisAlignment = CrossAxisAlignment.stretch});
  final List<Widget> children;
  final double gap;
  final CrossAxisAlignment crossAxisAlignment;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: crossAxisAlignment,
    children: [
      for (var i = 0; i < children.length; i++) ...[if (i > 0) SizedBox(height: gap), children[i]],
    ],
  );
}

/// `‹ Your children` link at the top of a page. 48 dp tall.
class BackLink extends StatelessWidget {
  const BackLink(this.label, {super.key, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.centerLeft,
    child: Semantics(
      button: true,
      label: 'Back to $label',
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: Kc.touchMin, minWidth: Kc.touchMin),
          child: Align(
            alignment: Alignment.centerLeft,
            widthFactor: 1,
            child: Text('‹ $label', style: PT.strong(16, color: Kc.softGold)),
          ),
        ),
      ),
    ),
  );
}

/// Pops when it can, otherwise goes to [fallback].
void goBackOr(BuildContext context, String fallback) {
  final nav = Navigator.of(context);
  if (nav.canPop()) {
    nav.pop();
  } else {
    context.go(fallback);
  }
}

/// A path parameter (`/parent/child/:id`) or query value (`?child=`) of the current route; null outside the router.
String? routeValue(BuildContext context, String name, {bool query = false}) {
  try {
    final s = GoRouterState.of(context);
    return query ? s.uri.queryParameters[name] : s.pathParameters[name];
  } catch (_) {
    return null;
  }
}

/// Opens [builder] as a full page on top of the current one (add child, device mode, delete).
Future<T?> pushPage<T>(BuildContext context, WidgetBuilder builder) =>
    Navigator.of(context).push<T>(MaterialPageRoute(builder: builder));

// ---- Buttons ---------------------------------------------------------------------------

/// Yellow pill, brown text. The main action of a parent screen.
class ParentPrimary extends StatelessWidget {
  const ParentPrimary(
    this.label, {
    super.key,
    required this.onPressed,
    this.height = 60,
    this.fontSize = 22,
    this.shadow = false,
  });
  final String label;
  final VoidCallback? onPressed;
  final double height;
  final double fontSize;
  final bool shadow;

  @override
  Widget build(BuildContext context) => _Pill(
    label: label,
    onPressed: onPressed,
    height: height,
    fill: Kc.yellow,
    border: Kc.brown,
    style: PT.display(fontSize, color: Kc.brown),
    shadow: shadow ? Kc.softGold : null,
  );
}

/// Transparent pill with a coloured outline.
class ParentOutline extends StatelessWidget {
  const ParentOutline(
    this.label, {
    super.key,
    required this.onPressed,
    this.height = 56,
    this.color = Kc.softGold,
    this.fontSize = 20,
  });
  final String label;
  final VoidCallback? onPressed;
  final double height;
  final Color color;
  final double fontSize;

  @override
  Widget build(BuildContext context) => _Pill(
    label: label,
    onPressed: onPressed,
    height: height,
    fill: Colors.transparent,
    border: color,
    style: PT.display(fontSize, color: color),
  );
}

/// Quiet translucent pill.
class ParentSoft extends StatelessWidget {
  const ParentSoft(this.label, {super.key, required this.onPressed, this.height = 52});
  final String label;
  final VoidCallback? onPressed;
  final double height;

  @override
  Widget build(BuildContext context) => _Pill(
    label: label,
    onPressed: onPressed,
    height: height,
    fill: Kc.white.withValues(alpha: 0.14),
    border: Colors.transparent,
    style: PT.strong(16),
  );
}

class _Pill extends StatelessWidget {
  const _Pill({
    required this.label,
    required this.onPressed,
    required this.height,
    required this.fill,
    required this.border,
    required this.style,
    this.shadow,
  });

  final String label;
  final VoidCallback? onPressed;
  final double height;
  final Color fill;
  final Color border;
  final TextStyle style;
  final Color? shadow;

  @override
  Widget build(BuildContext context) {
    final enabled = onPressed != null;
    return Semantics(
      button: true,
      enabled: enabled,
      label: label,
      excludeSemantics: true,
      child: Opacity(
        opacity: enabled ? 1 : 0.5,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(Kc.rPill),
            boxShadow: shadow == null ? null : [BoxShadow(color: shadow!, offset: const Offset(0, 4))],
          ),
          child: Material(
            color: fill,
            shape: StadiumBorder(side: BorderSide(color: border, width: 2)),
            child: InkWell(
              customBorder: const StadiumBorder(),
              onTap: onPressed == null
                  ? null
                  : () {
                      HapticFeedback.selectionClick();
                      onPressed!();
                    },
              child: SizedBox(
                height: height,
                child: Center(
                  child: Text(label, style: style, maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Dashed pill (the "Add a child" button).
class ParentDashed extends StatelessWidget {
  const ParentDashed(this.label, {super.key, required this.onPressed});
  final String label;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: label,
    excludeSemantics: true,
    child: CustomPaint(
      foregroundPainter: _DashedBorder(Kc.softGold, 28),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: onPressed,
        child: SizedBox(
          height: 56,
          child: Center(
            child: Text(label, style: PT.display(20, color: Kc.softGold)),
          ),
        ),
      ),
    ),
  );
}

/// Panel with a dashed soft-gold border (empty states).
class DashedBox extends StatelessWidget {
  const DashedBox({super.key, required this.child, this.radius = 24, this.padding = const EdgeInsets.all(24)});
  final Widget child;
  final double radius;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => CustomPaint(
    foregroundPainter: _DashedBorder(Kc.softGold, radius),
    child: Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(radius)),
      child: child,
    ),
  );
}

class _DashedBorder extends CustomPainter {
  _DashedBorder(this.color, this.radius);
  final Color color;
  final double radius;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(math.min(radius, size.height / 2)));
    final path = Path()..addRRect(rrect);
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;
    for (final m in path.computeMetrics()) {
      var d = 0.0;
      while (d < m.length) {
        canvas.drawPath(m.extractPath(d, (d + 8).clamp(0, m.length)), paint);
        d += 14;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBorder old) => old.color != color || old.radius != radius;
}

/// A selectable chip / tile: filled when [selected].
class ParentChoice extends StatelessWidget {
  const ParentChoice({
    super.key,
    required this.label,
    required this.selected,
    required this.onTap,
    this.height = 48,
    this.radius = 14,
    this.fill = Kc.softGold,
    this.outline = Kc.softGold,
    this.idleOutline,
    this.fontSize = 17,
    this.display = false,
    this.padding = const EdgeInsets.symmetric(horizontal: 16),
    this.trailing,
  });

  final String label;
  final bool selected;
  final VoidCallback? onTap;
  final double height;
  final double radius;
  final Color fill;
  final Color outline;

  /// Border colour when not selected (defaults to [outline]).
  final Color? idleOutline;
  final double fontSize;
  final bool display;
  final EdgeInsets padding;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    final fg = selected ? Kc.brown : Kc.cream;
    final style = display ? PT.display(fontSize, color: fg) : PT.strong(fontSize, color: fg);
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      excludeSemantics: true,
      child: Material(
        color: selected ? fill : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radius),
          side: BorderSide(color: selected ? outline : (idleOutline ?? outline), width: 2),
        ),
        child: InkWell(
          customBorder: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
          onTap: onTap,
          child: Container(
            constraints: BoxConstraints(minHeight: height, minWidth: Kc.touchMin),
            padding: padding,
            alignment: trailing == null ? Alignment.center : Alignment.centerLeft,
            child: trailing == null
                ? Text(label, style: style, textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis)
                : Row(
                    children: [
                      Expanded(child: Text(label, style: style)),
                      Text(trailing!, style: style),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

// ---- Cards and strips -----------------------------------------------------------------

/// Translucent card.
class ParentCard extends StatelessWidget {
  const ParentCard({super.key, required this.child, this.padding = const EdgeInsets.all(12), this.radius = 16});
  final Widget child;
  final EdgeInsets padding;
  final double radius;

  @override
  Widget build(BuildContext context) => Container(
    padding: padding,
    decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(radius)),
    child: child,
  );
}

/// Information strip with an (i) icon.
class InfoStrip extends StatelessWidget {
  const InfoStrip(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) => ParentCard(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    radius: 14,
    child: Row(
      children: [
        const Icon(Icons.info_outline_rounded, color: Kc.softGold, size: 22),
        const SizedBox(width: 10),
        Expanded(child: Text(text, style: PT.body(15))),
      ],
    ),
  );
}

/// Peach alert for problems (`pa-04`). Brown on peach: the brand has no error colour.
class ParentAlert extends StatelessWidget {
  const ParentAlert({super.key, required this.title, required this.message});
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) => Semantics(
    liveRegion: true,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: Kc.peach,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Kc.softGold, width: 2),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline_rounded, color: Kc.brown, size: 24),
          const SizedBox(width: 10),
          Expanded(
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: '$title ',
                    style: PT.strong(15, color: Kc.brown),
                  ),
                  TextSpan(
                    text: message,
                    style: PT.body(15, color: Kc.brown),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

/// Round avatar for a child.
class ChildAvatar extends StatelessWidget {
  const ChildAvatar(this.avatar, {super.key, this.size = 56});
  final String avatar;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: avatarColor(avatar),
      border: Border.all(color: Kc.softGold, width: 3),
    ),
  );
}

/// Grey-ish placeholder tile for loading (`pa-02`).
class SkeletonTile extends StatelessWidget {
  const SkeletonTile({super.key, required this.titleWidth, required this.lineWidth});
  final double titleWidth;
  final double lineWidth;

  @override
  Widget build(BuildContext context) {
    Widget bar(double h, double f, double a) => FractionallySizedBox(
      widthFactor: f,
      alignment: Alignment.centerLeft,
      child: Container(
        height: h,
        decoration: BoxDecoration(
          color: Kc.creamShade.withValues(alpha: a),
          borderRadius: BorderRadius.circular(h / 2),
        ),
      ),
    );
    return Container(
      constraints: const BoxConstraints(minHeight: 88),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(shape: BoxShape.circle, color: Kc.creamShade.withValues(alpha: 0.3)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [bar(20, titleWidth, 0.3), const SizedBox(height: 8), bar(14, lineWidth, 0.2)],
            ),
          ),
        ],
      ),
    );
  }
}

/// Settings row: label + subtitle on the left, [trailing] on the right.
class SettingRow extends StatelessWidget {
  const SettingRow({super.key, required this.title, this.subtitle, this.trailing, this.onTap, this.minHeight = 56});
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final double minHeight;

  @override
  Widget build(BuildContext context) => Semantics(
    button: onTap != null,
    child: Material(
      color: Kc.white.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          constraints: BoxConstraints(minHeight: minHeight),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: PT.strong(17)),
                    if (subtitle != null) Text(subtitle!, style: PT.body(14, color: Kc.softGold)),
                  ],
                ),
              ),
              ?trailing,
            ],
          ),
        ),
      ),
    ),
  );
}

/// Pill switch from the design (yellow when on).
class ParentSwitch extends StatelessWidget {
  const ParentSwitch({super.key, required this.value, required this.onChanged, required this.label});
  final bool value;
  final ValueChanged<bool> onChanged;
  final String label;

  @override
  Widget build(BuildContext context) => Semantics(
    toggled: value,
    label: label,
    button: true,
    excludeSemantics: true,
    child: InkWell(
      customBorder: const StadiumBorder(),
      onTap: () => onChanged(!value),
      child: SizedBox(
        width: Kc.touchMin + 8,
        height: Kc.touchMin,
        child: Center(
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            width: 52,
            height: 30,
            padding: const EdgeInsets.all(3),
            alignment: value ? Alignment.centerRight : Alignment.centerLeft,
            decoration: BoxDecoration(
              color: value ? Kc.yellow : Kc.white.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(Kc.rPill),
            ),
            child: Container(
              width: 24,
              height: 24,
              decoration: const BoxDecoration(color: Kc.brown, shape: BoxShape.circle),
            ),
          ),
        ),
      ),
    ),
  );
}

// ---- Dialog and toast ---------------------------------------------------------------------

/// Cream confirm card: a safe primary action and a plainer second action.
class ConfirmCard extends StatelessWidget {
  const ConfirmCard({
    super.key,
    required this.title,
    required this.body,
    required this.primaryLabel,
    required this.onPrimary,
    required this.secondaryLabel,
    required this.onSecondary,
  });

  final String title;
  final InlineSpan body;
  final String primaryLabel;
  final VoidCallback onPrimary;
  final String secondaryLabel;
  final VoidCallback onSecondary;

  @override
  Widget build(BuildContext context) => Semantics(
    scopesRoute: true,
    explicitChildNodes: true,
    namesRoute: true,
    label: title,
    child: Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Kc.cream,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.4), blurRadius: 48, offset: const Offset(0, 18))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title, style: PT.display(26, color: Kc.brown).copyWith(height: 1.15)),
          const SizedBox(height: 12),
          Text.rich(body),
          const SizedBox(height: 12),
          ParentPrimary(primaryLabel, onPressed: onPrimary, height: 56, fontSize: 20, shadow: false),
          const SizedBox(height: 12),
          _Pill(
            label: secondaryLabel,
            onPressed: onSecondary,
            height: 52,
            fill: Kc.white,
            border: Kc.brown,
            style: PT.display(18, color: Kc.brown),
          ),
        ],
      ),
    ),
  );
}

/// Body text for a [ConfirmCard]: [plain] with a bold [strong] part.
InlineSpan confirmBody(String before, String strong, [String after = '']) => TextSpan(
  children: [
    TextSpan(
      text: before,
      style: PT.body(17, color: Kc.brown),
    ),
    TextSpan(
      text: strong,
      style: PT.strong(17, color: Kc.brown),
    ),
    TextSpan(
      text: after,
      style: PT.body(17, color: Kc.brown),
    ),
  ],
);

/// Dimmed scrim with a centred dialog child. Used for the static dialog screens (pa-07, pa-10).
class DialogScrim extends StatelessWidget {
  const DialogScrim({super.key, required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Positioned.fill(
    child: Container(
      color: Kc.brown.withValues(alpha: 0.55),
      padding: const EdgeInsets.all(24),
      alignment: Alignment.center,
      child: child,
    ),
  );
}

/// Shows [builder] as a modal confirm dialog and resolves true when the second (change) action is taken.
Future<bool> askConfirm(
  BuildContext context, {
  required String title,
  required InlineSpan body,
  required String keepLabel,
  required String confirmLabel,
}) async {
  final r = await showDialog<bool>(
    context: context,
    barrierColor: Kc.brown.withValues(alpha: 0.55),
    builder: (ctx) => Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: const EdgeInsets.all(24),
      child: ConfirmCard(
        title: title,
        body: body,
        primaryLabel: keepLabel,
        onPrimary: () => Navigator.of(ctx).pop(false),
        secondaryLabel: confirmLabel,
        onSecondary: () => Navigator.of(ctx).pop(true),
      ),
    ),
  );
  return r ?? false;
}

/// Floating "Saved" pill (`pa-06`).
class SavedToast extends StatelessWidget {
  const SavedToast({super.key, this.text = 'Saved'});
  final String text;

  @override
  Widget build(BuildContext context) => Positioned(
    left: 20,
    right: 20,
    bottom: 100,
    child: Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
        decoration: BoxDecoration(
          color: Kc.cream,
          borderRadius: BorderRadius.circular(Kc.rPill),
          boxShadow: [
            BoxShadow(color: Colors.black.withValues(alpha: 0.35), blurRadius: 20, offset: const Offset(0, 8)),
          ],
        ),
        child: Row(
          children: [
            const Icon(Icons.check_circle_outline_rounded, color: Kc.success, size: 24),
            const SizedBox(width: 10),
            Expanded(
              child: Text(text, style: PT.strong(16, color: Kc.brown)),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Dark-theme loading / error body for pages that load data.
class ParentMessage extends StatelessWidget {
  const ParentMessage({
    super.key,
    required this.title,
    this.message,
    this.pose = KudiPose.headphones,
    this.actionLabel,
    this.onAction,
  });
  final String title;
  final String? message;
  final KudiPose pose;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => Center(
    child: SingleChildScrollView(
      padding: const EdgeInsets.all(Kc.s4),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          KudiImage(pose, width: 140),
          const SizedBox(height: 12),
          Text(title, style: PT.display(26), textAlign: TextAlign.center),
          if (message != null) ...[
            const SizedBox(height: 8),
            Text(message!, style: PT.body(17), textAlign: TextAlign.center),
          ],
          if (onAction != null) ...[
            const SizedBox(height: 20),
            ParentPrimary(actionLabel ?? 'Try again', onPressed: onAction),
          ],
        ],
      ),
    ),
  );
}

/// Runs [onTick] once a second while mounted. Used by the lock-out countdown.
mixin SecondTicker<T extends StatefulWidget> on State<T> {
  Timer? _timer;

  void startTicker(VoidCallback onTick) {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) onTick();
    });
  }

  void stopTicker() => _timer?.cancel();

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}
