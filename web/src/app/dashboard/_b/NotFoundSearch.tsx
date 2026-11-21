"use client";

import Link from "next/link";
import { useState } from "react";

const PAGES = [
  { href: "/dashboard", label: "Overview", words: "home family all children" },
  { href: "/dashboard/settings", label: "Family settings", words: "pin change region email account" },
  { href: "/dashboard/devices", label: "Devices and your data", words: "devices sign out export delete data" },
  { href: "/dashboard/summary", label: "Monthly summary", words: "report month print totals streak" },
  { href: "/dashboard/notifications", label: "Notifications", words: "alerts badges level up weekly" },
];

/** Searches the dashboard's own pages (and the children's pages passed in). */
export function NotFoundSearch({ children }: { children: { id: string; nickname: string }[] }) {
  const [q, setQ] = useState("");
  const all = [
    ...PAGES,
    ...children.flatMap((c) => [
      { href: `/dashboard/children/${c.id}`, label: `${c.nickname}: overview`, words: `${c.nickname} child` },
      { href: `/dashboard/children/${c.id}/settings`, label: `${c.nickname}: settings`, words: `${c.nickname} child nickname age band region avatar` },
    ]),
  ];
  const needle = q.trim().toLowerCase();
  const hits = needle ? all.filter((p) => `${p.label} ${p.words}`.toLowerCase().includes(needle)) : [];
  return (
    <div className="field" style={{ width: "100%", maxWidth: 420, textAlign: "left" }}>
      <label htmlFor="s">Search the dashboard</label>
      <input id="s" type="search" placeholder="For example: devices" value={q} onChange={(e) => setQ(e.target.value)} />
      <div aria-live="polite" style={{ marginTop: 8 }}>
        {needle && !hits.length ? <p className="muted">Nothing matches &ldquo;{q.trim()}&rdquo;.</p> : null}
        {hits.length ? (
          <ul className="db-links">
            {hits.map((h) => (
              <li key={h.href}><Link href={h.href}>{h.label}</Link></li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
