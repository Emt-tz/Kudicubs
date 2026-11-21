"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IDLE_TIMEOUT_MS } from "./consts";

const ACTIVITY = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;
const WARN_BEFORE_MS = 60_000;

/**
 * Signs the parent out after 15 minutes without activity and sends them to the session-timeout page.
 * One minute before, a banner offers "Stay signed in". `seconds` shortens the wait (used by tests via
 * ?idle=, which is honoured only when demo states are on).
 */
export function IdleTimeout({ seconds }: { seconds?: number }) {
  const router = useRouter();
  const timeoutMs = seconds ? seconds * 1000 : IDLE_TIMEOUT_MS;
  const warnBefore = Math.min(WARN_BEFORE_MS, Math.floor(timeoutMs / 2));
  const last = useRef(0);
  const [left, setLeft] = useState<number | null>(null);

  const stay = useCallback(() => {
    last.current = Date.now();
    setLeft(null);
  }, []);

  useEffect(() => {
    last.current = Date.now();
    let done = false;
    const bump = () => {
      if (!done && Date.now() - last.current < timeoutMs - warnBefore) last.current = Date.now();
    };
    for (const e of ACTIVITY) window.addEventListener(e, bump, { passive: true });
    const timer = window.setInterval(async () => {
      const idle = Date.now() - last.current;
      if (idle >= timeoutMs) {
        done = true;
        window.clearInterval(timer);
        try {
          await createClient().auth.signOut({ scope: "local" });
        } catch {
          // the session cookie is cleared by the proxy on the next request anyway
        }
        router.replace("/dashboard/session-timeout");
      } else if (idle >= timeoutMs - warnBefore) {
        setLeft(Math.ceil((timeoutMs - idle) / 1000));
      }
    }, 500);
    return () => {
      window.clearInterval(timer);
      for (const e of ACTIVITY) window.removeEventListener(e, bump);
    };
  }, [router, timeoutMs, warnBefore]);

  if (left === null) return null;
  return (
    <div className="db-idle banner banner-info" role="alert" data-testid="idle-banner">
      <div>
        <strong>Are you still there?</strong>
        <p style={{ margin: 0 }}>For your family&apos;s safety we sign you out after 15 minutes of no activity. You will be signed out in {left} second{left === 1 ? "" : "s"}.</p>
      </div>
      <button type="button" className="btn btn-sm btn-primary" onClick={stay}>
        Stay signed in
      </button>
    </div>
  );
}
