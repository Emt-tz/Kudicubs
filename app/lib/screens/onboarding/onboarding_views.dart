import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'onboarding_state.dart';

/// Path of the route currently shown, or null when not inside the router
/// (widget tests, gallery wrappers). Screens only navigate on their own flow route.
String? currentPath(BuildContext context) {
  try {
    return GoRouter.maybeOf(context)?.state.uri.path;
  } catch (_) {
    return null;
  }
}

/// Wraps a screen so it carries `Key('screen-<id>')` and honours the gallery
/// [state]: normal -> [normal], other states -> the shared state views.
Widget onboardingFrame({
  required String id,
  required ScreenState state,
  required Widget normal,
  VoidCallback? onRetry,
  bool loadingIsNormal = false,
}) {
  final showNormal =
      state == ScreenState.normal ||
      (loadingIsNormal && state == ScreenState.loading);
  return KeyedSubtree(
    key: Key('screen-$id'),
    child: showNormal
        ? normal
        : ScreenScaffold(
            child: ScreenStateView(
              state: state,
              normal: normal,
              onRetry: onRetry,
            ),
          ),
  );
}

// ---- Shared bits ---------------------------------------------------------------

TextStyle _heading(double size) => KcText.displayXl.copyWith(fontSize: size);

class _Page extends StatelessWidget {
  const _Page({
    required this.background,
    required this.padding,
    required this.child,
  });
  final Color background;
  final EdgeInsets padding;
  final Widget child;

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: background,
    body: SafeArea(
      child: Padding(padding: padding, child: child),
    ),
  );
}

/// Centered scroll area that never overflows on short phones.
class _Middle extends StatelessWidget {
  const _Middle({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => LayoutBuilder(
    builder: (context, box) => SingleChildScrollView(
      child: ConstrainedBox(
        constraints: BoxConstraints(minHeight: box.maxHeight),
        child: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: children),
        ),
      ),
    ),
  );
}

// ---- Welcome (Main) --------------------------------------------------------------

class WelcomeView extends StatelessWidget {
  const WelcomeView({super.key});

  @override
  Widget build(BuildContext context) => _Page(
    background: Kc.cream,
    padding: const EdgeInsets.fromLTRB(28, 24, 28, 20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Center(child: KudiLogo(width: 210)),
        Expanded(
          child: _Middle(
            children: [
              const KudiImage(KudiPose.wave, width: 250),
              const SizedBox(height: 12),
              Text(
                'Join the Pride!',
                style: _heading(40),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 300),
                child: Text(
                  'Play, learn and grow your money skills!',
                  style: KcText.bodyChild,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
        PrimaryButton(
          label: "Let's Go",
          onPressed: () => context.go('/intro/1'),
        ),
        const SizedBox(height: 8),
        Text(
          'Play. Earn. Roar!',
          style: KcText.caption.copyWith(fontSize: 14),
          textAlign: TextAlign.center,
        ),
      ],
    ),
  );
}

// ---- Splash ----------------------------------------------------------------------

class SplashView extends ConsumerStatefulWidget {
  const SplashView({super.key, this.autoRoute = true});

  /// When false the splash only renders (gallery, tests).
  final bool autoRoute;

  @override
  ConsumerState<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends ConsumerState<SplashView> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (widget.autoRoute) {
      _timer = Timer(const Duration(milliseconds: 1200), _route);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  /// Signed-in or already onboarded -> /home, otherwise -> /welcome.
  Future<void> _route() async {
    if (!mounted || currentPath(context) != '/splash') return;
    var signedIn = false;
    try {
      signedIn = (await ref.read(sessionProvider.future)) != null;
    } catch (_) {
      // Offline / storage trouble: fall back to the saved onboarding flag.
    }
    if (!mounted) return;
    final onboarded = ref.read(onboardedProvider);
    if (signedIn && !onboarded) {
      await ref.read(onboardedProvider.notifier).set(true);
    }
    if (!mounted) return;
    context.go(signedIn || onboarded ? '/home' : '/welcome');
  }

  @override
  Widget build(BuildContext context) => _Page(
    background: Kc.yellow,
    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
    child: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const KudiLogo(width: 240, on: LogoOn.yellow),
          const SizedBox(height: 28),
          const KudiImage(KudiPose.wave, width: 220),
          const SizedBox(height: 28),
          const SizedBox(
            width: 56,
            height: 56,
            child: CircularProgressIndicator(
              color: Kc.brown,
              backgroundColor: Kc.softGold,
              strokeWidth: 7,
              strokeCap: StrokeCap.round,
              semanticsLabel: 'Loading',
            ),
          ),
          const SizedBox(height: 28),
          Text(
            'Getting things ready...',
            style: KcText.title.copyWith(fontSize: 22, height: 1.2),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),
          Text('Play. Earn. Roar!', style: KcText.label.copyWith(fontSize: 15)),
        ],
      ),
    ),
  );
}

// ---- Intros ----------------------------------------------------------------------

class _IntroPage {
  const _IntroPage(
    this.color,
    this.pose,
    this.title,
    this.body, {
    this.coins = false,
  });
  final Color color;
  final KudiPose pose;
  final String title;
  final String body;
  final bool coins;
}

const _introPages = [
  _IntroPage(
    Kc.softGold,
    KudiPose.wave,
    'Play',
    'Short, fun missions with Kudi the Cub. No reading needed.',
  ),
  _IntroPage(
    Kc.peach,
    KudiPose.celebrate,
    'Earn',
    'Win pretend coins, XP and badges for every choice you make.',
    coins: true,
  ),
  _IntroPage(
    Kc.orange,
    KudiPose.fist,
    'Roar!',
    'Grow your money skills, share with friends and join the Pride.',
  ),
];

/// The three swipeable intro pages. [startPage] is 0..2.
class IntroView extends StatefulWidget {
  const IntroView({super.key, required this.startPage});
  final int startPage;

  @override
  State<IntroView> createState() => _IntroViewState();
}

class _IntroViewState extends State<IntroView> {
  late final PageController _controller = PageController(
    initialPage: widget.startPage,
  );
  late int _index = widget.startPage;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _finish() => context.go('/age');

  void _next() {
    if (_index >= _introPages.length - 1) {
      _finish();
    } else {
      _controller.nextPage(
        duration: const Duration(milliseconds: 320),
        curve: Curves.easeOutCubic,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final last = _index == _introPages.length - 1;
    return _Page(
      background: Kc.cream,
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 48,
            child: last
                ? null
                : Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _finish,
                      style: TextButton.styleFrom(
                        minimumSize: const Size(Kc.touchMin, Kc.touchMin),
                        foregroundColor: Kc.brown,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                      ),
                      child: Text(
                        'Skip',
                        style: KcText.label.copyWith(
                          fontSize: 18,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ),
          ),
          Expanded(
            child: PageView.builder(
              controller: _controller,
              itemCount: _introPages.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (context, i) => _IntroSlide(page: _introPages[i]),
            ),
          ),
          const SizedBox(height: 12),
          Center(
            child: ProgressDots(count: _introPages.length, index: _index),
          ),
          const SizedBox(height: 16),
          PrimaryButton(label: last ? "Let's go" : 'Next', onPressed: _next),
        ],
      ),
    );
  }
}

class _IntroSlide extends StatelessWidget {
  const _IntroSlide({required this.page});
  final _IntroPage page;

  Widget _coin(String t, double size, double font) => Container(
    width: size,
    height: size,
    alignment: Alignment.center,
    decoration: BoxDecoration(
      color: Kc.gold,
      shape: BoxShape.circle,
      border: Border.all(color: Kc.brown, width: 3),
    ),
    child: Text(t, style: KcText.displayXl.copyWith(fontSize: font, height: 1)),
  );

  @override
  Widget build(BuildContext context) => _Middle(
    children: [
      Container(
        width: 300,
        height: 300,
        decoration: BoxDecoration(
          color: page.color,
          shape: BoxShape.circle,
          border: Border.all(color: Kc.brown, width: 3),
        ),
        child: Stack(
          alignment: Alignment.center,
          children: [
            KudiImage(page.pose, width: 230),
            if (page.coins) ...[
              Positioned(left: 18, top: 30, child: _coin('K', 52, 22)),
              Positioned(right: 14, bottom: 44, child: _coin('K', 44, 18)),
            ],
          ],
        ),
      ),
      const SizedBox(height: 18),
      Text(page.title, style: _heading(40), textAlign: TextAlign.center),
      const SizedBox(height: 18),
      ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 300),
        child: Text(
          page.body,
          style: KcText.bodyChild,
          textAlign: TextAlign.center,
        ),
      ),
    ],
  );
}

// ---- Kudi speech header (age + avatar) ---------------------------------------------

class _KudiAsks extends StatelessWidget {
  const _KudiAsks({required this.text, this.pose = KudiPose.wave});
  final String text;
  final KudiPose pose;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      KudiImage(pose, width: 96),
      const SizedBox(width: 12),
      Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Kc.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Kc.brown, width: 2),
          ),
          child: Text(text, style: KcText.headline.copyWith(height: 1.1)),
        ),
      ),
    ],
  );
}

// ---- Age band -----------------------------------------------------------------------

const _ageSubtitles = {
  AgeBand.b4_6: 'Pictures and sounds',
  AgeBand.b7_9: 'Build and grow',
  AgeBand.b10_12: 'Founder mode',
  AgeBand.b13_15: 'Side Hustle',
};

class AgeView extends ConsumerWidget {
  const AgeView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chosen = ref.watch(pendingChildProvider).ageBand;
    return _Page(
      background: Kc.cream,
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _KudiAsks(text: 'How old are you?'),
          const SizedBox(height: 12),
          Expanded(
            child: SingleChildScrollView(
              child: GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                childAspectRatio: 1.09,
                padding: const EdgeInsets.only(bottom: 8),
                children: [
                  for (final band in AgeBand.values)
                    _AgeCard(
                      band: band,
                      selected: band == chosen,
                      onTap: () => ref
                          .read(pendingChildProvider.notifier)
                          .setAgeBand(band),
                    ),
                ],
              ),
            ),
          ),
          Text(
            'A grown-up can change this later in the parent area.',
            textAlign: TextAlign.center,
            style: KcText.caption.copyWith(fontSize: 15),
          ),
          const SizedBox(height: 16),
          PrimaryButton(label: 'Next', onPressed: () => context.go('/avatar')),
        ],
      ),
    );
  }
}

class _AgeCard extends StatelessWidget {
  const _AgeCard({
    required this.band,
    required this.selected,
    required this.onTap,
  });
  final AgeBand band;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    label: 'Age ${band.label}, ${_ageSubtitles[band]}',
    excludeSemantics: true,
    child: GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: selected ? Kc.softGold : Kc.white,
          borderRadius: BorderRadius.circular(Kc.rLg),
          border: Border.all(color: Kc.brown, width: 3),
          boxShadow: selected
              ? const [BoxShadow(color: Kc.brown, offset: Offset(0, 5))]
              : null,
        ),
        alignment: Alignment.center,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(band.label, style: _heading(40)),
            const SizedBox(height: 4),
            Text(
              _ageSubtitles[band]!,
              textAlign: TextAlign.center,
              style: KcText.label.copyWith(
                fontSize: 15,
                color: selected ? Kc.brown : Kc.brown80,
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

// ---- Avatar and nickname ----------------------------------------------------------------

const _avatarColors = [Kc.yellow, Kc.orange, Kc.peach, Kc.brown80];

/// Avatar + nickname picker. When [startEmpty] the screen opens in the
/// "nothing chosen" validation state (ob-05) until the child picks something.
class AvatarView extends ConsumerStatefulWidget {
  const AvatarView({super.key, this.startEmpty = false});
  final bool startEmpty;

  @override
  ConsumerState<AvatarView> createState() => _AvatarViewState();
}

class _AvatarViewState extends ConsumerState<AvatarView> {
  late bool _fresh = widget.startEmpty;

  Future<void> _pickAvatar(String id) async {
    final n = ref.read(pendingChildProvider.notifier);
    if (_fresh) {
      _fresh = false;
      await n.clear();
    }
    await n.setAvatar(id);
  }

  Future<void> _pickName(String name) =>
      ref.read(pendingChildProvider.notifier).setNickname(name);

  @override
  Widget build(BuildContext context) {
    final child = _fresh
        ? const PendingChild()
        : ref.watch(pendingChildProvider);
    final issue = validatePendingChild(child);
    final noAvatar = child.avatar == null;
    return _Page(
      background: Kc.cream,
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const _KudiAsks(text: 'Pick your friend', pose: KudiPose.thumbsUp),
          const SizedBox(height: 16),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 1.35,
                    children: [
                      for (var i = 0; i < avatarIds.length; i++)
                        _AvatarCard(
                          index: i,
                          selected: child.avatar == avatarIds[i],
                          onTap: () => _pickAvatar(avatarIds[i]),
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Choose a name',
                    style: KcText.title.copyWith(
                      fontSize: 22,
                      color: noAvatar ? Kc.brown80 : Kc.brown,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Opacity(
                    opacity: noAvatar ? 0.6 : 1,
                    child: Wrap(
                      spacing: 10,
                      runSpacing: 10,
                      children: [
                        for (final name in nicknameChoices)
                          _NameChip(
                            name: name,
                            selected: child.nickname == name,
                            onTap: noAvatar ? null : () => _pickName(name),
                          ),
                      ],
                    ),
                  ),
                  if (!noAvatar) ...[
                    const SizedBox(height: 10),
                    Text(
                      'Names come from a short list. No real names, no photos.',
                      style: KcText.caption.copyWith(fontSize: 15),
                    ),
                  ],
                ],
              ),
            ),
          ),
          if (issue != AvatarIssue.none) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.error_outline_rounded,
                  color: Kc.brown,
                  size: 24,
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    issue == AvatarIssue.noAvatar
                        ? 'Pick a friend first'
                        : 'Choose a name first',
                    key: const Key('avatar-issue'),
                    style: KcText.label.copyWith(
                      fontSize: 17,
                      fontVariations: const [FontVariation('wght', 800)],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
          _ThatsMe(enabled: issue == AvatarIssue.none),
        ],
      ),
    );
  }
}

class _ThatsMe extends StatelessWidget {
  const _ThatsMe({required this.enabled});
  final bool enabled;

  @override
  Widget build(BuildContext context) => enabled
      ? PrimaryButton(label: "That's me!", onPressed: () => context.go('/gate'))
      : Semantics(
          button: true,
          enabled: false,
          label: "That's me!",
          excludeSemantics: true,
          child: Opacity(
            opacity: 0.7,
            child: Container(
              height: Kc.buttonHeight,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Kc.creamShade,
                borderRadius: BorderRadius.circular(Kc.rPill),
                border: Border.all(color: Kc.brown, width: Kc.border),
              ),
              child: Text(
                "That's me!",
                style: KcText.button.copyWith(color: Kc.brown80),
              ),
            ),
          ),
        );
}

class _AvatarCard extends StatelessWidget {
  const _AvatarCard({
    required this.index,
    required this.selected,
    required this.onTap,
  });
  final int index;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    label: selected ? 'Friend ${index + 1}, chosen' : 'Friend ${index + 1}',
    excludeSemantics: true,
    child: GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: selected ? Kc.softGold : Kc.white,
          borderRadius: BorderRadius.circular(Kc.rLg),
          border: Border.all(color: Kc.brown, width: selected ? 4 : 3),
          boxShadow: selected
              ? const [BoxShadow(color: Kc.brown, offset: Offset(0, 5))]
              : null,
        ),
        alignment: Alignment.center,
        child: Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            color: _avatarColors[index],
            shape: BoxShape.circle,
            border: Border.all(color: Kc.brown, width: 3),
          ),
        ),
      ),
    ),
  );
}

class _NameChip extends StatelessWidget {
  const _NameChip({
    required this.name,
    required this.selected,
    required this.onTap,
  });
  final String name;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    selected: selected,
    enabled: onTap != null,
    label: name,
    excludeSemantics: true,
    child: GestureDetector(
      onTap: onTap,
      child: Container(
        constraints: const BoxConstraints(minHeight: 52, minWidth: Kc.touchMin),
        padding: const EdgeInsets.symmetric(horizontal: 22),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? Kc.softGold : Kc.white,
          borderRadius: BorderRadius.circular(Kc.rPill),
          border: Border.all(color: Kc.brown, width: 2),
        ),
        child: Text(
          name,
          style: KcText.label.copyWith(
            fontSize: 18,
            fontVariations: const [FontVariation('wght', 800)],
          ),
        ),
      ),
    ),
  );
}
