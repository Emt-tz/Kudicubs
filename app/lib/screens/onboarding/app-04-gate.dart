// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'gate_view.dart';
import 'onboarding_views.dart';

/// Canvas `app-04-gate`: Gate: maths question. On the /gate route it starts with the hold step.
Widget build_app_04_gate(BuildContext context, ScreenState state) {
  // On the real /gate route the flow starts with press-and-hold; in the gallery it shows the question.
  final inFlow = currentPath(context)?.startsWith('/gate') ?? false;
  return onboardingFrame(
    id: 'app-04-gate',
    state: state,
    normal: GateView(variant: inFlow ? null : GateVariant.question),
  );
}
