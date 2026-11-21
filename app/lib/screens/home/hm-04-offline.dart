// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'home_screen.dart';

/// Canvas `hm-04-offline`: Home, offline. Real Home; the gallery opens this variant, real data otherwise.
Widget build_hm_04_offline(BuildContext context, ScreenState state) => HomeScreen(
      screenKey: const Key('screen-hm-04-offline'),
      forced: state == ScreenState.normal ? ScreenState.offline : state,
      forceHint: false,
    );
