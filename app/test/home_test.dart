import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/data/models.dart';
import 'package:kudicubs/core/data/providers.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/screens/home/home_logic.dart';
import 'package:kudicubs/screens/home/reward_coordinator.dart';
import 'package:kudicubs/screens/home/hm-07-daily-complete.dart';
import 'package:kudicubs/screens/registry.dart';
import 'package:kudicubs/screens/system/system_view.dart';

import 'support/fakes.dart';

Attempt _a(String id, String mission, AttemptOutcome o, DateTime at) =>
    Attempt(id: id, childId: 'c1', missionId: mission, outcome: o, startedAt: at, finishedAt: at);

void main() {
  test('level formula: level = 1 + xp ~/ 300', () {
    expect(levelForXp(0), 1);
    expect(levelForXp(299), 1);
    expect(levelForXp(300), 2);
    expect(levelForXp(599), 2);
    expect(levelForXp(600), 3);
    expect(levelForXp(-5), 1);
    expect(xpIntoLevel(450), 150);
    final info = LevelInfo(360);
    expect(info.level, 2);
    expect(info.nextAt, 600);
    expect(info.title, 'Market Helper');
  });

  test('state mapping for Home', () {
    HomeView v({bool l = false, bool f = false, bool n = false, ScreenState s = ScreenState.normal}) =>
        homeViewFor(loading: l, failed: f, noProgress: n, forced: s);
    expect(v(), HomeView.normal);
    expect(v(l: true), HomeView.loading);
    expect(v(f: true), HomeView.error);
    expect(v(n: true), HomeView.firstVisit);
    expect(v(s: ScreenState.empty), HomeView.firstVisit);
    expect(v(s: ScreenState.error), HomeView.error);
    expect(v(s: ScreenState.loading, f: true), HomeView.loading);
    expect(v(s: ScreenState.offline), HomeView.normal);
  });

  test('next mission and daily progress', () {
    final ms = [
      for (var i = 1; i <= 4; i++) Mission(id: 'm$i', ageBand: AgeBand.b4_6, world: 'w', title: 'M$i', position: i),
    ];
    final now = DateTime(2026, 11, 21, 12);
    final at = [
      _a('1', 'm1', AttemptOutcome.success, now),
      _a('2', 'm1', AttemptOutcome.gentle, now),
      _a('3', 'm2', AttemptOutcome.retry, now),
      _a('4', 'm3', AttemptOutcome.success, now.subtract(const Duration(days: 1))),
    ];
    expect(nextMission(ms, at)?.id, 'm2');
    expect(nextMission(ms, const []), ms.first);
    expect(nextMission(const [], at), isNull);
    expect(missionsDoneToday(at, now), ['m1']);
    expect(dailyClaimedToday([WalletEvent(id: 'e', childId: 'c1', kind: WalletKind.daily, amount: 10, createdAt: now)], now), isTrue);
    expect(dailyClaimedToday([WalletEvent(id: 'e', childId: 'c1', kind: WalletKind.earn, amount: 10, createdAt: now)], now), isFalse);
    expect(missionRouteFor(AgeBand.b10_12), '10-12');
  });

  testWidgets('idle hint turns on after 8 s and resets on touch', (tester) async {
    expect(idleHintDelay, const Duration(seconds: 8));
    await tester.pumpWidget(MaterialApp(
      home: IdleHintDetector(
        child: const SizedBox.shrink(),
        builder: (c, on, child) => Text(on ? 'hint' : 'quiet'),
      ),
    ));
    await tester.pump(const Duration(seconds: 7));
    expect(find.text('quiet'), findsOneWidget);
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('hint'), findsOneWidget);
    await tester.tap(find.text('hint'));
    await tester.pump();
    expect(find.text('quiet'), findsOneWidget);
    await tester.pump(const Duration(seconds: 7));
    expect(find.text('quiet'), findsOneWidget);
    await tester.pump(const Duration(seconds: 2));
    expect(find.text('hint'), findsOneWidget);
  });

  testWidgets('showRewards writes events, then shows reward, level-up and badge in order', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final overrides = await fakeOverrides();
    late BuildContext ctx;
    await tester.pumpWidget(ProviderScope(
      overrides: overrides,
      child: MaterialApp(theme: AppTheme.light, home: Builder(builder: (c) {
        ctx = c;
        return const Scaffold(body: Text('mission'));
      })),
    ));
    // Fake balances start at 360 XP; +300 crosses 600 (level 2 -> 3).
    final done = showRewards(ctx, childId: 'c1', coins: 30, xp: 300, badgeId: 'badge.kind_friend');
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screen-app-09-reward')), findsOneWidget);
    expect(find.text('+30'), findsOneWidget);
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screen-ms-20-level-up')), findsOneWidget);
    expect(find.text('Level 3'), findsOneWidget);
    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('screen-ms-21-badge-earned')), findsOneWidget);
    expect(find.text('Kind friend'), findsOneWidget);
    await tester.tap(find.text('Add to my badges'));
    await tester.pumpAndSettle();
    await done;
    expect(find.text('mission'), findsOneWidget);
  });

  testWidgets('confirmLeaveMission returns true on Leave and false on Keep playing', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    late BuildContext ctx;
    await tester.pumpWidget(MaterialApp(theme: AppTheme.light, home: Builder(builder: (c) {
      ctx = c;
      return const SizedBox();
    })));
    var f = confirmLeaveMission(ctx);
    await tester.pumpAndSettle();
    expect(find.text('Leave this mission?'), findsOneWidget);
    await tester.tap(find.text('Leave'));
    await tester.pumpAndSettle();
    expect(await f, isTrue);
    f = confirmLeaveMission(ctx);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Keep playing'));
    await tester.pumpAndSettle();
    expect(await f, isFalse);
  });

  testWidgets('daily complete writes the +10 bonus only once per day', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final overrides = await fakeOverrides();
    final container = ProviderContainer(overrides: [...overrides, currentChildProvider.overrideWithValue(const AsyncData(sampleChild))]);
    addTearDown(container.dispose);
    final wallet = container.read(walletRepositoryProvider) as FakeWallet;
    // Three finished missions today.
    final attempts = container.read(attemptsRepositoryProvider) as FakeAttempts;
    for (var i = 1; i <= 3; i++) {
      attempts.log.add(_a('a$i', 'm$i', AttemptOutcome.success, DateTime.now()));
    }
    for (var round = 0; round < 2; round++) {
      await tester.pumpWidget(UncontrolledProviderScope(
        container: container,
        child: MaterialApp(theme: AppTheme.light, home: Builder(builder: (c) => build_hm_07_daily_complete(c, ScreenState.normal))),
      ));
      await tester.pumpAndSettle();
    }
    expect(find.text('Market day complete'), findsOneWidget);
    expect(wallet.log.where((e) => e.kind == WalletKind.daily).length, 1);
  });

  test('support reference looks like KC-XXXX-NN', () {
    expect(supportReference(DateTime(2026, 11, 21)), matches(RegExp(r'^KC-[0-9A-F]{4}-\d{2}$')));
  });

  testWidgets('all home and system screens render in every state', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final overrides = [...await fakeOverrides(), currentChildProvider.overrideWithValue(const AsyncData(sampleChild))];
    final ids = registry.keys.where((k) =>
        RegExp(r'^(app-05|app-09|hm-|ms-2[0-2]|sy-)').hasMatch(k));
    expect(ids.length, 18);
    for (final id in ids) {
      for (final state in ScreenState.values) {
        await tester.pumpWidget(ProviderScope(
          overrides: overrides,
          child: MaterialApp(theme: AppTheme.light, home: Builder(builder: (c) => registry[id]!(c, state))),
        ));
        await tester.pump();
        expect(find.byKey(Key('screen-$id')), findsOneWidget, reason: '$id / ${state.name}');
        expect(tester.takeException(), isNull, reason: '$id / ${state.name}');
      }
    }
    await tester.pumpWidget(const SizedBox());
  });
}
