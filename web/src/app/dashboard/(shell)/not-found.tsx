import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Not found" };

// Canvas: dp-27-not-found. Rendered inside the dashboard shell by notFound() or the catch-all route.
export default function NotFound() {
  return (
    <div className="stack" data-screen="dp-27-not-found">
      <h1>Not found</h1>
      <p className="muted">TODO dp-27-not-found</p>
      <Link className="btn btn-primary" href="/dashboard">
        Back to overview
      </Link>
    </div>
  );
}
