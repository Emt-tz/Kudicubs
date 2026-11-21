import 'package:flutter/widgets.dart';

/// The designed variants of a screen. Real behaviour sets these naturally;
/// the gallery (`/screen/:id?state=`) forces one so each design can be checked.
enum ScreenState { normal, loading, empty, error, offline }

typedef ScreenBuilder = Widget Function(BuildContext context, ScreenState state);
