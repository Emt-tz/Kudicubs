import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/lib/auth/actions";
import type { SignInArea } from "@/lib/auth/types";
import { Breadcrumb, type CrumbItem } from "./Breadcrumb";

export const initials = (text: string) => (text.replace(/@.*/, "").replace(/[^a-z0-9]/gi, "").slice(0, 2) || "?").toUpperCase();

/** Logo + sidebar frame shared by the Parent Dashboard and the Team Console. */
export function SidebarFrame({
  area,
  email,
  label,
  topbar,
  children,
  sidebar,
}: {
  area: SignInArea;
  email: string;
  /** Small line above "Sign out" (family name or staff role). */
  label: string;
  sidebar: ReactNode;
  topbar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className="app-sidebar" aria-label={area === "team" ? "Team Console" : "Parent Dashboard"}>
        <Link href={area === "team" ? "/team/families" : "/dashboard"} className="brand" aria-label="KudiCubs">
          <Image src="/brand/logo-on-brown.svg" alt="KudiCubs" width={150} height={42} unoptimized priority />
        </Link>
        <nav aria-label="Sections" style={{ display: "contents" }}>
          {sidebar}
        </nav>
        <div className="nav-spacer" />
        <div className="user-chip">
          <div className="avatar" aria-hidden="true">
            {initials(email)}
          </div>
          <div className="who">
            <strong title={email}>{label}</strong>
            <span className="sr-only">Signed in as {email}</span>
            <form action={signOut.bind(null, area)}>
              <button type="submit" className="link-button">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar">{topbar}</header>
        <main id="main" className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}

export type { CrumbItem };
export { Breadcrumb };
