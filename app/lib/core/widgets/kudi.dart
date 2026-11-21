import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/theme.dart';
import '../narrator.dart';
import 'motion.dart';

/// Kudi the Cub poses available in assets/brand.
enum KudiPose { wave, celebrate, fist, headphones, thumbsUp }

/// Kudi the Cub, alive: he breathes, blinks, bounces in time with his voice, jumps with a
/// squash-and-stretch when he is happy (win poses, or when tapped) and looks around.
/// Built from the flat artwork, so the motion is whole-body plus eyelids, not a rigged skeleton.
class KudiImage extends StatefulWidget {
  const KudiImage(this.pose, {super.key, this.width = 220, this.alive = true});

  final KudiPose pose;
  final double width;
  final bool alive;

  static const _files = {
    KudiPose.wave: 'kudi-wave',
    KudiPose.celebrate: 'kudi-celebrate',
    KudiPose.fist: 'kudi-fist',
    KudiPose.headphones: 'kudi-headphones',
    KudiPose.thumbsUp: 'kudi-thumbs-up',
  };

  /// Eye centres as fractions of the picture (x, y), measured from the artwork.
  static const _eyes = {
    KudiPose.wave: [Offset(.386, .258), Offset(.568, .296)],
    KudiPose.celebrate: [Offset(.404, .262), Offset(.600, .294)],
    KudiPose.fist: [Offset(.338, .274), Offset(.542, .307)],
    KudiPose.headphones: [Offset(.387, .276), Offset(.574, .315)],
    KudiPose.thumbsUp: [Offset(.347, .277), Offset(.547, .326)],
  };

  static const _aspect = {
    KudiPose.wave: 610 / 640,
    KudiPose.celebrate: 597 / 640,
    KudiPose.fist: 560 / 640,
    KudiPose.headphones: 581 / 640,
    KudiPose.thumbsUp: 579 / 640,
  };

  @override
  State<KudiImage> createState() => _KudiImageState();
}

class _KudiImageState extends State<KudiImage> with TickerProviderStateMixin {
  late final AnimationController _breathe;
  late final AnimationController _blink;
  late final AnimationController _jump;
  late final AnimationController _talk;
  Timer? _blinkTimer;
  bool _live = false;

  bool get _happyPose => widget.pose == KudiPose.celebrate || widget.pose == KudiPose.fist || widget.pose == KudiPose.thumbsUp;

  @override
  void initState() {
    super.initState();
    _breathe = AnimationController(vsync: this, duration: const Duration(milliseconds: 2200));
    _blink = AnimationController(vsync: this, duration: const Duration(milliseconds: 130));
    _jump = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _talk = AnimationController(vsync: this, duration: const Duration(milliseconds: 260));
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_live && widget.alive && ambientMotion(context)) {
      _live = true;
      _breathe.repeat(reverse: true);
      _scheduleBlink();
      Narrator.instance.speaking.addListener(_onSpeaking);
      if (_happyPose) {
        Future.delayed(const Duration(milliseconds: 350), () {
          if (mounted) _hop();
        });
      }
    }
  }

  void _scheduleBlink() {
    _blinkTimer?.cancel();
    _blinkTimer = Timer(Duration(milliseconds: 1800 + math.Random().nextInt(3200)), () async {
      if (!mounted) return;
      await _blink.forward();
      if (!mounted) return;
      await _blink.reverse();
      // Sometimes a quick double blink, like a real one.
      if (mounted && math.Random().nextInt(4) == 0) {
        await _blink.forward();
        if (mounted) await _blink.reverse();
      }
      if (mounted) _scheduleBlink();
    });
  }

  void _onSpeaking() {
    if (!mounted) return;
    if (Narrator.instance.speaking.value) {
      _talk.repeat(reverse: true);
    } else {
      _talk.stop();
      _talk.value = 0;
    }
  }

  void _hop() {
    if (!mounted || _jump.isAnimating) return;
    _jump.forward(from: 0);
  }

  @override
  void dispose() {
    _blinkTimer?.cancel();
    if (_live) Narrator.instance.speaking.removeListener(_onSpeaking);
    _breathe.dispose();
    _blink.dispose();
    _jump.dispose();
    _talk.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final w = widget.width;
    final h = w / KudiImage._aspect[widget.pose]!;
    final image = Image.asset(
      'assets/brand/${KudiImage._files[widget.pose]}.webp',
      width: w,
      fit: BoxFit.contain,
      semanticLabel: 'Kudi the Cub',
      errorBuilder: (_, _, _) => SizedBox(width: w, height: w),
    );
    if (!widget.alive) return image;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _hop,
      child: AnimatedBuilder(
        animation: Listenable.merge([_breathe, _blink, _jump, _talk]),
        builder: (context, _) {
          // Breathing: a slow squash and stretch from the feet.
          final b = Curves.easeInOut.transform(_breathe.value);
          var sy = 1 + .022 * b;
          var sx = 1 - .012 * b;
          // Talking: quick small bounces while his voice plays.
          sy += .018 * _talk.value;
          // Jump: crouch, launch, stretch, land, settle.
          final j = _jump.value;
          var lift = 0.0;
          if (_jump.isAnimating || j > 0) {
            final air = math.sin(math.pi * ((j - .12) / .76).clamp(0.0, 1.0));
            lift = air * h * .14;
            final crouch = j < .12 ? j / .12 : (j > .88 ? (1 - j) / .12 : 0.0);
            sy *= 1 - .10 * (j < .12 ? crouch : 0) - .06 * (j > .88 ? crouch : 0) + .07 * air;
            sx *= 1 + .06 * crouch - .04 * air;
          }
          final tilt = math.sin(_breathe.value * math.pi) * .012 + (_jump.value > 0 ? math.sin(math.pi * _jump.value) * -.05 : 0);
          return SizedBox(
            width: w,
            height: h,
            child: Transform.translate(
              offset: Offset(0, -lift),
              child: Transform(
                alignment: Alignment.bottomCenter,
                transform: Matrix4.identity()
                  ..scaleByDouble(sx, sy, 1, 1)
                  ..rotateZ(tilt),
                child: Stack(
                  children: [
                    image,
                    if (_blink.value > 0)
                      Positioned.fill(
                        child: CustomPaint(painter: _EyelidPainter(KudiImage._eyes[widget.pose]!, _blink.value)),
                      ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Closes both eyes by covering them with fur-coloured lids and drawing a closed-eye line.
class _EyelidPainter extends CustomPainter {
  _EyelidPainter(this.eyes, this.amount);
  final List<Offset> eyes;
  final double amount;

  @override
  void paint(Canvas canvas, Size size) {
    final fur = Paint()..color = const Color(0xFFF9D708);
    final line = Paint()
      ..color = const Color(0xFF3D2314)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = size.width * .014;
    for (final e in eyes) {
      final c = Offset(e.dx * size.width, e.dy * size.height);
      final rx = size.width * .056;
      final ry = size.height * .052 * amount;
      canvas.drawOval(Rect.fromCenter(center: c, width: rx * 2, height: ry * 2), fur);
      if (amount > .6) {
        final path = Path()
          ..moveTo(c.dx - rx * .8, c.dy)
          ..quadraticBezierTo(c.dx, c.dy + size.height * .028, c.dx + rx * .8, c.dy);
        canvas.drawPath(path, line);
      }
    }
  }

  @override
  bool shouldRepaint(_EyelidPainter old) => old.amount != amount;
}

/// Where the logo will sit: on cream/white, yellow or brown.
enum LogoOn { white, yellow, brown }

class KudiLogo extends StatelessWidget {
  const KudiLogo({super.key, this.width = 210, this.on = LogoOn.white});

  final double width;
  final LogoOn on;

  @override
  Widget build(BuildContext context) => SvgPicture.asset(
        'assets/brand/logo-on-${on.name}.svg',
        width: width,
        semanticsLabel: 'KudiCubs',
      );
}

/// Text-only brand name, for screens where the mascot is already on show (so there is one lion, not two).
class KudiWordmark extends StatelessWidget {
  const KudiWordmark({super.key, this.size = 44, this.tagline = true});

  final double size;
  final bool tagline;

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text("Kudicub's", style: TextStyle(fontFamily: 'Baloo2', fontWeight: FontWeight.w800, fontSize: size, height: 1.1, color: Kc.brown)),
          if (tagline) Text('Play. Earn. Roar!', style: TextStyle(fontFamily: 'Baloo2', fontWeight: FontWeight.w700, fontSize: size * .38, color: Kc.orange)),
        ],
      );
}
