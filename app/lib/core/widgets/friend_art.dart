import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/theme.dart';

const _friendIds = {
  'cub-friend-1',
  'cub-friend-2',
  'cub-friend-3',
  'cub-friend-4',
};

/// The animal friend picture for [avatar] ('cub-friend-1'..'4'), round and bordered.
/// Anything else falls back to a plain coloured circle.
class FriendArt extends StatelessWidget {
  const FriendArt(
    this.avatar, {
    super.key,
    required this.size,
    required this.fallback,
    this.border = 3,
    this.borderColor = Kc.brown,
  });

  final String avatar;
  final double size;
  final Color fallback;
  final double border;
  final Color borderColor;

  @override
  Widget build(BuildContext context) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: fallback,
      shape: BoxShape.circle,
      border: Border.all(color: borderColor, width: border),
    ),
    child: _friendIds.contains(avatar)
        ? ClipOval(
            child: SvgPicture.asset(
              'assets/art/avatars/$avatar.svg',
              fit: BoxFit.cover,
              excludeFromSemantics: true,
            ),
          )
        : null,
  );
}
