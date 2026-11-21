// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'parent_settings_view.dart';

/// Canvas `pa-06-settings-saved`: the settings rows with the "Saved" confirmation showing.
Widget build_pa_06_settings_saved(BuildContext context, ScreenState state) => ParentSettingsView(
  key: const Key('screen-pa-06-settings-saved'),
  state: state,
  look: SettingsLook.rows,
  startSaved: true,
);
