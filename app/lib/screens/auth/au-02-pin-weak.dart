// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'pin_screen.dart';

/// Canvas `au-02-pin-weak`. Real behaviour lives in pin_screen.dart; the gallery `state` shows the designed variant.
Widget build_au_02_pin_weak(BuildContext context, ScreenState state) => PinScreen(forced: PinView.weak, demo: state);
