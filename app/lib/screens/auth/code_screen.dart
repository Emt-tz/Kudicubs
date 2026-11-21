import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'auth_logic.dart';
import 'auth_state.dart';
import 'auth_widgets.dart';

/// Enter the emailed 6-digit code: au-07 (entry), au-08 (wrong), au-09 (expired), au-10 (verifying).
/// Real verification through `AuthRepository.verifyCode`; the designed state follows [AuthFlowState.phase].
class CodeScreen extends ConsumerStatefulWidget {
  const CodeScreen({super.key, this.forced, this.demo = ScreenState.normal});

  /// Gallery override: open the screen directly in one of its designed variants.
  final CodePhase? forced;
  final ScreenState demo;

  @override
  ConsumerState<CodeScreen> createState() => _CodeScreenState();
}

class _CodeScreenState extends ConsumerState<CodeScreen> {
  String _code = '';
  CodePhase? _override;
  AuthFailure? _failure;
  int _resendKey = 0;

  @override
  void initState() {
    super.initState();
    _override = widget.forced;
    _code = switch (widget.forced) {
      CodePhase.wrong || CodePhase.tooMany => '481902',
      CodePhase.verifying => '481903',
      CodePhase.expired => '',
      _ => widget.forced == null ? '' : '481',
    };
  }

  AuthFlow get _flow => ref.read(authFlowProvider.notifier);

  void _digit(String d) {
    final phase = _override ?? ref.read(authFlowProvider).phase;
    if (phase == CodePhase.verifying) return;
    setState(() {
      if (phase == CodePhase.wrong || phase == CodePhase.tooMany) _code = '';
      _override = null;
      _failure = null;
      if (_code.length < 6) _code += d;
    });
    if (phase == CodePhase.wrong) _flow.clearPhase();
  }

  void _delete() {
    if ((_override ?? ref.read(authFlowProvider).phase) == CodePhase.verifying) return;
    setState(() {
      _override = null;
      if (_code.isNotEmpty) _code = _code.substring(0, _code.length - 1);
    });
  }

  Future<void> _verify() async {
    if (_code.length != 6) return;
    setState(() {
      _override = null;
      _failure = null;
    });
    final step = await _flow.verify(_code);
    if (!mounted) return;
    switch (step) {
      case AuthStep.joined:
        context.go('/joined');
      case AuthStep.home:
        context.go('/home');
      case AuthStep.newPin:
        context.go('/pin/create');
      case AuthStep.finishLater:
        context.go('/screen/au-11-offline');
      case AuthStep.stay:
        setState(() => _failure = _flow.lastFailure);
    }
  }

  Future<void> _resend() async {
    final failure = await _flow.sendCode();
    if (!mounted) return;
    setState(() {
      _override = null;
      _failure = failure;
      if (failure == null) {
        _code = '';
        _resendKey++;
      }
    });
  }

  void _differentEmail() => context.go(ref.read(authFlowProvider).purpose == AuthPurpose.signup ? '/email' : '/signin');

  @override
  Widget build(BuildContext context) {
    final flow = ref.watch(authFlowProvider);
    final phase = _override ?? flow.phase;
    final email = flow.email.isNotEmpty ? flow.email : (widget.forced != null ? 'parent@example.com' : '');
    final key = switch (phase) {
      CodePhase.wrong || CodePhase.tooMany => 'au-08-code-wrong',
      CodePhase.expired => 'au-09-code-expired',
      CodePhase.verifying => 'au-10-code-sending',
      CodePhase.idle => 'au-07-code',
    };
    // The gallery asks for a specific id; keep it even if the user then moves on.
    final rootKey = switch (widget.forced) {
      CodePhase.wrong => 'au-08-code-wrong',
      CodePhase.expired => 'au-09-code-expired',
      CodePhase.verifying => 'au-10-code-sending',
      _ => widget.forced == null ? key : 'au-07-code',
    };
    final recovery = flow.purpose == AuthPurpose.recovery;
    final step = recovery ? 'PIN recovery' : (flow.purpose == AuthPurpose.signin ? 'Sign in' : 'Parent setup · Step 6 of 6');

    Widget? banner = demoBanner(widget.demo);
    if (_failure == AuthFailure.offline) {
      banner = const StateBanner(message: 'You are offline. Reconnect and try again.', kind: BannerKind.offline);
    } else if (_failure == AuthFailure.unknown) {
      banner = const StateBanner(message: 'Something went wrong. Please try again.', kind: BannerKind.error);
    }

    if (phase == CodePhase.expired) {
      final validUntil = (flow.sentAt ?? DateTime.now()).add(codeLifetime);
      return KeyedSubtree(
        key: Key('screen-$rootKey'),
        child: AuthPage(
          step: step,
          title: 'That code has expired',
          intro: 'Codes work for 10 minutes. Nothing is wrong with your account. We can send a fresh one.',
          banner: banner,
          bottom: AuthActions(
            primary: PrimaryButton(label: 'Send a new code', height: 64, onPressed: _resend),
            link: AuthLink('Use a different email', _differentEmail),
          ),
          children: [
            const SizedBox(height: Kc.s6),
            Center(
              child: Container(
                width: 140,
                height: 140,
                decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.1), shape: BoxShape.circle),
                child: const Icon(Icons.timer_outlined, size: 72, color: Kc.softGold),
              ),
            ),
            const SizedBox(height: Kc.s6),
            AuthNotice(message: 'The code sent to $email was valid until ${formatClock(validUntil)}.'),
          ],
        ),
      );
    }

    final verifying = phase == CodePhase.verifying;
    final wrong = phase == CodePhase.wrong;
    final tooMany = phase == CodePhase.tooMany;
    final left = flow.triesLeft;

    final primary = verifying
        ? PrimaryButton(label: 'Verifying...', onPressed: null, height: 64)
        : tooMany
            ? PrimaryButton(label: 'Send me a new code', height: 64, onPressed: _resend)
            : wrong
                ? PrimaryButton(
                    label: 'Try again',
                    height: 64,
                    onPressed: () {
                      setState(() {
                        _code = '';
                        _override = null;
                      });
                      _flow.clearPhase();
                    })
                : PrimaryButton(label: 'Verify', height: 64, onPressed: _code.length == 6 ? _verify : null);

    return KeyedSubtree(
      key: Key('screen-$rootKey'),
      child: AuthPage(
        step: step,
        title: verifying ? 'Checking your code...' : 'Enter your code',
        introWidget: verifying
            ? Text('This only takes a moment. Please keep this screen open.', style: AuthText.body)
            : wrong || tooMany
                ? null
                : Text.rich(TextSpan(style: AuthText.body, children: [
                    const TextSpan(text: 'We sent a 6-digit code to '),
                    TextSpan(text: email, style: const TextStyle(fontWeight: FontWeight.w800)),
                    const TextSpan(text: '. It works for 10 minutes.'),
                  ])),
        banner: banner,
        bottom: AuthActions(
          primary: primary,
          link: wrong ? AuthLink('Send me a new code', _resend) : null,
        ),
        children: [
          if (wrong)
            AuthNotice(
              heading: 'That code is not right',
              message: 'Check the latest email and try again. You have $left ${left == 1 ? 'try' : 'tries'} left.',
              icon: Icons.error_outline_rounded,
            ),
          if (tooMany)
            const AuthNotice(
              heading: 'Too many tries',
              message: 'Please wait a moment, then ask for a new code. Nothing is wrong with your account.',
              icon: Icons.error_outline_rounded,
            ),
          CodeBoxes(code: _code),
          const SizedBox(height: Kc.s2),
          NumberPad(onDigit: _digit, onDelete: _delete, dark: true, enabled: !verifying),
          if (verifying)
            const Padding(
              padding: EdgeInsets.only(top: Kc.s3),
              child: Center(child: SizedBox(width: 28, height: 28, child: CircularProgressIndicator(color: Kc.yellow, strokeWidth: 3))),
            )
          else if (phase == CodePhase.idle)
            Center(child: ResendCountdown(key: ValueKey(_resendKey), onResend: _resend)),
        ],
      ),
    );
  }
}
