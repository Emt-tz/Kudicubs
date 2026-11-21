import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'auth_logic.dart';

/// Shared look of the parent setup / sign-in screens: Mane Brown page, cream text,
/// small yellow step label, big title, one yellow main button pinned at the bottom.
class AuthPage extends StatelessWidget {
  const AuthPage({
    super.key,
    this.step,
    required this.title,
    this.intro,
    this.introWidget,
    this.children = const [],
    this.bottom,
    this.banner,
    this.showBack = false,
  });

  final String? step;
  final String title;
  final String? intro;
  final Widget? introWidget;
  final List<Widget> children;
  final Widget? bottom;
  final Widget? banner;
  final bool showBack;

  @override
  Widget build(BuildContext context) => ScreenScaffold(
        background: Kc.brown,
        showBack: showBack,
        scrollable: true,
        padding: const EdgeInsets.symmetric(horizontal: Kc.s6),
        bottom: bottom,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (banner != null) ...[banner!, const SizedBox(height: Kc.s4)],
            if (step != null) ...[
              Text(step!.toUpperCase(), style: AuthText.step),
              const SizedBox(height: Kc.s3),
            ],
            Semantics(header: true, child: Text(title, style: AuthText.title)),
            if (introWidget != null || intro != null) ...[
              const SizedBox(height: Kc.s3),
              introWidget ?? Text(intro!, style: AuthText.body),
            ],
            const SizedBox(height: Kc.s4),
            ...children,
          ],
        ),
      );
}

abstract final class AuthText {
  static final step = KcText.label.copyWith(color: Kc.softGold, fontWeight: FontWeight.w800, letterSpacing: 0.6, fontSize: 15);
  static final title = KcText.displayL.copyWith(color: Kc.cream, fontSize: 34);
  static final body = KcText.body.copyWith(color: Kc.cream, fontSize: 17);
  static final small = KcText.caption.copyWith(color: Kc.softGold, fontSize: 14);
  static final link = KcText.label.copyWith(color: Kc.softGold, decoration: TextDecoration.underline, decorationColor: Kc.softGold);
}

/// Peach panel with an optional bold heading, used for every error / status message.
class AuthNotice extends StatelessWidget {
  const AuthNotice({super.key, this.heading, required this.message, this.icon = Icons.info_outline_rounded});

  final String? heading;
  final String message;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Semantics(
        liveRegion: true,
        child: Container(
          padding: const EdgeInsets.all(Kc.s4),
          decoration: BoxDecoration(
            color: Kc.peach,
            borderRadius: BorderRadius.circular(Kc.rMd),
            border: Border.all(color: Kc.softGold, width: Kc.border),
          ),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Icon(icon, color: Kc.brown),
            const SizedBox(width: Kc.s3),
            Expanded(
              child: Text.rich(TextSpan(children: [
                if (heading != null) TextSpan(text: '$heading\n', style: KcText.label.copyWith(fontWeight: FontWeight.w800, fontSize: 17)),
                TextSpan(text: message, style: KcText.body.copyWith(fontSize: 16)),
              ])),
            ),
          ]),
        ),
      );
}

/// Quiet underlined action under the main button (48 dp tall).
class AuthLink extends StatelessWidget {
  const AuthLink(this.label, this.onTap, {super.key});

  final String label;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        child: InkWell(
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: Kc.touchMin),
            child: Center(child: Text(label, style: AuthText.link, textAlign: TextAlign.center)),
          ),
        ),
      );
}

/// Main button + quiet link stacked at the bottom of a screen.
class AuthActions extends StatelessWidget {
  const AuthActions({super.key, required this.primary, this.link});

  final PrimaryButton primary;
  final AuthLink? link;

  @override
  Widget build(BuildContext context) => Column(mainAxisSize: MainAxisSize.min, children: [primary, ?link]);
}

/// The six boxes of the emailed code. The active box has a yellow outline.
class CodeBoxes extends StatelessWidget {
  const CodeBoxes({super.key, required this.code, this.length = 6});

  final String code;
  final int length;

  @override
  Widget build(BuildContext context) => Semantics(
        label: '${code.length} of $length digits entered',
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: Kc.s2),
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            for (var i = 0; i < length; i++)
              Container(
                width: 48,
                height: 60,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: i < code.length ? Kc.cream : (i == code.length ? Kc.white.withValues(alpha: 0.1) : Colors.transparent),
                  borderRadius: BorderRadius.circular(12),
                  border: i < code.length
                      ? null
                      : Border.all(color: i == code.length ? Kc.yellow : Kc.white.withValues(alpha: 0.35), width: i == code.length ? 3 : 2),
                ),
                child: i < code.length ? Text(code[i], style: KcText.displayL.copyWith(fontSize: 30)) : null,
              ),
          ]),
        ),
      );
}

/// "Resend in 0:30" that turns into a link when the wait is over. Tapping the link calls
/// [onResend] and restarts the wait.
class ResendCountdown extends StatefulWidget {
  const ResendCountdown({
    super.key,
    this.seconds = 30,
    required this.onResend,
    this.waitingPrefix = 'Resend in',
    this.readyLabel = 'Send me a new code',
  });

  final int seconds;
  final VoidCallback onResend;
  final String waitingPrefix;
  final String readyLabel;

  @override
  State<ResendCountdown> createState() => _ResendCountdownState();
}

class _ResendCountdownState extends State<ResendCountdown> {
  late int _left = widget.seconds;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _start();
  }

  void _start() {
    _timer?.cancel();
    _left = widget.seconds;
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() => _left--);
      if (_left <= 0) t.cancel();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_left > 0) {
      return SizedBox(
        height: Kc.touchMin,
        child: Center(
          child: Semantics(
            liveRegion: false,
            child: Text('${widget.waitingPrefix} ${formatCooldown(_left)}', style: KcText.label.copyWith(color: Kc.softGold)),
          ),
        ),
      );
    }
    return AuthLink(widget.readyLabel, () {
      widget.onResend();
      setState(_start);
    });
  }
}

/// What the gallery's `?state=` adds to an auth screen that has no designed variant for it.
Widget? demoBanner(ScreenState state) => switch (state) {
      ScreenState.offline => const StateBanner(message: 'You are offline', kind: BannerKind.offline),
      ScreenState.error => const StateBanner(message: 'Something went wrong. Please try again.', kind: BannerKind.error),
      ScreenState.loading => const StateBanner(message: 'Please wait a moment...'),
      _ => null,
    };

/// Short privacy summary shown from "Privacy policy".
Future<void> showPrivacySheet(BuildContext context) => showModalBottomSheet<void>(
      context: context,
      backgroundColor: Kc.cream,
      showDragHandle: true,
      builder: (c) => Padding(
        padding: const EdgeInsets.fromLTRB(Kc.s6, 0, Kc.s6, Kc.s8),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Privacy', style: KcText.title),
          const SizedBox(height: Kc.s3),
          Text(
            'We keep only your child\'s nickname, age band, friend and country, and what they do in missions. '
            'Your email is used to sign you in. There is no tracking by other companies and no ads. '
            'You can export or delete everything from the parent area.',
            style: KcText.body,
          ),
        ]),
      ),
    );
