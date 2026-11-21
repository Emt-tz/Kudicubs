/// Plays The Lost Coins from the intro to the reward. One widget, one state machine ([LostCoinsMachine]).
///
/// Each designed screen id has a builder that starts this player at its step (`start`) so the
/// gallery can open it directly; the real entry (`/mission/4-6`) starts at the intro.
library;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/band_rules.dart';
import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/widgets/widgets.dart';
import '../home/reward_coordinator.dart';
import 'common.dart';
import 'content.dart';
import 'logic.dart';
import 'saver.dart';
import 'views.dart';

const _phaseIds = {
  Phase46.intro: 'app-06-mission-intro',
  Phase46.replay: 'ms-07-replay',
  Phase46.find: 'app-07-find-coins',
  Phase46.sort: 'ms-02-sort-jars',
  Phase46.count: 'ms-03-count',
  Phase46.decision: 'app-08-decision',
  Phase46.resultSave: 'ms-04-result-save',
  Phase46.resultSpend: 'ms-05-result-spend',
  Phase46.summary: 'ms-06-summary',
};

class LostCoinsPlayer extends ConsumerStatefulWidget {
  const LostCoinsPlayer({
    super.key,
    required this.id,
    required this.state,
    this.start = Phase46.intro,
    this.hint = false,
  });

  /// Canvas id this instance stands for (its `screen-<id>` key is on the first and the forced-state frames).
  final String id;
  final ScreenState state;
  final Phase46 start;

  /// ms-01: open the find step with Kudi's hint showing.
  final bool hint;

  @override
  ConsumerState<LostCoinsPlayer> createState() => _LostCoinsPlayerState();
}

class _LostCoinsPlayerState extends ConsumerState<LostCoinsPlayer> {
  LostCoinsMachine? _m;
  MissionSaver? _saver;
  late final DateTime _startedAt = DateTime.now();
  Timer? _idle;
  Timer? _auto;
  bool _hint = false;
  bool _saveFailed = false;
  bool _busy = false;
  bool _forcedError = false;
  int? _selectedCoin;
  String? _sortMessage;

  @override
  void initState() {
    super.initState();
    _hint = widget.hint;
    _forcedError =
        widget.state == ScreenState.error || widget.id == 'ms-09-mission-error';
  }

  @override
  void dispose() {
    _idle?.cancel();
    _auto?.cancel();
    super.dispose();
  }

  static const _demoChild = Child(
    id: 'demo',
    nickname: 'Ama',
    ageBand: AgeBand.b4_6,
    region: Region.gh,
    avatar: 'cub-friend-2',
  );

  Key get _idKey => Key('screen-${widget.id}');

  bool get _gallery => widget.start != Phase46.intro;

  // ---- flow ---------------------------------------------------------------------------

  void _afterChange() {
    final m = _m!;
    _idle?.cancel();
    _auto?.cancel();
    if (m.phase == Phase46.find && !m.allFound) {
      _idle = Timer(Duration(seconds: firstHintSeconds(AgeBand.b4_6)), () {
        if (mounted && _m?.phase == Phase46.find) setState(() => _hint = true);
      });
    }
    if ((m.phase == Phase46.find && m.allFound) ||
        (m.phase == Phase46.sort && m.allSorted)) {
      _auto = Timer(const Duration(milliseconds: 800), () {
        if (!mounted) return;
        setState(() {
          _m!.advance();
          _hint = false;
          _selectedCoin = null;
          _sortMessage = null;
          _afterChange();
        });
      });
    }
  }

  void _update(VoidCallback f) {
    setState(() {
      f();
      _afterChange();
    });
  }

  Future<void> _leave() async {
    final leave = await confirmLeaveMission(context);
    if (!leave || !mounted) return;
    // Leaving early keeps everything already earned; the attempt is only logged.
    unawaited(_saver?.note(AttemptOutcome.left, _startedAt));
    goHome(context);
  }

  Future<void> _finish() async {
    final m = _m!, saver = _saver!;
    setState(() => _busy = true);
    final ok = await saver.commit(m.outcome, _startedAt);
    if (!mounted) return;
    if (!ok) {
      setState(() {
        _busy = false;
        _saveFailed = true;
      });
      return;
    }
    await saver.writeEvents(m.choiceEvents);
    final plan = m.reward;
    final childId = saver.childId;
    if (!mounted) return;
    setState(() {
      _busy = false;
      _saveFailed = false;
    });
    await showRewards(
      context,
      childId: childId,
      coins: plan.coins,
      xp: plan.xp,
      badgeId: plan.badgeId,
    );
    if (mounted) goHome(context);
  }

  Future<void> _parkAndLeave() async {
    final m = _m!, saver = _saver!;
    await saver.writeEvents(m.choiceEvents);
    await saver.parkRewards(m.reward);
    if (mounted) goHome(context);
  }

  // ---- build --------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    if (widget.state == ScreenState.loading ||
        widget.id == 'ms-08-mission-loading') {
      return MissionLoadingView(key: _idKey, title: lostCoinsTitle);
    }
    final childAsync = ref.watch(currentChildProvider);
    if (childAsync.hasError && !childAsync.hasValue) {
      return ErrorView(
        key: _idKey,
        message: 'We could not open your player. Your coins are safe.',
        onRetry: () => ref.invalidate(childrenProvider),
      );
    }
    // A direct gallery open of a mid-mission design works without a signed-in family.
    final child =
        childAsync.value ??
        (_gallery && !childAsync.isLoading ? _demoChild : null);
    if (childAsync.isLoading && child == null) {
      return MissionLoadingView(key: _idKey, title: lostCoinsTitle);
    }
    if (child == null) {
      return EmptyView(
        key: _idKey,
        title: 'Pick a player first',
        actionLabel: 'Back to home',
        onAction: () => goHome(context),
      );
    }
    final attempts = ref.watch(attemptsProvider(child.id));
    if (attempts.isLoading && !attempts.hasValue && _m == null) {
      return MissionLoadingView(key: _idKey, title: lostCoinsTitle);
    }

    if (_m == null) {
      // History that cannot be read (offline) never blocks play: treat it as a first play.
      final replay =
          attempts.value?.any(
            (a) =>
                a.missionId == lostCoinsMissionId &&
                (a.outcome == AttemptOutcome.success ||
                    a.outcome == AttemptOutcome.gentle),
          ) ??
          false;
      _m = _gallery
          ? LostCoinsMachine.demo(widget.start)
          : LostCoinsMachine(replay: replay);
      _saver = MissionSaver(
        attempts: ref.read(attemptsRepositoryProvider),
        wallet: ref.read(walletRepositoryProvider),
        childId: child.id,
        missionId: lostCoinsMissionId,
      );
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _afterChange();
      });
    }
    final m = _m!;
    final online = ref.watch(onlineProvider);
    final offline = widget.state == ScreenState.offline;
    final showOffline =
        offline || (!online && (m.phase == Phase46.summary || _saveFailed));
    final banner = showOffline ? const OfflineStrip() : null;

    if (_forcedError || _saveFailed) {
      return SavingErrorView46(
        key: _forcedError ? _idKey : const Key('screen-ms-09-mission-error'),
        plan: m.reward,
        busy: _busy,
        banner: banner,
        onRetry: () {
          if (_forcedError) {
            setState(() => _forcedError = false);
          } else {
            _finish();
          }
        },
        onHome: () => _forcedError ? goHome(context) : _parkAndLeave(),
      );
    }

    Key keyFor(Phase46 p) => Key('screen-${_phaseIds[p]}');
    switch (m.phase) {
      case Phase46.intro:
        return IntroView46(
          key: keyFor(m.phase),
          banner: banner,
          onBack: () => goHome(context),
          onStart: () => _update(m.begin),
        );
      case Phase46.replay:
        return ReplayView46(
          key: keyFor(m.phase),
          banner: banner,
          onPlay: () => _update(m.playAgain),
          onNotNow: () => goHome(context),
        );
      case Phase46.find:
        return FindView46(
          key: Key('screen-${_hint ? 'ms-01-find-hint' : 'app-07-find-coins'}'),
          banner: banner,
          found: m.found,
          hint: _hint,
          onLeave: _leave,
          onSpot: (i) => _update(() {
            m.tapSpot(i);
            _hint = false;
          }),
        );
      case Phase46.sort:
        return SortView46(
          key: keyFor(m.phase),
          banner: banner,
          machine: m,
          region: child.region,
          selected: _selectedCoin,
          message: _sortMessage,
          onLeave: _leave,
          onSelect: (i) =>
              setState(() => _selectedCoin = _selectedCoin == i ? null : i),
          onPlace: (coin, jar) => _update(() {
            final ok = m.place(coin, jar);
            _selectedCoin = null;
            _sortMessage = ok ? null : 'Almost! Try another jar.';
          }),
        );
      case Phase46.count:
        return CountView46(
          key: keyFor(m.phase),
          banner: banner,
          machine: m,
          onLeave: _leave,
          onPick: (n) => _update(() => m.pickCount(n)),
          onDone: () => _update(m.submitCount),
        );
      case Phase46.decision:
        return DecisionView46(
          key: keyFor(m.phase),
          banner: banner,
          machine: m,
          region: child.region,
          onLeave: _leave,
          onPick: (c) => _update(() => m.pickChoice(c)),
          onChoose: () => _update(m.confirmChoice),
        );
      case Phase46.resultSave:
        return ResultSaveView46(
          key: keyFor(m.phase),
          banner: banner,
          onNext: () => _update(m.next),
        );
      case Phase46.resultSpend:
        final coins = ref.watch(balancesProvider(child.id)).value?.coins;
        return ResultSpendView46(
          key: keyFor(m.phase),
          banner: banner,
          region: child.region,
          coinsLeft: coins == null ? null : coins + foundPot - treatCost,
          onNext: () => _update(m.next),
        );
      case Phase46.summary:
        return SummaryView46(
          key: keyFor(m.phase),
          banner: banner,
          machine: m,
          name: child.nickname,
          busy: _busy,
          onReward: _finish,
        );
    }
  }
}
