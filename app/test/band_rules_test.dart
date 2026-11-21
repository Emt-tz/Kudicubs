import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/band_rules.dart';
import 'package:kudicubs/core/data/models.dart';

void main() {
  test('ages 4-6 never see a failure screen; 7-15 do', () {
    expect(showsFailureScreen(AgeBand.b4_6), isFalse);
    for (final b in [AgeBand.b7_9, AgeBand.b10_12, AgeBand.b13_15]) {
      expect(showsFailureScreen(b), isTrue);
    }
  });

  test('retry is offered to 7-15 only (4-6 have nothing to retry)', () {
    expect(offersRetry(AgeBand.b4_6), isFalse);
    for (final b in [AgeBand.b7_9, AgeBand.b10_12, AgeBand.b13_15]) {
      expect(offersRetry(b), isTrue);
    }
  });

  test('no band ever loses progress or pays a penalty', () {
    for (final b in AgeBand.values) {
      expect(losesProgressOnFailure(b), isFalse);
      expect(failurePenalty(b), 0);
    }
  });

  test('a missed attempt is gentle for 4-6 and retry for older bands', () {
    expect(outcomeFor(AgeBand.b4_6, succeeded: false), AttemptOutcome.gentle);
    expect(outcomeFor(AgeBand.b7_9, succeeded: false), AttemptOutcome.retry);
    expect(outcomeFor(AgeBand.b13_15, succeeded: true), AttemptOutcome.success);
  });

  test('button heights and first hints follow the band table', () {
    expect([for (final b in AgeBand.values) mainButtonHeight(b)], [76, 64, 64, 56]);
    expect([for (final b in AgeBand.values) firstHintSeconds(b)], [6, 8, 10, 12]);
    expect(hasTimers(AgeBand.b4_6), isFalse);
  });

  test('retrying keeps the balance: events are additive only', () {
    var b = const Balances(coins: 120, xp: 360);
    // a failed attempt records no wallet event at all, so the balance is unchanged
    expect(b.coins, 120);
    b = b.apply(WalletEvent(id: 'x', childId: 'c', kind: WalletKind.earn, amount: 10, createdAt: DateTime(2026)));
    expect(b.coins, 130);
    b = b.apply(WalletEvent(id: 'y', childId: 'c', kind: WalletKind.save, amount: 40, createdAt: DateTime(2026)));
    expect((b.coins, b.saved), (90, 40));
  });
}
