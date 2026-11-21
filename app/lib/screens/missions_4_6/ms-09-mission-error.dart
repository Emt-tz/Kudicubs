// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-09-mission-error`: Could not save yet. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_ms_09_mission_error(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('ms-09-mission-error/${state.name}'),
      id: 'ms-09-mission-error',
      state: state,
      start: Phase46.summary,
    );
