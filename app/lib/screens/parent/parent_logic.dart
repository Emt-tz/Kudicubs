/// Pure rules and formatting for the parent area. No widgets, no network:
/// covered by test/parent_test.dart.
library;

import 'dart:math' as math;

import 'package:flutter/painting.dart' show Color;

import '../../core/data/models.dart';
import '../../core/theme/tokens.dart';

/// A family can hold up to this many children.
const kMaxChildren = 5;

/// Nicknames come from a short list: no real names.
const kNicknameChoices = ['Ama', 'Kofi', 'Zara', 'Tobi', 'Efua', 'Chidi', 'Nia', 'Sam'];

/// Same limit as the database check on `child_profiles.nickname`.
const kNicknameMax = 20;

const kPinLength = 4;

/// `verify_pin` locks for 5 minutes after 5 wrong tries.
const kPinLockDuration = Duration(minutes: 5);

/// Typed to confirm deleting the family account.
const kDeleteWord = 'DELETE';

// ---- Add a child ---------------------------------------------------------------

enum AddChildProblem { noNickname, nicknameTooLong, tooMany }

/// First problem with a new child, or null when it can be added.
AddChildProblem? validateNewChild({required String? nickname, required int existingChildren}) {
  final n = nickname?.trim() ?? '';
  if (existingChildren >= kMaxChildren) return AddChildProblem.tooMany;
  if (n.isEmpty) return AddChildProblem.noNickname;
  if (n.length > kNicknameMax) return AddChildProblem.nicknameTooLong;
  return null;
}

/// The fix hint shown on the error banner (`pa-04-add-child-error`).
String addChildMessage(AddChildProblem p) => switch (p) {
  AddChildProblem.noNickname => 'Choose a nickname from the list to continue.',
  AddChildProblem.nicknameTooLong => 'Nicknames can have up to $kNicknameMax letters.',
  AddChildProblem.tooMany => 'A family can have up to $kMaxChildren children.',
};

/// The short line under the nickname list.
String addChildFieldHint(AddChildProblem p) => switch (p) {
  AddChildProblem.noNickname => 'Choose a nickname from the list',
  AddChildProblem.nicknameTooLong => 'Use a shorter nickname',
  AddChildProblem.tooMany => 'Remove a child to add another',
};

/// First nickname in the list that none of the [taken] children uses.
String? firstFreeNickname(Iterable<String> taken) {
  final used = taken.map((t) => t.toLowerCase()).toSet();
  for (final n in kNicknameChoices) {
    if (!used.contains(n.toLowerCase())) return n;
  }
  return null;
}

/// Avatars rotate through the four cubs.
String avatarForIndex(int index) => 'cub-friend-${index % 4 + 1}';

/// Circle colour for a child's avatar id.
Color avatarColor(String avatar) => switch (avatar) {
  'cub-friend-2' => Kc.orange,
  'cub-friend-3' => Kc.peach,
  'cub-friend-4' => Kc.softGold,
  _ => Kc.yellow,
};

// ---- Labels -----------------------------------------------------------------------

String currencyName(Region r) => switch (r) {
  Region.gh => 'cedi',
  Region.ng => 'naira',
  Region.uk => 'pound',
};

/// Market examples used in that country.
String regionExamples(Region r) => switch (r) {
  Region.gh => 'kelewele, sobolo',
  Region.ng => 'puff-puff, zobo',
  Region.uk => 'biscuit, lemonade',
};

String regionName(Region r) => '${r.label} (${r.symbol})';

/// `Age 4–6 · Ghana (GH₵)`, plus `· Level 2` when known.
String childSubtitle(Child c, {int? level}) =>
    'Age ${c.ageBand.label} · ${regionName(c.region)}${level == null ? '' : ' · Level $level'}';

/// Simple shape check; the server decides if the address is real.
bool isValidEmail(String s) => RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(s.trim());

String maskEmail(String email) {
  final at = email.indexOf('@');
  if (at <= 0) return email;
  return '${email[0]}***${email.substring(at)}';
}

/// `m:ss` for the lock-out countdown (rounds up so 0:00 means really over).
String formatCountdown(Duration d) {
  final s = d.isNegative ? 0 : (d.inMilliseconds / 1000).ceil();
  final m = s ~/ 60;
  return '$m:${(s % 60).toString().padLeft(2, '0')}';
}

/// Time left on the PIN lock; zero when not locked.
Duration lockRemaining(DateTime? until, DateTime now) {
  if (until == null || !until.isAfter(now)) return Duration.zero;
  return until.difference(now);
}

/// The band to offer in the change-band dialog: the next one up, or the one below for the last band.
AgeBand nextBand(AgeBand b) {
  final i = AgeBand.values.indexOf(b);
  return AgeBand.values[i == AgeBand.values.length - 1 ? i - 1 : i + 1];
}

String bandChangeTitle(String name, AgeBand to) => 'Change $name to ages ${to.label}?';

String bandChangeBody(AgeBand to) => switch (to) {
  AgeBand.b4_6 => 'Missions will use one big choice at a time and gentle feedback.',
  AgeBand.b7_9 => 'Missions will use short sentences and two choices at a time.',
  AgeBand.b10_12 => 'Missions will bring in saving goals and a few more choices.',
  AgeBand.b13_15 => 'Missions will cover budgets, trade-offs and bigger decisions.',
};

// ---- Delete account ----------------------------------------------------------------

/// The delete button stays disabled until the box is ticked and the word typed.
bool canDeleteAccount({required bool understood, required String typed}) =>
    understood && typed.trim().toUpperCase() == kDeleteWord;

// ---- Levels, skills, recent play ---------------------------------------------------

const xpPerLevel = 300;

int levelForXp(int xp) => 1 + math.max(0, xp) ~/ xpPerLevel;

const _levelNames = [
  'Market Visitor',
  'Market Helper',
  'Market Trader',
  'Market Keeper',
  'Market Planner',
  'Market Champion',
];

String levelName(int level) => _levelNames[math.min(math.max(level, 1), _levelNames.length) - 1];

enum Skill {
  know('Know'),
  understand('Understand'),
  decide('Decide'),
  invest('Invest'),
  share('Share');

  const Skill(this.label);
  final String label;
}

const _missionSkills = <String, Skill>{
  'm_4_6_lost_coins': Skill.know,
  'm_4_6_picnic': Skill.decide,
  'm_4_6_bicycle': Skill.decide,
  'm_4_6_playground': Skill.share,
  'm_4_6_rainy_umbrella': Skill.understand,
  'm_7_9_birthday_party': Skill.decide,
  'm_7_9_lemonade': Skill.understand,
  'm_7_9_toy_shop': Skill.know,
  'm_7_9_pizza_festival': Skill.share,
  'm_10_12_clothing_brand': Skill.invest,
  'm_10_12_keep_running': Skill.decide,
  'm_10_12_business_island': Skill.understand,
  'm_10_12_battle_of_brands': Skill.know,
  'm_13_15_side_hustle': Skill.know,
  'm_13_15_budget_boss': Skill.decide,
  'm_13_15_investment_arena': Skill.invest,
  'm_13_15_big_purchase': Skill.understand,
};

/// Each different mission finished grows its skill by this many percent.
const skillStep = 25;

/// 0..100 per skill from finished (success / gentle) attempts. Misses add nothing and never subtract.
Map<Skill, int> skillPercents(Iterable<Attempt> attempts) {
  final done = {for (final s in Skill.values) s: <String>{}};
  for (final a in attempts) {
    final s = _missionSkills[a.missionId];
    final finished = a.outcome == AttemptOutcome.success || a.outcome == AttemptOutcome.gentle;
    if (s != null && finished) done[s]!.add(a.missionId);
  }
  return {for (final s in Skill.values) s: math.min(100, done[s]!.length * skillStep)};
}

/// `today`, `yesterday`, `3 days ago`, `12 May`.
String relativeDay(DateTime when, DateTime now) {
  final days = DateTime(now.year, now.month, now.day).difference(DateTime(when.year, when.month, when.day)).inDays;
  if (days <= 0) return 'today';
  if (days == 1) return 'yesterday';
  if (days < 7) return '$days days ago';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return '${when.day} ${months[when.month - 1]}';
}

/// One plain sentence about an attempt, using the coins it earned or saved.
String playSummary(Attempt a, Iterable<WalletEvent> events) {
  var saved = 0, earned = 0;
  for (final e in events) {
    if (e.attemptId != a.id) continue;
    if (e.kind == WalletKind.save) saved += e.amount;
    if (e.kind == WalletKind.earn || e.kind == WalletKind.bonus) earned += e.amount;
  }
  if (saved > 0) return 'Saved $saved coins in the jar';
  if (earned > 0) return 'Earned $earned coins';
  return switch (a.outcome) {
    AttemptOutcome.success => 'Finished the mission',
    AttemptOutcome.gentle => 'Kept exploring and learning',
    AttemptOutcome.retry => 'Ready to try again',
    AttemptOutcome.left => 'Took a break',
  };
}
