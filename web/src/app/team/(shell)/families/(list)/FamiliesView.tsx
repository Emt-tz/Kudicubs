import Link from "next/link";
import { Skeleton } from "@/components/Skeleton";
import { BAND_LABEL, BAND_VALUES, REGION_LABEL, REGION_VALUES, relativeDay } from "../../../_lib/format";
import { PAGE_SIZE, isActive, type FamilyRow } from "../../../_lib/data";
import { StatusChip } from "../../../_lib/ui";

export function FamiliesHeader({ intro }: { intro: string }) {
  return (
    <div className="page-head">
      <div>
        <h1>Families</h1>
        <p className="muted">{intro}</p>
      </div>
    </div>
  );
}

export function FamiliesFilters({ q, band, region, admin }: { q: string; band: string; region: string; admin: boolean }) {
  return (
    <form method="get" action="/team/families" role="search" className="row" style={{ alignItems: "flex-end", marginBottom: 16 }}>
      <div className="field" style={{ margin: 0, flex: "1 1 240px" }}>
        <label htmlFor="q">{admin ? "Nickname or parent email" : "Nickname"}</label>
        <input id="q" name="q" defaultValue={q} placeholder={admin ? "Search by nickname or email" : "Search by nickname"} />
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label htmlFor="band">Age band</label>
        <select id="band" name="band" defaultValue={band}>
          <option value="">All ages</option>
          {BAND_VALUES.map((b) => (
            <option key={b} value={b}>
              {BAND_LABEL[b]}
            </option>
          ))}
        </select>
      </div>
      <div className="field" style={{ margin: 0 }}>
        <label htmlFor="region">Region</label>
        <select id="region" name="region" defaultValue={region}>
          <option value="">All regions</option>
          {REGION_VALUES.map((r) => (
            <option key={r} value={r}>
              {REGION_LABEL[r]}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-sm btn-primary" style={{ marginBottom: 0 }}>
        Search
      </button>
    </form>
  );
}

export function FamiliesTable({ rows, admin }: { rows: FamilyRow[]; admin: boolean }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Nickname</th>
            {admin ? <th scope="col">Parent email</th> : null}
            <th scope="col">Age band</th>
            <th scope="col">Region</th>
            <th scope="col">Last active</th>
            <th scope="col">Status</th>
            <th scope="col">
              <span className="sr-only">Action</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>
                <strong>{r.nickname}</strong>
              </td>
              {admin ? <td>{r.email ?? "—"}</td> : null}
              <td>{BAND_LABEL[r.band] ?? r.band}</td>
              <td>{REGION_LABEL[r.region] ?? r.region}</td>
              <td>{relativeDay(r.lastActive)}</td>
              <td>{r.removed ? <StatusChip tone="off">Removed</StatusChip> : isActive(r.lastActive) ? <StatusChip tone="ok">Active</StatusChip> : <StatusChip tone="quiet">Quiet</StatusChip>}</td>
              <td>
                <Link className="btn btn-sm" href={`/team/families/${r.parentId}`} aria-label={`Open the family of ${r.nickname}`}>
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, total, params }: { page: number; total: number; params: Record<string, string> }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => {
    const sp = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `/team/families${s ? `?${s}` : ""}`;
  };
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);
  return (
    <nav className="spread" aria-label="Pagination" style={{ marginTop: 12 }}>
      <span className="muted">
        Showing {from}–{to} of {total} {total === 1 ? "child" : "children"}
      </span>
      <span className="row">
        {page > 1 ? (
          <Link className="btn btn-sm" href={href(page - 1)} rel="prev">
            Previous
          </Link>
        ) : null}
        <span className="muted">
          Page {page} of {pages}
        </span>
        {page < pages ? (
          <Link className="btn btn-sm" href={href(page + 1)} rel="next">
            Next
          </Link>
        ) : null}
      </span>
    </nav>
  );
}

/** tc-04: same layout as the list, with placeholder rows. */
export function FamiliesSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="stack">
      <span className="sr-only">Loading families</span>
      <div className="row">
        <Skeleton width={260} height={48} />
        <Skeleton width={140} height={48} />
        <Skeleton width={160} height={48} />
      </div>
      <div className="card-soft stack">
        <Skeleton height={36} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} height={28} />
        ))}
      </div>
    </div>
  );
}
