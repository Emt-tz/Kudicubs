import 'dart:async';
import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart' show AuthException, AuthRetryableFetchException, PostgrestException;

/// PINs the `set_pin` RPC refuses (supabase/migrations: `pin_weak`). Keep in sync.
const weakPins = {'0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '1234', '4321', '0123'};

enum PinIssue { format, weak }

/// Same rules as the `set_pin` function: exactly 4 digits, and not a guessable one.
PinIssue? validatePin(String pin) {
  if (!RegExp(r'^[0-9]{4}$').hasMatch(pin)) return PinIssue.format;
  if (weakPins.contains(pin)) return PinIssue.weak;
  return null;
}

/// Maps the RPC's `pin_weak` / `pin_format` exceptions to an issue (null = some other error).
PinIssue? pinIssueFromError(Object e) {
  final text = e is PostgrestException ? '${e.message} ${e.details ?? ''}' : e.toString();
  if (text.contains('pin_weak')) return PinIssue.weak;
  if (text.contains('pin_format')) return PinIssue.format;
  return null;
}

final _emailRe = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s.]{2,}$');

bool isValidEmail(String email) => _emailRe.hasMatch(email.trim());

/// How long an emailed code works.
const codeLifetime = Duration(minutes: 10);

/// Wrong tries allowed per code before the screen asks for a new one.
const maxCodeTries = 3;

enum AuthFailure { wrongCode, expiredCode, offline, tooManyAttempts, noAccount, unknown }

bool isNetworkError(Object e) {
  if (e is SocketException || e is TimeoutException || e is AuthRetryableFetchException) return true;
  final t = e.toString();
  return t.contains('SocketException') || t.contains('ClientException') || t.contains('Failed host lookup');
}

/// Turns anything thrown by sign-in into one of the designed states.
/// The server answers "expired or invalid" for both, so [codeSentAt] decides which one it was.
AuthFailure mapAuthError(Object e, {DateTime? codeSentAt, DateTime? now}) {
  if (isNetworkError(e)) return AuthFailure.offline;
  if (e is AuthException) {
    final code = e.code ?? '';
    final msg = e.message.toLowerCase();
    if (e.statusCode == '429' || code.contains('rate_limit') || msg.contains('rate limit') || msg.contains('too many')) {
      return AuthFailure.tooManyAttempts;
    }
    if (code == 'otp_disabled' || msg.contains('signups not allowed') || code == 'user_not_found') return AuthFailure.noAccount;
    if (code == 'otp_expired' || msg.contains('expired') || msg.contains('invalid')) {
      final sent = codeSentAt;
      final expired = sent != null && (now ?? DateTime.now()).difference(sent) >= codeLifetime;
      return expired ? AuthFailure.expiredCode : AuthFailure.wrongCode;
    }
  }
  return AuthFailure.unknown;
}

/// `0:30`, `1:05`.
String formatCooldown(int seconds) {
  final s = seconds < 0 ? 0 : seconds;
  return '${s ~/ 60}:${(s % 60).toString().padLeft(2, '0')}';
}

/// "4:12 pm" for the expired-code screen.
String formatClock(DateTime t) {
  final h = t.hour % 12 == 0 ? 12 : t.hour % 12;
  return '$h:${t.minute.toString().padLeft(2, '0')} ${t.hour >= 12 ? 'pm' : 'am'}';
}
