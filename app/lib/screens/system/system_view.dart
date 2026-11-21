import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';

enum SystemKind { updateRequired, maintenance, serverError, noConnection, loading, empty }

/// Stable-looking support reference such as `KC-7F3A-21` (from the clock; shown, never sent).
String supportReference(DateTime now) {
  final n = now.millisecondsSinceEpoch;
  final hex = (n % 0xFFFF).toRadixString(16).toUpperCase().padLeft(4, '0');
  return 'KC-$hex-${(n ~/ 1000 % 100).toString().padLeft(2, '0')}';
}

/// Re-checks the connection; when the API answers, clears any system status and returns home.
Future<void> retrySystem(BuildContext context, WidgetRef ref) async {
  final ok = await ref.read(onlineProvider.notifier).check();
  if (!context.mounted) return;
  if (ok) {
    ref.read(systemStatusProvider.notifier).set(SystemStatus.ok);
    context.go('/home');
  }
}

/// One widget for sy-01..sy-06. Wired to [systemStatusProvider] by the router; every
/// screen that can be retried has a real retry, and nothing earned is ever put at risk.
class SystemView extends ConsumerStatefulWidget {
  const SystemView({super.key, required this.screenKey, required this.kind, this.state = ScreenState.normal});

  final Key screenKey;
  final SystemKind kind;
  final ScreenState state;

  @override
  ConsumerState<SystemView> createState() => _SystemViewState();
}

class _SystemViewState extends ConsumerState<SystemView> {
  bool _busy = false;
  late final String _ref = supportReference(DateTime.now());

  Future<void> _retry() async {
    if (_busy) return;
    setState(() => _busy = true);
    await retrySystem(context, ref);
    if (mounted) setState(() => _busy = false);
  }

  @override
  Widget build(BuildContext context) {
    if (widget.kind == SystemKind.loading) {
      return Scaffold(key: widget.screenKey, backgroundColor: Kc.cream, body: const SafeArea(child: LoadingView(message: 'Getting things ready...')));
    }
    final (pose, title, body) = switch (widget.kind) {
      SystemKind.updateRequired => (KudiPose.wave, 'Time for a new version', 'KudiCubs has new missions and fixes. Please update to keep playing.'),
      SystemKind.maintenance => (KudiPose.headphones, 'Kudi is tidying the market', 'We will be back very soon. You do not need to do anything.'),
      SystemKind.serverError => (KudiPose.headphones, 'Something went wrong on our side', 'It is not your fault. Please try again in a moment.'),
      SystemKind.noConnection => (
          KudiPose.wave,
          'No internet right now',
          'You can still play missions you already opened. We will save your play when you are back online.'
        ),
      _ => (KudiPose.wave, 'Nothing here yet', 'Play a mission and your treasures will show up here.'),
    };
    final extra = switch (widget.kind) {
      SystemKind.updateRequired => 'Your coins and badges are safe',
      SystemKind.maintenance => 'Expected back in about 30 minutes',
      SystemKind.serverError => 'Reference: $_ref',
      _ => null,
    };
    final foot = widget.kind == SystemKind.updateRequired ? 'A grown-up may need to approve the update in the store.' : null;
    final (primary, onPrimary) = switch (widget.kind) {
      SystemKind.updateRequired => ('Update now', _retry),
      SystemKind.maintenance => ('Check again', _retry),
      SystemKind.serverError => ('Try again', _retry),
      SystemKind.noConnection => ('Keep playing', () => context.go('/home')),
      _ => ('Play a mission', () => context.go('/home')),
    };
    final secondary = switch (widget.kind) {
      SystemKind.serverError => ('Ask a grown-up for help', () => context.go('/parent')),
      SystemKind.noConnection => ('Try to connect again', _retry),
      _ => null,
    };
    return ScreenScaffold(
      key: widget.screenKey,
      scrollable: true,
      bottom: Padding(
        padding: const EdgeInsets.only(bottom: Kc.s5),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          PrimaryButton(label: primary, onPressed: _busy ? null : onPrimary),
          if (secondary != null) ...[
            const SizedBox(height: Kc.s3),
            SecondaryButton(label: secondary.$1, onPressed: _busy ? null : secondary.$2),
          ],
          if (foot != null) ...[
            const SizedBox(height: Kc.s3),
            Text(foot, style: KcText.caption, textAlign: TextAlign.center),
          ],
        ]),
      ),
      child: Column(children: [
        const SizedBox(height: Kc.s8),
        KudiImage(pose, width: 180),
        const SizedBox(height: Kc.s4),
        Text(title, style: KcText.displayL, textAlign: TextAlign.center),
        const SizedBox(height: Kc.s2),
        Text(body, style: KcText.bodyChild, textAlign: TextAlign.center),
        if (extra != null) ...[
          const SizedBox(height: Kc.s4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: Kc.s4, vertical: Kc.s2),
            decoration: BoxDecoration(color: Kc.peach, borderRadius: BorderRadius.circular(Kc.rPill), border: Border.all(color: Kc.brown, width: Kc.border)),
            child: Text(extra, style: KcText.label),
          ),
        ],
      ]),
    );
  }
}
