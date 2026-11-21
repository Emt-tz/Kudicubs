// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'email_screen.dart';

/// Canvas `au-14-signin-sending`. Real behaviour lives in email_screen.dart; the gallery `state` shows the designed variant.
Widget build_au_14_signin_sending(BuildContext context, ScreenState state) => EmailScreen(mode: EmailMode.signin, forced: EmailView.sending, demo: state);
