"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * A modal opened by the URL (so it can be linked to and works with the back button). Uses the native
 * <dialog> element for focus trapping and Escape; closing it navigates to `closeHref`.
 */
export function ConfirmDialog({
  title,
  icon,
  closeHref,
  children,
  role = "dialog",
}: {
  title: string;
  icon?: ReactNode;
  closeHref: string;
  children: ReactNode;
  role?: "dialog" | "alertdialog";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="db-dialog"
      role={role}
      aria-labelledby="dlg-title"
      onCancel={(e) => {
        e.preventDefault();
        router.replace(closeHref);
      }}
    >
      {icon ? <div className="db-dialog-icon">{icon}</div> : null}
      <h2 id="dlg-title">{title}</h2>
      {children}
    </dialog>
  );
}
