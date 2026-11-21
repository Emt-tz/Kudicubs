import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import 'app-09-reward.dart';
import 'ms-20-level-up.dart';
import 'ms-21-badge-earned.dart';

export 'ms-22-leave-confirm.dart' show confirmLeaveMission;

/// XP needed per level. Level = 1 + xp ~/ 300 (level 1 at 0 XP, level 2 at 300 XP, ...).
const int xpPerLevel = 300;

/// Level for a total XP amount: `1 + xp ~/ 300`. Negative XP counts as 0.
int levelForXp(int xp) => 1 + (xp < 0 ? 0 : xp) ~/ xpPerLevel;

/// XP already earned inside the current level, 0..299.
int xpIntoLevel(int xp) => (xp < 0 ? 0 : xp) % xpPerLevel;

/// Friendly level names (index = level - 1); levels past the list keep the last name.
const List<String> levelTitles = [
  'Market Visitor',
  'Market Helper',
  'Stall Keeper',
  'Smart Saver',
  'Market Pro',
  'Money Master',
];

String levelTitle(int level) => levelTitles[(level - 1).clamp(0, levelTitles.length - 1)];

/// Shows the reward flow after a mission: writes the wallet events, then pushes
/// the reward screen, the level-up screen (only when a level boundary was crossed)
/// and the badge screen (only when [badgeId] was newly unlocked), in that order.
///
/// Writes go through the repositories, which queue offline (outbox), so this never
/// throws for connectivity. A badge that cannot be awarded right now is skipped
/// silently (the child keeps everything else). Safe to call once per finished mission.
Future<void> showRewards(
  BuildContext context, {
  required String childId,
  required int coins,
  required int xp,
  String? badgeId,
}) async {
  final container = ProviderScope.containerOf(context, listen: false);
  final wallet = container.read(walletRepositoryProvider);

  var before = const Balances();
  try {
    before = await container.read(balancesProvider(childId).future);
  } catch (_) {}

  if (coins > 0) {
    await wallet.addEvent(childId: childId, kind: WalletKind.earn, amount: coins, label: 'Mission reward');
  }
  if (xp > 0) {
    await wallet.addEvent(childId: childId, kind: WalletKind.xp, amount: xp, label: 'Mission XP');
  }
  container.invalidate(balancesProvider(childId));
  container.invalidate(walletEventsProvider(childId));

  final levelBefore = levelForXp(before.xp);
  final levelAfter = levelForXp(before.xp + xp);

  Badge? unlocked;
  if (badgeId != null) {
    try {
      final all = await container.read(badgesProvider(childId).future);
      final b = all.where((x) => x.id == badgeId).firstOrNull;
      if (b != null && !b.earned) {
        await container.read(badgesRepositoryProvider).award(childId, badgeId);
        unlocked = b;
        container.invalidate(badgesProvider(childId));
      }
    } catch (_) {
      // Offline or rejected: skip; the badge is retried the next time a mission finishes.
      unlocked = null;
    }
  }

  Future<void> push(Widget w) async {
    if (!context.mounted) return;
    await Navigator.of(context).push<void>(MaterialPageRoute(builder: (_) => w));
  }

  await push(RewardView(coins: coins, xp: xp));
  if (levelAfter > levelBefore) {
    await push(LevelUpView(level: levelAfter, xp: before.xp + xp));
  }
  if (unlocked != null) {
    await push(BadgeEarnedView(title: unlocked.title, pillar: unlocked.pillar));
  }
}
