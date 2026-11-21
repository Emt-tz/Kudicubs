"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePin } from "./actions";
import type { PinFormErrors, PinFormState } from "./types";
import { AlertIcon, CheckIcon } from "./icons";

export function PinForm({ initialErrors }: { initialErrors?: PinFormErrors }) {
  const [state, action, pending] = useActionState<PinFormState, FormData>(changePin, initialErrors ? { errors: initialErrors } : null);
  const errors = state?.errors ?? {};
  const failed = Object.keys(errors).length > 0;
  const marked = [errors.current && "current", errors.next && "new", errors.confirm && "confirm"].filter(Boolean).length;
  return (
    <>
      {failed ? (
        <div className="banner banner-error" role="alert">
          <AlertIcon />
          <div>
            <strong>Your PIN was not changed.</strong>{" "}
            {errors.form ?? (marked ? `Check the ${marked === 1 ? "field" : `${marked} fields`} marked below.` : "")}
          </div>
        </div>
      ) : null}
      <form action={action} className="db-section" noValidate style={{ maxWidth: 560 }}>
        <PinField id="cur" name="current" label="Current PIN" error={errors.current} autoComplete="current-password" />
        <PinField id="new" name="next" label="New PIN" error={errors.next} autoComplete="new-password" />
        <PinField id="conf" name="confirm" label="Confirm new PIN" error={errors.confirm} autoComplete="new-password" placeholder="Enter it again" />
        <div className="db-note" style={{ flexDirection: "column", gap: 6 }}>
          <strong>A good PIN</strong>
          <p style={{ display: "flex", gap: 8 }}><CheckIcon size={18} />Has exactly 4 digits</p>
          <p style={{ display: "flex", gap: 8 }}><CheckIcon size={18} />Is not a run like 1234 or a repeat like 1111</p>
        </div>
        <div className="db-actions">
          <button type="submit" className={`btn btn-primary${pending ? " is-loading" : ""}`} disabled={pending}>{pending ? "Changing…" : "Change PIN"}</button>
          <Link href="/dashboard/settings" className="btn">Cancel</Link>
          <Link href="/contact">I forgot my PIN</Link>
        </div>
      </form>
    </>
  );
}

function PinField({ id, name, label, error, autoComplete, placeholder }: { id: string; name: string; label: string; error?: string; autoComplete: string; placeholder?: string }) {
  return (
    <div className={`field${error ? " has-error" : ""}`} style={{ margin: 0 }}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} type="password" inputMode="numeric" pattern="[0-9]*" maxLength={4} autoComplete={autoComplete} placeholder={placeholder} aria-invalid={!!error} aria-describedby={error ? `${id}-e` : undefined} className={error ? "db-invalid" : undefined} />
      {error ? <div id={`${id}-e`} className="db-field-error">{error}</div> : null}
    </div>
  );
}
