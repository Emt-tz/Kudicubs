// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `ms-14-7-9-saving-error`: Could not save yet. Ages 7–9, Birthday Party. Real screen: see player.dart.
Widget build_ms_14_7_9_saving_error(BuildContext context, ScreenState state) =>
    PartyPlayer(
      key: ValueKey('ms-14-7-9-saving-error/${state.name}'),
      id: 'ms-14-7-9-saving-error',
      state: state,
      start: Phase79.summary,
    );
