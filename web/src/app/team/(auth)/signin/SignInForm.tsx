"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { sendCode, verifyCode } from "@/lib/auth/actions";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const send = () =>
    start(async () => {
      setError(null);
      const res = await sendCode(email, "team");
      if (res.ok) {
        setEmail(res.email);
        setStep("code");
      } else setError(res.message);
    });

  const verify = () =>
    start(async () => {
      setError(null);
      const res = await verifyCode(email, code, "team");
      if (res.ok) {
        router.push(res.redirectTo);
        router.refresh();
      } else setError(res.message);
    });

  return (
    <form
      className="form-card"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (step === "email") send();
        else verify();
      }}
    >
      <h1 style={{ fontSize: 26 }}>Sign in to the Team Console</h1>
      <p className="muted">Use your work email. Each role only sees what it needs to do its job.</p>

      {step === "email" ? (
        <div className={`field${error ? " has-error" : ""}`}>
          <label htmlFor="email">Work email</label>
          <input id="email" name="email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} aria-describedby="email-hint email-error" aria-invalid={error ? true : undefined} />
          <div className="hint" id="email-hint">We email a one-time code. There is no password.</div>
          <div className="error" id="email-error" role="alert">{error}</div>
        </div>
      ) : (
        <>
          <p role="status">
            If <strong>{email}</strong> belongs to a staff member, a 6-digit code is on its way. It works for 10 minutes.
          </p>
          <div className={`field${error ? " has-error" : ""}`}>
            <label htmlFor="code">6-digit code</label>
            <input id="code" name="code" className="code-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="[0-9]{6}" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-describedby="code-error" aria-invalid={error ? true : undefined} />
            <div className="error" id="code-error" role="alert">{error}</div>
          </div>
        </>
      )}

      <button type="submit" className={`btn btn-primary${pending ? " is-loading" : ""}`} style={{ width: "100%" }} disabled={pending}>
        {step === "email" ? (pending ? "Sending..." : "Send me a code") : pending ? "Checking..." : "Sign in"}
      </button>
      {step === "code" ? (
        <p style={{ marginTop: 12, marginBottom: 0 }}>
          <button
            type="button"
            className="btn btn-quiet btn-sm"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
          >
            Use a different email
          </button>
        </p>
      ) : null}
    </form>
  );
}
