import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { StateView } from "@/components/StateView";
import { getDemoState } from "@/lib/demo-state";
import { requireParent } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { markNotificationsRead } from "../../_b/actions";
import { IdleTimeout } from "../../_b/IdleTimeout";
import { NOTIF_READ_COOKIE } from "../../_b/consts";
import { loadNotifications, type Notice } from "../../_b/data";
import { idleSeconds } from "../../_b/idle-params";
import { timeAgo } from "../../_b/format";
import { ChildIcon, ClockIcon, DeviceIcon, FileIcon, LevelIcon, StarIcon } from "../../_b/icons";
import "../../_b/dashb.css";

export const metadata: Metadata = { title: "Notifications" };

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "milestones", label: "Milestones" },
  { key: "account", label: "Account" },
] as const;
type Tab = (typeof TABS)[number]["key"];

const ICONS = { badge: StarIcon, level: LevelIcon, summary: FileIcon, device: DeviceIcon, child: ChildIcon };

// Canvas: dp-24-notifications. Items are derived from the family's real rows (badges earned, level-ups, weekly summaries,
// children added, devices). "Read" is remembered in this browser with a cookie.
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  await requireParent();
  const demo = getDemoState(sp);
  const raw = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const tab: Tab = TABS.some((t) => t.key === raw) ? (raw as Tab) : "all";

  const supabase = await createClient();
  const items = demo === "loading" ? [] : await loadNotifications(supabase);
  const readAt = Number((await cookies()).get(NOTIF_READ_COOKIE)?.value ?? 0);
  const list: Notice[] = items === "error" ? [] : demo === "empty" ? [] : items;
  const isUnread = (n: Notice) => n.at.getTime() > readAt;
  const unread = list.filter(isUnread).length;
  const shown = list.filter((n) => (tab === "unread" ? isUnread(n) : tab === "milestones" ? n.kind === "milestone" : tab === "account" ? n.kind === "account" : true));
  const state = demo !== "normal" ? demo : items === "error" ? "error" : list.length === 0 ? "empty" : "normal";

  return (
    <>
      <IdleTimeout seconds={idleSeconds(sp)} />
      <div className="page-head">
        <div>
          <h1>Notifications</h1>
          <p className="db-lead">Milestones, summaries and account activity from the last 30 days.</p>
        </div>
        {unread > 0 ? (
          <form action={markNotificationsRead}>
            <input type="hidden" name="tab" value={tab} />
            <button type="submit" className="btn btn-sm">Mark all as read</button>
          </form>
        ) : null}
      </div>
      <nav className="db-tabs" aria-label="Filter notifications">
        {TABS.map((t) => (
          <Link key={t.key} href={`/dashboard/notifications?tab=${t.key}`} className="db-tab" aria-current={t.key === tab ? "page" : undefined}>
            {t.label}
            {t.key === "unread" && unread > 0 ? <span className="count">{unread}</span> : null}
          </Link>
        ))}
      </nav>
      <StateView
        state={state}
        skeleton="list"
        empty={{ title: "No notifications yet", body: "Badges, level-ups and weekly summaries will show up here." }}
        error={{ title: "We could not load your notifications", body: "Check your connection and try again.", retryHref: "/dashboard/notifications" }}
      >
        <section className="db-section" aria-label="Notifications">
          {shown.length === 0 ? (
            <div className="empty">
              <ClockIcon size={36} />
              <h3>{tab === "unread" ? "You are all caught up" : "Nothing here"}</h3>
              <p className="muted">{tab === "unread" ? "There is nothing new since you last marked everything as read." : "Nothing in this list in the last 30 days."}</p>
            </div>
          ) : (
            <ul className="db-notifs">
              {shown.map((n) => {
                const Icon = ICONS[n.icon];
                const un = isUnread(n);
                return (
                  <li key={n.id} className={un ? "unread" : undefined}>
                    <span className="dotc" role={un ? "img" : undefined} aria-label={un ? "Unread" : undefined} />
                    <div className="ic"><Icon size={20} /></div>
                    <div className="body">
                      <strong>{n.title}</strong>
                      <span>{n.detail}</span>
                    </div>
                    {n.href && n.action ? <Link href={n.href} className="btn btn-sm">{n.action}</Link> : n.href ? <Link href={n.href}>View</Link> : null}
                    <time dateTime={n.at.toISOString()}>{timeAgo(n.at)}</time>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </StateView>
    </>
  );
}
