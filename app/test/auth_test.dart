import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:kudicubs/core/data/models.dart';
import 'package:kudicubs/core/data/providers.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/screens/auth/auth_logic.dart';
import 'package:kudicubs/screens/auth/auth_state.dart';
import 'package:kudicubs/screens/auth/pin_screen.dart';
import 'package:kudicubs/screens/auth/email_screen.dart';
import 'package:kudicubs/screens/auth/code_screen.dart';
import 'package:kudicubs/screens/onboarding/onboarding_state.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;

import 'support/fakes.dart';

class ScriptedAuth extends FakeAuth {
  final List<Object> verifyErrors = [];
  final List<String> verified = [];
  @override
  Future<sb.Session?> verifyCode(String email, String code) async {
    verified.add(code);
    if (verifyErrors.isNotEmpty) throw verifyErrors.removeAt(0);
    return null;
  }
}

class RecordingParent extends FakeParent {
  final List<String> calls = [];
  Object? setPinError;
  Object? regionError;
  @override
  Future<void> setPin(String pin) async {
    if (setPinError != null) throw setPinError!;
    calls.add('pin:$pin');
  }

  @override
  Future<void> setRegion(Region region) async {
    if (regionError != null) throw regionError!;
    calls.add('region:${region.db}');
  }

  @override
  Future<void> giveConsent() async => calls.add('consent');
}

class Harness {
  Harness._(this.container, this.auth, this.parent, this.kids, this.sent, this.overrides);
  final ProviderContainer container;
  final ScriptedAuth auth;
  final RecordingParent parent;
  final FakeChildren kids;
  final List<String> sent;
  final List<Override> overrides;

  AuthFlow get flow => container.read(authFlowProvider.notifier);
  AuthFlowState get state => container.read(authFlowProvider);

  static Future<Harness> create() async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final auth = ScriptedAuth();
    final parent = RecordingParent();
    final kids = FakeChildren()..items.clear();
    final sent = <String>[];
    final overrides = <Override>[
      sharedPrefsProvider.overrideWithValue(prefs),
      authRepositoryProvider.overrideWithValue(auth),
      parentRepositoryProvider.overrideWithValue(parent),
      childrenRepositoryProvider.overrideWithValue(kids),
      codeSenderProvider.overrideWithValue((email, {required createUser}) async => sent.add('$email:$createUser')),
      onlineProvider.overrideWith(() => _Online()),
    ];
    final c = ProviderContainer(overrides: overrides);
    return Harness._(c, auth, parent, kids, sent, overrides);
  }
}

class _Online extends OnlineNotifier {
  @override
  bool build() => true;
  @override
  Future<bool> check() async => true;
}

void main() {
  group('PIN rules (same as set_pin)', () {
    test('rejects weak PINs the RPC rejects', () {
      for (final p in weakPins) {
        expect(validatePin(p), PinIssue.weak, reason: p);
      }
      expect(weakPins.length, 13);
    });
    test('rejects bad format', () {
      for (final p in ['', '123', '12345', 'abcd', '12 4']) {
        expect(validatePin(p), PinIssue.format, reason: p);
      }
    });
    test('accepts a normal PIN', () {
      expect(validatePin('2580'), isNull);
      expect(validatePin('7391'), isNull);
    });
    test('maps the RPC exceptions', () {
      expect(pinIssueFromError(const sb.PostgrestException(message: 'pin_weak')), PinIssue.weak);
      expect(pinIssueFromError(const sb.PostgrestException(message: 'pin_format')), PinIssue.format);
      expect(pinIssueFromError(Exception('other')), isNull);
    });
  });

  group('email and formatting', () {
    test('email validation', () {
      expect(isValidEmail('parent@example.com'), isTrue);
      expect(isValidEmail(' parent@example.com '), isTrue);
      for (final e in ['', 'parent', 'parent@', 'parent@example', '@example.com', 'a b@example.com']) {
        expect(isValidEmail(e), isFalse, reason: e);
      }
    });
    test('cooldown and clock', () {
      expect(formatCooldown(30), '0:30');
      expect(formatCooldown(65), '1:05');
      expect(formatCooldown(-3), '0:00');
      expect(formatClock(DateTime(2026, 1, 1, 16, 12)), '4:12 pm');
      expect(formatClock(DateTime(2026, 1, 1, 0, 5)), '12:05 am');
    });
  });

  group('error mapping', () {
    final sent = DateTime(2026, 11, 21, 10);
    test('wrong code inside the 10 minutes', () {
      const e = sb.AuthException('Token has expired or is invalid', statusCode: '403', code: 'otp_expired');
      expect(mapAuthError(e, codeSentAt: sent, now: sent.add(const Duration(minutes: 2))), AuthFailure.wrongCode);
    });
    test('expired code after 10 minutes', () {
      const e = sb.AuthException('Token has expired or is invalid', statusCode: '403', code: 'otp_expired');
      expect(mapAuthError(e, codeSentAt: sent, now: sent.add(const Duration(minutes: 11))), AuthFailure.expiredCode);
    });
    test('too many attempts', () {
      expect(mapAuthError(const sb.AuthException('rate', statusCode: '429', code: 'over_email_send_rate_limit')), AuthFailure.tooManyAttempts);
    });
    test('no account for sign-in', () {
      expect(mapAuthError(const sb.AuthException('Signups not allowed for otp', code: 'otp_disabled')), AuthFailure.noAccount);
    });
    test('offline', () {
      expect(mapAuthError(const SocketException('no route')), AuthFailure.offline);
      expect(mapAuthError(TimeoutException('slow')), AuthFailure.offline);
      expect(mapAuthError(sb.AuthRetryableFetchException(message: 'x')), AuthFailure.offline);
    });
    test('unknown', () {
      expect(mapAuthError(StateError('boom')), AuthFailure.unknown);
    });
  });

  group('flow state transitions', () {
    test('sign-up: verified code sets PIN, region, child, consent, then joined', () async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      await h.container.read(pendingChildProvider.notifier).setNickname('Ama');
      await h.container.read(pendingChildProvider.notifier).setAvatar('cub-friend-2');
      h.flow
        ..setPin('2580')
        ..setRegion(Region.ng)
        ..setEmail('parent@example.com');
      expect(await h.flow.sendCode(), isNull);
      expect(h.sent, ['parent@example.com:true']);

      expect(await h.flow.verify('123456'), AuthStep.joined);
      expect(h.parent.calls, ['pin:2580', 'region:ng', 'consent']);
      expect(h.kids.items.single.nickname, 'Ama');
      expect(h.kids.items.single.region, Region.ng);
      expect(h.container.read(onboardedProvider), isTrue);
      expect(h.container.read(pendingChildProvider).nickname, isNull);
      expect(h.state.pin, isNull);
    });

    test('wrong code counts tries then asks for a new code', () async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      h.flow.setEmail('a@b.co');
      await h.flow.sendCode();
      const wrong = sb.AuthException('Token has expired or is invalid', code: 'otp_expired');
      h.auth.verifyErrors.addAll([wrong, wrong, wrong]);
      expect(await h.flow.verify('000001'), AuthStep.stay);
      expect(h.state.phase, CodePhase.wrong);
      expect(h.state.triesLeft, 2);
      await h.flow.verify('000002');
      expect(h.state.triesLeft, 1);
      await h.flow.verify('000003');
      expect(h.state.phase, CodePhase.tooMany);
      expect(h.container.read(onboardedProvider), isFalse);
    });

    test('old code is shown as expired', () async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      h.flow.setEmail('a@b.co');
      await h.flow.sendCode();
      h.flow.clock = () => DateTime.now().add(const Duration(minutes: 12));
      h.auth.verifyErrors.add(const sb.AuthException('Token has expired or is invalid', code: 'otp_expired'));
      await h.flow.verify('111111');
      expect(h.state.phase, CodePhase.expired);
    });

    test('offline while finishing: kept for retry, then succeeds', () async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      h.flow.setPin('2580');
      h.parent.regionError = const SocketException('offline');
      expect(await h.flow.verify('123456'), AuthStep.finishLater);
      expect(h.state.setupPending, isTrue);
      expect(h.state.pin, '2580');
      expect(h.container.read(onboardedProvider), isFalse);
      h.parent.regionError = null;
      expect(await h.flow.finishSignup(), AuthStep.joined);
      expect(h.state.setupPending, isFalse);
    });

    test('network error on verify leaves the screen as it was', () async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      h.auth.verifyErrors.add(const SocketException('offline'));
      expect(await h.flow.verify('123456'), AuthStep.stay);
      expect(h.flow.lastFailure, AuthFailure.offline);
      expect(h.state.phase, CodePhase.idle);
    });

    test('returning parent goes home; sign-in never creates an account', () async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      h.flow.begin(AuthPurpose.signin, email: 'parent@example.com');
      await h.flow.sendCode();
      expect(h.sent, ['parent@example.com:false']);
      expect(await h.flow.verify('123456'), AuthStep.home);
      expect(h.container.read(onboardedProvider), isTrue);
      expect(h.parent.calls, isEmpty);
    });

    test('forgot PIN: code then new PIN, parent area unlocked', () async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      h.flow.begin(AuthPurpose.recovery, email: 'parent@example.com');
      await h.flow.sendCode();
      expect(h.sent, ['parent@example.com:false']);
      expect(await h.flow.verify('123456'), AuthStep.newPin);
      final r = await h.flow.saveNewPin('7391');
      expect(r.ok, isTrue);
      expect(h.parent.calls, ['pin:7391']);
      expect(h.container.read(parentUnlockedProvider), isTrue);
    });

    test('server rejects a weak PIN', () async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      h.parent.setPinError = const sb.PostgrestException(message: 'pin_weak');
      final r = await h.flow.saveNewPin('1234');
      expect(r.ok, isFalse);
      expect(r.issue, PinIssue.weak);
      expect(h.container.read(parentUnlockedProvider), isFalse);
    });

  });

  group('screens', () {
    Future<(ProviderContainer, GoRouter)> pump(WidgetTester tester, Harness h, Widget screen) async {
      tester.view.physicalSize = const Size(390, 1000);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      final router = GoRouter(routes: [
        GoRoute(path: '/', builder: (_, _) => screen),
        for (final p in ['/region', '/code', '/joined', '/home', '/parent', '/pin/create', '/screen/:id'])
          GoRoute(path: p, builder: (_, s) => Text('at ${s.uri}')),
      ]);
      await tester.pumpWidget(UncontrolledProviderScope(
        container: h.container,
        child: MaterialApp.router(theme: AppTheme.light, routerConfig: router),
      ));
      await tester.pump();
      return (h.container, router);
    }

    Future<void> tapDigits(WidgetTester tester, String digits) async {
      for (final d in digits.split('')) {
        await tester.tap(find.text(d).first);
        await tester.pump();
      }
    }

    testWidgets('PIN: weak PIN shows the too-easy state', (tester) async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      await pump(tester, h, const PinScreen());
      await tapDigits(tester, '1234');
      await tester.tap(find.text('Next'));
      await tester.pump();
      expect(find.textContaining('Please choose a harder PIN', findRichText: true), findsOneWidget);
      await tester.tap(find.text('Choose a new PIN'));
      await tester.pump();
      expect(find.textContaining('Please choose a harder PIN', findRichText: true), findsNothing);
      expect(find.text('Choose a 4-digit parent PIN'), findsOneWidget);
    });

    testWidgets('PIN: mismatch, then match goes to region', (tester) async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      final (_, router) = await pump(tester, h, const PinScreen());
      await tapDigits(tester, '2580');
      await tester.tap(find.text('Next'));
      await tester.pump();
      expect(find.text('Type your PIN once more'), findsOneWidget);
      await tapDigits(tester, '2589');
      await tester.tap(find.text('Next'));
      await tester.pump();
      expect(find.textContaining('The two PINs do not match', findRichText: true), findsOneWidget);
      await tester.tap(find.text('Try again'));
      await tester.pump();
      await tapDigits(tester, '2580');
      await tester.tap(find.text('Next'));
      await tester.pumpAndSettle();
      expect(h.state.pin, '2580');
      expect(router.state.uri.path, '/region');
    });

    testWidgets('email: invalid address shows the error and sends nothing', (tester) async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      await pump(tester, h, const EmailScreen(mode: EmailMode.signup));
      await tester.enterText(find.byType(TextField), 'parent@example');
      await tester.tap(find.text('Send my code'));
      await tester.pump();
      expect(find.textContaining('part is missing after the @'), findsOneWidget);
      expect(h.sent, isEmpty);
    });

    testWidgets('email: valid address sends the code and opens the code screen', (tester) async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      final (_, router) = await pump(tester, h, const EmailScreen(mode: EmailMode.signup));
      await tester.enterText(find.byType(TextField), 'parent@example.com');
      await tester.tap(find.text('Send my code'));
      await tester.pumpAndSettle();
      expect(h.sent, ['parent@example.com:true']);
      expect(router.state.uri.path, '/code');
    });

    testWidgets('code: wrong code shows tries left, right code goes to joined', (tester) async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      h.flow.setEmail('parent@example.com');
      await h.flow.sendCode();
      h.auth.verifyErrors.add(const sb.AuthException('Token has expired or is invalid', code: 'otp_expired'));
      final (_, router) = await pump(tester, h, const CodeScreen());
      await tapDigits(tester, '481902');
      await tester.tap(find.text('Verify'));
      await tester.pump();
      await tester.pump();
      expect(find.textContaining('That code is not right', findRichText: true), findsOneWidget);
      expect(find.textContaining('2 tries left', findRichText: true), findsOneWidget);
      await tester.tap(find.text('Try again'));
      await tester.pump();
      await tapDigits(tester, '123456');
      await tester.tap(find.text('Verify'));
      await tester.pumpAndSettle();
      expect(router.state.uri.path, '/joined');
    });

    testWidgets('code: resend waits for the cooldown', (tester) async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      h.flow.setEmail('parent@example.com');
      await pump(tester, h, const CodeScreen());
      expect(find.text('Resend in 0:30'), findsOneWidget);
      await tester.pump(const Duration(seconds: 31));
      expect(find.text('Send me a new code'), findsOneWidget);
      await tester.tap(find.text('Send me a new code'));
      await tester.pump();
      expect(h.sent, ['parent@example.com:true']);
      expect(find.textContaining('Resend in'), findsOneWidget);
    });

    testWidgets('gallery variants carry their canvas ids', (tester) async {
      final h = await Harness.create();
      addTearDown(h.container.dispose);
      for (final (id, w) in <(String, Widget)>[
        ('au-02-pin-weak', const PinScreen(forced: PinView.weak)),
        ('au-03-pin-mismatch', const PinScreen(forced: PinView.mismatch)),
        ('au-08-code-wrong', const CodeScreen(forced: CodePhase.wrong)),
        ('au-09-code-expired', const CodeScreen(forced: CodePhase.expired)),
        ('au-10-code-sending', const CodeScreen(forced: CodePhase.verifying)),
        ('au-15-signin-error', const EmailScreen(mode: EmailMode.signin, forced: EmailView.notFound)),
      ]) {
        await pump(tester, h, w);
        expect(find.byKey(Key('screen-$id')), findsOneWidget, reason: id);
      }
    });
  });

  test('ScreenState import stays used', () => expect(ScreenState.values.length, 5));
}
