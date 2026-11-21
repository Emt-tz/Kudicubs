import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Notice } from "../../_lib/ui";

export const metadata: Metadata = { title: "Signed out" };

// tc-11-signed-out
export default function Page() {
  return (
    <section className="form-card" data-screen="tc-11-signed-out" style={{ textAlign: "center" }}>
      <Image src="/brand/kudi-thumbs-up.webp" alt="Kudi giving a thumbs up" width={110} height={110} unoptimized style={{ height: 110, width: "auto" }} />
      <h1 style={{ fontSize: 26, margin: "8px 0" }}>You have signed out</h1>
      <p className="muted">Your session in the Team Console has ended on this device. Nothing was changed.</p>
      <div style={{ textAlign: "left", marginBottom: 16 }}>
        <Notice tone="success" title="Signed out.">Sign in again with your work email to continue.</Notice>
      </div>
      <Link className="btn btn-primary" href="/team/signin" style={{ width: "100%" }}>
        Sign in again
      </Link>
    </section>
  );
}
