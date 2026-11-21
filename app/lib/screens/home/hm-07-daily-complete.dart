// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'daily_screen.dart';

/// Canvas `hm-07-daily-complete`: Daily challenge, complete. Writes the +10 `daily` event once per day.
Widget build_hm_07_daily_complete(BuildContext context, ScreenState state) =>
    DailyScreen(screenKey: const Key('screen-hm-07-daily-complete'), forced: state, forceComplete: true);
