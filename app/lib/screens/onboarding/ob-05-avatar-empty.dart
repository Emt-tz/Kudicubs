// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'onboarding_views.dart';

/// Canvas `ob-05-avatar-empty`: Avatar: nothing chosen (validation state).
Widget build_ob_05_avatar_empty(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'ob-05-avatar-empty',
    state: state,
    normal: const AvatarView(startEmpty: true),
  );
}
