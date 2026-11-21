/// Data the parent area needs on top of the core repositories: this device's
/// mode (`devices` table), the per-child overview, and the narration flag.
library;

import 'dart:io' show Platform;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' as sb;
import 'package:uuid/uuid.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';

// ---- Device mode ------------------------------------------------------------------

/// `device_mode` enum in the database.
enum DeviceMode {
  myPhone('my-phone'),
  family('family');

  const DeviceMode(this.db);
  final String db;

  static DeviceMode? parse(String? s) {
    for (final m in values) {
      if (m.db == s) return m;
    }
    return null;
  }
}

/// Registers this phone in `devices` and remembers its mode (also cached locally, so it works offline).
class DeviceRepository {
  DeviceRepository(this._client, this._prefs);
  final sb.SupabaseClient _client;
  final SharedPreferences _prefs;

  static const _idKey = 'device.id';
  static const _modeKey = 'device.mode';

  /// Stable id of this install.
  String get deviceId {
    var id = _prefs.getString(_idKey);
    if (id == null) {
      id = const Uuid().v4();
      _prefs.setString(_idKey, id);
    }
    return id;
  }

  /// The saved mode: from the server when reachable, else the local copy. Null = never chosen.
  Future<DeviceMode?> mode() async {
    try {
      final row = await _client.from('devices').select('mode').eq('id', deviceId).maybeSingle();
      final m = DeviceMode.parse(row?['mode'] as String?);
      if (m != null) await _prefs.setString(_modeKey, m.db);
      return m ?? DeviceMode.parse(_prefs.getString(_modeKey));
    } catch (_) {
      return DeviceMode.parse(_prefs.getString(_modeKey));
    }
  }

  /// Saves the mode locally, then in `devices` (insert or update). Throws when the server refuses.
  Future<void> setMode(DeviceMode mode) async {
    await _prefs.setString(_modeKey, mode.db);
    await _client.from('devices').upsert({
      'id': deviceId,
      'parent_id': _client.auth.currentUser!.id,
      'label': _label(),
      'mode': mode.db,
      'last_seen': DateTime.now().toUtc().toIso8601String(),
    });
  }

  String _label() {
    try {
      return switch (Platform.operatingSystem) {
        'ios' => 'iPhone or iPad',
        'android' => 'Android phone',
        final os => os,
      };
    } catch (_) {
      return 'Phone';
    }
  }

  /// Clears everything stored on this install for the family (after delete / sign out of a deleted account).
  Future<void> forgetLocal() async {
    for (final k in _prefs.getKeys().toList()) {
      if (k.startsWith('device.') ||
          k.startsWith('outbox.') ||
          k.startsWith('balances.') ||
          k == 'currentChildId' ||
          k == 'narration') {
        await _prefs.remove(k);
      }
    }
  }
}

final deviceRepositoryProvider = Provider(
  (ref) => DeviceRepository(ref.watch(supabaseClientProvider), ref.watch(sharedPrefsProvider)),
);

final deviceModeProvider = FutureProvider<DeviceMode?>((ref) => ref.watch(deviceRepositoryProvider).mode());

// ---- Narration flag (Settings) -------------------------------------------------------

class NarrationNotifier extends Notifier<bool> {
  @override
  bool build() => ref.watch(sharedPrefsProvider).getBool('narration') ?? true;

  Future<void> set(bool value) async {
    state = value;
    await ref.read(sharedPrefsProvider).setBool('narration', value);
  }
}

final narrationOnProvider = NotifierProvider<NarrationNotifier, bool>(NarrationNotifier.new);

// ---- One child's overview -------------------------------------------------------------

class ChildOverview {
  const ChildOverview({
    required this.child,
    required this.balances,
    required this.attempts,
    required this.badges,
    required this.events,
    required this.missionTitles,
  });

  final Child child;
  final Balances balances;
  final List<Attempt> attempts;
  final List<Badge> badges;
  final List<WalletEvent> events;
  final Map<String, String> missionTitles;

  int get earnedBadges => badges.where((b) => b.earned).length;

  /// Nothing played yet (no attempts, no XP, no badges).
  bool get hasPlayed => attempts.isNotEmpty || balances.xp > 0 || earnedBadges > 0;
}

/// Every published mission by id (for titles in "Recent play").
final missionTitlesProvider = FutureProvider<Map<String, String>>((ref) async {
  final all = await ref.watch(missionsRepositoryProvider).list();
  return {for (final m in all) m.id: m.title};
});

/// The child plus everything shown on their parent page. Throws [StateError] when the child is gone.
final childOverviewProvider = FutureProvider.family<ChildOverview, String>((ref, id) async {
  final kids = await ref.watch(childrenProvider.future);
  final matches = kids.where((c) => c.id == id);
  if (matches.isEmpty) throw StateError('child not found');
  final (balances, attempts, badges, events, titles) = await (
    ref.watch(balancesProvider(id).future),
    ref.watch(attemptsProvider(id).future),
    ref.watch(badgesProvider(id).future),
    ref.watch(walletEventsProvider(id).future),
    ref.watch(missionTitlesProvider.future),
  ).wait;
  return ChildOverview(
    child: matches.first,
    balances: balances,
    attempts: attempts,
    badges: badges,
    events: events,
    missionTitles: titles,
  );
});
