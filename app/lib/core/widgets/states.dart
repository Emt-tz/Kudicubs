import 'package:flutter/material.dart';

import '../theme/theme.dart';
import 'buttons.dart';
import 'kudi.dart';

enum BannerKind { info, success, error, offline }

/// Inline message strip. Shows a Retry button when [onRetry] is given.
class StateBanner extends StatelessWidget {
  const StateBanner({super.key, required this.message, this.kind = BannerKind.info, this.onRetry});

  final String message;
  final BannerKind kind;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final (icon, color) = switch (kind) {
      BannerKind.info => (Icons.info_outline_rounded, Kc.brown),
      BannerKind.success => (Icons.check_circle_rounded, Kc.success),
      BannerKind.error => (Icons.error_outline_rounded, Kc.error),
      BannerKind.offline => (Icons.cloud_off_rounded, Kc.brown),
    };
    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: Kc.s4, vertical: Kc.s3),
        decoration: BoxDecoration(
          color: Kc.peach,
          borderRadius: BorderRadius.circular(Kc.rMd),
          border: Border.all(color: Kc.brown, width: Kc.border),
        ),
        child: Row(
          children: [
            Icon(icon, color: color),
            const SizedBox(width: Kc.s3),
            Expanded(child: Text(message, style: KcText.label)),
            if (onRetry != null)
              TextButton(
                onPressed: onRetry,
                style: TextButton.styleFrom(minimumSize: const Size(Kc.touchMin, Kc.touchMin), foregroundColor: Kc.brown),
                child: Text('Retry', style: KcText.label),
              ),
          ],
        ),
      ),
    );
  }
}

class _Centered extends StatelessWidget {
  const _Centered({required this.children});
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(Kc.s6),
          child: Column(mainAxisSize: MainAxisSize.min, children: children),
        ),
      );
}

class LoadingView extends StatelessWidget {
  const LoadingView({super.key, this.message});
  final String? message;

  @override
  Widget build(BuildContext context) => _Centered(children: [
        const SizedBox(
          width: 56,
          height: 56,
          child: CircularProgressIndicator(color: Kc.orange, backgroundColor: Kc.peach, strokeWidth: 6),
        ),
        if (message != null) ...[
          const SizedBox(height: Kc.s4),
          Text(message!, style: KcText.bodyChild, textAlign: TextAlign.center),
        ],
      ]);
}

class EmptyView extends StatelessWidget {
  const EmptyView({
    super.key,
    required this.title,
    this.message,
    this.pose = KudiPose.wave,
    this.actionLabel,
    this.onAction,
  });

  final String title;
  final String? message;
  final KudiPose pose;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) => _Centered(children: [
        KudiImage(pose, width: 160),
        const SizedBox(height: Kc.s4),
        Text(title, style: KcText.headline, textAlign: TextAlign.center),
        if (message != null) ...[
          const SizedBox(height: Kc.s2),
          Text(message!, style: KcText.bodyChild, textAlign: TextAlign.center),
        ],
        if (onAction != null) ...[
          const SizedBox(height: Kc.s6),
          PrimaryButton(label: actionLabel ?? 'OK', onPressed: onAction),
        ],
      ]);
}

/// Error with a retry callback. Nothing earned is ever lost: say so in [message].
class ErrorView extends StatelessWidget {
  const ErrorView({super.key, this.title = 'Oops!', this.message = 'Something went wrong.', required this.onRetry});

  final String title;
  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => _Centered(children: [
        const KudiImage(KudiPose.headphones, width: 140),
        const SizedBox(height: Kc.s4),
        Text(title, style: KcText.headline, textAlign: TextAlign.center),
        const SizedBox(height: Kc.s2),
        Text(message, style: KcText.bodyChild, textAlign: TextAlign.center),
        if (onRetry != null) ...[
          const SizedBox(height: Kc.s6),
          PrimaryButton(label: 'Try again', onPressed: onRetry),
        ],
      ]);
}
