// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

/// Canvas `pa-08-region`: change a child's country. Only how money looks changes.
Widget build_pa_08_region(BuildContext context, ScreenState state) =>
    CountryView(key: const Key('screen-pa-08-region'), state: state);

class CountryView extends ConsumerStatefulWidget {
  const CountryView({super.key, this.childId, this.state = ScreenState.normal});

  /// Child to change; null = the child who is playing.
  final String? childId;
  final ScreenState state;

  @override
  ConsumerState<CountryView> createState() => _CountryViewState();
}

class _CountryViewState extends ConsumerState<CountryView> {
  Region? _picked;
  bool _saving = false;
  String? _error;

  static const _flag = {
    Region.gh: (Kc.gold, Kc.brown),
    Region.ng: (Color(0xFFD8D2C8), Color(0xFFA79E90)),
    Region.uk: (Color(0xFFD79A5E), Color(0xFFA86B34)),
  };

  Future<void> _save(Child c) async {
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(childrenProvider.notifier).edit(c.copyWith(region: _picked));
      if (mounted) goBackOr(context, '/parent/settings');
    } catch (_) {
      if (mounted) setState(() => _error = 'Nothing was saved. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final kids = ref.watch(childrenProvider);
    if (widget.state == ScreenState.loading || (kids.isLoading && !kids.hasValue)) {
      return const ParentPage(scroll: false, child: ParentMessage(title: 'Getting things ready...'));
    }
    final list = kids.value ?? const <Child>[];
    final c = list.where((x) => x.id == widget.childId).firstOrNull ?? ref.watch(currentChildProvider).value;
    if (c == null || kids.hasError || widget.state == ScreenState.error || widget.state == ScreenState.offline) {
      return ParentPage(
        scroll: false,
        child: ParentMessage(
          title: c == null && !kids.hasError ? 'No child yet' : 'Oops!',
          message: c == null && !kids.hasError
              ? 'Add a child first.'
              : 'We could not load this. Nothing has been lost.',
          actionLabel: 'Back',
          onAction: () => goBackOr(context, '/parent/settings'),
        ),
      );
    }
    final selected = _picked ?? c.region;
    return ParentPage(
      bottom: ParentPrimary('Save country', onPressed: _saving || selected == c.region ? null : () => _save(c)),
      child: Gap(
        gap: 14,
        children: [
          BackLink('Settings', onTap: () => goBackOr(context, '/parent/settings')),
          Text('Country', style: PT.display(32)),
          Text('Coins and market examples follow where your family lives.', style: PT.body(16)),
          if (_error != null) ParentAlert(title: 'Not saved.', message: _error!),
          for (final r in Region.values)
            _RegionCard(region: r, selected: selected == r, flag: _flag[r]!, onTap: () => setState(() => _picked = r)),
          InfoStrip('Only how money looks changes. ${c.nickname} keeps every coin, badge and level.'),
        ],
      ),
    );
  }
}

class _RegionCard extends StatelessWidget {
  const _RegionCard({required this.region, required this.selected, required this.flag, required this.onTap});
  final Region region;
  final bool selected;
  final (Color, Color) flag;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final fg = selected ? Kc.brown : Kc.cream;
    return Semantics(
      button: true,
      selected: selected,
      label: region.label,
      excludeSemantics: true,
      child: Material(
        color: selected ? Kc.softGold : Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: Kc.softGold, width: selected ? 3 : 2),
        ),
        child: InkWell(
          key: Key('country-${region.db}'),
          customBorder: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          onTap: onTap,
          child: Container(
            constraints: const BoxConstraints(minHeight: 76),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: flag.$1,
                    border: Border.all(color: flag.$2, width: 2),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(region.label, style: PT.strong(19, color: fg)),
                      Text(
                        '${region.symbol} ${currencyName(region)} · ${regionExamples(region)}',
                        style: PT.body(14, color: selected ? Kc.brown : Kc.softGold),
                      ),
                    ],
                  ),
                ),
                if (selected) const Icon(Icons.check_circle_outline_rounded, color: Kc.brown, size: 26),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
