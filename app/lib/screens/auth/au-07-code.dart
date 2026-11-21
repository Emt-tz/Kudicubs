// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'auth_state.dart';
import 'code_screen.dart';

/// Canvas `au-07-code`. Real behaviour lives in code_screen.dart; the gallery `state` shows the designed variant.
Widget build_au_07_code(BuildContext context, ScreenState state) => CodeScreen(forced: CodePhase.idle, demo: state);
