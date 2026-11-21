// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import 'app-21-parent-signin.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

/// Canvas `app-20-parent-lockout`: five wrong PINs pause the parent area; counts down to the end of the lock.
Widget build_app_20_parent_lockout(BuildContext context, ScreenState state) =>
    ParentLockoutView(key: const Key('screen-app-20-parent-lockout'), state: state);

class ParentLockoutView extends ConsumerStatefulWidget {
  const ParentLockoutView({
    super.key,
    this.state = ScreenState.normal,
    this.lockedUntil,
    this.now,
    this.onExpired,
    this.onLeave,
  });

  final ScreenState state;

  /// Lock end for tests; default is the parent's `pin_locked_until`.
  final DateTime? lockedUntil;

  /// Clock for tests.
  final DateTime Function()? now;

  /// Called once when the countdown reaches zero (default: back to the parent area, which asks for the PIN).
  final VoidCallback? onExpired;

  /// "Back to the game" (default: lock the parent area and go home).
  final VoidCallback? onLeave;

  @override
  ConsumerState<ParentLockoutView> createState() => _ParentLockoutViewState();
}

class _ParentLockoutViewState extends ConsumerState<ParentLockoutView> with SecondTicker {
  late final DateTime _fallbackEnd = _now().add(kPinLockDuration);
  Duration _left = kPinLockDuration;
  bool _expired = false;
  bool _sending = false;
  String? _error;

  DateTime _now() => (widget.now ?? DateTime.now)();

  DateTime get _end => widget.lockedUntil ?? ref.read(parentProvider).value?.pinLockedUntil ?? _fallbackEnd;

  @override
  void initState() {
    super.initState();
    _left = lockRemaining(_end, _now());
    startTicker(_tick);
  }

  void _tick() {
    final left = lockRemaining(_end, _now());
    setState(() => _left = left);
    if (left == Duration.zero && !_expired) {
      _expired = true;
      stopTicker();
      if (widget.onExpired != null) {
        widget.onExpired!();
      } else {
        context.go('/parent');
      }
    }
  }

  Future<void> _email() async {
    final email = ref.read(parentProvider).value?.email;
    if (email == null) {
      setState(() => _error = 'We could not find the parent email. Check your connection and try again.');
      return;
    }
    setState(() {
      _sending = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).sendCode(email);
      if (!mounted) return;
      await pushPage<void>(context, (c) => ParentSignInView(email: email, recovery: true));
    } catch (_) {
      if (mounted) setState(() => _error = 'We could not send the code. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.state == ScreenState.loading) {
      return const ParentPage(scroll: false, child: ParentMessage(title: 'Getting things ready...'));
    }
    final email = ref.watch(parentProvider).value?.email;
    final masked = email == null ? 'the parent email' : maskEmail(email);
    return ParentPage(
      bottom: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.08), borderRadius: BorderRadius.circular(16)),
            child: Text(
              "Your child's coins, badges and progress are safe. They can keep playing right now.",
              style: PT.body(15),
            ),
          ),
          const SizedBox(height: 12),
          ParentOutline(
            'Back to the game',
            onPressed: () {
              if (widget.onLeave != null) {
                widget.onLeave!();
              } else {
                ref.read(parentUnlockedProvider.notifier).lock();
                context.go('/home');
              }
            },
          ),
        ],
      ),
      child: Gap(
        gap: 16,
        children: [
          Text('For grown-ups', style: PT.eyebrow),
          Text("Let's take a short pause", style: PT.display(34)),
          Text(
            'That PIN did not match a few times, so the parent area is resting for a little while. Nothing has been lost.',
            style: PT.body(18),
          ),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
            child: Column(
              children: [
                Text('You can try again in', style: PT.body(15, color: Kc.softGold, weight: 700)),
                Semantics(
                  liveRegion: false,
                  label: 'Try again in ${formatCountdown(_left)}',
                  excludeSemantics: true,
                  child: Text(formatCountdown(_left), key: const Key('lock-countdown'), style: PT.display(60)),
                ),
              ],
            ),
          ),
          Text('Forgot your PIN?', style: PT.heading(22)),
          Text(
            'We can email a one-time code to the parent email on this account. It is sent to $masked.',
            style: PT.body(16),
          ),
          if (_error != null) ParentAlert(title: 'Not sent.', message: _error!),
          ParentPrimary('Email me a code', onPressed: _sending ? null : _email),
        ],
      ),
    );
  }
}
