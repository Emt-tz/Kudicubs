"use client";

import { useActionState } from "react";
import { saveFamilyRegion } from "./actions";
import { REGIONS } from "./consts";
import type { SimpleFormState } from "./types";

export function FamilyRegionForm({ region }: { region: string }) {
  const [state, action, pending] = useActionState<SimpleFormState, FormData>(saveFamilyRegion, null);
  return (
    <form action={action} className="stack" noValidate>
      <div className={`field${state && !state.ok ? " has-error" : ""}`} style={{ margin: 0 }}>
        <label htmlFor="fam-region">Family region</label>
        <select id="fam-region" name="region" defaultValue={region} aria-describedby="fam-region-h">
          {REGIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
        <div id="fam-region-h" className="hint">Used as the default for children you add. Each child keeps their own region.</div>
        {state && !state.ok ? <div className="db-field-error">{state.message}</div> : null}
      </div>
      <div className="row">
        <button type="submit" className={`btn btn-sm${pending ? " is-loading" : ""}`} disabled={pending}>{pending ? "Saving…" : "Save region"}</button>
        {state?.ok ? <span role="status" style={{ fontWeight: 800, color: "var(--kc-color-feedback-success)" }}>{state.message}</span> : null}
      </div>
    </form>
  );
}
