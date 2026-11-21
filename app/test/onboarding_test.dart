import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/data/models.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/screens/onboarding/Main.dart';
import 'package:kudicubs/screens/onboarding/app-02-age.dart';
import 'package:kudicubs/screens/onboarding/app-03-avatar.dart';
import 'package:kudicubs/screens/onboarding/app-04-gate.dart';
import 'package:kudicubs/screens/onboarding/ob-01-splash.dart';
import 'package:kudicubs/screens/onboarding/ob-02-intro-1.dart';
import 'package:kudicubs/screens/onboarding/ob-03-intro-2.dart';
import 'package:kudicubs/screens/onboarding/ob-04-intro-3.dart';
import 'package:kudicubs/screens/onboarding/ob-06-gate-hold.dart';
import 'package:kudicubs/screens/onboarding/ob-07-gate-wrong.dart';
import 'package:kudicubs/screens/onboarding/ob-08-gate-locked.dart';
import 'package:kudicubs/screens/onboarding/gate_view.dart';
import 'package:kudicubs/screens/onboarding/ob-05-avatar-empty.dart';
import 'package:kudicubs/screens/onboarding/onboarding_state.dart';

import 'support/fakes.dart';

GateMachine machine(DateTime Function() now) =>
    GateMachine(now: now, random: Random(7));

void enter(GateMachine m, int n) {
  for (final d in n.toString().split('')) {
    m.digit(d);
  }
}

void wrongAnswer(GateMachine m) {
  enter(m, m.answer + 1);
  m.check();
}

void main() {
  group('gate machine', () {
    test('starts at hold; hold completes into a question', () {
      final m = machine(DateTime.now);
      expect(m.phase, GatePhase.hold);
      m.digit('4'); // ignored before the hold is done
      expect(m.entry, '');
      m.holdComplete();
      expect(m.phase, GatePhase.question);
      expect(m.a, inInclusiveRange(3, 9));
      expect(m.b, inInclusiveRange(3, 9));
    });

    test('correct answer passes', () {
      final m = machine(DateTime.now)..holdComplete();
      enter(m, m.answer);
      expect(m.check(), GateCheck.correct);
      expect(m.phase, GatePhase.passed);
    });

    test('empty answer is not counted as a try', () {
      final m = machine(DateTime.now)..holdComplete();
      expect(m.check(), GateCheck.empty);
      expect(m.wrongCount, 0);
    });

    test(
      'wrong answer shows the wrong state with a fresh question and fewer tries',
      () {
        final m = machine(DateTime.now)..holdComplete();
        final before = m.answer;
        wrongAnswer(m);
        expect(m.phase, GatePhase.question);
        expect(m.showWrong, isTrue);
        expect(m.triesLeft, 2);
        expect(m.entry, '');
        expect(m.answer, isNot(before));
        m.digit('1');
        expect(m.showWrong, isFalse);
      },
    );

    test('entry is limited to two digits and delete works', () {
      final m = machine(DateTime.now)..holdComplete();
      m.digit('1');
      m.digit('2');
      m.digit('3');
      expect(m.entry, '12');
      m.delete();
      expect(m.entry, '1');
    });

    test(
      'three wrong answers lock for 60 s, then a fresh question after the wait',
      () {
        var t = DateTime(2026, 1, 1, 12);
        final m = machine(() => t)..holdComplete();
        wrongAnswer(m);
        wrongAnswer(m);
        expect(m.triesLeft, 1);
        wrongAnswer(m);
        expect(m.phase, GatePhase.locked);
        expect(m.lockSecondsLeft, 60);
        // Input is ignored and a check reports locked while waiting.
        m.digit('1');
        expect(m.entry, '');
        expect(m.check(), GateCheck.locked);

        t = t.add(const Duration(seconds: 38));
        expect(m.tick(), isFalse);
        expect(m.lockSecondsLeft, 22);

        t = t.add(const Duration(seconds: 22));
        expect(m.tick(), isTrue);
        expect(m.phase, GatePhase.question);
        expect(m.wrongCount, 0);
        expect(m.triesLeft, 3);
        enter(m, m.answer);
        expect(m.check(), GateCheck.correct);
      },
    );

    test('reopening the gate does not bypass a running lock', () {
      var t = DateTime(2026, 1, 1);
      final m = machine(() => t)..holdComplete();
      for (var i = 0; i < 3; i++) {
        wrongAnswer(m);
      }
      m.restart();
      expect(m.phase, GatePhase.locked);
      t = t.add(const Duration(seconds: 61));
      m.restart();
      expect(m.phase, GatePhase.hold);
    });
  });

  group('avatar validation', () {
    test('nothing chosen / empty nickname / complete', () {
      expect(validatePendingChild(const PendingChild()), AvatarIssue.noAvatar);
      expect(
        validatePendingChild(const PendingChild(avatar: 'cub-friend-2')),
        AvatarIssue.noName,
      );
      expect(
        validatePendingChild(
          const PendingChild(avatar: 'cub-friend-2', nickname: '  '),
        ),
        AvatarIssue.noName,
      );
      expect(
        validatePendingChild(
          const PendingChild(avatar: 'cub-friend-2', nickname: 'Kofi'),
        ),
        AvatarIssue.none,
      );
    });

    test('pending child is stored locally and cleared', () async {
      final c = ProviderContainer(overrides: await fakeOverrides());
      addTearDown(c.dispose);
      final n = c.read(pendingChildProvider.notifier);
      expect(c.read(pendingChildProvider).ageBand, AgeBand.b4_6);
      await n.setAgeBand(AgeBand.b10_12);
      await n.setAvatar('cub-friend-3');
      await n.setNickname('Zara');
      final p = c.read(pendingChildProvider);
      expect(
        (p.ageBand, p.avatar, p.nickname),
        (AgeBand.b10_12, 'cub-friend-3', 'Zara'),
      );
      expect(p.isComplete, isTrue);
      await n.clear();
      expect(c.read(pendingChildProvider).avatar, isNull);
    });

    test('onboardingDoneProvider mirrors the onboarded flag', () async {
      final c = ProviderContainer(overrides: await fakeOverrides());
      addTearDown(c.dispose);
      expect(c.read(onboardingDoneProvider), isFalse);
      await c.read(onboardingDoneProvider.notifier).set(true);
      expect(c.read(onboardingDoneProvider), isTrue);
    });
  });

  group('screens', () {
    Future<void> pump(
      WidgetTester tester,
      Widget Function(BuildContext) b, {
      Map<String, Object> prefs = const {},
    }) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        ProviderScope(
          overrides: await fakeOverrides(prefs: prefs),
          child: MaterialApp(
            theme: AppTheme.light,
            home: Builder(builder: b),
          ),
        ),
      );
    }

    testWidgets('empty avatar: warning shown and "That\'s me!" disabled', (
      tester,
    ) async {
      await pump(
        tester,
        (c) => build_ob_05_avatar_empty(c, ScreenState.normal),
      );
      expect(find.text('Pick a friend first'), findsOneWidget);
      expect(find.bySemanticsLabel("That's me!"), findsOneWidget);
      // Names are not selectable before a friend is picked.
      await tester.tap(find.text('Kofi'));
      await tester.pump();
      expect(find.text('Pick a friend first'), findsOneWidget);
    });

    testWidgets('avatar then name unlocks the button', (tester) async {
      await pump(tester, (c) => build_app_03_avatar(c, ScreenState.normal));
      await tester.tap(find.bySemanticsLabel('Friend 2'));
      await tester.pump();
      expect(find.text('Choose a name first'), findsOneWidget);
      await tester.tap(find.text('Kofi'));
      await tester.pump();
      expect(find.byKey(const Key('avatar-issue')), findsNothing);
    });

    testWidgets(
      'gate: hold 3 s then question; wrong answer; lock-out countdown',
      (tester) async {
        final m = GateMachine(random: Random(3));
        await pump(
          tester,
          (c) => Builder(builder: (_) => GateView(machine: m)),
        );
        expect(find.byKey(const Key('gate-hold')), findsOneWidget);

        final hold = tester.getCenter(
          find.byKey(const Key('gate-hold-button')),
        );
        final g = await tester.startGesture(hold);
        await tester.pump(); // the ticker starts on the first frame
        await tester.pump(const Duration(seconds: 1));
        expect(find.textContaining('Keep holding'), findsOneWidget);
        await g.up(); // released early: nothing happens
        await tester.pumpAndSettle();
        expect(m.phase, GatePhase.hold);

        final g2 = await tester.startGesture(hold);
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 3100));
        await g2.up();
        await tester.pump();
        expect(m.phase, GatePhase.question);
        expect(find.byKey(const Key('gate-question')), findsOneWidget);

        for (var i = 0; i < 3; i++) {
          enter(m, m.answer + 1);
          await tester.ensureVisible(find.text('Check'));
          await tester.tap(find.text('Check'));
          await tester.pump();
          if (i < 2) {
            expect(find.byKey(const Key('gate-wrong')), findsOneWidget);
          }
        }
        expect(m.phase, GatePhase.locked);
        expect(find.text('1:00'), findsOneWidget);
        expect(find.text('Back to the game'), findsOneWidget);
        await tester.pumpWidget(const SizedBox()); // stop the ticker
      },
    );

    testWidgets('all 12 screens render in every state without overflow', (
      tester,
    ) async {
      final all = <String, ScreenBuilder>{
        'Main': build_Main,
        'ob-01-splash': build_ob_01_splash,
        'ob-02-intro-1': build_ob_02_intro_1,
        'ob-03-intro-2': build_ob_03_intro_2,
        'ob-04-intro-3': build_ob_04_intro_3,
        'app-02-age': build_app_02_age,
        'app-03-avatar': build_app_03_avatar,
        'ob-05-avatar-empty': build_ob_05_avatar_empty,
        'ob-06-gate-hold': build_ob_06_gate_hold,
        'app-04-gate': build_app_04_gate,
        'ob-07-gate-wrong': build_ob_07_gate_wrong,
        'ob-08-gate-locked': build_ob_08_gate_locked,
      };
      for (final e in all.entries) {
        for (final st in ScreenState.values) {
          await pump(tester, (c) => e.value(c, st));
          expect(
            find.byKey(Key('screen-${e.key}')),
            findsOneWidget,
            reason: '${e.key} ${st.name}',
          );
          expect(tester.takeException(), isNull, reason: '${e.key} ${st.name}');
        }
      }
      await tester.pumpWidget(const SizedBox());
    });
  });
}
