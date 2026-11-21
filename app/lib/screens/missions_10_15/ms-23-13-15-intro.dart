// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'hustle_flow.dart';

/// Canvas `ms-23-13-15-intro`: 13–15 intro. Entry point (route /mission/13-15).
/// The screen lives in the mission's state machine (hustle_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_ms_23_13_15_intro(BuildContext context, ScreenState state) {
  return SideHustleFlow(key: const ValueKey('flow-ms-23-13-15-intro'), start: HustleStage.intro, state: state);
}
