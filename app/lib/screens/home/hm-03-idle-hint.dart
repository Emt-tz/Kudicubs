// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'home_screen.dart';

/// Canvas `hm-03-idle-hint`: Home, idle hint. Real Home; the gallery opens this variant, real data otherwise.
Widget build_hm_03_idle_hint(BuildContext context, ScreenState state) => HomeScreen(
      screenKey: const Key('screen-hm-03-idle-hint'),
      forced: state == ScreenState.normal ? ScreenState.normal : state,
      forceHint: true,
    );
