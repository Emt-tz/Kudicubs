/// One child's page in the parent area (app-18, and pa-05 when nothing was played).
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'parent_children_view.dart';
import 'parent_data.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

/// `:id` of `/parent/child/:id`; null on any other route (the gallery's `/screen/:id` has an `id` too).
String? _routeChildId(BuildContext context) {
  try {
    final s = GoRouterState.of(context);
    return s.uri.path.startsWith('/parent/child/') ? s.pathParameters['id'] : null;
  } catch (_) {
    return null;
  }
}

class ParentChildView extends ConsumerWidget {
  const ParentChildView({super.key, this.childId, this.state = ScreenState.normal, this.forceNoPlay = false});

  /// Child to show. Null: the route's `:id`, else the child who is playing.
  final String? childId;
  final ScreenState state;

  /// Show the "has not played yet" design even when there is play (gallery).
  final bool forceNoPlay;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = childId ?? _routeChildId(context) ?? ref.watch(currentChildProvider).value?.id;
    final back = BackLink('All children', onTap: () => goBackOr(context, '/parent'));

    if (state == ScreenState.loading) return _wait();
    if (state == ScreenState.offline) {
      return ParentPage(
        scroll: false,
        bottom: null,
        child: ParentMessage(
          title: 'No connection',
          message: 'Your children are safe. Check your connection and try again.',
          onAction: () => _retry(ref, id),
        ),
      );
    }
    if (id == null) {
      final kids = ref.watch(childrenProvider);
      if (kids.isLoading) return _wait();
      return ParentPage(
        scroll: false,
        child: ParentMessage(
          title: 'No child yet',
          message: 'Add a child to see how they are growing.',
          pose: KudiPose.wave,
          actionLabel: 'Add a child',
          onAction: () => openAddChild(context),
        ),
      );
    }

    final overview = ref.watch(childOverviewProvider(id));
    if (state == ScreenState.error) return _error(ref, id);
    return overview.when(
      skipLoadingOnRefresh: true,
      loading: _wait,
      error: (_, _) => _error(ref, id),
      data: (o) => (forceNoPlay || state == ScreenState.empty || !o.hasPlayed)
          ? _noPlay(context, ref, o)
          : _played(context, o, back),
    );
  }

  void _retry(WidgetRef ref, String? id) {
    if (id != null) ref.invalidate(childOverviewProvider(id));
    ref.invalidate(childrenProvider);
  }

  Widget _wait() => const ParentPage(scroll: false, child: ParentMessage(title: 'Getting things ready...'));

  Widget _error(WidgetRef ref, String id) => ParentPage(
    scroll: false,
    child: ParentMessage(
      title: 'Oops!',
      message: 'We could not load this page. Nothing has been lost.',
      onAction: () => _retry(ref, id),
    ),
  );

  Widget _header(Child c, {int? level}) => Row(
    children: [
      ChildAvatar(c.avatar, size: 64),
      const SizedBox(width: 14),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(c.nickname, style: PT.display(32)),
            Text(
              childSubtitle(c, level: level),
              style: PT.body(15, color: Kc.softGold, weight: 700),
            ),
          ],
        ),
      ),
    ],
  );

  Widget _stat(String big, String small, {bool center = false, double size = 26}) => ParentCard(
    padding: const EdgeInsets.all(12),
    child: Column(
      crossAxisAlignment: center ? CrossAxisAlignment.center : CrossAxisAlignment.start,
      children: [
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: center ? Alignment.center : Alignment.centerLeft,
          child: Text(big, style: PT.display(size)),
        ),
        Text(
          small,
          style: PT.body(13, color: Kc.softGold, weight: 700),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    ),
  );

  Widget _played(BuildContext context, ChildOverview o, Widget back) {
    final c = o.child;
    final level = levelForXp(o.balances.xp);
    final skills = skillPercents(o.attempts);
    final now = DateTime.now();
    final recent = o.attempts.take(3).toList();
    return ParentPage(
      bottom: ParentSoft('Settings for ${c.nickname}', onPressed: () => context.push('/parent/settings?child=${c.id}')),
      child: Gap(
        gap: 14,
        children: [
          back,
          _header(c),
          Row(
            children: [
              Expanded(child: _stat('Level $level', levelName(level))),
              const SizedBox(width: 10),
              Expanded(child: _stat('${o.earnedBadges}', 'Badges')),
              const SizedBox(width: 10),
              Expanded(child: _stat('${c.region.symbol}${o.balances.coins}', 'Wallet')),
            ],
          ),
          Text('Skills growing', style: PT.heading(20)),
          for (final s in Skill.values) _SkillBar(label: s.label, percent: skills[s] ?? 0),
          Text('Recent play', style: PT.heading(20)),
          if (recent.isEmpty) const InfoStrip('Recent missions will show here.'),
          for (final a in recent)
            ParentCard(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(text: o.missionTitles[a.missionId] ?? 'A mission', style: PT.strong(15)),
                        TextSpan(text: ' · ${relativeDay(a.startedAt, now)}', style: PT.body(15)),
                      ],
                    ),
                  ),
                  Text(playSummary(a, o.events), style: PT.body(15, color: Kc.softGold)),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _noPlay(BuildContext context, WidgetRef ref, ChildOverview o) {
    final c = o.child;
    return Builder(
      builder: (context) => ParentPage(
        scroll: false,
        bottom: ParentPrimary('Back to the game', onPressed: () => leaveParentArea(context, ref)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            BackLink('Your children', onTap: () => goBackOr(context, '/parent')),
            const SizedBox(height: 14),
            _header(c, level: levelForXp(o.balances.xp)),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(child: _stat('${c.region.symbol}${o.balances.coins}', 'Wallet', center: true, size: 24)),
                const SizedBox(width: 10),
                Expanded(child: _stat('${o.balances.xp}', 'XP', center: true, size: 24)),
                const SizedBox(width: 10),
                Expanded(child: _stat('${o.earnedBadges}', 'Badges', center: true, size: 24)),
              ],
            ),
            const SizedBox(height: 14),
            Expanded(
              child: DashedBox(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const KudiImage(KudiPose.wave, width: 150),
                    const SizedBox(height: 12),
                    Text('${c.nickname} has not played yet', style: PT.display(24), textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 290),
                      child: Text(
                        'Skills, badges and recent play will show here after the first mission. Hand over the device when you are ready.',
                        style: PT.body(16),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SkillBar extends StatelessWidget {
  const _SkillBar({required this.label, required this.percent});
  final String label;
  final int percent;

  @override
  Widget build(BuildContext context) => Semantics(
    label: '$label $percent percent',
    excludeSemantics: true,
    child: Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: PT.strong(15)),
            Text('$percent%', style: PT.strong(15)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(Kc.rPill),
          child: SizedBox(
            height: 12,
            child: Stack(
              children: [
                Container(color: Kc.white.withValues(alpha: 0.14)),
                FractionallySizedBox(
                  widthFactor: percent / 100,
                  child: Container(color: Kc.yellow),
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );
}
