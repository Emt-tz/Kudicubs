// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'home_screen.dart';

/// Canvas `hm-05-error`: Home, could not load. Real Home; the gallery opens this variant, real data otherwise.
Widget build_hm_05_error(BuildContext context, ScreenState state) => HomeScreen(
      screenKey: const Key('screen-hm-05-error'),
      forced: state == ScreenState.normal ? ScreenState.error : state,
      forceHint: false,
    );
