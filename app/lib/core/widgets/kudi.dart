import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

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
  Widget build(BuildContext context) => Image.asset(
        'assets/brand/${_files[pose]}.webp',
        width: width,
        fit: BoxFit.contain,
        semanticLabel: 'Kudi the Cub',
        errorBuilder: (_, _, _) => SizedBox(width: width, height: width),
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
