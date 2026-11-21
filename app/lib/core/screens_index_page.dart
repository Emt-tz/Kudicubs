import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/registry.dart';
import 'theme/theme.dart';
import 'widgets/widgets.dart';

/// Debug index of all screens grouped by design section; each row opens `/screen/<id>`.
class ScreensIndexPage extends StatelessWidget {
  const ScreensIndexPage({super.key});

  @override
  Widget build(BuildContext context) {
    final sections = <String, List<({String id, String title, String section, String group})>>{};
    for (final s in screenIndex) {
      (sections[s.section] ??= []).add(s);
    }
    return ScreenScaffold(
      key: const Key('screens-index'),
      title: 'Screens (${screenIndex.length})',
      padding: EdgeInsets.zero,
      child: ListView(
        children: [
          for (final e in sections.entries) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(Kc.s5, Kc.s4, Kc.s5, Kc.s1),
              child: Text(e.key, style: KcText.label.copyWith(color: Kc.brown80)),
            ),
            for (final s in e.value)
              ListTile(
                key: Key('index-${s.id}'),
                title: Text(s.title, style: KcText.label),
                subtitle: Text(s.id, style: KcText.caption),
                trailing: const Icon(Icons.chevron_right_rounded, color: Kc.brown),
                onTap: () => context.push('/screen/${s.id}'),
              ),
          ],
        ],
      ),
    );
  }
}
