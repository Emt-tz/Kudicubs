/// The six 7–9 screens as plain widgets (state lives in the player). Looks follow design/canvas/*.dc.html.
library;

import 'package:flutter/material.dart';

import '../../core/data/models.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import '../missions_4_6/common.dart';
import '../missions_4_6/saver.dart';
import 'content.dart';
import 'logic.dart';

const double _btn = 68;

Widget _line(String l, String r, {double size = 17}) => Row(
  mainAxisAlignment: MainAxisAlignment.spaceBetween,
  children: [
    Flexible(child: Text(l, style: body(size))),
    const SizedBox(width: 8),
    Text(r, style: body(size, weight: 800)),
  ],
);

Widget _card(List<Widget> rows, {Color fill = Kc.white, double radius = 20}) =>
    Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      decoration: kBox(fill, radius: radius),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var i = 0; i < rows.length; i++) ...[
            if (i > 0) const SizedBox(height: 10),
            rows[i],
          ],
        ],
      ),
    );

Widget _meter(double value) => ClipRRect(
  borderRadius: BorderRadius.circular(Kc.rPill),
  child: Container(
    height: 14,
    color: Kc.creamShade,
    alignment: Alignment.centerLeft,
    child: FractionallySizedBox(
      widthFactor: value.clamp(0.0, 1.0),
      child: Container(color: Kc.orange),
    ),
  ),
);

/// ms-10: mission intro.
class Intro79 extends StatelessWidget {
  const Intro79({
    super.key,
    required this.region,
    required this.onStart,
    required this.onBack,
    this.banner,
  });
  final Region region;
  final VoidCallback onStart;
  final VoidCallback onBack;
  final Widget? banner;

  @override
  Widget build(BuildContext context) => MissionFrame(
    banner: banner,
    padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            BackButtonCircle(onTap: onBack),
            const SizedBox(width: 10),
            const Expanded(child: WorldLabel(partyWorld, size: 13)),
          ],
        ),
        Expanded(
          child: CenterScroll(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const KudiImage(KudiPose.thumbsUp, width: 210),
                const SizedBox(height: 14),
                Text(
                  partyTitle,
                  style: display(38),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 310),
                  child: Text(
                    "Kofi's party is on Saturday. You have a budget to plan it. Choose what to buy and stay within your coins.",
                    style: body(19, height: 1.4),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
          decoration: kBox(Kc.white, radius: 20),
          child: Column(
            children: [
              _line('Your budget', money(region, partyBudget)),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('You will learn', style: body(16, color: Kc.brown80)),
                  Flexible(
                    child: Text(
                      'Budgets and choices',
                      style: body(16, color: Kc.brown80),
                      textAlign: TextAlign.end,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Reward', style: body(16, color: Kc.brown80)),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      '$partyCoins coins · $partyXp XP',
                      style: body(16, color: Kc.brown80),
                      textAlign: TextAlign.end,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        PrimaryButton(
          label: 'Start planning',
          onPressed: onStart,
          height: _btn,
        ),
      ],
    ),
  );
}

/// app-10: pick what to buy.
class Decision79 extends StatelessWidget {
  const Decision79({
    super.key,
    required this.machine,
    required this.region,
    required this.onToggle,
    required this.onConfirm,
    required this.onBack,
    this.banner,
  });
  final PartyMachine machine;
  final Region region;
  final ValueChanged<String> onToggle;
  final VoidCallback onConfirm;
  final VoidCallback onBack;
  final Widget? banner;

  Widget _icon(String id) => switch (id) {
    'balloons' => Container(
      width: 52,
      height: 52,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        color: Kc.orange,
        border: Border.fromBorderSide(BorderSide(color: Kc.brown, width: 3)),
      ),
    ),
    'games' => Container(
      width: 52,
      height: 52,
      decoration: kBox(Kc.peach, radius: 14, width: 3),
    ),
    'speaker' => Container(
      width: 52,
      height: 52,
      decoration: kBox(Kc.softGold, radius: 14, width: 3),
    ),
    _ => Container(
      width: 52,
      height: 52,
      decoration: kBox(Kc.white, radius: 14, width: 3),
    ),
  };

  @override
  Widget build(BuildContext context) {
    final total = machine.total;
    return MissionFrame(
      banner: banner,
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              BackButtonCircle(onTap: onBack),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const WorldLabel(partyWorld, size: 13),
                    Text(partyTitle, style: display(26).copyWith(height: 1.1)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
            decoration: kBox(Kc.white),
            child: Row(
              children: [
                const KudiImage(KudiPose.wave, width: 64),
                const SizedBox(width: 12),
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      style: body(17, height: 1.35),
                      children: [
                        const TextSpan(text: 'You have '),
                        TextSpan(
                          text: money(region, partyBudget),
                          style: body(17, weight: 800),
                        ),
                        const TextSpan(
                          text: " for Kofi's party. Pick what to buy.",
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.only(bottom: 6),
              itemCount: partyItems.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, i) {
                final item = partyItems[i];
                final on = machine.selected.contains(item.id);
                return Semantics(
                  button: true,
                  selected: on,
                  label:
                      '${item.name}, ${money(region, item.cost)}${on ? ', chosen' : ''}',
                  excludeSemantics: true,
                  child: GestureDetector(
                    key: ValueKey('item-${item.id}'),
                    behavior: HitTestBehavior.opaque,
                    onTap: () => onToggle(item.id),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 88),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration:
                          kBox(
                            on ? Kc.softGold : Kc.white,
                            radius: 22,
                            width: on ? 4 : 3,
                          ).copyWith(
                            boxShadow: on
                                ? const [
                                    BoxShadow(
                                      color: Kc.brown,
                                      offset: Offset(0, 4),
                                    ),
                                  ]
                                : null,
                          ),
                      child: Row(
                        children: [
                          _icon(item.id),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  item.name,
                                  style: display(22).copyWith(height: 1.1),
                                ),
                                Text(
                                  item.sub,
                                  style: body(14, color: Kc.brown80),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            money(region, item.cost),
                            style: display(22).copyWith(height: 1.1),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            decoration: kBox(Kc.white),
            child: Column(
              children: [
                _line(
                  'Spent so far',
                  '${money(region, total)} of $partyBudget',
                  size: 17,
                ),
                const SizedBox(height: 8),
                _meter(total / partyBudget),
              ],
            ),
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: 'Confirm my party',
            onPressed: machine.selected.isEmpty ? null : onConfirm,
            height: _btn,
          ),
        ],
      ),
    );
  }
}

List<Widget> _itemRows(PartyMachine m, Region r) => [
  for (final i in m.chosen) _line(i.name, money(r, i.cost)),
];

/// ms-11: in budget.
class Success79 extends StatelessWidget {
  const Success79({
    super.key,
    required this.machine,
    required this.region,
    required this.onContinue,
    this.banner,
  });
  final PartyMachine machine;
  final Region region;
  final VoidCallback onContinue;
  final Widget? banner;

  @override
  Widget build(BuildContext context) {
    final plan = machine.reward;
    final names = joinNames([for (final i in machine.chosen) i.short]);
    return MissionFrame(
      banner: banner,
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
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
                      const Art(kCheckSvg, width: 40, height: 40),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Party planned!',
                          style: display(28).copyWith(height: 1.1),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  KudiBubble(
                    'Everyone had $names, and you stayed in budget.',
                    pose: KudiPose.celebrate,
                    kudiWidth: 110,
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                    decoration: kBox(Kc.white, radius: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        for (final w in _itemRows(machine, region)) ...[
                          w,
                          const SizedBox(height: 10),
                        ],
                        Container(height: 2, color: Kc.brown),
                        const SizedBox(height: 10),
                        _line(
                          'Spent',
                          '${money(region, machine.total)} of $partyBudget',
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Flexible(
                              child: Text(
                                'Left over',
                                style: display(24).copyWith(height: 1.1),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              money(region, machine.left),
                              style: display(24).copyWith(height: 1.1),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: kBox(Kc.softGold),
                    child: Row(
                      children: [
                        const CoinDisc(size: 36, border: 2),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            plan.coins > 0
                                ? 'You earned ${plan.coins} coins and ${plan.xp} XP'
                                : 'You earned ${plan.xp} XP',
                            style: body(18, weight: 800),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          PrimaryButton(label: 'Continue', onPressed: onContinue, height: _btn),
        ],
      ),
    );
  }
}

/// ms-12: over budget, try again. Everything earned is safe.
class Retry79 extends StatelessWidget {
  const Retry79({
    super.key,
    required this.machine,
    required this.region,
    required this.onTryAgain,
    required this.onKeep,
    required this.onBack,
    this.banner,
  });
  final PartyMachine machine;
  final Region region;
  final VoidCallback onTryAgain;
  final VoidCallback onKeep;
  final VoidCallback onBack;
  final Widget? banner;

  @override
  Widget build(BuildContext context) => MissionFrame(
    banner: banner,
    padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
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
                    BackButtonCircle(onTap: onBack),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Here is what happened',
                        style: display(26).copyWith(height: 1.1),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                KudiBubble(
                  'Your list came to ${money(region, machine.total)}. That is ${money(region, machine.overBy)} more than your budget.',
                  fontSize: 18,
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                  decoration: kBox(Kc.white, radius: 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      for (final w in _itemRows(machine, region)) ...[
                        w,
                        const SizedBox(height: 10),
                      ],
                      Container(height: 2, color: Kc.brown),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Text(
                              'Total vs budget',
                              style: display(22).copyWith(height: 1.1),
                            ),
                          ),
                          Text(
                            '${machine.total} / $partyBudget',
                            style: display(22).copyWith(height: 1.1),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      _meter(machine.total / partyBudget),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
                  decoration: kBox(Kc.peach),
                  child: Text(
                    'A budget is the most you can spend. Try swapping one item for something cheaper.',
                    style: body(17, height: 1.4),
                  ),
                ),
                const SizedBox(height: 14),
                Row(
                  children: [
                    const Art(kCheckSvg, width: 26, height: 26),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Your coins, XP and badges are safe.',
                        style: body(16, weight: 800, color: Kc.success),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        PrimaryButton(label: 'Try again', onPressed: onTryAgain, height: _btn),
        const SizedBox(height: 4),
        SecondaryButton(label: 'Keep this result', onPressed: onKeep),
      ],
    ),
  );
}

/// ms-13: round summary.
class Summary79 extends StatelessWidget {
  const Summary79({
    super.key,
    required this.machine,
    required this.region,
    required this.onCollect,
    this.busy = false,
    this.banner,
  });
  final PartyMachine machine;
  final Region region;
  final VoidCallback onCollect;
  final bool busy;
  final Widget? banner;

  Widget _tile(String big, String small) => Container(
    padding: const EdgeInsets.all(12),
    decoration: kBox(Kc.softGold),
    child: Column(
      children: [
        Text(big, style: display(28).copyWith(height: 1.1)),
        Text(small, style: body(15, weight: 800)),
      ],
    ),
  );

  @override
  Widget build(BuildContext context) {
    final plan = machine.reward;
    final over = machine.overBy > 0;
    return MissionFrame(
      banner: banner,
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const WorldLabel(partyWorld, size: 13),
                  const SizedBox(height: 6),
                  Text(
                    'Round summary',
                    style: display(32).copyWith(height: 1.1),
                  ),
                  const SizedBox(height: 14),
                  KudiBubble(
                    over
                        ? 'Good try! You learned that a budget is a limit you choose to stay inside.'
                        : 'Nice planning! You learned that a budget is a limit you choose to stay inside.',
                    pose: KudiPose.thumbsUp,
                    kudiWidth: 96,
                  ),
                  const SizedBox(height: 14),
                  _card([
                    _line('Budget', money(region, partyBudget)),
                    _line('Spent', money(region, machine.total)),
                    _line(
                      over ? 'Over budget by' : 'Left over',
                      money(region, over ? machine.overBy : machine.left),
                    ),
                    _line('Tries', '${machine.tries}'),
                  ]),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      if (plan.coins > 0) ...[
                        Expanded(child: _tile('+${plan.coins}', 'coins')),
                        const SizedBox(width: 12),
                      ],
                      Expanded(child: _tile('+${plan.xp}', 'XP')),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    decoration: kBox(Kc.peach),
                    child: Text.rich(
                      TextSpan(
                        style: body(16, height: 1.4),
                        children: [
                          TextSpan(
                            text: 'Skill growing:',
                            style: body(16, weight: 800, height: 1.4),
                          ),
                          const TextSpan(
                            text:
                                ' Decide. You compared prices and picked what mattered most.',
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: 'Collect my reward',
            onPressed: busy ? null : onCollect,
            height: _btn,
          ),
        ],
      ),
    );
  }
}

/// ms-14: the result could not be saved yet. Progress stays on the device.
class SavingError79 extends StatelessWidget {
  const SavingError79({
    super.key,
    required this.plan,
    required this.onRetry,
    required this.onHome,
    this.offline = false,
    this.busy = false,
  });
  final RewardPlan plan;
  final bool offline;
  final bool busy;
  final VoidCallback onRetry;
  final VoidCallback onHome;

  @override
  Widget build(BuildContext context) {
    final waiting = plan.coins > 0
        ? 'Your ${plan.coins} coins and ${plan.xp} XP are waiting.'
        : 'Your ${plan.xp} XP is waiting.';
    return MissionFrame(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const WorldLabel(partyWorld, size: 13),
                  const SizedBox(height: 6),
                  Text(
                    'Round summary',
                    style: display(32).copyWith(height: 1.1),
                  ),
                  const SizedBox(height: 16),
                  if (offline) ...[
                    const OfflineStrip(),
                    const SizedBox(height: 16),
                  ],
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: kBox(Kc.peach),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Art(kAlertSvg, width: 40, height: 40),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'We could not save your result.',
                                style: display(22).copyWith(height: 1.15),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Your party plan is kept on this phone. Tap try again when you are back online and we will add your coins and XP.',
                          style: body(17, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  KudiBubble(
                    'Nothing is lost. $waiting',
                    kudiWidth: 90,
                    fontSize: 17,
                    weight: 700,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          PrimaryButton(
            label: 'Try again',
            onPressed: busy ? null : onRetry,
            height: _btn,
          ),
          UnderlineLink('Back to home', onTap: onHome),
        ],
      ),
    );
  }
}
