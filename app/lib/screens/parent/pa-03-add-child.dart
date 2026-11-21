// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'parent_add_child_view.dart';

/// Canvas `pa-03-add-child`: Add a child. Real form: nickname, age band, country; saves to `child_profiles`.
Widget build_pa_03_add_child(BuildContext context, ScreenState state) =>
    AddChildView(key: const Key('screen-pa-03-add-child'), state: state);
