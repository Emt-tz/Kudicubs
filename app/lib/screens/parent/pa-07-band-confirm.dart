// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

/// Canvas `pa-07-band-confirm`: "Change Ama to ages 7-9?" over the settings page.
/// In Settings the same card opens as a dialog; this page is the full-screen version of it.
Widget build_pa_07_band_confirm(BuildContext context, ScreenState state) =>
    _BandConfirmPage(key: const Key('screen-pa-07-band-confirm'), state: state);

class _BandConfirmPage extends ConsumerWidget {
  const _BandConfirmPage({super.key, required this.state});
  final ScreenState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final child = ref.watch(currentChildProvider);
    if (state == ScreenState.loading || (child.isLoading && !child.hasValue)) {
      return const ParentPage(scroll: false, child: ParentMessage(title: 'Getting things ready...'));
    }
    final c = child.value;
    if (c == null || state == ScreenState.error || state == ScreenState.offline) {
      return ParentPage(
        scroll: false,
        child: ParentMessage(
          title: c == null ? 'No child yet' : 'Oops!',
          message: c == null ? 'Add a child first.' : 'We could not load this. Nothing has been lost.',
          pose: c == null ? KudiPose.wave : KudiPose.headphones,
          actionLabel: 'Back',
          onAction: () => goBackOr(context, '/parent/settings'),
        ),
      );
    }
    final to = nextBand(c.ageBand);
    Widget faded(Widget w) => Opacity(opacity: 0.5, child: w);
    return ParentPage(
      scroll: false,
      overlay: DialogScrim(
        child: ConfirmCard(
          title: bandChangeTitle(c.nickname, to),
          body: confirmBody(
            '${bandChangeBody(to)} ',
            "${c.nickname}'s progress is kept.",
            ' You can change this back any time.',
          ),
          primaryLabel: 'Keep ages ${c.ageBand.label}',
          onPrimary: () => goBackOr(context, '/parent/settings'),
          secondaryLabel: 'Change to ages ${to.label}',
          onSecondary: () async {
            await ref.read(childrenProvider.notifier).edit(c.copyWith(ageBand: to));
            if (context.mounted) goBackOr(context, '/parent/settings');
          },
        ),
      ),
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            faded(Text('‹ Parent area', style: PT.strong(16, color: Kc.softGold))),
            const SizedBox(height: 14),
            faded(Text('Settings', style: PT.display(32))),
            const SizedBox(height: 14),
            faded(
              SettingRow(
                title: 'Age band for ${c.nickname}',
                trailing: Text('${to.label} ›', style: PT.strong(16)),
                minHeight: 64,
              ),
            ),
            const SizedBox(height: 14),
            faded(
              SettingRow(
                title: 'Country',
                trailing: Text('${c.region.label} ›', style: PT.strong(16)),
                minHeight: 64,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
