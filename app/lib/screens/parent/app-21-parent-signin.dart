// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show AuthException;

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import 'parent_data.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

/// Canvas `app-21-parent-signin`: sign in on a new device with the emailed 6-digit code,
/// then say whose device it is. Optional route query `?email=`.
Widget build_app_21_parent_signin(BuildContext context, ScreenState state) => ParentSignInView(
  key: const Key('screen-app-21-parent-signin'),
  state: state,
  email: routeValue(context, 'email', query: true),
);

class ParentSignInView extends ConsumerStatefulWidget {
  const ParentSignInView({super.key, this.state = ScreenState.normal, this.email, this.recovery = false, this.onDone});

  final ScreenState state;

  /// The address the code was sent to. Null: ask for it first.
  final String? email;

  /// Forgot-PIN recovery: no device question, continues to choosing a new PIN.
  final bool recovery;

  /// Called after sign-in with the chosen mode, instead of navigating.
  final void Function(DeviceMode mode)? onDone;

  @override
  ConsumerState<ParentSignInView> createState() => _ParentSignInViewState();
}

class _ParentSignInViewState extends ConsumerState<ParentSignInView> {
  final _emailCtl = TextEditingController();
  final _codeCtl = TextEditingController();
  String? _email;
  DeviceMode _mode = DeviceMode.myPhone;
  bool _busy = false;
  String? _error;
  String? _notice;

  @override
  void initState() {
    super.initState();
    _email = widget.email;
    if (widget.state == ScreenState.error) _error = 'That code did not work. Check it or send a new one.';
    _codeCtl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _emailCtl.dispose();
    _codeCtl.dispose();
    super.dispose();
  }

  Future<void> _sendFirst() async {
    final email = _emailCtl.text.trim();
    if (!isValidEmail(email)) {
      setState(() => _error = 'Check the email address and try again.');
      return;
    }
    await _send(email, first: true);
  }

  Future<void> _send(String email, {bool first = false}) async {
    setState(() {
      _busy = true;
      _error = null;
      _notice = null;
    });
    try {
      await ref.read(authRepositoryProvider).sendCode(email);
      if (!mounted) return;
      setState(() {
        if (first) _email = email;
        _notice = first ? null : 'We sent a new code.';
      });
    } catch (_) {
      if (mounted) setState(() => _error = 'We could not send the code. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _continue() async {
    final email = _email!;
    setState(() {
      _busy = true;
      _error = null;
      _notice = null;
    });
    try {
      await ref.read(authRepositoryProvider).verifyCode(email, _codeCtl.text);
    } on AuthException {
      if (mounted) setState(() => _error = 'That code did not work. Check it or send a new one.');
      if (mounted) setState(() => _busy = false);
      return;
    } catch (_) {
      if (mounted) setState(() => _error = 'We could not check the code. Check your connection and try again.');
      if (mounted) setState(() => _busy = false);
      return;
    }
    if (!mounted) return;
    if (widget.recovery) {
      setState(() => _busy = false);
      context.go('/pin/create');
      return;
    }
    try {
      await ref.read(deviceRepositoryProvider).setMode(_mode);
    } catch (_) {
      // Signed in; the mode is kept on the device and can be saved again from Settings.
    }
    await ref.read(onboardedProvider.notifier).set(true);
    if (!mounted) return;
    setState(() => _busy = false);
    if (widget.onDone != null) {
      widget.onDone!(_mode);
    } else {
      context.go(_mode == DeviceMode.myPhone ? '/parent' : '/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.state == ScreenState.loading) {
      return const ParentPage(scroll: false, child: ParentMessage(title: 'Sending your code...'));
    }
    if (widget.state == ScreenState.offline) {
      return ParentPage(
        scroll: false,
        child: ParentMessage(
          title: 'No connection',
          message: 'We need the internet to sign you in. Check your connection and try again.',
          onAction: () => context.go('/signin'),
        ),
      );
    }
    if (_email == null) return _askEmail();

    final code = _codeCtl.text;
    final ready = code.length == 6 && !_busy;
    return ParentPage(
      bottom: ParentPrimary('Continue', onPressed: ready ? _continue : null),
      child: Gap(
        gap: 14,
        children: [
          Text(widget.recovery ? 'Reset your PIN' : 'Sign in on a new device', style: PT.eyebrow),
          Text('Enter your code', style: PT.display(32)),
          Text('We emailed a 6-digit code to ${maskEmail(_email!)}. It works once.', style: PT.body(16)),
          if (_error != null) ParentAlert(title: 'Not signed in.', message: _error!),
          if (_notice != null) InfoStrip(_notice!),
          Text('One-time code', style: PT.strong(15, color: Kc.softGold)),
          _CodeBoxes(controller: _codeCtl),
          Align(
            alignment: Alignment.centerLeft,
            child: InkWell(
              onTap: _busy ? null : () => _send(_email!),
              child: ConstrainedBox(
                constraints: const BoxConstraints(minHeight: Kc.touchMin),
                child: Align(
                  widthFactor: 1,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Send a new code',
                    style: PT.strong(16, color: Kc.softGold).copyWith(decoration: TextDecoration.underline),
                  ),
                ),
              ),
            ),
          ),
          if (!widget.recovery) ...[
            Text('Whose device is this?', style: PT.heading(22)),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _DeviceTile(
                    key: const Key('signin-mode-my-phone'),
                    title: 'This is my phone',
                    body: 'Opens to the PIN-protected parent view of all children.',
                    selected: _mode == DeviceMode.myPhone,
                    onTap: () => setState(() => _mode = DeviceMode.myPhone),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _DeviceTile(
                    key: const Key('signin-mode-family'),
                    title: 'Family device',
                    body: 'Children can play here. The parent area stays behind the gate.',
                    selected: _mode == DeviceMode.family,
                    onTap: () => setState(() => _mode = DeviceMode.family),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _askEmail() => ParentPage(
    bottom: ParentPrimary('Send me a code', onPressed: _busy ? null : _sendFirst),
    child: Gap(
      gap: 14,
      children: [
        Text('Sign in on a new device', style: PT.eyebrow),
        Text('Your parent email', style: PT.display(32)),
        Text('We will email you a 6-digit code. It works once.', style: PT.body(16)),
        if (_error != null) ParentAlert(title: 'Not sent.', message: _error!),
        Text('Email', style: PT.strong(15, color: Kc.softGold)),
        TextField(
          key: const Key('signin-email'),
          controller: _emailCtl,
          keyboardType: TextInputType.emailAddress,
          autocorrect: false,
          enableSuggestions: false,
          autofillHints: const [AutofillHints.email],
          style: PT.strong(18, color: Kc.brown),
          cursorColor: Kc.brown,
          decoration: InputDecoration(
            filled: true,
            fillColor: Kc.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(Kc.rMd),
              borderSide: const BorderSide(color: Kc.softGold, width: 2),
            ),
          ),
          onSubmitted: (_) => _sendFirst(),
        ),
      ],
    ),
  );
}

/// Six digit boxes drawn over one real text field (keeps paste, autofill and the number keyboard working).
class _CodeBoxes extends StatelessWidget {
  const _CodeBoxes({required this.controller});
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    final digits = controller.text;
    return Stack(
      children: [
        Row(
          children: [
            for (var i = 0; i < 6; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(
                child: Container(
                  height: 60,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Kc.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: i < digits.length ? Kc.yellow : Kc.white.withValues(alpha: 0.4),
                      width: 2,
                    ),
                  ),
                  child: Text(i < digits.length ? digits[i] : '', style: PT.display(26)),
                ),
              ),
            ],
          ],
        ),
        Positioned.fill(
          child: Opacity(
            opacity: 0.01,
            child: TextField(
              key: const Key('signin-code'),
              controller: controller,
              autofocus: true,
              keyboardType: TextInputType.number,
              autofillHints: const [AutofillHints.oneTimeCode],
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
              showCursor: false,
              decoration: const InputDecoration(border: InputBorder.none, counterText: ''),
              style: const TextStyle(color: Colors.transparent),
            ),
          ),
        ),
      ],
    );
  }
}

class _DeviceTile extends StatelessWidget {
  const _DeviceTile({super.key, required this.title, required this.body, required this.selected, required this.onTap});
  final String title;
  final String body;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    label: title,
    excludeSemantics: true,
    child: Material(
      color: selected ? Kc.softGold : Kc.white.withValues(alpha: 0.08),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: selected ? Kc.yellow : Kc.white.withValues(alpha: 0.4), width: 3),
      ),
      child: InkWell(
        customBorder: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 150),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: PT.display(22, color: selected ? Kc.brown : Kc.cream)),
              const SizedBox(height: 6),
              Text(body, style: PT.body(14, color: selected ? Kc.brown : Kc.cream, weight: 700)),
            ],
          ),
        ),
      ),
    ),
  );
}
