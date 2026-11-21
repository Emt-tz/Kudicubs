"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useRef, useState, useTransition } from "react";
import { sendCode, verifyCode } from "@/lib/auth/actions";
import { Kudi } from "../../_components/Kudi";
import { AlertIcon, FieldError, Spinner } from "../../_components/icons";
import { isValidEmail } from "../../contact/validate";

export type SignInDemo = "error" | "sending";

type Problem = { title: string; body: string; field: string; noFamily: boolean };

const NO_FAMILY: Problem = {
  title: "We could not find a family with that email",
  body: "Check the spelling, or use the email you gave when you set up KudiCubs.",
  field: "No family found for this address",
  noFamily: true,
};

const BAD_EMAIL: Problem = {
  title: "Check the email address",
  body: "It should look like name@example.com.",
  field: "Check the email address, it looks incomplete",
  noFamily: false,
};

function problemFor(error: string, message: string): Problem {
  if (error === "no_family") return NO_FAMILY;
  if (error === "invalid_email") return BAD_EMAIL;
  if (error === "rate_limited") return { title: "Please wait a moment", body: message, field: "Too many codes requested", noFamily: false };
  return { title: "We could not send your code", body: message, field: "The code could not be sent to this address", noFamily: false };
}

/** Website family sign-in: email -> emailed code -> Parent Dashboard. Uses the foundation's sendCode / verifyCode (area 'family'). */
export function FamilySignIn({ demo }: { demo: SignInDemo | null }) {
  const router = useRouter();
  const uid = useId();
  const [email, setEmail] = useState(demo === "error" ? "parent@exmaple.com" : demo === "sending" ? "parent@example.com" : "");
  const [problem, setProblem] = useState<Problem | null>(demo === "error" ? NO_FAMILY : null);
  const [step, setStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [sendingCode, startSend] = useTransition();
  const [verifying, startVerify] = useTransition();
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  const sending = sendingCode || demo === "sending";
  const emailId = `${uid}-email`;
  const codeId = `${uid}-code`;

  function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (sending) return;
    const clean = email.trim();
    if (!isValidEmail(clean)) {
      setProblem(BAD_EMAIL);
      requestAnimationFrame(() => alertRef.current?.focus());
      return;
    }
    setProblem(null);
    startSend(async () => {
      const res = await sendCode(clean, "family");
      if (res.ok) {
        setEmail(res.email);
        setStep("code");
        setCode("");
        setCodeError(null);
        requestAnimationFrame(() => codeRef.current?.focus());
      } else {
        setProblem(problemFor(res.error, res.message));
        requestAnimationFrame(() => alertRef.current?.focus());
      }
    });
  }

  function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (verifying) return;
    setCodeError(null);
    startVerify(async () => {
      const res = await verifyCode(email, code, "family");
      if (res.ok) {
        router.push(res.redirectTo);
      } else {
        setCodeError(res.message);
        requestAnimationFrame(() => codeRef.current?.focus());
      }
    });
  }

  const side = (
    <div className="ws-side">
      <Kudi pose="headphones" alt="Kudi with headphones" width={180} priority />
      <h1 className="ws-h1">Family sign-in</h1>
      <p className="ws-lead">For parents and carers. We email you a one-time code, so there is no password to remember.</p>
    </div>
  );

  if (step === "code") {
    return (
      <div className="ws-wrap ws-split ws-split-signin" data-screen="wb-09-signin">
        {side}
        <form className="ws-form" onSubmit={submitCode} noValidate aria-busy={verifying || undefined}>
          <div role="status" className="ws-status" style={{ fontWeight: 700 }}>
            We sent a 6-digit code to <strong>{email}</strong>. It works for 10 minutes.
          </div>
          {codeError ? (
            <div role="alert" className="ws-alert" ref={alertRef} tabIndex={-1}>
              <AlertIcon />
              <div>
                <strong>That did not work</strong>
                {codeError}
              </div>
            </div>
          ) : null}
          <div className={`field${codeError ? " has-error" : ""}`}>
            <label htmlFor={codeId}>6-digit code</label>
            <input
              id={codeId}
              ref={codeRef}
              className="code-input"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d\s]/g, ""))}
              readOnly={verifying}
              aria-invalid={codeError ? true : undefined}
              aria-describedby={codeError ? `${codeId}-err` : undefined}
            />
            {codeError ? <FieldError id={`${codeId}-err`}>{codeError}</FieldError> : null}
          </div>
          <button type="submit" className="btn btn-primary ws-cta" disabled={verifying} aria-disabled={verifying || undefined}>
            {verifying ? (
              <>
                <Spinner size={22} dark />
                Signing you in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
          <p className="ws-small">
            No email yet? Check your spam folder.{" "}
            <button type="button" className="ws-linkbtn" onClick={() => requestCode()} disabled={sendingCode}>
              Send a new code
            </button>{" "}
            <button
              type="button"
              className="ws-linkbtn"
              onClick={() => {
                setStep("email");
                setCodeError(null);
                requestAnimationFrame(() => emailRef.current?.focus());
              }}
            >
              Use a different email
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="ws-wrap ws-split ws-split-signin" data-screen={problem ? "wb-10-signin-error" : sending ? "wb-11-signin-sending" : "wb-09-signin"}>
      {side}
      <form className="ws-form" onSubmit={requestCode} noValidate aria-busy={sending || undefined}>
        {problem && !sending ? (
          <div role="alert" className="ws-alert" ref={alertRef} tabIndex={-1}>
            <AlertIcon />
            <div>
              <strong>{problem.title}</strong>
              {problem.body}
            </div>
          </div>
        ) : null}

        <div className={`field${problem && !sending ? " has-error" : ""}`}>
          <label htmlFor={emailId}>Parent email address</label>
          <input
            id={emailId}
            ref={emailRef}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="parent@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (problem) setProblem(null);
            }}
            readOnly={sending}
            aria-invalid={problem && !sending ? true : undefined}
            aria-describedby={problem && !sending ? `${emailId}-err` : `${emailId}-hint`}
            style={sending ? { opacity: 0.7 } : undefined}
          />
          {!problem || sending ? (
            <div className="hint" id={`${emailId}-hint`}>
              Use the email you gave when you set up the family.
            </div>
          ) : null}
          {problem && !sending ? <FieldError id={`${emailId}-err`}>{problem.field}</FieldError> : null}
        </div>

        <button type="submit" className="btn btn-primary ws-cta" disabled={sending} aria-disabled={sending || undefined} style={sending ? { opacity: 0.75 } : undefined}>
          {sending ? (
            <>
              <Spinner size={22} dark />
              Sending your code...
            </>
          ) : (
            "Send me a code"
          )}
        </button>

        {sending ? (
          <p role="status" className="ws-small">
            This usually takes a few seconds.
          </p>
        ) : problem ? (
          <p className="ws-small">
            {problem.noFamily ? (
              <>
                New here? <Link href="/get-the-app" style={{ fontWeight: 800 }}>Get the app</Link> to set up your family.{" "}
              </>
            ) : null}
            Still stuck? <Link href="/contact" style={{ fontWeight: 800 }}>Contact us</Link>.
          </p>
        ) : (
          <p className="ws-small" style={{ fontSize: 14 }}>
            Children do not sign in here. This page opens the Parent Dashboard.
          </p>
        )}
      </form>
    </div>
  );
}
