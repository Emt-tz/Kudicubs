// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'parent_children_view.dart';

/// Canvas `pa-01-children-empty`: Children empty: no child added yet.
Widget build_pa_01_children_empty(BuildContext context, ScreenState state) =>
    const ParentChildrenView(key: Key('screen-pa-01-children-empty'), look: ChildrenLook.empty);
