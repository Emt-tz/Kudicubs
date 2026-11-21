// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'hustle_flow.dart';

/// Canvas `ms-26-13-15-summary`: 13–15 summary. A stage of the same mission.
/// The screen lives in the mission's state machine (hustle_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_ms_26_13_15_summary(BuildContext context, ScreenState state) {
  return SideHustleFlow(key: const ValueKey('flow-ms-26-13-15-summary'), start: HustleStage.summary, state: state);
}
