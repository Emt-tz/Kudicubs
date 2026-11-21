/// Plays Birthday Party (ages 7–9) from the intro to the reward with [PartyMachine].
///
/// Every designed screen id starts this player at its step (`start`) so the gallery can open it
/// directly; the real entry (`/mission/7-9`) starts at the intro.
library;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/widgets/widgets.dart';
import '../home/reward_coordinator.dart';
import '../missions_4_6/common.dart';
import '../missions_4_6/saver.dart';
import 'content.dart';
import 'logic.dart';
import 'views.dart';

const _phaseIds = {
  Phase79.intro: 'ms-10-7-9-intro',
  Phase79.decision: 'app-10-band-7-9',
  Phase79.success: 'ms-11-7-9-result-success',
  Phase79.retry: 'ms-12-7-9-result-retry',
  Phase79.summary: 'ms-13-7-9-summary',
};

class PartyPlayer extends ConsumerStatefulWidget {
  const PartyPlayer({
    super.key,
    required this.id,
    required this.state,
    this.start = Phase79.intro,
  });

  /// Canvas id this instance stands for (its `screen-<id>` key is on the loading and forced-state frames).
  final String id;
  final ScreenState state;
  final Phase79 start;

  @override
  ConsumerState<PartyPlayer> createState() => _PartyPlayerState();
}

class _PartyPlayerState extends ConsumerState<PartyPlayer> {
  PartyMachine? _m;
  MissionSaver? _saver;
  late final DateTime _startedAt = DateTime.now();
  bool _saveFailed = false;
  bool _busy = false;
  bool _forcedError = false;

  @override
  void initState() {
    super.initState();
    _forcedError =
        widget.state == ScreenState.error ||
        widget.id == 'ms-14-7-9-saving-error';
  }

  static const _demoChild = Child(
    id: 'demo',
    nickname: 'Ama',
    ageBand: AgeBand.b7_9,
    region: Region.gh,
    avatar: 'cub-friend-2',
  );

  Key get _idKey => Key('screen-${widget.id}');

  bool get _gallery => widget.start != Phase79.intro;

  Future<void> _leave() async {
    // Leaving mid-plan keeps everything already earned; the attempt is only logged.
    final leave = await confirmLeaveMission(context);
    if (!leave || !mounted) return;
    unawaited(_saver?.note(AttemptOutcome.left, _startedAt));
    goHome(context);
  }

  void _confirm() {
    final m = _m!;
    setState(() {
      final ok = m.confirm();
      // A try that went over budget is logged as `retry`: no coins, XP or badges are touched.
      if (!ok && m.phase == Phase79.retry) {
        unawaited(_saver!.note(m.outcome, _startedAt));
      }
    });
  }

  Future<void> _collect() async {
    final m = _m!, saver = _saver!;
    final plan = m.reward;
    setState(() => _busy = true);
    // A kept over-budget result was already logged as `retry`; only a successful plan is saved here.
    final ok = m.kept && !m.withinBudget
        ? true
        : await saver.commit(m.outcome, _startedAt);
    if (!mounted) return;
    setState(() {
      _busy = false;
      _saveFailed = !ok;
    });
    if (!ok) return;
    await showRewards(
      context,
      childId: saver.childId,
      coins: plan.coins,
      xp: plan.xp,
      badgeId: plan.badgeId,
    );
    if (mounted) goHome(context);
  }

  Future<void> _parkAndLeave() async {
    await _saver!.parkRewards(_m!.reward);
    if (mounted) goHome(context);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.state == ScreenState.loading) {
      return MissionLoadingView(key: _idKey, title: partyTitle);
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
      return MissionLoadingView(key: _idKey, title: partyTitle);
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
      return MissionLoadingView(key: _idKey, title: partyTitle);
    }

    if (_m == null) {
      // History that cannot be read (offline) never blocks play: treat it as a first play.
      final replay =
          attempts.value?.any(
            (a) =>
                a.missionId == partyMissionId &&
                a.outcome == AttemptOutcome.success,
          ) ??
          false;
      _m = _gallery
          ? PartyMachine.demo(widget.start)
          : PartyMachine(replay: replay);
      _saver = MissionSaver(
        attempts: ref.read(attemptsRepositoryProvider),
        wallet: ref.read(walletRepositoryProvider),
        childId: child.id,
        missionId: partyMissionId,
      );
    }
    final m = _m!;
    final region = child.region;
    final online = ref.watch(onlineProvider);
    final offline = widget.state == ScreenState.offline || !online;
    final banner =
        widget.state == ScreenState.offline ||
            (!online && m.phase == Phase79.summary)
        ? const OfflineStrip()
        : null;

    if (_forcedError || _saveFailed) {
      return SavingError79(
        key: _forcedError ? _idKey : const Key('screen-ms-14-7-9-saving-error'),
        plan: m.reward,
        offline: offline || widget.id == 'ms-14-7-9-saving-error',
        busy: _busy,
        onRetry: () {
          if (_forcedError) {
            setState(() => _forcedError = false);
          } else {
            _collect();
          }
        },
        onHome: () => _forcedError ? goHome(context) : _parkAndLeave(),
      );
    }

    final key = Key('screen-${_phaseIds[m.phase]}');
    switch (m.phase) {
      case Phase79.intro:
        return Intro79(
          key: key,
          banner: banner,
          region: region,
          onBack: () => goHome(context),
          onStart: () => setState(m.begin),
        );
      case Phase79.decision:
        return Decision79(
          key: key,
          banner: banner,
          machine: m,
          region: region,
          onBack: _leave,
          onToggle: (id) => setState(() => m.toggle(id)),
          onConfirm: _confirm,
        );
      case Phase79.success:
        return Success79(
          key: key,
          banner: banner,
          machine: m,
          region: region,
          onContinue: () => setState(m.toSummary),
        );
      case Phase79.retry:
        return Retry79(
          key: key,
          banner: banner,
          machine: m,
          region: region,
          onTryAgain: () => setState(m.tryAgain),
          onBack: () => setState(m.tryAgain),
          onKeep: () => setState(m.keepResult),
        );
      case Phase79.summary:
        return Summary79(
          key: key,
          banner: banner,
          machine: m,
          region: region,
          busy: _busy,
          onCollect: _collect,
        );
    }
  }
}
