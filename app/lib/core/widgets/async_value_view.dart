import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../screen_state.dart';
import 'states.dart';

/// Renders an [AsyncValue] with loading / error(retry) / empty / data branches.
/// Pass [empty] to decide when data counts as empty (default: never).
class AsyncValueView<T> extends StatelessWidget {
  const AsyncValueView({
    super.key,
    required this.value,
    required this.data,
    this.onRetry,
    this.isEmpty,
    this.empty,
    this.loadingMessage,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final VoidCallback? onRetry;
  final bool Function(T data)? isEmpty;
  final Widget? empty;
  final String? loadingMessage;

  @override
  Widget build(BuildContext context) => value.when(
        skipLoadingOnRefresh: true,
        loading: () => LoadingView(message: loadingMessage),
        error: (e, _) => ErrorView(onRetry: onRetry),
        data: (d) => (isEmpty?.call(d) ?? false) ? (empty ?? const EmptyView(title: 'Nothing here yet')) : data(d),
      );
}

/// Maps a [ScreenState] override to the matching state view, or [normal] for `normal`.
/// Lets a screen honour the gallery's `?state=` argument in one line.
class ScreenStateView extends StatelessWidget {
  const ScreenStateView({super.key, required this.state, required this.normal, this.empty, this.onRetry});

  final ScreenState state;
  final Widget normal;
  final Widget? empty;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) => switch (state) {
        ScreenState.normal => normal,
        ScreenState.loading => const LoadingView(),
        ScreenState.empty => empty ?? const EmptyView(title: 'Nothing here yet'),
        ScreenState.error => ErrorView(onRetry: onRetry ?? () {}),
        ScreenState.offline => ErrorView(
            title: 'No connection',
            message: 'Your coins are safe. We will sync when you are back online.',
            onRetry: onRetry ?? () {},
          ),
      };
}
