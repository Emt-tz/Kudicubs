// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'parent_children_view.dart';

/// Canvas `pa-02-children-loading`: Children loading: skeleton tiles while the list loads.
Widget build_pa_02_children_loading(BuildContext context, ScreenState state) =>
    const ParentChildrenView(key: Key('screen-pa-02-children-loading'), look: ChildrenLook.loading);
