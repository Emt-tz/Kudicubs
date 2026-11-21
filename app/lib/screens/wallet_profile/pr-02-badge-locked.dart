// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'progress_view.dart';

/// Canvas `pr-02-badge-locked`: detail of a badge not earned yet.
Widget build_pr_02_badge_locked(BuildContext context, ScreenState state) =>
    BadgeDetailScreen(key: const Key('screen-pr-02-badge-locked'), earned: false, state: state);
