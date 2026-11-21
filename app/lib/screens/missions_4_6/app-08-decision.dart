// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `app-08-decision`: Save or spend. Ages 4–6, The Lost Coins. Real screen: see player.dart.
Widget build_app_08_decision(BuildContext context, ScreenState state) =>
    LostCoinsPlayer(
      key: ValueKey('app-08-decision/${state.name}'),
      id: 'app-08-decision',
      state: state,
      start: Phase46.decision,
    );
