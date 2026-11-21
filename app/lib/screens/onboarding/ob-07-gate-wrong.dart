// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'gate_view.dart';
import 'onboarding_views.dart';

/// Canvas `ob-07-gate-wrong`: Gate: wrong answer.
Widget build_ob_07_gate_wrong(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'ob-07-gate-wrong',
    state: state,
    normal: const GateView(variant: GateVariant.wrong),
  );
}
