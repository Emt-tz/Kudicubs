// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'hustle_flow.dart';

/// Canvas `ms-24-13-15-market`: 13–15 read the market. A stage of the same mission.
/// The screen lives in the mission's state machine (hustle_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_ms_24_13_15_market(BuildContext context, ScreenState state) {
  return SideHustleFlow(key: const ValueKey('flow-ms-24-13-15-market'), start: HustleStage.market, state: state);
}
