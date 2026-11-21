// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'clothing_flow.dart';

/// Canvas `ms-15-10-12-intro`: 10–12 intro. Entry point (route /mission/10-12).
/// The screen lives in the mission's state machine (clothing_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_ms_15_10_12_intro(BuildContext context, ScreenState state) {
  return ClothingBrandFlow(key: const ValueKey('flow-ms-15-10-12-intro'), start: ClothingStage.intro, state: state);
}
