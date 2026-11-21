import type { CSSProperties } from "react";

/** One shimmering placeholder block. */
export function Skeleton({ width = "100%", height = 16, style }: { width?: number | string; height?: number | string; style?: CSSProperties }) {
  return <span className="skeleton" aria-hidden="true" style={{ width, height, ...style }} />;
}
