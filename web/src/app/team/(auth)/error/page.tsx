import Link from "next/link";
import type { Metadata } from "next";
import { StatusCard } from "../../_lib/ui";

export const metadata: Metadata = { title: "Server error" };

// tc-10-error: something failed on our side. Nothing was changed.
export default function Page() {
  return (
    <StatusCard
      screen="tc-10-error"
      title="We could not load this"
      body="Something went wrong on our side. Nothing has been changed. Try again in a moment. If it keeps happening, contact support."
      reference="503 Service unavailable"
      actions={
        <>
          <Link className="btn btn-primary" href="/team/families">
            Try again
          </Link>
          <Link className="btn" href="/contact">
            Contact support
          </Link>
        </>
      }
    />
  );
}
