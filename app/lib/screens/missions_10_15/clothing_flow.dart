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

/// The 10-12 mission "Clothing Brand" as one state machine:
/// intro -> funding -> split the coins -> result -> summary (+ reward).
enum ClothingStage {
  intro('ms-15-10-12-intro'),
  funding('app-11-band-10-12'),
  split('ms-16-10-12-resource'),
  result('ms-17-10-12-result-success'),
  summary('ms-19-10-12-summary');

  const ClothingStage(this.canvasId);
  final String canvasId;
}

/// All the state of one play. Pure Dart apart from [ChangeNotifier]: the host
/// supplies the [sink] that writes attempts; without a sink (gallery demos)
/// nothing is recorded.
///
/// Rules (core/band_rules.dart): a weak month records `retry`, never costs a
/// coin, a badge or XP, and Try again keeps every choice made so far.
class ClothingFlowController extends ChangeNotifier {
  ClothingFlowController({this.sink, this.stage = ClothingStage.intro, Funding funding = Funding.investor, CoinSplit? split})
      : _funding = funding,
        _split = split ?? ClothingBrand.defaultSplit(funding) {
    if (stage == ClothingStage.result || stage == ClothingStage.summary) _result = ClothingBrand.run(_funding, _split);
  }

  /// A ready-made state for the gallery: [poor] shows the try-again screen.
  factory ClothingFlowController.demo(ClothingStage stage, {bool poor = false}) => ClothingFlowController(
        stage: stage,
        split: poor ? ClothingBrand.demoPoorSplit : null,
      );

  static const band = AgeBand.b10_12;

  final AttemptSink? sink;
  ClothingStage stage;
  Funding _funding;
  CoinSplit _split;
  ClothingResult? _result;
  DateTime? _startedAt;
  bool _recorded = false;

  Funding get funding => _funding;
  CoinSplit get split => _split;
  int get capital => ClothingBrand.capitalFor(_funding);
  ClothingResult? get result => _result;

  /// True once an attempt was started and not yet recorded.
  bool get attemptOpen => _startedAt != null && !_recorded;

  void _beginAttempt() {
    _startedAt = DateTime.now();
    _recorded = false;
  }

  /// Intro -> funding. Starts an attempt.
  void start() {
    _beginAttempt();
    stage = ClothingStage.funding;
    notifyListeners();
  }

  /// Picks how to raise the money; a new funding resets the split to its sensible default.
  void chooseFunding(Funding f) {
    if (f == _funding) return;
    _funding = f;
    _split = ClothingBrand.defaultSplit(f);
    notifyListeners();
  }

  void confirmFunding() {
    stage = ClothingStage.split;
    notifyListeners();
  }

  /// Moves one slider; never lets the total pass the money available.
  void setSplit({int? materials, int? marketing, int? wages}) {
    var next = _split.copyWith(materials: materials, marketing: marketing, wages: wages);
    final over = next.total - capital;
    if (over > 0) {
      if (materials != null) next = next.copyWith(materials: materials - over);
      if (marketing != null) next = next.copyWith(marketing: marketing - over);
      if (wages != null) next = next.copyWith(wages: wages - over);
    }
    _split = next;
    notifyListeners();
  }

  /// Opens the shop: works out the month and records the attempt.
  Future<void> run() async {
    final r = ClothingBrand.run(_funding, _split);
    _result = r;
    stage = ClothingStage.result;
    notifyListeners();
    await _record(outcomeFor(band, succeeded: r.success));
  }

  /// Try again: back to the split with every choice kept; a new attempt begins.
  void retry() {
    _beginAttempt();
    stage = ClothingStage.split;
    notifyListeners();
  }

  void toSummary() {
    stage = ClothingStage.summary;
    notifyListeners();
  }

  /// One step back through the mission (the intro's back button leaves instead).
  void back() {
    final prev = switch (stage) {
      ClothingStage.intro => ClothingStage.intro,
      ClothingStage.funding => ClothingStage.intro,
      ClothingStage.split => ClothingStage.funding,
      ClothingStage.result => ClothingStage.split,
      ClothingStage.summary => ClothingStage.result,
    };
    if (prev == stage) return;
    stage = prev;
    notifyListeners();
  }

  /// The child leaves in the middle of an attempt: record `left` once.
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

/// Entry widget for every 10-12 screen: [start] picks which canvas screen is
/// showing first (the intro for real play, any stage for the gallery).
class ClothingBrandFlow extends ConsumerStatefulWidget {
  const ClothingBrandFlow({super.key, required this.start, required this.state, this.poor = false});

  final ClothingStage start;
  final ScreenState state;

  /// Gallery only: start on the try-again result.
  final bool poor;

  @override
  ConsumerState<ClothingBrandFlow> createState() => _ClothingBrandFlowState();
}

class _ClothingBrandFlowState extends ConsumerState<ClothingBrandFlow> {
  late final ClothingFlowController _ctrl;
  String? _childId;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _ctrl = widget.start == ClothingStage.intro
        ? ClothingFlowController(sink: _record)
        : ClothingFlowController.demo(widget.start, poor: widget.poor);
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
          missionId: ClothingBrand.missionId,
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
      coins: ClothingBrand.coinsReward,
      xp: ClothingBrand.xpReward,
      badgeId: ClothingBrand.badgeId,
    );
    if (!mounted) return;
    setState(() => _busy = false);
    goHome(context);
  }

  String _canvasId() {
    final s = _ctrl.stage;
    if (s == ClothingStage.result) {
      return (_ctrl.result?.success ?? true) ? 'ms-17-10-12-result-success' : 'ms-18-10-12-result-retry';
    }
    return s.canvasId;
  }

  @override
  Widget build(BuildContext context) {
    final child = ref.watch(currentChildProvider);
    return ListenableBuilder(
      listenable: _ctrl,
      builder: (context, _) => KeyedSubtree(
        key: Key('screen-${_canvasId()}'),
        child: PopScope(
          canPop: _ctrl.stage == ClothingStage.intro,
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
    final h = mainButtonHeight(ClothingFlowController.band);
    return switch (_ctrl.stage) {
      ClothingStage.intro => _intro(region, h),
      ClothingStage.funding => _funding(region, h),
      ClothingStage.split => _split(region, h),
      ClothingStage.result => (_ctrl.result!.success ? _success(region, h) : _retry(region, h)),
      ClothingStage.summary => _summary(child, h),
    };
  }

  // ------------------------------------------------------------- ms-15 intro

  Widget _intro(Region region, double h) {
    Widget way(String n, String title, String sub) => Panel(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              _NumberTile(n, size: 44),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: KcText.headline.copyWith(fontSize: 20)),
                    Text(sub, style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 15, color: Kc.brown80)),
                  ],
                ),
              ),
            ],
          ),
        );
    return StagePage(
      gap: 14,
      bottom: PrimaryButton(label: 'Start the mission', height: h, onPressed: _ctrl.start),
      children: [
        FlowHeader(eyebrow: 'Founder Mode · Mission 1', onBack: () => leaveMission(context)),
        Row(
          children: [
            const KudiImage(KudiPose.wave, width: 120),
            const SizedBox(width: 12),
            Expanded(child: Text('Clothing Brand', style: KcText.displayL.copyWith(fontSize: 34, height: 1.05))),
          ],
        ),
        Text(
          'You want to start a small clothing brand and need ${formatMoney(region, ClothingBrand.need)} to make your first batch. There are three ways to fund it.',
          style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 18, height: 1.4),
        ),
        way('1', 'A loan', 'Pay it back with extra'),
        way('2', 'An investor', 'Share a part of your profit'),
        way('3', 'Your savings', 'Slower, but all yours'),
        Text(
          'Reward ${ClothingBrand.coinsReward} coins · ${ClothingBrand.xpReward} XP · skill: Invest',
          textAlign: TextAlign.center,
          style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 15, color: Kc.brown80),
        ),
      ],
    );
  }

  // ------------------------------------------------------- app-11 funding

  Widget _funding(Region region, double h) {
    final f = _ctrl.funding;
    Widget option(Funding value, String title, String tag, String body, String cost) {
      final selected = f == value;
      return Semantics(
        button: true,
        selected: selected,
        label: '$title. $body $cost',
        excludeSemantics: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: () => _ctrl.chooseFunding(value),
          child: Container(
            constraints: const BoxConstraints(minHeight: Kc.touchMin),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: selected ? Kc.softGold : Kc.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Kc.brown, width: selected ? 4 : 3),
              boxShadow: selected ? const [BoxShadow(color: Kc.brown, offset: Offset(0, 4))] : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(child: Text(title, style: KcText.headline.copyWith(fontSize: 22))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: selected ? Kc.white : Kc.peach, borderRadius: BorderRadius.circular(Kc.rPill)),
                      child: Text(tag, style: KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: 14)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(body, style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 15, height: 1.35, color: selected ? Kc.brown : Kc.brown80)),
                const SizedBox(height: 6),
                Text(cost, style: KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: 15)),
              ],
            ),
          ),
        ),
      );
    }

    final need = formatMoney(region, ClothingBrand.need);
    final label = switch (f) {
      Funding.loan => 'Choose bank loan',
      Funding.investor => 'Choose investor',
      Funding.savings => 'Choose your savings',
    };
    return StagePage(
      bottom: PrimaryButton(label: label, height: h, onPressed: _ctrl.confirmFunding),
      children: [
        FlowHeader(eyebrow: 'Founder Mode · Mission 1', title: 'Clothing Brand', onBack: _ctrl.back),
        Text.rich(
          TextSpan(children: [
            const TextSpan(text: 'You need '),
            TextSpan(text: need, style: const TextStyle(fontWeight: FontWeight.w800)),
            const TextSpan(text: ' to start your brand. How will you fund it?'),
          ]),
          style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 17, height: 1.4),
        ),
        option(
          Funding.loan,
          'Bank loan',
          'Borrow',
          'You own all of the brand. You pay back ${formatMoney(region, ClothingBrand.loanRepay())} over 12 months.',
          'Cost: ${formatMoney(region, ClothingBrand.loanExtra())} extra',
        ),
        option(
          Funding.investor,
          'Investor',
          'Share',
          'No repayment. The investor gets ${ClothingBrand.investorSharePercent}% of the profit.',
          'Cost: ${ClothingBrand.investorSharePercent}% of future profit',
        ),
        option(
          Funding.savings,
          'Your savings',
          'Own money',
          'You have ${formatMoney(region, ClothingBrand.savingsCapital)} saved, so you start smaller with a limited range.',
          'Cost: a slower start',
        ),
        const SoftNote('Market opens in a few turns. Take your time.'),
      ],
    );
  }

  // ------------------------------------------------------ ms-16 resources

  Widget _split(Region region, double h) {
    final s = _ctrl.split;
    final cap = _ctrl.capital;
    final left = cap - s.total;
    const step = ClothingBrand.step;
    Widget slider(String label, int value, void Function(int) onChanged) => KcSlider(
          label: label,
          valueText: formatMoney(region, value),
          value: value,
          min: 0,
          max: cap,
          divisions: cap ~/ step,
          onChanged: onChanged,
        );
    return StagePage(
      bottom: PrimaryButton(label: 'Open for business', height: h, onPressed: s.total > 0 ? _ctrl.run : null),
      children: [
        FlowHeader(eyebrow: 'Founder Mode · Clothing Brand', title: 'Split your ${formatMoney(region, cap)}', onBack: _ctrl.back),
        Panel(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              slider('Materials', s.materials, (v) => _ctrl.setSplit(materials: v)),
              const SizedBox(height: 6),
              slider('Marketing', s.marketing, (v) => _ctrl.setSplit(marketing: v)),
              const SizedBox(height: 6),
              slider("Helpers' wages", s.wages, (v) => _ctrl.setSplit(wages: v)),
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Planned', style: KcText.label),
                  Flexible(
                    child: Text('${formatMoney(region, s.total)} of ${formatMoney(region, cap).replaceFirst('${region.symbol} ', '')}',
                        style: KcText.label, textAlign: TextAlign.right),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(Kc.rPill),
                child: Container(
                  height: 14,
                  decoration: BoxDecoration(color: Kc.white, border: Border.all(color: Kc.brown, width: Kc.border), borderRadius: BorderRadius.circular(Kc.rPill)),
                  alignment: Alignment.centerLeft,
                  child: FractionallySizedBox(widthFactor: (s.total / cap).clamp(0.0, 1.0).toDouble(), child: Container(color: Kc.orange)),
                ),
              ),
              const SizedBox(height: 8),
              AmountRow('Left to place', formatMoney(region, left), big: true),
            ],
          ),
        ),
        Panel(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              const KudiImage(KudiPose.headphones, width: 64),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Less marketing means fewer people hear about you. Less in materials means fewer items to sell.',
                  style: KcText.label.copyWith(fontWeight: FontWeight.w700, height: 1.35),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ------------------------------------------------- ms-17 / ms-18 results

  List<Widget> _costRows(Region region, ClothingResult r) => [
        AmountRow('Materials', formatMoney(region, r.split.materials)),
        AmountRow('Marketing', formatMoney(region, r.split.marketing)),
        AmountRow("Helpers' wages", formatMoney(region, r.split.wages)),
      ];

  Widget _success(Region region, double h) {
    final r = _ctrl.result!;
    return StagePage(
      gap: 14,
      bottom: PrimaryButton(label: 'Continue', height: h, onPressed: _ctrl.toSummary),
      children: [
        Row(
          children: [
            const SuccessTick(),
            const SizedBox(width: 10),
            Expanded(child: Text('Your brand launched!', style: KcText.headline.copyWith(fontSize: 28))),
          ],
        ),
        KudiSays('Balanced spending sold ${r.sold} of ${r.made} items.', pose: KudiPose.celebrate, width: 110),
        Panel(
          radius: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ..._costRows(region, r),
              const SizedBox(height: 10),
              const RuleLine(),
              const SizedBox(height: 10),
              AmountRow('Sales', formatMoney(region, r.sales)),
              if (r.financing > 0) ...[
                const SizedBox(height: 10),
                AmountRow(_financingLabel(r.funding), formatMoney(region, -r.financing)),
              ],
              const SizedBox(height: 10),
              AmountRow('Profit', formatMoney(region, r.net), big: true),
            ],
          ),
        ),
        const EarnedStrip(coins: ClothingBrand.coinsReward, xp: ClothingBrand.xpReward),
      ],
    );
  }

  String _financingLabel(Funding f) => f == Funding.loan ? 'Loan: extra to repay' : "Investor's share";

  Widget _retry(Region region, double h) {
    final r = _ctrl.result!;
    final line = switch (r.diagnosis) {
      ClothingDiagnosis.fewBuyers => 'You made ${r.made} items but only ${r.sold} sold. Let\'s look at where the coins went.',
      ClothingDiagnosis.fewItems =>
        '${r.buyers} people wanted to buy, but you could only make ${r.made} items. Let\'s look at where the coins went.',
      _ => 'You sold ${r.sold} items, but the cost of the money left no profit. Let\'s look at where the coins went.',
    };
    final why = switch (r.diagnosis) {
      ClothingDiagnosis.fewBuyers =>
        'With only ${formatMoney(region, r.split.marketing)} on marketing, few people heard about the brand. Moving some coins from materials to marketing could help.',
      ClothingDiagnosis.fewItems =>
        'Buyers were ready, but there were not enough items. Putting more coins into materials and helpers\' wages lets you make more to sell.',
      _ =>
        '${_financingLabel(r.funding)} used up the profit. Another way of funding it, or spending the coins differently, might fit better.',
    };
    return StagePage(
      gap: 14,
      bottom: BottomActions(
        primary: PrimaryButton(label: 'Try again', height: h, onPressed: _ctrl.retry),
        secondary: GhostButton(label: 'Keep this result', onPressed: () => leaveMission(context)),
      ),
      children: [
        FlowHeader(title: 'Here is what happened', onBack: _ctrl.back),
        KudiSays(line),
        Panel(
          radius: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ..._costRows(region, r),
              const SizedBox(height: 10),
              const RuleLine(),
              const SizedBox(height: 10),
              AmountRow('Sales (${r.sold} sold)', formatMoney(region, r.sales)),
              if (r.financing > 0) ...[
                const SizedBox(height: 10),
                AmountRow(_financingLabel(r.funding), formatMoney(region, -r.financing)),
              ],
              const SizedBox(height: 10),
              AmountRow('Result', formatMoney(region, r.net), big: true),
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

  // ------------------------------------------------------------ ms-19 summary

  Widget _summary(Child child, double h) {
    final region = child.region;
    final r = _ctrl.result!;
    final s = r.split;
    final total = s.total == 0 ? 1 : s.total;
    int pct(int v) => (v * 100 / total).round();
    final balanced = pct(s.materials) >= 15 && pct(s.marketing) >= 15 && pct(s.wages) >= 15;
    final line = balanced
        ? 'Spreading coins across materials, marketing and people made the brand grow.'
        : 'Your plan made a profit. Next time, try spreading coins across materials, marketing and people.';
    Widget part(String name, int v, Color color) => Row(
          children: [
            Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: 1))),
            const SizedBox(width: 8),
            Expanded(child: Text('$name (${pct(v)}%)', style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 15))),
            Text(formatMoney(region, v), style: KcText.label.copyWith(fontWeight: FontWeight.w700, fontSize: 15)),
          ],
        );
    Widget seg(int v, Color c) => v <= 0 ? const SizedBox.shrink() : Expanded(flex: v, child: Container(color: c));
    return StagePage(
      gap: 14,
      bottom: PrimaryButton(label: 'Collect my reward', height: h, onPressed: _busy ? null : () => _claim(child)),
      children: [
        const Eyebrow('Founder Mode · Clothing Brand'),
        Text('Round summary', style: KcText.displayL.copyWith(fontSize: 32, height: 1.1)),
        KudiSays(line, pose: KudiPose.thumbsUp, width: 96, size: 17),
        Panel(
          radius: 20,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Where your ${formatMoney(region, r.spent)} went', style: KcText.headline.copyWith(fontSize: 18)),
              const SizedBox(height: 12),
              Container(
                height: 22,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(Kc.rPill), border: Border.all(color: Kc.brown, width: Kc.border)),
                clipBehavior: Clip.antiAlias,
                child: Row(children: [seg(s.materials, Kc.orange), seg(s.marketing, Kc.yellow), seg(s.wages, Kc.peach)]),
              ),
              const SizedBox(height: 12),
              part('Materials', s.materials, Kc.orange),
              const SizedBox(height: 6),
              part('Marketing', s.marketing, Kc.yellow),
              const SizedBox(height: 6),
              part('Wages', s.wages, Kc.peach),
            ],
          ),
        ),
        Row(
          children: [
            Expanded(child: RewardTile('+${ClothingBrand.coinsReward}', 'coins')),
            const SizedBox(width: 10),
            Expanded(child: RewardTile('+${ClothingBrand.xpReward}', 'XP')),
            const SizedBox(width: 10),
            Expanded(child: RewardTile(formatMoney(region, r.net).replaceAll(' ', ''), 'profit')),
          ],
        ),
        Panel(
          color: Kc.peach,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Text.rich(
            const TextSpan(children: [
              TextSpan(text: 'Skill growing:', style: TextStyle(fontWeight: FontWeight.w800)),
              TextSpan(text: ' Invest. You weighed where each coin works hardest.'),
            ]),
            style: KcText.label.copyWith(fontWeight: FontWeight.w700, height: 1.4),
          ),
        ),
      ],
    );
  }
}

class _NumberTile extends StatelessWidget {
  const _NumberTile(this.n, {required this.size});
  final String n;
  final double size;

  @override
  Widget build(BuildContext context) => Container(
        width: size,
        height: size,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Kc.softGold,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Kc.brown, width: Kc.border),
        ),
        child: Text(n, style: KcText.headline.copyWith(fontSize: size * 0.45)),
      );
}
