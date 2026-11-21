// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-11-7-9-result-success`: Result: party planned. Ages 7–9, Birthday Party. Real screen: see player.dart.
Widget build_ms_11_7_9_result_success(
  BuildContext context,
  ScreenState state,
) => PartyPlayer(
  key: ValueKey('ms-11-7-9-result-success/${state.name}'),
  id: 'ms-11-7-9-result-success',
  state: state,
  start: Phase79.success,
);
