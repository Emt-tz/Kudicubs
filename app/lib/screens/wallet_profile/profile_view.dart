/// Profile (nickname, avatar, sound, switch child) and the avatar picker.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'wallet_profile_logic.dart';
import 'wallet_profile_widgets.dart';

/// [page]: back arrow header (app-16). [tab]: inside the tab bar (pr-04).
enum ProfileLayout { page, tab }

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key, this.state = ScreenState.normal, this.layout = ProfileLayout.page, this.previewSound});

  final ScreenState state;
  final ProfileLayout layout;

  /// Shows this sound value until the child touches the switch (gallery variant).
  final bool? previewSound;

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool? _preview;

  @override
  void initState() {
    super.initState();
    _preview = widget.previewSound;
  }

  bool get _page => widget.layout == ProfileLayout.page;

  Widget _frame(Widget child) => _page
      ? Scaffold(
          backgroundColor: Kc.cream,
          body: SafeArea(child: Padding(padding: const EdgeInsets.fromLTRB(Kc.s5, Kc.s3, Kc.s5, Kc.s5), child: child)),
        )
      : WpPage(nav: WpTab.none, child: child);

  Widget _header(String title) => Row(
        spacing: 10,
        children: [
          Semantics(
            button: true,
            label: 'Back',
            excludeSemantics: true,
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => goBackOr(context, '/home'),
              child: Container(
                width: Kc.touchMin,
                height: Kc.touchMin,
                decoration: BoxDecoration(color: Kc.white, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: Kc.border)),
                child: const Icon(Icons.arrow_back_rounded, color: Kc.brown),
              ),
            ),
          ),
          Text(title, style: baloo(28)),
        ],
      );

  @override
  Widget build(BuildContext context) {
    final childAsync = ref.watch(currentChildProvider);
    final childId = childAsync.value?.id;
    Future<void> retry() => retryWalletLoad(ref, childId);

    switch (widget.state) {
      case ScreenState.loading:
        return const ProfileSkeleton();
      case ScreenState.error:
        return _frame(ErrorView(onRetry: retry));
      case ScreenState.empty:
        return _frame(const EmptyView(title: 'No one is playing yet', message: 'Ask a grown-up to add you.'));
      case ScreenState.normal:
      case ScreenState.offline:
        break;
    }
    return childAsync.when(
      loading: () => const ProfileSkeleton(),
      error: (_, _) => _frame(ErrorView(onRetry: retry)),
      data: (child) {
        if (child == null) return _frame(const EmptyView(title: 'No one is playing yet', message: 'Ask a grown-up to add you.'));
        return _frame(_body(child));
      },
    );
  }

  Widget _body(Child child) {
    final xp = ref.watch(balancesProvider(child.id)).value?.xp ?? 0;
    final kids = ref.watch(childrenProvider).value ?? const <Child>[];
    final bool sound = _preview ?? ref.watch(soundOnProvider);
    final voice = sound && ref.watch(kudiVoiceProvider);
    final offline = widget.state == ScreenState.offline || !ref.watch(onlineProvider);
    final tab = !_page;

    final avatar = Semantics(
      button: true,
      label: 'Change my friend',
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => context.push('/screen/pr-05-avatar-change'),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            AvatarCircle(child.avatar, size: tab ? 84 : 112, border: tab ? 3 : 4),
            Positioned(
              right: -2,
              bottom: -2,
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(color: Kc.yellow, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: Kc.border)),
                child: const Icon(Icons.edit_rounded, size: 16, color: Kc.brown),
              ),
            ),
          ],
        ),
      ),
    );

    final identity = tab
        ? Row(
            spacing: 14,
            children: [
              avatar,
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(child.nickname, style: baloo(32, height: 1.05)),
                    Text(levelLabel(xp), style: nunito(16, weight: 800, color: Kc.brown80)),
                  ],
                ),
              ),
            ],
          )
        : Padding(
            padding: const EdgeInsets.symmetric(vertical: Kc.s2),
            child: Column(
              spacing: 8,
              children: [
                avatar,
                Text(child.nickname, style: baloo(32, height: 1)),
                Text('${levelLabel(xp)} · Ages ${child.ageBand.label}', style: nunito(16, weight: 800, color: Kc.brown80)),
              ],
            ),
          );

    final settings = Container(
      padding: EdgeInsets.symmetric(horizontal: Kc.s4, vertical: tab ? 6 : 0),
      decoration: BoxDecoration(
        color: Kc.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Kc.brown, width: Kc.border),
      ),
      child: Column(
        children: [
          _SettingRow(
            keyName: 'sound',
            title: 'Sound',
            subtitle: tab ? (sound ? 'On' : 'Off') : null,
            value: sound,
            divider: true,
            onChanged: (v) {
              setState(() => _preview = null);
              ref.read(soundOnProvider.notifier).set(v);
            },
          ),
          _SettingRow(
            keyName: 'voice',
            title: tab ? "Kudi's voice" : 'Kudi talks to me',
            subtitle: tab ? (voice ? 'On' : 'Off') : null,
            value: voice,
            enabled: sound,
            onChanged: (v) => ref.read(kudiVoiceProvider.notifier).set(v),
          ),
        ],
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 14,
      children: [
        if (_page) _header('My profile'),
        Expanded(
          child: ListView(
            children: [
              if (offline) ...[
                const StateBanner(message: 'No connection. Everything you earned is safe on this device.', kind: BannerKind.offline),
                const SizedBox(height: 14),
              ],
              identity,
              const SizedBox(height: 14),
              settings,
              if (!sound) ...[
                const SizedBox(height: 14),
                _Notice(
                  icon: Icons.closed_caption_outlined,
                  text: "With sound off, Kudi's words show as captions on every screen, so you can still play.",
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: Kc.s4, vertical: Kc.s3),
                  decoration: BoxDecoration(
                    color: Kc.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Kc.brown, width: Kc.border),
                  ),
                  child: Row(
                    spacing: Kc.s3,
                    children: [
                      const KudiImage(KudiPose.headphones, width: 60),
                      Expanded(child: Text('Captions on · Hello, ${child.nickname}! Ready for a new mission?', style: nunito(16, height: 1.35))),
                    ],
                  ),
                ),
              ],
              if (kids.length > 1) TextLink('Not ${child.nickname}? Switch child', onTap: () => _switchChild(kids, child), size: 17),
            ],
          ),
        ),
        if (_page) Text('Changing your age or country is for grown-ups.', textAlign: TextAlign.center, style: nunito(15, color: Kc.brown80)),
        _DarkButton(label: 'For grown-ups', lock: _page, onTap: () => context.go('/parent'), height: _page ? 64 : 60),
        if (tab) const SizedBox(height: 14),
      ],
    );
  }

  Future<void> _switchChild(List<Child> kids, Child current) => showModalBottomSheet<void>(
        context: context,
        backgroundColor: Colors.transparent,
        barrierColor: Kc.brown.withValues(alpha: .55),
        builder: (sheet) => Container(
          decoration: const BoxDecoration(
            color: Kc.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            border: Border(top: BorderSide(color: Kc.brown, width: 3)),
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(Kc.s5, Kc.s5, Kc.s5, Kc.s5),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: 10,
                children: [
                  Text('Who is playing?', style: baloo(24)),
                  for (final k in kids)
                    Semantics(
                      button: true,
                      selected: k.id == current.id,
                      label: k.nickname,
                      excludeSemantics: true,
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () {
                          ref.read(currentChildIdProvider.notifier).select(k.id);
                          Navigator.of(sheet).pop();
                        },
                        child: Container(
                          constraints: const BoxConstraints(minHeight: 64),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: k.id == current.id ? Kc.softGold : Kc.white,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: Kc.brown, width: k.id == current.id ? 3 : Kc.border),
                          ),
                          child: Row(
                            spacing: Kc.s3,
                            children: [
                              AvatarCircle(k.avatar, size: 44, border: 2),
                              Expanded(child: Text(k.nickname, style: baloo(22))),
                              Text('Ages ${k.ageBand.label}', style: nunito(14, weight: 800, color: Kc.brown80)),
                            ],
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),
      );
}

class _SettingRow extends StatelessWidget {
  const _SettingRow({
    required this.keyName,
    required this.title,
    required this.value,
    required this.onChanged,
    this.subtitle,
    this.divider = false,
    this.enabled = true,
  });

  final String keyName;
  final String title;
  final String? subtitle;
  final bool value;
  final bool divider;
  final bool enabled;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) => Container(
        constraints: BoxConstraints(minHeight: subtitle == null ? 64 : 72),
        decoration: BoxDecoration(border: divider ? const Border(bottom: BorderSide(color: Kc.creamShade, width: 2)) : null),
        child: Row(
          spacing: Kc.s3,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: subtitle == null ? nunito(18, weight: 800) : baloo(20)),
                  if (subtitle != null) Text(subtitle!, style: nunito(15, color: Kc.brown80, height: 1.2)),
                ],
              ),
            ),
            KcSwitch(key: Key('toggle-$keyName'), value: value, enabled: enabled, onChanged: onChanged, label: title),
          ],
        ),
      );
}

class _Notice extends StatelessWidget {
  const _Notice({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: Kc.s3),
        decoration: BoxDecoration(
          color: Kc.softGold,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: Kc.brown, width: Kc.border),
        ),
        child: Row(
          spacing: Kc.s3,
          children: [
            Icon(icon, size: 30, color: Kc.brown),
            Expanded(child: Text(text, style: nunito(16, weight: 800, height: 1.35))),
          ],
        ),
      );
}

class _DarkButton extends StatelessWidget {
  const _DarkButton({required this.label, required this.onTap, required this.height, this.lock = false});
  final String label;
  final VoidCallback onTap;
  final double height;
  final bool lock;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: label,
        excludeSemantics: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap,
          child: Container(
            height: height,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Kc.brown,
              borderRadius: BorderRadius.circular(Kc.rPill),
              border: Border.all(color: lock ? Kc.cream : Kc.brown, width: Kc.border),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              spacing: 10,
              children: [
                if (lock) const Icon(Icons.lock_outline_rounded, color: Kc.cream, size: 24),
                Text(label, style: baloo(lock ? 22 : 20, color: Kc.cream)),
              ],
            ),
          ),
        ),
      );
}

// ---- pr-06 loading ---------------------------------------------------------------

class ProfileSkeleton extends StatelessWidget {
  const ProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) => WpPage(
        nav: WpTab.none,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          spacing: 16,
          children: [
            Row(
              spacing: 14,
              children: [
                const Bone(width: 84, height: 84, circle: true),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 10,
                    children: [Bone(widthFactor: .5, height: 28), Bone(widthFactor: .7, height: 16)],
                  ),
                ),
                const KudiImage(KudiPose.headphones, width: 70),
              ],
            ),
            Text('Getting things ready...', style: nunito(17, weight: 800, color: Kc.brown80)),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: Kc.s4, vertical: 6),
              decoration: BoxDecoration(
                color: Kc.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Kc.brown, width: Kc.border),
              ),
              child: Column(
                children: [
                  for (final (i, w) in const [(0, .3), (1, .45)])
                    Container(
                      constraints: const BoxConstraints(minHeight: 72),
                      decoration: BoxDecoration(border: i == 0 ? const Border(bottom: BorderSide(color: Kc.creamShade, width: 2)) : null),
                      child: Row(
                        spacing: Kc.s3,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              spacing: 8,
                              children: [Bone(widthFactor: w, height: 18), const Bone(widthFactor: .2)],
                            ),
                          ),
                          const Bone(width: 72, height: 44, radius: 999),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            const Bone(height: 84, radius: 18),
            const Spacer(),
            const Padding(padding: EdgeInsets.only(bottom: 14), child: Bone(height: 60, radius: 999)),
          ],
        ),
      );
}

// ---- pr-05 avatar picker -----------------------------------------------------------

class AvatarPickerScreen extends ConsumerStatefulWidget {
  const AvatarPickerScreen({super.key, this.state = ScreenState.normal});
  final ScreenState state;

  @override
  ConsumerState<AvatarPickerScreen> createState() => _AvatarPickerState();
}

class _AvatarPickerState extends ConsumerState<AvatarPickerScreen> {
  String? _selected;
  bool _saving = false;
  bool _failed = false;

  Widget _shell(Widget child) => Scaffold(
        backgroundColor: Kc.cream,
        body: SafeArea(child: Padding(padding: const EdgeInsets.fromLTRB(Kc.s5, Kc.s3, Kc.s5, Kc.s5), child: child)),
      );

  Future<void> _save(Child child, String avatar) async {
    if (avatar == child.avatar) {
      goBackOr(context, '/profile');
      return;
    }
    setState(() {
      _saving = true;
      _failed = false;
    });
    try {
      await ref.read(childrenProvider.notifier).edit(child.copyWith(avatar: avatar));
      if (!mounted) return;
      goBackOr(context, '/profile');
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final childAsync = ref.watch(currentChildProvider);
    Future<void> retry() => retryWalletLoad(ref, childAsync.value?.id);
    switch (widget.state) {
      case ScreenState.loading:
        return _shell(const LoadingView(message: 'Getting things ready...'));
      case ScreenState.error:
        return _shell(ErrorView(onRetry: retry));
      case ScreenState.empty:
        return _shell(const EmptyView(title: 'No one is playing yet', message: 'Ask a grown-up to add you.'));
      case ScreenState.normal:
      case ScreenState.offline:
        break;
    }
    return childAsync.when(
      loading: () => _shell(const LoadingView(message: 'Getting things ready...')),
      error: (_, _) => _shell(ErrorView(onRetry: retry)),
      data: (child) => child == null
          ? _shell(const EmptyView(title: 'No one is playing yet', message: 'Ask a grown-up to add you.'))
          : _shell(_picker(child)),
    );
  }

  Widget _picker(Child child) {
    final selected = _selected ?? child.avatar;
    final options = [if (!avatarChoices.contains(child.avatar)) child.avatar, ...avatarChoices];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 16,
      children: [
        Row(
          spacing: 10,
          children: [
            Semantics(
              button: true,
              label: 'Back',
              excludeSemantics: true,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => goBackOr(context, '/profile'),
                child: Container(
                  width: Kc.touchMin,
                  height: Kc.touchMin,
                  decoration: BoxDecoration(color: Kc.white, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: Kc.border)),
                  child: const Icon(Icons.arrow_back_rounded, color: Kc.brown),
                ),
              ),
            ),
            Expanded(child: Text('Pick a new friend', style: baloo(28))),
          ],
        ),
        Expanded(
          child: ListView(
            children: [
              Row(
                spacing: Kc.s3,
                children: [
                  const KudiImage(KudiPose.wave, width: 96),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: Kc.s3),
                      decoration: BoxDecoration(
                        color: Kc.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: Kc.brown, width: Kc.border),
                      ),
                      child: Text('Tap a friend to see them here.', style: nunito(18, weight: 800)),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              if (_failed || widget.state == ScreenState.offline) ...[
                StateBanner(
                  message: _failed ? 'We could not save your new friend. Try again.' : 'No connection. You can pick when you are back online.',
                  kind: _failed ? BannerKind.error : BannerKind.offline,
                  onRetry: _failed ? () => _save(child, selected) : null,
                ),
                const SizedBox(height: 16),
              ],
              GridView(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  mainAxisExtent: 136,
                ),
                children: [
                  for (final (i, id) in options.indexed)
                    _AvatarTile(
                      avatar: id,
                      number: i + 1,
                      selected: id == selected,
                      current: id == child.avatar,
                      onTap: () => setState(() => _selected = id),
                    ),
                ],
              ),
              const SizedBox(height: 16),
              Text('Your name, coins and badges stay the same.', textAlign: TextAlign.center, style: nunito(15, color: Kc.brown80)),
            ],
          ),
        ),
        PrimaryButton(label: "That's me!", height: 68, onPressed: _saving ? null : () => _save(child, selected)),
      ],
    );
  }
}

class _AvatarTile extends StatelessWidget {
  const _AvatarTile({required this.avatar, required this.number, required this.selected, required this.current, required this.onTap});

  final String avatar;
  final int number;
  final bool selected;
  final bool current;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        selected: selected,
        label: 'Friend $number${current ? ', current' : ''}',
        excludeSemantics: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap,
          child: Container(
            margin: EdgeInsets.only(bottom: selected ? 5 : 0),
            decoration: BoxDecoration(
              color: selected ? Kc.softGold : Kc.white,
              borderRadius: BorderRadius.circular(Kc.rLg),
              border: Border.all(color: Kc.brown, width: selected ? 4 : 3),
              boxShadow: selected ? const [BoxShadow(color: Kc.brown, offset: Offset(0, 5))] : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              spacing: 4,
              children: [
                AvatarCircle(avatar, size: current ? 80 : 88),
                if (current) Text('Current', style: nunito(14, weight: 800, height: 1.2)),
              ],
            ),
          ),
        ),
      );
}
