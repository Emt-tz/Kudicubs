// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-01-find-hint`: Find the coins, hint. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_ms_01_find_hint(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('ms-01-find-hint/${state.name}'),
      id: 'ms-01-find-hint',
      state: state,
      start: Phase46.find,
      hint: true,
    );
