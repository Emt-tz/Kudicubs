// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'parent_data.dart';
import 'parent_widgets.dart';
import 'package:flutter/services.dart';

/// Canvas `pa-12-deleted`: the family data is gone. "Back to start" clears this phone and opens the welcome screen.
Widget build_pa_12_deleted(BuildContext context, ScreenState state) =>
    const _DeletedPage(key: Key('screen-pa-12-deleted'));

class _DeletedPage extends ConsumerWidget {
  const _DeletedPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) => DeletedView(
    onDone: () async {
      await ref.read(deviceRepositoryProvider).forgetLocal();
      ref.read(parentUnlockedProvider.notifier).lock();
      await ref.read(onboardedProvider.notifier).set(false);
      if (context.mounted) context.go('/welcome');
    },
  );
}

class DeletedView extends StatelessWidget {
  const DeletedView({super.key, required this.onDone});
  final VoidCallback onDone;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Kc.brown,
    appBar: AppBar(toolbarHeight: 0, primary: false, elevation: 0, scrolledUnderElevation: 0, backgroundColor: Kc.brown, systemOverlayStyle: SystemUiOverlayStyle.light),
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    const SizedBox(height: 24),
                    const KudiImage(KudiPose.thumbsUp, width: 200),
                    const SizedBox(height: 14),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                      decoration: BoxDecoration(color: Kc.cream, borderRadius: BorderRadius.circular(Kc.rPill)),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.check_circle_outline_rounded, color: Kc.success, size: 24),
                          const SizedBox(width: 10),
                          Text('All done', style: PT.strong(16, color: Kc.brown)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text('Your family data is deleted', style: PT.display(32), textAlign: TextAlign.center),
                    const SizedBox(height: 14),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 310),
                      child: Text(
                        'Every child profile, all progress and badges, and your parent account have been erased. We kept nothing.',
                        style: PT.body(17),
                        textAlign: TextAlign.center,
                      ),
                    ),
                    const SizedBox(height: 14),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 310),
                      child: Text(
                        'Thank you for playing with Kudi. You are always welcome to join the Pride again.',
                        style: PT.body(15, color: Kc.softGold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            ParentPrimary('Back to start', onPressed: onDone),
          ],
        ),
      ),
    ),
  );
}
