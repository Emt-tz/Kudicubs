// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-13-7-9-summary`: Round summary. Ages 7–9, Birthday Party. Real screen: see player.dart.
Widget build_ms_13_7_9_summary(BuildContext context, ScreenState state) =>
    PartyPlayer(
      key: ValueKey('ms-13-7-9-summary/${state.name}'),
      id: 'ms-13-7-9-summary',
      state: state,
      start: Phase79.summary,
    );
