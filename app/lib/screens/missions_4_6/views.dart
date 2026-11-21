/// The twelve 4–6 screens as plain widgets (state lives in the player). Looks follow design/canvas/*.dc.html.
library;

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../core/data/models.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'common.dart';
import 'content.dart';
import 'logic.dart';
import 'saver.dart';

Color jarColor(Jar j) => switch (j) {
  Jar.small => const Color(0xFFD79A5E),
  Jar.gold => Kc.gold,
  Jar.silver => const Color(0xFFD8D2C8),
};

Color jarEdge(Jar j) => j == Jar.silver ? const Color(0xFFA79E90) : Kc.brown;

String coinLabel(Region r, Jar j) {
  final l = coinLabels(r);
  return switch (j) {
    Jar.small => l.small,
    Jar.gold => l.gold,
    Jar.silver => l.silver,
  };
}

Widget _stall(
  double l,
  double? t,
  double w,
  double h,
  Color c, {
  double? r,
  double? bottom,
}) => Positioned(
  left: r == null ? l : null,
  right: r,
  top: t,
  bottom: bottom,
  child: Container(
    width: w,
    height: h,
    decoration: BoxDecoration(
      color: c,
      border: Border.all(color: Kc.brown, width: 3),
      borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
    ),
  ),
);

/// The market card of the intro (320 x 200).
class _MarketCard extends StatelessWidget {
  const _MarketCard();

  @override
  Widget build(BuildContext context) => Container(
    width: 320,
    height: 200,
    decoration: kBox(Kc.peach, radius: 28, width: 3),
    clipBehavior: Clip.antiAlias,
    child: Stack(
      children: [
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: 60,
          child: Container(color: Kc.orange),
        ),
        _stall(28, null, 80, 70, Kc.white, bottom: 48),
        _stall(128, null, 80, 90, Kc.softGold, bottom: 48),
        _stall(0, null, 70, 60, Kc.white, r: 28, bottom: 48),
        Positioned(right: 62, top: 26, child: const CoinDisc(size: 36)),
      ],
    ),
  );
}

/// app-06: Mission intro.
class IntroView46 extends StatelessWidget {
  const IntroView46({
    super.key,
    required this.onStart,
    required this.onBack,
    this.banner,
  });
  final VoidCallback onStart;
  final VoidCallback onBack;
  final Widget? banner;

  @override
  Widget build(BuildContext context) => MissionFrame(
    banner: banner,
    padding: const EdgeInsets.fromLTRB(24, 10, 24, 16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            BackButtonCircle(onTap: onBack),
            const SizedBox(width: 10),
            const Expanded(child: WorldLabel(lostCoinsWorld)),
          ],
        ),
        Expanded(
          child: CenterScroll(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const _MarketCard(),
                Transform.translate(
                  offset: const Offset(0, -34),
                  child: const KudiImage(KudiPose.headphones, width: 150),
                ),
                Transform.translate(
                  offset: const Offset(0, -34),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        lostCoinsTitle,
                        style: display(38),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 300),
                        child: Text(
                          "Some coins are hiding at the market. Let's find them together!",
                          style: body(20, color: Kc.brown80),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        PrimaryButton(label: "Let's go!", onPressed: onStart),
      ],
    ),
  );
}

/// ms-07: played before.
class ReplayView46 extends StatelessWidget {
  const ReplayView46({
    super.key,
    required this.onPlay,
    required this.onNotNow,
    this.banner,
  });
  final VoidCallback onPlay;
  final VoidCallback onNotNow;
  final Widget? banner;

  @override
  Widget build(BuildContext context) => MissionFrame(
    banner: banner,
    padding: const EdgeInsets.fromLTRB(24, 10, 24, 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: CenterScroll(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'MISSION PLAYED BEFORE',
                  style: body(
                    16,
                    weight: 800,
                    color: Kc.brown80,
                  ).copyWith(letterSpacing: 1),
                ),
                const SizedBox(height: 16),
                const KudiImage(KudiPose.fist, width: 210),
                const SizedBox(height: 16),
                Text(
                  'Play The Lost Coins again?',
                  style: display(36),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 310),
                  child: Text(
                    'You can try different choices this time. Everything you earned stays yours.',
                    style: body(20),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 8,
                      ),
                      decoration: kBox(Kc.softGold, radius: Kc.rPill),
                      child: Text(
                        '+$replayXp XP',
                        style: display(22).copyWith(height: 1.1),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 8,
                      ),
                      decoration: kBox(Kc.white, radius: Kc.rPill),
                      child: Text(
                        'About 3 minutes',
                        style: body(18, weight: 800),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        PrimaryButton(label: 'Play again', onPressed: onPlay),
        UnderlineLink('Not now', onTap: onNotNow),
      ],
    ),
  );
}

class _DashedCircle extends CustomPainter {
  const _DashedCircle();

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = Kc.brown
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3;
    final r = (size.width - 3) / 2;
    final c = size.center(Offset.zero);
    const dashes = 14;
    for (var i = 0; i < dashes; i++) {
      final a = 2 * math.pi * i / dashes;
      canvas.drawArc(
        Rect.fromCircle(center: c, radius: r),
        a,
        math.pi / dashes,
        false,
        p,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

/// app-07 (find) and ms-01 (find with a hint).
class FindView46 extends StatelessWidget {
  const FindView46({
    super.key,
    required this.found,
    required this.hint,
    required this.onSpot,
    required this.onLeave,
    this.banner,
  });

  final Set<int> found;
  final bool hint;
  final ValueChanged<int> onSpot;
  final VoidCallback onLeave;
  final Widget? banner;

  @override
  Widget build(BuildContext context) {
    final hinted = hint
        ? List.generate(
            hiddenCoins,
            (i) => i,
          ).where((i) => !found.contains(i)).firstOrNull
        : null;
    final counter = '${found.length} / $hiddenCoins';
    return MissionFrame(
      banner: banner,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              hint
                  ? LeaveButtonCircle(onTap: onLeave)
                  : BackButtonCircle(onTap: onLeave),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Find the coins',
                  style: display(hint ? 28 : 26).copyWith(height: 1.1),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              CounterPill(counter, coin: !hint),
            ],
          ),
          const SizedBox(height: 14),
          KudiBubble(
            hint && hinted != null
                ? 'Psst! There is a coin behind the basket.'
                : 'Tap the shiny spots to find coins!',
            kudiWidth: hint ? 84 : 72,
            fontSize: 18,
          ),
          const SizedBox(height: 14),
          Expanded(
            child: Container(
              decoration: kBox(Kc.peach, radius: 28, width: 3),
              clipBehavior: Clip.antiAlias,
              child: LayoutBuilder(
                builder: (context, box) {
                  final w = box.maxWidth, h = box.maxHeight;
                  const s = 64.0;
                  final children = <Widget>[
                    Positioned(
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: math.min(190, h * 0.4),
                      child: Container(color: Kc.orange),
                    ),
                    _stall(18, 60, 120, 130, Kc.white),
                    _stall(150, 30, 90, 160, Kc.softGold),
                    _stall(0, 90, 100, 100, Kc.white, r: 18),
                  ];
                  for (var i = 0; i < hiddenCoins; i++) {
                    final left = spots[i].x * (w - s - 8) + 4;
                    final top = spots[i].y * (h - s - 8) + 4;
                    if (i == hinted) {
                      // The basket the coin hides behind.
                      children.add(
                        Positioned(
                          left: left - 6,
                          top: top + 30,
                          child: Container(
                            width: 84,
                            height: 52,
                            decoration: BoxDecoration(
                              color: Kc.orange,
                              border: Border.all(color: Kc.brown, width: 3),
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(16),
                                bottom: Radius.circular(6),
                              ),
                            ),
                          ),
                        ),
                      );
                    }
                    children.add(
                      Positioned(
                        left: left,
                        top: top,
                        width: s,
                        height: s,
                        child: found.contains(i)
                            ? Semantics(
                                label: 'Coin found',
                                child: const Center(
                                  child: CoinDisc(size: 56, label: 'K'),
                                ),
                              )
                            : Semantics(
                                button: true,
                                label: 'Hiding spot',
                                excludeSemantics: true,
                                child: GestureDetector(
                                  key: ValueKey('spot-$i'),
                                  behavior: HitTestBehavior.opaque,
                                  onTap: () => onSpot(i),
                                  child: Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Kc.yellow.withValues(alpha: 0.45),
                                      boxShadow: i == hinted
                                          ? const [
                                              BoxShadow(
                                                color: Kc.softGold,
                                                spreadRadius: 6,
                                              ),
                                              BoxShadow(
                                                color: Kc.brown,
                                                spreadRadius: 9,
                                              ),
                                            ]
                                          : null,
                                    ),
                                    child: CustomPaint(
                                      painter: const _DashedCircle(),
                                    ),
                                  ),
                                ),
                              ),
                      ),
                    );
                  }
                  return Stack(children: children);
                },
              ),
            ),
          ),
          const SizedBox(height: 12),
          CoinDots(total: hiddenCoins, done: found.length, emptyBrown: hint),
        ],
      ),
    );
  }
}

/// ms-02: sort into jars.
class SortView46 extends StatelessWidget {
  const SortView46({
    super.key,
    required this.machine,
    required this.region,
    required this.selected,
    required this.message,
    required this.onSelect,
    required this.onPlace,
    required this.onLeave,
    this.banner,
  });

  final LostCoinsMachine machine;
  final Region region;
  final int? selected;
  final String? message;
  final ValueChanged<int> onSelect;
  final void Function(int coin, Jar jar) onPlace;
  final VoidCallback onLeave;
  final Widget? banner;

  Widget _coin(int i, {double size = 68}) {
    final j = coinOrder[i];
    return CoinDisc(
      size: size,
      color: jarColor(j),
      borderColor: jarEdge(j),
      label: coinLabel(region, j),
      labelSize: 17,
    );
  }

  @override
  Widget build(BuildContext context) {
    final tray = machine.tray;
    return MissionFrame(
      banner: banner,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              LeaveButtonCircle(onTap: onLeave),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Sort into jars',
                  style: display(28).copyWith(height: 1.1),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              CounterPill('${machine.placed.length} / ${coinOrder.length}'),
            ],
          ),
          const SizedBox(height: 14),
          KudiBubble(message ?? 'Put each coin in the jar that matches it.'),
          const SizedBox(height: 14),
          Container(
            height: 150,
            decoration: kBox(Kc.peach, radius: 28, width: 3),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Drag me',
                  style: body(15, weight: 800, color: Kc.brown80),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    for (final i in tray)
                      Semantics(
                        button: true,
                        label: 'Coin ${coinLabel(region, coinOrder[i])}',
                        child: GestureDetector(
                          key: ValueKey('coin-$i'),
                          onTap: () => onSelect(i),
                          child: Draggable<int>(
                            data: i,
                            feedback: Transform.scale(
                              scale: 1.1,
                              child: Material(
                                type: MaterialType.transparency,
                                child: _coin(i, size: 76),
                              ),
                            ),
                            childWhenDragging: Opacity(
                              opacity: 0.3,
                              child: _coin(i),
                            ),
                            child: Container(
                              padding: const EdgeInsets.all(4),
                              decoration: selected == i
                                  ? const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: Kc.softGold,
                                      border: Border.fromBorderSide(
                                        BorderSide(color: Kc.brown, width: 3),
                                      ),
                                    )
                                  : null,
                              child: _coin(i),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final j in Jar.values) ...[
                  if (j != Jar.small) const SizedBox(width: 12),
                  Expanded(
                    child: DragTarget<int>(
                      onWillAcceptWithDetails: (_) => true,
                      onAcceptWithDetails: (d) => onPlace(d.data, j),
                      builder: (context, candidates, _) {
                        final active =
                            selected != null || candidates.isNotEmpty;
                        final n = machine.jarCount(j);
                        return Semantics(
                          button: true,
                          label: '${jarName(j)} jar, $n coins',
                          excludeSemantics: true,
                          child: GestureDetector(
                            key: ValueKey('jar-${j.name}'),
                            behavior: HitTestBehavior.opaque,
                            onTap: selected == null
                                ? null
                                : () => onPlace(selected!, j),
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: kBox(
                                active ? Kc.softGold : Kc.white,
                                radius: 24,
                                width: active ? 4 : 3,
                                shadow: active,
                              ),
                              child: FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.bottomCenter,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (active)
                                      Text(
                                        'Drop here',
                                        style: body(
                                          14,
                                          weight: 800,
                                          color: Kc.brown80,
                                        ),
                                      ),
                                    Container(
                                      width: 28,
                                      height: 28,
                                      alignment: Alignment.center,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: Kc.brown.withValues(
                                          alpha: n == 0 ? 0.0 : 1,
                                        ),
                                      ),
                                      child: n == 0
                                          ? null
                                          : Text(
                                              '$n',
                                              style: display(
                                                16,
                                                color: Kc.cream,
                                              ).copyWith(height: 1),
                                            ),
                                    ),
                                    const SizedBox(height: 6),
                                    CoinDisc(
                                      size: 56,
                                      color: jarColor(j),
                                      borderColor: jarEdge(j),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      jarName(j),
                                      style: display(20).copyWith(height: 1.1),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// ms-03: count the gold coins.
class CountView46 extends StatelessWidget {
  const CountView46({
    super.key,
    required this.machine,
    required this.onPick,
    required this.onDone,
    required this.onLeave,
    this.banner,
  });

  final LostCoinsMachine machine;
  final ValueChanged<int> onPick;
  final VoidCallback onDone;
  final VoidCallback onLeave;
  final Widget? banner;

  @override
  Widget build(BuildContext context) {
    final picked = machine.countAnswer;
    return MissionFrame(
      banner: banner,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              LeaveButtonCircle(onTap: onLeave),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Count the coins',
                  style: display(28).copyWith(height: 1.1),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          KudiBubble(
            machine.countHelped
                ? "Let's count together: there are $goldCoins!"
                : 'How many gold coins are in the jar?',
          ),
          const SizedBox(height: 14),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    height: 190,
                    padding: const EdgeInsets.all(20),
                    decoration: kBox(Kc.white, radius: 28, width: 3),
                    child: Center(
                      child: Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 12,
                        runSpacing: 12,
                        children: [
                          for (var i = 0; i < goldCoins; i++)
                            const CoinDisc(size: 52),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      for (final row in const [
                        [3, 4, 5],
                        [6, 7, 8],
                      ]) ...[
                        Row(
                          children: [
                            for (final n in row) ...[
                              if (n != row.first) const SizedBox(width: 12),
                              Expanded(
                                child: _NumberTile(
                                  n,
                                  selected: picked == n,
                                  onTap: () => onPick(n),
                                ),
                              ),
                            ],
                          ],
                        ),
                        if (row.first == 3) const SizedBox(height: 12),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: machine.countHelped ? 'Next' : 'Done',
            onPressed: picked == null ? null : onDone,
          ),
        ],
      ),
    );
  }
}

class _NumberTile extends StatelessWidget {
  const _NumberTile(this.n, {required this.selected, required this.onTap});
  final int n;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    label: '$n',
    excludeSemantics: true,
    child: GestureDetector(
      key: ValueKey('count-$n'),
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Container(
        height: 88,
        alignment: Alignment.center,
        decoration: kBox(
          selected ? Kc.softGold : Kc.white,
          radius: 24,
          width: selected ? 4 : 3,
          shadow: selected,
        ),
        child: Text('$n', style: display(44).copyWith(height: 1)),
      ),
    ),
  );
}

/// app-08: save or spend.
class DecisionView46 extends StatelessWidget {
  const DecisionView46({
    super.key,
    required this.machine,
    required this.region,
    required this.onPick,
    required this.onChoose,
    required this.onLeave,
    this.banner,
  });

  final LostCoinsMachine machine;
  final Region region;
  final ValueChanged<Choice> onPick;
  final VoidCallback onChoose;
  final VoidCallback onLeave;
  final Widget? banner;

  Widget _card(Choice c, String title, String sub, String svg) {
    final on = machine.picked == c;
    return Semantics(
      button: true,
      selected: on,
      label: c == Choice.save
          ? 'Save the coins in the jar${on ? ', chosen' : ''}'
          : 'Spend the coins on a treat${on ? ', chosen' : ''}',
      excludeSemantics: true,
      child: GestureDetector(
        key: ValueKey('choice-${c.name}'),
        behavior: HitTestBehavior.opaque,
        onTap: () => onPick(c),
        child: Container(
          decoration: kBox(
            on ? Kc.softGold : Kc.white,
            radius: 28,
            width: on ? 4 : 3,
            shadow: on,
          ),
          padding: const EdgeInsets.all(8),
          child: Center(
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Art(svg, width: 80, height: 92),
                  const SizedBox(height: 12),
                  Text(title, style: display(26).copyWith(height: 1.1)),
                  const SizedBox(height: 6),
                  Text(
                    sub,
                    style: body(15, color: Kc.brown80),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) => MissionFrame(
    banner: banner,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            BackButtonCircle(onTap: onLeave),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'Save or spend?',
                style: display(26).copyWith(height: 1.1),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        KudiBubble(
          'You found $hiddenCoins coins! What will you do with them?',
          pose: KudiPose.thumbsUp,
        ),
        const SizedBox(height: 16),
        Expanded(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _card(
                  Choice.save,
                  'Save',
                  'Keep them for later',
                  kJarSvg,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: _card(
                  Choice.spend,
                  'Spend',
                  'Get a ${treatName(region)} treat',
                  kTreatSvg,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        PrimaryButton(
          label: 'Choose',
          onPressed: machine.picked == null ? null : onChoose,
        ),
      ],
    ),
  );
}

/// ms-04: saved.
class ResultSaveView46 extends StatelessWidget {
  const ResultSaveView46({super.key, required this.onNext, this.banner});
  final VoidCallback onNext;
  final Widget? banner;

  @override
  Widget build(BuildContext context) => MissionFrame(
    banner: banner,
    padding: const EdgeInsets.fromLTRB(24, 10, 24, 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: CenterScroll(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const KudiImage(KudiPose.thumbsUp, width: 150),
                const SizedBox(height: 16),
                Text(
                  'You saved $foundPot coins!',
                  style: display(36),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                const _JarArt(),
                const SizedBox(height: 16),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 310),
                  child: Text(
                    'Your jar is growing. Saving now means you can buy something bigger later.',
                    style: body(20),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
        PrimaryButton(label: 'Next', onPressed: onNext),
      ],
    ),
  );
}

class _JarArt extends StatelessWidget {
  const _JarArt();

  Widget _c(
    double l,
    double? bottom, {
    double? top,
    double size = 44,
    String? label,
  }) => Positioned(
    left: l,
    bottom: bottom,
    top: top,
    child: CoinDisc(size: size, label: label),
  );

  @override
  Widget build(BuildContext context) => SizedBox(
    width: 200,
    height: 230,
    child: Stack(
      children: [
        Positioned(
          left: 30,
          bottom: 0,
          child: Container(
            width: 140,
            height: 170,
            decoration: BoxDecoration(
              color: const Color(0xFFBFE0C8),
              border: Border.all(color: Kc.brown, width: 4),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(22),
                bottom: Radius.circular(36),
              ),
            ),
          ),
        ),
        Positioned(
          left: 20,
          top: 46,
          child: Container(
            width: 160,
            height: 30,
            decoration: kBox(Kc.white, radius: 14, width: 4),
          ),
        ),
        _c(62, null, top: 0, size: 60, label: 'K'),
        _c(52, 30),
        _c(100, 30),
        _c(76, 66),
      ],
    ),
  );
}

/// ms-05: spent on a treat.
class ResultSpendView46 extends StatelessWidget {
  const ResultSpendView46({
    super.key,
    required this.region,
    required this.coinsLeft,
    required this.onNext,
    this.banner,
  });
  final Region region;

  /// Coins the child has after the treat, or null when the balance is not known yet.
  final int? coinsLeft;
  final VoidCallback onNext;
  final Widget? banner;

  @override
  Widget build(BuildContext context) => MissionFrame(
    banner: banner,
    padding: const EdgeInsets.fromLTRB(24, 10, 24, 12),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Expanded(
          child: CenterScroll(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const KudiImage(KudiPose.wave, width: 150),
                const SizedBox(height: 16),
                Text(
                  'Yum! A ${treatName(region)} sticker',
                  style: display(36),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Transform.rotate(
                  angle: -4 * math.pi / 180,
                  child: Container(
                    width: 180,
                    height: 180,
                    alignment: Alignment.center,
                    decoration: kBox(
                      Kc.softGold,
                      radius: 32,
                      width: 4,
                      shadow: true,
                    ),
                    child: const Art(kStickerSvg, width: 110, height: 110),
                  ),
                ),
                const SizedBox(height: 22),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 8,
                  ),
                  decoration: kBox(Kc.white, radius: Kc.rPill),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const CoinDisc(size: 26, border: 2),
                      const SizedBox(width: 10),
                      Flexible(
                        child: Text(
                          '$treatCost coins spent',
                          style: display(24).copyWith(height: 1.1),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 310),
                  child: Text(
                    coinsLeft == null
                        ? 'Spending is fun! Next time you can save some too.'
                        : 'Spending is fun! You still have $coinsLeft coins. Next time you can save some too.',
                    style: body(20),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
        PrimaryButton(label: 'Next', onPressed: onNext),
      ],
    ),
  );
}

/// ms-06: summary.
class SummaryView46 extends StatelessWidget {
  const SummaryView46({
    super.key,
    required this.machine,
    required this.name,
    required this.onReward,
    this.busy = false,
    this.banner,
  });

  final LostCoinsMachine machine;
  final String name;
  final VoidCallback? onReward;
  final bool busy;
  final Widget? banner;

  Widget _tile(Color bg, Widget icon, int n, String label) => Container(
    padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 12),
    decoration: kBox(bg, radius: 24, width: 3),
    child: Column(
      children: [
        icon,
        const SizedBox(height: 6),
        Text('$n', style: display(38).copyWith(height: 1)),
        const SizedBox(height: 6),
        Text(label, style: body(17, weight: 800)),
      ],
    ),
  );

  Widget _row(String l, String r) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Flexible(child: Text(l, style: body(19, weight: 800))),
      const SizedBox(width: 8),
      Text(r, style: display(22).copyWith(height: 1.1)),
    ],
  );

  @override
  Widget build(BuildContext context) {
    final plan = machine.reward;
    return MissionFrame(
      banner: banner,
      padding: const EdgeInsets.fromLTRB(24, 10, 24, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      const KudiImage(KudiPose.thumbsUp, width: 92),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Great choosing, $name!',
                          style: display(32),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _tile(
                          const Color(0xFFBFE0C8),
                          Container(
                            width: 48,
                            height: 60,
                            decoration: BoxDecoration(
                              color: Kc.white,
                              border: Border.all(color: Kc.brown, width: 3),
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(10),
                                bottom: Radius.circular(18),
                              ),
                            ),
                          ),
                          machine.savedCoins,
                          'Saved',
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: _tile(
                          Kc.softGold,
                          Transform.rotate(
                            angle: -6 * math.pi / 180,
                            child: Container(
                              width: 60,
                              height: 60,
                              decoration: kBox(Kc.orange, radius: 18, width: 3),
                            ),
                          ),
                          machine.spentCoins,
                          'Spent',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: kBox(Kc.white, radius: 24),
                    child: Column(
                      children: [
                        if (plan.coins > 0) ...[
                          _row('Coins earned', '+${plan.coins}'),
                          const SizedBox(height: 10),
                        ],
                        _row('XP earned', '+${plan.xp}'),
                        if (plan.badgeId != null) ...[
                          const SizedBox(height: 10),
                          _row('New badge', rewardBadgeTitle),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'You learned how to count and sort coins. Saving and spending are both OK!',
                    style: body(19, color: Kc.brown80),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: 'Get my reward',
            onPressed: busy ? null : onReward,
          ),
        ],
      ),
    );
  }
}

/// ms-09: the play could not be saved yet (it stays on the device).
class SavingErrorView46 extends StatelessWidget {
  const SavingErrorView46({
    super.key,
    required this.plan,
    required this.onRetry,
    required this.onHome,
    this.busy = false,
    this.banner,
  });

  final RewardPlan plan;
  final VoidCallback onRetry;
  final VoidCallback onHome;
  final bool busy;
  final Widget? banner;

  @override
  Widget build(BuildContext context) {
    final waiting = plan.coins > 0
        ? '${plan.coins} coins and ${plan.xp} XP are waiting to be saved'
        : '${plan.xp} XP is waiting to be saved';
    return MissionFrame(
      banner: banner,
      padding: const EdgeInsets.fromLTRB(24, 10, 24, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: CenterScroll(
              center: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const KudiImage(KudiPose.headphones, width: 170),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 22,
                    ),
                    decoration: kBox(Kc.peach, radius: 24),
                    child: Column(
                      children: [
                        const Art(kAlertSvg, width: 44, height: 44),
                        const SizedBox(height: 12),
                        Text(
                          'We could not save your play yet',
                          style: display(28).copyWith(height: 1.1),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'No worries! Your coins and your choices are kept safe on this device.',
                          style: body(18, color: Kc.brown80),
                          textAlign: TextAlign.center,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: kBox(Kc.white),
                    child: Row(
                      children: [
                        CoinDisc(
                          size: 40,
                          border: 2,
                          label: '${plan.coins > 0 ? plan.coins : plan.xp}',
                          labelSize: 15,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            waiting,
                            style: body(17, weight: 800, height: 1.25),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          PrimaryButton(label: 'Try again', onPressed: busy ? null : onRetry),
          UnderlineLink('Back to home', onTap: onHome),
        ],
      ),
    );
  }
}
