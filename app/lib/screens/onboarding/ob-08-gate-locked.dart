// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'gate_view.dart';
import 'onboarding_views.dart';

/// Canvas `ob-08-gate-locked`: Gate: wait 60 s and retry.
Widget build_ob_08_gate_locked(BuildContext context, ScreenState state) {
  return onboardingFrame(
    id: 'ob-08-gate-locked',
    state: state,
    normal: const GateView(variant: GateVariant.locked),
  );
}
