import 'data/models.dart';

/// Constitution rules per age band (docs/design/age-band-rules.md). Pure functions.

/// Ages 4-6 never see a failure screen; they get the gentle variant instead.
bool showsFailureScreen(AgeBand band) => band != AgeBand.b4_6;

/// Ages 7-15 are always offered "Try again" after a failed attempt.
bool offersRetry(AgeBand band) => band != AgeBand.b4_6;

/// No band ever loses coins, XP or badges because of a failed attempt.
bool losesProgressOnFailure(AgeBand band) => false;

/// Timers are off for 4-6 and never end a round for anyone.
bool hasTimers(AgeBand band) => band != AgeBand.b4_6;

/// Main button height in dp (76 / 64 / 64 / 56).
double mainButtonHeight(AgeBand band) => switch (band) {
      AgeBand.b4_6 => 76,
      AgeBand.b7_9 || AgeBand.b10_12 => 64,
      AgeBand.b13_15 => 56,
    };

/// Seconds of inactivity before the first idle hint (6 / 8 / 10 / 12).
int firstHintSeconds(AgeBand band) => switch (band) {
      AgeBand.b4_6 => 6,
      AgeBand.b7_9 => 8,
      AgeBand.b10_12 => 10,
      AgeBand.b13_15 => 12,
    };

/// Outcome to record for a finished attempt: success stays `success`; a miss
/// is `gentle` for 4-6 (celebrated like a win) and `retry` for 7-15.
AttemptOutcome outcomeFor(AgeBand band, {required bool succeeded}) {
  if (succeeded) return AttemptOutcome.success;
  return showsFailureScreen(band) ? AttemptOutcome.retry : AttemptOutcome.gentle;
}

/// Coins a failed attempt costs: always zero.
int failurePenalty(AgeBand band) => 0;
