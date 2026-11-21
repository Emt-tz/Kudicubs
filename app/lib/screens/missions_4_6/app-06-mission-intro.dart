// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `app-06-mission-intro`: Mission intro. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_app_06_mission_intro(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('app-06-mission-intro/${state.name}'),
      id: 'app-06-mission-intro',
      state: state,
      start: Phase46.intro,
    );
