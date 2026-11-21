/// Add-a-child form (pa-03 normal, pa-04 with the problem showing).
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart' show PostgrestException;

import '../../core/data/models.dart';
import '../../core/data/providers.dart';
import '../../core/screen_state.dart';
import '../../core/theme/theme.dart';
import '../../core/widgets/widgets.dart';
import 'parent_logic.dart';
import 'parent_widgets.dart';

class AddChildView extends ConsumerStatefulWidget {
  const AddChildView({super.key, this.state = ScreenState.normal, this.startWithProblem = false, this.onAdded});

  final ScreenState state;

  /// Open with no nickname chosen and the "one thing to fix" message showing (pa-04).
  final bool startWithProblem;

  /// Called with the new child; default pops the page.
  final void Function(Child child)? onAdded;

  @override
  ConsumerState<AddChildView> createState() => _AddChildViewState();
}

class _AddChildViewState extends ConsumerState<AddChildView> {
  /// The nickname the parent tapped. Until they tap, the first unused name from the list is offered.
  String? _picked;
  bool _touched = false;
  AgeBand _band = AgeBand.b4_6;
  Region? _region;
  late AddChildProblem? _problem = widget.startWithProblem ? AddChildProblem.noNickname : null;
  late String? _serverError = switch (widget.state) {
    ScreenState.error => 'Nothing was saved. Check your connection and try again.',
    ScreenState.offline => 'There is no connection right now. Nothing was saved.',
    _ => null,
  };
  bool _saving = false;

  int get _count => ref.read(childrenProvider).value?.length ?? 0;

  String? get _nickname {
    if (_touched) return _picked;
    if (widget.startWithProblem) return null;
    return firstFreeNickname(ref.read(childrenProvider).value?.map((c) => c.nickname) ?? const <String>[]);
  }

  Future<void> _submit() async {
    final problem = validateNewChild(nickname: _nickname, existingChildren: _count);
    if (problem != null) {
      setState(() {
        _problem = problem;
        _serverError = null;
      });
      return;
    }
    setState(() {
      _problem = null;
      _serverError = null;
      _saving = true;
    });
    try {
      final region = _region ?? ref.read(parentProvider).value?.region ?? Region.gh;
      final child = await ref
          .read(childrenProvider.notifier)
          .add(nickname: _nickname!.trim(), ageBand: _band, region: region, avatar: avatarForIndex(_count));
      if (!mounted) return;
      if (widget.onAdded != null) {
        widget.onAdded!(child);
      } else {
        goBackOr(context, '/parent');
      }
    } on PostgrestException catch (e) {
      if (mounted) setState(() => _serverError = 'The server said: ${e.message}. Nothing was saved.');
    } catch (_) {
      if (mounted) setState(() => _serverError = 'Nothing was saved. Check your connection and try again.');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.state == ScreenState.loading) {
      return const ParentPage(scroll: false, child: LoadingView(message: 'Getting things ready...'));
    }
    final region = _region ?? ref.watch(parentProvider).value?.region ?? Region.gh;
    final count = ref.watch(childrenProvider).value?.length ?? 0;
    final nickname = _nickname;
    final problem = _problem;
    final noNickname = problem == AddChildProblem.noNickname || problem == AddChildProblem.nicknameTooLong;

    return ParentPage(
      bottom: ParentPrimary('Add child', onPressed: _saving ? null : _submit),
      child: Gap(
        gap: 14,
        children: [
          BackLink('Your children', onTap: () => goBackOr(context, '/parent')),
          Text('Add a child', style: PT.display(32)),
          if (problem != null) ParentAlert(title: 'One thing to fix.', message: addChildMessage(problem)),
          if (_serverError != null) ParentAlert(title: 'We could not add your child.', message: _serverError!),
          _Section(
            title: 'Pick a nickname',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: noNickname ? const EdgeInsets.all(10) : EdgeInsets.zero,
                  decoration: noNickname
                      ? BoxDecoration(
                          border: Border.all(color: Kc.softGold, width: 3),
                          borderRadius: BorderRadius.circular(18),
                        )
                      : null,
                  child: Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: [
                      for (final n in kNicknameChoices)
                        ParentChoice(
                          key: Key('nick-$n'),
                          label: n,
                          selected: nickname == n,
                          radius: Kc.rPill,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          onTap: () => setState(() {
                            _picked = n;
                            _touched = true;
                            _problem = null;
                          }),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 6),
                if (problem != null)
                  Row(
                    children: [
                      const Icon(Icons.info_outline_rounded, color: Kc.softGold, size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(addChildFieldHint(problem), style: PT.strong(14, color: Kc.softGold)),
                      ),
                    ],
                  )
                else
                  Text('Nicknames come from a short list. No real names.', style: PT.body(14, color: Kc.softGold)),
              ],
            ),
          ),
          _Section(
            title: 'Age band',
            child: Row(
              children: [
                for (final b in AgeBand.values) ...[
                  if (b != AgeBand.values.first) const SizedBox(width: 8),
                  Expanded(
                    child: ParentChoice(
                      key: Key('band-${b.db}'),
                      label: b.label,
                      selected: _band == b,
                      height: 52,
                      display: true,
                      fontSize: 18,
                      padding: EdgeInsets.zero,
                      onTap: () => setState(() => _band = b),
                    ),
                  ),
                ],
              ],
            ),
          ),
          _Section(
            title: 'Where does your family live?',
            child: Column(
              children: [
                for (final r in Region.values) ...[
                  if (r != Region.values.first) const SizedBox(height: 8),
                  ParentChoice(
                    key: Key('region-${r.db}'),
                    label: r.label,
                    trailing: '${r.symbol} ${currencyName(r)}',
                    selected: region == r,
                    height: 52,
                    onTap: () => setState(() => _region = r),
                  ),
                ],
              ],
            ),
          ),
          if (problem != null) InfoStrip('You can add up to $kMaxChildren children. You have $count so far.'),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(title, style: PT.strong(16)),
      const SizedBox(height: 8),
      child,
    ],
  );
}
