// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'onboarding_views.dart';

/// Canvas `Main`: Welcome.
Widget build_Main(BuildContext context, ScreenState state) {
  return onboardingFrame(id: 'Main', state: state, normal: const WelcomeView());
}
