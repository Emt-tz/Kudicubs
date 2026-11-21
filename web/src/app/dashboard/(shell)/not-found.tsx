import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { NotFoundSearch } from "../_b/NotFoundSearch";
import { IdleTimeout } from "../_b/IdleTimeout";
import "../_b/dashb.css";

export const metadata: Metadata = { title: "Not found" };

// Canvas: dp-27-not-found. Rendered inside the dashboard shell by notFound() or the catch-all route.
export default async function NotFound() {
  let kids: { id: string; nickname: string }[] = [];
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("child_profiles").select("id,nickname").is("deleted_at", null).order("created_at");
    kids = data ?? [];
  } catch {
    kids = [];
  }
  return (
    <>
      <IdleTimeout />
      <section className="db-section db-status-page" data-screen="dp-27-not-found">
        <Image src="/brand/kudi-wave.webp" alt="" width={140} height={140} unoptimized />
        <span className="code">Error 404</span>
        <h1>We could not find that page</h1>
        <p>The link may be old, or the page may have moved. Try searching, or go back to your overview.</p>
        <NotFoundSearch>{kids}</NotFoundSearch>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link href="/dashboard" className="btn btn-primary">Back to overview</Link>
          <Link href="/contact" className="btn">Contact support</Link>
        </div>
      </section>
    </>
  );
}
