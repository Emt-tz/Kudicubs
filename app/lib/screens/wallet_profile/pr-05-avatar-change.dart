// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'profile_view.dart';

/// Canvas `pr-05-avatar-change`: pick a new friend; saved to child_profiles.
Widget build_pr_05_avatar_change(BuildContext context, ScreenState state) =>
    AvatarPickerScreen(key: const Key('screen-pr-05-avatar-change'), state: state);
