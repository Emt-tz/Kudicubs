// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'progress_view.dart';

/// Canvas `pr-03-badge-earned`: detail of an earned badge.
Widget build_pr_03_badge_earned(BuildContext context, ScreenState state) =>
    BadgeDetailScreen(key: const Key('screen-pr-03-badge-earned'), earned: true, state: state);
