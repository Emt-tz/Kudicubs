import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/data/providers.dart';
import 'package:kudicubs/core/router.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/screens/registry.dart';

import 'support/fakes.dart';

void main() {
  testWidgets('every screen renders in every state at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final overrides = await fakeOverrides();
    expect(registry.length, 108);

    for (final entry in registry.entries) {
      for (final state in ScreenState.values) {
        await tester.pumpWidget(ProviderScope(
          overrides: overrides,
          child: MaterialApp(theme: AppTheme.light, home: Builder(builder: (c) => entry.value(c, state))),
        ));
        expect(find.byKey(Key('screen-${entry.key}')), findsOneWidget, reason: '${entry.key} / ${state.name}');
        expect(tester.takeException(), isNull, reason: '${entry.key} / ${state.name}');
      }
    }
  });

  testWidgets('router: gallery route, index page and guards', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final overrides = await fakeOverrides();
    final container = ProviderContainer(overrides: overrides);
    addTearDown(container.dispose);
    final router = container.read(routerProvider);
    await tester.pumpWidget(UncontrolledProviderScope(
      container: container,
      child: MaterialApp.router(theme: AppTheme.light, routerConfig: router),
    ));

    router.go('/screen/app-14-wallet?state=loading');
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screen-app-14-wallet')), findsOneWidget);

    router.go('/screens');
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screens-index')), findsOneWidget);

    router.go('/wallet'); // not onboarded -> welcome
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screen-Main')), findsOneWidget);

    await container.read(onboardedProvider.notifier).set(true);
    router.go('/wallet');
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screen-app-14-wallet')), findsOneWidget);

    router.go('/parent'); // needs gate + PIN
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screen-app-04-gate')), findsOneWidget);
    expect(router.state.uri.queryParameters['next'], '/parent');
  });

  test('redirect rules', () {
    String? r(String p, {bool onboarded = true, bool unlocked = false, SystemStatus s = SystemStatus.ok, bool online = true}) =>
        redirectFor(uri: Uri.parse(p), onboarded: onboarded, parentUnlocked: unlocked, status: s, online: online);
    expect(r('/home', onboarded: false), '/welcome');
    expect(r('/age', onboarded: false), isNull);
    expect(r('/home', s: SystemStatus.maintenance), '/system/maintenance');
    expect(r('/system/maintenance', s: SystemStatus.maintenance), isNull);
    expect(r('/signin', online: false), '/system/no-connection');
    expect(r('/home', online: false), isNull); // gameplay works offline
    expect(r('/parent/settings', unlocked: true), isNull);
    expect(r('/parent/settings'), startsWith('/gate?next='));
  });
}
