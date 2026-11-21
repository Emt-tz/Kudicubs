import type { Metadata } from "next";
import Link from "next/link";
import { StateView } from "@/components/StateView";
import { getStaff } from "@/lib/auth/session";
import { getDemoState } from "@/lib/demo-state";
import { getMission } from "../../../_lib/data";
import { BAND_LABEL, OUTCOME_LABEL, first, relativeDay, shortDate, type SP } from "../../../_lib/format";
import { BackLink, Notice, StatusCard, StatusChip } from "../../../_lib/ui";
import { setMissionPublished } from "./actions";

export const metadata: Metadata = { title: "Mission" };

const ID_RE = /^[\w.-]{1,64}$/;

// tc-08-mission: details plus a publish toggle for content and admin staff.
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const demo = getDemoState(sp);
  const staff = await getStaff();
  const canEdit = staff?.role === "content" || staff?.role === "admin";
  const notice = first(sp.notice);

  const head = (title: string) => (
    <>
      <BackLink href="/team/content">Back to content</BackLink>
      <h1>{title}</h1>
    </>
  );

  if (demo === "loading" || demo === "error") {
    return (
      <div className="stack" data-screen="tc-08-mission">
        {head("Mission")}
        <StateView state={demo} skeleton="form" error={{ title: "We could not load this mission", body: "Nothing has been changed. Try again in a moment.", retryHref: `/team/content/${encodeURIComponent(id)}` }}>
          {null}
        </StateView>
      </div>
    );
  }

  const found = ID_RE.test(id) ? await getMission(id) : null;
  if (found === "error")
    return (
      <div className="stack" data-screen="tc-08-mission">
        {head("Mission")}
        <StateView state="error" error={{ title: "We could not load this mission", body: "Nothing has been changed. Try again in a moment.", retryHref: `/team/content/${encodeURIComponent(id)}` }}>
          {null}
        </StateView>
      </div>
    );
  if (!found)
    return (
      <StatusCard
        screen="tc-08-mission"
        title="We could not find that mission"
        body="The mission may have been removed, or the link may be out of date."
        actions={
          <Link className="btn btn-primary" href="/team/content">
            Back to content
          </Link>
        }
        reference="404 Not found"
      />
    );

  const { mission, outcomes } = found;
  const total = Object.values(outcomes).reduce((a, b) => a + b, 0);

  return (
    <div className="stack" data-screen="tc-08-mission">
      <div className="page-head">
        <div>
          <BackLink href="/team/content">Back to content</BackLink>
          <h1>{mission.title}</h1>
          <p className="muted">
            Ages {BAND_LABEL[mission.band] ?? mission.band} · {mission.world} · Position {mission.position}
          </p>
        </div>
      </div>

      {notice === "published" ? <Notice tone="success" title="Published.">Children can play this mission now.</Notice> : null}
      {notice === "unpublished" ? <Notice tone="success" title="Unpublished.">Children no longer see this mission.</Notice> : null}
      {notice === "forbidden" ? <Notice tone="error" title="Not allowed.">Your role cannot publish or unpublish missions.</Notice> : null}
      {notice === "failed" ? <Notice tone="error" title="Nothing was changed.">The change could not be saved. Try again in a moment.</Notice> : null}

      <section className="card-soft">
        <h2 style={{ fontSize: 20 }}>Publishing</h2>
        <p style={{ margin: "8px 0" }}>
          {mission.published ? <StatusChip tone="ok">Published</StatusChip> : <StatusChip tone="off">Unpublished</StatusChip>}{" "}
          <span className="muted">Last updated {shortDate(mission.updatedAt)} ({relativeDay(mission.updatedAt)})</span>
        </p>
        {canEdit ? (
          <form action={setMissionPublished}>
            <input type="hidden" name="id" value={mission.id} />
            <input type="hidden" name="published" value={mission.published ? "false" : "true"} />
            <button type="submit" className={mission.published ? "btn btn-sm" : "btn btn-sm btn-primary"}>
              {mission.published ? "Unpublish mission" : "Publish mission"}
            </button>
          </form>
        ) : (
          <p className="muted" style={{ margin: 0 }}>
            Only content editors and admins can publish or unpublish missions. Your role is read only here.
          </p>
        )}
      </section>

      <section className="card-soft">
        <h2 style={{ fontSize: 20 }}>Details</h2>
        <dl className="grid" style={{ margin: "12px 0 0" }}>
          <div>
            <dt className="muted">Mission id</dt>
            <dd style={{ margin: 0, fontWeight: 800 }}>{mission.id}</dd>
          </div>
          <div>
            <dt className="muted">Age band</dt>
            <dd style={{ margin: 0, fontWeight: 800 }}>{BAND_LABEL[mission.band] ?? mission.band}</dd>
          </div>
          <div>
            <dt className="muted">World</dt>
            <dd style={{ margin: 0, fontWeight: 800 }}>{mission.world}</dd>
          </div>
        </dl>
      </section>

      <section className="card-soft">
        <h2 style={{ fontSize: 20 }}>How it has gone</h2>
        <p className="muted">Counts across all families. No family is identified here.</p>
        <div className="grid">
          {Object.entries(OUTCOME_LABEL).map(([k, label]) => (
            <div className="stat" key={k}>
              <span className="stat-l">{label}</span>
              <span className="stat-n">{outcomes[k] ?? 0}</span>
            </div>
          ))}
          <div className="stat">
            <span className="stat-l">All attempts</span>
            <span className="stat-n">{total}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
