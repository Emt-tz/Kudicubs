// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'wallet_view.dart';

/// Canvas `wl-03-error`: Wallet could not load; Try again replays queued writes and reloads.
Widget build_wl_03_error(BuildContext context, ScreenState state) =>
    const WalletScreen(key: Key('screen-wl-03-error'), variant: WalletVariant.error);
