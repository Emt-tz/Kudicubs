import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/band_rules.dart';
import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import '../home/reward_coordinator.dart';
import 'content.dart';
import 'flow_kit.dart';

/// The 13-15 mission "Side Hustle: your first sale" as one state machine:
/// intro -> plan (cost, price, items) -> read the market -> result -> summary (+ reward).
enum HustleStage {
  intro('ms-23-13-15-intro'),
  plan('app-12-band-13-15'),
  market('ms-24-13-15-market'),
  result('ms-25-13-15-result-profit'),
  summary('ms-26-13-15-summary');

  const HustleStage(this.canvasId);
  final String canvasId;
}

/// State of one play of the Side Hustle mission. A loss or a thin profit
/// records `retry`, costs nothing, and Try again keeps the plan and the list of tries.
class HustleFlowController extends ChangeNotifier {
  HustleFlowController({this.sink, this.stage = HustleStage.intro, HustlePlan plan = const HustlePlan(), List<HustleTry>? tries})
      : _plan = plan.normalized(),
        _tries = [...?tries] {
    if (stage == HustleStage.result || stage == HustleStage.summary) _result = SideHustle.run(_plan);
  }

  /// A ready-made state for the gallery; [poor] shows the try-again screen
  /// (price 22: 8 of 20 sold). The summary demo carries both tries.
  factory HustleFlowController.demo(HustleStage stage, {bool poor = false}) {
    const poorPlan = HustlePlan(price: 22);
    final poorRun = SideHustle.run(poorPlan);
    final goodRun = SideHustle.run(const HustlePlan());
    HustleTry t(HustleResult r) => HustleTry(price: r.price, items: r.items, sold: r.sold, profit: r.profit);
    return HustleFlowController(
      stage: stage,
      plan: poor ? poorPlan : const HustlePlan(),
      tries: stage == HustleStage.summary ? [t(poorRun), t(goodRun)] : null,
    );
  }

  static const band = AgeBand.b13_15;

  final AttemptSink? sink;
  HustleStage stage;
  HustlePlan _plan;
  final List<HustleTry> _tries;
  HustleResult? _result;
  DateTime? _startedAt;
  bool _recorded = false;

  HustlePlan get plan => _plan;
  HustleResult? get result => _result;
  List<HustleTry> get tries => List.unmodifiable(_tries);
  bool get attemptOpen => _startedAt != null && !_recorded;

  /// The try with the highest profit (the first one when tied), or null.
  HustleTry? get best {
    HustleTry? b;
    for (final t in _tries) {
      if (b == null || t.profit > b.profit) b = t;
    }
    return b;
  }

  void _beginAttempt() {
    _startedAt = DateTime.now();
    _recorded = false;
  }

  void start() {
    _beginAttempt();
    stage = HustleStage.plan;
    notifyListeners();
  }

  void setCost(int v) {
    _plan = _plan.copyWith(cost: v);
    notifyListeners();
  }

  void setPrice(int v) {
    _plan = _plan.copyWith(price: v);
    notifyListeners();
  }

  void setItems(int v) {
    _plan = _plan.copyWith(items: v);
    notifyListeners();
  }

  void readMarket() {
    stage = HustleStage.market;
    notifyListeners();
  }

  /// Runs the sale: works out the result, remembers the try and records the attempt.
  Future<void> run() async {
    final r = SideHustle.run(_plan);
    _result = r;
    _tries.add(HustleTry(price: r.price, items: r.items, sold: r.sold, profit: r.profit));
    stage = HustleStage.result;
    notifyListeners();
    await _record(outcomeFor(band, succeeded: r.success));
  }

  /// Try again: back to the plan; the plan and the tries are kept.
  void retry() {
    _beginAttempt();
    stage = HustleStage.plan;
    notifyListeners();
  }

  /// From a good result: explore another price on the market screen.
  void tryDifferentPrice() {
    _beginAttempt();
    stage = HustleStage.market;
    notifyListeners();
  }

  void toSummary() {
    stage = HustleStage.summary;
    notifyListeners();
  }

  void back() {
    final prev = switch (stage) {
      HustleStage.intro => HustleStage.intro,
      HustleStage.plan => HustleStage.intro,
      HustleStage.market => HustleStage.plan,
      HustleStage.result => HustleStage.market,
      HustleStage.summary => HustleStage.result,
    };
    if (prev == stage) return;
    stage = prev;
    notifyListeners();
  }

  Future<void> abandon() async {
    if (attemptOpen) await _record(AttemptOutcome.left);
  }

  Future<void> _record(AttemptOutcome outcome) async {
    final started = _startedAt;
    if (started == null || _recorded) return;
    _recorded = true;
    try {
      await sink?.call(outcome, started);
    } catch (_) {
      // Recording never blocks play; the repositories queue offline themselves.
    }
  }
}

/// Entry widget for every 13-15 screen (see [ClothingBrandFlow]).
class SideHustleFlow extends ConsumerStatefulWidget {
  const SideHustleFlow({super.key, required this.start, required this.state, this.poor = false});

  final HustleStage start;
  final ScreenState state;
  final bool poor;

  @override
  ConsumerState<SideHustleFlow> createState() => _SideHustleFlowState();
}

class _SideHustleFlowState extends ConsumerState<SideHustleFlow> {
  late final HustleFlowController _ctrl;
  String? _childId;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _ctrl = widget.start == HustleStage.intro
        ? HustleFlowController(sink: _record)
        : HustleFlowController.demo(widget.start, poor: widget.poor);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _record(AttemptOutcome outcome, DateTime startedAt) async {
    final childId = _childId;
    if (childId == null) return;
    await ref.read(attemptsRepositoryProvider).record(
          childId: childId,
          missionId: SideHustle.missionId,
          outcome: outcome,
          startedAt: startedAt,
        );
  }

  Future<void> _confirmLeave() async {
    final leave = await confirmLeaveMission(context);
    if (!leave || !mounted) return;
    await _ctrl.abandon();
    if (mounted) leaveMission(context);
  }

  Future<void> _claim(Child child) async {
    if (_busy) return;
    setState(() => _busy = true);
    await showRewards(
      context,
      childId: child.id,
      coins: SideHustle.coinsReward,
      xp: SideHustle.xpReward,
      badgeId: SideHustle.badgeId,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    goHome(context);
  }

  String _canvasId() {
    if (_ctrl.stage == HustleStage.result) {
      return (_ctrl.result?.success ?? true) ? 'ms-25-13-15-result-profit' : 'app-13-retry';
    }
    return _ctrl.stage.canvasId;
  }

  @override
  Widget build(BuildContext context) {
    final child = ref.watch(currentChildProvider);
    return ListenableBuilder(
      listenable: _ctrl,
      builder: (context, _) => KeyedSubtree(
        key: Key('screen-${_canvasId()}'),
        child: PopScope(
          canPop: _ctrl.stage == HustleStage.intro,
          onPopInvokedWithResult: (didPop, _) {
            if (!didPop) _confirmLeave();
          },
          child: StateGate(
            state: widget.state,
            onRetry: () => ref.invalidate(childrenProvider),
            normal: AsyncValueView<Child?>(
              value: child,
              onRetry: () => ref.invalidate(childrenProvider),
              isEmpty: (c) => c == null,
              empty: const EmptyView(title: 'Add a child first', message: 'Missions need a child profile to play.'),
              data: (c) {
                _childId = c!.id;
                return _stage(c);
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _stage(Child child) {
    final region = child.region;
    final h = mainButtonHeight(HustleFlowController.band);
    return switch (_ctrl.stage) {
      HustleStage.intro => _intro(region, h),
      HustleStage.plan => _plan(region, h),
      HustleStage.market => _market(region, h),
      HustleStage.result => (_ctrl.result!.success ? _profit(region, h) : _retry(region, h)),
      HustleStage.summary => _summary(child, h),
    };
  }

  String _m(Region r, int v) => formatMoney(r, v);

  // ------------------------------------------------------------ ms-23 intro

  Widget _intro(Region region, double h) {
    Widget step(String n, String text) => Row(
          children: [
            Container(
              width: 40,
              height: 40,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: Kc.softGold, borderRadius: BorderRadius.circular(12), border: Border.all(color: Kc.brown, width: Kc.border)),
              child: Text(n, style: KcText.headline.copyWith(fontSize: 18)),
            ),
            const SizedBox(width: 12),
            Expanded(child: Text(text, style: KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: 17))),
          ],
        );
    Widget fact(String l, String v) => Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(child: Text(l, style: KcText.label.copyWith(fontWeight: FontWeight.w700, color: Kc.brown80))),
            Text(v, style: KcText.label.copyWith(fontWeight: FontWeight.w800)),
          ],
        );
    return StagePage(
      gap: 14,
      bottom: PrimaryButton(label: 'Start my hustle', height: h, onPressed: _ctrl.start),
      children: [
        FlowHeader(eyebrow: 'Side Hustle · Mission 1', onBack: () => leaveMission(context)),
        Row(
          children: [
            const KudiImage(KudiPose.fist, width: 130),
            const SizedBox(width: 12),
            Expanded(child: Text('Your first sale', style: KcText.displayL.copyWith(fontSize: 34, height: 1.05))),
          ],
        ),
        Text(
          'Make something, set a price, and see what the market does. You will learn how cost, price and profit fit together.',
          style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 18, height: 1.4),
        ),
        Panel(
          radius: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              step('1', 'Set your budget and costs'),
              const SizedBox(height: 12),
              step('2', 'Choose a price'),
              const SizedBox(height: 12),
              step('3', 'Run the sale and read the results'),
              const SizedBox(height: 12),
              Container(height: 2, color: Kc.creamShade),
              const SizedBox(height: 12),
              fact('Starting budget', _m(region, SideHustle.budget)),
              const SizedBox(height: 12),
              fact('Reward', '${SideHustle.coinsReward} coins · ${SideHustle.xpReward} XP'),
              const SizedBox(height: 12),
              Text('You can try again as many times as you like. Coins here are pretend.',
                  style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 15, color: Kc.brown80)),
            ],
          ),
        ),
      ],
    );
  }

  // ----------------------------------------------------------- app-12 plan

  Widget _plan(Region region, double h) {
    final p = _ctrl.plan;
    final cost = p.totalCost;
    final ifAll = p.items * p.price;
    final profit = ifAll - cost;
    final scale = 112 / [cost, ifAll, 1].reduce((a, b) => a > b ? a : b);
    double bar(int v) => (v <= 0 ? 4.0 : v * scale).clamp(4, 112).toDouble();
    Widget col(String label, double height, Color color, {bool outline = false}) => Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Container(
                width: double.infinity,
                height: height,
                decoration: BoxDecoration(
                  color: color,
                  border: outline ? Border.all(color: Kc.brown, width: Kc.border) : null,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                ),
              ),
              const SizedBox(height: 4),
              Text(label, style: KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: 13)),
            ],
          ),
        );
    return StagePage(
      bottom: BottomActions(
        primary: PrimaryButton(label: 'Run the sale', height: h, onPressed: _ctrl.run),
        secondary: GhostButton(label: 'Read the market', height: 48, onPressed: _ctrl.readMarket),
      ),
      children: [
        FlowHeader(eyebrow: 'Side Hustle · First sale', title: 'Set your price', onBack: _ctrl.back),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              KcSlider(
                label: 'Cost per item',
                valueText: _m(region, p.cost),
                value: p.cost,
                min: SideHustle.minCost,
                max: SideHustle.maxCost,
                divisions: SideHustle.maxCost - SideHustle.minCost,
                onChanged: _ctrl.setCost,
              ),
              const SizedBox(height: 6),
              KcSlider(
                label: 'Selling price',
                valueText: _m(region, p.price),
                value: p.price,
                min: SideHustle.minPrice,
                max: SideHustle.maxPrice,
                divisions: SideHustle.maxPrice - SideHustle.minPrice,
                onChanged: _ctrl.setPrice,
              ),
              const SizedBox(height: 6),
              KcSlider(
                label: 'Items to make',
                valueText: '${p.items}',
                value: p.items,
                min: SideHustle.minItems,
                max: SideHustle.maxItemsFor(p.cost),
                divisions: SideHustle.maxItemsFor(p.cost) - SideHustle.minItems,
                onChanged: _ctrl.setItems,
              ),
            ],
          ),
        ),
        Panel(
          color: Kc.softGold,
          radius: 20,
          border: 3,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _line('Budget used', '${_m(region, cost)} of ${SideHustle.budget}'),
              const SizedBox(height: 8),
              _line('If all sell', _m(region, ifAll)),
              const SizedBox(height: 8),
              const RuleLine(),
              const SizedBox(height: 8),
              AmountRow('Profit', _m(region, profit), big: true),
              const SizedBox(height: 8),
              Text(
                'Profit is what you earn minus what it cost you. Raising the price may mean fewer buyers.',
                style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ],
          ),
        ),
        Panel(
          child: SizedBox(
            height: 140,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                col('Cost', bar(cost), Kc.orange),
                const SizedBox(width: 10),
                col('Income', bar(ifAll), Kc.yellow, outline: true),
                const SizedBox(width: 10),
                col('Profit', bar(profit), Kc.success),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _line(String l, String v) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(l, style: KcText.label)),
          Text(v, style: KcText.label),
        ],
      );

  // ---------------------------------------------------------- ms-24 market

  Widget _market(Region region, double h) {
    final p = _ctrl.plan;
    final buyers = SideHustle.buyers(p.price, p.cost);
    final sold = buyers < p.items ? buyers : p.items;
    return StagePage(
      bottom: PrimaryButton(label: 'Run the sale', height: h, onPressed: _ctrl.run),
      children: [
        FlowHeader(eyebrow: 'Side Hustle · First sale', title: 'Read the market', onBack: _ctrl.back),
        Panel(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('How many people would buy', style: KcText.headline.copyWith(fontSize: 18)),
              const SizedBox(height: 4),
              SizedBox(
                height: 190,
                child: CustomPaint(
                  painter: _DemandChart(region: region, price: p.price, cost: p.cost),
                  child: Semantics(
                    label: 'Demand curve. At ${_m(region, p.price)}, about $buyers people would buy.',
                    child: const SizedBox.expand(),
                  ),
                ),
              ),
            ],
          ),
        ),
        Panel(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              KcSlider(
                label: 'Selling price',
                valueText: _m(region, p.price),
                value: p.price,
                min: SideHustle.minPrice,
                max: SideHustle.maxPrice,
                divisions: SideHustle.maxPrice - SideHustle.minPrice,
                labelSize: 17,
                onChanged: _ctrl.setPrice,
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(_m(region, SideHustle.minPrice), style: KcText.caption.copyWith(fontWeight: FontWeight.w700, fontSize: 13)),
                  Text(_m(region, SideHustle.maxPrice), style: KcText.caption.copyWith(fontWeight: FontWeight.w700, fontSize: 13)),
                ],
              ),
            ],
          ),
        ),
        Panel(
          color: Kc.softGold,
          radius: 20,
          border: 3,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            children: [
              _boldLine('Expected buyers', '$sold of ${p.items}'),
              const SizedBox(height: 6),
              _boldLine('Expected income', _m(region, sold * p.price)),
              const SizedBox(height: 6),
              _boldLine('Cost of ${p.items} items', _m(region, p.totalCost)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _boldLine(String l, String v) => Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(child: Text(l, style: KcText.label)),
          Text(v, style: KcText.label.copyWith(fontWeight: FontWeight.w800)),
        ],
      );

  // ------------------------------------------------- ms-25 / app-13 results

  Widget _profit(Region region, double h) {
    final r = _ctrl.result!;
    final best = SideHustle.bestPrice(r.plan.cost, r.items);
    final bestRun = SideHustle.run(HustlePlan(cost: r.plan.cost, price: best, items: r.items));
    final hint = best != r.price && bestRun.profit > r.profit
        ? 'Curious? A price of ${_m(region, best)} might earn more. You can try it.'
        : 'That price earns the most for this batch. You can still try another.';
    return StagePage(
      gap: 14,
      bottom: BottomActions(
        primary: PrimaryButton(label: 'Continue', height: h, onPressed: _ctrl.toSummary),
        secondary: GhostButton(label: 'Try a different price', height: 52, onPressed: _ctrl.tryDifferentPrice),
      ),
      children: [
        Row(
          children: [
            const SuccessTick(),
            const SizedBox(width: 10),
            Expanded(child: Text('You made a profit!', style: KcText.headline.copyWith(fontSize: 28))),
          ],
        ),
        KudiSays('At ${_m(region, r.price)}, ${r.sold} of ${r.items} items sold.', pose: KudiPose.celebrate, width: 100),
        Panel(
          radius: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AmountRow('Cost (${r.items} items × ${_m(region, r.plan.cost)})', _m(region, r.costs)),
              const SizedBox(height: 10),
              AmountRow('Price per item', _m(region, r.price)),
              const SizedBox(height: 10),
              AmountRow('Units sold', '${r.sold}'),
              const SizedBox(height: 10),
              AmountRow('Income (${r.sold} × ${_m(region, r.price)})', _m(region, r.income)),
              const SizedBox(height: 10),
              const RuleLine(),
              const SizedBox(height: 10),
              AmountRow('Profit', _m(region, r.profit), big: true),
              const SizedBox(height: 10),
              Text('Profit = income minus cost: ${r.income} − ${r.costs} = ${r.profit}.',
                  style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 15, color: Kc.brown80)),
            ],
          ),
        ),
        const EarnedStrip(coins: SideHustle.coinsReward, xp: SideHustle.xpReward),
        Panel(
          color: Kc.peach,
          child: Text(hint, style: KcText.label.copyWith(fontWeight: FontWeight.w700, height: 1.4)),
        ),
      ],
    );
  }

  Widget _retry(Region region, double h) {
    final r = _ctrl.result!;
    final why = r.sold < r.items && r.price >= 15
        ? 'When the price goes up, fewer people buy. A price a little lower could sell more and earn more.'
        : r.profit < 0
            ? 'Costs were higher than sales this time. A smaller batch or a price buyers accept can change that.'
            : 'You made a small profit. A different price or batch size could raise it.';
    return StagePage(
      gap: 14,
      bottom: BottomActions(
        primary: PrimaryButton(label: 'Try again', height: h, onPressed: _ctrl.retry),
        secondary: GhostButton(label: 'Keep this result', onPressed: () => leaveMission(context)),
      ),
      children: [
        FlowHeader(title: 'Here is what happened', onBack: _ctrl.back),
        KudiSays('You sold ${r.sold} of ${r.items} items. Let\'s look at why.'),
        Panel(
          radius: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AmountRow('Price you set', _m(region, r.price)),
              const SizedBox(height: 10),
              AmountRow('Buyers at that price', '${r.sold} of ${r.items}'),
              const SizedBox(height: 10),
              AmountRow('Income', _m(region, r.income)),
              const SizedBox(height: 10),
              AmountRow('Cost of all ${r.items} items', _m(region, r.costs)),
              const SizedBox(height: 10),
              const RuleLine(),
              const SizedBox(height: 10),
              AmountRow(r.profit < 0 ? 'Loss' : 'Profit', _m(region, r.profit), big: true),
            ],
          ),
        ),
        Panel(
          color: Kc.peach,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Text(why, style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 17, height: 1.4)),
        ),
        const SafeNote(),
      ],
    );
  }

  // ------------------------------------------------------------ ms-26 summary

  Widget _summary(Child child, double h) {
    final region = child.region;
    final all = _ctrl.tries;
    final best = _ctrl.best;
    final recent = all.length <= 6 ? all : all.sublist(all.length - 5);
    final shown = [if (best != null && !recent.contains(best)) best, ...recent];
    final prices = all.map((t) => t.price).toSet().length;
    final line = prices >= 2
        ? 'You tested $prices prices and compared the profit. That is how real sellers decide.'
        : 'You ran your first sale and read the profit. Next time, test another price to compare.';
    Widget row(HustleTry t) {
      final isBest = identical(t, best);
      final style = KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 17);
      return Container(
        padding: EdgeInsets.symmetric(vertical: 8, horizontal: isBest ? 6 : 0),
        decoration: BoxDecoration(
          color: isBest ? Kc.softGold : null,
          borderRadius: BorderRadius.circular(10),
          border: isBest ? null : const Border(top: BorderSide(color: Kc.creamShade, width: 2)),
        ),
        child: Row(
          children: [
            Expanded(flex: 12, child: Text('${_m(region, t.price)}${isBest ? ' (best)' : ''}', style: style)),
            Expanded(flex: 10, child: Text('${t.sold} of ${t.items}', style: style)),
            Expanded(flex: 10, child: Text(_m(region, t.profit), textAlign: TextAlign.right, style: style.copyWith(fontWeight: FontWeight.w800))),
          ],
        ),
      );
    }

    final head = KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: 13, color: Kc.brown80);
    return StagePage(
      gap: 14,
      bottom: PrimaryButton(label: 'Collect my reward', height: h, onPressed: _busy ? null : () => _claim(child)),
      children: [
        const Eyebrow('Side Hustle · First sale'),
        Text('Round summary', style: KcText.displayL.copyWith(fontSize: 32, height: 1.1)),
        KudiSays(line, pose: KudiPose.thumbsUp, width: 96, size: 17),
        Panel(
          radius: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Your tries', style: KcText.headline.copyWith(fontSize: 18)),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(flex: 12, child: Text('PRICE', style: head)),
                  Expanded(flex: 10, child: Text('SOLD', style: head)),
                  Expanded(flex: 10, child: Text('PROFIT', textAlign: TextAlign.right, style: head)),
                ],
              ),
              const SizedBox(height: 6),
              for (final t in shown) row(t),
            ],
          ),
        ),
        Row(
          children: [
            const Expanded(child: RewardTile('+${SideHustle.coinsReward}', 'coins', big: 28)),
            const SizedBox(width: 12),
            const Expanded(child: RewardTile('+${SideHustle.xpReward}', 'XP', big: 28)),
          ],
        ),
        Panel(
          color: Kc.peach,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Text.rich(
            const TextSpan(children: [
              TextSpan(text: 'Skill growing:', style: TextStyle(fontWeight: FontWeight.w800)),
              TextSpan(text: ' Understand. Cost, price and profit now connect.'),
            ]),
            style: KcText.label.copyWith(fontWeight: FontWeight.w700, height: 1.4),
          ),
        ),
      ],
    );
  }
}

/// The market's demand curve with the chosen price marked.
class _DemandChart extends CustomPainter {
  _DemandChart({required this.region, required this.price, required this.cost});

  final Region region;
  final int price;
  final int cost;

  static const _yMax = 25.0;

  @override
  void paint(Canvas canvas, Size size) {
    const left = 40.0, top = 10.0, rightPad = 10.0, bottomPad = 40.0;
    final right = size.width - rightPad;
    final bottom = size.height - bottomPad;
    double x(num p) => left + (p - SideHustle.minPrice) / (SideHustle.maxPrice - SideHustle.minPrice) * (right - left);
    double y(num b) => bottom - (b / _yMax) * (bottom - top);

    final axis = Paint()
      ..color = Kc.brown
      ..strokeWidth = 2;
    canvas.drawLine(const Offset(left, top), Offset(left, bottom), axis);
    canvas.drawLine(Offset(left, bottom), Offset(right, bottom), axis);
    final grid = Paint()
      ..color = Kc.creamShade
      ..strokeWidth = 1;
    for (final v in [10, 20]) {
      canvas.drawLine(Offset(left, y(v)), Offset(right, y(v)), grid);
    }

    final path = Path();
    for (var p = SideHustle.minPrice; p <= SideHustle.maxPrice; p++) {
      final b = SideHustle.baseBuyers(p) * (100 + (cost - 8) * 4) / 100;
      final o = Offset(x(p), y(b));
      if (p == SideHustle.minPrice) {
        path.moveTo(o.dx, o.dy);
      } else {
        path.lineTo(o.dx, o.dy);
      }
    }
    canvas.drawPath(
      path,
      Paint()
        ..color = Kc.orange
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );

    final mine = SideHustle.baseBuyers(price) * (100 + (cost - 8) * 4) / 100;
    final mx = x(price), my = y(mine);
    final dash = Paint()
      ..color = Kc.brown
      ..strokeWidth = 2;
    for (var yy = my; yy < bottom; yy += 9) {
      canvas.drawLine(Offset(mx, yy), Offset(mx, (yy + 5).clamp(0, bottom).toDouble()), dash);
    }
    canvas.drawCircle(Offset(mx, my), 9, Paint()..color = Kc.yellow);
    canvas.drawCircle(
      Offset(mx, my),
      9,
      Paint()
        ..color = Kc.brown
        ..style = PaintingStyle.stroke
        ..strokeWidth = 3,
    );

    void text(String s, Offset at, {double size = 12, FontWeight w = FontWeight.w700, Color c = Kc.brown80, bool centerX = false}) {
      final tp = TextPainter(
        text: TextSpan(text: s, style: TextStyle(fontFamily: 'Nunito', fontSize: size, fontWeight: w, color: c)),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, centerX ? Offset(at.dx - tp.width / 2, at.dy) : at);
    }

    for (final v in [0, 10, 20]) {
      text('$v', Offset(left - 22, y(v) - 7));
    }
    for (final p in const [8, 15, 22, 28]) {
      text(formatMoney(region, p), Offset(x(p).clamp(left + 18, right - 18), bottom + 6), centerX: true);
    }
    final label = mx > right - 90 ? Offset(mx - 82, my - 24) : Offset(mx + 12, my - 20);
    text('Your price', label, size: 13, w: FontWeight.w800, c: Kc.brown);
  }

  @override
  bool shouldRepaint(_DemandChart old) => old.price != price || old.cost != cost || old.region != region;
}
