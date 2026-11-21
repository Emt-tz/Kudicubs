/// Pure rules and small helpers shared by the wallet, progress and profile screens.
/// Nothing in here touches widgets, so it is covered by test/wallet_profile_test.dart.
library;

import 'dart:math' as math;

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/data/repositories.dart';

// ---- XP and levels ---------------------------------------------------------

/// XP needed for one level (same rule as the home screen: level = 1 + xp ~/ 300).
const xpPerLevel = 300;

int levelForXp(int xp) => 1 + math.max(0, xp) ~/ xpPerLevel;

/// XP collected inside the current level, 0..299.
int xpIntoLevel(int xp) => math.max(0, xp) % xpPerLevel;

const _levelNames = [
  'Market Visitor',
  'Market Helper',
  'Market Trader',
  'Market Keeper',
  'Market Planner',
  'Market Champion',
];

String levelName(int level) => _levelNames[math.min(math.max(level, 1), _levelNames.length) - 1];

String levelLabel(int xp) {
  final l = levelForXp(xp);
  return 'Level $l · ${levelName(l)}';
}

// ---- Skills (pillars) derived from attempts --------------------------------

enum Pillar {
  know('Know'),
  understand('Understand'),
  decide('Decide'),
  invest('Invest'),
  share('Share');

  const Pillar(this.label);
  final String label;
}

/// Which skill each seeded mission grows.
const missionPillars = <String, Pillar>{
  'm_4_6_lost_coins': Pillar.know,
  'm_4_6_picnic': Pillar.decide,
  'm_4_6_bicycle': Pillar.decide,
  'm_4_6_playground': Pillar.share,
  'm_4_6_rainy_umbrella': Pillar.understand,
  'm_7_9_birthday_party': Pillar.decide,
  'm_7_9_lemonade': Pillar.understand,
  'm_7_9_toy_shop': Pillar.know,
  'm_7_9_pizza_festival': Pillar.share,
  'm_10_12_clothing_brand': Pillar.invest,
  'm_10_12_keep_running': Pillar.decide,
  'm_10_12_business_island': Pillar.understand,
  'm_10_12_battle_of_brands': Pillar.know,
  'm_13_15_side_hustle': Pillar.know,
  'm_13_15_budget_boss': Pillar.decide,
  'm_13_15_investment_arena': Pillar.invest,
  'm_13_15_big_purchase': Pillar.understand,
};

/// Each different mission finished grows its skill by this many percent.
const pillarStep = 25;

bool _finished(Attempt a) => a.outcome == AttemptOutcome.success || a.outcome == AttemptOutcome.gentle;

/// 0..100 per skill: [pillarStep] per different finished mission. Failed or left
/// attempts add nothing and never take anything away.
Map<Pillar, int> pillarPercents(Iterable<Attempt> attempts) {
  final done = {for (final p in Pillar.values) p: <String>{}};
  for (final a in attempts) {
    final p = missionPillars[a.missionId];
    if (p != null && _finished(a)) done[p]!.add(a.missionId);
  }
  return {for (final p in Pillar.values) p: math.min(100, done[p]!.length * pillarStep)};
}

// ---- Wallet ----------------------------------------------------------------

/// Balances from an event list, same maths as the SQL view `child_balances`.
Balances balancesFromEvents(Iterable<WalletEvent> events, {Balances start = const Balances()}) =>
    events.fold<Balances>(start, (b, e) => b.apply(e));

/// The events the child sees in "What happened" (XP is shown on Progress instead).
List<WalletEvent> walletHistory(List<WalletEvent> events) => [
      for (final e in events)
        if (e.kind != WalletKind.xp) e,
    ];

String eventTitle(WalletEvent e) {
  final l = e.label.trim();
  if (l.isEmpty) {
    return switch (e.kind) {
      WalletKind.earn => 'Coins earned',
      WalletKind.spend => 'Spent',
      WalletKind.save => 'Saved in the jar',
      WalletKind.bonus => 'Bonus',
      WalletKind.daily => 'Daily coins',
      WalletKind.xp => 'XP',
    };
  }
  if (l.contains(' ')) return l;
  // Keys such as `history.market_walk` become "Market walk".
  final words = l.split('.').last.replaceAll('_', ' ').trim();
  return words.isEmpty ? l : words[0].toUpperCase() + words.substring(1);
}

String eventAmountText(WalletEvent e) => switch (e.kind) {
      WalletKind.earn || WalletKind.bonus || WalletKind.daily => '+${e.amount}',
      WalletKind.spend => '−${e.amount}',
      WalletKind.save || WalletKind.xp => '${e.amount}',
    };

String dayLabel(DateTime when, DateTime now) {
  final a = DateTime(when.year, when.month, when.day);
  final b = DateTime(now.year, now.month, now.day);
  final days = b.difference(a).inDays;
  if (days <= 0) return 'Today';
  if (days == 1) return 'Yesterday';
  if (days < 7) return '$days days ago';
  return '${when.day} ${monthName(when.month)}';
}

const _months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

String monthName(int month) => _months[math.min(11, math.max(0, month - 1))];

enum WalletActionResult { done, queued, insufficient, invalid, failed }

/// Appends a `spend` or `save` event. Coins can never go below zero: the balance is
/// re-read first and the event is only written when it covers [amount]. Events are
/// only ever added, never edited; when offline the repository queues the event.
Future<WalletActionResult> appendCoinsOut(
  WalletRepository repo, {
  required String childId,
  required WalletKind kind,
  required int amount,
  String label = '',
}) async {
  if (kind != WalletKind.spend && kind != WalletKind.save) throw ArgumentError.value(kind, 'kind', 'spend or save only');
  if (amount <= 0) return WalletActionResult.invalid;
  final Balances current;
  try {
    current = await repo.balances(childId);
  } catch (_) {
    return WalletActionResult.failed;
  }
  if (amount > current.coins) return WalletActionResult.insufficient;
  try {
    final r = await repo.addEvent(childId: childId, kind: kind, amount: amount, label: label);
    return r.queued ? WalletActionResult.queued : WalletActionResult.done;
  } catch (_) {
    return WalletActionResult.failed;
  }
}

/// "Try again": replays anything waiting in the outboxes, then reloads the child's data.
Future<void> retryWalletLoad(WidgetRef ref, String? childId) async {
  final attempts = ref.read(attemptsRepositoryProvider);
  final wallet = ref.read(walletRepositoryProvider);
  try {
    await attempts.flush();
    await wallet.flush();
  } catch (_) {
    // Still offline: the events stay queued and nothing is lost.
  }
  if (!ref.context.mounted) return;
  ref.invalidate(childrenProvider);
  if (childId != null) {
    ref.invalidate(balancesProvider(childId));
    ref.invalidate(walletEventsProvider(childId));
    ref.invalidate(attemptsProvider(childId));
    ref.invalidate(badgesProvider(childId));
  }
}

// ---- Badges ----------------------------------------------------------------

const _badgeText = {
  'badge.first_coins': 'You found your very first coins. Every full jar starts with one!',
  'badge.kind_friend': 'You shared with a friend. Kind friends make the market fun for everyone.',
  'badge.early_bird': 'You played a mission before lunch time. Great way to start the day!',
  'badge.hard_worker': 'Finish 5 missions. Hard work pays off, one mission at a time.',
  'badge.smart_sorter': 'Sort what you need from what you want. Clever choices add up.',
  'badge.smart_saver': 'Put 40 coins into the jar and keep them there. Saving a little each time adds up.',
  'badge.market_explorer': 'Try 3 different missions and see the whole market.',
  'badge.pride_star': 'You shone bright at the market. This star is yours!',
};

String badgeDescription(String id) => _badgeText[id] ?? 'Keep playing missions to earn this badge.';

/// How far a child is towards a locked badge, when that can be derived from real data.
class BadgeProgress {
  const BadgeProgress({required this.label, required this.current, required this.goal, required this.unit});

  final String label;
  final int current;
  final int goal;
  final String unit;

  double get fraction => goal <= 0 ? 0 : math.min(1.0, current / goal);
  String get text => '$current of $goal $unit';
}

BadgeProgress? badgeProgress(String badgeId, {required Balances balances, required List<Attempt> attempts}) {
  final finished = attempts.where(_finished);
  switch (badgeId) {
    case 'badge.smart_saver':
      return BadgeProgress(label: 'Your jar', current: math.min(balances.saved, 40), goal: 40, unit: 'coins');
    case 'badge.hard_worker':
      return BadgeProgress(label: 'Your missions', current: math.min(finished.length, 5), goal: 5, unit: 'missions');
    case 'badge.market_explorer':
      final distinct = finished.map((a) => a.missionId).toSet().length;
      return BadgeProgress(label: 'Your missions', current: math.min(distinct, 3), goal: 3, unit: 'missions');
  }
  return null;
}

// ---- Profile ----------------------------------------------------------------

/// Avatars a child can pick. The database stores these ids in `child_profiles.avatar`.
const avatarChoices = ['cub-friend-1', 'cub-friend-2', 'cub-friend-3', 'cub-friend-4'];

/// Whether Kudi speaks (Profile). Only audible when sound is on. Default on, persisted.
class KudiVoiceNotifier extends Notifier<bool> {
  static const prefKey = 'kudiVoice';

  @override
  bool build() => ref.watch(sharedPrefsProvider).getBool(prefKey) ?? true;

  Future<void> set(bool value) async {
    state = value;
    await ref.read(sharedPrefsProvider).setBool(prefKey, value);
  }
}

final kudiVoiceProvider = NotifierProvider<KudiVoiceNotifier, bool>(KudiVoiceNotifier.new);
