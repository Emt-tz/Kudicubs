// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-03-count`: Count the coins. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_ms_03_count(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('ms-03-count/${state.name}'),
      id: 'ms-03-count',
      state: state,
      start: Phase46.count,
    );
