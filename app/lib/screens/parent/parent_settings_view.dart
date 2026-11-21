/// Settings for one child and the parent account (app-19, pa-06), plus the
/// confirm flows that start here: change age band, sign out, export, delete.
library;

import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import 'app-22-parent-delete.dart';
import 'pa-08-region.dart';
import 'pa-09-device-mode.dart';
import 'parent_data.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

/// `inline` = app-19 (chips on the page); `rows` = pa-06 (a row per setting).
enum SettingsLook { inline, rows }

/// Signs the parent out of this device and returns to the sign-in screen.
Future<void> performSignOut(BuildContext context, WidgetRef ref) async {
  await ref.read(authRepositoryProvider).signOut();
  ref.read(parentUnlockedProvider.notifier).lock();
  if (context.mounted) context.go('/signin');
}

/// The sign-out dialog (`pa-10`). True when the parent signed out.
Future<bool> confirmSignOut(BuildContext context, WidgetRef ref) async {
  final yes = await askConfirm(
    context,
    title: 'Sign out of this device?',
    body: TextSpan(
      text:
          "Your children's progress stays safe in your family account. To come back, you will need your email and a new one-time code.",
      style: PT.body(17, color: Kc.brown),
    ),
    keepLabel: 'Stay signed in',
    confirmLabel: 'Sign out',
  );
  if (yes && context.mounted) await performSignOut(context, ref);
  return yes;
}

/// Asks, then changes the child's age band. Progress is never touched. True when changed.
Future<bool> confirmBandChange(BuildContext context, WidgetRef ref, Child child, AgeBand to) async {
  if (to == child.ageBand) return false;
  final yes = await askConfirm(
    context,
    title: bandChangeTitle(child.nickname, to),
    body: confirmBody(
      '${bandChangeBody(to)} ',
      "${child.nickname}'s progress is kept.",
      ' You can change this back any time.',
    ),
    keepLabel: 'Keep ages ${child.ageBand.label}',
    confirmLabel: 'Change to ages ${to.label}',
  );
  if (!yes) return false;
  await ref.read(childrenProvider.notifier).edit(child.copyWith(ageBand: to));
  return true;
}

class ParentSettingsView extends ConsumerStatefulWidget {
  const ParentSettingsView({
    super.key,
    this.childId,
    this.state = ScreenState.normal,
    this.look = SettingsLook.inline,
    this.startSaved = false,
  });

  /// Child to edit. Null: `?child=` of the route, else the child who is playing.
  final String? childId;
  final ScreenState state;
  final SettingsLook look;

  /// Show the "Saved" confirmation on open (pa-06).
  final bool startSaved;

  @override
  ConsumerState<ParentSettingsView> createState() => _ParentSettingsViewState();
}

class _ParentSettingsViewState extends ConsumerState<ParentSettingsView> {
  String? _toast;
  String? _error;
  Timer? _toastTimer;

  @override
  void initState() {
    super.initState();
    if (widget.startSaved) {
      _toast = 'Saved';
      _toastTimer = Timer(const Duration(seconds: 3), () => mounted ? setState(() => _toast = null) : null);
    }
  }

  @override
  void dispose() {
    _toastTimer?.cancel();
    super.dispose();
  }

  void _showSaved([String text = 'Saved']) {
    _toastTimer?.cancel();
    setState(() {
      _toast = text;
      _error = null;
    });
    _toastTimer = Timer(const Duration(seconds: 3), () => mounted ? setState(() => _toast = null) : null);
  }

  Future<void> _run(Future<void> Function() action, {String saved = 'Saved'}) async {
    try {
      await action();
      if (mounted) _showSaved(saved);
    } catch (_) {
      if (mounted) _fail();
    }
  }

  void _fail() => setState(() {
    _toast = null;
    _error = 'We could not do that. Nothing was changed. Check your connection and try again.';
  });

  Future<void> _export() => _run(() async {
    final data = await ref.read(parentRepositoryProvider).exportFamily();
    await Clipboard.setData(ClipboardData(text: const JsonEncoder.withIndent('  ').convert(data)));
  }, saved: 'Copied your family data. Paste it into a note or email to keep it.');

  @override
  Widget build(BuildContext context) {
    if (widget.state == ScreenState.loading) {
      return const ParentPage(scroll: false, child: ParentMessage(title: 'Getting things ready...'));
    }
    if (widget.state == ScreenState.offline || widget.state == ScreenState.error) {
      return ParentPage(
        scroll: false,
        child: ParentMessage(
          title: widget.state == ScreenState.offline ? 'No connection' : 'Oops!',
          message: 'Your settings are safe. Check your connection and try again.',
          onAction: () => ref.invalidate(childrenProvider),
        ),
      );
    }

    final kids = ref.watch(childrenProvider);
    final id = widget.childId ?? routeValue(context, 'child', query: true);
    Child? child;
    if (kids.hasValue && kids.value!.isNotEmpty) {
      final list = kids.value!;
      final current = ref.watch(currentChildProvider).value;
      child = list.firstWhere((c) => c.id == id, orElse: () => current ?? list.first);
    }
    if (kids.isLoading && !kids.hasValue) {
      return const ParentPage(scroll: false, child: ParentMessage(title: 'Getting things ready...'));
    }
    if (kids.hasError) {
      return ParentPage(
        scroll: false,
        child: ParentMessage(
          title: 'Oops!',
          message: 'We could not load your settings.',
          onAction: () => ref.invalidate(childrenProvider),
        ),
      );
    }

    final parent = ref.watch(parentProvider).value;
    final sound = ref.watch(soundOnProvider);
    final narration = ref.watch(narrationOnProvider);
    final mode = ref.watch(deviceModeProvider).value;
    final rows = widget.look == SettingsLook.rows;
    final name = child?.nickname;

    Future<void> band(AgeBand b) async {
      final c = child;
      if (c == null) return;
      try {
        if (await confirmBandChange(context, ref, c, b) && mounted) _showSaved();
      } catch (_) {
        if (mounted) _fail();
      }
    }

    final emailText = parent == null ? '' : maskEmail(parent.email);

    final pinRow = SettingRow(
      title: rows ? 'Change PIN' : 'Change parent PIN',
      subtitle: rows ? 'Your 4-digit parent PIN' : null,
      trailing: const _Chevron(),
      onTap: () => context.push('/pin/create'),
    );
    final emailRow = SettingRow(
      title: rows ? 'Parent email' : 'Change parent email',
      subtitle: rows ? parent?.email : null,
      trailing: rows ? null : Text(emailText, style: PT.body(14, color: Kc.softGold, weight: 700)),
    );

    final content = <Widget>[
      BackLink('Parent area', onTap: () => goBackOr(context, '/parent')),
      Text(rows || name == null ? 'Settings' : 'Settings for $name', style: PT.display(32)),
      if (_error != null) ParentAlert(title: 'Not saved.', message: _error!),
      if (child == null)
        const InfoStrip('Add a child to change their age band and country.')
      else if (!rows) ...[
        Text('AGE BAND', style: PT.eyebrow),
        Row(
          children: [
            for (final b in AgeBand.values) ...[
              if (b != AgeBand.values.first) const SizedBox(width: 8),
              Expanded(
                child: ParentChoice(
                  key: Key('settings-band-${b.db}'),
                  label: b.label,
                  selected: child.ageBand == b,
                  fill: Kc.yellow,
                  outline: Kc.yellow,
                  idleOutline: Kc.white.withValues(alpha: 0.3),
                  fontSize: 16,
                  padding: EdgeInsets.zero,
                  onTap: () => band(b),
                ),
              ),
            ],
          ],
        ),
        Text('REGION', style: PT.eyebrow),
        Row(
          children: [
            for (final r in Region.values) ...[
              if (r != Region.values.first) const SizedBox(width: 8),
              Expanded(
                child: ParentChoice(
                  key: Key('settings-region-${r.db}'),
                  label: r.label,
                  selected: child.region == r,
                  fill: Kc.yellow,
                  outline: Kc.yellow,
                  idleOutline: Kc.white.withValues(alpha: 0.3),
                  fontSize: 14,
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  onTap: () => _run(() => ref.read(childrenProvider.notifier).edit(child!.copyWith(region: r))),
                ),
              ),
            ],
          ],
        ),
      ],
      if (rows) ...[
        _toggleRow('Sound', 'Game sounds and music', sound, (v) => ref.read(soundOnProvider.notifier).set(v)),
        _toggleRow(
          'Narration',
          'Kudi reads everything aloud',
          narration,
          (v) => ref.read(narrationOnProvider.notifier).set(v),
        ),
        if (child != null) ...[
          SettingRow(
            title: 'Age band for ${child.nickname}',
            subtitle: 'You can change this any time',
            trailing: Text('${child.ageBand.label} ›', style: PT.strong(16)),
            onTap: () => pushPage<void>(context, (c) => ParentSettingsView(childId: child!.id)),
          ),
          SettingRow(
            title: 'Country',
            subtitle: 'Coins and examples',
            trailing: Text('${child.region.label} ›', style: PT.strong(16)),
            onTap: () => pushPage<void>(context, (c) => CountryView(childId: child!.id)),
          ),
        ],
        pinRow,
        emailRow,
      ] else ...[
        const SizedBox(height: 2),
        _toggleRow('Sound', null, sound, (v) => ref.read(soundOnProvider.notifier).set(v)),
        _toggleRow('Kudi narration', null, narration, (v) => ref.read(narrationOnProvider.notifier).set(v)),
        pinRow,
        emailRow,
        SettingRow(
          title: 'Whose device is this?',
          trailing: Text(switch (mode) {
            DeviceMode.myPhone => 'My phone',
            DeviceMode.family => 'Family',
            null => 'Not set',
          }, style: PT.body(14, color: Kc.softGold, weight: 700)),
          onTap: () => pushPage<void>(
            context,
            (c) => DeviceModeView(newDevice: false, onDone: () => Navigator.of(c).pop()),
          ).then((_) => ref.invalidate(deviceModeProvider)),
        ),
        SettingRow(
          title: 'Export family data',
          subtitle: 'Copies everything we hold about your family',
          trailing: const _Chevron(),
          onTap: _export,
        ),
        SettingRow(
          title: 'Delete family account',
          subtitle: 'Erases every profile and all progress',
          trailing: const _Chevron(),
          onTap: () => pushPage<void>(context, (c) => build_app_22_parent_delete(c, ScreenState.normal)),
        ),
      ],
    ];

    return ParentPage(
      bottom: rows
          ? ParentOutline(
              'Sign out',
              color: Kc.cream,
              height: 52,
              fontSize: 16,
              onPressed: () => confirmSignOut(context, ref),
            )
          : ParentOutline('Sign out of this device', onPressed: () => confirmSignOut(context, ref)),
      overlay: _toast == null ? null : SavedToast(text: _toast!),
      child: Gap(gap: rows ? 10 : 12, children: content),
    );
  }

  Widget _toggleRow(String title, String? subtitle, bool value, ValueChanged<bool> onChanged) => SettingRow(
    title: title,
    subtitle: subtitle,
    trailing: ParentSwitch(label: title, value: value, onChanged: onChanged),
    minHeight: 56,
  );
}

class _Chevron extends StatelessWidget {
  const _Chevron();

  @override
  Widget build(BuildContext context) => const Text('›', style: TextStyle(color: Kc.softGold, fontSize: 24));
}
