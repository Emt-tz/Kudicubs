"use client";

import { useId, useRef, useState } from "react";
import { Kudi } from "../_components/Kudi";
import { CheckIcon, FieldError } from "../_components/icons";
import { isValidEmail } from "../contact/validate";

const STORE_NOTE = "Store listing coming soon.";

/**
 * Get-the-app page. "Send me the link" only validates the address and confirms: nothing is emailed or stored.
 * The link is also always available on this page (/get-the-app).
 */
export function GetApp({ initialSentTo }: { initialSentTo: string | null }) {
  const [sentTo, setSentTo] = useState<string | null>(initialSentTo);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const ids = useId();
  const errId = `${ids}-err`;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = email.trim();
    if (!isValidEmail(clean)) {
      setError("Check the email address, it looks incomplete");
      inputRef.current?.focus();
      return;
    }
    setError(null);
    setResent(false);
    setSentTo(clean);
  }

  const hero = (
    <div className="ws-hero-row ws-get-hero">
      <div className="ws-grow">
        <h1 className="ws-h1">Get KudiCubs</h1>
        <p>Free to try on Android and iPhone. Set it up once on your phone and your child can play right away.</p>
      </div>
      <Kudi pose="thumbs-up" alt="Kudi with a thumbs up" width={200} priority />
    </div>
  );

  if (sentTo) {
    return (
      <div className="ws-wrap" data-screen="wb-02-get-app-sent" style={{ gap: 28 }}>
        {hero}
        <section className="ws-form" style={{ maxWidth: 720, padding: 28, gap: 14 }} aria-label="Link sent">
          <div role="status" className="ws-success">
            <CheckIcon size={28} />
            <div>
              <strong className="ws-success-title">Sent! Check your inbox.</strong>
              We emailed the download link to <strong>{sentTo}</strong>. It can take a minute to arrive.
              {resent ? <span className="sr-only"> Sent again.</span> : null}
            </div>
          </div>
          <p className="ws-small">Nothing in your inbox? Check your spam folder, or send it again.</p>
          <p className="ws-small">
            The link is also always on this page: open <strong>/get-the-app</strong> on your phone to find the store links.
          </p>
          <div className="ws-actions">
            <button type="button" className="btn" onClick={() => setResent(true)}>
              Send it again
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setSentTo(null);
                setEmail("");
                setResent(false);
              }}
            >
              Use a different email
            </button>
          </div>
        </section>
        <div className="ws-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", maxWidth: 720 }}>
          <div className="ws-card-soft" style={{ padding: 18 }}>
            <strong style={{ font: "700 22px var(--kc-font-display)" }}>Android</strong>
            <p className="ws-small" style={{ marginTop: 4 }}>
              {STORE_NOTE}
            </p>
          </div>
          <div className="ws-card-soft" style={{ padding: 18 }}>
            <strong style={{ font: "700 22px var(--kc-font-display)" }}>iPhone and iPad</strong>
            <p className="ws-small" style={{ marginTop: 4 }}>
              {STORE_NOTE}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ws-wrap" data-screen="web-04-get-app">
      {hero}
      <div className="ws-grid ws-grid-3">
        {[
          { os: "Android", sub: "Phones and tablets.", cta: "Choose Android" },
          { os: "iPhone and iPad", sub: "iOS phones and tablets.", cta: "Choose iOS" },
        ].map((s, i) => (
          <article className="ws-card ws-card-flex" key={s.os} style={{ padding: 24, gap: 12 }}>
            <h2 style={{ fontSize: 26 }}>{s.os}</h2>
            <p className="ws-sub">{s.sub}</p>
            <button type="button" className="btn btn-primary ws-store-btn" aria-disabled="true" aria-describedby={`${ids}-note${i}`}>
              {s.cta}
            </button>
            <p className="ws-store-note" id={`${ids}-note${i}`}>
              {STORE_NOTE}
            </p>
          </article>
        ))}
      </div>
      <section className="ws-card ws-narrow-card" aria-labelledby={`${ids}-h`} style={{ padding: 24 }}>
        <h2 id={`${ids}-h`}>On a computer? Send the link to your phone</h2>
        <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className={`field${error ? " has-error" : ""}`}>
            <label htmlFor={`${ids}-em`}>Your email address</label>
            <input
              id={`${ids}-em`}
              ref={inputRef}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${errId} ${ids}-hint` : `${ids}-hint`}
            />
            <div className="hint" id={`${ids}-hint`}>
              We only use it to send this link. It is not stored for marketing.
            </div>
            {error ? <FieldError id={errId}>{error}</FieldError> : null}
          </div>
          <div className="row">
            <button type="submit" className="btn btn-primary ws-cta" style={{ fontSize: 20 }}>
              Send me the link
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
