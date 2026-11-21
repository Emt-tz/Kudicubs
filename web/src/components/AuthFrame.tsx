import Image from "next/image";
import type { ReactNode } from "react";

/** Centred, shell-less frame for sign-in, code and status pages under /dashboard and /team. */
export function AuthFrame({ children }: { children: ReactNode }) {
  return (
    <div className="auth-frame">
      <div className="brand">
        <Image src="/brand/logo-on-white.svg" alt="KudiCubs" width={180} height={52} unoptimized priority />
      </div>
      <main id="main" className="auth-card">
        {children}
      </main>
    </div>
  );
}
