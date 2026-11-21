import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:kudicubs/core/widgets/kudi_mesh.dart';

// KUDI_OUT=/dir flutter test test/tool/render_poses_test.dart  -> one PNG per pose at extreme arm + tail + blink
void main() {
  testWidgets('render all poses', (tester) async {
    final out = Platform.environment['KUDI_OUT'];
    if (out == null) return;
    final poses = {
      'celebrate': ('kudi-celebrate', 597, const KudiRig(shoulder: Offset(.28, .50), hand: Offset(.12, .30), tailBase: Offset(.77, .62), tailTip: Offset(.93, .47), wave: true, eyes: [Offset(.404, .262), Offset(.600, .294)])),
      'fist': ('kudi-fist', 560, const KudiRig(shoulder: Offset(.25, .52), hand: Offset(.07, .40), tailBase: Offset(.72, .66), tailTip: Offset(.90, .52), eyes: [Offset(.338, .274), Offset(.542, .307)])),
      'headphones': ('kudi-headphones', 581, const KudiRig(shoulder: Offset(.26, .50), hand: Offset(.07, .28), tailBase: Offset(.74, .62), tailTip: Offset(.92, .47), eyes: [Offset(.387, .276), Offset(.574, .315)])),
      'thumbs': ('kudi-thumbs-up', 579, const KudiRig(shoulder: Offset(.24, .52), hand: Offset(.07, .31), tailBase: Offset(.71, .67), tailTip: Offset(.92, .53), eyes: [Offset(.347, .277), Offset(.547, .326)])),
    };
    await tester.runAsync(() async {
      for (final e in poses.entries) {
        final (file, wpx, rig) = e.value;
        final img = (await (await ui.instantiateImageCodec(await File('assets/brand/$file.webp').readAsBytes())).getNextFrame()).image;
        for (final f in {'up': const KudiMotion(seconds: .3125, talk: 1, hop: 1), 'blink': const KudiMotion(seconds: .9, blink: 1)}.entries) {
          final rec = ui.PictureRecorder();
          final c = Canvas(rec);
          c.drawRect(Rect.fromLTWH(0, 0, wpx.toDouble(), 640), Paint()..color = const Color(0xFFFDF3E0));
          KudiMeshPainter(image: img, rig: rig, motion: f.value, aspect: wpx / 640).paint(c, Size(wpx.toDouble(), 640));
          final png = await (await rec.endRecording().toImage(wpx, 640)).toByteData(format: ui.ImageByteFormat.png);
          File('$out/p_${e.key}_${f.key}.png').writeAsBytesSync(png!.buffer.asUint8List());
        }
      }
    });
  });
}
