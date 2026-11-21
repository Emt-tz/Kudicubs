import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/theme.dart';
import 'motion.dart';

/// Kudi the Cub poses available in assets/brand.
enum KudiPose { wave, celebrate, fist, headphones, thumbsUp }

class KudiImage extends StatelessWidget {
  const KudiImage(this.pose, {super.key, this.width = 220});

  final KudiPose pose;
  final double width;

  static const _files = {
    KudiPose.wave: 'kudi-wave',
    KudiPose.celebrate: 'kudi-celebrate',
    KudiPose.fist: 'kudi-fist',
    KudiPose.headphones: 'kudi-headphones',
    KudiPose.thumbsUp: 'kudi-thumbs-up',
  };

  @override
  Widget build(BuildContext context) => Floaty(
        amplitude: width > 120 ? 7 : 3,
        child: Image.asset(
          'assets/brand/${_files[pose]}.webp',
          width: width,
          fit: BoxFit.contain,
          semanticLabel: 'Kudi the Cub',
          errorBuilder: (_, _, _) => SizedBox(width: width, height: width),
        ),
      );
}

/// Where the logo will sit: on cream/white, yellow or brown.
enum LogoOn { white, yellow, brown }

class KudiLogo extends StatelessWidget {
  const KudiLogo({super.key, this.width = 210, this.on = LogoOn.white});

  final double width;
  final LogoOn on;

  @override
  Widget build(BuildContext context) => SvgPicture.asset(
        'assets/brand/logo-on-${on.name}.svg',
        width: width,
        semanticsLabel: 'KudiCubs',
      );
}

/// Text-only brand name, for screens where the mascot is already on show (so there is one lion, not two).
class KudiWordmark extends StatelessWidget {
  const KudiWordmark({super.key, this.size = 44, this.tagline = true});

  final double size;
  final bool tagline;

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text("Kudicub's", style: TextStyle(fontFamily: 'Baloo2', fontWeight: FontWeight.w800, fontSize: size, height: 1.1, color: Kc.brown)),
          if (tagline) Text('Play. Earn. Roar!', style: TextStyle(fontFamily: 'Baloo2', fontWeight: FontWeight.w700, fontSize: size * .38, color: Kc.orange)),
        ],
      );
}
