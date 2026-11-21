// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-07-replay`: Play again?. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_ms_07_replay(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('ms-07-replay/${state.name}'),
      id: 'ms-07-replay',
      state: state,
      start: Phase46.replay,
    );
