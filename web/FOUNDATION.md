# KudiCubs web foundation

Next.js 16.4.6 (App Router, TypeScript), `@supabase/ssr`, plain CSS with brand tokens, Playwright.
This is the base the page builders work on: layouts, auth, demo states, route stubs for all 60 web screens and a coverage test.
Read `AGENTS.md` first: Next 16 renamed `middleware` to **`proxy`** and request APIs (`cookies()`, `headers()`, `params`, `searchParams`) are **async**.

## Commands (run in `web/`)

| Command | What it does |
|---|---|
| `npm run dev` | dev server (use `-p 3100` to match tests) |
| `npm run build` | runs `npm run audit` first (`npm audit --omit=dev --audit-level=moderate`); a finding fails the build |
| `npm run lint` / `npm run typecheck` | ESLint / `tsc --noEmit` |
| `npm test` | Playwright. Builds, starts on `http://127.0.0.1:3100` (re-uses a server already there), signs in the seed users once, runs every spec |
| `npx playwright test tests/coverage.spec.ts` | the 60-screen coverage check |

Prerequisites: `supabase start` in the repo root, `node scripts/seed.mjs` (users `parent@example.com`, `staff@example.com`), and `web/.env.local` (copy `.env.example`; the anon key is from `supabase status -o env`).
Dependencies are pinned to exact versions; Dependabot (`/.github/dependabot.yml`) proposes updates weekly.

## Layout of `src/`

```
proxy.ts                         session refresh + optimistic guard for /dashboard/** and /team/**
app/layout.tsx                   fonts (next/font/local, bundled woff2), tokens.css + globals.css
app/not-found.tsx                wb-14 website 404 (wrapped in the website chrome)
app/(site)/...                   website pages, inside <SiteFrame>
app/dashboard/(auth)/...         public dashboard pages: signin, code, session-timeout, forbidden, deleted (centred <AuthFrame>)
app/dashboard/(shell)/...        signed-in dashboard pages inside <DashboardShell>; not-found.tsx = dp-27
app/team/(auth)/...              public console pages: signin, no-access, error, signed-out
app/team/(shell)/...             signed-in console pages inside <TeamShell>; not-found.tsx = tc-06
components/                      see below
lib/supabase/{client,server}.ts  browser client / server client (cookie-bound, anon key, RLS applies; no admin client)
lib/auth/{session,actions,types}.ts
lib/demo-state.ts, lib/screens.ts (generated list of the 60 canvas ids and titles)
styles/tokens.css                copy of shared/tokens.css without @font-face
styles/globals.css               shared classes (below)
```

Every route is one `page.tsx` containing `<ScreenStub ids={[...]} />`. To build a screen, **replace the body of that file** and keep its location. The first id is the screen at the URL; the rest are its states. `design/coverage-map.json` (key `web`) maps each canvas id to its URL and state; `{child}`, `{family}`, `{mission}` in a URL are filled with a real seeded id by the tests. Keep each page's `<h1>` inside `<main>` (the shells already render `<main>`).

### URL map

Website: `/` web-01, `/how-it-works` wb-01, `/age-bands` web-02, `/safety` web-03, `/get-the-app` web-04 (`?sent=1` wb-02), `/faq` wb-03 (`?q=zzzz` wb-04), `/contact` wb-05 (`?state=error|sending|sent` wb-06/07/08), `/family/signin` wb-09 (`?state=error|sending` wb-10/11), `/privacy`, `/terms`, any unknown address wb-14.
Dashboard: `/dashboard/signin` dp-01 (`?state=error|loading`), `/dashboard/code` dp-04 (`?state=wrong|expired`), `/dashboard` dash-01 (`?state=loading|empty|error` dp-07/08/09), `/dashboard/children/[id]` dash-02 (`?state=empty` dp-10), `.../skills` dp-11, `.../activity` dp-12, `.../badges` dp-13, `.../settings` dp-14 (`?state=saved|error`), `/dashboard/settings` dp-17 (`?state=pin-error`), `/dashboard/devices` dash-03 (`?state=confirm-signout|export-ready|confirm-delete`), `/dashboard/deleted` dp-22, `/dashboard/summary` dp-23, `/dashboard/notifications` dp-24, `/dashboard/session-timeout` dp-25, `/dashboard/forbidden` dp-26, unknown `/dashboard/...` dp-27.
Team: `/team/signin` tc-01, `/team/families` tc-02 (`?q=no-match` tc-03, `?state=loading` tc-04), `/team/families/[id]` tc-05 (unknown id: `notFound()` renders tc-06), `/team/content` team-01 (`?q=no-match` tc-07), `/team/content/[id]` tc-08, `/team/no-access` tc-09, `/team/error` tc-10, `/team/signed-out` tc-11.
The two `[id]` stubs under `team` call `notFound()` for the nil UUID so tc-06 can be tested before real lookups exist; the real page should look the row up and call `notFound()` when there is none.

## Layout components

- `<SiteFrame>` (`components/SiteFrame.tsx`): skip link, header nav (How it works, Age bands, Safety, FAQ, Contact, Family sign-in, Get the app), `<main id="main">`, footer (Privacy, Terms, Children's privacy, Contact). Pages inside `(site)` only render their content. Edit links in `SITE_NAV` / `SITE_FOOTER`.
- `<DashboardShell email familyName? childProfiles notificationCount?>`: dark sidebar (Overview, Children, Skills, Activity, Badges / Settings, Devices and data, Monthly summary, Notifications), top bar (breadcrumb, child switcher, bell), Sign out form. `childProfiles` is `{id, nickname}[]`; Children/Skills/Activity/Badges follow the child in the URL, else the first child. Rendered by `dashboard/(shell)/layout.tsx`, which already loads the children under RLS and calls `requireParent()`.
- `<TeamShell email role>`: console sidebar (Families, Content), search box (GET `/team/families?q=`), role pill. Rendered by `team/(shell)/layout.tsx` with `requireStaff()`.
- `<AuthFrame>`: centred logo + card for public dashboard/team pages. Put your own card inside `<main>` (the frame renders it).
- `<NavLink href exact? matchPrefix?>`: `aria-current="page"` aware link. `<Breadcrumb root items>` is the top bar crumb.
- `<ScreenStub ids shell?>`: placeholder body, delete it when the real body lands.
- `<StateView state skeleton? empty? error? offline?>{children}</StateView>` and `<Skeleton>`: generic loading / empty / error / offline UI (below).

## CSS classes (`styles/globals.css`, tokens as `var(--kc-...)`)

Layout `.container .section .section-tint .grid .grid-2 .row .stack .spread .page-head`; buttons `.btn .btn-primary .btn-secondary .btn-quiet .btn-sm .btn-danger` (`.is-loading`, `[disabled]`); `.card` (bordered), `.card-soft`, `.stat .stat-n .stat-l`, `.chip .chip-outline`, `.bar`; tables `.table-wrap > table.table`; forms `.field` (label, input/select/textarea, `.hint`, `.error`; add `.has-error` on the field to show the error) and `.code-input`, `.form-card`; `.banner .banner-info|error|success|offline`; `.skeleton`; `.empty`; `.modal-scrim > .modal`; `.muted .sr-only`; shells `.app-*`, `.nav-link`, `.pill`, `.menu`, `.icon-btn`, `.avatar`. Touch targets are 44 px or more. Brand images are in `public/brand/` (`/brand/kudi-wave.webp`, logos as SVG).

## Auth

- `proxy.ts` refreshes the Supabase session cookie and gates `/dashboard/**` (no session -> `/dashboard/signin`) and `/team/**` (no session -> `/team/signin`; signed in but not in `staff_users` -> `/team/no-access`). Public pages are listed in `lib/auth/types.ts` (`PUBLIC_DASHBOARD_PATHS`, `PUBLIC_TEAM_PATHS`). The shell layouts re-check with `requireParent()` / `requireStaff()`, and RLS in the database is the real gate.
- Server helpers (`lib/auth/session.ts`, cached per request): `getParent()` -> `{userId,email,region,consentedAt} | null`; `getStaff()` -> `{userId,email,role} | null`; `requireParent()`, `requireStaff()` redirect when missing.
- Server actions (`lib/auth/actions.ts`), call them from a client form:
  - `sendCode(email, area)` -> `{ok:true,email,resendAfterSeconds}` or `{ok:false,error:'invalid_email'|'no_family'|'rate_limited'|'send_failed',message}`. `area` is `'dashboard'` (may create a new family), `'family'` (website sign-in; unknown email -> `no_family`), `'team'` (never reveals whether an address is staff).
  - `verifyCode(email, code, area)` -> `{ok:true,redirectTo}` or `{ok:false,error:'invalid_code_format'|'wrong_code'|'expired_code'|'too_many_attempts'|'unknown',message,attemptsLeft?}`. Supabase answers wrong and expired codes with the same error, so the 10-minute lifetime and the 5-attempt limit are tracked in an httpOnly `kc_code` cookie (UX only; Supabase still enforces expiry and rate limits). Success redirects to `/dashboard`, or `/team/families` (`/team/no-access` for non-staff). Navigate with `router.push(result.redirectTo)`.
  - `signOut(area)`: signs out and redirects (`/dashboard/signin`, `/team/signed-out`, `/`). Use as `<form action={signOut.bind(null, 'dashboard')}>`.

## Reading data on the server (RLS applies)

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();           // acts as the signed-in user, anon key
  const { data: child } = await supabase
    .from("child_balances").select("child_id,coins,saved,xp").eq("child_id", id).maybeSingle();
  if (!child) notFound();                          // another family's child is simply invisible
  ...
}
```
A parent only ever sees their own family's rows; staff (a row in `staff_users`) read across families; `pin_hash` is unreadable. Never read the service key in the web app. Mutations go through RPCs (`set_pin`, `verify_pin`, `export_my_family`, `delete_my_family`, `submit_contact`) from server actions: `await supabase.rpc("set_pin", { pin })`. Client components use `lib/supabase/client.ts` (`createClient()`), rarely needed.

## Demo states

`getDemoState(searchParams)` returns `'normal' | 'loading' | 'empty' | 'error' | 'offline'`, honoured only when `NEXT_PUBLIC_DEMO_STATES=1` (set in `.env.local` and `.env.example`; set 0 in production). For variants that are not one of the five (e.g. `wrong`, `expired`, `saved`, `sending`) use `getDemoVariant(searchParams, ['wrong','expired'] as const)`. Real behaviour sets the same states naturally; the override only lets each design be opened directly.

```tsx
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const state = getDemoState(await searchParams);
  return (
    <StateView state={state} skeleton="table"
      empty={{ title: "No families found", body: "Try another nickname." }}
      error={{ title: "We could not load families", retryHref: "/team/families" }}>
      <RealContent />
    </StateView>
  );
}
```
In real use, derive `state` from the data (`error` when the query fails, `empty` when there are no rows) and fall back to `getDemoState` only for the override.

## Writing a Playwright journey

`tests/helpers.ts`: `getMailCode(email, {since})` reads the newest Mailpit message to that address (`/api/v1/messages`, `/api/v1/message/<id>`) and returns the 6-digit code; `signInAs(page, email, area)` signs in through the real email-code flow (Node client) and installs the session cookies in the page's context (no UI clicks, so it works whatever the sign-in page looks like); constants `PARENT_EMAIL`, `STAFF_EMAIL`. `tests/global-setup.ts` saves signed-in browser states to `tests/.auth/{parent,staff}.json` (gitignored) which specs can use with `test.use({ storageState })`, as `auth-guards.spec.ts` does.

```ts
import { expect, test } from "@playwright/test";
import { getMailCode, PARENT_EMAIL } from "./helpers";

test("parent signs in through the real screens", async ({ page }) => {
  const since = Date.now() - 1000;
  await page.goto("/dashboard/signin");
  await page.getByLabel("Parent email").fill(PARENT_EMAIL);
  await page.getByRole("button", { name: "Send me a code" }).click();
  await page.getByLabel("6-digit code").fill(await getMailCode(PARENT_EMAIL, { since }));
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});
```
Put new specs in `web/tests/*.spec.ts`. Local Supabase allows 1 code per second per user; use `since` so a stale code is never read.

## Notes

- `next.config.ts` leaves `cacheComponents` and `partialPrefetching` off (the generated config had them on): signed-in pages read cookies per request, and static-shell rules break builds of dynamic pages.
- `allowedDevOrigins` includes `127.0.0.1` so `next dev` hydrates when opened at that address.
- Fonts: `src/fonts/*.woff2` copied from `prototype/assets/fonts` (OFL), served by `next/font/local`.
