import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/data/models.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import 'reward_coordinator.dart';

/// Seconds of no interaction before Home highlights its primary action.
const Duration idleHintDelay = Duration(seconds: 8);

/// Missions to finish in one day for the daily challenge, and its bonus coins.
const int dailyGoal = 3;
const int dailyBonusCoins = 10;

/// What Home shows. Real data picks one; the gallery can force one.
enum HomeView { loading, error, firstVisit, normal }

/// Pure state mapping for Home. [forced] is the gallery override (`normal` = no override).
HomeView homeViewFor({
  required bool loading,
  required bool failed,
  required bool noProgress,
  ScreenState forced = ScreenState.normal,
}) {
  if (forced == ScreenState.loading || loading) return HomeView.loading;
  if (forced == ScreenState.error || failed) return HomeView.error;
  if (forced == ScreenState.empty || noProgress) return HomeView.firstVisit;
  return HomeView.normal;
}

/// Level, title and the XP target for the next level (see [levelForXp]).
class LevelInfo {
  const LevelInfo(this.xp);
  final int xp;

  int get level => levelForXp(xp);
  String get title => levelTitle(level);
  int get nextAt => level * xpPerLevel;
  String get nextTitle => levelTitle(level + 1);
  double get fraction => xpIntoLevel(xp) / xpPerLevel;
}

/// The mission to suggest: first mission (play order) without a finished attempt,
/// else the first one. Null when the band has no missions yet.
Mission? nextMission(List<Mission> missions, List<Attempt> attempts) {
  if (missions.isEmpty) return null;
  final sorted = [...missions]..sort((a, b) => a.position.compareTo(b.position));
  final done = {for (final a in attempts) if (_finished(a)) a.missionId};
  return sorted.firstWhere((m) => !done.contains(m.id), orElse: () => sorted.first);
}

bool _finished(Attempt a) => a.outcome == AttemptOutcome.success || a.outcome == AttemptOutcome.gentle;

bool _sameDay(DateTime a, DateTime b) {
  final x = a.toLocal(), y = b.toLocal();
  return x.year == y.year && x.month == y.month && x.day == y.day;
}

/// Distinct missions finished today (capped at [dailyGoal]), in finish order.
List<String> missionsDoneToday(List<Attempt> attempts, DateTime now) {
  final seen = <String>[];
  final today = attempts.where((a) => _finished(a) && _sameDay(a.finishedAt ?? a.startedAt, now)).toList()
    ..sort((a, b) => (a.finishedAt ?? a.startedAt).compareTo(b.finishedAt ?? b.startedAt));
  for (final a in today) {
    if (!seen.contains(a.missionId)) seen.add(a.missionId);
  }
  return seen.take(dailyGoal).toList();
}

/// Whether the +10 daily bonus was already written today.
bool dailyClaimedToday(List<WalletEvent> events, DateTime now) =>
    events.any((e) => e.kind == WalletKind.daily && _sameDay(e.createdAt, now));

/// `/mission/<band>` path segment, e.g. "4-6".
String missionRouteFor(AgeBand band) => band.label.replaceAll('–', '-');

/// Calls [onIdle] once after [delay] without a pointer-down inside; any touch resets it.
/// Used by Home so the primary action is highlighted after 8 s (constitution: never wonder what to do).
class IdleHintDetector extends StatefulWidget {
  const IdleHintDetector({super.key, required this.child, required this.builder, this.delay = idleHintDelay});

  final Widget child;
  final Duration delay;

  /// Builds around [child] with the current hint flag.
  final Widget Function(BuildContext context, bool hintOn, Widget child) builder;

  @override
  State<IdleHintDetector> createState() => _IdleHintDetectorState();
}

class _IdleHintDetectorState extends State<IdleHintDetector> {
  Timer? _timer;
  bool _hint = false;

  @override
  void initState() {
    super.initState();
    _arm();
  }

  void _arm() {
    _timer?.cancel();
    _timer = Timer(widget.delay, () {
      if (mounted) setState(() => _hint = true);
    });
  }

  void _touched() {
    if (_hint) setState(() => _hint = false);
    _arm();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Listener(
        behavior: HitTestBehavior.translucent,
        onPointerDown: (_) => _touched(),
        child: widget.builder(context, _hint, widget.child),
      );
}

/// Pulses [child] gently while [on] (reduced motion: static highlight only).
class PulseHint extends StatefulWidget {
  const PulseHint({super.key, required this.on, required this.child});
  final bool on;
  final Widget child;

  @override
  State<PulseHint> createState() => _PulseHintState();
}

class _PulseHintState extends State<PulseHint> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));

  @override
  void didUpdateWidget(PulseHint old) {
    super.didUpdateWidget(old);
    if (widget.on && !_c.isAnimating && !MediaQuery.disableAnimationsOf(context)) {
      _c.repeat(reverse: true);
    } else if (!widget.on) {
      _c.stop();
      _c.value = 0;
    }
  }

  @override
  void initState() {
    super.initState();
    if (widget.on) _c.repeat(reverse: true);
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _c,
        builder: (context, child) => Transform.scale(
          scale: 1 + 0.05 * _c.value,
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(Kc.rPill),
              boxShadow: widget.on ? [BoxShadow(color: Kc.orange.withValues(alpha: 0.6), blurRadius: 18, spreadRadius: 3)] : null,
            ),
            child: child,
          ),
        ),
        child: widget.child,
      );
}

/// Home / Wallet / Progress bar shared by Home. [index] 0 = Home.
class KcBottomNav extends StatelessWidget {
  const KcBottomNav({super.key, required this.index, required this.onTap});
  final int index;
  final void Function(int) onTap;

  @override
  Widget build(BuildContext context) {
    const items = [('Home', Icons.home_rounded), ('Wallet', Icons.account_balance_wallet_rounded), ('Progress', Icons.bar_chart_rounded)];
    return Container(
      padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom),
      decoration: const BoxDecoration(color: Kc.white, border: Border(top: BorderSide(color: Kc.brown, width: Kc.border))),
      child: Row(children: [
        for (var i = 0; i < items.length; i++)
          Expanded(
            child: InkWell(
              onTap: () => onTap(i),
              child: Semantics(
                button: true,
                selected: i == index,
                label: items[i].$1,
                excludeSemantics: true,
                child: SizedBox(
                  height: 64,
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(items[i].$2, color: i == index ? Kc.orange : Kc.brown80),
                    Text(items[i].$1, style: KcText.caption.copyWith(color: i == index ? Kc.brown : Kc.brown80, fontWeight: FontWeight.w700)),
                  ]),
                ),
              ),
            ),
          ),
      ]),
    );
  }
}
