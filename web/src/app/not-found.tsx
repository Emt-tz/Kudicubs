import Link from "next/link";
import type { Metadata } from "next";
import { SiteFrame } from "@/components/SiteFrame";

export const metadata: Metadata = { title: "Page not found" };

// Canvas: wb-14-404. Website 404 (any unknown address outside /dashboard and /team).
export default function NotFound() {
  return (
    <SiteFrame>
      <div className="container section stack" data-screen="wb-14-404">
        <h1>Page not found</h1>
        <p className="muted">TODO wb-14-404</p>
        <Link className="btn btn-primary" href="/">
          Back to home
        </Link>
      </div>
    </SiteFrame>
  );
}
