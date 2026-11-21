// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'profile_view.dart';

/// Canvas `pr-04-profile-sound-off`: profile with sound off and captions.
Widget build_pr_04_profile_sound_off(BuildContext context, ScreenState state) =>
    ProfileScreen(key: const Key('screen-pr-04-profile-sound-off'), state: state, layout: ProfileLayout.tab, previewSound: false);
