/// Plain data classes mirroring supabase/migrations/20261121000100_core.sql.
library;

enum AgeBand {
  b4_6('b4_6', '4–6'),
  b7_9('b7_9', '7–9'),
  b10_12('b10_12', '10–12'),
  b13_15('b13_15', '13–15');

  const AgeBand(this.db, this.label);
  final String db;
  final String label;

  static AgeBand parse(String s) => values.firstWhere((b) => b.db == s, orElse: () => b4_6);
}

enum Region {
  gh('gh', 'Ghana', 'GH₵'),
  ng('ng', 'Nigeria', '₦'),
  uk('uk', 'United Kingdom', '£');

  const Region(this.db, this.label, this.symbol);
  final String db;
  final String label;

  /// Fictional currency symbol; no payment is ever taken.
  final String symbol;

  static Region parse(String s) => values.firstWhere((r) => r.db == s, orElse: () => gh);
}

enum WalletKind {
  earn,
  spend,
  save,
  bonus,
  daily,
  xp;

  static WalletKind parse(String s) => values.firstWhere((k) => k.name == s, orElse: () => earn);
}

enum AttemptOutcome {
  success,
  retry,
  gentle,
  left;

  static AttemptOutcome parse(String s) => values.firstWhere((o) => o.name == s, orElse: () => left);
}

enum PinResult { ok, wrong, locked }

DateTime? _date(Object? v) => v == null ? null : DateTime.parse(v as String);

class Parent {
  const Parent({required this.id, required this.email, required this.region, this.pinLockedUntil, this.consentedAt});

  final String id;
  final String email;
  final Region region;
  final DateTime? pinLockedUntil;
  final DateTime? consentedAt;

  bool get isLocked => pinLockedUntil != null && pinLockedUntil!.isAfter(DateTime.now());

  factory Parent.fromJson(Map<String, dynamic> j) => Parent(
        id: j['id'] as String,
        email: j['email'] as String,
        region: Region.parse(j['region'] as String),
        pinLockedUntil: _date(j['pin_locked_until']),
        consentedAt: _date(j['consented_at']),
      );
}

class Child {
  const Child({
    required this.id,
    required this.nickname,
    required this.ageBand,
    required this.region,
    required this.avatar,
  });

  final String id;
  final String nickname;
  final AgeBand ageBand;
  final Region region;
  final String avatar;

  factory Child.fromJson(Map<String, dynamic> j) => Child(
        id: j['id'] as String,
        nickname: j['nickname'] as String,
        ageBand: AgeBand.parse(j['age_band'] as String),
        region: Region.parse(j['region'] as String),
        avatar: j['avatar'] as String,
      );

  Child copyWith({String? nickname, AgeBand? ageBand, Region? region, String? avatar}) => Child(
        id: id,
        nickname: nickname ?? this.nickname,
        ageBand: ageBand ?? this.ageBand,
        region: region ?? this.region,
        avatar: avatar ?? this.avatar,
      );

  Map<String, dynamic> toUpdateJson() =>
      {'nickname': nickname, 'age_band': ageBand.db, 'region': region.db, 'avatar': avatar};
}

/// One row of the append-only wallet log. [id] is client-generated so replays are idempotent.
class WalletEvent {
  const WalletEvent({
    required this.id,
    required this.childId,
    required this.kind,
    required this.amount,
    this.label = '',
    this.attemptId,
    required this.createdAt,
  });

  final String id;
  final String childId;
  final WalletKind kind;
  final int amount;
  final String label;
  final String? attemptId;
  final DateTime createdAt;

  factory WalletEvent.fromJson(Map<String, dynamic> j) => WalletEvent(
        id: j['id'] as String,
        childId: j['child_id'] as String,
        kind: WalletKind.parse(j['kind'] as String),
        amount: (j['amount'] as num).toInt(),
        label: (j['label'] as String?) ?? '',
        attemptId: j['attempt_id'] as String?,
        createdAt: _date(j['created_at']) ?? DateTime.now(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'child_id': childId,
        'kind': kind.name,
        'amount': amount,
        'label': label,
        'attempt_id': attemptId,
        'created_at': createdAt.toUtc().toIso8601String(),
      };
}

class Attempt {
  const Attempt({
    required this.id,
    required this.childId,
    required this.missionId,
    required this.outcome,
    required this.startedAt,
    this.finishedAt,
  });

  final String id;
  final String childId;
  final String missionId;
  final AttemptOutcome outcome;
  final DateTime startedAt;
  final DateTime? finishedAt;

  factory Attempt.fromJson(Map<String, dynamic> j) => Attempt(
        id: j['id'] as String,
        childId: j['child_id'] as String,
        missionId: j['mission_id'] as String,
        outcome: AttemptOutcome.parse(j['outcome'] as String),
        startedAt: _date(j['started_at']) ?? DateTime.now(),
        finishedAt: _date(j['finished_at']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'child_id': childId,
        'mission_id': missionId,
        'outcome': outcome.name,
        'started_at': startedAt.toUtc().toIso8601String(),
        'finished_at': finishedAt?.toUtc().toIso8601String(),
      };
}

class Badge {
  const Badge({required this.id, required this.title, this.pillar, this.earnedAt});

  final String id;
  final String title;
  final String? pillar;

  /// Set when this badge belongs to a child's earned list.
  final DateTime? earnedAt;

  bool get earned => earnedAt != null;

  factory Badge.fromJson(Map<String, dynamic> j) =>
      Badge(id: j['id'] as String, title: j['title'] as String, pillar: j['pillar'] as String?);

  Badge withEarned(DateTime? at) => Badge(id: id, title: title, pillar: pillar, earnedAt: at);
}

class Mission {
  const Mission({required this.id, required this.ageBand, required this.world, required this.title, required this.position});

  final String id;
  final AgeBand ageBand;
  final String world;
  final String title;
  final int position;

  factory Mission.fromJson(Map<String, dynamic> j) => Mission(
        id: j['id'] as String,
        ageBand: AgeBand.parse(j['age_band'] as String),
        world: j['world'] as String,
        title: j['title'] as String,
        position: (j['position'] as num?)?.toInt() ?? 0,
      );
}

/// Derived from `child_balances` (+ any events still waiting in the outbox).
class Balances {
  const Balances({this.coins = 0, this.saved = 0, this.xp = 0});

  final int coins;
  final int saved;
  final int xp;

  factory Balances.fromJson(Map<String, dynamic> j) => Balances(
        coins: (j['coins'] as num?)?.toInt() ?? 0,
        saved: (j['saved'] as num?)?.toInt() ?? 0,
        xp: (j['xp'] as num?)?.toInt() ?? 0,
      );

  Map<String, dynamic> toJson() => {'coins': coins, 'saved': saved, 'xp': xp};

  /// Balance effect of one event, same maths as the SQL view.
  Balances apply(WalletEvent e) => switch (e.kind) {
        WalletKind.earn || WalletKind.bonus || WalletKind.daily => Balances(coins: coins + e.amount, saved: saved, xp: xp),
        WalletKind.spend => Balances(coins: coins - e.amount, saved: saved, xp: xp),
        WalletKind.save => Balances(coins: coins - e.amount, saved: saved + e.amount, xp: xp),
        WalletKind.xp => Balances(coins: coins, saved: saved, xp: xp + e.amount),
      };
}
