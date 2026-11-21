// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'onboarding_views.dart';

/// Canvas `ob-04-intro-3`: Intro 3: Roar.
Widget build_ob_04_intro_3(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'ob-04-intro-3',
    state: state,
    normal: const IntroView(startPage: 2),
  );
}
