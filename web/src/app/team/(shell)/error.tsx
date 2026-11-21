"use client";

import Link from "next/link";
import { StatusCard } from "../_lib/ui";

// tc-10-error as a real error boundary for the signed-in console.
export default function ConsoleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <StatusCard
      screen="tc-10-error"
      title="We could not load this"
      body="Something went wrong on our side. Nothing has been changed. Try again in a moment. If it keeps happening, contact support and quote the reference below."
      reference={error.digest ? `Ref ${error.digest} · 503 Service unavailable` : "503 Service unavailable"}
      actions={
        <>
          <button type="button" className="btn btn-primary" onClick={() => reset()}>
            Try again
          </button>
          <Link className="btn" href="/contact">
            Contact support
          </Link>
        </>
      }
    />
  );
}
