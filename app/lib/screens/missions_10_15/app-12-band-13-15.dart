// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'hustle_flow.dart';

/// Canvas `app-12-band-13-15`: 13–15 set your price. A stage of the same mission.
/// The screen lives in the mission's state machine (hustle_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_app_12_band_13_15(BuildContext context, ScreenState state) {
  return SideHustleFlow(key: const ValueKey('flow-app-12-band-13-15'), start: HustleStage.plan, state: state);
}
