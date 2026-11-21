import type { ReactNode } from "react";

function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconOverview = () => (<Icon><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Icon>);
export const IconChild = () => (<Icon><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Icon>);
export const IconSkills = () => (<Icon><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></Icon>);
export const IconActivity = () => (<Icon><path d="M3 12h4l3-8 4 16 3-8h4" /></Icon>);
export const IconBadge = () => (<Icon><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" /></Icon>);
export const IconSettings = () => (<Icon><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></Icon>);
export const IconDevice = () => (<Icon><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></Icon>);
export const IconShield = () => (<Icon><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /></Icon>);
export const IconCalendar = () => (<Icon><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></Icon>);
export const IconBell = () => (<Icon><path d="M6 16V11a6 6 0 1112 0v5l2 2H4z" /><path d="M10 21h4" /></Icon>);
export const IconFamilies = () => (<Icon><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5a3 3 0 010 6M18 14c1.8.7 3 2.6 3 6" /></Icon>);
export const IconContent = () => (<Icon><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z" /><path d="M4 19V5" /></Icon>);
export const IconChevron = () => (<Icon size={14}><path d="M6 9l6 6 6-6" /></Icon>);
