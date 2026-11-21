"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "./NavLink";
import {
  IconActivity, IconBadge, IconBell, IconCalendar, IconChild, IconDevice, IconOverview, IconSettings, IconSkills,
} from "./icons";

/** Sidebar links for the Parent Dashboard. Child links follow the child in the URL, else the first child. */
export function DashboardNav({ childProfiles }: { childProfiles: { id: string; nickname: string }[] }) {
  const path = usePathname() ?? "";
  const inPath = /^\/dashboard\/children\/([^/]+)/.exec(path)?.[1];
  const childId = inPath && childProfiles.some((c) => c.id === inPath) ? inPath : childProfiles[0]?.id;
  const base = childId ? `/dashboard/children/${childId}` : "/dashboard";

  return (
    <>
      <div className="nav-heading">Your children</div>
      <NavLink href="/dashboard" exact className="nav-link">
        <IconOverview />
        Overview
      </NavLink>
      <NavLink href={base} exact className="nav-link">
        <IconChild />
        Children
      </NavLink>
      <NavLink href={`${base}/skills`} className="nav-link">
        <IconSkills />
        Skills
      </NavLink>
      <NavLink href={`${base}/activity`} className="nav-link">
        <IconActivity />
        Activity
      </NavLink>
      <NavLink href={`${base}/badges`} className="nav-link">
        <IconBadge />
        Badges
      </NavLink>
      <div className="nav-heading">Family</div>
      <NavLink href="/dashboard/settings" className="nav-link">
        <IconSettings />
        Settings
      </NavLink>
      <NavLink href="/dashboard/devices" className="nav-link">
        <IconDevice />
        Devices and data
      </NavLink>
      <NavLink href="/dashboard/summary" className="nav-link">
        <IconCalendar />
        Monthly summary
      </NavLink>
      <NavLink href="/dashboard/notifications" className="nav-link">
        <IconBell />
        Notifications
      </NavLink>
    </>
  );
}
