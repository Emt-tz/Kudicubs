import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/providers.dart';
import '../../core/theme/theme.dart';
import 'onboarding_state.dart';
import 'onboarding_views.dart' show currentPath;

/// Which designed variant a gallery builder forces. `null` = the real flow.
enum GateVariant { hold, question, wrong, locked }

TextStyle get _caps => KcText.label.copyWith(
  fontSize: 15,
  letterSpacing: 0.6,
  color: Kc.softGold,
  fontVariations: const [FontVariation('wght', 800)],
);

TextStyle get _title =>
    KcText.displayXl.copyWith(fontSize: 34, color: Kc.cream);

TextStyle get _para => KcText.body.copyWith(color: Kc.cream);

/// The grown-up gate: press and hold, maths question, wrong answer and lock-out.
/// One [GateMachine] drives all four designs. With [variant] the machine is
/// local and forced into that design; without it the app-wide machine is used
/// and passing the gate continues to `/pin/create`.
class GateView extends ConsumerStatefulWidget {
  const GateView({super.key, this.variant, this.machine});

  final GateVariant? variant;

  /// Test hook: use this machine instead of the app-wide one.
  final GateMachine? machine;

  @override
  ConsumerState<GateView> createState() => _GateViewState();
}

class _GateViewState extends ConsumerState<GateView> {
  GateMachine? _local;
  Timer? _ticker;
  bool _left = false;

  late final GateMachine _machine;

  bool get _isFlow => widget.variant == null;

  @override
  void initState() {
    super.initState();
    final v = widget.variant;
    if (widget.machine != null) {
      _local = widget.machine;
    } else if (v != null) {
      final m = _local = GateMachine();
      switch (v) {
        case GateVariant.hold:
          break;
        case GateVariant.question:
          m.presetQuestion();
        case GateVariant.wrong:
          m.presetWrong();
        case GateVariant.locked:
          m.presetLocked(secondsLeft: 22);
      }
    } else {
      ref.read(gateMachineProvider).restart();
    }
    _machine = _local ?? ref.read(gateMachineProvider);
    _machine.addListener(_onChange);
    _ticker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_machine.phase == GatePhase.locked) {
        if (!_machine.tick() && mounted) setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _ticker?.cancel();
    _machine.removeListener(_onChange);
    if (_local != null && widget.machine == null) _local!.dispose();
    super.dispose();
  }

  void _onChange() {
    if (!mounted) return;
    if (_machine.phase == GatePhase.passed &&
        _isFlow &&
        !_left &&
        currentPath(context)?.startsWith('/gate') == true) {
      _left = true;
      final next = GoRouterState.of(context).uri.queryParameters['next'];
      // A family that is already set up enters its PIN; a new one creates it.
      final base = ref.read(onboardedProvider) ? '/parent-pin' : '/pin/create';
      context.go(
        next == null ? base : Uri(path: base, queryParameters: {'next': next}).toString(),
      );
    }
  }

  void _leave() {
    if (context.canPop()) {
      context.pop();
    } else {
      context.go(ref.read(onboardedProvider) ? '/home' : '/avatar');
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Kc.brown,
    appBar: AppBar(toolbarHeight: 0, primary: false, elevation: 0, scrolledUnderElevation: 0, backgroundColor: Kc.brown, systemOverlayStyle: SystemUiOverlayStyle.light),
    body: SafeArea(
      child: AnimatedBuilder(
        animation: _machine,
        builder: (context, _) => switch (_machine.phase) {
          GatePhase.hold => _HoldStep(
            key: const Key('gate-hold'),
            previewProgress: widget.variant == GateVariant.hold ? 0.6 : 0,
            onDone: _machine.holdComplete,
            onLeave: _leave,
          ),
          GatePhase.locked => _LockedStep(machine: _machine, onLeave: _leave),
          _ => _QuestionStep(machine: _machine, onLeave: _leave),
        },
      ),
    ),
  );
}

class _Frame extends StatelessWidget {
  const _Frame({required this.children, this.bottom});
  final List<Widget> children;
  final Widget? bottom;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: children,
            ),
          ),
        ),
        ?bottom,
      ],
    ),
  );
}

class _BackLink extends StatelessWidget {
  const _BackLink({required this.onTap});
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => TextButton(
    onPressed: onTap,
    style: TextButton.styleFrom(
      minimumSize: const Size(double.infinity, Kc.touchMin),
      foregroundColor: Kc.softGold,
    ),
    child: Text(
      'Back to the game',
      style: KcText.label.copyWith(
        color: Kc.softGold,
        decoration: TextDecoration.underline,
      ),
    ),
  );
}

// ---- Step 1: press and hold ------------------------------------------------------------

class _HoldStep extends StatefulWidget {
  const _HoldStep({
    super.key,
    required this.previewProgress,
    required this.onDone,
    required this.onLeave,
  });
  final double previewProgress;
  final VoidCallback onDone;
  final VoidCallback onLeave;

  @override
  State<_HoldStep> createState() => _HoldStepState();
}

class _HoldStepState extends State<_HoldStep>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(
        vsync: this,
        duration: GateMachine.holdDuration,
        value: widget.previewProgress,
      )..addStatusListener((s) {
        if (s == AnimationStatus.completed) {
          HapticFeedback.mediumImpact();
          widget.onDone();
        }
      });

  bool _holding = false;

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  void _down() {
    _holding = true;
    _c.forward(from: 0);
  }

  void _up() {
    if (!_holding || _c.isCompleted) return;
    _holding = false;
    _c.animateBack(0, duration: const Duration(milliseconds: 250));
  }

  @override
  Widget build(BuildContext context) => _Frame(
    bottom: _BackLink(onTap: widget.onLeave),
    children: [
      Text('For grown-ups · Step 1 of 3', style: _caps),
      const SizedBox(height: 18),
      Text('Grown-ups, press and hold', style: _title),
      const SizedBox(height: 18),
      Text(
        'Hold the button for 3 seconds to continue. This keeps the parent area for adults.',
        style: _para,
      ),
      const SizedBox(height: 36),
      Center(
        child: AnimatedBuilder(
          animation: _c,
          builder: (context, _) {
            final secondsLeft =
                (GateMachine.holdDuration.inSeconds * (1 - _c.value)).ceil();
            return Column(
              children: [
                SizedBox(
                  width: 220,
                  height: 220,
                  child: CustomPaint(
                    painter: _RingPainter(
                      progress: _c.value,
                      color: Kc.yellow,
                      stroke: 16,
                    ),
                    child: Center(
                      child: Semantics(
                        button: true,
                        label: 'Hold for 3 seconds',
                        child: Listener(
                          onPointerDown: (_) => _down(),
                          onPointerUp: (_) => _up(),
                          onPointerCancel: (_) => _up(),
                          child: Container(
                            key: const Key('gate-hold-button'),
                            width: 160,
                            height: 160,
                            alignment: Alignment.center,
                            decoration: const BoxDecoration(
                              color: Kc.yellow,
                              shape: BoxShape.circle,
                            ),
                            child: Text(
                              'Hold',
                              style: KcText.headline.copyWith(fontSize: 28),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  _c.value == 0
                      ? 'Press and hold the button'
                      : 'Keep holding... $secondsLeft ${secondsLeft == 1 ? 'second' : 'seconds'}',
                  style: KcText.label.copyWith(
                    fontSize: 20,
                    color: Kc.cream,
                    fontVariations: const [FontVariation('wght', 800)],
                  ),
                ),
              ],
            );
          },
        ),
      ),
    ],
  );
}

class _RingPainter extends CustomPainter {
  const _RingPainter({
    required this.progress,
    required this.color,
    required this.stroke,
  });
  final double progress;
  final Color color;
  final double stroke;

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final r = Rect.fromCircle(
      center: rect.center,
      radius: size.width / 2 - stroke / 2 - 2,
    );
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = Colors.white.withValues(alpha: 0.16);
    final arc = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..strokeCap = StrokeCap.round
      ..color = color;
    canvas.drawCircle(r.center, r.width / 2, track);
    if (progress > 0) {
      canvas.drawArc(
        r,
        -math.pi / 2,
        2 * math.pi * progress.clamp(0, 1),
        false,
        arc,
      );
    }
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress || old.color != color;
}

// ---- Step 2: maths question (and the wrong-answer variant) -------------------------------

class _QuestionStep extends StatelessWidget {
  const _QuestionStep({required this.machine, required this.onLeave});
  final GateMachine machine;
  final VoidCallback onLeave;

  @override
  Widget build(BuildContext context) {
    final wrong = machine.showWrong;
    final left = machine.triesLeft;
    final keyH = wrong ? 60.0 : 64.0;
    return _Frame(
      bottom: _BackLink(onTap: onLeave),
      children: [
        Text('For grown-ups · Step 2 of 3', style: _caps),
        const SizedBox(height: 16),
        Text('Quick check, please', style: _title),
        const SizedBox(height: 16),
        if (wrong)
          Semantics(
            liveRegion: true,
            child: Container(
              key: const Key('gate-wrong'),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Kc.peach,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Kc.softGold, width: 2),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.error_outline_rounded,
                    color: Kc.brown,
                    size: 26,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Not quite. Here is a new question.',
                          style: KcText.label.copyWith(
                            fontSize: 17,
                            fontVariations: const [FontVariation('wght', 800)],
                          ),
                        ),
                        Text(
                          'You have $left ${left == 1 ? 'try' : 'tries'} left before a short wait.',
                          style: KcText.label.copyWith(
                            fontSize: 15,
                            fontVariations: const [FontVariation('wght', 400)],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          Text(
            'This keeps the parent area for grown-ups. Answer the question to continue.',
            style: _para,
          ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            children: [
              Text(
                machine.questionText,
                key: const Key('gate-question'),
                style: KcText.label.copyWith(color: Kc.softGold),
              ),
              const SizedBox(height: 6),
              Container(
                constraints: const BoxConstraints(minHeight: 72),
                alignment: Alignment.center,
                child: Text(
                  machine.entry,
                  key: const Key('gate-entry'),
                  style: KcText.displayXl.copyWith(
                    fontSize: 56,
                    letterSpacing: 11,
                    color: Kc.cream,
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        _Keypad(machine: machine, keyHeight: keyH),
      ],
    );
  }
}

class _Keypad extends StatelessWidget {
  const _Keypad({required this.machine, required this.keyHeight});
  final GateMachine machine;
  final double keyHeight;

  Widget _key(
    String label,
    VoidCallback onTap, {
    Color? fill,
    Color? fg,
    double font = 28,
    bool bold = false,
    String? semantics,
  }) => Semantics(
    button: true,
    label: semantics ?? label,
    excludeSemantics: true,
    child: Material(
      color: fill ?? Colors.white.withValues(alpha: 0.14),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          HapticFeedback.selectionClick();
          onTap();
        },
        child: SizedBox(
          height: keyHeight,
          child: Center(
            child: Text(
              label,
              style: (bold ? KcText.headline : KcText.title).copyWith(
                fontSize: font,
                color: fg ?? Kc.cream,
                height: 1.1,
              ),
            ),
          ),
        ),
      ),
    ),
  );

  @override
  Widget build(BuildContext context) {
    Widget digit(String d) => _key(d, () => machine.digit(d));
    final keys = <Widget>[
      for (final d in ['1', '2', '3', '4', '5', '6', '7', '8', '9']) digit(d),
      _key(
        'Delete',
        machine.delete,
        fill: Colors.white.withValues(alpha: 0.07),
        font: 20,
      ),
      digit('0'),
      _key(
        'Check',
        machine.check,
        fill: Kc.yellow,
        fg: Kc.brown,
        font: 20,
        bold: true,
      ),
    ];
    return Column(
      children: [
        for (var r = 0; r < 4; r++) ...[
          if (r > 0) const SizedBox(height: 12),
          Row(
            children: [
              for (var c = 0; c < 3; c++) ...[
                if (c > 0) const SizedBox(width: 12),
                Expanded(child: keys[r * 3 + c]),
              ],
            ],
          ),
        ],
      ],
    );
  }
}

// ---- Locked: wait 60 s and retry ----------------------------------------------------------

class _LockedStep extends StatelessWidget {
  const _LockedStep({required this.machine, required this.onLeave});
  final GateMachine machine;
  final VoidCallback onLeave;

  static String _mmss(int s) =>
      '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final left = machine.lockSecondsLeft;
    final progress = left / GateMachine.lockDuration.inSeconds;
    return _Frame(
      bottom: Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: SizedBox(
          height: 60,
          child: Material(
            color: Kc.yellow,
            borderRadius: BorderRadius.circular(Kc.rPill),
            child: InkWell(
              borderRadius: BorderRadius.circular(Kc.rPill),
              onTap: onLeave,
              child: Center(
                child: Text(
                  'Back to the game',
                  style: KcText.buttonSmall.copyWith(fontSize: 22),
                ),
              ),
            ),
          ),
        ),
      ),
      children: [
        Text('For grown-ups', style: _caps),
        const SizedBox(height: 18),
        Text("Let's take a short break", style: _title),
        const SizedBox(height: 18),
        Text(
          'The grown-up gate is paused for a moment after a few tries. Nothing has been lost.',
          style: _para,
        ),
        const SizedBox(height: 28),
        Center(
          child: SizedBox(
            width: 200,
            height: 200,
            child: CustomPaint(
              painter: _RingPainter(
                progress: progress,
                color: Kc.softGold,
                stroke: 14,
              ),
              child: Center(
                child: Semantics(
                  liveRegion: false,
                  label: '$left seconds until you can try again',
                  excludeSemantics: true,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _mmss(left),
                        key: const Key('gate-countdown'),
                        style: KcText.displayXl.copyWith(
                          fontSize: 56,
                          height: 1,
                          color: Kc.cream,
                        ),
                      ),
                      Text(
                        'until you can try again',
                        style: KcText.label.copyWith(
                          fontSize: 15,
                          color: Kc.softGold,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),
        Center(
          child: Container(
            constraints: const BoxConstraints(maxWidth: 320),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.info_outline_rounded,
                  color: Kc.softGold,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    "Your child's coins, badges and progress are safe. Only the grown-up area waits.",
                    style: KcText.label.copyWith(
                      fontSize: 16,
                      color: Kc.cream,
                      fontVariations: const [FontVariation('wght', 400)],
                      height: 1.4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
