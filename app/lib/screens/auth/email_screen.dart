import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'auth_logic.dart';
import 'auth_state.dart';
import 'auth_widgets.dart';

enum EmailMode { signup, signin, recovery }

enum EmailView { normal, invalid, sending, notFound }

/// The email entry used by sign-up (au-05, au-06), returning sign-in (au-13, au-14, au-15)
/// and PIN recovery (au-16). Sends the emailed code for real.
class EmailScreen extends ConsumerStatefulWidget {
  const EmailScreen({super.key, required this.mode, this.forced = EmailView.normal, this.demo = ScreenState.normal});

  final EmailMode mode;
  final EmailView forced;
  final ScreenState demo;

  @override
  ConsumerState<EmailScreen> createState() => _EmailScreenState();
}

class _EmailScreenState extends ConsumerState<EmailScreen> {
  final _controller = TextEditingController();
  late EmailView _view = widget.forced;
  AuthFailure? _failure;

  AuthPurpose get _purpose => switch (widget.mode) {
        EmailMode.signup => AuthPurpose.signup,
        EmailMode.signin => AuthPurpose.signin,
        EmailMode.recovery => AuthPurpose.recovery,
      };

  @override
  void initState() {
    super.initState();
    _controller.text = ref.read(authFlowProvider).email;
    if (widget.forced == EmailView.invalid) _controller.text = 'parent@example';
    Future.microtask(() {
      if (!mounted) return;
      ref.read(authFlowProvider.notifier).begin(_purpose, email: _controller.text);
      if (widget.mode == EmailMode.recovery && _controller.text.isEmpty) {
        ref.read(parentProvider.future).then((p) {
          if (mounted && p != null && _controller.text.isEmpty) _controller.text = p.email;
        }, onError: (_) {});
      }
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_view == EmailView.sending) return;
    final email = _controller.text.trim();
    if (!isValidEmail(email)) {
      setState(() {
        _view = EmailView.invalid;
        _failure = null;
      });
      return;
    }
    final flow = ref.read(authFlowProvider.notifier);
    flow.begin(_purpose, email: email);
    setState(() {
      _view = EmailView.sending;
      _failure = null;
    });
    final failure = await flow.sendCode();
    if (!mounted) return;
    if (failure == null) {
      setState(() => _view = EmailView.normal);
      context.go(widget.mode == EmailMode.recovery ? '/screen/au-17-recovery-sent' : '/code');
      return;
    }
    setState(() {
      _failure = failure;
      _view = (failure == AuthFailure.noAccount || failure == AuthFailure.tooManyAttempts) ? EmailView.notFound : EmailView.normal;
    });
  }

  void _newHere() {
    ref.read(authFlowProvider.notifier).begin(AuthPurpose.signup);
    context.go('/welcome');
  }

  String get _key => switch (widget.mode) {
        EmailMode.signup => widget.forced == EmailView.invalid ? 'au-06-email-invalid' : 'au-05-email',
        EmailMode.signin => switch (widget.forced) {
            EmailView.sending => 'au-14-signin-sending',
            EmailView.notFound => 'au-15-signin-error',
            _ => 'au-13-signin',
          },
        EmailMode.recovery => 'au-16-forgot-pin',
      };

  @override
  Widget build(BuildContext context) {
    final mode = widget.mode;
    final sending = _view == EmailView.sending;
    final invalid = _view == EmailView.invalid;
    final notFound = _view == EmailView.notFound;
    final tooMany = _failure == AuthFailure.tooManyAttempts;
    final online = ref.watch(onlineProvider);

    Widget? banner = demoBanner(widget.demo);
    if (_failure == AuthFailure.offline || !online) {
      banner = const StateBanner(message: 'You are offline. Reconnect to get your code.', kind: BannerKind.offline);
    } else if (_failure == AuthFailure.unknown) {
      banner = const StateBanner(message: 'We could not send the code. Please try again.', kind: BannerKind.error);
    }

    final (String? step, String title, String intro) = switch (mode) {
      EmailMode.signup => ('Parent setup · Step 5 of 6', 'Your email address', 'We email you a one-time code to open your family account. No password to remember.'),
      EmailMode.signin => (null, 'Welcome back', 'Sign in on this phone to see your children\'s progress. We will email you a one-time code.'),
      EmailMode.recovery => ('PIN recovery', 'Forgot your PIN?', 'No problem. We will email a one-time code to the address you used at sign-up. Then you can choose a new PIN.'),
    };

    final primaryLabel = notFound ? 'Try again' : (sending ? 'Sending...' : 'Send my code');
    final VoidCallback? primaryAction = sending
        ? null
        : notFound
            ? () => setState(() {
                  _view = EmailView.normal;
                  _failure = null;
                })
            : _send;

    final link = switch (mode) {
      EmailMode.signup => invalid ? null : AuthLink('Privacy policy', () => showPrivacySheet(context)),
      EmailMode.signin => AuthLink('I am new here. Set up KudiCubs', _newHere),
      EmailMode.recovery => AuthLink('Back', () => context.canPop() ? context.pop() : context.go('/gate')),
    };

    return KeyedSubtree(
      key: Key('screen-$_key'),
      child: AuthPage(
        step: step,
        title: title,
        intro: intro,
        banner: banner,
        bottom: AuthActions(primary: PrimaryButton(label: primaryLabel, onPressed: primaryAction, height: 64), link: sending ? null : link),
        children: [
          if (notFound)
            AuthNotice(
              heading: tooMany ? 'Sign-in is paused for now' : 'We could not find a family with that email',
              message: tooMany
                  ? 'Too many tries. Please wait a little, then try again. Your children can keep playing.'
                  : 'Check the spelling, or try the email you used when you first set up KudiCubs.',
              icon: Icons.error_outline_rounded,
            ),
          if (notFound) const SizedBox(height: Kc.s4),
          Text('Parent email', style: KcText.label.copyWith(color: Kc.cream)),
          const SizedBox(height: 6),
          TextFieldKc(
            controller: _controller,
            hint: 'name@example.com',
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.send,
            onChanged: (_) {
              if (invalid || notFound) setState(() => _view = EmailView.normal);
            },
            onSubmitted: (_) => _send(),
          ),
          const SizedBox(height: Kc.s3),
          if (invalid)
            const AuthNotice(
              message: 'Please check the email address. It looks like part is missing after the @.',
              icon: Icons.error_outline_rounded,
            ),
          if (mode == EmailMode.signup && !invalid && !notFound) Text('Example: name@example.com', style: AuthText.small),
          if (mode == EmailMode.recovery) Text('We only send the code to the email on your family account.', style: AuthText.small),
          if (sending && mode == EmailMode.signin)
            Text('Sending your code...', style: KcText.label.copyWith(color: Kc.softGold)),
          const SizedBox(height: Kc.s3),
          if (mode == EmailMode.signup)
            Text(
              invalid
                  ? 'Only you see this email. We never share it or use it for ads.'
                  : 'Only you see this email. We use it to sign you in and to warn you before an unused account is deleted. We never share it or use it for ads.',
              style: AuthText.small,
            ),
          if (mode == EmailMode.signup && !sending) ...[
            const SizedBox(height: Kc.s3),
            Center(
              child: TextButton(
                key: const Key('skip-email'),
                onPressed: () async {
                  final step = await ref.read(authFlowProvider.notifier).continueAsGuest();
                  if (!context.mounted) return;
                  context.go(step == AuthStep.joined ? '/joined' : '/screen/au-11-offline');
                },
                child: Text('Skip for now', style: KcText.label.copyWith(color: Kc.softGold, fontWeight: FontWeight.w800)),
              ),
            ),
          ],
          if (mode == EmailMode.recovery)
            Text('Your child\'s coins, badges and progress stay exactly as they are.', style: AuthText.body),
          if (notFound && mode == EmailMode.signin) ...[
            const SizedBox(height: Kc.s4),
            Container(
              padding: const EdgeInsets.all(Kc.s4),
              decoration: BoxDecoration(color: Kc.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(Kc.rMd)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('If you tried several times', style: KcText.label.copyWith(color: Kc.softGold, fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text('After 5 tries we pause sign-in for 15 minutes to keep your family safe. Your children can keep playing.',
                    style: AuthText.body.copyWith(fontSize: 15)),
              ]),
            ),
          ],
        ],
      ),
    );
  }
}
