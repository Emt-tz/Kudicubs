import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Not found" };

// Canvas: tc-06-family-not-found (and any missing Team Console record). Rendered inside the console shell.
export default function NotFound() {
  return (
    <div className="stack" data-screen="tc-06-family-not-found">
      <h1>Family not found</h1>
      <p className="muted">TODO tc-06-family-not-found</p>
      <Link className="btn btn-primary" href="/team/families">
        Back to families
      </Link>
    </div>
  );
}
