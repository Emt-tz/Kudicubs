/** Small inline icons used by the website states (decorative: always aria-hidden). */
export function AlertIcon({ size = 26 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3E2312" strokeWidth="2" style={{ flex: "none" }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v6M12 16.5v.5" />
    </svg>
  );
}

export function CheckIcon({ size = 24 }: { size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#16793A" strokeWidth="2.5" style={{ flex: "none" }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M7.5 12.5l3 3 6-7" />
    </svg>
  );
}

export function WarnIcon() {
  return (
    <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3E2312" strokeWidth="2" style={{ flex: "none" }}>
      <path d="M12 3l10 18H2z" />
      <path d="M12 10v5M12 18v.5" />
    </svg>
  );
}

export function Spinner({ size = 22, dark = false, label }: { size?: number; dark?: boolean; label?: string }) {
  return (
    <svg
      className="ws-spin"
      width={size}
      height={size}
      viewBox="0 0 26 26"
      fill="none"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      <circle cx="13" cy="13" r="10" stroke={dark ? "rgba(62,35,18,.25)" : "#F2E8D4"} strokeWidth="4" />
      <path d="M13 3a10 10 0 0 1 10 10" stroke={dark ? "#3E2312" : "#F68C1F"} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="error" id={id}>
      <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3E2312" strokeWidth="2.2" style={{ flex: "none" }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 7v6M12 16.5v.5" />
      </svg>
      <span>{children}</span>
    </div>
  );
}
