// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'onboarding_views.dart';

/// Canvas `app-03-avatar`: Avatar and nickname.
Widget build_app_03_avatar(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'app-03-avatar',
    state: state,
    normal: const AvatarView(),
  );
}
