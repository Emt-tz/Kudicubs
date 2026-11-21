/// Bundled content for ages 7–9: "Birthday Party" (prototype/assets/missions/band-7-9.js,
/// docs/design/mission-extracts/7-9.md). Amounts are game coins shown in the child's fictional currency.
library;

import '../../core/data/models.dart';

const String partyMissionId = 'm_7_9_birthday_party';
const String partyTitle = 'Birthday Party';
const String partyWorld = 'Build & Grow · Mission 1';

/// The most the child may spend (the canvas uses 50).
const int partyBudget = 50;

/// First success: 40 coins, 40 XP and the Smart Saver badge (prototype reward.badge). A replay gives 5 XP.
const int partyCoins = 40;
const int partyXp = 40;
const int partyReplayXp = 5;

/// Keeping an over-budget result still teaches something: a little XP, never a loss.
const int partyKeptXp = 10;
const String partyBadgeId = 'badge.smart_saver';

class PartyItem {
  const PartyItem(this.id, this.name, this.short, this.sub, this.cost);
  final String id;
  final String name;

  /// Used in sentences ("cake, balloons and games").
  final String short;
  final String sub;
  final int cost;
}

/// The three planned items plus a tempting speaker: all four together go over budget.
const List<PartyItem> partyItems = [
  PartyItem('cake', 'Cake', 'cake', 'Everyone shares it', 20),
  PartyItem('balloons', 'Balloons', 'balloons', 'Makes it feel special', 10),
  PartyItem('games', 'Party games', 'games', 'Fun for all guests', 15),
  PartyItem(
    'speaker',
    'Music speaker',
    'music',
    'Loud and fun for everyone',
    20,
  ),
];

String money(Region r, int n) => '${r.symbol} $n';

/// "cake, balloons and games".
String joinNames(List<String> names) {
  if (names.isEmpty) return '';
  if (names.length == 1) return names.first;
  return '${names.sublist(0, names.length - 1).join(', ')} and ${names.last}';
}
