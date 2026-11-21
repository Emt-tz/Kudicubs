// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'reward_coordinator.dart';

/// Level-up celebration. Level formula: `levelForXp(xp) = 1 + xp ~/ 300` (reward_coordinator.dart).
class LevelUpView extends StatelessWidget {
  const LevelUpView({super.key, required this.level, required this.xp, this.onContinue});

  final int level;
  final int xp;
  final VoidCallback? onContinue;

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      key: const Key('screen-ms-20-level-up'),
      background: Kc.yellow,
      bottom: Padding(
        padding: const EdgeInsets.only(bottom: Kc.s5),
        child: PrimaryButton(label: 'Continue', onPressed: onContinue ?? () => Navigator.of(context).pop()),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('Level up!', style: KcText.displayL),
          const SizedBox(height: Kc.s3),
          const KudiImage(KudiPose.fist, width: 200),
          const SizedBox(height: Kc.s3),
          Semantics(
            label: 'Level $level',
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: Kc.s6, vertical: Kc.s2),
              decoration: BoxDecoration(
                color: Kc.cream,
                borderRadius: BorderRadius.circular(Kc.rPill),
                border: Border.all(color: Kc.brown, width: Kc.border),
              ),
              child: Text('Level $level', style: KcText.displayXl),
            ),
          ),
          const SizedBox(height: Kc.s4),
          Text('You are a ${levelTitle(level)}!', style: KcText.title, textAlign: TextAlign.center),
          const SizedBox(height: Kc.s2),
          Text('$xp XP reached. New missions will open soon.', style: KcText.bodyChild, textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

/// Canvas `ms-20-level-up`. Gallery/demo build.
Widget build_ms_20_level_up(BuildContext context, ScreenState state) => const LevelUpView(level: 3, xp: 600);
