"use client";

import { usePathname } from "next/navigation";

export type CrumbItem = { href: string; label: string };

/** "Root / Label" where Label is the longest-matching item for the current path. */
export function Breadcrumb({ root, items }: { root: string; items: CrumbItem[] }) {
  const path = (usePathname() ?? "").replace(/\/+$/, "") || "/";
  const hit = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => path === i.href || path.startsWith(i.href + "/"));
  return (
    <div className="crumbs">
      {root} / <strong>{hit?.label ?? ""}</strong>
    </div>
  );
}
