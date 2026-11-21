import 'dart:math' as math;
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';

/// Where the moving parts of one pose sit, as fractions of the picture (x, y).
class KudiRig {
  const KudiRig({
    required this.shoulder,
    required this.hand,
    required this.tailBase,
    required this.tailTip,
    required this.eyes,
    this.wave = false,
  });

  final Offset shoulder;
  final Offset hand;
  final Offset tailBase;
  final Offset tailTip;
  final List<Offset> eyes;

  /// The raised arm waves on its own (greeting pose).
  final bool wave;
}

/// What the character is doing this frame.
class KudiMotion {
  const KudiMotion({
    required this.seconds,
    this.blink = 0,
    this.talk = 0,
    this.hop = 0,
  });

  final double seconds;
  final double blink; // 0 open .. 1 shut
  final double talk; // 0..1 while his voice plays
  final double hop; // 0..1 across a jump
}

double _smooth(double a, double b, double x) {
  final t = ((x - a) / (b - a)).clamp(0.0, 1.0);
  return t * t * (3 - 2 * t);
}

/// Draws the artwork as a grid of triangles that are bent a little each frame:
/// the raised arm swings from the shoulder, the tail sways, and a blink squashes the real eyes shut.
/// No layers or ghosting: the picture itself is warped.
class KudiMeshPainter extends CustomPainter {
  KudiMeshPainter({
    required this.image,
    required this.rig,
    required this.motion,
    required this.aspect,
  });

  final ui.Image image;
  final KudiRig rig;
  final KudiMotion motion;
  final double aspect; // picture width / height

  static const _margin = .035;
  static const _cols = 26;
  static const _rows = 28;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width, h = size.height;
    final iw = image.width.toDouble(), ih = image.height.toDouble();
    final pos = Float32List((_cols + 1) * (_rows + 1) * 2);
    final tex = Float32List(pos.length);
    final t = motion.seconds;

    // Arm angle: the greeting pose waves, others only sway a little; he gestures more while talking or hopping.
    final gesture = (1 + motion.talk * .35 + motion.hop * .45).clamp(1.0, 1.5);
    final armAngle = (rig.wave ? .06 * math.sin(t * 2 * math.pi / 1.25) + .018 * math.sin(t * 2.7) : .022 * math.sin(t * 2 * math.pi / 2.4)) * gesture;
    final tailAngle =
        .13 * math.sin(t * 2 * math.pi / 1.7 + .6) + .05 * math.sin(t * 3.1);

    Offset toPx(Offset f) => Offset((_margin + f.dx * (1 - 2 * _margin)) * w, f.dy * h);
    final sh = toPx(rig.shoulder),
        hd = toPx(rig.hand),
        tb = toPx(rig.tailBase),
        tt = toPx(rig.tailTip);
    final armLen = (hd - sh).distance;
    final tailLen = (tt - tb).distance;

    var i = 0;
    for (var r = 0; r <= _rows; r++) {
      for (var c = 0; c <= _cols; c++) {
        final u = c / _cols, v = r / _rows;
        var p = Offset((_margin + u * (1 - 2 * _margin)) * w, v * h);
        tex[i] = u * iw;
        tex[i + 1] = v * ih;

        // Raised arm: rotate about the shoulder, more the nearer the hand.
        final ad = _segment(p, sh, hd);
        // Near the hand the pull reaches further and is full strength, so the hand and coin turn as one piece.
        final grip = _smooth(.5, 1, ad.t);
        final aw =
            (1 - _smooth(.05 * w * (1 + .5 * grip), .12 * w * (1 + .2 * grip), ad.dist)) *
            _smooth(.04, .65, ad.t);
        if (aw > 0) {
          p = _rotate(p, sh, armAngle * aw);
        }

        // Tail: rotate about its base, more toward the tip.
        final td = _segment(p, tb, tt);
        final tw =
            (1 - _smooth(.05 * w, .14 * w, td.dist)) * _smooth(.1, .9, td.t);
        if (tw > 0) {
          p = _rotate(
            p,
            tb,
            tailAngle *
                tw *
                (tailLen / (armLen == 0 ? 1 : armLen)).clamp(.5, 1.2),
          );
        }

        pos[i] = p.dx;
        pos[i + 1] = p.dy;
        i += 2;
      }
    }

    final idx = <int>[];
    for (var r = 0; r < _rows; r++) {
      for (var c = 0; c < _cols; c++) {
        final a = r * (_cols + 1) + c, b = a + 1, d = a + _cols + 1, e = d + 1;
        idx.addAll([a, b, d, b, e, d]);
      }
    }
    final paint = Paint()
      ..filterQuality = FilterQuality.high
      ..shader = ui.ImageShader(
        image,
        TileMode.clamp,
        TileMode.clamp,
        Matrix4.identity().storage,
      );
    canvas.drawVertices(
      ui.Vertices.raw(
        VertexMode.triangles,
        pos,
        textureCoordinates: tex,
        indices: Uint16List.fromList(idx),
      ),
      BlendMode.srcOver,
      paint,
    );

    // Blink: a fur-coloured lid comes down over each real eye, ending in a closed-eye line.
    if (motion.blink > .02) {
      final fur = Paint()..color = const Color(0xFFF9D708);
      final line = Paint()
        ..color = const Color(0xFF3D2314)
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = w * .013;
      for (final e in rig.eyes) {
        final c = toPx(e);
        final rx = w * .048 * (1 - 2 * _margin), ry = h * .05;
        final top = c.dy - ry;
        final bottom = top + 2 * ry * motion.blink;
        canvas.drawRRect(RRect.fromLTRBR(c.dx - rx, top - 1, c.dx + rx, bottom, Radius.circular(rx * .9)), fur);
        if (motion.blink > .75) {
          final y = c.dy + ry * .05;
          canvas.drawPath(
            Path()
              ..moveTo(c.dx - rx * .85, y - ry * .08)
              ..quadraticBezierTo(c.dx, y + ry * .3, c.dx + rx * .85, y - ry * .08),
            line,
          );
        }
      }
    }
  }

  ({double dist, double t}) _segment(Offset p, Offset a, Offset b) {
    final ab = b - a;
    final len2 = ab.dx * ab.dx + ab.dy * ab.dy;
    if (len2 == 0) return (dist: (p - a).distance, t: 0);
    final t = (((p - a).dx * ab.dx + (p - a).dy * ab.dy) / len2).clamp(
      0.0,
      1.0,
    );
    return (dist: (p - (a + ab * t)).distance, t: t);
  }

  Offset _rotate(Offset p, Offset pivot, double ang) {
    final d = p - pivot;
    final c = math.cos(ang), s = math.sin(ang);
    return pivot + Offset(d.dx * c - d.dy * s, d.dx * s + d.dy * c);
  }

  @override
  bool shouldRepaint(KudiMeshPainter old) =>
      old.motion.seconds != motion.seconds ||
      old.motion.blink != motion.blink ||
      old.image != image;
}
