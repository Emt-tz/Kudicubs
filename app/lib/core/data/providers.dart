import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;

import '../env.dart';
import 'models.dart';
import 'repositories.dart';

// ---- Infrastructure -------------------------------------------------------

/// Overridden in main() (and in tests) with the real / a fake instance.
final sharedPrefsProvider = Provider<SharedPreferences>((ref) => throw UnimplementedError('override sharedPrefsProvider'));

final supabaseClientProvider = Provider<sb.SupabaseClient>((ref) => sb.Supabase.instance.client);

final authRepositoryProvider = Provider((ref) => AuthRepository(ref.watch(supabaseClientProvider)));
final childrenRepositoryProvider = Provider((ref) => ChildrenRepository(ref.watch(supabaseClientProvider)));
final walletRepositoryProvider =
    Provider((ref) => WalletRepository(ref.watch(supabaseClientProvider), ref.watch(sharedPrefsProvider)));
final attemptsRepositoryProvider =
    Provider((ref) => AttemptsRepository(ref.watch(supabaseClientProvider), ref.watch(sharedPrefsProvider)));
final badgesRepositoryProvider = Provider((ref) => BadgesRepository(ref.watch(supabaseClientProvider)));
final missionsRepositoryProvider = Provider((ref) => MissionsRepository(ref.watch(supabaseClientProvider)));
final parentRepositoryProvider = Provider((ref) => ParentRepository(ref.watch(supabaseClientProvider)));

// ---- Session & connectivity ----------------------------------------------

/// Current Supabase session (null = signed out). Emits immediately, then on every auth change.
final sessionProvider = StreamProvider<sb.Session?>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final controller = StreamController<sb.Session?>();
  controller.add(auth.currentSession);
  final sub = auth.sessionChanges.listen(controller.add, onError: controller.addError);
  ref.onDispose(() {
    sub.cancel();
    controller.close();
  });
  return controller.stream;
});

/// True while the API answers. Re-checked every 10 s; replays the outboxes on reconnect.
/// Call `ref.read(onlineProvider.notifier).check()` after a failed request to refresh sooner.
class OnlineNotifier extends Notifier<bool> {
  @override
  bool build() {
    final timer = Timer.periodic(const Duration(seconds: 10), (_) => check());
    ref.onDispose(timer.cancel);
    Future.microtask(check);
    return true;
  }

  Future<bool> check() async {
    final ok = await _reachable();
    if (!ref.mounted) return ok;
    final wasOffline = !state;
    state = ok;
    if (ok && wasOffline) await syncOutboxes(ref);
    return ok;
  }

  Future<bool> _reachable() async {
    final client = HttpClient()..connectionTimeout = const Duration(seconds: 4);
    try {
      final req = await client.getUrl(Uri.parse('${Env.supabaseUrl}/auth/v1/health'));
      req.headers.set('apikey', Env.supabaseAnonKey);
      final res = await req.close().timeout(const Duration(seconds: 4));
      await res.drain<void>();
      return res.statusCode < 500;
    } catch (_) {
      return false;
    } finally {
      client.close(force: true);
    }
  }
}

final onlineProvider = NotifierProvider<OnlineNotifier, bool>(OnlineNotifier.new);

/// Replays queued attempts, then wallet events (events may reference attempts).
Future<void> syncOutboxes(Ref ref) async {
  await ref.read(attemptsRepositoryProvider).flush();
  await ref.read(walletRepositoryProvider).flush();
  ref.invalidate(balancesProvider);
  ref.invalidate(walletEventsProvider);
}

// ---- App-level flags -----------------------------------------------------------

/// Persisted boolean flag helper.
abstract class _PrefFlag extends Notifier<bool> {
  String get key;
  bool get initial => false;

  @override
  bool build() => ref.watch(sharedPrefsProvider).getBool(key) ?? initial;

  Future<void> set(bool value) async {
    state = value;
    await ref.read(sharedPrefsProvider).setBool(key, value);
  }
}

/// True once onboarding finished (welcome -> gate -> PIN -> email code -> joined).
class OnboardedNotifier extends _PrefFlag {
  @override
  String get key => 'onboarded';
}

final onboardedProvider = NotifierProvider<OnboardedNotifier, bool>(OnboardedNotifier.new);

/// Whether the child's sound is on (Profile screen). Default on.
class SoundNotifier extends _PrefFlag {
  @override
  String get key => 'sound';
  @override
  bool get initial => true;
}

final soundOnProvider = NotifierProvider<SoundNotifier, bool>(SoundNotifier.new);

/// In-memory: true after the grown-up gate and PIN were passed this session. Never persisted.
class ParentUnlockNotifier extends Notifier<bool> {
  @override
  bool build() => false;
  void unlock() => state = true;
  void lock() => state = false;
}

final parentUnlockedProvider = NotifierProvider<ParentUnlockNotifier, bool>(ParentUnlockNotifier.new);

enum SystemStatus { ok, maintenance, updateRequired, serverError }

/// Set to anything but `ok` to make the router show the matching system screen.
class SystemStatusNotifier extends Notifier<SystemStatus> {
  @override
  SystemStatus build() => SystemStatus.ok;
  void set(SystemStatus s) => state = s;
}

final systemStatusProvider = NotifierProvider<SystemStatusNotifier, SystemStatus>(SystemStatusNotifier.new);

// ---- Children --------------------------------------------------------------

class ChildrenNotifier extends AsyncNotifier<List<Child>> {
  ChildrenRepository get _repo => ref.read(childrenRepositoryProvider);

  @override
  Future<List<Child>> build() async {
    // Rebuilds on sign-in / sign-out.
    final session = await ref.watch(sessionProvider.future);
    return session == null ? const [] : _repo.list();
  }

  Future<void> reload() async {
    ref.invalidateSelf();
    await future;
  }

  Future<Child> add({required String nickname, required AgeBand ageBand, required Region region, required String avatar}) async {
    final c = await _repo.add(nickname: nickname, ageBand: ageBand, region: region, avatar: avatar);
    state = AsyncData([...?state.value, c]);
    return c;
  }

  Future<void> edit(Child child) async {
    final c = await _repo.update(child);
    state = AsyncData([for (final x in state.value ?? const <Child>[]) x.id == c.id ? c : x]);
  }

  Future<void> remove(String id) async {
    await _repo.remove(id);
    state = AsyncData([for (final x in state.value ?? const <Child>[]) if (x.id != id) x]);
  }
}

final childrenProvider = AsyncNotifierProvider<ChildrenNotifier, List<Child>>(ChildrenNotifier.new);

/// Id of the child who is playing, persisted. Null = use the first child.
class CurrentChildIdNotifier extends Notifier<String?> {
  @override
  String? build() => ref.watch(sharedPrefsProvider).getString('currentChildId');

  Future<void> select(String id) async {
    state = id;
    await ref.read(sharedPrefsProvider).setString('currentChildId', id);
  }
}

final currentChildIdProvider = NotifierProvider<CurrentChildIdNotifier, String?>(CurrentChildIdNotifier.new);

/// The selected child (falls back to the first one; data null = no children yet).
final currentChildProvider = Provider<AsyncValue<Child?>>((ref) {
  final id = ref.watch(currentChildIdProvider);
  return ref.watch(childrenProvider).whenData((list) {
    if (list.isEmpty) return null;
    return list.firstWhere((c) => c.id == id, orElse: () => list.first);
  });
});

// ---- Per-child data (family providers take the child id) ------------------------

final balancesProvider =
    FutureProvider.family<Balances, String>((ref, childId) => ref.watch(walletRepositoryProvider).balances(childId));

final walletEventsProvider = FutureProvider.family<List<WalletEvent>, String>(
    (ref, childId) => ref.watch(walletRepositoryProvider).events(childId));

final attemptsProvider =
    FutureProvider.family<List<Attempt>, String>((ref, childId) => ref.watch(attemptsRepositoryProvider).list(childId));

/// All badges for the child, `earned` set on the ones they own.
final badgesProvider =
    FutureProvider.family<List<Badge>, String>((ref, childId) => ref.watch(badgesRepositoryProvider).forChild(childId));

/// Missions of one age band, in play order.
final missionsProvider =
    FutureProvider.family<List<Mission>, AgeBand>((ref, band) => ref.watch(missionsRepositoryProvider).list(band: band));

final parentProvider = FutureProvider<Parent?>((ref) async {
  final session = await ref.watch(sessionProvider.future);
  return session == null ? null : ref.watch(parentRepositoryProvider).current();
});
