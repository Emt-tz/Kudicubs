"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** A link that marks itself aria-current="page" when it matches the current path. */
export function NavLink({
  href,
  exact = false,
  matchPrefix,
  className,
  children,
}: {
  href: string;
  /** Only the exact path counts as current. */
  exact?: boolean;
  /** Treat this prefix as current instead of href (e.g. the whole /dashboard/children/<id> subtree). */
  matchPrefix?: string;
  className?: string;
  children: ReactNode;
}) {
  const path = (usePathname() ?? "").replace(/\/+$/, "") || "/";
  const base = matchPrefix ?? href.split("?")[0];
  const current = exact ? path === base : path === base || path.startsWith(base + "/");
  return (
    <Link href={href} className={className} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}
