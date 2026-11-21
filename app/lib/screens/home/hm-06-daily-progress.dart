// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'daily_screen.dart';

/// Canvas `hm-06-daily-progress`: Daily challenge, in progress (switches to the complete design at 3/3).
Widget build_hm_06_daily_progress(BuildContext context, ScreenState state) =>
    DailyScreen(screenKey: const Key('screen-hm-06-daily-progress'), forced: state);
