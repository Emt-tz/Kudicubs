/// Progress (XP, level, skills, badges) and the badge detail sheet.
library;

import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'wallet_profile_logic.dart';
import 'wallet_profile_widgets.dart';

enum ProgressVariant { auto, empty }

class ProgressScreen extends ConsumerWidget {
  const ProgressScreen({super.key, this.state = ScreenState.normal, this.variant = ProgressVariant.auto});

  final ScreenState state;
  final ProgressVariant variant;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childAsync = ref.watch(currentChildProvider);
    final childId = childAsync.value?.id;
    void retry() => retryWalletLoad(ref, childId);

    Widget body;
    if (variant == ProgressVariant.empty || state == ScreenState.empty) {
      body = const ProgressEmpty();
    } else if (state == ScreenState.loading) {
      body = const LoadingView(message: 'Getting things ready...');
    } else if (state == ScreenState.error) {
      body = ErrorView(onRetry: retry);
    } else {
      body = childAsync.when(
        loading: () => const LoadingView(message: 'Getting things ready...'),
        error: (_, _) => ErrorView(onRetry: retry),
        data: (child) {
          if (child == null) return const EmptyView(title: 'No one is playing yet', message: 'Ask a grown-up to add you.');
          final bal = ref.watch(balancesProvider(child.id));
          final att = ref.watch(attemptsProvider(child.id));
          final balances = bal.value;
          final attempts = att.value;
          if (balances == null || attempts == null) {
            return bal.hasError || att.hasError ? ErrorView(onRetry: retry) : const LoadingView(message: 'Getting things ready...');
          }
          if (balances.xp == 0 && attempts.isEmpty) return const ProgressEmpty();
          return _ProgressContent(
            childId: child.id,
            xp: balances.xp,
            percents: pillarPercents(attempts),
            offline: state == ScreenState.offline || !ref.watch(onlineProvider),
          );
        },
      );
    }
    return WpPage(nav: WpTab.progress, child: body);
  }
}

class _ProgressContent extends ConsumerWidget {
  const _ProgressContent({required this.childId, required this.xp, required this.percents, required this.offline});

  final String childId;
  final int xp;
  final Map<Pillar, int> percents;
  final bool offline;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badges = ref.watch(badgesProvider(childId));
    final list = badges.value;
    return ListView(
      padding: const EdgeInsets.only(bottom: Kc.s4),
      children: [
        Text('My progress', style: baloo(32, height: 1.1)),
        const SizedBox(height: 14),
        if (offline) ...[
          const StateBanner(message: 'No connection. Your progress is safe and will sync later.', kind: BannerKind.offline),
          const SizedBox(height: 14),
        ],
        LevelCard(xp: xp),
        const SizedBox(height: 14),
        PillarCard(percents: percents),
        const SizedBox(height: 18),
        Text('My badges', style: baloo(22, weight: 700)),
        const SizedBox(height: 10),
        if (list != null)
          list.isEmpty
              ? Text('No badges to find yet.', style: nunito(16, color: Kc.brown80))
              : BadgeGrid(badges: list, onTap: (b) => showBadgeSheet(context, childId: childId, badge: b))
        else if (badges.hasError)
          StateBanner(
            message: 'We could not load your badges.',
            kind: BannerKind.error,
            onRetry: () => ref.invalidate(badgesProvider(childId)),
          )
        else
          const Padding(padding: EdgeInsets.all(Kc.s4), child: Center(child: CircularProgressIndicator(color: Kc.orange))),
      ],
    );
  }
}

/// pr-01: nothing played yet.
class ProgressEmpty extends StatelessWidget {
  const ProgressEmpty({super.key});

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 14,
        children: [
          Text('My progress', style: baloo(32, height: 1.1)),
          const LevelCard(xp: 0),
          PillarCard(percents: {for (final p in Pillar.values) p: 0}, compact: true),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: Kc.s3),
              decoration: BoxDecoration(
                color: Kc.softGold,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Kc.brown, width: Kc.border),
              ),
              child: Row(
                spacing: Kc.s3,
                children: [
                  const KudiImage(KudiPose.wave, width: 100),
                  Expanded(
                    child: Text('Every mission grows a skill. Play one and watch these bars fill up!', style: nunito(18, weight: 800, height: 1.3)),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 9),
            child: PrimaryButton(label: 'Play a mission', height: 68, onPressed: () => context.go('/home')),
          ),
        ],
      );
}

// ---- Badges ----------------------------------------------------------------

const _badgeColors = [Kc.gold, Kc.orange, Kc.yellow];

/// 3-column grid: earned badges gold, locked ones dashed. Tap opens the detail.
class BadgeGrid extends StatelessWidget {
  const BadgeGrid({super.key, required this.badges, this.onTap});

  final List<Badge> badges;
  final ValueChanged<Badge>? onTap;

  @override
  Widget build(BuildContext context) => GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: badges.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          mainAxisExtent: 112,
        ),
        itemBuilder: (_, i) => _BadgeTile(badge: badges[i], color: _badgeColors[i % _badgeColors.length], onTap: onTap),
      );
}

class _BadgeTile extends StatelessWidget {
  const _BadgeTile({required this.badge, required this.color, this.onTap});

  final Badge badge;
  final Color color;
  final ValueChanged<Badge>? onTap;

  @override
  Widget build(BuildContext context) {
    final earned = badge.earned;
    final label = Text(
      badge.title,
      textAlign: TextAlign.center,
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
      style: nunito(14, weight: 800, color: earned ? Kc.brown : Kc.brown80, height: 1.2),
    );
    final face = earned
        ? Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: 3)),
          )
        : DashedBox(color: Kc.brown60, radius: 20, strokeWidth: 3, child: const SizedBox(width: 40, height: 40));
    final content = Column(
      mainAxisAlignment: MainAxisAlignment.center,
      spacing: 6,
      children: [face, Padding(padding: const EdgeInsets.symmetric(horizontal: 4), child: label)],
    );
    return Semantics(
      button: onTap != null,
      label: earned ? badge.title : '${badge.title}, not earned yet',
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap == null ? null : () => onTap!(badge),
        child: earned
            ? Container(
                decoration: BoxDecoration(
                  color: Kc.softGold,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Kc.brown, width: 3),
                ),
                child: content,
              )
            : DashedBox(color: Kc.brown60, fill: Kc.creamShade, radius: 20, strokeWidth: 3, child: content),
      ),
    );
  }
}

Future<void> showBadgeSheet(BuildContext context, {required String childId, required Badge badge}) =>
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      barrierColor: Kc.brown.withValues(alpha: .55),
      builder: (sheetContext) => BadgeSheetLoader(
        childId: childId,
        badge: badge,
        onClose: () => Navigator.of(sheetContext).pop(),
        onGo: () {
          Navigator.of(sheetContext).pop();
          context.go('/home');
        },
      ),
    );

/// Badge detail with real progress for locked badges (jar, missions).
class BadgeSheetLoader extends ConsumerWidget {
  const BadgeSheetLoader({super.key, required this.childId, required this.badge, required this.onClose, required this.onGo});

  final String childId;
  final Badge badge;
  final VoidCallback onClose;
  final VoidCallback onGo;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    BadgeProgress? progress;
    if (!badge.earned) {
      progress = badgeProgress(
        badge.id,
        balances: ref.watch(balancesProvider(childId)).value ?? const Balances(),
        attempts: ref.watch(attemptsProvider(childId)).value ?? const [],
      );
    }
    return BadgeSheetBody(badge: badge, progress: progress, onClose: onClose, onGo: onGo);
  }
}

class BadgeSheetBody extends StatelessWidget {
  const BadgeSheetBody({super.key, required this.badge, this.progress, required this.onClose, required this.onGo});

  final Badge badge;
  final BadgeProgress? progress;
  final VoidCallback onClose;
  final VoidCallback onGo;

  @override
  Widget build(BuildContext context) {
    final earned = badge.earned;
    final at = badge.earnedAt;
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Kc.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(top: BorderSide(color: Kc.brown, width: 3)),
      ),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(Kc.s5, Kc.s5, Kc.s5, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: 14,
            children: [
              Container(
                width: 44,
                height: 6,
                decoration: BoxDecoration(color: Kc.creamShade, borderRadius: BorderRadius.circular(Kc.rPill)),
              ),
              if (earned)
                Container(
                  width: 132,
                  height: 132,
                  decoration: BoxDecoration(color: Kc.softGold, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: 4)),
                  child: const Icon(Icons.star_rounded, size: 72, color: Kc.gold),
                )
              else
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(color: Kc.creamShade, shape: BoxShape.circle, border: Border.all(color: Kc.brown80, width: 3)),
                  child: const Icon(Icons.lock_outline_rounded, size: 52, color: Kc.brown80),
                ),
              Text(badge.title, style: baloo(28), textAlign: TextAlign.center),
              if (earned)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE3F3E8),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Kc.success, width: Kc.border),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    spacing: 6,
                    children: [
                      const Icon(Icons.check_circle_rounded, size: 18, color: Kc.success),
                      Text(
                        at == null ? 'Earned' : 'Earned on ${at.day} ${monthName(at.month)}',
                        style: nunito(15, weight: 800, color: Kc.success),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                  decoration: BoxDecoration(
                    color: Kc.peach,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Kc.brown, width: Kc.border),
                  ),
                  child: Text('Not earned yet', style: nunito(15, weight: 800)),
                ),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 300),
                child: Text(badgeDescription(badge.id), style: nunito(18, height: 1.4), textAlign: TextAlign.center),
              ),
              if (!earned && progress != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: 6,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(progress!.label, style: nunito(15, weight: 800)),
                        Text(progress!.text, style: nunito(15, weight: 800)),
                      ],
                    ),
                    KcBar(fraction: progress!.fraction),
                  ],
                ),
              if (earned)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Kc.peach,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Kc.brown, width: Kc.border),
                  ),
                  child: Row(
                    spacing: 10,
                    children: [
                      const KudiImage(KudiPose.celebrate, width: 56),
                      Expanded(child: Text('Badges stay with you. They are never taken away.', style: nunito(16, weight: 800))),
                    ],
                  ),
                ),
              PrimaryButton(label: earned ? 'Nice!' : 'Go and earn it', height: 64, onPressed: earned ? onClose : onGo),
              if (!earned) TextLink('Close', onTap: onClose, size: 17),
            ],
          ),
        ),
      ),
    );
  }
}

/// pr-02 (locked) and pr-03 (earned): the detail sheet over the dimmed badge grid.
class BadgeDetailScreen extends ConsumerWidget {
  const BadgeDetailScreen({super.key, required this.earned, this.state = ScreenState.normal});

  final bool earned;
  final ScreenState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childAsync = ref.watch(currentChildProvider);
    final childId = childAsync.value?.id;
    void close() => goBackOr(context, '/progress');

    Widget page(Widget child) => WpPage(nav: WpTab.progress, child: child);
    if (state == ScreenState.loading) return page(const LoadingView(message: 'Getting things ready...'));
    if (state == ScreenState.error) return page(ErrorView(onRetry: () => retryWalletLoad(ref, childId)));
    if (state == ScreenState.empty) return page(const EmptyView(title: 'No badges yet', message: 'Play a mission to find your first badge.'));

    return childAsync.when(
      loading: () => page(const LoadingView(message: 'Getting things ready...')),
      error: (_, _) => page(ErrorView(onRetry: () => retryWalletLoad(ref, childId))),
      data: (child) {
        if (child == null) return page(const EmptyView(title: 'No one is playing yet', message: 'Ask a grown-up to add you.'));
        final badges = ref.watch(badgesProvider(child.id));
        final list = badges.value;
        if (list == null) {
          return badges.hasError
              ? page(ErrorView(onRetry: () => retryWalletLoad(ref, child.id)))
              : page(const LoadingView(message: 'Getting things ready...'));
        }
        if (list.isEmpty) return page(const EmptyView(title: 'No badges yet', message: 'Play a mission to find your first badge.'));
        final badge = list.firstWhere((b) => b.earned == earned, orElse: () => list.first);
        return Scaffold(
          backgroundColor: Kc.cream,
          body: Stack(
            children: [
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(Kc.s5, Kc.s3, Kc.s5, 0),
                  child: Opacity(
                    opacity: .5,
                    child: ListView(
                      physics: const NeverScrollableScrollPhysics(),
                      children: [
                        Text('My badges', style: baloo(32, height: 1.1)),
                        const SizedBox(height: 14),
                        BadgeGrid(badges: list),
                      ],
                    ),
                  ),
                ),
              ),
              Positioned.fill(
                child: GestureDetector(onTap: close, child: ColoredBox(color: Kc.brown.withValues(alpha: .55))),
              ),
              Align(
                alignment: Alignment.bottomCenter,
                child: BadgeSheetLoader(
                  childId: child.id,
                  badge: badge,
                  onClose: close,
                  onGo: () => context.go('/home'),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
