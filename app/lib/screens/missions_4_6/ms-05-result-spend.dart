// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-05-result-spend`: Result: spent. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_ms_05_result_spend(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('ms-05-result-spend/${state.name}'),
      id: 'ms-05-result-spend',
      state: state,
      start: Phase46.resultSpend,
    );
