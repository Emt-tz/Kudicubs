// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import 'parent_data.dart';
import 'parent_widgets.dart';

/// Canvas `pa-09-device-mode`: "Whose device is this?" (my phone or a family device), saved in `devices`.
Widget build_pa_09_device_mode(BuildContext context, ScreenState state) =>
    DeviceModeView(key: const Key('screen-pa-09-device-mode'), state: state);

class DeviceModeView extends ConsumerStatefulWidget {
  const DeviceModeView({super.key, this.state = ScreenState.normal, this.newDevice = true, this.onDone});

  final ScreenState state;

  /// Shown as step 2 of signing in on a new device; false from Settings.
  final bool newDevice;

  /// Called after the mode is saved instead of the default navigation.
  final VoidCallback? onDone;

  @override
  ConsumerState<DeviceModeView> createState() => _DeviceModeViewState();
}

class _DeviceModeViewState extends ConsumerState<DeviceModeView> {
  DeviceMode? _picked;
  bool _saving = false;
  String? _error;

  Future<void> _save(DeviceMode mode) async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(deviceRepositoryProvider).setMode(mode);
      ref.invalidate(deviceModeProvider);
      if (!mounted) return;
      if (widget.onDone != null) {
        widget.onDone!();
      } else {
        context.go(mode == DeviceMode.myPhone ? '/parent' : '/home');
      }
    } catch (_) {
      if (mounted) setState(() => _error = 'We could not save that. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.state == ScreenState.loading) {
      return const ParentPage(scroll: false, child: ParentMessage(title: 'Getting things ready...'));
    }
    final saved = ref.watch(deviceModeProvider).value;
    final mode = _picked ?? saved ?? DeviceMode.myPhone;
    final error =
        _error ??
        (widget.state == ScreenState.error || widget.state == ScreenState.offline
            ? 'We could not save that. Check your connection and try again.'
            : null);
    return ParentPage(
      bottom: ParentPrimary(widget.newDevice ? 'Continue' : 'Save', onPressed: _saving ? null : () => _save(mode)),
      child: Gap(
        gap: 14,
        children: [
          Text(widget.newDevice ? 'New device · Step 2 of 2' : 'This device', style: PT.eyebrow),
          Text('Whose device is this?', style: PT.display(32)),
          Text('You can change this later in Settings.', style: PT.body(16)),
          if (error != null) ParentAlert(title: 'Not saved.', message: error),
          _ModeCard(
            key: const Key('mode-my-phone'),
            selected: mode == DeviceMode.myPhone,
            icon: Icons.smartphone_rounded,
            title: 'This is my phone',
            body: 'Opens the parent view of all your children, protected by your PIN. Children cannot play here.',
            onTap: () => setState(() => _picked = DeviceMode.myPhone),
          ),
          _ModeCard(
            key: const Key('mode-family'),
            selected: mode == DeviceMode.family,
            icon: Icons.desktop_windows_outlined,
            title: 'Family device',
            body: 'Children can play here. The parent area stays behind the grown-up gate.',
            onTap: () => setState(() => _picked = DeviceMode.family),
          ),
        ],
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({
    super.key,
    required this.selected,
    required this.icon,
    required this.title,
    required this.body,
    required this.onTap,
  });
  final bool selected;
  final IconData icon;
  final String title;
  final String body;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fg = selected ? Kc.brown : Kc.cream;
    return Semantics(
      button: true,
      selected: selected,
      label: title,
      excludeSemantics: true,
      child: Material(
        color: selected ? Kc.softGold : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: BorderSide(color: Kc.softGold, width: selected ? 3 : 2),
        ),
        child: InkWell(
          customBorder: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(icon, size: 36, color: selected ? Kc.brown : Kc.softGold),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: PT.display(24, color: fg)),
                      const SizedBox(height: 4),
                      Text(body, style: PT.body(16, color: fg)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
