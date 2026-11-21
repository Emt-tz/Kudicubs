// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'system_view.dart';

/// Canvas `sy-01-update-required`. System screen, wired to the router's systemStatusProvider with retry.
Widget build_sy_01_update_required(BuildContext context, ScreenState state) =>
    SystemView(screenKey: const Key('screen-sy-01-update-required'), kind: SystemKind.updateRequired, state: state);
