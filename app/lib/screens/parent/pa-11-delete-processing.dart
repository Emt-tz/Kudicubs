// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';

import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import 'parent_widgets.dart';
import 'package:flutter/services.dart';

/// Canvas `pa-11-delete-processing`: shown while `delete_my_family` runs. Keep this screen open.
Widget build_pa_11_delete_processing(BuildContext context, ScreenState state) =>
    const DeleteProcessingView(key: Key('screen-pa-11-delete-processing'));

class DeleteProcessingView extends StatelessWidget {
  const DeleteProcessingView({super.key});

  @override
  Widget build(BuildContext context) {
    Widget step(String text, {required bool done}) => Row(
      children: [
        Icon(
          done ? Icons.check_circle_outline_rounded : Icons.radio_button_unchecked_rounded,
          color: Kc.softGold,
          size: 22,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(text, style: PT.strong(16, color: done ? Kc.cream : Kc.softGold)),
        ),
      ],
    );
    return Scaffold(
      backgroundColor: Kc.brown,
      appBar: AppBar(toolbarHeight: 0, primary: false, elevation: 0, scrolledUnderElevation: 0, backgroundColor: Kc.brown, systemOverlayStyle: SystemUiOverlayStyle.light),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(
                  width: 72,
                  height: 72,
                  child: CircularProgressIndicator(
                    value: null,
                    strokeWidth: 8,
                    strokeCap: StrokeCap.round,
                    color: Kc.yellow,
                    backgroundColor: Color(0x40FEF5E0),
                  ),
                ),
                const SizedBox(height: 18),
                Text('Deleting your family data...', style: PT.display(30), textAlign: TextAlign.center),
                const SizedBox(height: 18),
                Semantics(
                  liveRegion: true,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 300),
                    child: Text(
                      'This can take a moment. Please keep this screen open.',
                      style: PT.body(17),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 300),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Kc.white.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(18),
                    ),
                    child: Column(
                      children: [
                        step("Children's profiles", done: true),
                        const SizedBox(height: 10),
                        step('Play progress and badges', done: true),
                        const SizedBox(height: 10),
                        step('Parent account and email', done: false),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Text('Step 3 of 3', style: PT.body(14, color: Kc.softGold)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
