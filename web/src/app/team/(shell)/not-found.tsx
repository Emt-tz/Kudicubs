import Link from "next/link";
import type { Metadata } from "next";
import { StatusCard } from "../_lib/ui";

export const metadata: Metadata = { title: "Not found" };

// Canvas: tc-06-family-not-found (and any missing Team Console record). Rendered inside the console shell.
export default function NotFound() {
  return (
    <StatusCard
      screen="tc-06-family-not-found"
      title="We could not find that family"
      body="The family may have been deleted, or the link may be out of date. Families that are inactive for 12 months are removed automatically."
      actions={
        <>
          <Link className="btn btn-primary" href="/team/families">
            Back to families
          </Link>
          <Link className="btn" href="/team/families">
            Search again
          </Link>
        </>
      }
      reference="404 Not found"
    />
  );
}
