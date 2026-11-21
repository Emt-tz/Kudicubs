// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'profile_view.dart';

/// Canvas `app-16-profile`: nickname, avatar, sound, switch child.
Widget build_app_16_profile(BuildContext context, ScreenState state) =>
    ProfileScreen(key: const Key('screen-app-16-profile'), state: state);
