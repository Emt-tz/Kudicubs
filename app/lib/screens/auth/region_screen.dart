import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'auth_state.dart';
import 'auth_widgets.dart';

const _examples = {
  Region.gh: 'Cedi coins · kelewele, sobolo',
  Region.ng: 'Naira coins · puff-puff, zobo',
  Region.uk: 'Pound coins · biscuit, lemonade',
};

/// au-04: the parent picks the family's country. The choice is saved to the account after sign-up.
class RegionScreen extends ConsumerWidget {
  const RegionScreen({super.key, this.demo = ScreenState.normal});

  final ScreenState demo;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = ref.watch(authFlowProvider.select((s) => s.region));
    return KeyedSubtree(
      key: const Key('screen-au-04-region'),
      child: AuthPage(
        step: 'Parent setup · Step 4 of 6',
        title: 'Where does your family live?',
        intro: 'We use local coins and everyday examples your child will recognise. You can change this later.',
        banner: demoBanner(demo),
        bottom: PrimaryButton(label: 'Next', height: 64, onPressed: () => context.go('/email')),
        children: [
          Semantics(
            container: true,
            label: 'Region',
            child: Column(children: [
              for (final r in Region.values) ...[
                _RegionTile(region: r, selected: r == selected, onTap: () => ref.read(authFlowProvider.notifier).setRegion(r)),
                const SizedBox(height: Kc.s3),
              ],
            ]),
          ),
          Text('Coins are pretend. They are not real money.', style: AuthText.small),
        ],
      ),
    );
  }
}

class _RegionTile extends StatelessWidget {
  const _RegionTile({required this.region, required this.selected, required this.onTap});

  final Region region;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        selected: selected,
        label: '${region.label}, ${_examples[region]}',
        excludeSemantics: true,
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: onTap,
          child: Container(
            constraints: const BoxConstraints(minHeight: 84),
            padding: const EdgeInsets.symmetric(horizontal: Kc.s4, vertical: Kc.s3),
            decoration: BoxDecoration(
              color: selected ? Kc.yellow.withValues(alpha: 0.16) : Colors.transparent,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: selected ? Kc.yellow : Kc.white.withValues(alpha: 0.35), width: selected ? 3 : 2),
            ),
            child: Row(children: [
              Container(
                width: 48,
                height: 48,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: Kc.gold, shape: BoxShape.circle, border: Border.all(color: Kc.cream, width: 3)),
                child: Text(region.symbol, style: KcText.label.copyWith(fontSize: region == Region.gh ? 16 : 22, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(region.label, style: KcText.label.copyWith(color: Kc.cream, fontSize: 19, fontWeight: FontWeight.w800)),
                  Text(_examples[region]!, style: KcText.caption.copyWith(color: Kc.softGold, fontSize: 15)),
                ]),
              ),
              if (selected) const Icon(Icons.check_rounded, color: Kc.yellow, size: 28),
            ]),
          ),
        ),
      );
}
