"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveChild } from "./actions";
import { AVATARS, BANDS, NICKNAMES, REGIONS, bandLabel } from "./consts";
import type { ChildFormErrors, ChildFormState, ChildFormValues } from "./types";
import { AlertIcon, InfoIcon } from "./icons";

/** Nickname, age band, region and avatar for one child (or a new one when childId is "new"). */
export function ChildSettingsForm({
  childId,
  initial,
  initialErrors,
  originalBand,
  cancelHref,
}: {
  childId: string;
  initial: ChildFormValues;
  /** Only used to open the screen already showing its error design (?state=error). */
  initialErrors?: ChildFormErrors;
  originalBand: string | null;
  cancelHref: string;
}) {
  const [state, action, pending] = useActionState<ChildFormState, FormData>(saveChild, initialErrors ? { values: initial, errors: initialErrors } : null);
  const values = state?.values ?? initial;
  const errors = state?.errors ?? {};
  const [band, setBand] = useState(values.ageBand);
  const [avatar, setAvatar] = useState(values.avatar);
  const nickOptions = Array.from(new Set([...(values.nickname ? [values.nickname] : []), ...NICKNAMES]));
  const errorList = [
    errors.nickname && { id: "nick", text: `Nickname: ${errors.nickname.startsWith("Please choose a nickname") ? "choose one from the list" : errors.nickname}` },
    errors.ageBand && { id: "band", text: "Age band: choose an age band" },
    errors.region && { id: "region", text: "Region: choose a region" },
    errors.avatar && { id: "avatar", text: "Avatar: choose an avatar" },
  ].filter(Boolean) as { id: string; text: string }[];
  const changedBand = originalBand !== null && band !== originalBand && BANDS.some((b) => b.value === band);
  const who = childId === "new" ? "this child" : values.nickname;

  return (
    <form action={action} className="db-section" noValidate>
      <input type="hidden" name="id" value={childId} />
      {errors.form || errorList.length ? (
        <div className="banner banner-error" role="alert">
          <AlertIcon />
          <div>
            <strong>{errors.form ?? `We could not save ${who}'s settings.`}</strong>
            {errorList.length ? (
              <>
                {" "}Please fix the {errorList.length} item{errorList.length === 1 ? "" : "s"} below and try again.
                <ul className="db-banner-list">
                  {errorList.map((e) => (
                    <li key={e.id}>
                      <a href={`#${e.id}`}>{e.text}</a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      <h2>Profile</h2>
      <div className={`field${errors.nickname ? " has-error" : ""}`} style={{ margin: 0 }}>
        <label htmlFor="nick">Nickname</label>
        <select id="nick" name="nickname" defaultValue={values.nickname} aria-invalid={!!errors.nickname} aria-describedby={errors.nickname ? "nick-e" : "nick-h"} className={errors.nickname ? "db-invalid" : undefined}>
          {childId === "new" ? <option value="">Choose a nickname</option> : null}
          {nickOptions.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
        {errors.nickname ? (
          <div id="nick-e" className="db-field-error">{errors.nickname}</div>
        ) : (
          <div id="nick-h" className="hint">Nicknames come from a short list. Real names are never used.</div>
        )}
      </div>
      <div className="db-two">
        <div className={`field${errors.ageBand ? " has-error" : ""}`} style={{ margin: 0 }}>
          <label htmlFor="band">Age band</label>
          <select id="band" name="ageBand" value={band} onChange={(e) => setBand(e.target.value)} aria-invalid={!!errors.ageBand} aria-describedby="band-h" className={errors.ageBand ? "db-invalid" : undefined}>
            {BANDS.some((b) => b.value === band) ? null : <option value="">Choose an age band</option>}
            {BANDS.map((b) => (
              <option key={b.value} value={b.value}>{b.label}</option>
            ))}
          </select>
          {errors.ageBand ? <div className="db-field-error">{errors.ageBand}</div> : null}
          <div id="band-h" className="hint">Changes the missions {who} sees. Earned coins and badges stay.</div>
        </div>
        <div className={`field${errors.region ? " has-error" : ""}`} style={{ margin: 0 }}>
          <label htmlFor="region">Region</label>
          <select id="region" name="region" defaultValue={values.region} aria-invalid={!!errors.region} aria-describedby={errors.region ? "reg-e" : "reg-h"} className={errors.region ? "db-invalid" : undefined}>
            {REGIONS.some((r) => r.value === values.region) ? null : <option value="">Choose a region</option>}
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.region ? <div id="reg-e" className="db-field-error">{errors.region}</div> : <div id="reg-h" className="hint">Sets the coins and market examples.</div>}
        </div>
      </div>
      {changedBand ? (
        <div className="banner banner-info" role="status" data-testid="band-warning">
          <InfoIcon />
          <div>
            <strong>{who} will move to {bandLabel(band)}.</strong>
            <p style={{ margin: 0 }}>They will see that age band&apos;s missions from now on. Every coin, badge and bit of progress {who} has earned is kept.</p>
          </div>
        </div>
      ) : null}
      <fieldset className="db-avatars" id="avatar">
        <legend>Avatar</legend>
        {AVATARS.map((a, i) => (
          <label key={a} className="db-avatar-opt">
            <input type="radio" name="avatar" value={a} checked={avatar === a} onChange={() => setAvatar(a)} aria-label={`Cub friend ${i + 1}`} />
            <span>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/avatars/${a}.svg`} alt="" /></span>
          </label>
        ))}
        {errors.avatar ? <div className="db-field-error" style={{ flexBasis: "100%" }}>{errors.avatar}</div> : null}
      </fieldset>
      <div className="db-actions">
        <button type="submit" className={`btn btn-primary${pending ? " is-loading" : ""}`} disabled={pending}>
          {pending ? "Saving…" : childId === "new" ? "Add child" : "Save changes"}
        </button>
        <Link href={cancelHref} className="btn">Cancel</Link>
      </div>
    </form>
  );
}
