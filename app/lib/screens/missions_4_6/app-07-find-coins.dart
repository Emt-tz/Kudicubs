// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `app-07-find-coins`: Find the coins. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_app_07_find_coins(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('app-07-find-coins/${state.name}'),
      id: 'app-07-find-coins',
      state: state,
      start: Phase46.find,
    );
