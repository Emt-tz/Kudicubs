// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'wallet_view.dart';

/// Canvas `app-14-wallet`: Wallet. Real balances and history; follows [state] for the gallery.
Widget build_app_14_wallet(BuildContext context, ScreenState state) =>
    WalletScreen(key: const Key('screen-app-14-wallet'), state: state);
