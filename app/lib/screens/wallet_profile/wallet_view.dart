/// The wallet screen and its designed variants (empty, loading, error).
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'wallet_profile_logic.dart';
import 'wallet_profile_widgets.dart';

enum WalletVariant { auto, loading, empty, error }

/// Coins to spend and coins saved, plus the append-only history, from the real
/// repositories. [variant] pins one design; otherwise it follows [state] and real data.
class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key, this.state = ScreenState.normal, this.variant = WalletVariant.auto});

  final ScreenState state;
  final WalletVariant variant;

  static const _saveStep = 10;

  WalletVariant get _forced => variant != WalletVariant.auto
      ? variant
      : switch (state) {
          ScreenState.loading => WalletVariant.loading,
          ScreenState.empty => WalletVariant.empty,
          ScreenState.error => WalletVariant.error,
          _ => WalletVariant.auto,
        };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childAsync = ref.watch(currentChildProvider);
    final childId = childAsync.value?.id;
    Future<void> retry() => retryWalletLoad(ref, childId);

    final Widget body = switch (_forced) {
      WalletVariant.loading => const WalletSkeleton(),
      WalletVariant.empty => WalletEmpty(region: childAsync.value?.region),
      WalletVariant.error => WalletError(onRetry: retry),
      WalletVariant.auto => _live(context, ref, childAsync, retry),
    };
    return WpPage(nav: WpTab.wallet, child: body);
  }

  Widget _live(BuildContext context, WidgetRef ref, AsyncValue<Child?> childAsync, Future<void> Function() retry) {
    final offline = state == ScreenState.offline || !ref.watch(onlineProvider);
    return childAsync.when(
      loading: () => const WalletSkeleton(),
      error: (_, _) => WalletError(onRetry: retry),
      data: (child) {
        if (child == null) {
          return const _Title(child: EmptyView(title: 'No one is playing yet', message: 'Ask a grown-up to add you.'));
        }
        final bal = ref.watch(balancesProvider(child.id));
        final ev = ref.watch(walletEventsProvider(child.id));
        final balances = bal.value;
        if (balances == null) {
          return bal.hasError ? WalletError(onRetry: retry) : const WalletSkeleton();
        }
        final historyFailed = ev.value == null && ev.hasError;
        if (ev.value == null && !historyFailed) return const WalletSkeleton();
        final history = walletHistory(ev.value ?? const []);
        if (!historyFailed && history.isEmpty && balances.coins == 0 && balances.saved == 0) {
          return WalletEmpty(region: child.region);
        }
        return _WalletContent(
          region: child.region,
          balances: balances,
          history: history,
          offline: offline,
          historyFailed: historyFailed,
          onRetry: retry,
          onSave: () => _save(context, ref, child.id),
        );
      },
    );
  }

  Future<void> _save(BuildContext context, WidgetRef ref, String childId) async {
    final messenger = ScaffoldMessenger.of(context);
    final result = await appendCoinsOut(
      ref.read(walletRepositoryProvider),
      childId: childId,
      kind: WalletKind.save,
      amount: _saveStep,
      label: 'Saved in the jar',
    );
    if (!context.mounted) return;
    ref.invalidate(balancesProvider(childId));
    ref.invalidate(walletEventsProvider(childId));
    final text = switch (result) {
      WalletActionResult.done => 'Saved! $_saveStep coins are in the jar.',
      WalletActionResult.queued => 'Saved on this device. We will add it when you are back online.',
      WalletActionResult.insufficient => 'You need $_saveStep coins to fill the jar. Keep playing!',
      WalletActionResult.invalid || WalletActionResult.failed => 'We could not save just now. Your coins are safe. Try again.',
    };
    messenger.showSnackBar(SnackBar(content: Text(text, style: nunito(16, color: Kc.cream))));
  }
}

class _Title extends StatelessWidget {
  const _Title({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('My wallet', style: baloo(32, height: 1.1)),
          Expanded(child: child),
        ],
      );
}

// ---- Live content ------------------------------------------------------------

class _WalletContent extends StatelessWidget {
  const _WalletContent({
    required this.region,
    required this.balances,
    required this.history,
    required this.offline,
    required this.historyFailed,
    required this.onRetry,
    required this.onSave,
  });

  final Region region;
  final Balances balances;
  final List<WalletEvent> history;
  final bool offline;
  final bool historyFailed;
  final Future<void> Function() onRetry;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    return ListView(
      padding: const EdgeInsets.only(bottom: Kc.s4),
      children: [
        Text('My wallet', style: baloo(32, height: 1.1)),
        const SizedBox(height: 14),
        if (offline) ...[
          const StateBanner(message: 'No connection. Your coins are safe and will sync later.', kind: BannerKind.offline),
          const SizedBox(height: 14),
        ],
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: Kc.s3,
          children: [
            Expanded(child: _CoinCard(symbol: region.symbol, coins: balances.coins)),
            Expanded(child: _JarCard(saved: balances.saved)),
          ],
        ),
        if (balances.coins >= WalletScreen._saveStep) ...[
          const SizedBox(height: 10),
          _SaveButton(label: 'Put ${WalletScreen._saveStep} in the jar', onTap: onSave),
        ],
        const SizedBox(height: 14),
        Text('What happened', style: baloo(22, weight: 700)),
        const SizedBox(height: Kc.s2),
        if (historyFailed)
          StateBanner(
            message: 'We could not load what happened. Your coins are safe.',
            kind: BannerKind.error,
            onRetry: () => onRetry(),
          )
        else if (history.isEmpty)
          Text('Nothing yet. Your coins are counted above.', style: nunito(16, color: Kc.brown80))
        else
          for (final e in history) ...[
            _EventRow(event: e, now: now),
            const SizedBox(height: Kc.s2),
          ],
      ],
    );
  }
}

class _CoinCard extends StatelessWidget {
  const _CoinCard({required this.symbol, required this.coins});
  final String symbol;
  final int coins;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(Kc.s4),
        decoration: BoxDecoration(
          color: Kc.softGold,
          borderRadius: BorderRadius.circular(Kc.rLg),
          border: Border.all(color: Kc.brown, width: 3),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 4,
          children: [
            Row(
              spacing: Kc.s2,
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: Kc.gold, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: 3)),
                ),
                Text(symbol, style: baloo(18)),
              ],
            ),
            FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: Text('$coins', style: baloo(38, height: 1))),
            Text('Coins to spend', style: nunito(15, weight: 800)),
          ],
        ),
      );
}

class _JarCard extends StatelessWidget {
  const _JarCard({required this.saved});
  final int saved;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(Kc.s4),
        decoration: BoxDecoration(
          color: Kc.white,
          borderRadius: BorderRadius.circular(Kc.rLg),
          border: Border.all(color: Kc.brown, width: 3),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 4,
          children: [
            SizedBox(
              width: 30,
              height: 36,
              child: Stack(
                children: [
                  Positioned(
                    top: 6,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Kc.white,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Kc.brown, width: 3),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 0,
                    left: 5,
                    right: 5,
                    height: 9,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Kc.orange,
                        borderRadius: BorderRadius.circular(3),
                        border: Border.all(color: Kc.brown, width: 3),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            FittedBox(fit: BoxFit.scaleDown, alignment: Alignment.centerLeft, child: Text('$saved', style: baloo(38, height: 1))),
            Text('Saved in the jar', style: nunito(15, weight: 800)),
          ],
        ),
      );
}

class _SaveButton extends StatelessWidget {
  const _SaveButton({required this.label, required this.onTap});
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: label,
        excludeSemantics: true,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: onTap,
          child: Container(
            height: Kc.touchMin,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Kc.peach,
              borderRadius: BorderRadius.circular(Kc.rPill),
              border: Border.all(color: Kc.brown, width: Kc.border),
            ),
            child: Text(label, style: baloo(18, weight: 700)),
          ),
        ),
      );
}

class _EventRow extends StatelessWidget {
  const _EventRow({required this.event, required this.now});
  final WalletEvent event;
  final DateTime now;

  @override
  Widget build(BuildContext context) {
    final out = event.kind == WalletKind.spend;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Kc.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Kc.brown, width: Kc.border),
      ),
      child: Row(
        spacing: Kc.s3,
        children: [
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: out ? Kc.peach : Kc.softGold,
              shape: BoxShape.circle,
              border: Border.all(color: Kc.brown, width: Kc.border),
            ),
            child: Text(out ? '−' : '+', style: baloo(20)),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(eventTitle(event), style: nunito(16, weight: 800, height: 1.2)),
                Text(dayLabel(event.createdAt, now), style: nunito(13, color: Kc.brown80, height: 1.2)),
              ],
            ),
          ),
          Text(eventAmountText(event), style: baloo(20)),
        ],
      ),
    );
  }
}

// ---- wl-01 empty ---------------------------------------------------------------

class WalletEmpty extends StatelessWidget {
  const WalletEmpty({super.key, this.region});
  final Region? region;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          Text('My wallet', style: baloo(32, height: 1.1)),
          Row(
            spacing: Kc.s3,
            children: [
              Expanded(child: _SmallCard(label: 'Coins', value: '0', coin: true)),
              Expanded(child: _SmallCard(label: 'Saved in the jar', value: '0')),
            ],
          ),
          Expanded(
            child: DashedBox(
              color: Kc.brown80,
              fill: Kc.white,
              radius: Kc.rLg,
              strokeWidth: 2,
              padding: const EdgeInsets.all(Kc.s5),
              alignment: Alignment.center,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  spacing: 12,
                  children: [
                    const KudiImage(KudiPose.wave, width: 170),
                    Text('Your wallet is empty for now', style: baloo(24, height: 1.15), textAlign: TextAlign.center),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 280),
                      child: Text(
                        'Play a mission to find your first coins. They will show up here.',
                        style: nunito(17, height: 1.4),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 9),
            child: PrimaryButton(label: 'Find my first coins', height: 68, onPressed: () => context.go('/home')),
          ),
        ],
      );
}

class _SmallCard extends StatelessWidget {
  const _SmallCard({required this.label, required this.value, this.coin = false});
  final String label;
  final String value;
  final bool coin;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Kc.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Kc.brown, width: Kc.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: nunito(14, weight: 800, color: Kc.brown80)),
            Row(
              spacing: Kc.s2,
              children: [
                if (coin)
                  Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(color: Kc.gold, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: Kc.border)),
                  ),
                Text(value, style: baloo(34, height: 1.2)),
              ],
            ),
          ],
        ),
      );
}

// ---- wl-02 loading -------------------------------------------------------------

class WalletSkeleton extends StatelessWidget {
  const WalletSkeleton({super.key});

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          Row(
            spacing: Kc.s3,
            children: [
              Expanded(child: Text('My wallet', style: baloo(32, height: 1.1))),
              const KudiImage(KudiPose.headphones, width: 72),
            ],
          ),
          Text('Getting things ready...', style: nunito(17, weight: 800, color: Kc.brown80)),
          Row(
            spacing: Kc.s3,
            children: [
              Expanded(child: _skeletonCard(0.5, 0.7)),
              Expanded(child: _skeletonCard(0.6, 0.55)),
            ],
          ),
          const Bone(widthFactor: 0.4, height: 20),
          for (final (a, b) in const [(0.7, 0.4), (0.6, 0.35), (0.65, 0.45)])
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Kc.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: Kc.brown, width: Kc.border),
              ),
              child: Row(
                spacing: Kc.s3,
                children: [
                  const Bone(width: 44, height: 44, circle: true),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: 8,
                      children: [Bone(widthFactor: a), Bone(widthFactor: b, height: 12)],
                    ),
                  ),
                  const Bone(width: 50, height: 18),
                ],
              ),
            ),
        ],
      );

  static Widget _skeletonCard(double a, double b) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Kc.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Kc.brown, width: Kc.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 10,
          children: [Bone(widthFactor: a), Bone(widthFactor: b, height: 36)],
        ),
      );
}

// ---- wl-03 error ---------------------------------------------------------------

class WalletError extends StatefulWidget {
  const WalletError({super.key, required this.onRetry});
  final Future<void> Function() onRetry;

  @override
  State<WalletError> createState() => _WalletErrorState();
}

class _WalletErrorState extends State<WalletError> {
  bool _busy = false;

  Future<void> _retry() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await widget.onRetry();
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 16,
        children: [
          Text('My wallet', style: baloo(32, height: 1.1)),
          Container(
            padding: const EdgeInsets.all(Kc.s5),
            decoration: BoxDecoration(
              color: Kc.peach,
              borderRadius: BorderRadius.circular(22),
              border: Border.all(color: Kc.brown, width: Kc.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 12,
              children: [
                Row(
                  spacing: Kc.s3,
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: Kc.white, shape: BoxShape.circle, border: Border.all(color: Kc.brown, width: 3)),
                      child: Text('!', style: baloo(26)),
                    ),
                    Expanded(child: Text('We could not load your coins.', style: baloo(24, height: 1.15))),
                  ],
                ),
                Text(
                  'This can happen when the connection drops. Your coins are safe on this device. Tap try again.',
                  style: nunito(17, height: 1.4),
                ),
              ],
            ),
          ),
          Row(
            spacing: Kc.s3,
            children: [
              const KudiImage(KudiPose.headphones, width: 100),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: Kc.white,
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: Kc.brown, width: Kc.border),
                  ),
                  child: Text("Nothing is lost. Let's try once more.", style: nunito(17, height: 1.35)),
                ),
              ),
            ],
          ),
          const Spacer(),
          PrimaryButton(label: 'Try again', height: 68, onPressed: _busy ? null : _retry),
          TextLink('Back to home', onTap: () => context.go('/home')),
        ],
      );
}
