// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-08-mission-loading`: Getting things ready. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_ms_08_mission_loading(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('ms-08-mission-loading/${state.name}'),
      id: 'ms-08-mission-loading',
      state: state,
      start: Phase46.intro,
    );
