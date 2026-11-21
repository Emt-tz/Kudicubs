import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';

/// Avatar ids offered on the avatar screen (index 0..3 = the four colour friends).
const avatarIds = [
  'cub-friend-1',
  'cub-friend-2',
  'cub-friend-3',
  'cub-friend-4',
];

/// Short list of nicknames: no real names, no photos.
const nicknameChoices = ['Ama', 'Kofi', 'Zara', 'Tobi'];

/// The child chosen during onboarding, held on the device until the parent
/// finishes sign-up (the auth screens then create it on the server).
@immutable
class PendingChild {
  const PendingChild({this.nickname, this.ageBand = AgeBand.b4_6, this.avatar});

  final String? nickname;
  final AgeBand ageBand;
  final String? avatar;

  bool get isComplete => avatar != null && (nickname ?? '').isNotEmpty;

  PendingChild copyWith({String? nickname, AgeBand? ageBand, String? avatar}) =>
      PendingChild(
        nickname: nickname ?? this.nickname,
        ageBand: ageBand ?? this.ageBand,
        avatar: avatar ?? this.avatar,
      );
}

/// What is missing before "That's me!" can be pressed.
enum AvatarIssue { none, noAvatar, noName }

AvatarIssue validatePendingChild(PendingChild c) {
  if (c.avatar == null) return AvatarIssue.noAvatar;
  if ((c.nickname ?? '').trim().isEmpty) return AvatarIssue.noName;
  return AvatarIssue.none;
}

class PendingChildNotifier extends Notifier<PendingChild> {
  static const _kName = 'pending.nickname';
  static const _kBand = 'pending.ageBand';
  static const _kAvatar = 'pending.avatar';

  @override
  PendingChild build() {
    final p = ref.watch(sharedPrefsProvider);
    final band = p.getString(_kBand);
    return PendingChild(
      nickname: p.getString(_kName),
      ageBand: band == null ? AgeBand.b4_6 : AgeBand.parse(band),
      avatar: p.getString(_kAvatar),
    );
  }

  Future<void> setAgeBand(AgeBand band) async {
    state = state.copyWith(ageBand: band);
    await ref.read(sharedPrefsProvider).setString(_kBand, band.db);
  }

  Future<void> setAvatar(String avatar) async {
    state = state.copyWith(avatar: avatar);
    await ref.read(sharedPrefsProvider).setString(_kAvatar, avatar);
  }

  Future<void> setNickname(String nickname) async {
    state = state.copyWith(nickname: nickname);
    await ref.read(sharedPrefsProvider).setString(_kName, nickname);
  }

  /// Call after the child has been created on the server.
  Future<void> clear() async {
    state = const PendingChild();
    final p = ref.read(sharedPrefsProvider);
    await p.remove(_kName);
    await p.remove(_kBand);
    await p.remove(_kAvatar);
  }
}

final pendingChildProvider =
    NotifierProvider<PendingChildNotifier, PendingChild>(
      PendingChildNotifier.new,
    );

/// True once onboarding is finished. Same persisted flag as [onboardedProvider]
/// (the router's guard); `set(true)` flips both so there is one source of truth.
class OnboardingDoneNotifier extends Notifier<bool> {
  @override
  bool build() => ref.watch(onboardedProvider);

  Future<void> set(bool done) => ref.read(onboardedProvider.notifier).set(done);
}

final onboardingDoneProvider = NotifierProvider<OnboardingDoneNotifier, bool>(
  OnboardingDoneNotifier.new,
);

// ---- Grown-up gate ----------------------------------------------------------

enum GatePhase { hold, question, locked, passed }

enum GateCheck { empty, correct, wrong, locked }

/// Pure state machine for the grown-up gate: hold (3 s) -> maths question ->
/// 3 wrong answers lock the gate for 60 s -> fresh question. Widgets listen to it.
/// [now] and [random] are injectable so tests are deterministic.
class GateMachine extends ChangeNotifier {
  GateMachine({DateTime Function()? now, Random? random})
    : _now = now ?? DateTime.now,
      _random = random ?? Random() {
    _newQuestion();
  }

  static const holdDuration = Duration(seconds: 3);
  static const maxWrong = 3;
  static const lockDuration = Duration(seconds: 60);
  static const maxDigits = 2;

  final DateTime Function() _now;
  final Random _random;

  GatePhase _phase = GatePhase.hold;
  int _a = 0, _b = 0;
  String _entry = '';
  int _wrong = 0;
  bool _lastWasWrong = false;
  DateTime? _lockedUntil;

  GatePhase get phase => _phase;
  int get a => _a;
  int get b => _b;
  int get answer => _a * _b;
  String get questionText => 'What is $_a times $_b?';
  String get entry => _entry;
  int get wrongCount => _wrong;
  int get triesLeft => maxWrong - _wrong;
  DateTime? get lockedUntil => _lockedUntil;

  /// True right after a wrong answer, until the next digit is typed.
  bool get showWrong => _lastWasWrong && _phase == GatePhase.question;

  /// Whole seconds left on the lock (0 when not locked).
  int get lockSecondsLeft {
    final until = _lockedUntil;
    if (until == null) return 0;
    final ms = until.difference(_now()).inMilliseconds;
    return ms <= 0 ? 0 : (ms / 1000).ceil();
  }

  void _newQuestion() {
    final previous = _a * _b;
    do {
      _a = 3 + _random.nextInt(7); // 3..9
      _b = 3 + _random.nextInt(7);
    } while (_a * _b == previous);
    _entry = '';
  }

  /// The 3-second hold finished.
  void holdComplete() {
    if (_phase != GatePhase.hold) return;
    _phase = GatePhase.question;
    notifyListeners();
  }

  void digit(String d) {
    if (_phase != GatePhase.question || _entry.length >= maxDigits) return;
    _entry += d;
    _lastWasWrong = false;
    notifyListeners();
  }

  void delete() {
    if (_phase != GatePhase.question || _entry.isEmpty) return;
    _entry = _entry.substring(0, _entry.length - 1);
    notifyListeners();
  }

  GateCheck check() {
    if (_phase == GatePhase.locked) return GateCheck.locked;
    if (_phase != GatePhase.question || _entry.isEmpty) return GateCheck.empty;
    if (int.tryParse(_entry) == answer) {
      _phase = GatePhase.passed;
      _wrong = 0;
      notifyListeners();
      return GateCheck.correct;
    }
    _wrong++;
    if (_wrong >= maxWrong) {
      _phase = GatePhase.locked;
      _lockedUntil = _now().add(lockDuration);
      _lastWasWrong = false;
      _entry = '';
      notifyListeners();
      return GateCheck.locked;
    }
    _lastWasWrong = true;
    _newQuestion();
    notifyListeners();
    return GateCheck.wrong;
  }

  /// Called every second while locked: releases the lock when the wait is over.
  /// Returns true when it released.
  bool tick() {
    if (_phase != GatePhase.locked || lockSecondsLeft > 0) return false;
    _phase = GatePhase.question;
    _wrong = 0;
    _lockedUntil = null;
    _newQuestion();
    notifyListeners();
    return true;
  }

  /// Opening the gate again: start at the hold step, but never bypass a running lock.
  void restart() {
    if (_phase == GatePhase.locked && lockSecondsLeft > 0) return;
    _phase = GatePhase.hold;
    _wrong = 0;
    _lastWasWrong = false;
    _lockedUntil = null;
    _newQuestion();
  }

  // ---- Gallery presets (same machine, forced into a variant) ----------------

  void presetQuestion() {
    _phase = GatePhase.question;
    notifyListeners();
  }

  void presetWrong() {
    _phase = GatePhase.question;
    _wrong = 1;
    _lastWasWrong = true;
    notifyListeners();
  }

  void presetLocked({int secondsLeft = 60}) {
    _phase = GatePhase.locked;
    _wrong = maxWrong;
    _lockedUntil = _now().add(Duration(seconds: secondsLeft));
    notifyListeners();
  }
}

/// Lives for the whole app session so leaving the gate does not reset a lock-out.
final gateMachineProvider = Provider<GateMachine>((ref) {
  final m = GateMachine();
  ref.onDispose(m.dispose);
  return m;
});
