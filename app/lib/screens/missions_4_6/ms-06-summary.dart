// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-06-summary`: Summary. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_ms_06_summary(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('ms-06-summary/${state.name}'),
      id: 'ms-06-summary',
      state: state,
      start: Phase46.summary,
    );
