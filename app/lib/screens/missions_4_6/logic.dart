/// State machine for ages 4–6: intro → find → sort → count → save or spend → result → summary.
///
/// Pure Dart (no Flutter): every choice leads to a gentle, constructive result and the mission
/// continues. There is no failure phase in [Phase46] and [outcomeFor46] never returns `retry`.
library;

import '../../core/band_rules.dart';
import '../../core/data/models.dart';
import 'content.dart';
import 'saver.dart';

enum Phase46 {
  intro,
  replay,
  find,
  sort,
  count,
  decision,
  resultSave,
  resultSpend,
  summary,
}

enum Choice { save, spend }

class LostCoinsMachine {
  LostCoinsMachine({this.phase = Phase46.intro, this.replay = false});

  Phase46 phase;

  /// The child has played this mission before: a replay pays XP only.
  final bool replay;

  final Set<int> found = {};
  final Set<int> placed = {};
  int sortMistakes = 0;
  int? countAnswer;
  bool countFirstTryRight = true;
  bool countHelped = false;
  Choice? picked;
  Choice? choice;

  bool get allFound => found.length == hiddenCoins;
  bool get allSorted => placed.length == coinOrder.length;

  /// The next three coins still waiting in the tray.
  List<int> get tray => [
    for (var i = 0; i < coinOrder.length; i++)
      if (!placed.contains(i)) i,
  ].take(3).toList();

  int jarCount(Jar j) => placed.where((i) => coinOrder[i] == j).length;

  /// Intro button: straight to the game, or to "play again?" when played before.
  void begin() {
    if (phase != Phase46.intro) return;
    phase = replay ? Phase46.replay : Phase46.find;
  }

  void playAgain() {
    if (phase == Phase46.replay) phase = Phase46.find;
  }

  /// Taps a shiny spot. Returns true when it was a new coin.
  bool tapSpot(int i) {
    if (phase != Phase46.find || i < 0 || i >= hiddenCoins) return false;
    return found.add(i);
  }

  /// Puts tray coin [coin] into [jar]. A wrong jar only counts a gentle miss; the coin floats back.
  bool place(int coin, Jar jar) {
    if (phase != Phase46.sort || placed.contains(coin)) return false;
    if (coinOrder[coin] == jar) {
      placed.add(coin);
      return true;
    }
    sortMistakes++;
    return false;
  }

  /// Moves on when the step is complete: find → sort → count.
  bool advance() {
    if (phase == Phase46.find && allFound) {
      phase = Phase46.sort;
      return true;
    }
    if (phase == Phase46.sort && allSorted) {
      phase = Phase46.count;
      return true;
    }
    return false;
  }

  void pickCount(int n) {
    if (phase == Phase46.count) countAnswer = n;
  }

  /// "Done". A right answer moves on. A wrong one is never an error: Kudi counts together,
  /// the right number is shown, and the next tap moves on.
  bool submitCount() {
    if (phase != Phase46.count || countAnswer == null) return false;
    if (countAnswer == goldCoins) {
      phase = Phase46.decision;
      return true;
    }
    if (!countHelped) countFirstTryRight = false;
    countHelped = true;
    countAnswer = goldCoins;
    return false;
  }

  void pickChoice(Choice c) {
    if (phase == Phase46.decision) picked = c;
  }

  /// "Choose": both choices are fine.
  void confirmChoice() {
    if (phase != Phase46.decision || picked == null) return;
    choice = picked;
    phase = picked == Choice.save ? Phase46.resultSave : Phase46.resultSpend;
  }

  void next() {
    if (phase == Phase46.resultSave || phase == Phase46.resultSpend) {
      phase = Phase46.summary;
    }
  }

  /// A clean run (no wrong jar, counted right first time) is a `success`; otherwise `gentle`.
  AttemptOutcome get outcome => outcomeFor46(
    sortMistakes: sortMistakes,
    countedRight: countFirstTryRight,
  );

  RewardPlan get reward => lostCoinsReward(replay: replay);

  /// Coins moved by the choice: the found pot is earned, then saved or partly spent.
  int get savedCoins => choice == Choice.save ? foundPot : 0;
  int get spentCoins => choice == Choice.spend ? treatCost : 0;

  /// Wallet events for the choice. The pot is earned first, so nothing ever goes below what the child had.
  List<({WalletKind kind, int amount, String label})> get choiceEvents => [
    (kind: WalletKind.earn, amount: foundPot, label: 'Coins found'),
    if (choice == Choice.save)
      (kind: WalletKind.save, amount: foundPot, label: 'Saved in the jar'),
    if (choice == Choice.spend)
      (kind: WalletKind.spend, amount: treatCost, label: 'Treat sticker'),
  ];

  /// Gallery/demo seeds so each designed screen can be opened directly.
  factory LostCoinsMachine.demo(Phase46 p) {
    final m = LostCoinsMachine(phase: p);
    switch (p) {
      case Phase46.intro || Phase46.replay:
        break;
      case Phase46.find:
        m.found.addAll([0, 1, 2]);
      case Phase46.sort:
        m.placed.addAll([0, 1, 2, 3, 4]);
      case Phase46.count:
        m.placed.addAll(List.generate(coinOrder.length, (i) => i));
        m.countAnswer = goldCoins;
      case Phase46.decision:
        m.found.addAll(List.generate(hiddenCoins, (i) => i));
        m.picked = Choice.save;
      case Phase46.resultSave:
        m.choice = Choice.save;
        m.picked = Choice.save;
      case Phase46.resultSpend:
        m.choice = Choice.spend;
        m.picked = Choice.spend;
      case Phase46.summary:
        m.choice = Choice.save;
        m.picked = Choice.save;
    }
    return m;
  }
}

/// 4–6 outcome for a finished run: only `success` or `gentle`, never `retry`.
AttemptOutcome outcomeFor46({
  required int sortMistakes,
  required bool countedRight,
}) => outcomeFor(AgeBand.b4_6, succeeded: sortMistakes == 0 && countedRight);

RewardPlan lostCoinsReward({required bool replay}) => replay
    ? const RewardPlan(coins: 0, xp: replayXp, replay: true)
    : const RewardPlan(
        coins: rewardCoins,
        xp: rewardXp,
        badgeId: rewardBadgeId,
      );
