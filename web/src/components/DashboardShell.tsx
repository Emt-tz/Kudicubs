import Link from "next/link";
import type { ReactNode } from "react";
import { Breadcrumb, SidebarFrame, initials } from "./Shell";
import { DashboardNav } from "./DashboardNav";
import { IconBell, IconChevron } from "./icons";

export type ChildLink = { id: string; nickname: string };

/**
 * Parent Dashboard shell (dark sidebar + top bar).
 * @param email          the signed-in parent's email (shown to screen readers and as the avatar)
 * @param familyName     label above "Sign out" (default "Your family")
 * @param childProfiles  the family's children (id + nickname) for the Child/Skills/Activity/Badges links and the switcher
 * @param notificationCount  shows the dot on the bell when > 0
 */
export function DashboardShell({
  email,
  familyName = "Your family",
  childProfiles,
  notificationCount = 0,
  children,
}: {
  email: string;
  familyName?: string;
  childProfiles: ChildLink[];
  notificationCount?: number;
  children: ReactNode;
}) {
  return (
    <SidebarFrame
      area="dashboard"
      email={email}
      label={familyName}
      sidebar={<DashboardNav childProfiles={childProfiles} />}
      topbar={
        <>
          <Breadcrumb
            root="Family"
            items={[
              { href: "/dashboard/notifications", label: "Notifications" },
              { href: "/dashboard/summary", label: "Monthly summary" },
              { href: "/dashboard/devices", label: "Devices and data" },
              { href: "/dashboard/settings", label: "Settings" },
              { href: "/dashboard/children", label: "Child" },
              { href: "/dashboard", label: "Overview" },
            ]}
          />
          <div className="grow" />
          {childProfiles.length > 0 ? (
            <details className="menu">
              <summary>
                All children <IconChevron />
              </summary>
              <div className="menu-list">
                <Link href="/dashboard">All children</Link>
                {childProfiles.map((c) => (
                  <Link key={c.id} href={`/dashboard/children/${c.id}`}>
                    {c.nickname}
                  </Link>
                ))}
              </div>
            </details>
          ) : null}
          <Link href="/dashboard/notifications" className="icon-btn" aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} new` : "Notifications"}>
            <IconBell />
            {notificationCount > 0 ? <span className="dot" /> : null}
          </Link>
          <div className="avatar avatar-dark" aria-hidden="true">
            {initials(email)}
          </div>
        </>
      }
    >
      {children}
    </SidebarFrame>
  );
}
