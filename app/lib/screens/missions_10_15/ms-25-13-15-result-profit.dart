// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'hustle_flow.dart';

/// Canvas `ms-25-13-15-result-profit`: 13–15 profit result. A stage of the same mission.
/// The screen lives in the mission's state machine (hustle_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_ms_25_13_15_result_profit(BuildContext context, ScreenState state) {
  return SideHustleFlow(key: const ValueKey('flow-ms-25-13-15-result-profit'), start: HustleStage.result, state: state);
}
