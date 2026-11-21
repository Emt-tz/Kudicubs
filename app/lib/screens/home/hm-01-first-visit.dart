// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'home_screen.dart';

/// Canvas `hm-01-first-visit`: Home, first visit. Real Home; the gallery opens this variant, real data otherwise.
Widget build_hm_01_first_visit(BuildContext context, ScreenState state) => HomeScreen(
      screenKey: const Key('screen-hm-01-first-visit'),
      forced: state == ScreenState.normal ? ScreenState.empty : state,
      forceHint: false,
    );
