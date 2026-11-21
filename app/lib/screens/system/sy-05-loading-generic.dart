// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'system_view.dart';

/// Canvas `sy-05-loading-generic`. System screen, wired to the router's systemStatusProvider with retry.
Widget build_sy_05_loading_generic(BuildContext context, ScreenState state) =>
    SystemView(screenKey: const Key('screen-sy-05-loading-generic'), kind: SystemKind.loading, state: state);
