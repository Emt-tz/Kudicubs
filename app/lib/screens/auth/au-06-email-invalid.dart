// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'email_screen.dart';

/// Canvas `au-06-email-invalid`. Real behaviour lives in email_screen.dart; the gallery `state` shows the designed variant.
Widget build_au_06_email_invalid(BuildContext context, ScreenState state) => EmailScreen(mode: EmailMode.signup, forced: EmailView.invalid, demo: state);
