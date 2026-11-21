import Link from "next/link";
import type { Metadata } from "next";
import { ClockIcon } from "../../_b/icons";
import "../../_b/dashb.css";

export const metadata: Metadata = { title: "Session timed out" };

// Canvas: dp-25-session-timeout. Shown after 15 minutes without activity (see _b/IdleTimeout), when the session is already gone.
export default function Page() {
  return (
    <section className="db-status-page" data-screen="dp-25-session-timeout" role="alert">
      <div className="db-dialog-icon" style={{ marginBottom: 0 }}><ClockIcon size={26} /></div>
      <h1>Your session timed out</h1>
      <p>For your family&apos;s safety we sign you out after a period of no activity. Nothing was lost. Sign in again to carry on where you were.</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <Link href="/dashboard/signin" className="btn btn-primary">Sign in again</Link>
        <Link href="/" className="btn">Go to the website</Link>
      </div>
    </section>
  );
}
