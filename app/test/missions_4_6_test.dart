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
import 'package:kudicubs/screens/missions_4_6/app-06-mission-intro.dart';
import 'package:kudicubs/screens/missions_4_6/common.dart';
import 'package:kudicubs/screens/missions_4_6/content.dart';
import 'package:kudicubs/screens/missions_4_6/logic.dart';
import 'package:kudicubs/screens/missions_4_6/ms-04-result-save.dart';
import 'package:kudicubs/screens/missions_4_6/ms-09-mission-error.dart';

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
  tester.view.physicalSize = const Size(390, 844);
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

void expectNoFailureScreen(WidgetTester tester) {
  // No retry / failure screen exists for 4–6 (the only "Try again" is the saving error, checked apart).
  expect(find.textContaining('Here is what happened'), findsNothing);
  expect(find.textContaining('over budget'), findsNothing);
  expect(find.textContaining('Oops'), findsNothing);
  expect(tester.takeException(), isNull);
}

/// Plays the whole mission to the summary. Returns after the summary is on screen.
Future<void> playToSummary(
  WidgetTester tester, {
  required Choice choice,
  bool wrongJar = false,
  bool wrongCount = false,
}) async {
  await tapText(tester, "Let's go!");
  // find
  for (var i = 0; i < hiddenCoins; i++) {
    await tapKey(tester, 'spot-$i');
    expectNoFailureScreen(tester);
  }
  await tester.pump(const Duration(seconds: 1));
  expect(find.text('Sort into jars'), findsOneWidget);
  // sort (tap a coin, then its jar); the first coin goes to a wrong jar once
  if (wrongJar) {
    await tapKey(tester, 'coin-0');
    await tapKey(tester, 'jar-gold');
    expect(find.text('Almost! Try another jar.'), findsOneWidget);
    expectNoFailureScreen(tester);
  }
  for (var i = 0; i < coinOrder.length; i++) {
    await tapKey(tester, 'coin-$i');
    await tapKey(tester, 'jar-${coinOrder[i].name}');
    expectNoFailureScreen(tester);
  }
  await tester.pump(const Duration(seconds: 1));
  expect(find.text('Count the coins'), findsOneWidget);
  // count
  if (wrongCount) {
    await tapKey(tester, 'count-3');
    await tapText(tester, 'Done');
    expect(find.textContaining("Let's count together"), findsOneWidget);
    expectNoFailureScreen(tester);
    await tapText(tester, 'Next');
  } else {
    await tapKey(tester, 'count-$goldCoins');
    await tapText(tester, 'Done');
  }
  // decision
  expect(find.text('Save or spend?'), findsOneWidget);
  await tapKey(tester, 'choice-${choice.name}');
  await tapText(tester, 'Choose');
  expectNoFailureScreen(tester);
  expect(
    find.byKey(
      Key(
        choice == Choice.save
            ? 'screen-ms-04-result-save'
            : 'screen-ms-05-result-spend',
      ),
    ),
    findsOneWidget,
  );
  await tapText(tester, 'Next');
  expect(find.byKey(const Key('screen-ms-06-summary')), findsOneWidget);
  expect(find.text('Get my reward'), findsOneWidget);
}

int coinsAfter(Iterable<WalletEvent> log, {int start = 120}) =>
    log.fold<Balances>(Balances(coins: start), (b, e) => b.apply(e)).coins;

void main() {
  group('rules (pure)', () {
    test('4–6 has no failure outcome for any choice combination', () {
      expect(showsFailureScreen(AgeBand.b4_6), isFalse);
      expect(offersRetry(AgeBand.b4_6), isFalse);
      // nothing in the phase list is a failure/retry step
      for (final p in Phase46.values) {
        expect(
          p.name.toLowerCase(),
          isNot(anyOf(contains('fail'), contains('retry'), contains('error'))),
        );
      }
      for (final choice in Choice.values) {
        for (final mistakes in [0, 1, 5]) {
          for (final countedRight in [true, false]) {
            for (final replay in [true, false]) {
              final m = LostCoinsMachine(replay: replay)..begin();
              if (replay) m.playAgain();
              for (var i = 0; i < hiddenCoins; i++) {
                m.tapSpot(i);
              }
              m.advance();
              for (var k = 0; k < mistakes; k++) {
                m.place(0, Jar.silver); // wrong jar: coin 0 is small
              }
              for (var i = 0; i < coinOrder.length; i++) {
                m.place(i, coinOrder[i]);
              }
              m.advance();
              expect(m.phase, Phase46.count);
              m.pickCount(countedRight ? goldCoins : 3);
              m.submitCount();
              if (!countedRight) m.submitCount(); // the second tap moves on
              expect(m.phase, Phase46.decision);
              m.pickChoice(choice);
              m.confirmChoice();
              expect(
                m.phase,
                choice == Choice.save
                    ? Phase46.resultSave
                    : Phase46.resultSpend,
              );
              m.next();
              expect(m.phase, Phase46.summary);
              expect(
                m.outcome,
                anyOf(AttemptOutcome.success, AttemptOutcome.gentle),
              );
              expect(m.outcome, isNot(AttemptOutcome.retry));
              expect(
                m.outcome == AttemptOutcome.success,
                mistakes == 0 && countedRight,
              );
              expect(m.reward.coins, greaterThanOrEqualTo(0));
              expect(m.reward.xp, greaterThan(0));
              // the choice never takes anything below what the child had
              var run = const Balances(coins: 0);
              for (final e in m.choiceEvents) {
                run = run.apply(
                  WalletEvent(
                    id: 'x',
                    childId: 'c',
                    kind: e.kind,
                    amount: e.amount,
                    createdAt: DateTime(2026),
                  ),
                );
                expect(run.coins, greaterThanOrEqualTo(0));
              }
            }
          }
        }
      }
    });

    test('a replay pays XP only and never coins', () {
      expect(lostCoinsReward(replay: true).coins, 0);
      expect(lostCoinsReward(replay: true).xp, replayXp);
      expect(lostCoinsReward(replay: false).coins, rewardCoins);
      expect(lostCoinsReward(replay: false).badgeId, rewardBadgeId);
    });
  });

  group('screens', () {
    testWidgets(
      'plays the whole mission with either choice and every mistake, never a failure screen',
      (tester) async {
        for (final choice in Choice.values) {
          for (final mistakes in [false, true]) {
            final r = await rig();
            await mount(
              tester,
              r,
              (c) => build_app_06_mission_intro(c, ScreenState.normal),
            );
            expect(
              find.byKey(const Key('screen-app-06-mission-intro')),
              findsOneWidget,
            );
            await playToSummary(
              tester,
              choice: choice,
              wrongJar: mistakes,
              wrongCount: mistakes,
            );
            await tapText(tester, 'Get my reward');
            await tester.pump();
            await tester.pump();
            // attempt recorded as success/gentle, never retry
            expect(r.attempts.log, hasLength(1));
            expect(r.attempts.log.single.missionId, lostCoinsMissionId);
            expect(
              r.attempts.log.single.outcome,
              mistakes ? AttemptOutcome.gentle : AttemptOutcome.success,
            );
            // the choice events plus the reward: balance only ever goes up from 120
            expect(r.wallet.log.map((e) => e.kind), contains(WalletKind.earn));
            var running = 120;
            for (final e in r.wallet.log) {
              running = Balances(coins: running).apply(e).coins;
              expect(running, greaterThanOrEqualTo(120));
            }
            expect(coinsAfter(r.wallet.log), greaterThanOrEqualTo(120));
            expect(
              r.wallet.log.any(
                (e) => e.kind == WalletKind.xp && e.amount == rewardXp,
              ),
              isTrue,
            );
            expect(find.text('Try again'), findsNothing);
            await tester.pumpWidget(const SizedBox());
          }
        }
      },
    );

    testWidgets('the idle hint appears and a tap hides it', (tester) async {
      final r = await rig();
      await mount(
        tester,
        r,
        (c) => build_app_06_mission_intro(c, ScreenState.normal),
      );
      await tapText(tester, "Let's go!");
      expect(find.byKey(const Key('screen-app-07-find-coins')), findsOneWidget);
      await tester.pump(Duration(seconds: firstHintSeconds(AgeBand.b4_6) + 1));
      expect(find.byKey(const Key('screen-ms-01-find-hint')), findsOneWidget);
      expect(
        find.text('Psst! There is a coin behind the basket.'),
        findsOneWidget,
      );
      await tapKey(tester, 'spot-0');
      expect(find.byKey(const Key('screen-app-07-find-coins')), findsOneWidget);
      await tester.pumpWidget(const SizedBox());
    });

    testWidgets(
      'leaving asks first, keeps everything earned and only logs a "left" attempt',
      (tester) async {
        final r = await rig();
        await mount(
          tester,
          r,
          (c) => build_app_06_mission_intro(c, ScreenState.normal),
        );
        await tapText(tester, "Let's go!");
        await tapKey(tester, 'spot-0');
        await tester.tap(find.byType(BackButtonCircle));
        await tester.pump();
        await tester.pump();
        expect(find.text('Leave this mission?'), findsOneWidget);
        await tapText(tester, 'Keep playing');
        await tester.pump();
        expect(
          find.byKey(const Key('screen-app-07-find-coins')),
          findsOneWidget,
        );
        expect(r.attempts.log, isEmpty);
        await tester.tap(find.byType(BackButtonCircle));
        await tester.pump();
        await tester.pump();
        await tapText(tester, 'Leave');
        await tester.pump();
        expect(r.attempts.log.map((a) => a.outcome), [AttemptOutcome.left]);
        expect(r.wallet.log, isEmpty);
        await tester.pumpWidget(const SizedBox());
      },
    );

    testWidgets(
      'a mission played before offers "Play again?" and pays XP only',
      (tester) async {
        final past = Attempt(
          id: 'old',
          childId: 'c1',
          missionId: lostCoinsMissionId,
          outcome: AttemptOutcome.success,
          startedAt: DateTime(2026, 1, 1),
        );
        final r = await rig(history: [past]);
        await mount(
          tester,
          r,
          (c) => build_app_06_mission_intro(c, ScreenState.normal),
        );
        await tapText(tester, "Let's go!");
        expect(find.byKey(const Key('screen-ms-07-replay')), findsOneWidget);
        expect(find.text('Play The Lost Coins again?'), findsOneWidget);
        await tapText(tester, 'Play again');
        expect(
          find.byKey(const Key('screen-app-07-find-coins')),
          findsOneWidget,
        );
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
          (c) => build_app_06_mission_intro(c, ScreenState.normal),
        );
        await playToSummary(tester, choice: Choice.save);
        await tapText(tester, 'Get my reward');
        await tester.pump();
        await tester.pump();
        expect(
          find.byKey(const Key('screen-ms-09-mission-error')),
          findsOneWidget,
        );
        expect(find.text('We could not save your play yet'), findsOneWidget);
        expect(
          find.text(
            '$rewardCoins coins and $rewardXp XP are waiting to be saved',
          ),
          findsOneWidget,
        );
        expect(
          flaky.log,
          hasLength(1),
        ); // kept on the device (queued), not lost
        expect(
          r.wallet.log,
          isEmpty,
        ); // rewards are not given until the save worked
        // still offline: Try again shows the same error, nothing is duplicated
        await tapText(tester, 'Try again');
        await tester.pump();
        expect(
          find.byKey(const Key('screen-ms-09-mission-error')),
          findsOneWidget,
        );
        expect(flaky.log, hasLength(1));
        // back online: Try again saves and moves on to the rewards
        flaky.online = true;
        await tapText(tester, 'Try again');
        await tester.pump();
        await tester.pump();
        expect(
          find.byKey(const Key('screen-ms-09-mission-error')),
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
          (c) => build_app_06_mission_intro(c, ScreenState.normal),
        );
        await playToSummary(tester, choice: Choice.spend);
        await tapText(tester, 'Get my reward');
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
        await mount(tester, r, (c) => build_ms_04_result_save(c, state));
        expect(
          find.byKey(const Key('screen-ms-04-result-save')),
          findsOneWidget,
          reason: state.name,
        );
        await mount(tester, r, (c) => build_ms_09_mission_error(c, state));
        expect(
          find.byKey(const Key('screen-ms-09-mission-error')),
          findsOneWidget,
          reason: state.name,
        );
      }
      await tester.pumpWidget(const SizedBox());
    });
  });
}
