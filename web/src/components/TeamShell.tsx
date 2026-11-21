import type { ReactNode } from "react";
import type { StaffRole } from "@/lib/auth/types";
import { Breadcrumb, SidebarFrame, initials } from "./Shell";
import { NavLink } from "./NavLink";
import { IconBell, IconContent, IconFamilies } from "./icons";

const ROLE_LABEL: Record<StaffRole, string> = { support: "Support", content: "Content", admin: "Admin" };

/**
 * Team Console shell (dark sidebar + top bar with search).
 * The search box submits GET /team/families?q=<text>.
 */
export function TeamShell({ email, role, children }: { email: string; role: StaffRole; children: ReactNode }) {
  return (
    <SidebarFrame
      area="team"
      email={email}
      label={`${ROLE_LABEL[role]} staff`}
      sidebar={
        <>
          <div className="nav-heading">Staff</div>
          <NavLink href="/team/families" className="nav-link">
            <IconFamilies />
            Families
          </NavLink>
          <NavLink href="/team/content" className="nav-link">
            <IconContent />
            Content
          </NavLink>
        </>
      }
      topbar={
        <>
          <Breadcrumb
            root="Team Console"
            items={[
              { href: "/team/families", label: "Families" },
              { href: "/team/content", label: "Content" },
            ]}
          />
          <div className="grow" />
          <form action="/team/families" role="search">
            <input name="q" className="topbar-search" aria-label="Search families" placeholder="Search" />
          </form>
          <span className="pill">Role: {ROLE_LABEL[role]}</span>
          <span className="icon-btn" aria-hidden="true">
            <IconBell />
          </span>
          <div className="avatar avatar-dark" aria-hidden="true" title={email}>
            {initials(email)}
          </div>
        </>
      }
    >
      {children}
    </SidebarFrame>
  );
}
