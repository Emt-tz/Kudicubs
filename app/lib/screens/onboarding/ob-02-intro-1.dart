// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'onboarding_views.dart';

/// Canvas `ob-02-intro-1`: Intro 1: Play.
Widget build_ob_02_intro_1(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'ob-02-intro-1',
    state: state,
    normal: const IntroView(startPage: 0),
  );
}
