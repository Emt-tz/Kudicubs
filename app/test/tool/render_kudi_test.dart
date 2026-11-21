import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/widgets/kudi_mesh.dart';

// Renders the mascot at chosen moments to PNG so the warp can be inspected by eye.
//   KUDI_OUT=/some/dir flutter test test/tool/render_kudi_test.dart
void main() {
  testWidgets('render kudi frames', (tester) async {
    final out = Platform.environment['KUDI_OUT'];
    if (out == null) return;
    await tester.runAsync(() async {
      final bytes = await File('assets/brand/kudi-wave.webp').readAsBytes();
      final codec = await ui.instantiateImageCodec(bytes);
      final img = (await codec.getNextFrame()).image;
      const rig = KudiRig(shoulder: Offset(.28, .50), hand: Offset(.11, .24), tailBase: Offset(.74, .62), tailTip: Offset(.90, .47), wave: true, eyes: [Offset(.386, .258), Offset(.568, .296)]);
      final frames = {'a_neutral': const KudiMotion(seconds: 0), 'b_armup': const KudiMotion(seconds: .3125), 'c_armdown': const KudiMotion(seconds: .9375), 'd_blink': const KudiMotion(seconds: 0, blink: 1), 'e_talk': const KudiMotion(seconds: .3125, talk: 1, hop: 1)};
      for (final e in frames.entries) {
        final rec = ui.PictureRecorder();
        final c = Canvas(rec);
        c.drawRect(const Rect.fromLTWH(0, 0, 610, 640), Paint()..color = const Color(0xFFFDF3E0));
        KudiMeshPainter(image: img, rig: rig, motion: e.value, aspect: 610 / 640).paint(c, const Size(610, 640));
        final pic = rec.endRecording();
        final png = await (await pic.toImage(610, 640)).toByteData(format: ui.ImageByteFormat.png);
        File('$out/${e.key}.png').writeAsBytesSync(png!.buffer.asUint8List());
      }
    });
  });
}
