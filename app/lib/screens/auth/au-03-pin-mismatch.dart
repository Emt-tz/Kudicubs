// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import '../../core/widgets/widgets.dart';

/// Canvas `au-03-pin-mismatch`: PIN does not match. Section: App 3. Parent setup: PIN, country, email.
/// Replace the body with the real screen; keep the signature and the key.
Widget build_au_03_pin_mismatch(BuildContext context, ScreenState state) {
  return const ScreenScaffold(
    key: Key('screen-au-03-pin-mismatch'),
    title: 'PIN does not match',
    child: Center(child: Text('TODO au-03-pin-mismatch')),
  );
}
