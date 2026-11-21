// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'onboarding_views.dart';

/// Canvas `ob-01-splash`: Splash: checks the session and onboarding flag, then routes to /welcome or /home.
Widget build_ob_01_splash(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'ob-01-splash',
    state: state,
    loadingIsNormal: true,
    normal: const SplashView(),
  );
}
