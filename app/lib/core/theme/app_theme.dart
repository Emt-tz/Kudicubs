import 'package:flutter/material.dart';

import 'text_styles.dart';
import 'tokens.dart';

abstract final class AppTheme {
  static ThemeData get light {
    final scheme = ColorScheme.fromSeed(seedColor: Kc.yellow, brightness: Brightness.light).copyWith(
      primary: Kc.yellow,
      onPrimary: Kc.brown,
      secondary: Kc.orange,
      onSecondary: Kc.brown,
      surface: Kc.cream,
      onSurface: Kc.brown,
      error: Kc.error,
      outline: Kc.brown,
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: Kc.cream,
      fontFamily: 'Nunito',
      textTheme: TextTheme(
        displayLarge: KcText.displayXl,
        displayMedium: KcText.displayL,
        headlineMedium: KcText.headline,
        titleLarge: KcText.title,
        bodyLarge: KcText.bodyChild,
        bodyMedium: KcText.body,
        labelLarge: KcText.label,
        bodySmall: KcText.caption,
      ),
      appBarTheme: const AppBarTheme(backgroundColor: Kc.cream, foregroundColor: Kc.brown, elevation: 0),
      dividerColor: Kc.creamShade,
      splashFactory: InkRipple.splashFactory,
    );
  }
}
