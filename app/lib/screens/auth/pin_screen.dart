import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'auth_logic.dart';
import 'auth_state.dart';
import 'auth_widgets.dart';

/// Which designed variant the PIN screen is showing.
enum PinView { normal, weak, mismatch }

/// Create a PIN (au-01), too-easy (au-02) and mismatch (au-03). Two steps: choose, then confirm.
/// Used for sign-up and for choosing a new PIN after recovery.
class PinScreen extends ConsumerStatefulWidget {
  const PinScreen({super.key, this.forced = PinView.normal, this.demo = ScreenState.normal});

  final PinView forced;
  final ScreenState demo;

  @override
  ConsumerState<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends ConsumerState<PinScreen> {
  String _entry = '';
  String _first = '';
  bool _confirming = false;
  PinView _view = PinView.normal;
  bool _saving = false;
  String? _problem;

  @override
  void initState() {
    super.initState();
    _view = widget.forced;
    if (_view == PinView.weak) _entry = '1234';
    if (_view == PinView.mismatch) {
      _confirming = true;
      _first = '2580';
      _entry = '2589';
    }
  }

  void _digit(String d) {
    if (_saving) return;
    setState(() {
      if (_view != PinView.normal) {
        _view = PinView.normal;
        _entry = '';
      }
      _problem = null;
      if (_entry.length < 4) _entry += d;
    });
  }

  void _delete() {
    if (_saving) return;
    setState(() {
      _view = PinView.normal;
      _problem = null;
      if (_entry.isNotEmpty) _entry = _entry.substring(0, _entry.length - 1);
    });
  }

  void _startOver() => setState(() {
        _view = PinView.normal;
        _entry = '';
        _first = '';
        _confirming = false;
      });

  Future<void> _next() async {
    if (_entry.length != 4 || _saving) return;
    if (!_confirming) {
      if (validatePin(_entry) != null) {
        setState(() => _view = PinView.weak);
        return;
      }
      setState(() {
        _first = _entry;
        _entry = '';
        _confirming = true;
      });
      return;
    }
    if (_entry != _first) {
      setState(() => _view = PinView.mismatch);
      return;
    }
    final flow = ref.read(authFlowProvider.notifier);
    if (ref.read(authFlowProvider).purpose == AuthPurpose.recovery) {
      setState(() => _saving = true);
      final r = await flow.saveNewPin(_entry);
      if (!mounted) return;
      if (r.ok) {
        context.go('/parent');
        return;
      }
      setState(() {
        _saving = false;
        if (r.issue != null) {
          _view = PinView.weak;
          _confirming = false;
        } else {
          _problem = flow.lastFailure == AuthFailure.offline
              ? 'You are offline. Reconnect and try again.'
              : 'We could not save your PIN. Please try again.';
        }
      });
      return;
    }
    flow.setPin(_entry);
    context.go('/region');
  }

  @override
  Widget build(BuildContext context) {
    final recovery = ref.watch(authFlowProvider.select((s) => s.purpose)) == AuthPurpose.recovery;
    final weak = _view == PinView.weak;
    final mismatch = _view == PinView.mismatch;
    final key = switch (widget.forced) {
      PinView.normal => 'au-01-pin-create',
      PinView.weak => 'au-02-pin-weak',
      PinView.mismatch => 'au-03-pin-mismatch',
    };
    final (String label, VoidCallback? action) = weak
        ? ('Choose a new PIN', _startOver)
        : mismatch
            ? ('Try again', () => setState(() {
                  _view = PinView.normal;
                  _entry = '';
                }))
            : ('Next', _entry.length == 4 && !_saving ? _next : null);
    return KeyedSubtree(
      key: Key('screen-$key'),
      child: AuthPage(
        step: recovery ? 'PIN recovery' : 'Parent setup · Step 3 of 6',
        title: _confirming ? 'Type your PIN once more' : 'Choose a 4-digit parent PIN',
        intro: !_confirming && !weak ? 'You will use this PIN to open settings and the parent area. Keep it to yourself.' : null,
        banner: demoBanner(widget.demo),
        bottom: AuthActions(
          primary: PrimaryButton(label: label, onPressed: action, height: 64),
          link: mismatch ? AuthLink('Start over with a new PIN', _startOver) : null,
        ),
        children: [
          Center(child: PinDots(filled: _entry.length, error: weak || mismatch, dark: true)),
          const SizedBox(height: Kc.s4),
          if (weak)
            const AuthNotice(
              heading: 'Please choose a harder PIN',
              message: '1234 is easy to guess. Avoid runs like 1234 and repeats like 1111.',
            ),
          if (mismatch)
            const AuthNotice(
              heading: 'The two PINs do not match',
              message: 'No problem. Try the second PIN again, or go back and pick a new one.',
            ),
          if (_problem != null) AuthNotice(message: _problem!),
          const SizedBox(height: Kc.s2),
          NumberPad(onDigit: _digit, onDelete: _delete, dark: true, enabled: !_saving),
        ],
      ),
    );
  }
}
