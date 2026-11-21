// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'home_screen.dart';

/// Canvas `app-05-home`: Home. Real Home; the gallery opens this variant, real data otherwise.
Widget build_app_05_home(BuildContext context, ScreenState state) => HomeScreen(
      screenKey: const Key('screen-app-05-home'),
      forced: state == ScreenState.normal ? ScreenState.normal : state,
      forceHint: false,
    );
