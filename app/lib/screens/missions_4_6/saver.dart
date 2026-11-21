/// Persistence for a finished mission, shared by the 4–6 and 7–9 players.
///
/// Attempts and wallet events go through the repositories, which queue on the
/// device (outbox) when the network is down. A write that did not reach the
/// server is reported to the screen so it can show the designed saving error.
library;

import '../../core/data/models.dart';
import '../../core/data/repositories.dart';

/// What a finished mission pays out. A replay pays XP only; nothing is ever negative.
class RewardPlan {
  const RewardPlan({
    required this.coins,
    required this.xp,
    this.badgeId,
    this.replay = false,
  });

  final int coins;
  final int xp;
  final String? badgeId;
  final bool replay;
}

class MissionSaver {
  MissionSaver({
    required this.attempts,
    required this.wallet,
    required this.childId,
    required this.missionId,
  });

  final AttemptsRepository attempts;
  final WalletRepository wallet;
  final String childId;
  final String missionId;

  /// Set once the attempt is recorded (sent or queued).
  String? attemptId;
  bool _eventsWritten = false;

  /// Records the attempt, or re-checks the queue when it was recorded before.
  /// True when it reached the server; false when it is only on the device yet
  /// (or the write failed): the screen then shows the saving error.
  Future<bool> commit(AttemptOutcome outcome, DateTime startedAt) async {
    try {
      if (attemptId == null) {
        final r = await attempts.record(
          childId: childId,
          missionId: missionId,
          outcome: outcome,
          startedAt: startedAt,
        );
        attemptId = r.attempt.id;
        return !r.queued;
      }
      await attempts.flush();
      return attempts.pending == 0;
    } catch (_) {
      return false;
    }
  }

  /// Best effort log of an attempt that does not end the mission (try again, left early).
  Future<void> note(AttemptOutcome outcome, DateTime startedAt) async {
    try {
      await attempts.record(
        childId: childId,
        missionId: missionId,
        outcome: outcome,
        startedAt: startedAt,
      );
    } catch (_) {}
  }

  /// Wallet events for the choices made while playing. Written once, never negative.
  Future<void> writeEvents(
    List<({WalletKind kind, int amount, String label})> events,
  ) async {
    if (_eventsWritten) return;
    _eventsWritten = true;
    for (final e in events) {
      if (e.amount <= 0) continue;
      try {
        await wallet.addEvent(
          childId: childId,
          kind: e.kind,
          amount: e.amount,
          label: e.label,
          attemptId: attemptId,
        );
      } catch (_) {}
    }
  }

  /// "Back to home" on the saving error: keep the rewards on the device (queued) without the reward screens.
  Future<void> parkRewards(RewardPlan plan) async {
    for (final e in [
      (kind: WalletKind.earn, amount: plan.coins, label: 'Mission reward'),
      (kind: WalletKind.xp, amount: plan.xp, label: 'Mission XP'),
    ]) {
      if (e.amount <= 0) continue;
      try {
        await wallet.addEvent(
          childId: childId,
          kind: e.kind,
          amount: e.amount,
          label: e.label,
          attemptId: attemptId,
        );
      } catch (_) {}
    }
  }
}
