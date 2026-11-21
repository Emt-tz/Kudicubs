/// The children list (app-17, pa-01 empty, pa-02 loading) as one real widget.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'pa-03-add-child.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

/// Which design to force; null follows the real data (and [ParentChildrenView.state]).
enum ChildrenLook { loading, empty }

/// Leaves the parent area and returns to the child's game.
void leaveParentArea(BuildContext context, WidgetRef ref) {
  ref.read(parentUnlockedProvider.notifier).lock();
  context.go('/home');
}

void openAddChild(BuildContext context) => pushPage<void>(context, (c) => build_pa_03_add_child(c, ScreenState.normal));

class ParentChildrenView extends ConsumerWidget {
  const ParentChildrenView({super.key, this.state = ScreenState.normal, this.look});

  final ScreenState state;
  final ChildrenLook? look;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final children = ref.watch(childrenProvider);
    final bottomBack = ParentSoft('Back to the game', onPressed: () => leaveParentArea(context, ref));

    // A forced design wins, then the gallery state, then the real data.
    final effective =
        look ??
        switch (state) {
          ScreenState.loading => ChildrenLook.loading,
          ScreenState.empty => ChildrenLook.empty,
          _ =>
            children.isLoading && !children.hasValue
                ? ChildrenLook.loading
                : (children.hasValue && children.value!.isEmpty ? ChildrenLook.empty : null),
        };

    if (effective == ChildrenLook.loading) return _loading();
    if (effective == ChildrenLook.empty) return _empty(context, bottomBack);

    if (state == ScreenState.offline) {
      return ParentPage(
        scroll: false,
        child: ParentMessage(
          title: 'No connection',
          message: 'Your children are safe. Check your connection and try again.',
          onAction: () => ref.invalidate(childrenProvider),
        ),
      );
    }
    if (state == ScreenState.error || children.hasError) {
      return ParentPage(
        scroll: false,
        bottom: bottomBack,
        child: ParentMessage(
          title: 'Oops!',
          message: 'We could not load your children. Nothing has been lost.',
          onAction: () => ref.invalidate(childrenProvider),
        ),
      );
    }

    final list = children.value ?? const <Child>[];
    return ParentPage(
      bottom: Row(
        children: [
          Expanded(child: ParentSoft('Settings', onPressed: () => context.push('/parent/settings'))),
          const SizedBox(width: 10),
          Expanded(
            child: ParentPrimary(
              'Back to the game',
              onPressed: () => leaveParentArea(context, ref),
              height: 52,
              fontSize: 16,
            ),
          ),
        ],
      ),
      child: Gap(
        gap: 16,
        children: [
          Text('Parent area', style: PT.eyebrow),
          Text('Your children', style: PT.display(34)),
          Text('Tap a child to see how they are growing.', style: PT.body(16)),
          for (final c in list) _ChildTile(c),
          if (list.length < kMaxChildren)
            ParentDashed('Add a child', onPressed: () => openAddChild(context))
          else
            const InfoStrip('A family can have up to $kMaxChildren children.'),
        ],
      ),
    );
  }

  Widget _loading() => ParentPage(
    bottom: const _SkeletonButton(),
    child: Gap(
      gap: 16,
      children: [
        Text('Parent area', style: PT.eyebrow),
        Text('Your children', style: PT.display(34)),
        Row(
          children: [
            const KudiImage(KudiPose.headphones, width: 64),
            const SizedBox(width: 12),
            Expanded(
              child: Semantics(liveRegion: true, child: Text('Getting things ready...', style: PT.strong(17))),
            ),
          ],
        ),
        const SkeletonTile(titleWidth: 0.4, lineWidth: 0.75),
        const SkeletonTile(titleWidth: 0.34, lineWidth: 0.68),
        const SkeletonTile(titleWidth: 0.44, lineWidth: 0.8),
      ],
    ),
  );

  Widget _empty(BuildContext context, Widget back) => ParentPage(
    scroll: false,
    bottom: back,
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Parent area', style: PT.eyebrow),
        const SizedBox(height: 16),
        Text('Your children', style: PT.display(34)),
        const SizedBox(height: 16),
        Expanded(
          child: DashedBox(
            padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const KudiImage(KudiPose.wave, width: 170),
                const SizedBox(height: 14),
                Text('No children yet', style: PT.display(26), textAlign: TextAlign.center),
                const SizedBox(height: 14),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 290),
                  child: Text(
                    'Add your first child so they can join the Pride and start playing.',
                    style: PT.body(17),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: 220,
                  child: ParentPrimary('Add a child', onPressed: () => openAddChild(context), shadow: true),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}

class _SkeletonButton extends StatelessWidget {
  const _SkeletonButton();

  @override
  Widget build(BuildContext context) => Container(
    height: 56,
    decoration: BoxDecoration(
      color: Kc.creamShade.withValues(alpha: 0.2),
      borderRadius: BorderRadius.circular(Kc.rPill),
    ),
  );
}

class _ChildTile extends ConsumerWidget {
  const _ChildTile(this.child);
  final Child child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bal = ref.watch(balancesProvider(child.id)).value;
    final level = bal == null ? null : levelForXp(bal.xp);
    return Semantics(
      button: true,
      label: '${child.nickname}, ${childSubtitle(child, level: level)}',
      excludeSemantics: true,
      child: Material(
        color: Kc.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          key: Key('child-${child.id}'),
          borderRadius: BorderRadius.circular(20),
          onTap: () => context.push('/parent/child/${child.id}'),
          child: Container(
            constraints: const BoxConstraints(minHeight: 88),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                ChildAvatar(child.avatar),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(child.nickname, style: PT.display(24)),
                      Text(
                        childSubtitle(child, level: level),
                        style: PT.body(15, color: Kc.softGold, weight: 700),
                      ),
                      if (bal != null)
                        Text('${child.region.symbol}${bal.coins} in the wallet', style: PT.body(14, weight: 700)),
                    ],
                  ),
                ),
                const Text('›', style: TextStyle(fontSize: 26, color: Kc.softGold)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
