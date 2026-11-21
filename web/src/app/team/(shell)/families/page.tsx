import type { Metadata } from "next";
import Link from "next/link";
import { getStaff } from "@/lib/auth/session";
import { getDemoState } from "@/lib/demo-state";
import { listFamilies } from "../../_lib/data";
import { BAND_VALUES, REGION_VALUES, first, safeSearch, type SP } from "../../_lib/format";
import { Notice, StatusCard } from "../../_lib/ui";
import { FamiliesFilters, FamiliesHeader, FamiliesSkeleton, FamiliesTable, Pagination } from "./FamiliesView";

export const metadata: Metadata = { title: "Families" };

// tc-02-families (+ tc-03-families-empty for no match, tc-04-families-loading, tc-10 style error banner).
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const staff = await getStaff();
  const role = staff?.role ?? "support";
  const demo = getDemoState(sp);

  if (role === "content") {
    return (
      <div className="stack" data-screen="tc-09-no-access">
        <FamiliesHeader intro="Family records are not available to content editors." />
        <StatusCard
          as="h2"
          screen="tc-09-no-access"
          title="You do not have access to this page"
          body="Families are for the Support and Admin roles. Your role is Content editor, which can review missions."
          actions={
            <Link className="btn btn-primary" href="/team/content">
              Go to Content
            </Link>
          }
          reference="403 No access"
        />
      </div>
    );
  }

  const admin = role === "admin";
  const q = safeSearch(first(sp.q));
  const band = (BAND_VALUES as readonly string[]).includes(first(sp.band)) ? first(sp.band) : "";
  const region = (REGION_VALUES as readonly string[]).includes(first(sp.region)) ? first(sp.region) : "";
  const page = Math.max(1, Math.min(10_000, parseInt(first(sp.page), 10) || 1));
  const intro = admin ? "Find a family by nickname or parent email." : "Find a family by nickname to help with a question.";

  if (demo === "loading") {
    return (
      <div className="stack" data-screen="tc-04-families-loading" aria-busy="true">
        <FamiliesHeader intro="Loading your families..." />
        <FamiliesSkeleton />
      </div>
    );
  }

  const result = demo === "error" ? { rows: [], total: 0, error: true } : demo === "empty" ? { rows: [], total: 0, error: false } : await listFamilies({ q, band, region, page, showEmail: admin });
  const filtered = !!(q || band || region);

  return (
    <div className="stack" data-screen={result.rows.length || result.error ? "tc-02-families" : "tc-03-families-empty"}>
      <FamiliesHeader intro={intro} />
      {!admin ? (
        <Notice title="Minimum data only.">You see nicknames, age band, region and last active. Emails, full names and play details are hidden for support.</Notice>
      ) : null}
      <section className="card-soft">
        <FamiliesFilters q={q} band={band} region={region} admin={admin} />
        {result.error ? (
          <div role="alert" className="empty" data-screen="tc-10-error">
            <h2 style={{ fontSize: 22 }}>We could not load this</h2>
            <p className="muted">Something went wrong on our side. The list did not load and nothing has been changed. Try again in a moment.</p>
            <Link className="btn btn-primary" href="/team/families">
              Try again
            </Link>
          </div>
        ) : result.rows.length === 0 ? (
          <div className="empty">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/kudi-wave.webp" alt="" />
            <h2 style={{ fontSize: 22 }}>{q ? `No families match “${q}”` : filtered ? "No families match these filters" : "No families yet"}</h2>
            <p className="muted">
              {filtered
                ? admin
                  ? "Check the spelling, or try a shorter nickname or email."
                  : "Check the spelling, or try a shorter nickname. Support can only search by nickname."
                : "Families appear here after a parent sets up the app."}
            </p>
            {filtered ? (
              <Link className="btn btn-primary" href="/team/families">
                Clear search
              </Link>
            ) : null}
          </div>
        ) : (
          <>
            <FamiliesTable rows={result.rows} admin={admin} />
            <Pagination page={page} total={result.total} params={{ q, band, region }} />
          </>
        )}
      </section>
    </div>
  );
}
