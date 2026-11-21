// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'system_view.dart';

/// Canvas `sy-03-server-error`. System screen, wired to the router's systemStatusProvider with retry.
Widget build_sy_03_server_error(BuildContext context, ScreenState state) =>
    SystemView(screenKey: const Key('screen-sy-03-server-error'), kind: SystemKind.serverError, state: state);
