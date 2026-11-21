import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CheckIcon } from "../../_b/icons";
import "../../_b/dashb.css";

export const metadata: Metadata = { title: "Data deleted" };

// Canvas: dp-22-deleted. Public page: the family (and its sign-in) no longer exists when this shows.
export default function Page() {
  return (
    <section className="db-status-page" data-screen="dp-22-deleted">
      <Image src="/brand/kudi-wave.webp" alt="" width={140} height={140} unoptimized />
      <span className="code"><CheckIcon size={16} />Deleted</span>
      <h1>Your family data has been deleted</h1>
      <p>We have erased your children&apos;s profiles, your account and every signed-in device. You have been signed out. Thank you for trying KudiCubs.</p>
      <div className="box">
        <strong>What happens next</strong>
        <ul>
          <li>The app on your devices will ask to set up again.</li>
          <li>Nothing about your family is kept on our side.</li>
        </ul>
      </div>
      <div className="row" style={{ justifyContent: "center" }}>
        <Link href="/" className="btn">Back to the website</Link>
        <Link href="/dashboard/signin" className="btn btn-primary">Start a new family</Link>
      </div>
    </section>
  );
}
