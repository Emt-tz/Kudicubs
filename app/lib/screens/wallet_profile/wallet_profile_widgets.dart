/// Small widgets shared by the wallet, progress and profile screens (page frame,
/// bottom tabs, skeleton bones, dashed borders, avatar, bars, switch).
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/theme.dart';
import 'wallet_profile_logic.dart';
import '../../core/widgets/friend_art.dart';

TextStyle baloo(double size, {int weight = 800, Color color = Kc.brown, double height = 1.1}) => TextStyle(
      fontFamily: 'Baloo2',
      fontSize: size,
      fontWeight: FontWeight.values[(weight ~/ 100) - 1],
      fontVariations: [FontVariation('wght', weight.toDouble())],
      height: height,
      color: color,
    );

TextStyle nunito(double size, {int weight = 700, Color color = Kc.brown, double height = 1.3}) => TextStyle(
      fontFamily: 'Nunito',
      fontSize: size,
      fontWeight: FontWeight.values[(weight ~/ 100) - 1],
      fontVariations: [FontVariation('wght', weight.toDouble())],
      height: height,
      color: color,
    );

void goBackOr(BuildContext context, String fallback) {
  if (context.canPop()) {
    context.pop();
  } else {
    context.go(fallback);
  }
}

// ---- Page frame and tabs ----------------------------------------------------

enum WpTab { home, wallet, progress, none }

/// Cream page with the three-tab bar under it. [nav] null = no bar; [WpTab.none] = bar without a selection.
class WpPage extends StatelessWidget {
  const WpPage({super.key, required this.child, this.nav, this.padding = const EdgeInsets.fromLTRB(Kc.s5, Kc.s3, Kc.s5, 0)});

  final Widget child;
  final WpTab? nav;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Kc.cream,
        body: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(child: Padding(padding: padding, child: child)),
              if (nav != null) WpBottomNav(current: nav!) else SizedBox(height: MediaQuery.paddingOf(context).bottom),
            ],
          ),
        ),
      );
}

class WpBottomNav extends StatelessWidget {
  const WpBottomNav({super.key, required this.current});

  final WpTab current;

  @override
  Widget build(BuildContext context) => Container(
        height: 84 + MediaQuery.paddingOf(context).bottom,
        padding: EdgeInsets.fromLTRB(Kc.s3, Kc.s2, Kc.s3, Kc.s3 + MediaQuery.paddingOf(context).bottom),
        decoration: const BoxDecoration(
          color: Kc.white,
          border: Border(top: BorderSide(color: Kc.brown, width: Kc.border)),
        ),
        child: Row(
          spacing: Kc.s2,
          children: [
            for (final (tab, label, route) in const [
              (WpTab.home, 'Home', '/home'),
              (WpTab.wallet, 'Wallet', '/wallet'),
              (WpTab.progress, 'Progress', '/progress'),
            ])
              Expanded(child: _NavItem(tab: tab, label: label, selected: tab == current, onTap: () => context.go(route))),
          ],
        ),
      );
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.tab, required this.label, required this.selected, required this.onTap});

  final WpTab tab;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? Kc.brown : Kc.brown80;
    Widget glyph = Container(
      width: 26,
      height: 26,
      decoration: BoxDecoration(
        borderRadius: tab == WpTab.wallet ? null : BorderRadius.circular(8),
        shape: tab == WpTab.wallet ? BoxShape.circle : BoxShape.rectangle,
        border: Border.all(color: color, width: 2),
      ),
    );
    if (tab == WpTab.progress) glyph = Transform.rotate(angle: math.pi / 4, child: Transform.scale(scale: .8, child: glyph));
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: Kc.touchMin),
          decoration: BoxDecoration(color: selected ? Kc.softGold : null, borderRadius: BorderRadius.circular(16)),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            spacing: 2,
            children: [
              glyph,
              Text(label, style: nunito(14, weight: selected ? 800 : 700, color: color, height: 1.2)),
            ],
          ),
        ),
      ),
    );
  }
}

// ---- Building blocks --------------------------------------------------------

/// Grey placeholder block for skeleton screens.
class Bone extends StatelessWidget {
  const Bone({super.key, this.width, this.widthFactor, this.height = 14, this.radius = 12, this.circle = false});

  final double? width;
  final double? widthFactor;
  final double height;
  final double radius;
  final bool circle;

  @override
  Widget build(BuildContext context) {
    final box = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: Kc.creamShade,
        shape: circle ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: circle ? null : BorderRadius.circular(radius),
      ),
    );
    return widthFactor == null ? box : FractionallySizedBox(widthFactor: widthFactor, alignment: Alignment.centerLeft, child: box);
  }
}

class _DashedPainter extends CustomPainter {
  _DashedPainter({required this.color, required this.radius, required this.strokeWidth});

  final Color color;
  final double radius;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth;
    final rect = (Offset.zero & size).deflate(strokeWidth / 2);
    final path = Path()..addRRect(RRect.fromRectAndRadius(rect, Radius.circular(radius)));
    final dash = strokeWidth * 2.5;
    final gap = strokeWidth * 2;
    for (final m in path.computeMetrics()) {
      var d = 0.0;
      while (d < m.length) {
        canvas.drawPath(m.extractPath(d, math.min(d + dash, m.length)), paint);
        d += dash + gap;
      }
    }
  }

  @override
  bool shouldRepaint(_DashedPainter old) => old.color != color || old.radius != radius || old.strokeWidth != strokeWidth;
}

/// A rounded box with a dashed outline (locked badges, empty wallet panel).
class DashedBox extends StatelessWidget {
  const DashedBox({
    super.key,
    required this.child,
    this.color = Kc.brown60,
    this.fill,
    this.radius = 20,
    this.strokeWidth = 3,
    this.padding = EdgeInsets.zero,
    this.alignment,
  });

  final Widget child;
  final Color color;
  final Color? fill;
  final double radius;
  final double strokeWidth;
  final EdgeInsets padding;
  final Alignment? alignment;

  @override
  Widget build(BuildContext context) => CustomPaint(
        foregroundPainter: _DashedPainter(color: color, radius: radius, strokeWidth: strokeWidth),
        child: Container(
          padding: padding,
          alignment: alignment,
          decoration: BoxDecoration(color: fill, borderRadius: BorderRadius.circular(radius)),
          child: child,
        ),
      );
}

Color avatarColor(String avatar) => switch (avatar) {
      'cub-friend-1' => Kc.yellow,
      'cub-friend-2' => Kc.orange,
      'cub-friend-3' => Kc.peach,
      'cub-friend-4' => Kc.brown80,
      'cub-friend-5' => Kc.gold,
      _ => Kc.peach,
    };

class AvatarCircle extends StatelessWidget {
  const AvatarCircle(this.avatar, {super.key, this.size = 84, this.border = 3});

  final String avatar;
  final double size;
  final double border;

  @override
  Widget build(BuildContext context) => FriendArt(avatar, size: size, border: border, fallback: avatarColor(avatar));
}

/// Horizontal bar; [fraction] is 0..1.
class KcBar extends StatelessWidget {
  const KcBar({super.key, required this.fraction, this.height = 14, this.color = Kc.orange});

  final double fraction;
  final double height;
  final Color color;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(Kc.rPill),
        child: Container(
          height: height,
          color: Kc.creamShade,
          alignment: Alignment.centerLeft,
          child: FractionallySizedBox(
            widthFactor: math.min(1.0, math.max(0.0, fraction)),
            child: Container(color: color),
          ),
        ),
      );
}

/// "Level 2 · Market Helper   60 of 300 XP" with its bar.
class LevelCard extends StatelessWidget {
  const LevelCard({super.key, required this.xp});

  final int xp;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: Kc.s4, vertical: 14),
        decoration: BoxDecoration(
          color: Kc.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Kc.brown, width: Kc.border),
        ),
        child: Column(
          spacing: 10,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(child: Text(levelLabel(xp), style: nunito(16, weight: 800))),
                const SizedBox(width: Kc.s2),
                Text('${xpIntoLevel(xp)} of $xpPerLevel XP', style: nunito(16, weight: 800, color: Kc.brown80)),
              ],
            ),
            KcBar(fraction: xpIntoLevel(xp) / xpPerLevel),
          ],
        ),
      );
}

/// The five skill bars. [compact] is the empty-state look (titled card, thinner bars).
class PillarCard extends StatelessWidget {
  const PillarCard({super.key, required this.percents, this.compact = false});

  final Map<Pillar, int> percents;
  final bool compact;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: Kc.s4, vertical: 14),
        decoration: BoxDecoration(
          color: Kc.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Kc.brown, width: Kc.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 12,
          children: [
            if (compact) Text('Skills', style: baloo(20)),
            for (final p in Pillar.values)
              Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 4,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(p.label, style: nunito(compact ? 15 : 16, weight: 800)),
                      Text('${percents[p] ?? 0}%', style: nunito(compact ? 15 : 16, weight: 800, color: compact ? Kc.brown80 : Kc.brown)),
                    ],
                  ),
                  KcBar(fraction: (percents[p] ?? 0) / 100, height: compact ? 12 : 14),
                ],
              ),
          ],
        ),
      );
}

/// Settings switch: 72 x 44, 48 dp tall hit area.
class KcSwitch extends StatelessWidget {
  const KcSwitch({super.key, required this.value, required this.onChanged, required this.label, this.enabled = true});

  final bool value;
  final ValueChanged<bool> onChanged;
  final String label;
  final bool enabled;

  @override
  Widget build(BuildContext context) => Semantics(
        toggled: value,
        enabled: enabled,
        label: '$label, ${value ? 'on' : 'off'}',
        excludeSemantics: true,
        onTap: enabled ? () => onChanged(!value) : null,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: enabled ? () => onChanged(!value) : null,
          child: Opacity(
            opacity: enabled ? 1 : .5,
            child: SizedBox(
              width: 72,
              height: Kc.touchMin,
              child: Center(
                child: Container(
                  width: 72,
                  height: 44,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  alignment: value ? Alignment.centerRight : Alignment.centerLeft,
                  decoration: BoxDecoration(
                    color: value ? Kc.yellow : Kc.creamShade,
                    borderRadius: BorderRadius.circular(Kc.rPill),
                    border: Border.all(color: Kc.brown, width: Kc.border),
                  ),
                  child: Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      color: value ? Kc.brown : Kc.white,
                      shape: BoxShape.circle,
                      border: value ? null : Border.all(color: Kc.brown, width: Kc.border),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );
}

/// Underlined text link with a 48 dp target.
class TextLink extends StatelessWidget {
  const TextLink(this.label, {super.key, required this.onTap, this.size = 18});

  final String label;
  final VoidCallback onTap;
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
            constraints: const BoxConstraints(minHeight: Kc.touchMin),
            alignment: Alignment.center,
            child: Text(label, style: nunito(size, weight: 800).copyWith(decoration: TextDecoration.underline)),
          ),
        ),
      );
}
