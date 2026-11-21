import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/data/models.dart';
import 'package:kudicubs/core/data/providers.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/screens/wallet_profile/app-14-wallet.dart';
import 'package:kudicubs/screens/wallet_profile/app-16-profile.dart';
import 'package:kudicubs/screens/wallet_profile/wallet_profile_logic.dart';

import 'support/fakes.dart';

class _Kids extends ChildrenNotifier {
  @override
  Future<List<Child>> build() async => [sampleChild];
}

WalletEvent _ev(WalletKind k, int n) =>
    WalletEvent(id: '${k.name}$n', childId: 'c1', kind: k, amount: n, createdAt: DateTime(2026, 11, 20));

void main() {
  group('balance derivation', () {
    test('coins, jar and xp come from the event log', () {
      final b = balancesFromEvents([
        _ev(WalletKind.earn, 100),
        _ev(WalletKind.bonus, 15),
        _ev(WalletKind.daily, 5),
        _ev(WalletKind.spend, 30),
        _ev(WalletKind.save, 40),
        _ev(WalletKind.xp, 350),
      ]);
      expect(b.coins, 50);
      expect(b.saved, 40);
      expect(b.xp, 350);
    });

    test('level is 1 + xp ~/ 300 and the bar restarts each level', () {
      expect(levelForXp(0), 1);
      expect(levelForXp(299), 1);
      expect(levelForXp(300), 2);
      expect(levelForXp(650), 3);
      expect(xpIntoLevel(650), 50);
      expect(levelLabel(360), 'Level 2 · Market Helper');
    });

    test('skills grow from finished missions only', () {
      Attempt a(String m, AttemptOutcome o) => Attempt(id: m + o.name, childId: 'c1', missionId: m, outcome: o, startedAt: DateTime(2026));
      final p = pillarPercents([
        a('m_4_6_lost_coins', AttemptOutcome.success),
        a('m_4_6_lost_coins', AttemptOutcome.success), // same mission twice counts once
        a('m_7_9_toy_shop', AttemptOutcome.gentle),
        a('m_7_9_lemonade', AttemptOutcome.retry), // not finished
      ]);
      expect(p[Pillar.know], 50);
      expect(p[Pillar.understand], 0);
    });

    test('history hides xp rows and names raw labels', () {
      final e = WalletEvent(id: 'x', childId: 'c1', kind: WalletKind.earn, amount: 5, label: 'history.market_walk', createdAt: DateTime(2026));
      expect(walletHistory([_ev(WalletKind.xp, 10), e]), [e]);
      expect(eventTitle(e), 'Market walk');
    });
  });

  group('cannot overspend', () {
    test('spend and save above the balance write nothing', () async {
      final wallet = FakeWallet(); // starts with 120 coins
      expect(await appendCoinsOut(wallet, childId: 'c1', kind: WalletKind.spend, amount: 121), WalletActionResult.insufficient);
      expect(await appendCoinsOut(wallet, childId: 'c1', kind: WalletKind.save, amount: 500), WalletActionResult.insufficient);
      expect(await appendCoinsOut(wallet, childId: 'c1', kind: WalletKind.spend, amount: 0), WalletActionResult.invalid);
      expect(wallet.log, isEmpty);
    });

    test('events are appended and the balance never goes below zero', () async {
      final wallet = FakeWallet();
      expect(await appendCoinsOut(wallet, childId: 'c1', kind: WalletKind.spend, amount: 20), WalletActionResult.done);
      expect(await appendCoinsOut(wallet, childId: 'c1', kind: WalletKind.save, amount: 100), WalletActionResult.done);
      var b = await wallet.balances('c1');
      expect((b.coins, b.saved), (0, 100));
      expect(await appendCoinsOut(wallet, childId: 'c1', kind: WalletKind.spend, amount: 1), WalletActionResult.insufficient);
      b = await wallet.balances('c1');
      expect(b.coins, 0);
      expect(wallet.log.map((e) => e.kind), [WalletKind.spend, WalletKind.save]); // append-only
    });
  });

  group('sound toggle', () {
    test('is on by default and persisted in shared_preferences', () async {
      final overrides = await fakeOverrides();
      final c1 = ProviderContainer(overrides: overrides);
      addTearDown(c1.dispose);
      expect(c1.read(soundOnProvider), isTrue);
      await c1.read(soundOnProvider.notifier).set(false);
      expect(c1.read(sharedPrefsProvider).getBool('sound'), isFalse);

      // A new session reads the saved value back.
      final c2 = ProviderContainer(overrides: await fakeOverrides(prefs: {'sound': false}));
      addTearDown(c2.dispose);
      expect(c2.read(soundOnProvider), isFalse);
    });

    testWidgets('the profile switch flips and saves it', (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final overrides = await fakeOverrides();
      final container = ProviderContainer(overrides: [...overrides, childrenProvider.overrideWith(_Kids.new)]);
      addTearDown(container.dispose);
      await tester.pumpWidget(UncontrolledProviderScope(
        container: container,
        child: MaterialApp(theme: AppTheme.light, home: Builder(builder: (c) => build_app_16_profile(c, ScreenState.normal))),
      ));
      await tester.pumpAndSettle();
      expect(find.text('Ama'), findsOneWidget);
      expect(find.text('Level 2 · Market Helper · Ages 4–6'), findsOneWidget);

      await tester.tap(find.byKey(const Key('toggle-sound')));
      await tester.pumpAndSettle();
      expect(container.read(soundOnProvider), isFalse);
      expect(container.read(sharedPrefsProvider).getBool('sound'), isFalse);
      expect(find.textContaining('captions on every screen'), findsOneWidget);
    });
  });

  testWidgets('wallet shows real balances, jar and history', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final container = ProviderContainer(overrides: [...await fakeOverrides(), childrenProvider.overrideWith(_Kids.new)]);
    addTearDown(container.dispose);
    await container.read(walletRepositoryProvider).addEvent(childId: 'c1', kind: WalletKind.earn, amount: 15, label: 'Tidy-up bonus');
    await tester.pumpWidget(UncontrolledProviderScope(
      container: container,
      child: MaterialApp(theme: AppTheme.light, home: Builder(builder: (c) => build_app_14_wallet(c, ScreenState.normal))),
    ));
    await tester.pumpAndSettle();
    expect(find.text('Coins to spend'), findsOneWidget);
    expect(find.text('135'), findsOneWidget); // 120 + 15
    expect(find.text('GH₵'), findsOneWidget);
    expect(find.text('Tidy-up bonus'), findsOneWidget);
    expect(find.text('+15'), findsOneWidget);
  });
}
