import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Small outlined info/notice icon used by the console banners. */
export function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ flex: "none", marginTop: 2 }}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export function Notice({ title, children, tone = "info" }: { title: string; children?: ReactNode; tone?: "info" | "error" | "success" }) {
  return (
    <div className={`banner banner-${tone}`} role={tone === "error" ? "alert" : "status"}>
      <InfoIcon />
      <span>
        <strong>{title}</strong> {children}
      </span>
    </div>
  );
}

/** Centred status card used for no-access, not-found and error pages (shell or auth frame). */
export function StatusCard({
  title,
  body,
  actions,
  reference,
  screen,
  image = "/brand/kudi-wave.webp",
  as: Heading = "h1",
}: {
  title: string;
  body: ReactNode;
  actions?: ReactNode;
  reference?: string;
  screen: string;
  image?: string;
  as?: "h1" | "h2";
}) {
  return (
    <section className="form-card" data-screen={screen} style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
      <Image src={image} alt="" width={96} height={96} unoptimized style={{ height: 96, width: "auto" }} />
      <Heading style={{ fontSize: 26, margin: "8px 0" }}>{title}</Heading>
      <p className="muted">{body}</p>
      {actions ? (
        <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
          {actions}
        </div>
      ) : null}
      {reference ? (
        <p className="muted" style={{ fontSize: 13, marginTop: 16, marginBottom: 0 }}>
          {reference}
        </p>
      ) : null}
    </section>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} style={{ display: "inline-flex", alignItems: "center", minHeight: 44, fontWeight: 800 }}>
      ← {children}
    </Link>
  );
}

export function StatusChip({ tone, children }: { tone: "ok" | "quiet" | "off"; children: ReactNode }) {
  const style =
    tone === "ok"
      ? { background: "var(--kc-color-brand-soft-gold)" }
      : tone === "quiet"
        ? { background: "#fff", border: "1.5px solid var(--kc-color-text-primary)" }
        : { background: "var(--kc-color-bg-tray)", color: "var(--kc-color-text-secondary)" };
  return (
    <span className="chip" style={style}>
      {children}
    </span>
  );
}
