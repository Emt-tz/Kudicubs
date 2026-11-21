// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'clothing_flow.dart';

/// Canvas `ms-16-10-12-resource`: 10–12 resources. A stage of the same mission.
/// The screen lives in the mission's state machine (clothing_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_ms_16_10_12_resource(BuildContext context, ScreenState state) {
  return ClothingBrandFlow(key: const ValueKey('flow-ms-16-10-12-resource'), start: ClothingStage.split, state: state);
}
