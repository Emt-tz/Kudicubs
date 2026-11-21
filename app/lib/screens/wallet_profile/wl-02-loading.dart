// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import 'wallet_view.dart';

/// Canvas `wl-02-loading`: Wallet skeleton while balances load.
Widget build_wl_02_loading(BuildContext context, ScreenState state) =>
    const WalletScreen(key: Key('screen-wl-02-loading'), variant: WalletVariant.loading);
