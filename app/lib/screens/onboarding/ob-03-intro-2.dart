// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'onboarding_views.dart';

/// Canvas `ob-03-intro-2`: Intro 2: Earn.
Widget build_ob_03_intro_2(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'ob-03-intro-2',
    state: state,
    normal: const IntroView(startPage: 1),
  );
}
