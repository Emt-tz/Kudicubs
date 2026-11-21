import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../onboarding/onboarding_state.dart';
import 'auth_logic.dart';

enum AuthPurpose { signup, signin, recovery }

enum CodePhase { idle, verifying, wrong, expired, tooMany }

/// Where the screen should go after a verified code.
enum AuthStep { stay, joined, home, newPin, finishLater }

/// Sends the emailed code. Sign-up may create the account; sign-in and PIN recovery never do.
typedef CodeSender = Future<void> Function(String email, {required bool createUser});

final codeSenderProvider = Provider<CodeSender>((ref) => (email, {required createUser}) {
      if (createUser) return ref.read(authRepositoryProvider).sendCode(email);
      return ref.read(supabaseClientProvider).auth.signInWithOtp(email: email.trim(), shouldCreateUser: false);
    });

class AuthFlowState {
  const AuthFlowState({
    this.purpose = AuthPurpose.signup,
    this.email = '',
    this.region = Region.gh,
    this.pin,
    this.sentAt,
    this.phase = CodePhase.idle,
    this.triesLeft = maxCodeTries,
    this.setupPending = false,
  });

  final AuthPurpose purpose;
  final String email;
  final Region region;

  /// The confirmed PIN, kept in memory only until the account exists.
  final String? pin;
  final DateTime? sentAt;
  final CodePhase phase;
  final int triesLeft;

  /// Verified, but the account setup could not finish (offline).
  final bool setupPending;

  AuthFlowState copyWith({
    AuthPurpose? purpose,
    String? email,
    Region? region,
    String? pin,
    bool clearPin = false,
    DateTime? sentAt,
    CodePhase? phase,
    int? triesLeft,
    bool? setupPending,
  }) =>
      AuthFlowState(
        purpose: purpose ?? this.purpose,
        email: email ?? this.email,
        region: region ?? this.region,
        pin: clearPin ? null : (pin ?? this.pin),
        sentAt: sentAt ?? this.sentAt,
        phase: phase ?? this.phase,
        triesLeft: triesLeft ?? this.triesLeft,
        setupPending: setupPending ?? this.setupPending,
      );
}

class AuthFlow extends Notifier<AuthFlowState> {
  DateTime Function() clock = DateTime.now;

  @override
  AuthFlowState build() => const AuthFlowState();

  void begin(AuthPurpose purpose, {String? email}) =>
      state = AuthFlowState(purpose: purpose, email: email ?? state.email, region: state.region, pin: state.pin);

  void setPin(String pin) => state = state.copyWith(pin: pin);
  void setRegion(Region r) => state = state.copyWith(region: r);
  void setEmail(String e) => state = state.copyWith(email: e.trim());
  void clearPhase() => state = state.copyWith(phase: CodePhase.idle);

  /// Emails a code to [AuthFlowState.email]. Returns null on success, or why it failed.
  Future<AuthFailure?> sendCode() async {
    try {
      await ref.read(codeSenderProvider)(state.email, createUser: state.purpose == AuthPurpose.signup);
      state = state.copyWith(sentAt: clock(), phase: CodePhase.idle, triesLeft: maxCodeTries);
      return null;
    } catch (e) {
      final f = mapAuthError(e);
      if (f == AuthFailure.offline) ref.read(onlineProvider.notifier).check();
      return f;
    }
  }

  /// Checks the typed code. On success the next step depends on the purpose.
  /// Returns the failure through [AuthFlowState.phase] (and [lastFailure] for network/unknown).
  AuthFailure? lastFailure;

  Future<AuthStep> verify(String code) async {
    lastFailure = null;
    state = state.copyWith(phase: CodePhase.verifying);
    try {
      await ref.read(authRepositoryProvider).verifyCode(state.email, code);
    } catch (e) {
      final f = mapAuthError(e, codeSentAt: state.sentAt, now: clock());
      lastFailure = f;
      switch (f) {
        case AuthFailure.expiredCode:
          state = state.copyWith(phase: CodePhase.expired);
        case AuthFailure.tooManyAttempts:
          state = state.copyWith(phase: CodePhase.tooMany, triesLeft: 0);
        case AuthFailure.wrongCode:
          final left = state.triesLeft - 1;
          state = state.copyWith(phase: left <= 0 ? CodePhase.tooMany : CodePhase.wrong, triesLeft: left < 0 ? 0 : left);
        default:
          if (f == AuthFailure.offline) ref.read(onlineProvider.notifier).check();
          state = state.copyWith(phase: CodePhase.idle);
      }
      return AuthStep.stay;
    }
    state = state.copyWith(phase: CodePhase.idle);
    switch (state.purpose) {
      case AuthPurpose.signup:
        return finishSignup();
      case AuthPurpose.signin:
        await ref.read(onboardedProvider.notifier).set(true);
        return AuthStep.home;
      case AuthPurpose.recovery:
        return AuthStep.newPin;
    }
  }

  /// After a verified first sign-up: PIN, region, child, consent. Every step can be repeated
  /// safely, so a failed attempt (offline) is retried by calling this again.
  Future<AuthStep> finishSignup() async {
    try {
      final pin = state.pin;
      if (pin != null) await ref.read(parentRepositoryProvider).setPin(pin);
      await ref.read(parentRepositoryProvider).setRegion(state.region);
      final kids = ref.read(childrenRepositoryProvider);
      final pending = ref.read(pendingChildProvider);
      if (pending.isComplete && (await kids.list()).isEmpty) {
        await kids.add(
          nickname: pending.nickname!.trim(),
          ageBand: pending.ageBand,
          region: state.region,
          avatar: pending.avatar!,
        );
      }
      await ref.read(parentRepositoryProvider).giveConsent();
      ref.invalidate(childrenProvider);
      ref.invalidate(parentProvider);
      await ref.read(pendingChildProvider.notifier).clear();
      await ref.read(onboardedProvider.notifier).set(true);
      state = state.copyWith(setupPending: false, clearPin: true);
      return AuthStep.joined;
    } catch (e) {
      lastFailure = mapAuthError(e);
      state = state.copyWith(setupPending: true);
      return AuthStep.finishLater;
    }
  }

  /// PIN recovery: after the emailed code, store the new PIN and open the parent area.
  /// Returns null on success, else the issue (weak/format) or `null` + [lastFailure].
  Future<({bool ok, PinIssue? issue})> saveNewPin(String pin) async {
    lastFailure = null;
    try {
      await ref.read(parentRepositoryProvider).setPin(pin);
      ref.read(parentUnlockedProvider.notifier).unlock();
      state = AuthFlowState(region: state.region);
      return (ok: true, issue: null);
    } catch (e) {
      final issue = pinIssueFromError(e);
      if (issue == null) lastFailure = mapAuthError(e);
      return (ok: false, issue: issue);
    }
  }
}

final authFlowProvider = NotifierProvider<AuthFlow, AuthFlowState>(AuthFlow.new);
