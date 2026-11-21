// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'system_view.dart';

/// Canvas `sy-04-no-connection`. System screen, wired to the router's systemStatusProvider with retry.
Widget build_sy_04_no_connection(BuildContext context, ScreenState state) =>
    SystemView(screenKey: const Key('screen-sy-04-no-connection'), kind: SystemKind.noConnection, state: state);
