import 'package:flutter/material.dart';

import '../theme/theme.dart';

/// Pill button with a brown outline and a hard drop shadow that sinks on press.
class _PillButton extends StatefulWidget {
  const _PillButton({
    required this.label,
    required this.onPressed,
    required this.fill,
    required this.pressedFill,
    required this.height,
    required this.style,
    this.icon,
    this.shadow = Kc.shadowDrop,
  });

  final String label;
  final VoidCallback? onPressed;
  final Color fill;
  final Color pressedFill;
  final double height;
  final TextStyle style;
  final IconData? icon;
  final double shadow;

  @override
  State<_PillButton> createState() => _PillButtonState();
}

class _PillButtonState extends State<_PillButton> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    final enabled = widget.onPressed != null;
    final sink = _down && enabled ? widget.shadow - 1 : 0.0;
    return Semantics(
      button: true,
      enabled: enabled,
      label: widget.label,
      excludeSemantics: true,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: enabled ? (_) => setState(() => _down = true) : null,
        onTapCancel: () => setState(() => _down = false),
        onTapUp: (_) => setState(() => _down = false),
        onTap: widget.onPressed,
        child: Opacity(
          opacity: enabled ? 1 : 0.5,
          child: Padding(
            padding: EdgeInsets.only(bottom: widget.shadow - sink, top: sink),
            child: Container(
              height: widget.height,
              width: double.infinity,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: _down && enabled ? widget.pressedFill : widget.fill,
                borderRadius: BorderRadius.circular(Kc.rPill),
                border: Border.all(color: Kc.brown, width: Kc.border),
                boxShadow: [BoxShadow(color: Kc.brown, offset: Offset(0, widget.shadow - sink))],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (widget.icon != null) ...[
                    Icon(widget.icon, color: Kc.brown, size: widget.style.fontSize),
                    const SizedBox(width: 10),
                  ],
                  Flexible(child: Text(widget.label, style: widget.style, maxLines: 1, overflow: TextOverflow.ellipsis)),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The one main action on a screen. 76 dp tall (use [height] 64/56 for older bands).
/// `onPressed: null` renders the disabled (50%) state.
class PrimaryButton extends StatelessWidget {
  const PrimaryButton({super.key, required this.label, required this.onPressed, this.icon, this.height = Kc.buttonHeight});

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final double height;

  @override
  Widget build(BuildContext context) => _PillButton(
        label: label,
        onPressed: onPressed,
        fill: Kc.yellow,
        pressedFill: Kc.yellowPressed,
        height: height,
        style: height >= Kc.buttonHeight ? KcText.button : KcText.buttonSmall,
        icon: icon,
      );
}

/// A quieter action (orange, 56 dp, smaller shadow). Never beside a main button on 4-6 child screens.
class SecondaryButton extends StatelessWidget {
  const SecondaryButton({super.key, required this.label, required this.onPressed, this.icon});

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) => _PillButton(
        label: label,
        onPressed: onPressed,
        fill: Kc.orange,
        pressedFill: Kc.orangePressed,
        height: 56,
        style: KcText.buttonSmall,
        icon: icon,
        shadow: 4,
      );
}
