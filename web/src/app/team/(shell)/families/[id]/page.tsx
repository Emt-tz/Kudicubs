import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StateView } from "@/components/StateView";
import { getStaff } from "@/lib/auth/session";
import { getDemoState } from "@/lib/demo-state";
import { getFamily, isActive } from "../../../_lib/data";
import { BAND_LABEL, MODE_LABEL, OUTCOME_LABEL, REGION_LABEL, UUID_RE, relativeDay, shortDate, type SP } from "../../../_lib/format";
import { BackLink, Notice, StatusCard, StatusChip } from "../../../_lib/ui";

export const metadata: Metadata = { title: "Family" };

// tc-05-family. Unknown or invisible id: notFound() renders tc-06-family-not-found.
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const demo = getDemoState(await searchParams);
  const staff = await getStaff();
  const role = staff?.role ?? "support";

  if (role === "content") {
    return (
      <StatusCard
        screen="tc-09-no-access"
        title="You do not have access to this page"
        body="Family records are not available to content editors."
        actions={
          <Link className="btn btn-primary" href="/team/content">
            Go to Content
          </Link>
        }
        reference="403 No access"
      />
    );
  }
  if (!UUID_RE.test(id)) notFound();
  const admin = role === "admin";

  if (demo === "loading" || demo === "error") {
    return (
      <div className="stack" data-screen="tc-05-family">
        <BackLink href="/team/families">Back to families</BackLink>
        <h1>Family</h1>
        <StateView state={demo} skeleton="table" error={{ title: "We could not load this family", body: "Nothing has been changed. Try again in a moment.", retryHref: `/team/families/${id}` }}>
          {null}
        </StateView>
      </div>
    );
  }

  const family = await getFamily(id, admin);
  if (family === null) notFound();
  if (family === "error") {
    return (
      <div className="stack" data-screen="tc-05-family">
        <BackLink href="/team/families">Back to families</BackLink>
        <h1>Family</h1>
        <StateView state="error" error={{ title: "We could not load this family", body: "Nothing has been changed. Try again in a moment.", retryHref: `/team/families/${id}` }}>
          {null}
        </StateView>
      </div>
    );
  }

  const first = family.children[0]?.nickname ?? "this family";
  const regions = new Set(family.children.map((c) => c.region)).size;

  return (
    <div className="stack" data-screen="tc-05-family">
      <div className="page-head">
        <div>
          <BackLink href="/team/families">Back to families</BackLink>
          <h1>Family of {first}</h1>
          <p className="muted">{admin ? "Admin view. Read only." : "Support view. Showing the minimum needed to help."}</p>
        </div>
      </div>
      {!admin ? (
        <Notice title="Hidden for your role.">Parent email, full names, play history and device details are not shown to support staff.</Notice>
      ) : null}

      <div className="grid">
        <div className="stat">
          <span className="stat-l">Children</span>
          <span className="stat-n">{family.children.length}</span>
        </div>
        <div className="stat">
          <span className="stat-l">Regions</span>
          <span className="stat-n">{regions}</span>
        </div>
        <div className="stat">
          <span className="stat-l">Last active</span>
          <span className="stat-n" style={{ fontSize: 22 }}>
            {relativeDay(family.lastActive)}
          </span>
        </div>
      </div>

      {admin ? (
        <section className="card-soft">
          <h2 style={{ fontSize: 20 }}>Parent</h2>
          <dl className="grid" style={{ margin: "12px 0 0" }}>
            <div>
              <dt className="muted">Email</dt>
              <dd style={{ margin: 0, fontWeight: 800 }}>{family.parent.email}</dd>
            </div>
            <div>
              <dt className="muted">Region</dt>
              <dd style={{ margin: 0, fontWeight: 800 }}>{REGION_LABEL[family.parent.region] ?? family.parent.region}</dd>
            </div>
            <div>
              <dt className="muted">Joined</dt>
              <dd style={{ margin: 0, fontWeight: 800 }}>{shortDate(family.parent.createdAt)}</dd>
            </div>
            <div>
              <dt className="muted">Consent given</dt>
              <dd style={{ margin: 0, fontWeight: 800 }}>{family.parent.consentedAt ? shortDate(family.parent.consentedAt) : "Not yet"}</dd>
            </div>
          </dl>
        </section>
      ) : null}

      <section className="card-soft">
        <h2 style={{ fontSize: 20 }}>Children in this family</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">Nickname</th>
                <th scope="col">Age band</th>
                <th scope="col">Region</th>
                <th scope="col">Last active</th>
                {admin ? (
                  <>
                    <th scope="col" className="num">Coins</th>
                    <th scope="col" className="num">Saved</th>
                    <th scope="col" className="num">XP</th>
                    <th scope="col" className="num">Badges</th>
                  </>
                ) : null}
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {family.children.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.nickname}</strong>
                  </td>
                  <td>{BAND_LABEL[c.band] ?? c.band}</td>
                  <td>{REGION_LABEL[c.region] ?? c.region}</td>
                  <td>{relativeDay(c.lastActive)}</td>
                  {admin ? (
                    <>
                      <td className="num">{c.coins}</td>
                      <td className="num">{c.saved}</td>
                      <td className="num">{c.xp}</td>
                      <td className="num">{c.badges}</td>
                    </>
                  ) : null}
                  <td>{c.removed ? <StatusChip tone="off">Removed</StatusChip> : isActive(c.lastActive) ? <StatusChip tone="ok">Active</StatusChip> : <StatusChip tone="quiet">Quiet</StatusChip>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {admin ? (
        <div className="grid grid-2">
          <section className="card-soft">
            <h2 style={{ fontSize: 20 }}>Recent attempts</h2>
            {family.attempts.length === 0 ? (
              <p className="muted">No missions played yet.</p>
            ) : (
              <div className="table-wrap">
                <table className="table" style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th scope="col">Child</th>
                      <th scope="col">Mission</th>
                      <th scope="col">Outcome</th>
                      <th scope="col">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {family.attempts.map((a) => (
                      <tr key={a.id}>
                        <td>{a.child}</td>
                        <td>{a.mission}</td>
                        <td>{OUTCOME_LABEL[a.outcome] ?? a.outcome}</td>
                        <td>{relativeDay(a.startedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <section className="card-soft">
            <h2 style={{ fontSize: 20 }}>Devices</h2>
            {family.devices.length === 0 ? (
              <p className="muted">No devices linked.</p>
            ) : (
              <div className="table-wrap">
                <table className="table" style={{ minWidth: 0 }}>
                  <thead>
                    <tr>
                      <th scope="col">Device</th>
                      <th scope="col">Mode</th>
                      <th scope="col">Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {family.devices.map((d) => (
                      <tr key={d.id}>
                        <td>{d.label}</td>
                        <td>{MODE_LABEL[d.mode] ?? d.mode}</td>
                        <td>{relativeDay(d.lastSeen)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}

      <section className="card-soft">
        <h2 style={{ fontSize: 20 }}>Support notes</h2>
        {!admin ? (
          <p className="muted">Notes from this family are only shown to admins.</p>
        ) : family.notes.length === 0 ? (
          <p className="muted">No messages from this family. Support notes are read only here.</p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }} className="stack">
            {family.notes.map((n) => (
              <li key={n.id} style={{ borderTop: "1px solid var(--kc-color-line-soft)", paddingTop: 12 }}>
                <div className="muted" style={{ fontSize: 13 }}>
                  {relativeDay(n.createdAt)} · {n.topic} · Ref {n.reference}
                </div>
                {n.message}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
