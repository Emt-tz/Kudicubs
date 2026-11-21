import 'package:flutter/material.dart';

/// Brand colours, from docs/design/tokens.json. Text on yellow/orange is always [brown].
abstract final class Kc {
  // Brand
  static const yellow = Color(0xFFFBCE16); // Sunshine Yellow: main buttons
  static const brown = Color(0xFF3E2312); // Mane Brown: headings, borders
  static const cream = Color(0xFFFEF5E0); // Warm Cream: backgrounds
  static const orange = Color(0xFFF68C1F); // Adventure Orange: secondary buttons
  static const gold = Color(0xFFFBAA19); // Golden Orange: coins
  static const softGold = Color(0xFFFBE57E); // Kudi bubble, selected card
  static const peach = Color(0xFFFCE6C6); // Peach Cream: panels
  static const white = Color(0xFFFFFFFF);

  // Derived
  static const yellowPressed = Color(0xFFE4B916);
  static const orangePressed = Color(0xFFDA7C1D);
  static const goldPressed = Color(0xFFE49A18);
  static const brown80 = Color(0xFF644D3B); // secondary text
  static const brown60 = Color(0xFF8B7764); // locked / disabled (large only)
  static const creamShade = Color(0xFFF2E8D4); // trays
  static const peachShade = Color(0xFFEDD6B8);

  // Feedback. The brand has no error colour: errors use brown on a peach
  // banner; [error] is only for small icons/text on cream or white.
  static const success = Color(0xFF16793A);
  static const error = Color(0xFFB42318);

  // Spacing (px == dp) and radii
  static const s1 = 4.0, s2 = 8.0, s3 = 12.0, s4 = 16.0, s5 = 20.0, s6 = 24.0, s8 = 32.0;
  static const rSm = 8.0, rMd = 16.0, rLg = 24.0, rXl = 32.0, rPill = 999.0;

  // Sizes
  static const touchMin = 48.0;
  static const buttonHeight = 76.0; // 4-6 main button (design uses 76 everywhere)
  static const buttonHeightOlder = 64.0;
  static const border = 2.0;
  static const shadowDrop = 5.0;
}
