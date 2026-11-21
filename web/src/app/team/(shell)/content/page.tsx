import type { Metadata } from "next";
import Link from "next/link";
import { StateView } from "@/components/StateView";
import { getDemoState } from "@/lib/demo-state";
import { listMissions } from "../../_lib/data";
import { BAND_LABEL, BAND_VALUES, first, relativeDay, safeSearch, type SP } from "../../_lib/format";
import { Notice, StatusChip } from "../../_lib/ui";

export const metadata: Metadata = { title: "Content" };

// team-01-content, tc-07-content-empty (no mission matches the filters).
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const demo = getDemoState(sp);
  const q = safeSearch(first(sp.q)).toLowerCase();
  const band = (BAND_VALUES as readonly string[]).includes(first(sp.band)) ? first(sp.band) : "";
  const world = first(sp.world).slice(0, 60);
  const status = ["published", "unpublished"].includes(first(sp.status)) ? first(sp.status) : "";

  const all = demo === "error" ? "error" : demo === "loading" ? [] : await listMissions();
  const missions = all === "error" ? [] : all;
  const worlds = [...new Set(missions.map((m) => m.world))].sort();
  const rows = missions.filter(
    (m) =>
      (!band || m.band === band) &&
      (!world || m.world === world) &&
      (!status || (status === "published") === m.published) &&
      (!q || m.title.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)),
  );
  const filtered = !!(q || band || world || status);
  const state = demo === "loading" ? "loading" : all === "error" ? "error" : demo === "empty" || rows.length === 0 ? "empty" : "normal";
  const published = missions.filter((m) => m.published).length;

  return (
    <div className="stack" data-screen={state === "empty" ? "tc-07-content-empty" : "team-01-content"}>
      <div className="page-head">
        <div>
          <h1>Missions</h1>
          <p className="muted">{filtered ? "Filtered view." : "Every mission in the catalogue, by age band and world."}</p>
        </div>
      </div>

      <div className="grid">
        <div className="stat">
          <span className="stat-l">Missions</span>
          <span className="stat-n">{missions.length}</span>
        </div>
        <div className="stat">
          <span className="stat-l">Published</span>
          <span className="stat-n">{published}</span>
        </div>
        <div className="stat">
          <span className="stat-l">Unpublished</span>
          <span className="stat-n">{missions.length - published}</span>
        </div>
      </div>

      <section className="card-soft">
        <form method="get" action="/team/content" role="search" className="row" style={{ alignItems: "flex-end", marginBottom: 16 }}>
          <div className="field" style={{ margin: 0, flex: "1 1 200px" }}>
            <label htmlFor="q">Mission</label>
            <input id="q" name="q" defaultValue={q} placeholder="Search by title" />
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
            <label htmlFor="world">World</label>
            <select id="world" name="world" defaultValue={world}>
              <option value="">All worlds</option>
              {worlds.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="status">Published</label>
            <select id="status" name="status" defaultValue={status}>
              <option value="">Any state</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
          <button type="submit" className="btn btn-sm btn-primary">
            Filter
          </button>
        </form>

        <StateView
          state={state}
          skeleton="table"
          empty={{
            title: filtered ? "No missions match these filters" : "No missions yet",
            body: filtered ? "Clear a filter to see every mission." : "Missions appear here once they are added to the catalogue.",
            action: filtered ? (
              <Link className="btn btn-primary" href="/team/content">
                Clear filters
              </Link>
            ) : undefined,
          }}
          error={{ title: "We could not load the missions", body: "Nothing has been changed. Try again in a moment.", retryHref: "/team/content" }}
        >
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Mission</th>
                  <th scope="col">Age band</th>
                  <th scope="col">World</th>
                  <th scope="col">Status</th>
                  <th scope="col">Updated</th>
                  <th scope="col">
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.title}</strong>
                    </td>
                    <td>{BAND_LABEL[m.band] ?? m.band}</td>
                    <td>{m.world}</td>
                    <td>{m.published ? <StatusChip tone="ok">Published</StatusChip> : <StatusChip tone="off">Unpublished</StatusChip>}</td>
                    <td>{relativeDay(m.updatedAt)}</td>
                    <td>
                      <Link className="btn btn-sm" href={`/team/content/${encodeURIComponent(m.id)}`} aria-label={`Open ${m.title}`}>
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </StateView>
      </section>

      <Notice title="Family records are not available to content editors.">Support staff see families by nickname only, with the minimum needed to help.</Notice>
    </div>
  );
}
