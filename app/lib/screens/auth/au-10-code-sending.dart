// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'auth_state.dart';
import 'code_screen.dart';

/// Canvas `au-10-code-sending`. Real behaviour lives in code_screen.dart; the gallery `state` shows the designed variant.
Widget build_au_10_code_sending(BuildContext context, ScreenState state) => CodeScreen(forced: CodePhase.verifying, demo: state);
