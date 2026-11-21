import Link from "next/link";
import type { Metadata } from "next";
import { StateView } from "@/components/StateView";
import { getDemoState, getDemoVariant } from "@/lib/demo-state";
import { requireParent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { signOutDevice } from "../../_b/actions";
import { ConfirmDialog } from "../../_b/ConfirmDialog";
import { DeleteForm } from "../../_b/DeleteForm";
import { IdleTimeout } from "../../_b/IdleTimeout";
import { deviceActive, deviceMode, loadChildren, loadDevices, type DeviceRow } from "../../_b/data";
import { idleSeconds } from "../../_b/idle-params";
import { formatDate, plural, timeAgo } from "../../_b/format";
import { AlertIcon, CheckIcon, DeviceIcon, DownloadIcon, FileIcon, InfoIcon, TrashIcon } from "../../_b/icons";
import "../../_b/dashb.css";

export const metadata: Metadata = { title: "Devices and data" };

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Canvas: dash-03-devices-data (normal), dp-19-signout-device-confirm (?confirm=<device id> or ?state=confirm-signout),
// dp-20-export-ready (?export=ready or ?state=export-ready), dp-21-delete-confirm (?confirm=delete or ?state=confirm-delete).
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await requireParent();
  const state = getDemoState(sp);
  const variant = getDemoVariant(sp, ["confirm-signout", "export-ready", "confirm-delete"] as const);
  const supabase = await createClient();
  const [{ devices, failed: devicesFailed }, { children, failed: childrenFailed }] = await Promise.all([loadDevices(supabase), loadChildren(supabase)]);
  const now = Date.now();

  const confirm = first(sp.confirm);
  const confirmDelete = variant === "confirm-delete" || confirm === "delete";
  const toSignOut: DeviceRow | undefined =
    variant === "confirm-signout" ? (devices.find((d) => d.mode === "family") ?? devices[devices.length - 1]) : devices.find((d) => d.id === confirm);
  const done = first(sp.done);
  const dataState = state === "normal" && (devicesFailed || childrenFailed) ? "error" : state;

  const idle = <IdleTimeout seconds={idleSeconds(sp)} />;

  if (variant === "export-ready" || first(sp.export) === "ready") {
    const { data, error } = await supabase.rpc("export_my_family");
    const kids = Array.isArray(data?.children) ? data.children.length : children.length;
    const day = new Date().toISOString().slice(0, 10);
    return (
      <>
        {idle}
        {error ? (
          <div className="banner banner-error" role="alert">
            <AlertIcon />
            <div><strong>We could not prepare your export.</strong> Please try again.</div>
          </div>
        ) : (
          <div className="banner banner-success" role="status">
            <CheckIcon />
            <div><strong>Your export is ready.</strong> Download it now and keep it somewhere safe.</div>
          </div>
        )}
        <div className="page-head">
          <div>
            <h1>Your data</h1>
            <p className="db-lead">Export a copy of your family&apos;s data, or delete it.</p>
          </div>
        </div>
        <section className="db-section" aria-label="Your export">
          <div className="db-file">
            <div className="ic"><FileIcon size={36} /></div>
            <div className="grow">
              <div className="name">kudicubs-export-{day}.json</div>
              <div className="muted">{plural(kids, "child")}&apos;s nicknames, age bands, regions, badges and progress, plus your devices. It never contains your PIN.</div>
            </div>
            <div className="row">
              <a className="btn btn-primary" href="/dashboard/devices/export" download>
                <DownloadIcon size={20} /> Download file
              </a>
              <Link className="btn" href="/dashboard/devices?export=ready">Export again</Link>
            </div>
          </div>
        </section>
        <section className="db-section">
          <div className="spread">
            <div>
              <h2>Delete family data</h2>
              <div className="muted">Erase every child&apos;s profile and your account. Export first if you want a copy.</div>
            </div>
            <Link className="btn btn-danger" href="/dashboard/devices?confirm=delete"><TrashIcon size={20} /> Delete family data</Link>
          </div>
        </section>
        <p><Link href="/dashboard/devices">Back to devices</Link></p>
      </>
    );
  }

  return (
    <>
      {idle}
      {done === "signedout" ? (
        <div className="banner banner-success" role="status">
          <CheckIcon />
          <div><strong>Device signed out.</strong> Its coins, badges and progress are kept.</div>
        </div>
      ) : null}
      {done === "error" ? (
        <div className="banner banner-error" role="alert">
          <AlertIcon />
          <div><strong>We could not sign that device out.</strong> Please try again.</div>
        </div>
      ) : null}
      <div className="page-head">
        <div>
          <h1>Devices and your data</h1>
          <p className="db-lead">See where your family is signed in, and take your data with you or delete it.</p>
        </div>
      </div>
      <section className="db-section" aria-labelledby="dev-h">
        <div className="spread">
          <h2 id="dev-h">Signed-in devices</h2>
          {dataState === "normal" ? <span className="chip">{plural(devices.length, "device")}</span> : null}
        </div>
        <StateView
          state={dataState}
          skeleton="table"
          empty={{ title: "No devices yet", body: "Devices appear here after a grown-up signs in on the KudiCubs app." }}
          error={{ title: "We could not load your devices", body: "Check your connection and try again.", retryHref: "/dashboard/devices" }}
        >
          {devices.length === 0 ? (
            <div className="empty">
              <DeviceIcon size={36} />
              <h3>No devices yet</h3>
              <p className="muted">Devices appear here after a grown-up signs in on the KudiCubs app.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Device</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Last seen</th>
                    <th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((d) => (
                    <tr key={d.id}>
                      <td><strong>{d.label}</strong></td>
                      <td>{deviceMode(d.mode)}</td>
                      <td><span className={`db-status${deviceActive(d.last_seen, now) ? " on" : ""}`}>{deviceActive(d.last_seen, now) ? "Active now" : "Idle"}</span></td>
                      <td title={formatDate(d.last_seen)}>{timeAgo(d.last_seen)}</td>
                      <td>
                        <Link className="btn btn-sm" href={`/dashboard/devices?confirm=${d.id}`} scroll={false} aria-label={`Sign out ${d.label}`}>Sign out</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </StateView>
      </section>
      <div className="db-cards">
        <section className="db-section" aria-labelledby="exp-h">
          <h2 id="exp-h">Export your data</h2>
          <p>Download a file with each child&apos;s nickname, age band, region and progress. It never contains your PIN.</p>
          <div><Link className="btn btn-primary" href="/dashboard/devices?export=ready">Export family data</Link></div>
        </section>
        <section className="db-section" aria-labelledby="del-h">
          <h2 id="del-h">Delete family data</h2>
          <p>This erases every child&apos;s profile and progress, and your account. It cannot be undone.</p>
          <div className="db-note">
            <InfoIcon />
            <p>Accounts with no sign-in or play for <strong>12 months</strong> are deleted automatically. We email you 30 days and 7 days before. Any sign-in or play resets the clock.</p>
          </div>
          <div><Link className="btn btn-danger" href="/dashboard/devices?confirm=delete" scroll={false}><TrashIcon size={20} /> Delete family data</Link></div>
        </section>
      </div>

      {toSignOut ? (
        <ConfirmDialog key={toSignOut.id} title={`Sign out ${toSignOut.label}?`} icon={<DeviceIcon />} closeHref="/dashboard/devices">
          <p>Children on that device will stop playing until a grown-up signs in again. Their coins, badges and progress are kept.</p>
          <form action={signOutDevice} className="db-actions">
            <input type="hidden" name="deviceId" value={toSignOut.id} />
            <Link href="/dashboard/devices" className="btn" replace>Keep it signed in</Link>
            <button type="submit" className="btn btn-primary">Sign out</button>
          </form>
        </ConfirmDialog>
      ) : null}
      {confirmDelete ? (
        <ConfirmDialog title="Delete all family data?" icon={<TrashIcon />} closeHref="/dashboard/devices">
          <DeleteForm childCount={children.length} error={first(sp.err) === "confirm" ? "Type DELETE to confirm." : first(sp.err) === "failed" ? "We could not delete your data. Nothing was changed. Please try again." : undefined} />
        </ConfirmDialog>
      ) : null}
    </>
  );
}
