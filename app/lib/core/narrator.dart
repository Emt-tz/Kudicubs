import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'data/providers.dart';

/// Screen id -> the voice line spoken when the screen opens.
/// NOTE: these are the temporary scratch voice files from the prototype (RB-1).
/// They must be replaced by human recordings before any public release.
const narrationFor = <String, String>{
  'Main': 'welcome.say',
  'app-02-age': 'age.say',
  'app-03-avatar': 'avatar.say',
  'au-12-joined': 'joined.say',
  'app-05-home': 'home.say',
  'hm-06-daily-progress': 'daily.say',
  'app-06-mission-intro': 'intro.say',
  'app-07-find-coins': 'find.say',
  'app-08-decision': 'decide.say',
  'app-09-reward': 'reward.say',
  'app-13-retry': 'sort.try_again',
  'app-14-wallet': 'wallet.say',
  'app-15-progress': 'progress.say',
};

class Narrator {
  Narrator._();
  static final instance = Narrator._();
  AudioPlayer? _player;

  Future<void> say(String lineId) async {
    try {
      _player ??= AudioPlayer();
      await _player!.setAudioContext(
        AudioContextConfig(
          route: AudioContextConfigRoute.system,
          focus: AudioContextConfigFocus.gain,
        ).build(),
      );
      await _player!.stop();
      await _player!.play(AssetSource('audio/en-GH/$lineId.m4a'));
    } catch (_) {
      // No audio engine (tests, unsupported device): stay silent.
    }
  }

  Future<void> stop() async {
    try {
      await _player?.stop();
    } catch (_) {}
  }
}

/// Speaks the screen's line once when it first appears, if the child's sound is on.
class NarrateOnShow extends ConsumerStatefulWidget {
  const NarrateOnShow({super.key, required this.screenId, required this.child});
  final String screenId;
  final Widget child;

  @override
  ConsumerState<NarrateOnShow> createState() => _NarrateOnShowState();
}

class _NarrateOnShowState extends ConsumerState<NarrateOnShow> {
  @override
  void initState() {
    super.initState();
    final line = narrationFor[widget.screenId];
    if (line == null) return;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && ref.read(soundOnProvider)) Narrator.instance.say(line);
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
