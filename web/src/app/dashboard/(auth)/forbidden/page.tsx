import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LockIcon } from "../../_b/icons";
import "../../_b/dashb.css";

export const metadata: Metadata = { title: "No access" };

// Canvas: dp-26-forbidden.
export default function Page() {
  return (
    <section className="db-status-page" data-screen="dp-26-forbidden">
      <Image src="/brand/kudi-headphones.webp" alt="" width={140} height={140} unoptimized />
      <span className="code"><LockIcon size={16} />Error 403</span>
      <h1>You do not have access to this page</h1>
      <p>Your account is not allowed to open this page. Each family can only see its own children and data. If you think this is a mistake, contact support.</p>
      <div className="row" style={{ justifyContent: "center" }}>
        <Link href="/dashboard" className="btn btn-primary">Back to overview</Link>
        <Link href="/contact" className="btn">Contact support</Link>
      </div>
    </section>
  );
}
