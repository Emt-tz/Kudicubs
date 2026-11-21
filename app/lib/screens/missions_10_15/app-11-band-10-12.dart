// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'clothing_flow.dart';

/// Canvas `app-11-band-10-12`: 10–12 funding choice. A stage of the same mission.
/// The screen lives in the mission's state machine (clothing_flow.dart); opened
/// directly (gallery, `?state=`) it starts at this stage with a sample play.
Widget build_app_11_band_10_12(BuildContext context, ScreenState state) {
  return ClothingBrandFlow(key: const ValueKey('flow-app-11-band-10-12'), start: ClothingStage.funding, state: state);
}
