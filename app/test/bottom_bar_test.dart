import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/screens/registry.dart';

import 'support/fakes.dart';

void main() {
  // On a phone with a home indicator the bar must paint to the very bottom edge.
  for (final id in ['app-14-wallet', 'app-15-progress']) {
    testWidgets('$id: bottom bar reaches the screen edge', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      tester.view.padding = const FakeViewPadding(bottom: 34, top: 47);
      tester.view.viewPadding = const FakeViewPadding(bottom: 34, top: 47);
      addTearDown(tester.view.reset);
      await tester.pumpWidget(ProviderScope(
        overrides: await fakeOverrides(),
        child: MaterialApp(theme: AppTheme.light, home: Builder(builder: (c) => registry[id]!(c, ScreenState.normal))),
      ));
      await tester.pumpAndSettle();
      final bar = find.byWidgetPredicate((w) => w is Container && w.decoration is BoxDecoration && (w.decoration as BoxDecoration).color == Kc.white && (w.decoration as BoxDecoration).border != null);
      expect(bar, findsWidgets);
      final bottom = tester.getBottomLeft(bar.last).dy;
      expect(bottom, 844, reason: 'bar ends at $bottom, screen is 844');
    });
  }
}
