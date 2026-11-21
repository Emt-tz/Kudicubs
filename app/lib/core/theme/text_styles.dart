import 'package:flutter/material.dart';

import 'tokens.dart';

/// Baloo 2 (display) and Nunito (body) are bundled variable fonts; weight is
/// set through the `wght` axis so every weight 400-800 renders correctly.
abstract final class KcText {
  static TextStyle _s(String family, double size, int w, double h, [Color? c]) => TextStyle(
        fontFamily: family,
        fontSize: size,
        fontWeight: FontWeight.values[(w ~/ 100) - 1],
        fontVariations: [FontVariation('wght', w.toDouble())],
        height: h,
        color: c ?? Kc.brown,
      );

  static final displayXl = _s('Baloo2', 40, 800, 1.1);
  static final displayL = _s('Baloo2', 32, 800, 1.15);
  static final title = _s('Baloo2', 26, 700, 1.2);
  static final headline = _s('Baloo2', 28, 800, 1.1);
  static final button = _s('Baloo2', 26, 800, 1.1);
  static final buttonSmall = _s('Baloo2', 20, 700, 1.1);
  static final bodyChild = _s('Nunito', 20, 700, 1.35, Kc.brown80);
  static final body = _s('Nunito', 18, 400, 1.4);
  static final label = _s('Nunito', 16, 700, 1.3);
  static final caption = _s('Nunito', 14, 400, 1.35, Kc.brown80);
}
