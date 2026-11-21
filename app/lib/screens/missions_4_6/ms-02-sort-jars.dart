// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-02-sort-jars`: Sort into jars. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_ms_02_sort_jars(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('ms-02-sort-jars/${state.name}'),
      id: 'ms-02-sort-jars',
      state: state,
      start: Phase46.sort,
    );
