/// Enter-PIN screen for the parent area. Verifies through the `verify_pin` RPC
/// (ParentRepository.verifyPin): ok unlocks, wrong shakes, locked opens the
/// lock-out screen. The grown-up gate (`/gate?next=...`) shows this after its question.
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'app-20-parent-lockout.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

enum PinEntryStatus { idle, checking, wrong, offline }

class ParentPinEntry extends ConsumerStatefulWidget {
  const ParentPinEntry({super.key, this.next = '/parent', this.onUnlocked, this.onLocked, this.onLeave});

  /// Where to go after unlocking (the gate passes its `next` query value).
  final String next;

  /// Called after a correct PIN instead of `context.go(next)`.
  final VoidCallback? onUnlocked;

  /// Called when the PIN is locked instead of opening the lock-out screen.
  final VoidCallback? onLocked;

  /// "Back to the game" instead of the default (`context.go('/home')`).
  final VoidCallback? onLeave;

  @override
  ConsumerState<ParentPinEntry> createState() => _ParentPinEntryState();
}

class _ParentPinEntryState extends ConsumerState<ParentPinEntry> with SingleTickerProviderStateMixin {
  String _digits = '';
  PinEntryStatus _status = PinEntryStatus.idle;
  late final AnimationController _shake = AnimationController(vsync: this, duration: const Duration(milliseconds: 420));

  @override
  void initState() {
    super.initState();
    // Already locked from earlier wrong tries: go straight to the pause screen.
    ref
        .read(parentProvider.future)
        .then((p) {
          if (mounted && p != null && p.isLocked) _goLocked();
        })
        .catchError((Object _) {});
  }

  @override
  void dispose() {
    _shake.dispose();
    super.dispose();
  }

  void _goLocked() {
    ref.invalidate(parentProvider);
    if (widget.onLocked != null) {
      widget.onLocked!();
    } else {
      Navigator.of(
        context,
      ).pushReplacement(MaterialPageRoute<void>(builder: (c) => build_app_20_parent_lockout(c, ScreenState.normal)));
    }
  }

  Future<void> _digit(String d) async {
    if (_status == PinEntryStatus.checking || _digits.length >= kPinLength) return;
    setState(() {
      _digits += d;
      _status = PinEntryStatus.idle;
    });
    if (_digits.length == kPinLength) await _verify();
  }

  void _delete() {
    if (_status == PinEntryStatus.checking || _digits.isEmpty) return;
    setState(() {
      _digits = _digits.substring(0, _digits.length - 1);
      _status = PinEntryStatus.idle;
    });
  }

  Future<void> _verify() async {
    setState(() => _status = PinEntryStatus.checking);
    PinResult result;
    try {
      result = await ref.read(parentRepositoryProvider).verifyPin(_digits);
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _digits = '';
        _status = PinEntryStatus.offline;
      });
      return;
    }
    if (!mounted) return;
    switch (result) {
      case PinResult.ok:
        ref.read(parentUnlockedProvider.notifier).unlock();
        if (widget.onUnlocked != null) {
          widget.onUnlocked!();
        } else {
          context.go(widget.next);
        }
      case PinResult.wrong:
        setState(() {
          _digits = '';
          _status = PinEntryStatus.wrong;
        });
        _shake.forward(from: 0);
      case PinResult.locked:
        setState(() => _digits = '');
        _goLocked();
    }
  }

  void _leave() {
    ref.read(parentUnlockedProvider.notifier).lock();
    if (widget.onLeave != null) {
      widget.onLeave!();
    } else {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final wrong = _status == PinEntryStatus.wrong;
    final message = switch (_status) {
      PinEntryStatus.wrong => 'That is not the PIN. Try again.',
      PinEntryStatus.offline => 'We could not check the PIN. Check your connection and try again.',
      _ => null,
    };
    return ParentPage(
      key: const Key('parent-pin-entry'),
      bottom: ParentSoft('Back to the game', onPressed: _leave),
      child: Gap(
        gap: 14,
        children: [
          Text('For grown-ups', style: PT.eyebrow.copyWith(height: 1.4)),
          Text('Enter your PIN', style: PT.display(34)),
          Text('Type the 4-digit parent PIN to open the parent area.', style: PT.body(17)),
          const SizedBox(height: 8),
          AnimatedBuilder(
            animation: _shake,
            builder: (_, child) {
              final t = _shake.value;
              return Transform.translate(offset: Offset(math.sin(t * math.pi * 6) * 12 * (1 - t), 0), child: child);
            },
            child: Center(
              child: PinDots(filled: _digits.length, error: wrong, dark: true),
            ),
          ),
          SizedBox(
            height: 48,
            child: message == null
                ? null
                : Center(
                    child: Semantics(
                      liveRegion: true,
                      child: Text(
                        message,
                        key: const Key('pin-message'),
                        style: PT.strong(16, color: Kc.softGold),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
          ),
          NumberPad(dark: true, enabled: _status != PinEntryStatus.checking, onDigit: _digit, onDelete: _delete),
        ],
      ),
    );
  }
}
