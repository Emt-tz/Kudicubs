/// State machine for ages 7–9: intro → choose items → result (success or try again) → summary.
///
/// An unsuccessful outcome shows the try-again result; trying again keeps every coin, XP and badge
/// (nothing is written until the child collects the reward, and a retry never writes a negative event).
library;

import '../../core/band_rules.dart';
import '../../core/data/models.dart';
import '../missions_4_6/saver.dart';
import 'content.dart';

enum Phase79 { intro, decision, success, retry, summary }

class PartyMachine {
  PartyMachine({this.phase = Phase79.intro, this.replay = false});

  Phase79 phase;
  final bool replay;

  final Set<String> selected = {};
  int tries = 0;

  /// The child chose "Keep this result" instead of trying again.
  bool kept = false;

  List<PartyItem> get chosen => [
    for (final i in partyItems)
      if (selected.contains(i.id)) i,
  ];
  int get total => chosen.fold(0, (s, i) => s + i.cost);
  int get left => partyBudget - total;
  int get overBy => left < 0 ? -left : 0;
  bool get withinBudget => total <= partyBudget;

  void begin() {
    if (phase == Phase79.intro) phase = Phase79.decision;
  }

  void toggle(String id) {
    if (phase != Phase79.decision) return;
    if (!selected.remove(id)) selected.add(id);
  }

  /// "Confirm my party". Returns true when the plan stayed in budget.
  bool confirm() {
    if (phase != Phase79.decision || selected.isEmpty) return false;
    tries++;
    phase = withinBudget ? Phase79.success : Phase79.retry;
    return withinBudget;
  }

  /// "Try again": back to choosing, with the same picks so the child can swap one item.
  void tryAgain() {
    if (phase == Phase79.retry) phase = Phase79.decision;
  }

  void keepResult() {
    if (phase != Phase79.retry) return;
    kept = true;
    phase = Phase79.summary;
  }

  void toSummary() {
    if (phase == Phase79.success) phase = Phase79.summary;
  }

  /// `success` when in budget, `retry` otherwise (7–9 always get another go).
  AttemptOutcome get outcome =>
      outcomeFor(AgeBand.b7_9, succeeded: withinBudget);

  RewardPlan get reward {
    if (kept && !withinBudget) {
      return const RewardPlan(coins: 0, xp: partyKeptXp);
    }
    if (replay) {
      return const RewardPlan(coins: 0, xp: partyReplayXp, replay: true);
    }
    return const RewardPlan(
      coins: partyCoins,
      xp: partyXp,
      badgeId: partyBadgeId,
    );
  }

  /// Gallery/demo seeds so each designed screen can be opened directly.
  factory PartyMachine.demo(Phase79 p) {
    final m = PartyMachine(phase: p);
    switch (p) {
      case Phase79.intro:
        break;
      case Phase79.decision:
        m.selected.add('cake');
      case Phase79.success:
        m.selected.addAll(['cake', 'balloons', 'games']);
        m.tries = 1;
      case Phase79.retry:
        m.selected.addAll(partyItems.map((i) => i.id));
        m.tries = 1;
      case Phase79.summary:
        m.selected.addAll(['cake', 'balloons', 'games']);
        m.tries = 2;
    }
    return m;
  }
}
