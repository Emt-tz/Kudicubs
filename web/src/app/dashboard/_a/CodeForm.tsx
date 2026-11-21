"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { sendCode, verifyCode } from "@/lib/auth/actions";
import { IconInfo } from "./ui";

type Phase = "idle" | "verifying" | "wrong" | "expired" | "locked" | "offline" | "failed";

const DEMO_EMAIL = "parent@example.com";
const RESEND_SECONDS = 45;

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/** dp-04 code entry, dp-05 wrong code, dp-06 expired code. `initial` only opens a designed state directly (?state=). */
export function CodeForm({ email: known, secondsLeft, initial }: { email: string | null; secondsLeft: number; initial: "idle" | "wrong" | "expired" }) {
  const router = useRouter();
  const demo = !known && initial !== "idle";
  const [email, setEmail] = useState(known ?? (demo ? DEMO_EMAIL : ""));
  const [code, setCode] = useState(initial === "wrong" ? "427190" : "");
  const [phase, setPhase] = useState<Phase>(initial === "wrong" ? "wrong" : initial === "expired" ? "expired" : "idle");
  const [message, setMessage] = useState(initial === "wrong" ? "That code is not right. You have 2 attempts left. Check the latest email we sent." : "");
  const [notice, setNotice] = useState("");
  const [left, setLeft] = useState(initial === "idle" ? secondsLeft : 0);
  const [sending, setSending] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const needEmail = !known && !demo;
  const error = phase === "wrong" || phase === "locked";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (phase === "verifying" || phase === "expired") return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setPhase("offline");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setPhase("wrong");
      setMessage("Enter the 6-digit code from the email.");
      input.current?.focus();
      return;
    }
    setNotice("");
    setPhase("verifying");
    try {
      const r = await verifyCode(email, code, "dashboard");
      if (r.ok) {
        router.push(r.redirectTo);
        return;
      }
      if (r.error === "expired_code") setPhase("expired");
      else if (r.error === "too_many_attempts") setPhase("locked");
      else if (r.error === "unknown") setPhase("failed");
      else setPhase("wrong");
      setMessage(r.message);
      setCode("");
      input.current?.focus();
    } catch {
      setPhase("offline");
    }
  }

  async function resend() {
    if (sending) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setPhase("offline");
      return;
    }
    setSending(true);
    setNotice("");
    try {
      const r = await sendCode(email, "dashboard");
      if (r.ok) {
        setPhase("idle");
        setMessage("");
        setCode("");
        setLeft(r.resendAfterSeconds || RESEND_SECONDS);
        setNotice(`We sent a new code to ${r.email}.`);
        input.current?.focus();
      } else {
        setPhase("failed");
        setMessage(r.message);
      }
    } catch {
      setPhase("offline");
    } finally {
      setSending(false);
    }
  }

  if (phase === "expired") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div role="alert" className="banner banner-error">
          <IconInfo size={18} />
          <div>
            <strong>Code expired.</strong> The code we sent to {email || "your email"} is more than 10 minutes old.
          </div>
        </div>
        {needEmail ? <EmailField email={email} onChange={setEmail} /> : null}
        <button type="button" className="da-btn-primary" onClick={resend} disabled={sending || !email} aria-busy={sending}>
          {sending ? "Sending your code..." : "Send me a new code"}
        </button>
        <div className="da-auth-links">
          <Link href="/dashboard/signin">Use a different email</Link>
        </div>
      </div>
    );
  }

  const cells = Array.from({ length: 6 }, (_, i) => code[i] ?? "");
  const current = Math.min(code.length, 5);
  return (
    <form onSubmit={onSubmit} noValidate aria-busy={phase === "verifying"} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {phase === "offline" ? (
        <div className="banner banner-offline" role="alert">
          <div>
            <strong>You are offline.</strong> Connect to the internet, then try again.
          </div>
        </div>
      ) : null}
      {notice ? (
        <div className="banner banner-success" role="status">
          <div>{notice}</div>
        </div>
      ) : null}
      {error || phase === "failed" ? (
        <div role="alert" className="banner banner-error">
          <IconInfo size={18} />
          <div>
            <strong>{message.split(/(?<=\.)\s/)[0]}</strong> {message.split(/(?<=\.)\s/).slice(1).join(" ")}
          </div>
        </div>
      ) : null}
      {needEmail ? <EmailField email={email} onChange={setEmail} /> : null}
      <div>
        <label htmlFor="otp" style={{ fontWeight: 800, display: "block", marginBottom: 8 }}>
          6-digit code
        </label>
        <div className="da-otp">
          <div className="da-otp-cells" aria-hidden="true">
            {cells.map((c, i) => (
              <div key={i} className={`da-otp-cell ${i === current ? "is-current" : ""} ${error ? "is-error" : ""}`}>
                {c}
              </div>
            ))}
          </div>
          <input
            id="otp"
            ref={input}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            aria-label="6-digit code"
            aria-invalid={error ? true : undefined}
            disabled={phase === "verifying"}
            autoFocus={!demo}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
        </div>
        {error ? (
          <div className="da-otp-hint">
            <IconInfo size={16} />
            Enter the code again or ask for a new one.
          </div>
        ) : null}
      </div>
      <button type="submit" className="da-btn-primary" disabled={phase === "verifying"}>
        {phase === "verifying" ? "Checking your code..." : error ? "Try again" : "Sign in"}
      </button>
      <div className="da-auth-links">
        {error || phase === "failed" || left <= 0 ? (
          <button type="button" onClick={resend} disabled={sending || !email}>
            {sending ? "Sending..." : "Send a new code"}
          </button>
        ) : (
          <button type="button" disabled>
            Resend code in {mmss(left)}
          </button>
        )}
        <Link href="/dashboard/signin">Use a different email</Link>
      </div>
    </form>
  );
}

function EmailField({ email, onChange }: { email: string; onChange: (v: string) => void }) {
  return (
    <div className="field">
      <label htmlFor="code-email">Parent email</label>
      <input id="code-email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => onChange(e.target.value)} />
      <div className="hint">The email the code was sent to.</div>
    </div>
  );
}
