import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;
import 'package:kudicubs/core/data/models.dart';
import 'package:kudicubs/core/data/providers.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/screens/registry.dart';
import 'package:kudicubs/screens/parent/app-20-parent-lockout.dart';
import 'package:kudicubs/screens/parent/app-22-parent-delete.dart';
import 'package:kudicubs/screens/parent/pa-12-deleted.dart';
import 'package:kudicubs/screens/parent/parent_add_child_view.dart';
import 'package:kudicubs/screens/parent/parent_child_view.dart';
import 'package:kudicubs/screens/parent/parent_data.dart';
import 'package:kudicubs/screens/parent/parent_logic.dart';
import 'package:kudicubs/screens/parent/parent_pin_entry.dart';
import 'package:kudicubs/screens/parent/parent_settings_view.dart';

import 'support/fakes.dart';

/// Parent repository with the three PIN answers, a failing PIN, and a delete that can fail.
class _Parent extends FakeParent {
  int verifyCalls = 0;
  int deleteCalls = 0;
  bool deleteFails = false;

  @override
  Future<PinResult> verifyPin(String pin) async {
    verifyCalls++;
    return switch (pin) {
      '2580' => PinResult.ok,
      '0000' => PinResult.locked,
      '9999' => throw Exception('offline'),
      _ => PinResult.wrong,
    };
  }

  @override
  Future<void> deleteFamily() async {
    deleteCalls++;
    if (deleteFails) throw Exception('server');
  }
}

class _Devices implements DeviceRepository {
  bool forgotten = false;
  DeviceMode? saved;

  @override
  String get deviceId => 'device-1';
  @override
  Future<DeviceMode?> mode() async => saved;
  @override
  Future<void> setMode(DeviceMode mode) async => saved = mode;
  @override
  Future<void> forgetLocal() async => forgotten = true;
}

class _Auth extends FakeAuth {
  @override
  sb.Session? get currentSession => sb.Session(
    accessToken: 'token',
    tokenType: 'bearer',
    user: const sb.User(
      id: 'p1',
      appMetadata: {},
      userMetadata: {},
      aud: 'authenticated',
      createdAt: '2026-01-01T00:00:00Z',
    ),
  );
}

class _Online extends OnlineNotifier {
  @override
  bool build() => true;
  @override
  Future<bool> check() async => true;
}

/// The foundation fakes, with the repositories this area changes swapped for ours
/// (a provider can only be overridden once, so `fakeOverrides` is not reused here).
Future<List<Override>> _overrides({_Parent? parent, FakeChildren? children, _Devices? devices}) async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  return [
    sharedPrefsProvider.overrideWithValue(prefs),
    authRepositoryProvider.overrideWithValue(_Auth()),
    childrenRepositoryProvider.overrideWithValue(children ?? FakeChildren()),
    walletRepositoryProvider.overrideWithValue(FakeWallet()),
    attemptsRepositoryProvider.overrideWithValue(FakeAttempts()),
    badgesRepositoryProvider.overrideWithValue(FakeBadges()),
    missionsRepositoryProvider.overrideWithValue(FakeMissions()),
    parentRepositoryProvider.overrideWithValue(parent ?? _Parent()),
    deviceRepositoryProvider.overrideWithValue(devices ?? _Devices()),
    onlineProvider.overrideWith(_Online.new),
  ];
}

Future<void> _pump(WidgetTester tester, Widget screen, List<Override> overrides) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides,
      child: MaterialApp(theme: AppTheme.light, home: screen),
    ),
  );
  await tester.pump();
}

Future<void> _type(WidgetTester tester, String digits) async {
  for (final d in digits.split('')) {
    await tester.tap(find.text(d));
    await tester.pump();
  }
}

Future<void> _tapKey(WidgetTester tester, String key) async {
  await tester.ensureVisible(find.byKey(Key(key)));
  await tester.pump();
  await tester.tap(find.byKey(Key(key)));
  await tester.pump();
}

Future<void> _enter(WidgetTester tester, String key, String text) async {
  await tester.ensureVisible(find.byKey(Key(key)));
  await tester.enterText(find.byKey(Key(key)), text);
  await tester.pump();
}

ProviderContainer _container(WidgetTester tester) =>
    ProviderScope.containerOf(tester.element(find.byType(Scaffold).first));

Child _kid(int i) =>
    Child(id: 'k$i', nickname: kNicknameChoices[i], ageBand: AgeBand.b4_6, region: Region.gh, avatar: 'cub-friend-1');

const _parentIds = [
  'app-17-parent-children',
  'pa-01-children-empty',
  'pa-02-children-loading',
  'pa-03-add-child',
  'pa-04-add-child-error',
  'app-18-parent-child',
  'pa-05-child-no-play',
  'app-19-parent-settings',
  'pa-06-settings-saved',
  'pa-07-band-confirm',
  'pa-08-region',
  'pa-09-device-mode',
  'app-20-parent-lockout',
  'app-21-parent-signin',
  'pa-10-signout-confirm',
  'app-22-parent-delete',
  'pa-11-delete-processing',
  'pa-12-deleted',
];

void main() {
  testWidgets('all 18 parent screens render in every state and keep their key', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    final overrides = await _overrides();
    for (final id in _parentIds) {
      for (final state in ScreenState.values) {
        await tester.pumpWidget(
          ProviderScope(
            overrides: overrides,
            child: MaterialApp(
              theme: AppTheme.light,
              home: Builder(builder: (c) => registry[id]!(c, state)),
            ),
          ),
        );
        await tester.pump(const Duration(milliseconds: 50));
        expect(find.byKey(Key('screen-$id')), findsOneWidget, reason: '$id / ${state.name}');
        expect(tester.takeException(), isNull, reason: '$id / ${state.name}');
      }
    }
    // let the lock-out ticker and the toast timer die with the widget tree
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 5));
  });

  group('rules', () {
    test('new child: nickname required, at most 20 characters, at most 5 children', () {
      expect(validateNewChild(nickname: null, existingChildren: 1), AddChildProblem.noNickname);
      expect(validateNewChild(nickname: '   ', existingChildren: 1), AddChildProblem.noNickname);
      expect(validateNewChild(nickname: 'A' * 20, existingChildren: 1), isNull);
      expect(validateNewChild(nickname: 'A' * 21, existingChildren: 1), AddChildProblem.nicknameTooLong);
      expect(validateNewChild(nickname: 'Ama', existingChildren: 4), isNull);
      expect(validateNewChild(nickname: 'Ama', existingChildren: kMaxChildren), AddChildProblem.tooMany);
      expect(addChildMessage(AddChildProblem.noNickname), 'Choose a nickname from the list to continue.');
      expect(kNicknameChoices.every((n) => n.length <= kNicknameMax), isTrue);
    });

    test('countdown text and remaining time', () {
      expect(formatCountdown(const Duration(minutes: 4, seconds: 32)), '4:32');
      expect(formatCountdown(const Duration(seconds: 5)), '0:05');
      expect(formatCountdown(const Duration(milliseconds: 100)), '0:01');
      expect(formatCountdown(Duration.zero), '0:00');
      expect(formatCountdown(const Duration(seconds: -3)), '0:00');
      final now = DateTime(2026, 1, 1, 12);
      expect(lockRemaining(now.add(const Duration(minutes: 5)), now), kPinLockDuration);
      expect(lockRemaining(now.subtract(const Duration(seconds: 1)), now), Duration.zero);
      expect(lockRemaining(null, now), Duration.zero);
    });

    test('delete needs the box and the word', () {
      expect(canDeleteAccount(understood: false, typed: 'DELETE'), isFalse);
      expect(canDeleteAccount(understood: true, typed: ''), isFalse);
      expect(canDeleteAccount(understood: true, typed: 'DEL'), isFalse);
      expect(canDeleteAccount(understood: true, typed: ' delete '), isTrue);
    });

    test('email mask, relative day, skills never go down', () {
      expect(maskEmail('parent@example.com'), 'p***@example.com');
      final now = DateTime(2026, 5, 20, 9);
      expect(relativeDay(DateTime(2026, 5, 20, 1), now), 'today');
      expect(relativeDay(DateTime(2026, 5, 19, 23), now), 'yesterday');
      expect(relativeDay(DateTime(2026, 5, 17), now), '3 days ago');
      Attempt a(String m, AttemptOutcome o) =>
          Attempt(id: m + o.name, childId: 'c', missionId: m, outcome: o, startedAt: now);
      final p = skillPercents([
        a('m_4_6_lost_coins', AttemptOutcome.success),
        a('m_4_6_lost_coins', AttemptOutcome.success),
        a('m_4_6_picnic', AttemptOutcome.retry),
        a('m_4_6_playground', AttemptOutcome.gentle),
      ]);
      expect(p[Skill.know], 25);
      expect(p[Skill.decide], 0);
      expect(p[Skill.share], 25);
    });
  });

  group('PIN entry', () {
    Future<_Parent> open(WidgetTester tester, {VoidCallback? onUnlocked, VoidCallback? onLocked}) async {
      final parent = _Parent();
      await _pump(tester, ParentPinEntry(onUnlocked: onUnlocked, onLocked: onLocked), await _overrides(parent: parent));
      return parent;
    }

    testWidgets('correct PIN unlocks the parent area', (tester) async {
      var unlocked = 0;
      await open(tester, onUnlocked: () => unlocked++);
      await _type(tester, '2580');
      await tester.pumpAndSettle();
      expect(unlocked, 1);
      expect(_container(tester).read(parentUnlockedProvider), isTrue);
    });

    testWidgets('wrong PIN shows a message, clears the dots and stays locked', (tester) async {
      var unlocked = 0;
      await open(tester, onUnlocked: () => unlocked++);
      await _type(tester, '1357');
      await tester.pump();
      expect(find.byKey(const Key('pin-message')), findsOneWidget);
      expect(find.text('That is not the PIN. Try again.'), findsOneWidget);
      await tester.pumpAndSettle(); // shake finishes
      expect(unlocked, 0);
      expect(_container(tester).read(parentUnlockedProvider), isFalse);
      // can try again
      await _type(tester, '2580');
      await tester.pumpAndSettle();
      expect(unlocked, 1);
      expect(find.byKey(const Key('pin-message')), findsNothing);
    });

    testWidgets('locked answer opens the lock-out and does not unlock', (tester) async {
      var locked = 0;
      await open(tester, onLocked: () => locked++);
      await _type(tester, '0000');
      await tester.pumpAndSettle();
      expect(locked, 1);
      expect(_container(tester).read(parentUnlockedProvider), isFalse);
    });

    testWidgets('no connection while checking shows a retry message, not a wrong-PIN count', (tester) async {
      await open(tester);
      await _type(tester, '9999');
      await tester.pumpAndSettle();
      expect(find.textContaining('could not check the PIN'), findsOneWidget);
    });

    testWidgets('no more than four digits are taken while checking', (tester) async {
      final parent = await open(tester);
      await _type(tester, '1357');
      await _type(tester, '2');
      await tester.pumpAndSettle();
      expect(parent.verifyCalls, 1);
    });
  });

  group('lock-out', () {
    testWidgets('counts down from pin_locked_until and ends once', (tester) async {
      final t0 = DateTime(2026, 5, 20, 10);
      var clock = t0;
      var expired = 0;
      await _pump(
        tester,
        ParentLockoutView(
          lockedUntil: t0.add(const Duration(minutes: 4, seconds: 32)),
          now: () => clock,
          onExpired: () => expired++,
        ),
        await _overrides(),
      );
      expect(find.text('4:32'), findsOneWidget);
      expect(find.text("Let's take a short pause"), findsOneWidget);

      clock = t0.add(const Duration(seconds: 2));
      await tester.pump(const Duration(seconds: 1));
      expect(find.text('4:30'), findsOneWidget);
      expect(expired, 0);

      clock = t0.add(const Duration(minutes: 5));
      await tester.pump(const Duration(seconds: 1));
      expect(find.text('0:00'), findsOneWidget);
      expect(expired, 1);
      await tester.pump(const Duration(seconds: 3));
      expect(expired, 1);
    });

    testWidgets('keeps the design copy and the safe-progress note', (tester) async {
      await _pump(tester, const ParentLockoutView(), await _overrides());
      expect(find.text('Email me a code'), findsOneWidget);
      expect(find.textContaining('coins, badges and progress are safe'), findsOneWidget);
      expect(find.text('Back to the game'), findsOneWidget);
      // fallback when no lock is recorded: the full lock time
      expect(find.text('5:00'), findsOneWidget);
    });
  });

  group('delete account', () {
    bool enabled(WidgetTester tester) => tester
        .widget<Semantics>(
          find.byWidgetPredicate(
            (w) => w is Semantics && w.properties.label == 'Delete everything' && w.properties.button == true,
          ),
        )
        .properties
        .enabled!;

    testWidgets('stays disabled until the box is ticked and the word typed', (tester) async {
      final parent = _Parent();
      await _pump(tester, ParentDeleteFlow(onFinished: () {}), await _overrides(parent: parent));
      expect(enabled(tester), isFalse);

      await _tapKey(tester, 'delete-understand');
      await tester.pump();
      expect(enabled(tester), isFalse, reason: 'box alone is not enough');

      await _enter(tester, 'delete-word', 'DEL');
      await tester.pump();
      expect(enabled(tester), isFalse);

      await _enter(tester, 'delete-word', 'delete');
      await tester.pump();
      expect(enabled(tester), isTrue);

      await _tapKey(tester, 'delete-understand');
      await tester.pump();
      expect(enabled(tester), isFalse, reason: 'unticking disables it again');
      expect(parent.deleteCalls, 0);
    });

    testWidgets('deletes, shows the deleted screen, then clears this phone', (tester) async {
      var finished = 0;
      final parent = _Parent();
      final devices = _Devices();
      await _pump(
        tester,
        ParentDeleteFlow(onFinished: () => finished++),
        await _overrides(parent: parent, devices: devices),
      );
      await _tapKey(tester, 'delete-understand');
      await _enter(tester, 'delete-word', 'DELETE');
      await tester.pump();
      await tester.tap(find.text('Delete everything'));
      await tester.pumpAndSettle();
      expect(parent.deleteCalls, 1);
      expect(find.text('Your family data is deleted'), findsOneWidget);

      await tester.tap(find.text('Back to start'));
      await tester.pumpAndSettle();
      expect(devices.forgotten, isTrue);
      expect(_container(tester).read(onboardedProvider), isFalse);
      expect(_container(tester).read(parentUnlockedProvider), isFalse);
      expect(finished, 1);
    });

    testWidgets('a failed delete goes back with a message and erases nothing', (tester) async {
      final parent = _Parent()..deleteFails = true;
      final devices = _Devices();
      await _pump(tester, ParentDeleteFlow(onFinished: () {}), await _overrides(parent: parent, devices: devices));
      await _tapKey(tester, 'delete-understand');
      await _enter(tester, 'delete-word', 'DELETE');
      await tester.pump();
      await tester.tap(find.text('Delete everything'));
      await tester.pumpAndSettle();
      expect(parent.deleteCalls, 1);
      expect(find.textContaining('nothing was erased'), findsOneWidget);
      expect(find.text('Your family data is deleted'), findsNothing);
      expect(devices.forgotten, isFalse);
    });

    testWidgets('the deleted screen is a real page with one action', (tester) async {
      var done = 0;
      await _pump(tester, DeletedView(onDone: () => done++), await _overrides());
      expect(find.text('All done'), findsOneWidget);
      await tester.tap(find.text('Back to start'));
      expect(done, 1);
    });
  });

  group('add a child', () {
    testWidgets('adds the chosen nickname, band and country', (tester) async {
      final kids = FakeChildren();
      Child? added;
      await _pump(tester, AddChildView(onAdded: (c) => added = c), await _overrides(children: kids));
      await _tapKey(tester, 'nick-Zara');
      await _tapKey(tester, 'band-b7_9');
      await _tapKey(tester, 'region-ng');
      await tester.pump();
      await tester.tap(find.text('Add child'));
      await tester.pumpAndSettle();
      expect(added?.nickname, 'Zara');
      expect(added?.ageBand, AgeBand.b7_9);
      expect(added?.region, Region.ng);
      expect(kids.items.length, 2);
    });

    testWidgets('no nickname shows the one-thing-to-fix message and adds nothing', (tester) async {
      final kids = FakeChildren();
      var added = 0;
      await _pump(
        tester,
        AddChildView(startWithProblem: true, onAdded: (_) => added++),
        await _overrides(children: kids),
      );
      expect(find.text('Choose a nickname from the list'), findsOneWidget);
      expect(find.textContaining('One thing to fix.', findRichText: true), findsOneWidget);
      await tester.tap(find.text('Add child'));
      await tester.pumpAndSettle();
      expect(added, 0);
      expect(kids.items.length, 1);

      // choosing a nickname clears the problem and lets it through
      await _tapKey(tester, 'nick-Tobi');
      await tester.pump();
      expect(find.textContaining('One thing to fix.', findRichText: true), findsNothing);
      await tester.tap(find.text('Add child'));
      await tester.pumpAndSettle();
      expect(added, 1);
    });

    testWidgets('a sixth child is refused', (tester) async {
      final kids = FakeChildren()..items.addAll([for (var i = 1; i < 5; i++) _kid(i)]);
      var added = 0;
      await _pump(tester, AddChildView(onAdded: (_) => added++), await _overrides(children: kids));
      await _tapKey(tester, 'nick-Sam');
      await tester.pump();
      await tester.tap(find.text('Add child'));
      await tester.pumpAndSettle();
      expect(added, 0);
      expect(find.textContaining('up to 5 children', findRichText: true), findsWidgets);
    });

    testWidgets('a server error shows the problem and keeps the form', (tester) async {
      final kids = _FailingChildren();
      var added = 0;
      await _pump(tester, AddChildView(onAdded: (_) => added++), await _overrides(children: kids));
      await tester.tap(find.text('Add child'));
      await tester.pumpAndSettle();
      expect(added, 0);
      expect(find.textContaining('We could not add your child.', findRichText: true), findsOneWidget);
    });
  });

  group('children and settings', () {
    testWidgets('the one-child page shows the real wallet and the no-play state', (tester) async {
      await _pump(tester, const ParentChildView(childId: 'c1', forceNoPlay: true), await _overrides());
      await tester.pumpAndSettle();
      expect(find.text('Ama has not played yet'), findsOneWidget);
      expect(find.text('Back to the game'), findsOneWidget);
    });

    testWidgets('changing the age band asks first and keeps progress', (tester) async {
      final kids = FakeChildren();
      await _pump(tester, const ParentSettingsView(), await _overrides(children: kids));
      await tester.pumpAndSettle();
      expect(find.text('Settings for Ama'), findsOneWidget);

      await _tapKey(tester, 'settings-band-b7_9');
      await tester.pumpAndSettle();
      expect(find.text('Change Ama to ages 7–9?'), findsOneWidget);
      expect(find.textContaining("Ama's progress is kept.", findRichText: true), findsOneWidget);

      await tester.tap(find.text('Keep ages 4–6'));
      await tester.pumpAndSettle();
      expect(_container(tester).read(childrenProvider).value!.first.ageBand, AgeBand.b4_6);

      await _tapKey(tester, 'settings-band-b7_9');
      await tester.pumpAndSettle();
      await tester.tap(find.text('Change to ages 7–9'));
      await tester.pumpAndSettle();
      expect(_container(tester).read(childrenProvider).value!.first.ageBand, AgeBand.b7_9);
      expect(find.text('Saved'), findsOneWidget);
      await tester.pump(const Duration(seconds: 4));
    });
  });
}

class _FailingChildren extends FakeChildren {
  @override
  Future<Child> add({
    required String nickname,
    required AgeBand ageBand,
    required Region region,
    required String avatar,
  }) async => throw Exception('refused');
}
