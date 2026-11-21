import Image from "next/image";

const POSES = {
  wave: "/brand/kudi-wave.webp",
  fist: "/brand/kudi-fist.webp",
  headphones: "/brand/kudi-headphones.webp",
  "thumbs-up": "/brand/kudi-thumbs-up.webp",
  celebrate: "/brand/kudi-celebrate.webp",
} as const;

export type KudiPose = keyof typeof POSES;

/** Kudi the cub, a brand image at a fixed display width (height follows the picture). */
export function Kudi({ pose, alt, width, priority = false }: { pose: KudiPose; alt: string; width: number; priority?: boolean }) {
  return (
    <Image
      src={POSES[pose]}
      alt={alt}
      width={width}
      height={width}
      unoptimized
      priority={priority}
      style={{ width, maxWidth: "100%", height: "auto" }}
    />
  );
}
