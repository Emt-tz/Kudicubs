import type { ReactNode } from "react";

const S = ({ children, size = 22 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: `0 0 ${size}px` }}>
    {children}
  </svg>
);
export const CheckIcon = ({ size }: { size?: number }) => <S size={size}><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></S>;
export const AlertIcon = ({ size }: { size?: number }) => <S size={size}><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.5" /></S>;
export const InfoIcon = ({ size }: { size?: number }) => <S size={size}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></S>;
export const TrashIcon = ({ size }: { size?: number }) => <S size={size}><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6" /></S>;
export const DownloadIcon = ({ size }: { size?: number }) => <S size={size}><path d="M12 3v12M7 10l5 5 5-5M4 20h16" /></S>;
export const FileIcon = ({ size }: { size?: number }) => <S size={size}><path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h6M9 17h6" /></S>;
export const StarIcon = ({ size }: { size?: number }) => <S size={size}><path d="M12 3l2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8L6.7 19.6l1-6L3.3 9.4l6-.9z" /></S>;
export const LevelIcon = ({ size }: { size?: number }) => <S size={size}><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></S>;
export const DeviceIcon = ({ size }: { size?: number }) => <S size={size}><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M11 18h2" /></S>;
export const ChildIcon = ({ size }: { size?: number }) => <S size={size}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></S>;
export const ClockIcon = ({ size }: { size?: number }) => <S size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>;
export const LockIcon = ({ size }: { size?: number }) => <S size={size}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></S>;
