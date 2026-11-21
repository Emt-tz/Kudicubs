import Link from "next/link";
import type { Metadata } from "next";
import { SiteFrame } from "@/components/SiteFrame";
import { Kudi } from "./(site)/_components/Kudi";
import "./(site)/site.css";

export const metadata: Metadata = { title: "Page not found", description: "The page may have moved, or the link may have a typo." };

// Canvas: wb-14-404. Website 404 (any unknown address outside /dashboard and /team).
export default function NotFound() {
  return (
    <SiteFrame>
      <div className="ws-404" data-screen="wb-14-404">
        <Kudi pose="fist" alt="Kudi looking around, a little lost" width={210} />
        <div className="ws-404-code">Error 404</div>
        <h1>Kudi cannot find that page</h1>
        <p>The page may have moved, or the link may have a typo. Let us get you back on the path.</p>
        <div className="ws-actions" style={{ justifyContent: "center" }}>
          <Link className="btn btn-primary ws-cta" href="/">
            Back to home
          </Link>
          <Link className="btn ws-cta" href="/contact">
            Contact us
          </Link>
        </div>
      </div>
    </SiteFrame>
  );
}
