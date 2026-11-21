// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'onboarding_views.dart';

/// Canvas `app-02-age`: Age band.
Widget build_app_02_age(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'app-02-age',
    state: state,
    normal: const AgeView(),
  );
}
