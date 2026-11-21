// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'parent_settings_view.dart';

/// Canvas `app-19-parent-settings`: age band, region, sound, narration, PIN, device mode,
/// export, delete and sign out for one child. Route `/parent/settings` (`?child=<id>`).
Widget build_app_19_parent_settings(BuildContext context, ScreenState state) =>
    ParentSettingsView(key: const Key('screen-app-19-parent-settings'), state: state);
