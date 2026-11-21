// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';

/// Reward screen: shows what was just earned. The wallet events are written by
/// `showRewards` (reward_coordinator.dart); this view only displays and continues.
class RewardView extends ConsumerWidget {
  const RewardView({super.key, required this.coins, required this.xp, this.onContinue});

  final int coins;
  final int xp;
  final VoidCallback? onContinue;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final name = ref.watch(currentChildProvider).value?.nickname;
    return ScreenScaffold(
      key: const Key('screen-app-09-reward'),
      background: Kc.yellow,
      bottom: Padding(
        padding: const EdgeInsets.only(bottom: Kc.s5),
        child: PrimaryButton(label: 'Continue', onPressed: onContinue ?? () => Navigator.of(context).pop()),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const KudiImage(KudiPose.celebrate, width: 220),
          const SizedBox(height: Kc.s3),
          Text(name == null ? 'Well done!' : 'Well done, $name!', style: KcText.displayL, textAlign: TextAlign.center),
          const SizedBox(height: Kc.s5),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _Stat(value: '+$coins', label: 'coins'),
              const SizedBox(width: Kc.s4),
              _Stat(value: '+$xp', label: 'XP'),
            ],
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Semantics(
        label: '$value $label',
        excludeSemantics: true,
        child: Container(
          width: 140,
          padding: const EdgeInsets.symmetric(vertical: Kc.s4),
          decoration: BoxDecoration(
            color: Kc.cream,
            borderRadius: BorderRadius.circular(Kc.rLg),
            border: Border.all(color: Kc.brown, width: Kc.border),
          ),
          child: Column(children: [
            Text(value, style: KcText.displayXl),
            Text(label, style: KcText.bodyChild),
          ]),
        ),
      );
}

/// Canvas `app-09-reward`. Gallery/demo build; real flow uses [RewardView] via `showRewards`.
Widget build_app_09_reward(BuildContext context, ScreenState state) => const RewardView(coins: 30, xp: 40);
