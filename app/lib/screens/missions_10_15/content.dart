/// Bundled mission content and arithmetic for ages 10-12 (Clothing Brand) and
/// 13-15 (Side Hustle: first sale). Pure Dart: no Flutter, no I/O, fully
/// deterministic, so the same choices always give the same outcome.
///
/// Sources: prototype/assets/missions/band-10-12.js and band-13-15.js,
/// docs/design/mission-extracts/10-12.md and 13-15.md, and the accepted canvas
/// screens. All numbers are game coins in the child's fictional currency
/// (GH₵, ₦ or £). Nothing here is money and nothing is ever taken away.
library;

import 'dart:math' as math;

import '../../core/data/models.dart' show Region;

/// "GH₵ 1,200" / "-£ 114": the fictional currency symbol, a space, grouped digits.
String formatMoney(Region region, int amount) {
  final digits = amount.abs().toString();
  final out = StringBuffer();
  for (var i = 0; i < digits.length; i++) {
    if (i > 0 && (digits.length - i) % 3 == 0) out.write(',');
    out.write(digits[i]);
  }
  return '${amount < 0 ? '-' : ''}${region.symbol} $out';
}

// ---------------------------------------------------------------- 10-12

/// How the child raises the start-up money.
enum Funding { loan, investor, savings }

/// Where the coins go: materials, marketing and helpers' wages.
class CoinSplit {
  const CoinSplit(this.materials, this.marketing, this.wages);

  final int materials;
  final int marketing;
  final int wages;

  int get total => materials + marketing + wages;

  CoinSplit copyWith({int? materials, int? marketing, int? wages}) =>
      CoinSplit(materials ?? this.materials, marketing ?? this.marketing, wages ?? this.wages);

  @override
  bool operator ==(Object other) =>
      other is CoinSplit && other.materials == materials && other.marketing == marketing && other.wages == wages;

  @override
  int get hashCode => Object.hash(materials, marketing, wages);

  @override
  String toString() => 'CoinSplit($materials/$marketing/$wages)';
}

/// What held a weak month back. Used only to explain, never to judge.
enum ClothingDiagnosis { balanced, fewBuyers, fewItems, costOfMoney }

class ClothingResult {
  const ClothingResult({
    required this.funding,
    required this.split,
    required this.capital,
    required this.made,
    required this.buyers,
    required this.sold,
    required this.sales,
    required this.spent,
    required this.financing,
    required this.net,
    required this.diagnosis,
  });

  final Funding funding;
  final CoinSplit split;

  /// Coins the child had to place.
  final int capital;

  /// Items the materials and helpers could make.
  final int made;

  /// People who would buy at the fixed price, given the marketing.
  final int buyers;
  final int sold;
  final int sales;

  /// Coins actually placed (materials + marketing + wages).
  final int spent;

  /// Cost of the money: loan interest or the investor's share. Zero for savings.
  final int financing;

  /// Sales - spent - financing. Negative = a weak month (explained, never judged).
  final int net;
  final ClothingDiagnosis diagnosis;

  bool get success => net > 0;
  int get left => capital - spent;
}

abstract final class ClothingBrand {
  static const missionId = 'm_10_12_clothing_brand';

  /// Coins needed to start with a loan or an investor.
  static const need = 300;

  /// Coins the child has saved: starting from savings means a smaller start.
  static const savingsCapital = 120;

  /// The loan is paid back with this much extra (percent of the loan).
  static const loanExtraPercent = 20;

  /// The investor takes this share of the profit (only when there is one).
  static const investorSharePercent = 25;

  static const materialsPerItem = 2; // 2 coins of materials make 1 item
  static const wagesPerThreeItems = 2; // 2 coins of wages let helpers make 3 items
  static const pricePerItem = 6;
  static const baseBuyers = 20; // people who buy with no marketing at all
  static const step = 5; // sliders move in steps of 5 coins

  static const coinsReward = 60;
  static const xpReward = 60;
  static const badgeId = 'badge.market_explorer';

  static int capitalFor(Funding f) => f == Funding.savings ? savingsCapital : need;

  /// The loan comes back with extra: 300 -> 360.
  static int loanExtra() => need * loanExtraPercent ~/ 100;
  static int loanRepay() => need + loanExtra();

  static CoinSplit defaultSplit(Funding f) => f == Funding.savings ? const CoinSplit(60, 35, 25) : const CoinSplit(150, 90, 60);

  /// A weak plan used by the gallery to show the try-again screen.
  static const demoPoorSplit = CoinSplit(240, 20, 40);

  static int itemsMade(CoinSplit s) => math.min(s.materials ~/ materialsPerItem, (s.wages * 3) ~/ wagesPerThreeItems);

  static int buyersFor(CoinSplit s) => baseBuyers + (s.marketing * 4) ~/ 5;

  static ClothingResult run(Funding funding, CoinSplit split) {
    final capital = capitalFor(funding);
    final made = itemsMade(split);
    final buyers = buyersFor(split);
    final sold = math.min(made, buyers);
    final sales = sold * pricePerItem;
    final spent = split.total;
    final beforeFinancing = sales - spent;
    final financing = switch (funding) {
      Funding.loan => loanExtra(),
      Funding.investor => beforeFinancing > 0 ? beforeFinancing * investorSharePercent ~/ 100 : 0,
      Funding.savings => 0,
    };
    final net = beforeFinancing - financing;
    final diagnosis = net > 0
        ? ClothingDiagnosis.balanced
        : sold < made
            ? ClothingDiagnosis.fewBuyers
            : (made < buyers || financing == 0)
                ? ClothingDiagnosis.fewItems
                : ClothingDiagnosis.costOfMoney;
    return ClothingResult(
      funding: funding,
      split: split,
      capital: capital,
      made: made,
      buyers: buyers,
      sold: sold,
      sales: sales,
      spent: spent,
      financing: financing,
      net: net,
      diagnosis: diagnosis,
    );
  }
}

// ---------------------------------------------------------------- 13-15

class HustlePlan {
  const HustlePlan({this.cost = 8, this.price = 15, this.items = 20});

  /// Cost to make one item.
  final int cost;

  /// Selling price of one item.
  final int price;

  /// How many items to make.
  final int items;

  int get totalCost => cost * items;

  HustlePlan copyWith({int? cost, int? price, int? items}) =>
      HustlePlan(cost: cost ?? this.cost, price: price ?? this.price, items: items ?? this.items).normalized();

  /// Keeps the plan inside the budget and the slider ranges.
  HustlePlan normalized() {
    final c = cost.clamp(SideHustle.minCost, SideHustle.maxCost);
    final p = price.clamp(SideHustle.minPrice, SideHustle.maxPrice);
    final i = items.clamp(SideHustle.minItems, SideHustle.maxItemsFor(c));
    return HustlePlan(cost: c, price: p, items: i);
  }

  @override
  bool operator ==(Object other) => other is HustlePlan && other.cost == cost && other.price == price && other.items == items;

  @override
  int get hashCode => Object.hash(cost, price, items);

  @override
  String toString() => 'HustlePlan(cost $cost, price $price, items $items)';
}

class HustleResult {
  const HustleResult({
    required this.plan,
    required this.buyers,
    required this.sold,
    required this.income,
    required this.costs,
    required this.profit,
  });

  final HustlePlan plan;

  /// People who would buy at this price (before the batch size limits it).
  final int buyers;
  final int sold;
  final int income;
  final int costs;
  final int profit;

  int get items => plan.items;
  int get price => plan.price;

  /// Profit as a whole percent of income (0 when nothing sold).
  int get margin => income == 0 ? 0 : (profit * 100 / income).round();
  int get budgetLeft => SideHustle.budget - costs;
  bool get success => profit >= SideHustle.successProfit;
}

/// One run of the sale, kept so the summary can compare tries.
class HustleTry {
  const HustleTry({required this.price, required this.items, required this.sold, required this.profit});

  final int price;
  final int items;
  final int sold;
  final int profit;
}

abstract final class SideHustle {
  static const missionId = 'm_13_15_side_hustle';

  static const budget = 200;
  static const minCost = 4, maxCost = 14;
  static const minPrice = 8, maxPrice = 28;
  static const minItems = 10, maxItems = 30;

  /// A run counts as a good sale from this profit. Below it (or a loss) the
  /// child is shown what happened and offered Try again.
  static const successProfit = 20;

  static const coinsReward = 80;
  static const xpReward = 80;
  static const badgeId = 'badge.pride_star';

  /// The market's demand curve: (price, buyers at a standard cost of 8). Linear in between.
  static const demandCurve = <(int, int)>[(8, 20), (15, 13), (22, 8), (28, 3)];

  static int maxItemsFor(int cost) => math.min(maxItems, budget ~/ cost);

  /// Buyers at [price] for a standard-quality item.
  static double baseBuyers(int price) {
    if (price <= demandCurve.first.$1) return demandCurve.first.$2.toDouble();
    if (price >= demandCurve.last.$1) return demandCurve.last.$2.toDouble();
    for (var i = 0; i < demandCurve.length - 1; i++) {
      final (p0, b0) = demandCurve[i];
      final (p1, b1) = demandCurve[i + 1];
      if (price <= p1) return b0 + (b1 - b0) * (price - p0) / (p1 - p0);
    }
    return demandCurve.last.$2.toDouble();
  }

  /// Buyers at [price] when each item costs [cost] to make. Better items (higher
  /// cost) draw a few more buyers: +4% per coin above 8, -4% below.
  static int buyers(int price, int cost) => (baseBuyers(price) * (100 + (cost - 8) * 4) / 100).round();

  static HustleResult run(HustlePlan raw) {
    final plan = raw.normalized();
    final buyersNow = buyers(plan.price, plan.cost);
    final sold = math.min(plan.items, buyersNow);
    final income = sold * plan.price;
    return HustleResult(
      plan: plan,
      buyers: buyersNow,
      sold: sold,
      income: income,
      costs: plan.totalCost,
      profit: income - plan.totalCost,
    );
  }

  /// The price (within the slider range) that earns most for this batch; the
  /// lowest such price when several tie.
  static int bestPrice(int cost, int items) {
    var best = minPrice;
    var bestProfit = run(HustlePlan(cost: cost, price: minPrice, items: items)).profit;
    for (var p = minPrice + 1; p <= maxPrice; p++) {
      final profit = run(HustlePlan(cost: cost, price: p, items: items)).profit;
      if (profit > bestProfit) {
        best = p;
        bestProfit = profit;
      }
    }
    return best;
  }
}
