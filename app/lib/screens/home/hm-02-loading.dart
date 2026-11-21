// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'home_screen.dart';

/// Canvas `hm-02-loading`: Home, loading. Real Home; the gallery opens this variant, real data otherwise.
Widget build_hm_02_loading(BuildContext context, ScreenState state) => HomeScreen(
      screenKey: const Key('screen-hm-02-loading'),
      forced: state == ScreenState.normal ? ScreenState.loading : state,
      forceHint: false,
    );
