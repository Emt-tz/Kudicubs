import Link from "next/link";
import type { Metadata } from "next";
import { StateView } from "@/components/StateView";
import { getDemoState, getDemoVariant } from "@/lib/demo-state";
import { requireParent } from "@/lib/auth/session";
import { FamilyRegionForm } from "../../_b/FamilyRegionForm";
import { IdleTimeout } from "../../_b/IdleTimeout";
import { PinForm } from "../../_b/PinForm";
import { idleSeconds } from "../../_b/idle-params";
import { CheckIcon, LockIcon } from "../../_b/icons";
import "../../_b/dashb.css";

export const metadata: Metadata = { title: "Family settings" };

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Canvas: dp-17-settings-family (normal), dp-18-pin-change-error (?change=pin shows the form; ?state=pin-error shows its error design).
export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const state = getDemoState(sp);
  const variant = getDemoVariant(sp, ["pin-error"] as const);
  const parent = await requireParent();
  const idle = <IdleTimeout seconds={idleSeconds(sp)} />;

  if (variant === "pin-error" || first(sp.change) === "pin") {
    return (
      <>
        {idle}
        <div className="page-head">
          <div>
            <h1>Change your PIN</h1>
            <p className="db-lead">Your PIN protects the parent area on every device.</p>
          </div>
        </div>
        <PinForm
          initialErrors={
            variant === "pin-error"
              ? { current: "That PIN does not match your current PIN.", next: "Please choose a harder PIN. Avoid 1234 and repeated digits." }
              : undefined
          }
        />
      </>
    );
  }

  return (
    <>
      {idle}
      {first(sp.pin) === "changed" ? (
        <div className="banner banner-success" role="status">
          <CheckIcon />
          <div><strong>Your PIN was changed.</strong> Use the new PIN in the parent area on every device.</div>
        </div>
      ) : null}
      <div className="page-head">
        <div>
          <h1>Family settings</h1>
          <p className="db-lead">Your PIN, region and how you sign in.</p>
        </div>
      </div>
      <StateView state={state === "empty" ? "normal" : state} skeleton="list" error={{ title: "We could not load your settings", retryHref: "/dashboard/settings" }}>
        <section className="db-section" aria-label="Security">
          <div className="db-row">
            <div className="grow"><strong>Parent PIN</strong><span>Protects the parent area on every device. We check it before it can be changed.</span></div>
            <div aria-label="PIN hidden" style={{ fontWeight: 800, letterSpacing: "0.2em" }}>••••</div>
            <Link href="/dashboard/settings?change=pin" className="btn btn-sm">Change PIN</Link>
          </div>
          <div className="db-row">
            <div className="grow"><strong>Email</strong><span>Used for sign-in codes. Never shown to children.</span></div>
            <div style={{ fontWeight: 800 }}>{parent.email}</div>
          </div>
          <div className="db-row">
            <div className="grow"><strong>Sign-in</strong><span>We email a one-time code each time you sign in. There is no password.</span></div>
            <span className="pill"><LockIcon size={16} />Always on</span>
          </div>
        </section>
        <section className="db-section" aria-labelledby="region-h">
          <h2 id="region-h">Region</h2>
          <FamilyRegionForm region={parent.region} />
        </section>
      </StateView>
    </>
  );
}
