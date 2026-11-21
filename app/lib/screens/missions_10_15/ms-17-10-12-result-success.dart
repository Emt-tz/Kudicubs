// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'clothing_flow.dart';

/// Canvas `ms-17-10-12-result-success`: 10–12 success result. A stage of the same mission.
/// The screen lives in the mission's state machine (clothing_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_ms_17_10_12_result_success(BuildContext context, ScreenState state) {
  return ClothingBrandFlow(key: const ValueKey('flow-ms-17-10-12-result-success'), start: ClothingStage.result, state: state);
}
