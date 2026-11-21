import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:kudicubs/core/data/models.dart';
import 'package:kudicubs/core/data/providers.dart';
import 'package:kudicubs/core/data/repositories.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;

/// In-memory repositories so widget tests never touch the network.
/// Use `await fakeOverrides()` as `ProviderScope(overrides: ...)`.

const sampleChild = Child(id: 'c1', nickname: 'Ama', ageBand: AgeBand.b4_6, region: Region.gh, avatar: 'cub-friend-2');

class FakeAuth implements AuthRepository {
  @override
  Future<void> sendCode(String email) async {}
  @override
  Future<sb.Session?> verifyCode(String email, String code) async => null;
  @override
  Future<void> signOut() async {}
  @override
  sb.Session? get currentSession => null;
  @override
  Stream<sb.Session?> get sessionChanges => const Stream.empty();
}

class FakeChildren implements ChildrenRepository {
  final List<Child> items = [sampleChild];
  @override
  Future<List<Child>> list() async => List.of(items);
  @override
  Future<Child> add({required String nickname, required AgeBand ageBand, required Region region, required String avatar}) async {
    final c = Child(id: 'c${items.length + 1}', nickname: nickname, ageBand: ageBand, region: region, avatar: avatar);
    items.add(c);
    return c;
  }

  @override
  Future<Child> update(Child child) async => child;
  @override
  Future<void> remove(String id) async => items.removeWhere((c) => c.id == id);
}

class FakeWallet implements WalletRepository {
  final List<WalletEvent> log = [];
  @override
  int get pending => 0;
  @override
  Future<Balances> balances(String childId) async =>
      log.where((e) => e.childId == childId).fold<Balances>(const Balances(coins: 120, xp: 360), (b, e) => b.apply(e));
  @override
  Future<List<WalletEvent>> events(String childId, {int limit = 200}) async => log.reversed.toList();
  @override
  Future<({WalletEvent event, bool queued})> addEvent({
    required String childId,
    required WalletKind kind,
    required int amount,
    String label = '',
    String? attemptId,
  }) async {
    final e = WalletEvent(
        id: 'e${log.length}', childId: childId, kind: kind, amount: amount, label: label, attemptId: attemptId, createdAt: DateTime.now());
    log.add(e);
    return (event: e, queued: false);
  }

  @override
  Future<int> flush() async => 0;
}

class FakeAttempts implements AttemptsRepository {
  final List<Attempt> log = [];
  @override
  int get pending => 0;
  @override
  Future<List<Attempt>> list(String childId) async => log;
  @override
  Future<({Attempt attempt, bool queued})> record({
    required String childId,
    required String missionId,
    required AttemptOutcome outcome,
    DateTime? startedAt,
  }) async {
    final a = Attempt(id: 'a${log.length}', childId: childId, missionId: missionId, outcome: outcome, startedAt: DateTime.now());
    log.add(a);
    return (attempt: a, queued: false);
  }

  @override
  Future<int> flush() async => 0;
}

class FakeBadges implements BadgesRepository {
  @override
  Future<List<Badge>> forChild(String childId) async =>
      [Badge(id: 'badge.first_coins', title: 'First coins', earnedAt: DateTime(2026)), const Badge(id: 'badge.kind_friend', title: 'Kind friend')];
  @override
  Future<void> award(String childId, String badgeId) async {}
}

class FakeMissions implements MissionsRepository {
  @override
  Future<List<Mission>> list({AgeBand? band}) async =>
      [Mission(id: 'm1', ageBand: band ?? AgeBand.b4_6, world: 'market', title: 'The Lost Coins', position: 1)];
}

class FakeParent implements ParentRepository {
  @override
  Future<Parent?> current() async => const Parent(id: 'p1', email: 'parent@example.com', region: Region.gh);
  @override
  Future<void> setPin(String pin) async {}
  @override
  Future<PinResult> verifyPin(String pin) async => pin == '2580' ? PinResult.ok : PinResult.wrong;
  @override
  Future<void> setRegion(Region region) async {}
  @override
  Future<void> giveConsent() async {}
  @override
  Future<Map<String, dynamic>> exportFamily() async => {'children': []};
  @override
  Future<void> deleteFamily() async {}
}

/// Provider overrides with in-memory data; connectivity is fixed to [online].
Future<List<Override>> fakeOverrides({Map<String, Object> prefs = const {}, bool online = true}) async {
  SharedPreferences.setMockInitialValues(prefs);
  final p = await SharedPreferences.getInstance();
  return [
    sharedPrefsProvider.overrideWithValue(p),
    authRepositoryProvider.overrideWithValue(FakeAuth()),
    childrenRepositoryProvider.overrideWithValue(FakeChildren()),
    walletRepositoryProvider.overrideWithValue(FakeWallet()),
    attemptsRepositoryProvider.overrideWithValue(FakeAttempts()),
    badgesRepositoryProvider.overrideWithValue(FakeBadges()),
    missionsRepositoryProvider.overrideWithValue(FakeMissions()),
    parentRepositoryProvider.overrideWithValue(FakeParent()),
    onlineProvider.overrideWith(() => _FixedOnline(online)),
  ];
}

class _FixedOnline extends OnlineNotifier {
  _FixedOnline(this._v);
  final bool _v;
  @override
  bool build() => _v;
  @override
  Future<bool> check() async => _v;
}
