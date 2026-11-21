import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import '../onboarding/onboarding_state.dart';
import 'auth_state.dart';
import 'auth_widgets.dart';

/// au-11: sign-up verified but the account setup could not finish because the phone is offline.
class SetupOfflineScreen extends ConsumerStatefulWidget {
  const SetupOfflineScreen({super.key, this.demo = ScreenState.normal});

  final ScreenState demo;

  @override
  ConsumerState<SetupOfflineScreen> createState() => _SetupOfflineScreenState();
}

class _SetupOfflineScreenState extends ConsumerState<SetupOfflineScreen> {
  bool _busy = false;
  bool _stillOffline = false;

  Future<void> _retry() async {
    setState(() {
      _busy = true;
      _stillOffline = false;
    });
    final step = await ref.read(authFlowProvider.notifier).finishSignup();
    if (!mounted) return;
    if (step == AuthStep.joined) {
      context.go('/joined');
    } else {
      setState(() {
        _busy = false;
        _stillOffline = true;
      });
    }
  }

  Future<void> _playNow() async {
    await ref.read(onboardedProvider.notifier).set(true);
    if (mounted) context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    Widget row(IconData icon, String text) => Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(icon, color: Kc.softGold, size: 22),
          const SizedBox(width: Kc.s3),
          Expanded(child: Text(text, style: AuthText.body.copyWith(fontSize: 16))),
        ]);
    return KeyedSubtree(
      key: const Key('screen-au-11-offline'),
      child: AuthPage(
        step: 'Parent setup · Step 6 of 6',
        title: 'We could not finish setting up',
        intro: 'Your phone has no internet connection right now. Nothing has been lost.',
        banner: StateBanner(
          message: _stillOffline ? 'Still offline. We will try again when you reconnect.' : 'You are offline',
          kind: BannerKind.offline,
        ),
        bottom: AuthActions(
          primary: PrimaryButton(label: _busy ? 'Trying...' : 'Try again', height: 64, onPressed: _busy ? null : _retry),
          link: AuthLink('Play now, finish setup later', _busy ? null : _playNow),
        ),
        children: [
          Container(
            padding: const EdgeInsets.all(Kc.s4),
            decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(Kc.rMd)),
            child: Column(children: [
              row(Icons.check_rounded, 'Your child\'s friend and nickname are saved on this phone.'),
              const SizedBox(height: Kc.s3),
              row(Icons.check_rounded, 'Your PIN is saved on this phone only.'),
              const SizedBox(height: Kc.s3),
              row(Icons.info_outline_rounded, 'Your online family account is not created yet. Reconnect to finish.'),
            ]),
          ),
        ],
      ),
    );
  }
}

/// au-12: the family is set up.
class JoinedScreen extends ConsumerWidget {
  const JoinedScreen({super.key, this.demo = ScreenState.normal});

  final ScreenState demo;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final child = ref.watch(currentChildProvider).value;
    final name = child?.nickname ?? ref.watch(pendingChildProvider).nickname ?? '';
    return ScreenScaffold(
      key: const Key('screen-au-12-joined'),
      padding: const EdgeInsets.symmetric(horizontal: 28),
      bottom: PrimaryButton(label: 'Let\'s play', onPressed: () => context.go('/home')),
      child: Column(children: [
        const SizedBox(height: Kc.s6),
        if (demo != ScreenState.normal && demoBanner(demo) != null) ...[demoBanner(demo)!, const SizedBox(height: Kc.s3)],
        Container(
          width: 76,
          height: 76,
          decoration: BoxDecoration(color: Kc.success, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: 3)),
          child: const Icon(Icons.check_rounded, size: 44, color: Kc.cream),
        ),
        const SizedBox(height: 14),
        Semantics(header: true, child: Text('You joined the Pride!', style: KcText.displayXl, textAlign: TextAlign.center)),
        Expanded(
          child: Center(child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
            const KudiImage(KudiPose.celebrate, width: 240),
            const SizedBox(height: 14),
            if (name.isNotEmpty)
              Container(
                padding: const EdgeInsets.fromLTRB(10, 8, 20, 8),
                decoration: BoxDecoration(
                  color: Kc.white,
                  borderRadius: BorderRadius.circular(Kc.rPill),
                  border: Border.all(color: Kc.brown, width: Kc.border),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(color: Kc.orange, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: 3)),
                  ),
                  const SizedBox(width: 12),
                  Text(name, style: KcText.button),
                ]),
              ),
            const SizedBox(height: 14),
            Text('Kudi is waiting with your first mission.', style: KcText.bodyChild, textAlign: TextAlign.center),
          ]))),
        ),
      ]),
    );
  }
}

/// au-17: PIN recovery code is on its way.
class RecoverySentScreen extends ConsumerWidget {
  const RecoverySentScreen({super.key, this.demo = ScreenState.normal});

  final ScreenState demo;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final stored = ref.watch(authFlowProvider.select((s) => s.email));
    final email = stored.isNotEmpty ? stored : 'parent@example.com';
    return KeyedSubtree(
      key: const Key('screen-au-17-recovery-sent'),
      child: AuthPage(
        step: 'PIN recovery',
        title: 'Check your email',
        banner: demoBanner(demo),
        bottom: AuthActions(
          primary: PrimaryButton(label: 'Enter my code', height: 64, onPressed: () => context.go('/code')),
          link: null,
        ),
        children: [
          Center(
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: const Icon(Icons.mark_email_read_outlined, size: 64, color: Kc.softGold),
            ),
          ),
          const SizedBox(height: Kc.s5),
          AuthNotice(heading: 'Code sent', message: 'We sent a 6-digit code to $email. It works for 10 minutes.', icon: Icons.check_circle_outline_rounded),
          const SizedBox(height: Kc.s4),
          Text('Cannot see it? Check your spam folder, then ask for a new code.', style: AuthText.body),
          const SizedBox(height: Kc.s2),
          Center(
            child: ResendCountdown(
              seconds: 45,
              waitingPrefix: 'Send it again in',
              readyLabel: 'Send it again',
              onResend: () => ref.read(authFlowProvider.notifier).sendCode(),
            ),
          ),
        ],
      ),
    );
  }
}

/// au-18: the Supabase session is gone. Children keep playing; the parent signs in again.
class SessionExpiredScreen extends ConsumerWidget {
  const SessionExpiredScreen({super.key, this.demo = ScreenState.normal});

  final ScreenState demo;

  @override
  Widget build(BuildContext context, WidgetRef ref) => KeyedSubtree(
        key: const Key('screen-au-18-session-expired'),
        child: AuthPage(
          title: 'You were signed out for safety',
          intro: 'The grown-up area closes by itself after a while with no activity. It keeps the account private if the phone is left unlocked.',
          banner: demoBanner(demo),
          bottom: AuthActions(
            primary: PrimaryButton(
              label: 'Sign in again',
              height: 64,
              onPressed: () {
                ref.read(parentUnlockedProvider.notifier).lock();
                ref.read(authFlowProvider.notifier).begin(AuthPurpose.signin);
                context.go('/signin');
              },
            ),
            link: AuthLink('Back to the game', () => context.go('/home')),
          ),
          children: [
            const SizedBox(height: Kc.s6),
            Center(
              child: Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: const Icon(Icons.lock_outline_rounded, size: 72, color: Kc.softGold),
              ),
            ),
            const SizedBox(height: Kc.s6),
            const AuthNotice(message: 'Your children can keep playing. Nothing has been lost.'),
          ],
        ),
      );
}
