// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-12-7-9-result-retry`: Result: try again. Ages 7–9, Birthday Party. Real screen: see player.dart.
Widget build_ms_12_7_9_result_retry(BuildContext context, ScreenState state) =>
    PartyPlayer(
      key: ValueKey('ms-12-7-9-result-retry/${state.name}'),
      id: 'ms-12-7-9-result-retry',
      state: state,
      start: Phase79.retry,
    );
