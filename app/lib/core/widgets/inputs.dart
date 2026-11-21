import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../theme/theme.dart';
import 'motion.dart';

/// Row of progress dots (steps, onboarding). [index] is zero-based.
class ProgressDots extends StatelessWidget {
  const ProgressDots({super.key, required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) => Semantics(
        label: 'Step ${index + 1} of $count',
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (var i = 0; i < count; i++)
              AnimatedContainer(
                duration: const Duration(milliseconds: 240),
                margin: const EdgeInsets.symmetric(horizontal: 4),
                width: i == index ? 28 : 12,
                height: 12,
                decoration: BoxDecoration(
                  color: i <= index ? Kc.orange : Kc.brown.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(Kc.rPill),
                  border: i <= index ? Border.all(color: Kc.brown, width: 1.5) : null,
                ),
              ),
          ],
        ),
      );
}

/// Coin amount pill: gold coin with brown rim + number.
class CoinChip extends StatelessWidget {
  const CoinChip({super.key, required this.amount, this.prefix});

  final int amount;
  final String? prefix;

  @override
  Widget build(BuildContext context) => Semantics(
        label: '$amount coins',
        excludeSemantics: true,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: Kc.white,
            borderRadius: BorderRadius.circular(Kc.rPill),
            border: Border.all(color: Kc.brown, width: Kc.border),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                color: Kc.gold,
                shape: BoxShape.circle,
                border: Border.all(color: Kc.brown, width: Kc.border),
              ),
            ),
            const SizedBox(width: 8),
            CountUp(value: amount, builder: (_, v) => Text('${prefix ?? ''}$v', style: KcText.buttonSmall)),
          ]),
        ),
      );
}

/// Dots showing how many PIN/code digits are entered.
class PinDots extends StatelessWidget {
  const PinDots({super.key, this.length = 4, required this.filled, this.error = false, this.dark = false});

  final int length;
  final int filled;
  final bool error;
  final bool dark;

  @override
  Widget build(BuildContext context) {
    final on = dark ? Kc.yellow : Kc.brown;
    final ring = dark ? Kc.cream : Kc.brown;
    return Semantics(
      label: '$filled of $length digits entered',
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < length; i++)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 10),
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: i < filled ? (error ? Kc.error : on) : Colors.transparent,
                border: Border.all(color: error ? Kc.error : ring, width: Kc.border),
              ),
            ),
        ],
      ),
    );
  }
}

/// 3x4 number pad. Calls [onDigit] with '0'-'9' and [onDelete] for the backspace key.
/// Keys are 64 dp. Set [dark] on the Mane Brown parent screens.
class NumberPad extends StatelessWidget {
  const NumberPad({super.key, required this.onDigit, required this.onDelete, this.dark = false, this.enabled = true});

  final ValueChanged<String> onDigit;
  final VoidCallback onDelete;
  final bool dark;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    Widget key(String label, VoidCallback? tap, {Widget? icon}) {
      final fg = dark ? Kc.cream : Kc.brown;
      return Padding(
        padding: const EdgeInsets.all(6),
        child: Semantics(
          button: true,
          label: label == '<' ? 'Delete' : label,
          excludeSemantics: true,
          child: Material(
            color: dark ? Kc.white.withValues(alpha: 0.14) : Kc.white,
            shape: StadiumBorder(side: BorderSide(color: dark ? Colors.transparent : Kc.brown, width: Kc.border)),
            child: InkWell(
              customBorder: const StadiumBorder(),
              onTap: enabled && tap != null
                  ? () {
                      HapticFeedback.selectionClick();
                      tap();
                    }
                  : null,
              child: SizedBox(
                height: 64,
                child: Center(child: icon ?? Text(label, style: KcText.title.copyWith(color: fg))),
              ),
            ),
          ),
        ),
      );
    }

    Widget row(List<String> digits) => Row(
          children: [for (final d in digits) Expanded(child: key(d, () => onDigit(d)))],
        );

    return Column(mainAxisSize: MainAxisSize.min, children: [
      row(['1', '2', '3']),
      row(['4', '5', '6']),
      row(['7', '8', '9']),
      Row(children: [
        const Expanded(child: SizedBox(height: 64)),
        Expanded(child: key('0', () => onDigit('0'))),
        Expanded(
          child: key('<', onDelete, icon: Icon(Icons.backspace_outlined, color: dark ? Kc.cream : Kc.brown)),
        ),
      ]),
    ]);
  }
}

/// Text input with a label above, a brown outline and an optional error line.
class TextFieldKc extends StatelessWidget {
  const TextFieldKc({
    super.key,
    this.controller,
    this.label,
    this.hint,
    this.errorText,
    this.keyboardType,
    this.onChanged,
    this.onSubmitted,
    this.obscure = false,
    this.maxLength,
    this.autofocus = false,
    this.textInputAction,
  });

  final TextEditingController? controller;
  final String? label;
  final String? hint;
  final String? errorText;
  final TextInputType? keyboardType;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final bool obscure;
  final int? maxLength;
  final bool autofocus;
  final TextInputAction? textInputAction;

  @override
  Widget build(BuildContext context) {
    OutlineInputBorder border(Color c, [double w = Kc.border]) =>
        OutlineInputBorder(borderRadius: BorderRadius.circular(Kc.rMd), borderSide: BorderSide(color: c, width: w));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[Text(label!, style: KcText.label), const SizedBox(height: 6)],
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          autocorrect: keyboardType != TextInputType.emailAddress,
          enableSuggestions: keyboardType != TextInputType.emailAddress,
          obscureText: obscure,
          maxLength: maxLength,
          autofocus: autofocus,
          textInputAction: textInputAction,
          onChanged: onChanged,
          onSubmitted: onSubmitted,
          style: KcText.bodyChild.copyWith(color: Kc.brown),
          cursorColor: Kc.brown,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: KcText.bodyChild.copyWith(color: Kc.brown60),
            counterText: '',
            filled: true,
            fillColor: Kc.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: Kc.s4, vertical: 16),
            enabledBorder: border(errorText != null ? Kc.error : Kc.brown),
            focusedBorder: border(errorText != null ? Kc.error : Kc.orange, 3),
            border: border(Kc.brown),
          ),
        ),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Row(children: [
              const Icon(Icons.error_outline_rounded, size: 18, color: Kc.error),
              const SizedBox(width: 6),
              Expanded(child: Text(errorText!, style: KcText.label.copyWith(color: Kc.error))),
            ]),
          ),
      ],
    );
  }
}
