import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'home_logic.dart';
import '../../core/widgets/motion.dart';

/// Writes the +10 daily bonus (`wallet_events` kind 'daily') at most once per day.
/// Reads the log first; in-flight calls for the same child are collapsed.
final Set<String> _claiming = {};

Future<bool> claimDailyBonus(WidgetRef ref, String childId) async {
  if (!_claiming.add(childId)) return false;
  try {
    final repo = ref.read(walletRepositoryProvider);
    final events = await repo.events(childId);
    if (dailyClaimedToday(events, DateTime.now())) return false;
    await repo.addEvent(childId: childId, kind: WalletKind.daily, amount: dailyBonusCoins, label: 'Market day');
    ref.invalidate(balancesProvider(childId));
    ref.invalidate(walletEventsProvider(childId));
    return true;
  } catch (_) {
    return false;
  } finally {
    _claiming.remove(childId);
  }
}

/// Daily challenge: in progress (hm-06) or complete (hm-07), from the real attempts.
/// [forceComplete] lets the gallery open the complete design directly.
class DailyScreen extends ConsumerWidget {
  const DailyScreen({super.key, required this.screenKey, this.forced = ScreenState.normal, this.forceComplete = false});

  final Key screenKey;
  final ScreenState forced;
  final bool forceComplete;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final child = ref.watch(currentChildProvider).value;
    if (forced == ScreenState.loading) {
      return Scaffold(key: screenKey, backgroundColor: Kc.cream, body: const SafeArea(child: LoadingView(message: 'Getting things ready...')));
    }
    if (forced == ScreenState.error) {
      return Scaffold(
        key: screenKey,
        backgroundColor: Kc.cream,
        body: SafeArea(child: ErrorView(message: "Do not worry, your coins are safe. Let's try again.", onRetry: () => context.go('/home'))),
      );
    }
    if (child == null) {
      return Scaffold(
        key: screenKey,
        backgroundColor: Kc.cream,
        body: SafeArea(child: EmptyView(title: 'Welcome!', actionLabel: "Let's go", onAction: () => context.go('/welcome'))),
      );
    }
    final attempts = ref.watch(attemptsProvider(child.id));
    final missions = ref.watch(missionsProvider(child.ageBand)).value ?? const <Mission>[];
    if (attempts.isLoading && !attempts.hasValue) {
      return Scaffold(key: screenKey, backgroundColor: Kc.cream, body: const SafeArea(child: LoadingView(message: 'Getting things ready...')));
    }
    if (attempts.hasError && !attempts.hasValue) {
      return Scaffold(
        key: screenKey,
        backgroundColor: Kc.cream,
        body: SafeArea(child: ErrorView(onRetry: () => ref.invalidate(attemptsProvider(child.id)))),
      );
    }
    final list = attempts.value ?? const <Attempt>[];
    final doneIds = missionsDoneToday(list, DateTime.now());
    if (doneIds.length >= dailyGoal || forceComplete) {
      return _Complete(screenKey: screenKey, childId: child.id, claim: !forceComplete || doneIds.length >= dailyGoal);
    }
    final titles = {for (final m in missions) m.id: m.title};
    final upcoming = [for (final m in missions) if (!doneIds.contains(m.id)) m.title];
    final rows = <(String, bool)>[
      for (final id in doneIds) (titles[id] ?? 'Mission', true),
      for (final t in upcoming.take(dailyGoal - doneIds.length)) (t, false),
    ];
    final left = dailyGoal - doneIds.length;
    return ScreenScaffold(
      key: screenKey,
      title: 'Market day',
      showBack: true,
      scrollable: true,
      bottom: Padding(
        padding: const EdgeInsets.only(bottom: Kc.s5),
        child: PrimaryButton(label: 'Play the next one', onPressed: () => context.push('/mission/${missionRouteFor(child.ageBand)}')),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('${doneIds.length} of $dailyGoal missions done!', style: KcText.displayL),
        const SizedBox(height: Kc.s1),
        Text(left == 1 ? 'One more for $dailyBonusCoins bonus coins' : '$left more for $dailyBonusCoins bonus coins', style: KcText.bodyChild),
        const SizedBox(height: Kc.s5),
        for (final r in rows)
          Padding(
            padding: const EdgeInsets.only(bottom: Kc.s3),
            child: Container(
              constraints: const BoxConstraints(minHeight: 64),
              padding: const EdgeInsets.symmetric(horizontal: Kc.s4),
              decoration: BoxDecoration(
                color: r.$2 ? Kc.softGold : Kc.white,
                borderRadius: BorderRadius.circular(Kc.rMd),
                border: Border.all(color: Kc.brown, width: Kc.border),
              ),
              child: Row(children: [
                Icon(r.$2 ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded, color: r.$2 ? Kc.success : Kc.brown60),
                const SizedBox(width: Kc.s3),
                Expanded(child: Text(r.$1, style: KcText.buttonSmall)),
              ]),
            ),
          ),
      ]),
    );
  }
}

class _Complete extends ConsumerStatefulWidget {
  const _Complete({required this.screenKey, required this.childId, required this.claim});
  final Key screenKey;
  final String childId;
  final bool claim;

  @override
  ConsumerState<_Complete> createState() => _CompleteState();
}

class _CompleteState extends ConsumerState<_Complete> {
  @override
  void initState() {
    super.initState();
    if (widget.claim) Future.microtask(() => claimDailyBonus(ref, widget.childId));
  }

  @override
  Widget build(BuildContext context) => ScreenScaffold(
        key: widget.screenKey,
        background: Kc.yellow,
        celebrate: true,
        bottom: Padding(
          padding: const EdgeInsets.only(bottom: Kc.s5),
          child: PrimaryButton(label: 'Continue', onPressed: () => context.go('/home')),
        ),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const KudiImage(KudiPose.celebrate, width: 200),
          const SizedBox(height: Kc.s3),
          Text('Market day complete', style: KcText.displayL, textAlign: TextAlign.center),
          const SizedBox(height: Kc.s1),
          Text('$dailyGoal of $dailyGoal done. Roar!', style: KcText.title, textAlign: TextAlign.center),
          const SizedBox(height: Kc.s4),
          PopIn(delay: const Duration(milliseconds: 500), child: Text('+$dailyBonusCoins coins', style: KcText.displayXl)),
          const SizedBox(height: Kc.s2),
          Text('A new Market day starts tomorrow.', style: KcText.bodyChild, textAlign: TextAlign.center),
        ]),
      );
}
