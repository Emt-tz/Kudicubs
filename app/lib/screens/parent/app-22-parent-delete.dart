// ignore_for_file: non_constant_identifier_names
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import 'pa-11-delete-processing.dart';
import 'pa-12-deleted.dart';
import 'parent_data.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

/// Canvas `app-22-parent-delete`: delete the whole family account. Needs the box ticked and the word
/// typed, then calls `delete_my_family`, shows the processing screen (pa-11) and the deleted screen (pa-12).
Widget build_app_22_parent_delete(BuildContext context, ScreenState state) =>
    ParentDeleteFlow(key: const Key('screen-app-22-parent-delete'), state: state);

enum DeletePhase { confirm, processing, done }

class ParentDeleteFlow extends ConsumerStatefulWidget {
  const ParentDeleteFlow({super.key, this.state = ScreenState.normal, this.onFinished});

  final ScreenState state;

  /// Called from the deleted screen's "Back to start" instead of `context.go('/welcome')`.
  final VoidCallback? onFinished;

  @override
  ConsumerState<ParentDeleteFlow> createState() => _ParentDeleteFlowState();
}

class _ParentDeleteFlowState extends ConsumerState<ParentDeleteFlow> {
  final _word = TextEditingController();
  bool _understood = false;
  DeletePhase _phase = DeletePhase.confirm;
  String? _error;

  @override
  void initState() {
    super.initState();
    _word.addListener(() => setState(() {}));
    if (widget.state == ScreenState.error) _error = 'Nothing was deleted. Check your connection and try again.';
    if (widget.state == ScreenState.offline) _error = 'There is no connection right now. Nothing was deleted.';
  }

  @override
  void dispose() {
    _word.dispose();
    super.dispose();
  }

  Future<void> _delete() async {
    setState(() {
      _phase = DeletePhase.processing;
      _error = null;
    });
    try {
      await ref.read(parentRepositoryProvider).deleteFamily();
      if (mounted) setState(() => _phase = DeletePhase.done);
    } catch (_) {
      if (mounted) {
        setState(() {
          _phase = DeletePhase.confirm;
          _error = 'We could not delete the account, so nothing was erased. Check your connection and try again.';
        });
      }
    }
  }

  /// Clears everything kept on this phone for the family and starts again at the welcome screen.
  Future<void> _backToStart() async {
    await ref.read(deviceRepositoryProvider).forgetLocal();
    ref.read(parentUnlockedProvider.notifier).lock();
    await ref.read(onboardedProvider.notifier).set(false);
    ref.invalidate(currentChildIdProvider);
    ref.invalidate(childrenProvider);
    ref.invalidate(parentProvider);
    if (!mounted) return;
    if (widget.onFinished != null) {
      widget.onFinished!();
    } else {
      context.go('/welcome');
    }
  }

  @override
  Widget build(BuildContext context) {
    switch (_phase) {
      case DeletePhase.processing:
        return const DeleteProcessingView();
      case DeletePhase.done:
        return DeletedView(onDone: _backToStart);
      case DeletePhase.confirm:
        break;
    }
    if (widget.state == ScreenState.loading) {
      return const ParentPage(scroll: false, child: ParentMessage(title: 'Getting things ready...'));
    }
    final can = canDeleteAccount(understood: _understood, typed: _word.text);
    const items = [
      'Every child profile: nickname, age band, avatar and region',
      'All coins, XP, badges and mission history',
      'The parent email and parent PIN',
      'All signed-in devices',
    ];
    return ParentPage(
      bottom: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ParentPrimary('Keep my account', height: 64, onPressed: () => goBackOr(context, '/parent/settings')),
          const SizedBox(height: 12),
          ParentOutline('Delete everything', color: Kc.cream, fontSize: 19, onPressed: can ? _delete : null),
        ],
      ),
      child: Gap(
        gap: 12,
        children: [
          BackLink('Settings', onTap: () => goBackOr(context, '/parent/settings')),
          Text('Delete this family account?', style: PT.display(32)),
          Text('If you go ahead, this is erased and cannot be brought back:', style: PT.body(16)),
          ParentCard(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final i in items)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 2),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('•  ', style: PT.body(16)),
                        Expanded(child: Text(i, style: PT.body(16))),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          Text(
            'Accounts with no sign-in or play for 12 months are deleted automatically. We email a warning 30 days and 7 days before.',
            style: PT.body(15, color: Kc.softGold),
          ),
          Text('A child cannot complete this step. It needs the grown-up gate and your PIN.', style: PT.body(15)),
          if (_error != null) ParentAlert(title: 'Not deleted.', message: _error!),
          Semantics(
            checked: _understood,
            label: 'I understand this cannot be undone',
            excludeSemantics: true,
            child: InkWell(
              key: const Key('delete-understand'),
              borderRadius: BorderRadius.circular(14),
              onTap: () => setState(() => _understood = !_understood),
              child: Container(
                constraints: const BoxConstraints(minHeight: 56),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: Kc.white.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 28,
                      height: 28,
                      child: Checkbox(
                        value: _understood,
                        onChanged: (v) => setState(() => _understood = v ?? false),
                        activeColor: Kc.yellow,
                        checkColor: Kc.brown,
                        side: const BorderSide(color: Kc.cream, width: 2),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Text('I understand this cannot be undone', style: PT.strong(16))),
                  ],
                ),
              ),
            ),
          ),
          Text('Type $kDeleteWord to confirm', style: PT.strong(15, color: Kc.softGold)),
          TextField(
            key: const Key('delete-word'),
            controller: _word,
            textCapitalization: TextCapitalization.characters,
            autocorrect: false,
            style: PT.strong(18, color: Kc.brown),
            cursorColor: Kc.brown,
            decoration: InputDecoration(
              hintText: kDeleteWord,
              hintStyle: PT.strong(18, color: Kc.brown60),
              filled: true,
              fillColor: Kc.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(Kc.rMd),
                borderSide: const BorderSide(color: Kc.softGold, width: 2),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
