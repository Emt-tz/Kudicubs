import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'home_logic.dart';

/// The real Home screen. [screenKey] is the canvas id key; [forced] / [forceHint] let the
/// gallery open each design variant (first visit, idle hint, offline, ...).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key, required this.screenKey, this.forced = ScreenState.normal, this.forceHint = false});

  final Key screenKey;
  final ScreenState forced;
  final bool forceHint;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childAsync = ref.watch(currentChildProvider);
    final online = ref.watch(onlineProvider);
    final child = childAsync.value;
    final bal = child == null ? null : ref.watch(balancesProvider(child.id));
    final attempts = child == null ? null : ref.watch(attemptsProvider(child.id));
    final missions = child == null ? null : ref.watch(missionsProvider(child.ageBand));

    final loading = childAsync.isLoading && !childAsync.hasValue ||
        (bal?.isLoading ?? false) && !(bal?.hasValue ?? false) ||
        (attempts?.isLoading ?? false) && !(attempts?.hasValue ?? false);
    final failed = childAsync.hasError || (bal?.hasError ?? false) && !(bal?.hasValue ?? false);
    final noProgress = (attempts?.value?.isEmpty ?? true) && (bal?.value?.xp ?? 0) == 0 && (bal?.value?.coins ?? 0) == 0;

    final view = homeViewFor(loading: loading, failed: failed, noProgress: noProgress, forced: forced);
    final offline = forced == ScreenState.offline || !online;

    void retry() {
      ref.invalidate(childrenProvider);
      if (child != null) {
        ref.invalidate(balancesProvider(child.id));
        ref.invalidate(attemptsProvider(child.id));
        ref.invalidate(missionsProvider(child.ageBand));
      }
      ref.read(onlineProvider.notifier).check();
    }

    switch (view) {
      case HomeView.loading:
        return Scaffold(key: screenKey, backgroundColor: Kc.cream, body: const SafeArea(child: LoadingView(message: 'Getting things ready...')));
      case HomeView.error:
        return Scaffold(
          key: screenKey,
          backgroundColor: Kc.cream,
          body: SafeArea(
            child: Column(children: [
              Expanded(
                child: ErrorView(
                  title: 'We could not load your profile',
                  message: "Do not worry, your coins are safe. Let's try again.",
                  onRetry: retry,
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: Kc.s5),
                child: SecondaryButton(label: 'Back to the start', onPressed: () => context.go('/welcome')),
              ),
            ]),
          ),
        );
      case HomeView.firstVisit:
      case HomeView.normal:
        break;
    }

    if (child == null && forced == ScreenState.normal) {
      return Scaffold(
        key: screenKey,
        backgroundColor: Kc.cream,
        body: SafeArea(
          child: EmptyView(
            title: 'Welcome!',
            message: 'Let us set up your first cub.',
            actionLabel: "Let's go",
            onAction: () => context.go('/welcome'),
          ),
        ),
      );
    }

    final balances = bal?.value ?? const Balances();
    final info = LevelInfo(balances.xp);
    final first = view == HomeView.firstVisit;
    final next = missions?.value == null ? null : nextMission(missions!.value!, attempts?.value ?? const []);
    final done = missionsDoneToday(attempts?.value ?? const [], DateTime.now()).length;
    final badgeCount = child == null ? 0 : (ref.watch(badgesProvider(child.id)).value ?? const []).where((b) => b.earned).length;
    final symbol = (child?.region ?? Region.gh).symbol;

    void play() => context.push('/mission/${missionRouteFor(child?.ageBand ?? AgeBand.b4_6)}');

    return IdleHintDetector(
      builder: (context, hintOn, content) {
        final hint = hintOn || forceHint;
        return Scaffold(
          key: screenKey,
          backgroundColor: Kc.cream,
          body: SafeArea(
            child: Column(children: [
              if (offline) Padding(
                padding: const EdgeInsets.fromLTRB(Kc.s5, Kc.s3, Kc.s5, 0),
                child: const StateBanner(message: 'You are offline. Your play is saved on this device.', kind: BannerKind.offline),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(Kc.s5),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                    Row(children: [
                      Expanded(child: Text(child == null ? 'Hi!' : 'Hi, ${child.nickname}!', style: KcText.displayL)),
                      CoinChip(amount: balances.coins),
                    ]),
                    const SizedBox(height: Kc.s2),
                    Text('Level ${info.level} · ${info.title}', style: KcText.label),
                    const SizedBox(height: Kc.s2),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(Kc.rPill),
                      child: LinearProgressIndicator(
                        value: info.fraction,
                        minHeight: 12,
                        color: Kc.orange,
                        backgroundColor: Kc.peach,
                      ),
                    ),
                    const SizedBox(height: Kc.s1),
                    Text('${balances.xp} XP  Next: ${info.nextTitle} at ${info.nextAt}', style: KcText.caption),
                    const SizedBox(height: Kc.s5),
                    _MissionCard(
                      first: first,
                      title: next?.title ?? 'New missions soon',
                      hint: hint,
                      onPlay: next == null ? null : play,
                    ),
                    const SizedBox(height: Kc.s4),
                    _DailyCard(done: done, onTap: () => context.push('/daily')),
                    const SizedBox(height: Kc.s4),
                    Row(children: [
                      Expanded(child: Text('$badgeCount badges', style: KcText.label)),
                      Text('$symbol coins', style: KcText.label),
                    ]),
                  ]),
                ),
              ),
              KcBottomNav(
                index: 0,
                onTap: (i) {
                  if (i == 1) context.go('/wallet');
                  if (i == 2) context.go('/progress');
                },
              ),
            ]),
          ),
        );
      },
      child: const SizedBox.shrink(),
    );
  }
}

class _MissionCard extends StatelessWidget {
  const _MissionCard({required this.first, required this.title, required this.hint, required this.onPlay});
  final bool first;
  final String title;
  final bool hint;
  final VoidCallback? onPlay;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(Kc.s5),
      decoration: BoxDecoration(
        color: Kc.softGold,
        borderRadius: BorderRadius.circular(Kc.rLg),
        border: Border.all(color: Kc.brown, width: Kc.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(first ? 'Start your first mission' : 'Next mission', style: KcText.label),
        const SizedBox(height: Kc.s1),
        Text(first ? '$title is waiting for you!' : title, style: KcText.title),
        if (hint) ...[
          const SizedBox(height: Kc.s2),
          Semantics(
            liveRegion: true,
            child: Text(first ? "Tap Let's go!" : 'Tap Continue!', style: KcText.buttonSmall.copyWith(color: Kc.brown)),
          ),
        ],
        const SizedBox(height: Kc.s4),
        PulseHint(on: hint, child: PrimaryButton(label: first ? "Let's go" : 'Continue', onPressed: onPlay)),
      ]),
    );
  }
}

class _DailyCard extends StatelessWidget {
  const _DailyCard({required this.done, required this.onTap});
  final int done;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: 'Market day, $done of $dailyGoal missions done',
        excludeSemantics: true,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Container(
            constraints: const BoxConstraints(minHeight: 80),
            padding: const EdgeInsets.all(Kc.s4),
            decoration: BoxDecoration(
              color: Kc.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Kc.brown, width: Kc.border),
            ),
            child: Row(children: [
              Container(
                width: 52,
                height: 52,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Kc.peach,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Kc.brown, width: Kc.border),
                ),
                child: Text('$done/$dailyGoal', style: KcText.buttonSmall),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Market day', style: KcText.buttonSmall),
                  Text('Finish $dailyGoal missions today for $dailyBonusCoins coins', style: KcText.caption),
                ]),
              ),
            ]),
          ),
        ),
      );
}
