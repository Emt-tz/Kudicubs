// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'logic.dart';
import 'player.dart';

/// Canvas `app-10-band-7-9`: Birthday Party. Ages 7–9, Birthday Party. Real screen: see player.dart.
Widget build_app_10_band_7_9(BuildContext context, ScreenState state) =>
    PartyPlayer(
      key: ValueKey('app-10-band-7-9/${state.name}'),
      id: 'app-10-band-7-9',
      state: state,
      start: Phase79.decision,
    );
