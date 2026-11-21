"use client";

export function PrintButton({ children }: { children: React.ReactNode }) {
  return (
    <button type="button" className="btn btn-sm" onClick={() => window.print()}>
      {children}
    </button>
  );
}
