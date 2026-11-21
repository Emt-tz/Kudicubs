// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'parent_add_child_view.dart';

/// Canvas `pa-04-add-child-error`: Add a child with the "one thing to fix" message.
/// The same form shows this when the nickname is missing or the server refuses the child.
Widget build_pa_04_add_child_error(BuildContext context, ScreenState state) =>
    AddChildView(key: const Key('screen-pa-04-add-child-error'), state: state, startWithProblem: true);
