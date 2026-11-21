import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

/// A small durable queue of JSON rows kept in shared_preferences.
/// Rows carry client-generated ids, so replaying one twice is harmless.
class Outbox {
  Outbox(this._prefs, this._key);

  final SharedPreferences _prefs;
  final String _key;

  List<Map<String, dynamic>> items() => (_prefs.getStringList(_key) ?? const [])
      .map((s) => jsonDecode(s) as Map<String, dynamic>)
      .toList();

  int get length => (_prefs.getStringList(_key) ?? const []).length;

  Future<void> add(Map<String, dynamic> row) =>
      _prefs.setStringList(_key, [...(_prefs.getStringList(_key) ?? const []), jsonEncode(row)]);

  Future<void> _save(List<Map<String, dynamic>> rows) =>
      _prefs.setStringList(_key, rows.map(jsonEncode).toList());

  /// Sends rows in order with [send]; stops at the first failure and keeps the rest.
  /// Returns how many rows were delivered.
  Future<int> flush(Future<void> Function(Map<String, dynamic> row) send) async {
    final rows = items();
    var sent = 0;
    for (final row in rows) {
      try {
        await send(row);
        sent++;
      } catch (_) {
        break;
      }
    }
    if (sent > 0) await _save(rows.sublist(sent));
    return sent;
  }
}
