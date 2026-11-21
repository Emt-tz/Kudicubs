// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';

/// Asks "Leave this mission?" in a dialog. Returns true when the child chooses to leave,
/// false (or null dismissed -> false) when they keep playing. Coins so far are never lost.
Future<bool> confirmLeaveMission(BuildContext context) async {
  final leave = await showDialog<bool>(
    context: context,
    barrierColor: Kc.brown.withValues(alpha: 0.6),
    builder: (_) => const LeaveMissionDialog(),
  );
  return leave ?? false;
}

class LeaveMissionDialog extends StatelessWidget {
  const LeaveMissionDialog({super.key});

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Kc.cream,
      insetPadding: const EdgeInsets.all(Kc.s5),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Kc.rLg),
        side: const BorderSide(color: Kc.brown, width: Kc.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(Kc.s6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Center(child: KudiImage(KudiPose.wave, width: 120)),
            const SizedBox(height: Kc.s3),
            Text('Leave this mission?', style: KcText.title, textAlign: TextAlign.center),
            const SizedBox(height: Kc.s2),
            Text('Your coins so far are safe. You can come back any time.',
                style: KcText.bodyChild, textAlign: TextAlign.center),
            const SizedBox(height: Kc.s5),
            PrimaryButton(label: 'Keep playing', onPressed: () => Navigator.of(context).pop(false)),
            const SizedBox(height: Kc.s3),
            SecondaryButton(label: 'Leave', onPressed: () => Navigator.of(context).pop(true)),
          ],
        ),
      ),
    );
  }
}

/// Canvas `ms-22-leave-confirm`: the dialog shown over the paused mission.
Widget build_ms_22_leave_confirm(BuildContext context, ScreenState state) {
  return Scaffold(
    key: const Key('screen-ms-22-leave-confirm'),
    backgroundColor: Kc.cream,
    body: const SafeArea(
      child: Center(child: LeaveMissionDialog()),
    ),
  );
}
