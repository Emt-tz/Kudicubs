// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'auth_state.dart';
import 'code_screen.dart';

/// Canvas `au-08-code-wrong`. Real behaviour lives in code_screen.dart; the gallery `state` shows the designed variant.
Widget build_au_08_code_wrong(BuildContext context, ScreenState state) => CodeScreen(forced: CodePhase.wrong, demo: state);
