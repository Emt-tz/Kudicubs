// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'parent_child_view.dart';

/// Canvas `pa-05-child-no-play`: a child who has not played yet.
Widget build_pa_05_child_no_play(BuildContext context, ScreenState state) =>
    ParentChildView(key: const Key('screen-pa-05-child-no-play'), state: state, forceNoPlay: true);
