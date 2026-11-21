// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-10-7-9-intro`: Mission intro. Ages 7–9, Birthday Party. Real screen: see player.dart.
Widget build_ms_10_7_9_intro(BuildContext context, ScreenState state) =>
    PartyPlayer(
      key: ValueKey('ms-10-7-9-intro/${state.name}'),
      id: 'ms-10-7-9-intro',
      state: state,
      start: Phase79.intro,
    );
