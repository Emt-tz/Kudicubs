import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:kudicubs/core/band_rules.dart';
import 'package:kudicubs/core/data/models.dart';
import 'package:kudicubs/core/data/providers.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/screens/missions_7_9/app-10-band-7-9.dart';
import 'package:kudicubs/screens/missions_7_9/content.dart';
import 'package:kudicubs/screens/missions_7_9/logic.dart';
import 'package:kudicubs/screens/missions_7_9/ms-10-7-9-intro.dart';
import 'package:kudicubs/screens/missions_7_9/ms-12-7-9-result-retry.dart';
import 'package:kudicubs/screens/missions_7_9/ms-14-7-9-saving-error.dart';

import 'support/fakes.dart';

/// Attempts that only reach the "server" after [flush]: models a failed write that stays on the device.
class _OfflineAttempts extends FakeAttempts {
  bool online = false;
  int queued = 0;

  @override
  int get pending => queued;

  @override
  Future<({Attempt attempt, bool queued})> record({
    required String childId,
    required String missionId,
    required AttemptOutcome outcome,
    DateTime? startedAt,
  }) async {
    final r = await super.record(
      childId: childId,
      missionId: missionId,
      outcome: outcome,
      startedAt: startedAt,
    );
    if (online) return r;
    queued++;
    return (attempt: r.attempt, queued: true);
  }

  @override
  Future<int> flush() async {
    if (!online) return 0;
    final n = queued;
    queued = 0;
    return n;
  }
}

class Rig {
  Rig(this.overrides, this.wallet, this.attempts);
  final List<Override> overrides;
  final FakeWallet wallet;
  final FakeAttempts attempts;
}

/// In-memory repositories (same as `fakeOverrides`) with the wallet and attempts kept for assertions.
Future<Rig> rig({
  FakeAttempts? attempts,
  List<Attempt> history = const [],
}) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  final wallet = FakeWallet();
  final att = attempts ?? FakeAttempts();
  att.log.addAll(history);
  return Rig(
    [
      sharedPrefsProvider.overrideWithValue(prefs),
      authRepositoryProvider.overrideWithValue(FakeAuth()),
      childrenRepositoryProvider.overrideWithValue(FakeChildren()),
      walletRepositoryProvider.overrideWithValue(wallet),
      attemptsRepositoryProvider.overrideWithValue(att),
      badgesRepositoryProvider.overrideWithValue(FakeBadges()),
      missionsRepositoryProvider.overrideWithValue(FakeMissions()),
      parentRepositoryProvider.overrideWithValue(FakeParent()),
      currentChildProvider.overrideWithValue(
        const AsyncData<Child?>(sampleChild),
      ),
    ],
    wallet,
    att,
  );
}

Future<void> mount(
  WidgetTester tester,
  Rig r,
  Widget Function(BuildContext) build,
) async {
  // Tall surface: the test font is wider than Baloo/Nunito, so cards wrap and the list needs room.
  tester.view.physicalSize = const Size(390, 1500);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      key: UniqueKey(),
      overrides: r.overrides,
      child: MaterialApp(
        theme: AppTheme.light,
        home: Builder(builder: build),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
}

Future<void> tapText(WidgetTester tester, String text) async {
  await tester.ensureVisible(find.text(text));
  await tester.tap(find.text(text));
  await tester.pump();
}

Future<void> tapKey(WidgetTester tester, String key) async {
  await tester.ensureVisible(find.byKey(ValueKey(key)));
  await tester.tap(find.byKey(ValueKey(key)));
  await tester.pump();
}

int coinsAfter(Iterable<WalletEvent> log, {int start = 120}) =>
    log.fold<Balances>(Balances(coins: start), (b, e) => b.apply(e)).coins;

/// Over-budget plan: all four items (65 of 50).
Future<void> overBudget(WidgetTester tester) async {
  await tapText(tester, 'Start planning');
  expect(find.byKey(const Key('screen-app-10-band-7-9')), findsOneWidget);
  for (final i in partyItems) {
    await tapKey(tester, 'item-${i.id}');
  }
  await tapText(tester, 'Confirm my party');
}

void main() {
  group('rules (pure)', () {
    test(
      'an over-budget plan offers retry, keeps the picks and never touches balances',
      () {
        expect(showsFailureScreen(AgeBand.b7_9), isTrue);
        expect(offersRetry(AgeBand.b7_9), isTrue);
        expect(losesProgressOnFailure(AgeBand.b7_9), isFalse);
        expect(failurePenalty(AgeBand.b7_9), 0);
        final m = PartyMachine()..begin();
        for (final i in partyItems) {
          m.toggle(i.id);
        }
        expect(m.total, 65);
        expect(m.confirm(), isFalse);
        expect(m.phase, Phase79.retry);
        expect(m.overBy, 15);
        expect(m.outcome, AttemptOutcome.retry);
        m.tryAgain();
        expect(m.phase, Phase79.decision);
        expect(m.selected, hasLength(4)); // swap one item, nothing is lost
        m.toggle('speaker');
        expect(m.confirm(), isTrue);
        expect(m.phase, Phase79.success);
        expect(m.left, 5);
        expect(m.outcome, AttemptOutcome.success);
        expect(m.tries, 2);
        expect(m.reward.coins, partyCoins);
        expect(m.reward.badgeId, partyBadgeId);
      },
    );

    test(
      'every combination of items ends in success or a retry, and every reward is non-negative',
      () {
        for (var mask = 1; mask < 16; mask++) {
          final m = PartyMachine()..begin();
          for (var b = 0; b < partyItems.length; b++) {
            if (mask & (1 << b) != 0) m.toggle(partyItems[b].id);
          }
          final ok = m.confirm();
          expect(m.phase, ok ? Phase79.success : Phase79.retry);
          expect(m.outcome, ok ? AttemptOutcome.success : AttemptOutcome.retry);
          if (!ok) {
            m.keepResult();
            expect(m.phase, Phase79.summary);
          }
          expect(m.reward.coins, greaterThanOrEqualTo(0));
          expect(m.reward.xp, greaterThan(0));
        }
      },
    );

    test('a replay pays XP only', () {
      final m = PartyMachine(replay: true);
      expect(m.reward.coins, 0);
      expect(m.reward.xp, partyReplayXp);
    });
  });

  group('screens', () {
    testWidgets(
      'over budget: try-again result, everything safe, then success keeps the whole reward',
      (tester) async {
        final r = await rig();
        await mount(
          tester,
          r,
          (c) => build_ms_10_7_9_intro(c, ScreenState.normal),
        );
        expect(find.byKey(const Key('screen-ms-10-7-9-intro')), findsOneWidget);
        expect(find.text('Your budget'), findsOneWidget);
        await overBudget(tester);

        expect(
          find.byKey(const Key('screen-ms-12-7-9-result-retry')),
          findsOneWidget,
        );
        expect(find.text('Here is what happened'), findsOneWidget);
        expect(
          find.text(
            'Your list came to GH₵ 65. That is GH₵ 15 more than your budget.',
          ),
          findsOneWidget,
        );
        expect(
          find.text('Your coins, XP and badges are safe.'),
          findsOneWidget,
        );
        expect(find.text('Try again'), findsOneWidget);
        // logged as a retry; nothing was written to the wallet, so no balance can have dropped
        expect(r.attempts.log.map((a) => a.outcome), [AttemptOutcome.retry]);
        expect(r.wallet.log, isEmpty);

        await tapText(tester, 'Try again');
        expect(find.byKey(const Key('screen-app-10-band-7-9')), findsOneWidget);
        await tapKey(tester, 'item-speaker'); // swap the speaker out
        await tapText(tester, 'Confirm my party');
        expect(
          find.byKey(const Key('screen-ms-11-7-9-result-success')),
          findsOneWidget,
        );
        expect(find.text('Party planned!'), findsOneWidget);
        expect(
          find.text(
            'Everyone had cake, balloons and games, and you stayed in budget.',
          ),
          findsOneWidget,
        );
        await tapText(tester, 'Continue');
        expect(
          find.byKey(const Key('screen-ms-13-7-9-summary')),
          findsOneWidget,
        );
        expect(find.text('Tries'), findsOneWidget);
        expect(find.text('2'), findsOneWidget);

        await tapText(tester, 'Collect my reward');
        await tester.pump();
        await tester.pump();
        expect(r.attempts.log.map((a) => a.outcome), [
          AttemptOutcome.retry,
          AttemptOutcome.success,
        ]);
        var running = 120;
        for (final e in r.wallet.log) {
          running = Balances(coins: running).apply(e).coins;
          expect(running, greaterThanOrEqualTo(120));
        }
        expect(
          r.wallet.log.any(
            (e) => e.kind == WalletKind.earn && e.amount == partyCoins,
          ),
          isTrue,
        );
        expect(
          r.wallet.log.any(
            (e) => e.kind == WalletKind.xp && e.amount == partyXp,
          ),
          isTrue,
        );
        await tester.pumpWidget(const SizedBox());
      },
    );

    testWidgets(
      '"Keep this result" ends the mission gently: XP only, balances never drop',
      (tester) async {
        final r = await rig();
        await mount(
          tester,
          r,
          (c) => build_ms_10_7_9_intro(c, ScreenState.normal),
        );
        await overBudget(tester);
        await tapText(tester, 'Keep this result');
        expect(
          find.byKey(const Key('screen-ms-13-7-9-summary')),
          findsOneWidget,
        );
        expect(find.text('Over budget by'), findsOneWidget);
        await tapText(tester, 'Collect my reward');
        await tester.pump();
        await tester.pump();
        expect(r.attempts.log.map((a) => a.outcome), [AttemptOutcome.retry]);
        expect(
          r.wallet.log.every((e) => e.kind == WalletKind.xp && e.amount > 0),
          isTrue,
        );
        expect(coinsAfter(r.wallet.log), 120);
        await tester.pumpWidget(const SizedBox());
      },
    );

    testWidgets(
      'a write that fails shows the designed error; progress stays on the device and Try again saves it',
      (tester) async {
        final flaky = _OfflineAttempts();
        final r = await rig(attempts: flaky);
        await mount(
          tester,
          r,
          (c) => build_ms_10_7_9_intro(c, ScreenState.normal),
        );
        await tapText(tester, 'Start planning');
        for (final id in ['cake', 'balloons', 'games']) {
          await tapKey(tester, 'item-$id');
        }
        await tapText(tester, 'Confirm my party');
        await tapText(tester, 'Continue');
        await tapText(tester, 'Collect my reward');
        await tester.pump();
        await tester.pump();
        expect(
          find.byKey(const Key('screen-ms-14-7-9-saving-error')),
          findsOneWidget,
        );
        expect(find.text('We could not save your result.'), findsOneWidget);
        expect(
          find.text(
            'Nothing is lost. Your $partyCoins coins and $partyXp XP are waiting.',
          ),
          findsOneWidget,
        );
        expect(flaky.log, hasLength(1)); // queued on the device
        expect(r.wallet.log, isEmpty);
        flaky.online = true;
        await tapText(tester, 'Try again');
        await tester.pump();
        await tester.pump();
        expect(
          find.byKey(const Key('screen-ms-14-7-9-saving-error')),
          findsNothing,
        );
        expect(flaky.queued, 0);
        expect(flaky.log, hasLength(1));
        expect(r.wallet.log.any((e) => e.kind == WalletKind.xp), isTrue);
        await tester.pumpWidget(const SizedBox());
      },
    );

    testWidgets(
      '"Back to home" on the saving error keeps the rewards on the device',
      (tester) async {
        final r = await rig(attempts: _OfflineAttempts());
        await mount(
          tester,
          r,
          (c) => build_ms_10_7_9_intro(c, ScreenState.normal),
        );
        await tapText(tester, 'Start planning');
        await tapKey(tester, 'item-cake');
        await tapText(tester, 'Confirm my party');
        await tapText(tester, 'Continue');
        await tapText(tester, 'Collect my reward');
        await tester.pump();
        await tester.pump();
        await tapText(tester, 'Back to home');
        await tester.pump();
        expect(
          r.wallet.log.where((e) => e.kind == WalletKind.xp),
          hasLength(1),
        );
        expect(coinsAfter(r.wallet.log), greaterThanOrEqualTo(120));
        await tester.pumpWidget(const SizedBox());
      },
    );

    testWidgets('designed variants open directly in every state', (
      tester,
    ) async {
      final r = await rig();
      for (final state in ScreenState.values) {
        await mount(tester, r, (c) => build_app_10_band_7_9(c, state));
        expect(
          find.byKey(const Key('screen-app-10-band-7-9')),
          findsOneWidget,
          reason: state.name,
        );
        await mount(tester, r, (c) => build_ms_12_7_9_result_retry(c, state));
        expect(
          find.byKey(const Key('screen-ms-12-7-9-result-retry')),
          findsOneWidget,
          reason: state.name,
        );
        await mount(tester, r, (c) => build_ms_14_7_9_saving_error(c, state));
        expect(
          find.byKey(const Key('screen-ms-14-7-9-saving-error')),
          findsOneWidget,
          reason: state.name,
        );
      }
      await tester.pumpWidget(const SizedBox());
    });
  });
}
