import 'narrator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../screens/parent/parent_pin_entry.dart';
import '../screens/registry.dart';
import 'data/providers.dart';
import 'screen_state.dart';
import 'screens_index_page.dart';
import 'theme/theme.dart';

/// Flow route -> canvas id. Add real navigation with `context.go('/wallet')` etc.;
/// to point a route at another screen change the id here (keep tool/gen_screens.py FLOW_ROUTES in sync).
const flowScreens = <String, String>{
  '/splash': 'ob-01-splash',
  '/welcome': 'Main',
  '/intro/1': 'ob-02-intro-1',
  '/intro/2': 'ob-03-intro-2',
  '/intro/3': 'ob-04-intro-3',
  '/age': 'app-02-age',
  '/avatar': 'app-03-avatar',
  '/gate': 'app-04-gate',
  '/pin/create': 'au-01-pin-create',
  '/region': 'au-04-region',
  '/email': 'au-05-email',
  '/code': 'au-07-code',
  '/joined': 'au-12-joined',
  '/signin': 'au-13-signin',
  '/home': 'app-05-home',
  '/daily': 'hm-06-daily-progress',
  '/wallet': 'app-14-wallet',
  '/progress': 'app-15-progress',
  '/badges': 'pr-03-badge-earned',
  '/profile': 'app-16-profile',
  '/parent': 'app-17-parent-children',
  '/parent/child/:id': 'app-18-parent-child',
  '/parent/settings': 'app-19-parent-settings',
};

/// `/mission/:band` where band is 4-6 | 7-9 | 10-12 | 13-15.
const missionIntros = <String, String>{
  '4-6': 'app-06-mission-intro',
  '7-9': 'ms-10-7-9-intro',
  '10-12': 'ms-15-10-12-intro',
  '13-15': 'ms-23-13-15-intro',
};

/// `/system/:kind`.
const systemScreens = <String, String>{
  'update-required': 'sy-01-update-required',
  'maintenance': 'sy-02-maintenance',
  'server-error': 'sy-03-server-error',
  'no-connection': 'sy-04-no-connection',
  'loading': 'sy-05-loading-generic',
  'empty': 'sy-06-empty-generic',
};

/// Routes a not-yet-onboarded family may open.
const _openWhenNew = ['/splash', '/welcome', '/intro', '/age', '/avatar', '/gate', '/pin', '/region', '/email', '/code', '/joined', '/signin', '/system', '/screen'];

/// Routes that need the network (offline sends them to the no-connection screen).
const _needsNetwork = ['/email', '/code', '/signin', '/parent'];

bool _under(String path, List<String> roots) => roots.any((r) => path == r || path.startsWith('$r/'));

/// Pure redirect rules, kept separate from Riverpod so they are easy to test.
String? redirectFor({
  required Uri uri,
  required bool onboarded,
  required bool parentUnlocked,
  required SystemStatus status,
  required bool online,
  bool signedIn = true,
}) {
  final path = uri.path;
  if (path.startsWith('/screen')) return null; // debug gallery and index are never guarded
  final systemTarget = switch (status) {
    SystemStatus.maintenance => '/system/maintenance',
    SystemStatus.updateRequired => '/system/update-required',
    SystemStatus.serverError => '/system/server-error',
    SystemStatus.ok => null,
  };
  if (systemTarget != null) return path == systemTarget ? null : systemTarget;
  if (!online && _under(path, _needsNetwork)) return '/system/no-connection';
  if ((!onboarded || !signedIn) && !_under(path, _openWhenNew)) return '/welcome';
  if (_under(path, ['/parent']) && !parentUnlocked) {
    return Uri(path: '/gate', queryParameters: {'next': uri.toString()}).toString();
  }
  return null;
}

Widget _screen(String id, ScreenState state, BuildContext context) {
  final builder = registry[id];
  if (builder == null) return Scaffold(body: Center(child: Text('Unknown screen: $id')));
  return NarrateOnShow(screenId: id, child: builder(context, state));
}

ScreenState _stateParam(String? s) =>
    ScreenState.values.firstWhere((v) => v.name == s, orElse: () => ScreenState.normal);

bool _hasSession(Ref ref) {
  try {
    return ref.read(supabaseClientProvider).auth.currentSession != null;
  } catch (_) {
    return true;
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final refresh = ValueNotifier<int>(0);
  void bump(Object? a, Object? b) => refresh.value++;
  ref.listen(onboardedProvider, bump);
  ref.listen(parentUnlockedProvider, bump);
  ref.listen(systemStatusProvider, bump);
  ref.listen(onlineProvider, bump);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/splash',
    refreshListenable: refresh,
    redirect: (context, state) => redirectFor(
      uri: state.uri,
      onboarded: ref.read(onboardedProvider),
      parentUnlocked: ref.read(parentUnlockedProvider),
      status: ref.read(systemStatusProvider),
      online: ref.read(onlineProvider),
      signedIn: _hasSession(ref),
    ),
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: Kc.cream,
      body: Center(child: Text('Page not found: ${state.uri}', style: KcText.bodyChild)),
    ),
    routes: [
      for (final e in flowScreens.entries)
        GoRoute(path: e.key, builder: (context, state) => _screen(e.value, ScreenState.normal, context)),
      GoRoute(
        path: '/mission/:band',
        builder: (context, state) {
          final id = missionIntros[state.pathParameters['band']] ?? missionIntros['4-6']!;
          return _screen(id, ScreenState.normal, context);
        },
      ),
      GoRoute(
        path: '/system/:kind',
        builder: (context, state) {
          final id = systemScreens[state.pathParameters['kind']] ?? systemScreens['server-error']!;
          return _screen(id, ScreenState.normal, context);
        },
      ),
      // Debug gallery: any registry entry, any state.  /screen/app-14-wallet?state=loading
      GoRoute(
        path: '/screen/:id',
        builder: (context, state) =>
            _screen(state.pathParameters['id']!, _stateParam(state.uri.queryParameters['state']), context),
      ),
      // Parent PIN entry, reached from the grown-up gate once the family is set up.
      GoRoute(
        path: '/parent-pin',
        builder: (context, state) => ParentPinEntry(next: state.uri.queryParameters['next'] ?? '/parent'),
      ),
      GoRoute(path: '/screens', builder: (context, state) => const ScreensIndexPage()),
    ],
  );
});
