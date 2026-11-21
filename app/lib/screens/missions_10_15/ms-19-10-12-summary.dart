// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'clothing_flow.dart';

/// Canvas `ms-19-10-12-summary`: 10–12 summary. A stage of the same mission.
/// The screen lives in the mission's state machine (clothing_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_ms_19_10_12_summary(BuildContext context, ScreenState state) {
  return ClothingBrandFlow(key: const ValueKey('flow-ms-19-10-12-summary'), start: ClothingStage.summary, state: state);
}
