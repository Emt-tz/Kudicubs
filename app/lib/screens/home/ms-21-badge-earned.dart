// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import '../../core/widgets/motion.dart';

/// "New badge" celebration for a badge that was just unlocked.
class BadgeEarnedView extends StatelessWidget {
  const BadgeEarnedView({super.key, required this.title, this.pillar, this.onContinue});

  final String title;
  final String? pillar;
  final VoidCallback? onContinue;

  @override
  Widget build(BuildContext context) {
    return ScreenScaffold(
      key: const Key('screen-ms-21-badge-earned'),
      background: Kc.yellow,
      celebrate: true,
      bottom: Padding(
        padding: const EdgeInsets.only(bottom: Kc.s5),
        child: PrimaryButton(label: 'Add to my badges', onPressed: onContinue ?? () => Navigator.of(context).pop()),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text('New badge', style: KcText.displayL),
          const SizedBox(height: Kc.s5),
          PopIn(delay: const Duration(milliseconds: 250), child: Container(
            width: 160,
            height: 160,
            decoration: BoxDecoration(
              color: Kc.cream,
              shape: BoxShape.circle,
              border: Border.all(color: Kc.brown, width: Kc.border * 2),
            ),
            child: const Floaty(child: Icon(Icons.military_tech_rounded, size: 96, color: Kc.orange)),
          )),
          const SizedBox(height: Kc.s4),
          Text(title, style: KcText.displayL, textAlign: TextAlign.center),
          const SizedBox(height: Kc.s2),
          Text(
            pillar == null ? 'You earned this badge. Roar!' : 'You earned this $pillar badge. Roar!',
            style: KcText.bodyChild,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

/// Canvas `ms-21-badge-earned`. Gallery/demo build.
Widget build_ms_21_badge_earned(BuildContext context, ScreenState state) =>
    const BadgeEarnedView(title: 'Hard Worker', pillar: 'Earning');
