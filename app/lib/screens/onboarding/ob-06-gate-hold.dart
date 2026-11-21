// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'gate_view.dart';
import 'onboarding_views.dart';

/// Canvas `ob-06-gate-hold`: Gate: press and hold.
Widget build_ob_06_gate_hold(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'ob-06-gate-hold',
    state: state,
    normal: const GateView(variant: GateVariant.hold),
  );
}
