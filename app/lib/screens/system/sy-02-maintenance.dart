// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'system_view.dart';

/// Canvas `sy-02-maintenance`. System screen, wired to the router's systemStatusProvider with retry.
Widget build_sy_02_maintenance(BuildContext context, ScreenState state) =>
    SystemView(screenKey: const Key('screen-sy-02-maintenance'), kind: SystemKind.maintenance, state: state);
