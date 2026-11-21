import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/Skeleton";
import "./dashboard-a.css";
import { avatarColour, initial } from "./format";

type IconProps = { size?: number; stroke?: string; sw?: number; children: ReactNode };
const Ic = ({ size = 18, stroke = "currentColor", sw = 2, children }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flex: "none" }}>
    {children}
  </svg>
);
export const IconInfo = ({ size }: { size?: number }) => (<Ic size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" /></Ic>);
export const IconCheck = ({ size = 12 }: { size?: number }) => (<Ic size={size} sw={3}><path d="M5 12l5 5 9-10" /></Ic>);
export const IconClock = ({ size = 12 }: { size?: number }) => (<Ic size={size} sw={3}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Ic>);
export const IconUp = () => (<Ic size={12} sw={3}><path d="M12 19V5M5 12l7-7 7 7" /></Ic>);
export const IconDown = () => (<Ic size={12} sw={3}><path d="M12 5v14M5 12l7 7 7-7" /></Ic>);
export const IconFlat = () => (<Ic size={12} sw={3}><path d="M5 12h14" /></Ic>);
export const IconMedal = ({ size = 36 }: { size?: number }) => (<Ic size={size}><circle cx="12" cy="9" r="6" /><path d="M8.5 14L7 22l5-3 5 3-1.5-8" /></Ic>);
export const IconLock = ({ size = 36 }: { size?: number }) => (<Ic size={size}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></Ic>);

export function ChildDot({ name, size = "sm" }: { name: string; size?: "sm" | "lg" }) {
  const bg = avatarColour(name);
  const cls = `da-dot ${size === "lg" ? "lg" : ""} ${bg === "#FCE6C6" ? "is-light" : ""} ${bg === "#644D3B" ? "is-dark" : ""}`;
  return (
    <span className={cls} style={{ background: bg }} aria-hidden="true">
      {size === "lg" ? initial(name) : null}
    </span>
  );
}

export function Chip({ tone = "soft", flat, children }: { tone?: "ok" | "soft"; flat?: boolean; children: ReactNode }) {
  return <span className={`da-chip ${tone === "ok" ? "ok" : ""} ${flat ? "flat" : ""}`}>{children}</span>;
}

export function PageHead({ title, sub, actions, lead }: { title: string; sub?: ReactNode; actions?: ReactNode; lead?: ReactNode }) {
  return (
    <div className="da-head">
      {lead}
      <div className="da-head-text">
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      {actions ? <div className="da-head-actions">{actions}</div> : null}
    </div>
  );
}

export function Kpi({ label, value, unit, spark, chip, note, bar }: { label: string; value: ReactNode; unit?: string; spark?: ReactNode; chip?: ReactNode; note?: ReactNode; bar?: number }) {
  return (
    <div className="da-kpi">
      <div className="da-kpi-label">{label}</div>
      <div className="da-kpi-row">
        <div className="da-kpi-value">
          {value}
          {unit ? <small>{unit}</small> : null}
        </div>
        {spark}
      </div>
      {bar !== undefined ? (
        <div className="da-bar" role="img" aria-label={`${bar}% of the way to the next level`}>
          <span style={{ width: `${bar}%` }} />
        </div>
      ) : null}
      {note ? <div className="da-kpi-note">{note}</div> : null}
      {chip}
    </div>
  );
}

export function Panel({ title, sub, aside, pad = true, children }: { title?: string; sub?: ReactNode; aside?: ReactNode; pad?: boolean; children: ReactNode }) {
  return (
    <section className="da-panel">
      {pad ? (
        <div className="da-panel-pad">
          {title ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <h2 style={{ flex: 1 }}>{title}</h2>
              {aside}
            </div>
          ) : null}
          {sub ? <p className="da-sub">{sub}</p> : null}
          {children}
        </div>
      ) : (
        <>
          {title ? (
            <div className="da-panel-head">
              <h2>{title}</h2>
              {aside}
            </div>
          ) : null}
          {children}
        </>
      )}
    </section>
  );
}

/** Segmented link control; the choice lives in the URL so it works without scripts. */
export function Seg({ label, items }: { label: string; items: { label: string; href: string; active: boolean }[] }) {
  return (
    <nav className="da-seg" aria-label={label}>
      {items.map((i) => (
        <Link key={i.label} href={i.href} aria-current={i.active ? "true" : undefined} scroll={false}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

export function BarRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="da-skill-row">
      <div className="top">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="track" role="img" aria-label={`${label} ${pct} percent`}>
        <div className="fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function ErrorPanel({ retryHref, reference }: { retryHref: string; reference: string }) {
  return (
    <>
      <div className="banner banner-error" role="alert">
        <IconInfo size={20} />
        <div>
          <strong>Some information is missing.</strong> We could not load your family&apos;s progress.
        </div>
      </div>
      <section className="da-panel da-empty">
        <h2>We could not load this</h2>
        <p>The server took too long to answer. Your children&apos;s progress is safe. Please try again in a moment.</p>
        <div className="actions">
          <Link href={retryHref} className="btn btn-sm btn-secondary" prefetch={false}>
            Try again
          </Link>
          <Link href="/contact" className="btn btn-sm">
            Contact support
          </Link>
        </div>
        <div className="da-err-ref">Ref {reference}</div>
      </section>
    </>
  );
}

export function EmptyPanel({ image, alt, title, body, children }: { image: string; alt: string; title: string; body: string; children?: ReactNode }) {
  return (
    <section className="da-panel da-empty">
      <Image src={image} alt={alt} width={160} height={160} unoptimized />
      <h2>{title}</h2>
      <p>{body}</p>
      {children ? <div className="actions">{children}</div> : null}
    </section>
  );
}

/** Loading skeleton shaped like the overview (dp-07). */
export function OverviewSkeleton() {
  return (
    <div className="da" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your family...</span>
      <div className="da-head">
        <div className="da-head-text">
          <Skeleton width={220} height={32} />
          <Skeleton width="60%" height={16} style={{ marginTop: 8 }} />
        </div>
        <span className="muted">Loading your family...</span>
      </div>
      <div className="da-kpis">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="da-kpi">
            <Skeleton width="50%" height={12} />
            <Skeleton width="40%" height={32} style={{ marginTop: 10 }} />
            <Skeleton width="60%" height={20} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <section className="da-panel da-panel-pad">
        <Skeleton width={160} height={24} />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} height={28} style={{ marginTop: 14 }} />
        ))}
      </section>
      <div className="da-split">
        <section className="da-panel da-panel-pad">
          <Skeleton height={180} />
        </section>
        <section className="da-panel da-panel-pad">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={36} style={{ marginBottom: 12 }} />
          ))}
        </section>
      </div>
    </div>
  );
}

/** Loading skeleton for the child pages (dash-02 and its tabs). */
export function ChildSkeleton() {
  return (
    <div className="da" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="da-head">
        <div className="da-child-id">
          <Skeleton width={56} height={56} style={{ borderRadius: 999 }} />
          <div style={{ flex: 1 }}>
            <Skeleton width={160} height={30} />
            <Skeleton width="50%" height={14} style={{ marginTop: 8 }} />
          </div>
        </div>
      </div>
      <div className="da-kpis">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="da-kpi">
            <Skeleton width="50%" height={12} />
            <Skeleton width="40%" height={32} style={{ marginTop: 10 }} />
            <Skeleton width="60%" height={14} style={{ marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className="da-split even">
        <section className="da-panel da-panel-pad">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={22} style={{ marginBottom: 14 }} />
          ))}
        </section>
        <section className="da-panel da-panel-pad">
          <Skeleton height={190} />
        </section>
      </div>
    </div>
  );
}
