// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'clothing_flow.dart';

/// Canvas `ms-18-10-12-result-retry`: 10–12 try-again result. A stage of the same mission.
/// The screen lives in the mission's state machine (clothing_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_ms_18_10_12_result_retry(BuildContext context, ScreenState state) {
  return ClothingBrandFlow(key: const ValueKey('flow-ms-18-10-12-result-retry'), start: ClothingStage.result, state: state, poor: true);
}
