import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/router.dart';
import 'package:kudicubs/core/theme/theme.dart';

import 'support/fakes.dart';

void main() {
  testWidgets('skip on the sign-up email step leaves the email step', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final container = ProviderContainer(overrides: await fakeOverrides());
    addTearDown(container.dispose);
    final router = container.read(routerProvider);
    await tester.pumpWidget(UncontrolledProviderScope(
      container: container,
      child: MaterialApp.router(theme: AppTheme.light, routerConfig: router),
    ));
    router.go('/email');
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screen-au-05-email')), findsOneWidget);
    await tester.ensureVisible(find.byKey(const Key('skip-email')));
    await tester.tap(find.byKey(const Key('skip-email')));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screen-au-05-email')), findsNothing);
  });
}
