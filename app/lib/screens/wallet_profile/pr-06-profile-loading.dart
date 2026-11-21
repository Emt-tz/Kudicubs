// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'profile_view.dart';

/// Canvas `pr-06-profile-loading`: profile skeleton.
Widget build_pr_06_profile_loading(BuildContext context, ScreenState state) =>
    const ProfileSkeleton(key: Key('screen-pr-06-profile-loading'));
