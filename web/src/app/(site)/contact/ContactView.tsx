"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { Kudi } from "../_components/Kudi";
import { AlertIcon, CheckIcon, FieldError, Spinner } from "../_components/icons";
import { submitContact } from "./actions";
import { SUMMARY_LABEL, TOPICS, validateContact, type ContactErrors, type ContactField, type ContactInput } from "./validate";

export type ContactDemo = "error" | "sending" | "sent";

type Phase = { kind: "form" } | { kind: "sent"; reference: string; email: string };

const EMPTY: ContactInput = { name: "", email: "", topic: "", message: "" };
const FIELDS: ContactField[] = ["name", "email", "message"];

const DEMO_VALUES: Record<ContactDemo, ContactInput> = {
  error: { name: "", email: "parent@example", topic: "Safety and privacy", message: "" },
  sending: { name: "Ama's parent", email: "parent@example.com", topic: "My family's data", message: "How do I export my children's progress?" },
  sent: EMPTY,
};

/** The whole contact page body: form, error, sending and thank-you states. */
export function ContactView({ demo }: { demo: ContactDemo | null }) {
  const uid = useId();
  const [values, setValues] = useState<ContactInput>(demo ? DEMO_VALUES[demo] : EMPTY);
  const [errors, setErrors] = useState<ContactErrors>(demo === "error" ? validateContact(DEMO_VALUES.error) : {});
  const [failure, setFailure] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>(demo === "sent" ? { kind: "sent", reference: "KC-4821", email: "parent@example.com" } : { kind: "form" });
  const [pending, startTransition] = useTransition();
  const sending = pending || demo === "sending";

  const summaryRef = useRef<HTMLDivElement>(null);
  const failureRef = useRef<HTMLDivElement>(null);
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);
  const fieldRefs = useRef<Partial<Record<ContactField, HTMLElement | null>>>({});

  const errorFields = FIELDS.filter((f) => errors[f]);
  const id = (f: string) => `${uid}-${f}`;

  useEffect(() => {
    if (phase.kind === "sent") sentHeadingRef.current?.focus();
  }, [phase.kind]);

  function set<K extends keyof ContactInput>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    if (key in errors) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setFailure(null);
    const found = validateContact(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      requestAnimationFrame(() => summaryRef.current?.focus());
      return;
    }
    startTransition(async () => {
      const res = await submitContact(values);
      if (res.ok) {
        setErrors({});
        setPhase({ kind: "sent", reference: res.reference, email: res.email });
      } else if (res.kind === "invalid") {
        setErrors(res.errors);
        requestAnimationFrame(() => summaryRef.current?.focus());
      } else {
        setFailure(res.message);
        requestAnimationFrame(() => failureRef.current?.focus());
      }
    });
  }

  if (phase.kind === "sent") {
    return (
      <div className="ws-sent" data-screen="wb-08-contact-sent">
        <Kudi pose="celebrate" alt="Kudi celebrating" width={200} priority />
        <div role="status" className="ws-ok-pill">
          <CheckIcon />
          Message sent
        </div>
        <h1 ref={sentHeadingRef} tabIndex={-1} style={{ fontSize: "clamp(32px,5.2vw,44px)", outline: "none" }}>
          Thank you, we got it
        </h1>
        <p>
          We will reply to <strong>{phase.email}</strong> within two working days. Your reference is <strong>{phase.reference}</strong>.
        </p>
        <div className="ws-actions" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary ws-cta" href="/">
            Back to home
          </Link>
          <button
            type="button"
            className="btn ws-cta"
            onClick={() => {
              setValues(EMPTY);
              setErrors({});
              setPhase({ kind: "form" });
            }}
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  const fieldClass = (f: ContactField) => `field${errors[f] ? " has-error" : ""}`;
  const describedBy = (f: ContactField, hint?: boolean) => [errors[f] ? id(`${f}-err`) : null, hint ? id(`${f}-hint`) : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="ws-wrap ws-split" data-screen={demo === "error" || errorFields.length ? "wb-06-contact-error" : sending ? "wb-07-contact-sending" : "wb-05-contact"}>
      <div className="ws-side">
        <h1 className="ws-h1">Contact us</h1>
        <p className="ws-lead" style={{ maxWidth: "44ch", marginBottom: 16 }}>
          Questions about KudiCubs, safety or your family&apos;s data? We read every message.
        </p>
        <p className="ws-small">Please do not include your child&apos;s full name or any passwords.</p>
      </div>

      <form className="ws-form" onSubmit={onSubmit} noValidate aria-busy={sending || undefined}>
        {sending ? (
          <div role="status" className="ws-status">
            <Spinner size={26} label="Sending" />
            Sending your message...
          </div>
        ) : null}

        {!sending && errorFields.length > 0 ? (
          <div role="alert" className="ws-alert" ref={summaryRef} tabIndex={-1}>
            <AlertIcon />
            <div>
              <strong>
                Please fix {errorFields.length} {errorFields.length === 1 ? "thing" : "things"} before sending
              </strong>
              {errorFields.map((f, i) => (
                <span key={f}>
                  {i > 0 ? " · " : ""}
                  <a
                    href={`#${id(f)}`}
                    onClick={(ev) => {
                      ev.preventDefault();
                      fieldRefs.current[f]?.focus();
                    }}
                  >
                    {SUMMARY_LABEL[f]}
                  </a>
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {!sending && failure ? (
          <div role="alert" className="ws-alert" ref={failureRef} tabIndex={-1}>
            <AlertIcon />
            <div>
              <strong>Your message did not go through</strong>
              {failure}
            </div>
          </div>
        ) : null}

        <div className={fieldClass("name")}>
          <label htmlFor={id("name")}>Your name</label>
          <input
            id={id("name")}
            ref={(el) => {
              fieldRefs.current.name = el;
            }}
            name="name"
            autoComplete="name"
            maxLength={120}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            readOnly={sending}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy("name")}
          />
          {errors.name ? <FieldError id={id("name-err")}>{errors.name}</FieldError> : null}
        </div>

        <div className={fieldClass("email")}>
          <label htmlFor={id("email")}>Email address</label>
          <input
            id={id("email")}
            ref={(el) => {
              fieldRefs.current.email = el;
            }}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="parent@example.com"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            readOnly={sending}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={describedBy("email", true)}
          />
          <div className="hint" id={id("email-hint")}>
            We only use it to reply.
          </div>
          {errors.email ? <FieldError id={id("email-err")}>{errors.email}</FieldError> : null}
        </div>

        <div className="field">
          <label htmlFor={id("topic")}>Topic</label>
          <select id={id("topic")} name="topic" value={values.topic} onChange={(e) => set("topic", e.target.value)} disabled={sending}>
            <option value="">Choose a topic</option>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className={fieldClass("message")}>
          <label htmlFor={id("message")}>Message</label>
          <textarea
            id={id("message")}
            ref={(el) => {
              fieldRefs.current.message = el;
            }}
            name="message"
            maxLength={2100}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            readOnly={sending}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={describedBy("message")}
          />
          {errors.message ? <FieldError id={id("message-err")}>{errors.message}</FieldError> : null}
        </div>

        {sending ? (
          <button type="submit" className="btn btn-primary ws-cta" disabled aria-disabled="true" style={{ opacity: 0.7 }}>
            <Spinner size={20} dark />
            Sending...
          </button>
        ) : (
          <button type="submit" className="btn btn-primary ws-cta">
            Send message
          </button>
        )}
      </form>
    </div>
  );
}
