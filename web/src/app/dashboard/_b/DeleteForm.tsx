"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteFamily } from "./actions";
import { AlertIcon } from "./icons";

/** Type-to-confirm delete. The button stays disabled until the word DELETE is typed; the server checks it again. */
export function DeleteForm({ childCount, error }: { childCount: number; error?: string }) {
  const [text, setText] = useState("");
  const ok = text.trim().toUpperCase() === "DELETE";
  return (
    <form action={deleteFamily}>
      <p style={{ margin: "0 0 6px" }}>This will erase:</p>
      <ul>
        <li>{childCount} child{childCount === 1 ? "" : "ren"}&apos;s profile{childCount === 1 ? "" : "s"}, coins, badges and progress</li>
        <li>Your account, PIN and email</li>
        <li>Every signed-in device</li>
      </ul>
      <div className="banner banner-error" style={{ marginBottom: 12 }}>
        <AlertIcon />
        <div>It cannot be undone. Accounts with no sign-in or play for 12 months are deleted automatically, and we email you 30 days and 7 days before.</div>
      </div>
      <div className={`field${error ? " has-error" : ""}`} style={{ margin: 0 }}>
        <label htmlFor="del-confirm">Type DELETE to confirm</label>
        <input id="del-confirm" name="confirm" autoComplete="off" autoCapitalize="characters" value={text} onChange={(e) => setText(e.target.value)} aria-describedby={error ? "del-e" : undefined} />
        {error ? <div id="del-e" className="db-field-error">{error}</div> : null}
      </div>
      <div className="db-actions">
        <Link href="/dashboard/devices" className="btn" replace>Keep my data</Link>
        <button type="submit" className="btn btn-danger" disabled={!ok}>Delete everything</button>
      </div>
    </form>
  );
}
