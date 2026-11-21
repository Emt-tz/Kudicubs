import type { ReactNode } from "react";
import type { DemoState } from "@/lib/demo-state";
import { Skeleton } from "./Skeleton";

export type StateViewProps = {
  /** From getDemoState(searchParams) or from the real data (loading/empty/error/offline). */
  state: DemoState;
  /** Shape of the loading skeleton. */
  skeleton?: "cards" | "table" | "list" | "form";
  empty?: { title: string; body?: string; action?: ReactNode; image?: string };
  error?: { title: string; body?: string; retryHref?: string };
  offline?: { title?: string; body?: string };
  /** Shown for 'normal' (and under the banner for 'offline'). */
  children: ReactNode;
};

function SkeletonBody({ kind }: { kind: NonNullable<StateViewProps["skeleton"]> }) {
  if (kind === "cards")
    return (
      <div className="grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-soft stack">
            <Skeleton width="50%" height={20} />
            <Skeleton height={14} />
            <Skeleton width="70%" height={14} />
          </div>
        ))}
      </div>
    );
  if (kind === "table")
    return (
      <div className="card-soft stack">
        <Skeleton height={36} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={28} />
        ))}
      </div>
    );
  if (kind === "form")
    return (
      <div className="card-soft stack">
        <Skeleton width="30%" height={16} />
        <Skeleton height={48} />
        <Skeleton width="30%" height={16} />
        <Skeleton height={48} />
      </div>
    );
  return (
    <div className="stack">
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} height={52} />
      ))}
    </div>
  );
}

/** Renders the designed loading / empty / error / offline version of a screen, or its children. */
export function StateView({ state, skeleton = "cards", empty, error, offline, children }: StateViewProps) {
  if (state === "loading")
    return (
      <div role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading</span>
        <SkeletonBody kind={skeleton} />
      </div>
    );
  if (state === "empty")
    return (
      <div className="empty">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={empty?.image ?? "/brand/kudi-wave.webp"} alt="" />
        <h3>{empty?.title ?? "Nothing here yet"}</h3>
        {empty?.body ? <p className="muted">{empty.body}</p> : null}
        {empty?.action}
      </div>
    );
  if (state === "error")
    return (
      <div className="banner banner-error" role="alert">
        <div>
          <strong>{error?.title ?? "Something went wrong"}</strong>
          <p style={{ margin: 0 }}>{error?.body ?? "We could not load this. Please try again."}</p>
          {error?.retryHref ? (
            <p style={{ margin: "8px 0 0" }}>
              <a className="btn btn-sm" href={error.retryHref}>
                Try again
              </a>
            </p>
          ) : null}
        </div>
      </div>
    );
  if (state === "offline")
    return (
      <div className="stack">
        <div className="banner banner-offline" role="status">
          <div>
            <strong>{offline?.title ?? "You are offline"}</strong>
            <p style={{ margin: 0 }}>{offline?.body ?? "Showing what we last saved. It will update when you are back online."}</p>
          </div>
        </div>
        {children}
      </div>
    );
  return <>{children}</>;
}
