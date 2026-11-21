import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { NavLink } from "./NavLink";

export const SITE_NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/age-bands", label: "Age bands" },
  { href: "/safety", label: "Safety" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const SITE_FOOTER = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy#children", label: "Children's privacy" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container">
        <Link href="/" className="site-brand" aria-label="KudiCubs home">
          <Image src="/brand/logo-on-white.svg" alt="KudiCubs" width={160} height={44} unoptimized priority />
        </Link>
        <nav className="site-nav" aria-label="Main">
          {SITE_NAV.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
          <NavLink href="/family/signin">Family sign-in</NavLink>
          <NavLink href="/get-the-app" className="nav-cta">
            Get the app
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <strong>KudiCubs</strong>
        {SITE_FOOTER.map((l) => (
          <Link key={l.label} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
    </footer>
  );
}

/** Website chrome: skip link, header nav, <main id="main">, footer. Used by (site)/layout and not-found. */
export function SiteFrame({ children }: { children: ReactNode }) {
  return (
    <div className="site-frame">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="site-main">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
