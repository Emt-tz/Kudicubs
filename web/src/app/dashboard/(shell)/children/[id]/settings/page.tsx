import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StateView } from "@/components/StateView";
import { getDemoState, getDemoVariant } from "@/lib/demo-state";
import { getParent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ChildSettingsForm } from "../../../../_b/ChildSettingsForm";
import { IdleTimeout } from "../../../../_b/IdleTimeout";
import { AVATARS, bandLabel, levelForXp, regionName } from "../../../../_b/consts";
import { loadChildSettings, loadChildren } from "../../../../_b/data";
import { idleSeconds } from "../../../../_b/idle-params";
import { CheckIcon, InfoIcon } from "../../../../_b/icons";
import "../../../../_b/dashb.css";

export const metadata: Metadata = { title: "Child settings" };

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// Canvas: dp-14-settings-child (normal), dp-15-settings-saved (?saved=1 or ?state=saved), dp-16-settings-error (validation errors or ?state=error).
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const state = getDemoState(sp);
  const variant = getDemoVariant(sp, ["saved", "error"] as const);
  const supabase = await createClient();
  const [{ children, failed }, parent] = await Promise.all([loadChildren(supabase), getParent()]);

  const isNew = id === "new";
  const loaded = isNew ? null : await loadChildSettings(supabase, id);
  if (loaded?.status === "missing") notFound();
  const dataState = state === "normal" && (failed || loaded?.status === "error") ? "error" : state;
  const child = loaded?.status === "ok" ? loaded.child : null;

  const saved = first(sp.saved) ?? (variant === "saved" ? "1" : undefined);
  const showErrorDesign = variant === "error" || (state === "error" && !failed && loaded?.status !== "error");
  const stateForView = showErrorDesign ? "normal" : dataState === "error" ? "error" : state === "empty" ? "normal" : state;

  const nickname = child?.nickname ?? "";
  const initial = {
    nickname: showErrorDesign ? "Amanda Boateng" : nickname,
    ageBand: child?.age_band ?? "b4_6",
    region: showErrorDesign ? "" : (child?.region ?? parent?.region ?? "gh"),
    avatar: child?.avatar && (AVATARS as readonly string[]).includes(child.avatar) ? child.avatar : AVATARS[0],
  };
  const level = levelForXp(loaded?.status === "ok" ? loaded.xp : 0);
  const who = isNew ? "your new child" : nickname || "this child";

  return (
    <>
      <IdleTimeout seconds={idleSeconds(sp)} />
      {saved ? (
        <div className="banner banner-success" role="status">
          <CheckIcon />
          <div>
            {saved === "new" ? (
              <><strong>Added.</strong> {nickname} can now sign in on the app with this family.</>
            ) : (
              <>
                <strong>Saved.</strong> {nickname}&apos;s nickname, age band, region and avatar are updated.
                {saved === "band" ? <> The age band changed, and every coin, badge and bit of progress {nickname} earned is kept.</> : null} {nickname} will see the changes the next time the app opens.
              </>
            )}
          </div>
        </div>
      ) : null}
      <div className="page-head">
        <div>
          <h1>{isNew ? "Add a child" : "Child settings"}</h1>
          <p className="db-lead">{isNew ? "Choose a nickname, age band, region and avatar. No real names." : "Choose how KudiCubs looks for each child."}</p>
        </div>
        {isNew ? null : (
          <Link href="/dashboard/children/new/settings" className="btn btn-sm">
            Add a child
          </Link>
        )}
      </div>
      {children.length ? (
        <nav className="db-tabs" aria-label="Choose a child">
          {children.map((c) => (
            <Link key={c.id} href={`/dashboard/children/${c.id}/settings`} className="db-tab" aria-current={c.id === id ? "page" : undefined}>
              {c.nickname}
            </Link>
          ))}
        </nav>
      ) : null}
      <StateView
        state={stateForView}
        skeleton="form"
        error={{ title: `We could not load ${who}'s settings`, body: "Check your connection and try again.", retryHref: `/dashboard/children/${id}/settings` }}
      >
        <div className="db-split">
          <div className="db-main">
            <ChildSettingsForm
              key={`${id}-${saved ?? ""}-${showErrorDesign}`}
              childId={id}
              initial={initial}
              initialErrors={
                showErrorDesign
                  ? { nickname: "Please choose a nickname from the list. Real names are not allowed.", region: "Please choose Ghana, Nigeria or the United Kingdom." }
                  : undefined
              }
              originalBand={child?.age_band ?? null}
              cancelHref={isNew ? "/dashboard" : `/dashboard/children/${id}`}
            />
          </div>
          <aside className="db-side">
            {child ? (
              <div className="db-child-card">
                <Image src={`/avatars/${initial.avatar}.svg`} alt="" width={72} height={72} unoptimized />
                <div>
                  <strong>{child.nickname}</strong>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {bandLabel(child.age_band)} · {regionName(child.region)} · Level {level}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="db-note">
              <InfoIcon />
              <div>
                <strong>Changes apply everywhere.</strong>
                <p>{isNew ? "The new child appears on every signed-in device the next time the app opens." : `${who === "this child" ? "The child" : who} sees them on every signed-in device the next time the app opens.`}</p>
              </div>
            </div>
          </aside>
        </div>
      </StateView>
    </>
  );
}
