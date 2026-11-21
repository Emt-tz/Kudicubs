// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'email_screen.dart';

/// Canvas `au-16-forgot-pin`. Real behaviour lives in email_screen.dart; the gallery `state` shows the designed variant.
Widget build_au_16_forgot_pin(BuildContext context, ScreenState state) => EmailScreen(mode: EmailMode.recovery, demo: state);
