// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'progress_view.dart';

/// Canvas `pr-01-progress-empty`: nothing played yet.
Widget build_pr_01_progress_empty(BuildContext context, ScreenState state) =>
    const ProgressScreen(key: Key('screen-pr-01-progress-empty'), variant: ProgressVariant.empty);
