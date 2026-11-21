import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart' hide Session;
import 'package:supabase_flutter/supabase_flutter.dart' as sb show Session;
import 'package:uuid/uuid.dart';

import 'models.dart';
import 'outbox.dart';

const _uuid = Uuid();

/// Postgres unique violation: the row is already there, so a replay succeeded earlier.
bool _isDuplicate(Object e) => e is PostgrestException && e.code == '23505';

/// Email one-time-code sign-in. Children never sign in.
class AuthRepository {
  AuthRepository(this._client);
  final SupabaseClient _client;

  Future<void> sendCode(String email) => _client.auth.signInWithOtp(email: email.trim(), shouldCreateUser: true);

  /// Throws [AuthException] when the code is wrong or expired.
  Future<sb.Session?> verifyCode(String email, String code) async =>
      (await _client.auth.verifyOTP(type: OtpType.email, email: email.trim(), token: code.trim())).session;

  Future<void> signOut() => _client.auth.signOut();

  sb.Session? get currentSession => _client.auth.currentSession;

  Stream<sb.Session?> get sessionChanges => _client.auth.onAuthStateChange.map((s) => s.session);
}

class ChildrenRepository {
  ChildrenRepository(this._client);
  final SupabaseClient _client;

  Future<List<Child>> list() async {
    final rows = await _client.from('child_profiles').select().isFilter('deleted_at', null).order('created_at');
    return rows.map(Child.fromJson).toList();
  }

  Future<Child> add({required String nickname, required AgeBand ageBand, required Region region, required String avatar}) async {
    final row = await _client
        .from('child_profiles')
        .insert({
          'parent_id': _client.auth.currentUser!.id,
          'nickname': nickname,
          'age_band': ageBand.db,
          'region': region.db,
          'avatar': avatar,
        })
        .select()
        .single();
    return Child.fromJson(row);
  }

  Future<Child> update(Child child) async {
    final row = await _client.from('child_profiles').update(child.toUpdateJson()).eq('id', child.id).select().single();
    return Child.fromJson(row);
  }

  /// Soft delete (hidden from the list; the event log stays intact).
  Future<void> remove(String id) =>
      _client.from('child_profiles').update({'deleted_at': DateTime.now().toUtc().toIso8601String()}).eq('id', id);
}

/// Wallet = append-only events. Writes that fail are queued and replayed by [flush].
class WalletRepository {
  WalletRepository(this._client, this._prefs) : _outbox = Outbox(_prefs, 'outbox.wallet');
  final SupabaseClient _client;
  final SharedPreferences _prefs;
  final Outbox _outbox;

  int get pending => _outbox.length;

  List<WalletEvent> _pending(String childId) =>
      _outbox.items().map(WalletEvent.fromJson).where((e) => e.childId == childId).toList();

  /// Server balances, or the last known ones when offline, plus anything still queued.
  Future<Balances> balances(String childId) async {
    final key = 'balances.$childId';
    Balances base;
    try {
      final row = await _client.from('child_balances').select().eq('child_id', childId).maybeSingle();
      base = row == null ? const Balances() : Balances.fromJson(row);
      await _prefs.setString(key, '${base.coins},${base.saved},${base.xp}');
    } catch (_) {
      final cached = _prefs.getString(key)?.split(',');
      if (cached == null || cached.length != 3) rethrow;
      base = Balances(coins: int.parse(cached[0]), saved: int.parse(cached[1]), xp: int.parse(cached[2]));
    }
    // Queued events are not in the server total yet.
    return _pending(childId).fold<Balances>(base, (b, e) => b.apply(e));
  }

  Future<List<WalletEvent>> events(String childId, {int limit = 200}) async {
    final rows = await _client
        .from('wallet_events')
        .select()
        .eq('child_id', childId)
        .order('created_at', ascending: false)
        .limit(limit);
    final remote = rows.map(WalletEvent.fromJson).toList();
    final ids = remote.map((e) => e.id).toSet();
    return [..._pending(childId).where((e) => !ids.contains(e.id)), ...remote];
  }

  /// Appends an event. Never throws for connectivity problems: the event is
  /// queued and `queued` is true. The returned event is what the screen should show.
  Future<({WalletEvent event, bool queued})> addEvent({
    required String childId,
    required WalletKind kind,
    required int amount,
    String label = '',
    String? attemptId,
  }) async {
    final event = WalletEvent(
      id: _uuid.v4(),
      childId: childId,
      kind: kind,
      amount: amount,
      label: label,
      attemptId: attemptId,
      createdAt: DateTime.now(),
    );
    try {
      await _send(event.toJson());
      return (event: event, queued: false);
    } catch (_) {
      await _outbox.add(event.toJson());
      return (event: event, queued: true);
    }
  }

  Future<void> _send(Map<String, dynamic> row) async {
    try {
      await _client.from('wallet_events').insert(row);
    } catch (e) {
      if (!_isDuplicate(e)) rethrow;
    }
  }

  /// Replays queued events in order. Returns how many were delivered.
  Future<int> flush() => _outbox.flush(_send);
}

class AttemptsRepository {
  AttemptsRepository(SupabaseClient client, SharedPreferences prefs)
      : _client = client,
        _outbox = Outbox(prefs, 'outbox.attempts');
  final SupabaseClient _client;
  final Outbox _outbox;

  int get pending => _outbox.length;

  Future<List<Attempt>> list(String childId) async {
    final rows = await _client.from('mission_attempts').select().eq('child_id', childId).order('started_at', ascending: false);
    return rows.map(Attempt.fromJson).toList();
  }

  /// Records a finished attempt (queued when offline). The returned id can be
  /// used as `attemptId` on wallet events: flush attempts before wallet.
  Future<({Attempt attempt, bool queued})> record({
    required String childId,
    required String missionId,
    required AttemptOutcome outcome,
    DateTime? startedAt,
  }) async {
    final now = DateTime.now();
    final attempt = Attempt(
      id: _uuid.v4(),
      childId: childId,
      missionId: missionId,
      outcome: outcome,
      startedAt: startedAt ?? now,
      finishedAt: now,
    );
    try {
      await _send(attempt.toJson());
      return (attempt: attempt, queued: false);
    } catch (_) {
      await _outbox.add(attempt.toJson());
      return (attempt: attempt, queued: true);
    }
  }

  Future<void> _send(Map<String, dynamic> row) async {
    try {
      await _client.from('mission_attempts').insert(row);
    } catch (e) {
      if (!_isDuplicate(e)) rethrow;
    }
  }

  Future<int> flush() => _outbox.flush(_send);
}

class BadgesRepository {
  BadgesRepository(this._client);
  final SupabaseClient _client;

  /// Every badge, with `earnedAt` set for the ones this child has.
  Future<List<Badge>> forChild(String childId) async {
    final all = await _client.from('badges').select().order('id');
    final earned = await _client.from('child_badges').select().eq('child_id', childId);
    final at = {for (final r in earned) r['badge_id'] as String: DateTime.parse(r['earned_at'] as String)};
    return all.map((r) {
      final b = Badge.fromJson(r);
      return b.withEarned(at[b.id]);
    }).toList();
  }

  /// Awards a badge once; awarding it again is a no-op.
  Future<void> award(String childId, String badgeId) async {
    try {
      await _client.from('child_badges').insert({'child_id': childId, 'badge_id': badgeId});
    } catch (e) {
      if (!_isDuplicate(e)) rethrow;
    }
  }
}

class MissionsRepository {
  MissionsRepository(this._client);
  final SupabaseClient _client;

  Future<List<Mission>> list({AgeBand? band}) async {
    var q = _client.from('missions').select().eq('published', true);
    if (band != null) q = q.eq('age_band', band.db);
    final rows = await q.order('position');
    return rows.map(Mission.fromJson).toList();
  }
}

class ParentRepository {
  ParentRepository(this._client);
  final SupabaseClient _client;

  Future<Parent?> current() async {
    final uid = _client.auth.currentUser?.id;
    if (uid == null) return null;
    final row = await _client
        .from('parents')
        .select('id,email,region,consented_at,pin_locked_until')
        .eq('id', uid)
        .maybeSingle();
    return row == null ? null : Parent.fromJson(row);
  }

  /// Throws a [PostgrestException] with message `pin_format` or `pin_weak` for bad PINs.
  Future<void> setPin(String pin) => _client.rpc('set_pin', params: {'pin': pin});

  Future<PinResult> verifyPin(String pin) async {
    final r = await _client.rpc('verify_pin', params: {'pin': pin});
    return switch (r) {
      'ok' => PinResult.ok,
      'locked' => PinResult.locked,
      _ => PinResult.wrong,
    };
  }

  Future<void> setRegion(Region region) async {
    await _client.from('parents').update({'region': region.db}).eq('id', _client.auth.currentUser!.id);
  }

  Future<void> giveConsent() async {
    await _client
        .from('parents')
        .update({'consented_at': DateTime.now().toUtc().toIso8601String()})
        .eq('id', _client.auth.currentUser!.id);
  }

  /// Everything the family owns as one JSON map (parent, children, wallet, attempts, badges, devices).
  Future<Map<String, dynamic>> exportFamily() async =>
      Map<String, dynamic>.from(await _client.rpc('export_my_family') as Map);

  /// Permanently deletes the account and all family data, then signs out locally.
  Future<void> deleteFamily() async {
    await _client.rpc('delete_my_family');
    await _client.auth.signOut(scope: SignOutScope.local);
  }
}
