import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/data/models.dart';
import 'package:kudicubs/core/data/providers.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/core/theme/theme.dart';
import 'package:kudicubs/screens/missions_10_15/clothing_flow.dart';
import 'package:kudicubs/screens/missions_10_15/content.dart';
import 'package:kudicubs/screens/missions_10_15/hustle_flow.dart';
import 'package:kudicubs/screens/missions_10_15/ms-15-10-12-intro.dart';
import 'package:kudicubs/screens/missions_10_15/ms-16-10-12-resource.dart';
import 'package:kudicubs/screens/missions_10_15/app-11-band-10-12.dart';
import 'package:kudicubs/screens/missions_10_15/ms-17-10-12-result-success.dart';
import 'package:kudicubs/screens/missions_10_15/ms-18-10-12-result-retry.dart';
import 'package:kudicubs/screens/missions_10_15/ms-19-10-12-summary.dart';
import 'package:kudicubs/screens/missions_10_15/ms-23-13-15-intro.dart';
import 'package:kudicubs/screens/missions_10_15/app-12-band-13-15.dart';
import 'package:kudicubs/screens/missions_10_15/ms-24-13-15-market.dart';
import 'package:kudicubs/screens/missions_10_15/ms-25-13-15-result-profit.dart';
import 'package:kudicubs/screens/missions_10_15/app-13-retry.dart';
import 'package:kudicubs/screens/missions_10_15/ms-26-13-15-summary.dart';

import 'package:shared_preferences/shared_preferences.dart';

import 'support/fakes.dart';

/// Only this folder's screens (the full registry also pulls in other agents' unfinished files).
final Map<String, ScreenBuilder> registry = {
  'ms-15-10-12-intro': build_ms_15_10_12_intro,
  'ms-16-10-12-resource': build_ms_16_10_12_resource,
  'app-11-band-10-12': build_app_11_band_10_12,
  'ms-17-10-12-result-success': build_ms_17_10_12_result_success,
  'ms-18-10-12-result-retry': build_ms_18_10_12_result_retry,
  'ms-19-10-12-summary': build_ms_19_10_12_summary,
  'ms-23-13-15-intro': build_ms_23_13_15_intro,
  'app-12-band-13-15': build_app_12_band_13_15,
  'ms-24-13-15-market': build_ms_24_13_15_market,
  'ms-25-13-15-result-profit': build_ms_25_13_15_result_profit,
  'app-13-retry': build_app_13_retry,
  'ms-26-13-15-summary': build_ms_26_13_15_summary,
};

const _ids = [
  'ms-15-10-12-intro',
  'ms-16-10-12-resource',
  'app-11-band-10-12',
  'ms-17-10-12-result-success',
  'ms-18-10-12-result-retry',
  'ms-19-10-12-summary',
  'ms-23-13-15-intro',
  'app-12-band-13-15',
  'ms-24-13-15-market',
  'ms-25-13-15-result-profit',
  'app-13-retry',
  'ms-26-13-15-summary',
];

void main() {
  group('formatMoney', () {
    test('uses the fictional currency symbol and groups digits', () {
      expect(formatMoney(Region.gh, 300), 'GH₵ 300');
      expect(formatMoney(Region.ng, 2400), '₦ 2,400');
      expect(formatMoney(Region.uk, -114), '-£ 114');
      expect(formatMoney(Region.gh, 0), 'GH₵ 0');
    });
  });

  group('Clothing Brand arithmetic (10-12)', () {
    test(
      'a balanced plan with an investor: profit after the investor share',
      () {
        final r = ClothingBrand.run(
          Funding.investor,
          ClothingBrand.defaultSplit(Funding.investor),
        );
        expect(
          r.made,
          75,
        ); // 150 coins of materials at 2 each, helpers can make 90
        expect(r.buyers, 92); // 20 + 90 * 4/5
        expect(r.sold, 75);
        expect(r.sales, 450); // 75 x 6
        expect(r.spent, 300);
        expect(r.financing, 37); // 25% of (450 - 300) = 37.5 -> 37
        expect(r.net, 113); // 450 - 300 - 37
        expect(r.success, isTrue);
        expect(r.diagnosis, ClothingDiagnosis.balanced);
      },
    );

    test('a loan is repaid with extra whatever the month brings', () {
      final good = ClothingBrand.run(
        Funding.loan,
        ClothingBrand.defaultSplit(Funding.loan),
      );
      expect(ClothingBrand.loanRepay(), 360);
      expect(good.financing, 60);
      expect(good.net, 90); // 450 - 300 - 60
      final weak = ClothingBrand.run(Funding.loan, ClothingBrand.demoPoorSplit);
      expect(weak.financing, 60);
      expect(weak.net, -144); // 216 - 300 - 60
    });

    test('own savings: a smaller start, nothing to repay', () {
      final r = ClothingBrand.run(
        Funding.savings,
        ClothingBrand.defaultSplit(Funding.savings),
      );
      expect(r.capital, 120);
      expect(r.made, 30);
      expect(r.buyers, 48);
      expect(r.sold, 30);
      expect(r.sales, 180);
      expect(r.spent, 120);
      expect(r.financing, 0);
      expect(r.net, 60);
    });

    test(
      'too little marketing: loss is explained as few buyers; the investor takes nothing from a loss',
      () {
        final r = ClothingBrand.run(
          Funding.investor,
          ClothingBrand.demoPoorSplit,
        );
        expect(r.made, 60); // wages 40 cap the helpers at 60 items
        expect(r.buyers, 36);
        expect(r.sold, 36);
        expect(r.sales, 216);
        expect(r.financing, 0);
        expect(r.net, -84);
        expect(r.success, isFalse);
        expect(r.diagnosis, ClothingDiagnosis.fewBuyers);
      },
    );

    test('too few items made when marketing is strong', () {
      final r = ClothingBrand.run(
        Funding.savings,
        const CoinSplit(10, 100, 10),
      );
      expect(r.made, 5);
      expect(r.buyers, 100);
      expect(r.diagnosis, ClothingDiagnosis.fewItems);
      expect(r.success, isFalse);
    });

    test('deterministic: the same choices always give the same outcome', () {
      for (final f in Funding.values) {
        final s = ClothingBrand.defaultSplit(f);
        final a = ClothingBrand.run(f, s);
        final b = ClothingBrand.run(f, s);
        expect(
          (a.net, a.sold, a.financing, a.diagnosis),
          (b.net, b.sold, b.financing, b.diagnosis),
        );
      }
    });
  });

  group('Side Hustle arithmetic (13-15)', () {
    test('default plan: 13 of 20 sold at 15, profit 35, margin 18%', () {
      final r = SideHustle.run(const HustlePlan());
      expect(r.buyers, 13);
      expect(r.sold, 13);
      expect(r.income, 195);
      expect(r.costs, 160);
      expect(r.profit, 35);
      expect(r.margin, 18);
      expect(r.budgetLeft, 40);
      expect(r.success, isTrue);
    });

    test('price 22: 8 of 20 sold, thin profit 16 is a try-again', () {
      final r = SideHustle.run(const HustlePlan(price: 22));
      expect(r.sold, 8);
      expect(r.income, 176);
      expect(r.profit, 16);
      expect(r.success, isFalse);
    });

    test('a loss: expensive items at a high price', () {
      final r = SideHustle.run(
        const HustlePlan(cost: 12, price: 28, items: 16),
      );
      expect(r.costs, 192);
      expect(r.profit, lessThan(0));
      expect(r.success, isFalse);
      expect(r.margin, lessThan(0));
    });

    test('demand falls as the price rises; costs stay inside the budget', () {
      var last = 1000;
      for (var p = SideHustle.minPrice; p <= SideHustle.maxPrice; p++) {
        final b = SideHustle.buyers(p, 8);
        expect(b, lessThanOrEqualTo(last));
        last = b;
      }
      final big = const HustlePlan(cost: 14, items: 30).normalized();
      expect(big.items, 14);
      expect(big.totalCost, lessThanOrEqualTo(SideHustle.budget));
    });

    test(
      'best price is deterministic and never worse than the current one',
      () {
        final best = SideHustle.bestPrice(8, 20);
        expect(best, SideHustle.bestPrice(8, 20));
        final bestProfit = SideHustle.run(HustlePlan(price: best)).profit;
        for (var p = SideHustle.minPrice; p <= SideHustle.maxPrice; p++) {
          expect(
            SideHustle.run(HustlePlan(price: p)).profit,
            lessThanOrEqualTo(bestProfit),
          );
        }
      },
    );
  });

  group('state machines', () {
    test(
      '10-12: a weak month records retry, keeps every choice, and a later success is recorded',
      () async {
        final seen = <AttemptOutcome>[];
        final c = ClothingFlowController(sink: (o, _) async => seen.add(o));
        c.start();
        c.chooseFunding(Funding.loan);
        c.confirmFunding();
        c.setSplit(materials: 240, marketing: 20, wages: 40);
        expect(c.split, const CoinSplit(240, 20, 40));
        await c.run();
        expect(c.stage, ClothingStage.result);
        expect(c.result!.success, isFalse);
        expect(seen, [AttemptOutcome.retry]);

        c.retry();
        expect(c.stage, ClothingStage.split);
        expect(c.funding, Funding.loan);
        expect(c.split, const CoinSplit(240, 20, 40)); // kept

        c.setSplit(materials: 150, marketing: 90, wages: 60);
        await c.run();
        expect(c.result!.success, isTrue);
        expect(seen, [AttemptOutcome.retry, AttemptOutcome.success]);
        c.toSummary();
        expect(c.stage, ClothingStage.summary);
      },
    );

    test('10-12: sliders never place more coins than the money available', () {
      final c = ClothingFlowController();
      c.setSplit(materials: 280); // 280 + 90 + 60 > 300
      expect(c.split.total, 300);
      expect(c.split.materials, 150);
      c.chooseFunding(Funding.savings);
      expect(c.capital, 120);
      expect(c.split.total, 120);
    });

    test(
      '10-12: leaving mid-attempt records left once; leaving after a result adds nothing',
      () async {
        final seen = <AttemptOutcome>[];
        final c = ClothingFlowController(sink: (o, _) async => seen.add(o));
        await c.abandon(); // nothing started
        expect(seen, isEmpty);
        c.start();
        await c.abandon();
        await c.abandon();
        expect(seen, [AttemptOutcome.left]);

        final d = ClothingFlowController(sink: (o, _) async => seen.add(o));
        d.start();
        d.confirmFunding();
        await d.run();
        await d.abandon();
        expect(seen, [AttemptOutcome.left, AttemptOutcome.success]);
      },
    );

    test(
      '13-15: tries accumulate across retries and the best is the highest profit',
      () async {
        final seen = <AttemptOutcome>[];
        final c = HustleFlowController(sink: (o, _) async => seen.add(o));
        c.start();
        c.setPrice(22);
        await c.run();
        expect(seen, [AttemptOutcome.retry]);
        expect(c.result!.success, isFalse);

        c.retry();
        expect(c.plan.price, 22); // kept
        c.setPrice(15);
        await c.run();
        expect(seen, [AttemptOutcome.retry, AttemptOutcome.success]);
        expect(c.tries.map((t) => t.profit), [16, 35]);
        expect(c.best!.price, 15);
      },
    );

    test('13-15: cost change keeps the batch inside the budget', () {
      final c = HustleFlowController();
      c.setItems(30);
      c.setCost(14);
      expect(c.plan.items, 14);
      expect(c.plan.totalCost, lessThanOrEqualTo(SideHustle.budget));
    });
  });

  group('screens', () {
    late FakeWallet wallet;
    late FakeAttempts attempts;
    late List<Override> overrides;

    setUp(() async {
      wallet = FakeWallet();
      attempts = FakeAttempts();
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      overrides = [
        sharedPrefsProvider.overrideWithValue(prefs),
        authRepositoryProvider.overrideWithValue(FakeAuth()),
        childrenRepositoryProvider.overrideWithValue(FakeChildren()),
        walletRepositoryProvider.overrideWithValue(wallet),
        attemptsRepositoryProvider.overrideWithValue(attempts),
        badgesRepositoryProvider.overrideWithValue(FakeBadges()),
        missionsRepositoryProvider.overrideWithValue(FakeMissions()),
        parentRepositoryProvider.overrideWithValue(FakeParent()),
        onlineProvider.overrideWith(_Online.new),
        currentChildProvider.overrideWithValue(const AsyncData<Child?>(sampleChild)),
      ];
    });

    Future<void> show(
      WidgetTester tester,
      String id, [
      ScreenState state = ScreenState.normal,
    ]) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(
        ProviderScope(
          overrides: overrides,
          child: MaterialApp(
            theme: AppTheme.light,
            home: Builder(builder: (c) => registry[id]!(c, state)),
          ),
        ),
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
    }

    testWidgets(
      'all 12 ids are real screens: keyed, no TODO, no overflow in every state',
      (tester) async {
        for (final id in _ids) {
          for (final s in ScreenState.values) {
            await show(tester, id, s);
            expect(
              find.byKey(Key('screen-$id')),
              findsOneWidget,
              reason: '$id / ${s.name}',
            );
            expect(find.textContaining('TODO'), findsNothing, reason: id);
            expect(tester.takeException(), isNull, reason: '$id / ${s.name}');
          }
        }
      },
    );

    testWidgets(
      '10-12 success path: intro to summary, records one success, no penalty',
      (tester) async {
        await show(tester, 'ms-15-10-12-intro');
        expect(find.textContaining('GH₵ 300'), findsOneWidget);
        await tester.tap(find.text('Start the mission'));
        await tester.pumpAndSettle();
        expect(
          find.byKey(const Key('screen-app-11-band-10-12')),
          findsOneWidget,
        );
        await tester.tap(find.text('Choose investor'));
        await tester.pumpAndSettle();
        expect(
          find.byKey(const Key('screen-ms-16-10-12-resource')),
          findsOneWidget,
        );
        await tester.tap(find.text('Open for business'));
        await tester.pumpAndSettle();
        expect(
          find.byKey(const Key('screen-ms-17-10-12-result-success')),
          findsOneWidget,
        );
        expect(
          find.text('Balanced spending sold 75 of 75 items.'),
          findsOneWidget,
        );
        expect(attempts.log.map((a) => a.outcome), [AttemptOutcome.success]);
        expect(attempts.log.single.missionId, ClothingBrand.missionId);
        expect(
          wallet.log,
          isEmpty,
        ); // coins arrive only when the reward is collected
        await tester.tap(find.text('Continue'));
        await tester.pumpAndSettle();
        expect(
          find.byKey(const Key('screen-ms-19-10-12-summary')),
          findsOneWidget,
        );

        await tester.tap(find.text('Collect my reward'));
        await tester.pump();
        await tester.pump();
        expect(
          wallet.log.where((e) => e.kind == WalletKind.earn).single.amount,
          ClothingBrand.coinsReward,
        );
        expect(
          wallet.log.where((e) => e.kind == WalletKind.xp).single.amount,
          ClothingBrand.xpReward,
        );
      },
    );

    testWidgets('10-12 try-again keeps balances and every choice', (
      tester,
    ) async {
      final before = await wallet.balances('c1');
      await show(tester, 'ms-18-10-12-result-retry');
      expect(find.text('Here is what happened'), findsOneWidget);
      expect(find.text('Your coins, XP and badges are safe.'), findsOneWidget);
      expect(find.text('-GH₵ 84'), findsOneWidget);
      expect(find.text('Keep this result'), findsOneWidget);
      await tester.tap(find.text('Try again'));
      await tester.pumpAndSettle();
      expect(
        find.byKey(const Key('screen-ms-16-10-12-resource')),
        findsOneWidget,
      );
      expect(find.text('GH₵ 240'), findsOneWidget); // the split is kept
      final after = await wallet.balances('c1');
      expect((after.coins, after.xp), (before.coins, before.xp));
      expect(wallet.log, isEmpty);
    });

    testWidgets(
      '13-15: profit path then a different price, tries kept; try-again keeps balances',
      (tester) async {
        final before = await wallet.balances('c1');
        await show(tester, 'ms-23-13-15-intro');
        await tester.tap(find.text('Start my hustle'));
        await tester.pumpAndSettle();
        expect(
          find.byKey(const Key('screen-app-12-band-13-15')),
          findsOneWidget,
        );
        expect(find.text('GH₵ 160 of 200'), findsOneWidget);
        await tester.tap(find.text('Run the sale'));
        await tester.pumpAndSettle();
        expect(
          find.byKey(const Key('screen-ms-25-13-15-result-profit')),
          findsOneWidget,
        );
        expect(find.text('At GH₵ 15, 13 of 20 items sold.'), findsOneWidget);
        expect(
          find.text('Profit = income minus cost: 195 − 160 = 35.'),
          findsOneWidget,
        );
        expect(attempts.log.map((a) => a.outcome), [AttemptOutcome.success]);

        await tester.tap(find.text('Try a different price'));
        await tester.pumpAndSettle();
        expect(
          find.byKey(const Key('screen-ms-24-13-15-market')),
          findsOneWidget,
        );

        await show(tester, 'app-13-retry');
        expect(
          find.text('You sold 8 of 20 items. Let\'s look at why.'),
          findsOneWidget,
        );
        expect(find.text('GH₵ 16'), findsOneWidget);
        await tester.tap(find.text('Try again'));
        await tester.pumpAndSettle();
        expect(
          find.byKey(const Key('screen-app-12-band-13-15')),
          findsOneWidget,
        );
        expect(find.text('GH₵ 22'), findsOneWidget); // price kept
        final after = await wallet.balances('c1');
        expect((after.coins, after.xp), (before.coins, before.xp));
        expect(wallet.log, isEmpty);
      },
    );
  });
}

class _Online extends OnlineNotifier {
  @override
  bool build() => true;
  @override
  Future<bool> check() async => true;
}
