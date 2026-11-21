/// Bundled content for ages 4–6: "The Lost Coins" (prototype/assets/data/mock-data.js, screens.js, activities.js).
library;

import '../../core/data/models.dart';

const String lostCoinsMissionId = 'm_4_6_lost_coins';
const String lostCoinsTitle = 'The Lost Coins';
const String lostCoinsWorld = 'Money & Choices · Mission 1';

/// Coins hidden at the market (prototype: lostCoins.hidden = 8).
const int hiddenCoins = 8;

/// Each coin found is worth 5 coins, so the pot to save or spend is 40.
const int coinValue = 5;
const int foundPot = hiddenCoins * coinValue;

/// What the treat costs when the child chooses to spend.
const int treatCost = 15;

/// First play (prototype firstReward): 30 coins, 40 XP and the Hard Worker badge. A replay gives 5 XP.
const int rewardCoins = 30;
const int rewardXp = 40;
const int replayXp = 5;
const String rewardBadgeId = 'badge.hard_worker';
const String rewardBadgeTitle = 'Hard Worker';

enum Jar { small, gold, silver }

/// The eight coins in the order they appear in the tray: 2 small, 5 gold, 1 silver
/// (the gold jar has the most, so the counting question has one right answer).
const List<Jar> coinOrder = [
  Jar.small,
  Jar.gold,
  Jar.gold,
  Jar.silver,
  Jar.gold,
  Jar.small,
  Jar.gold,
  Jar.gold,
];

int get goldCoins => coinOrder.where((j) => j == Jar.gold).length;

/// Where the shiny spots sit in the market scene, as fractions of the free space.
const List<({double x, double y})> spots = [
  (x: 0.06, y: 0.05),
  (x: 0.62, y: 0.04),
  (x: 0.40, y: 0.30),
  (x: 0.88, y: 0.22),
  (x: 0.10, y: 0.50),
  (x: 0.58, y: 0.55),
  (x: 0.30, y: 0.80),
  (x: 0.86, y: 0.78),
];

/// Short coin labels per region (stylised tokens, not real money).
({String small, String gold, String silver}) coinLabels(Region r) =>
    switch (r) {
      Region.ng => (small: '50k', gold: '1', silver: '2'),
      Region.gh || Region.uk => (small: '10p', gold: '1', silver: '50p'),
    };

String jarName(Jar j) => switch (j) {
  Jar.small => 'Small',
  Jar.gold => 'Gold',
  Jar.silver => 'Silver',
};

/// The treat the child can buy: kelewele (Ghana), puff-puff (Nigeria), biscuit (UK).
String treatName(Region r) => switch (r) {
  Region.gh => 'kelewele',
  Region.ng => 'puff-puff',
  Region.uk => 'biscuit',
};
