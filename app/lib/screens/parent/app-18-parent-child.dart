// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'parent_child_view.dart';

/// Canvas `app-18-parent-child`: one child's level, wallet, skills, badges and recent play.
/// Route `/parent/child/:id`; shows the "has not played yet" design (pa-05) when there is no play.
Widget build_app_18_parent_child(BuildContext context, ScreenState state) =>
    ParentChildView(key: const Key('screen-app-18-parent-child'), state: state);
