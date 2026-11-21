// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import 'parent_data.dart';
import 'parent_settings_view.dart';
import 'parent_widgets.dart';

/// Canvas `pa-10-signout-confirm`: "Sign out of this device?" over the settings page.
/// In Settings the same card opens as a dialog; this page is the full-screen version of it.
Widget build_pa_10_signout_confirm(BuildContext context, ScreenState state) =>
    _SignOutPage(key: const Key('screen-pa-10-signout-confirm'), state: state);

class _SignOutPage extends ConsumerWidget {
  const _SignOutPage({super.key, required this.state});
  final ScreenState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sound = ref.watch(soundOnProvider);
    final narration = ref.watch(narrationOnProvider);
    Widget faded(Widget w) => Opacity(opacity: 0.5, child: w);
    return ParentPage(
      scroll: false,
      overlay: DialogScrim(
        child: ConfirmCard(
          title: 'Sign out of this device?',
          body: TextSpan(
            text:
                "Your children's progress stays safe in your family account. To come back, you will need your email and a new one-time code.",
            style: PT.body(17, color: Kc.brown),
          ),
          primaryLabel: 'Stay signed in',
          onPrimary: () => goBackOr(context, '/parent/settings'),
          secondaryLabel: 'Sign out',
          onSecondary: () => performSignOut(context, ref),
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
                title: 'Sound',
                trailing: Text(sound ? 'On' : 'Off', style: PT.strong(16)),
                minHeight: 64,
              ),
            ),
            const SizedBox(height: 14),
            faded(
              SettingRow(
                title: 'Narration',
                trailing: Text(narration ? 'On' : 'Off', style: PT.strong(16)),
                minHeight: 64,
              ),
            ),
            const Spacer(),
            faded(const ParentOutline('Sign out', onPressed: null, color: Kc.cream, height: 52, fontSize: 16)),
          ],
        ),
      ),
    );
  }
}
