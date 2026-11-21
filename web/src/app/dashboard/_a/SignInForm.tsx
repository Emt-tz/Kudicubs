"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { sendCode } from "@/lib/auth/actions";
import { IconInfo } from "./ui";

type Phase = "idle" | "sending" | "error" | "offline";

const DEMO_EMAIL = "parent@example.com";

/** dp-01 sign-in, dp-02 error, dp-03 sending. `initial` only opens a designed state directly (?state=). */
export function SignInForm({ initial }: { initial: "idle" | "error" | "loading" }) {
  const router = useRouter();
  const [email, setEmail] = useState(initial === "loading" ? DEMO_EMAIL : initial === "error" ? "parent@example" : "");
  const [phase, setPhase] = useState<Phase>(initial === "loading" ? "sending" : initial === "error" ? "error" : "idle");
  const [fieldError, setFieldError] = useState(initial === "error" ? "Please check the email address. It should look like name@example.com." : "");
  const [banner, setBanner] = useState(initial === "error" ? "We could not send a code. Check the email address and try again." : "");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (phase === "sending") return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setPhase("offline");
      return;
    }
    setFieldError("");
    setBanner("");
    setPhase("sending");
    try {
      const result = await sendCode(email, "dashboard");
      if (result.ok) {
        router.push("/dashboard/code");
        return;
      }
      setPhase("error");
      if (result.error === "invalid_email") {
        setBanner("We could not send a code. Check the email address and try again.");
        setFieldError(result.message);
      } else {
        setBanner(result.message);
      }
    } catch {
      // The request never reached the server.
      setPhase("offline");
    }
  }

  const sending = phase === "sending";
  return (
    <form onSubmit={onSubmit} noValidate aria-busy={sending} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {phase === "offline" ? (
        <div className="banner banner-offline" role="alert">
          <div>
            <strong>You are offline.</strong> Connect to the internet, then press Send me a code again.
          </div>
        </div>
      ) : null}
      {banner ? (
        <div className="banner banner-error" role="alert">
          <IconInfo size={18} />
          <div>{banner}</div>
        </div>
      ) : null}
      <div className={`field ${fieldError ? "has-error" : ""}`}>
        <label htmlFor="parent-email">Parent email</label>
        <input
          id="parent-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={email}
          disabled={sending}
          aria-invalid={fieldError ? true : undefined}
          aria-describedby="parent-email-hint"
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="hint" id="parent-email-hint">
          Use the email you gave when you set up KudiCubs.
        </div>
        {fieldError ? <div className="error">{fieldError}</div> : null}
      </div>
      <button type="submit" className="da-btn-primary" disabled={sending}>
        {sending ? "Sending your code..." : "Send me a code"}
      </button>
      {sending ? (
        <p role="status" className="da-auth-foot">
          Sending a code to <strong>{email}</strong>. This usually takes a few seconds.
        </p>
      ) : (
        <p className="da-auth-foot">This page is for grown-ups. Children play in the KudiCubs app.</p>
      )}
      <div className="da-auth-links">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/contact">Need help?</Link>
      </div>
    </form>
  );
}
