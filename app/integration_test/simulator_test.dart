// T031: runs on the booted iOS simulator against the real local backend.
//   flutter test integration_test/simulator_test.dart -d <simulator>
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:kudicubs/app.dart';
import 'package:kudicubs/core/data/providers.dart';
import 'package:kudicubs/core/router.dart';
import 'package:kudicubs/core/screen_state.dart';
import 'package:kudicubs/screens/registry.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

const api = 'http://127.0.0.1:56321';
const mail = 'http://127.0.0.1:56324';
const anon = String.fromEnvironment('ANON');

Future<String> latestCode(String email) async {
  final c = HttpClient();
  for (var i = 0; i < 20; i++) {
    final r = await (await c.getUrl(Uri.parse('$mail/api/v1/search?query=${Uri.encodeQueryComponent('to:$email')}&limit=1'))).close();
    final j = jsonDecode(await r.transform(utf8.decoder).join()) as Map;
    final msgs = (j['messages'] as List);
    if (msgs.isNotEmpty) {
      final id = msgs.first['ID'];
      final m = await (await c.getUrl(Uri.parse('$mail/api/v1/message/$id'))).close();
      final body = jsonDecode(await m.transform(utf8.decoder).join()) as Map;
      final code = RegExp(r'\b(\d{6})\b').firstMatch('${body['Text']}')?.group(1);
      if (code != null) return code;
    }
    await Future<void>.delayed(const Duration(seconds: 1));
  }
  throw StateError('no code for $email');
}

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('real sign-in, children load from backend, all 108 screens render on device', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    await Supabase.initialize(url: api, publishableKey: anon);
    final auth = Supabase.instance.client.auth;
    await auth.signInWithOtp(email: 'parent@example.com');
    await Future<void>.delayed(const Duration(seconds: 2));
    final res = await auth.verifyOTP(email: 'parent@example.com', token: await latestCode('parent@example.com'), type: OtpType.email);
    expect(res.session, isNotNull);

    final rows = await Supabase.instance.client.from('child_profiles').select('nickname');
    expect((rows as List).length, greaterThanOrEqualTo(4));

    final container = ProviderContainer(overrides: [sharedPrefsProvider.overrideWithValue(prefs)]);
    addTearDown(container.dispose);
    await container.read(onboardedProvider.notifier).set(true);
    await tester.pumpWidget(UncontrolledProviderScope(container: container, child: const KudiCubsApp()));
    await tester.pump(const Duration(seconds: 2));
    final router = container.read(routerProvider);

    await binding.convertFlutterSurfaceToImage();
    var shots = 0;
    for (final id in registry.keys) {
      for (final st in [ScreenState.normal, ScreenState.error]) {
        router.go('/screen/$id?state=${st.name}');
        await tester.pump(const Duration(milliseconds: 500));
        await tester.pump(const Duration(milliseconds: 500));
        expect(find.byKey(Key('screen-$id')), findsAtLeastNWidgets(1), reason: '$id/${st.name}');
        expect(tester.takeException(), isNull, reason: '$id/${st.name}');
      }
      if (shots++ % 12 == 0) await binding.takeScreenshot('screen-$id');
    }
    expect(registry.length, 108);
  });
}
