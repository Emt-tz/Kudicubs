// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-04-result-save`: Result: saved. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_ms_04_result_save(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('ms-04-result-save/${state.name}'),
      id: 'ms-04-result-save',
      state: state,
      start: Phase46.resultSave,
    );
