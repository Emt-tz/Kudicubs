import 'dart:io' show Platform;
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// Endless "alive" motion (bobbing mascot, pulsing buttons) is skipped under `flutter test`
/// (it would keep `pumpAndSettle` waiting forever) and for people who asked the phone to reduce motion.
final bool _inTest = Platform.environment.containsKey('FLUTTER_TEST');

bool ambientMotion(BuildContext context) => !_inTest && !MediaQuery.disableAnimationsOf(context);

/// Gentle up-and-down bob with a tiny tilt. Wrap a mascot or a coin.
class Floaty extends StatefulWidget {
  const Floaty({super.key, required this.child, this.amplitude = 7, this.period = const Duration(milliseconds: 2600)});

  final Widget child;
  final double amplitude;
  final Duration period;

  @override
  State<Floaty> createState() => _FloatyState();
}

class _FloatyState extends State<Floaty> with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: widget.period);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_started && ambientMotion(context)) {
      _started = true;
      _c.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_started) return widget.child;
    return AnimatedBuilder(
      animation: _c,
      child: widget.child,
      builder: (_, child) {
        final t = Curves.easeInOut.transform(_c.value);
        return Transform.translate(
          offset: Offset(0, -widget.amplitude * t),
          child: Transform.rotate(angle: (t - .5) * .04, child: child),
        );
      },
    );
  }
}

/// Soft breathing scale for the one button you want a child to press.
class Pulse extends StatefulWidget {
  const Pulse({super.key, required this.child, this.scale = 1.035});

  final Widget child;
  final double scale;

  @override
  State<Pulse> createState() => _PulseState();
}

class _PulseState extends State<Pulse> with SingleTickerProviderStateMixin {
  late final AnimationController _c;
  bool _started = false;

  @override
  void initState() {
    super.initState();
    _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 1300));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_started && ambientMotion(context)) {
      _started = true;
      _c.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_started) return widget.child;
    return AnimatedBuilder(
      animation: _c,
      child: widget.child,
      builder: (_, child) => Transform.scale(scale: 1 + (widget.scale - 1) * Curves.easeInOut.transform(_c.value), child: child),
    );
  }
}

/// One-time springy pop-in, optionally after [delay]. Used for rewards.
class PopIn extends StatefulWidget {
  const PopIn({super.key, required this.child, this.delay = Duration.zero, this.duration = const Duration(milliseconds: 750)});

  final Widget child;
  final Duration delay;
  final Duration duration;

  @override
  State<PopIn> createState() => _PopInState();
}

class _PopInState extends State<PopIn> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: widget.duration + widget.delay);

  @override
  void initState() {
    super.initState();
    _c.forward();
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final total = (widget.duration + widget.delay).inMilliseconds;
    final start = total == 0 ? 0.0 : widget.delay.inMilliseconds / total;
    final curve = CurvedAnimation(parent: _c, curve: Interval(start, 1, curve: Curves.elasticOut));
    return AnimatedBuilder(
      animation: curve,
      child: widget.child,
      builder: (_, child) => Opacity(
        opacity: (curve.value * 3).clamp(0.0, 1.0),
        child: Transform.scale(scale: curve.value.clamp(0.0, 1.4), child: child),
      ),
    );
  }
}

/// A burst of confetti and coins that falls once and fades. Put it behind a win screen's content.
class Confetti extends StatefulWidget {
  const Confetti({super.key, this.count = 46});

  final int count;

  @override
  State<Confetti> createState() => _ConfettiState();
}

class _ConfettiState extends State<Confetti> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 3200))..forward();
  late final List<_Piece> _pieces = _make(widget.count);

  static List<_Piece> _make(int n) {
    final r = math.Random(7);
    const colors = [Kc.orange, Kc.brown, Kc.cream, Kc.softGold, Kc.white];
    return List.generate(
      n,
      (i) => _Piece(
        x: r.nextDouble(),
        drift: (r.nextDouble() - .5) * .35,
        speed: .55 + r.nextDouble() * .6,
        size: 7 + r.nextDouble() * 9,
        spin: (r.nextDouble() - .5) * 12,
        color: colors[i % colors.length],
        coin: i % 6 == 0,
        delay: r.nextDouble() * .25,
      ),
    );
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => IgnorePointer(
        child: ExcludeSemantics(
          child: AnimatedBuilder(
            animation: _c,
            builder: (_, _) => CustomPaint(painter: _ConfettiPainter(_pieces, _c.value), size: Size.infinite),
          ),
        ),
      );
}

class _Piece {
  _Piece({required this.x, required this.drift, required this.speed, required this.size, required this.spin, required this.color, required this.coin, required this.delay});
  final double x, drift, speed, size, spin, delay;
  final Color color;
  final bool coin;
}

class _ConfettiPainter extends CustomPainter {
  _ConfettiPainter(this.pieces, this.t);
  final List<_Piece> pieces;
  final double t;

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in pieces) {
      final local = ((t - p.delay) / (1 - p.delay)).clamp(0.0, 1.0);
      if (local <= 0) continue;
      final y = -20 + (size.height + 40) * Curves.easeIn.transform(local) * p.speed;
      final x = size.width * (p.x + p.drift * local) + math.sin(local * 9 + p.x * 20) * 14;
      final fade = local > .8 ? (1 - local) / .2 : 1.0;
      final paint = Paint()..color = p.color.withValues(alpha: fade.clamp(0.0, 1.0));
      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(p.spin * local);
      if (p.coin) {
        canvas.drawCircle(Offset.zero, p.size * .8, Paint()..color = Kc.orange.withValues(alpha: fade.clamp(0.0, 1.0)));
        canvas.drawCircle(Offset.zero, p.size * .8, Paint()..color = Kc.brown.withValues(alpha: fade.clamp(0.0, 1.0))..style = PaintingStyle.stroke..strokeWidth = 2);
      } else {
        canvas.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset.zero, width: p.size, height: p.size * .5), const Radius.circular(2)), paint);
      }
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_ConfettiPainter old) => old.t != t;
}

/// Counts a whole number up to [value] the first time it shows (and whenever it grows).
class CountUp extends StatelessWidget {
  const CountUp({super.key, required this.value, required this.builder, this.duration = const Duration(milliseconds: 900)});

  final int value;
  final Widget Function(BuildContext, int) builder;
  final Duration duration;

  @override
  Widget build(BuildContext context) => !ambientMotion(context)
      ? builder(context, value)
      : TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: value.toDouble()),
        duration: duration,
        curve: Curves.easeOutCubic,
        builder: (c, v, _) => builder(c, v.round()),
      );
}
