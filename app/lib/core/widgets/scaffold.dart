import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../theme/theme.dart';

/// Cream page with safe area, optional back button and optional title.
/// [child] fills the remaining space; [bottom] is pinned under it (main action).
class ScreenScaffold extends StatelessWidget {
  const ScreenScaffold({
    super.key,
    this.title,
    required this.child,
    this.bottom,
    this.showBack = false,
    this.onBack,
    this.background = Kc.cream,
    this.padding = const EdgeInsets.symmetric(horizontal: Kc.s5),
    this.scrollable = false,
  });

  final String? title;
  final Widget child;
  final Widget? bottom;
  final bool showBack;
  final VoidCallback? onBack;
  final Color background;
  final EdgeInsets padding;
  final bool scrollable;

  @override
  Widget build(BuildContext context) {
    final dark = background == Kc.brown;
    final fg = dark ? Kc.cream : Kc.brown;
    Widget body = Padding(padding: padding, child: child);
    if (scrollable) body = SingleChildScrollView(child: body);
    return Scaffold(
      backgroundColor: background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (showBack || title != null)
              SizedBox(
                height: 56,
                child: Row(
                  children: [
                    if (showBack)
                      IconButton(
                        tooltip: 'Back',
                        constraints: const BoxConstraints(minWidth: Kc.touchMin, minHeight: Kc.touchMin),
                        icon: Icon(Icons.arrow_back_rounded, color: fg),
                        onPressed: onBack ?? () => context.canPop() ? context.pop() : context.go('/home'),
                      )
                    else
                      const SizedBox(width: Kc.s5),
                    if (title != null)
                      Expanded(
                        child: Text(title!, style: KcText.title.copyWith(color: fg), maxLines: 1, overflow: TextOverflow.ellipsis),
                      ),
                  ],
                ),
              ),
            Expanded(child: body),
            if (bottom != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(Kc.s5, Kc.s3, Kc.s5, Kc.s4),
                child: bottom,
              ),
          ],
        ),
      ),
    );
  }
}
