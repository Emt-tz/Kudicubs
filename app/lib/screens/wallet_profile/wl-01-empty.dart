// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'wallet_view.dart';

/// Canvas `wl-01-empty`: Wallet, nothing earned yet.
Widget build_wl_01_empty(BuildContext context, ScreenState state) =>
    const WalletScreen(key: Key('screen-wl-01-empty'), variant: WalletVariant.empty);
