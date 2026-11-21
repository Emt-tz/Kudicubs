// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'auth_state.dart';
import 'code_screen.dart';

/// Canvas `au-09-code-expired`. Real behaviour lives in code_screen.dart; the gallery `state` shows the designed variant.
Widget build_au_09_code_expired(BuildContext context, ScreenState state) => CodeScreen(forced: CodePhase.expired, demo: state);
