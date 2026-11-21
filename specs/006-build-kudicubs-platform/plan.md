# Implementation Plan: Build the KudiCubs Platform

**Branch**: `006-build-kudicubs-platform` | **Date**: 2026-11-21 | **Spec**: [spec.md](./spec.md)
**Builds on**: [001 MVP plan](../001-kudicubs-mvp/plan.md) (architecture), [005 journey map](../005-platform-ux-prototypes/) (screens), `design/canvas/` (the 168 accepted screens as HTML).

## Summary

Three products on one backend, built in parallel from the accepted design:

| Product | Stack | Location | Screens |
|---|---|---|---|
| Phone app | Flutter 3.38 (Dart 3.10), Riverpod, go_router, supabase_flutter, local cache (shared_preferences) | `app/` | 108 |
| Web: website + Parent Dashboard + Team Console | Next.js 16 (App Router, TypeScript), `@supabase/ssr`, CSS with brand tokens, Playwright | `web/` | 18 + 30 + 12 |
| Backend | Supabase (Postgres + RLS + Auth email OTP), run locally with the CLI | `supabase/` | , |

## Constitution check

Child-first flow, failure-is-safe (4–6 never see failure; 7–15 retry, nothing lost), fictional currency only, parent gate + PIN, no third-party tracking: all carried straight from the design. Nothing in this plan weakens them. Wallet stays an append-only event log (no update/delete policy).

## Deviations from 001 (deliberate, for the 2-hour build; all deferred, none dropped)

| 001 item | Now | Why |
|---|---|---|
| Drift/SQLite + full outbox sync | `shared_preferences` cache + small outbox of pending events replayed on reconnect | speed; same behaviour (event log, idempotent ids) |
| Rive mascot, Flame mini-games | Static Kudi poses + Flutter animations | the accepted screens use static poses |
| Content-pack downloads, Edge Functions | Missions bundled in the app; PIN/export/delete/contact are SQL functions (`set_pin`, `verify_pin`, `export_my_family`, `delete_my_family`, `submit_contact`) | fewer moving parts; same guarantees |

## Repo layout (contract: agents only edit their own area)

```text
design/canvas/*.dc.html      accepted screens (read-only source of truth, inline-styled HTML)
design/canvas-index.json     id, title, section, platform, size for all 168
design/coverage-map.json     canvas id -> where it lives (web: url+state, app: route+state). Filled by the foundation agents, verified by tests
supabase/                    config.toml (ports 563xx), migrations/, seed (scripts/seed.mjs)
app/lib/core/                theme, tokens, widgets, supabase client, repositories, providers, router
app/lib/screens/<group>/     one file per canvas id: <id>.dart exporting Widget build_<id>(BuildContext, ScreenState)
app/lib/screens/registry.dart  generated: canvas id -> builder
web/src/app/(site)/...       website
web/src/app/dashboard/...    Parent Dashboard
web/src/app/team/...         Team Console
web/src/lib/                 supabase clients, auth guards, demo-state helper, tokens
web/tests/                   Playwright
```

## Backend contract (already migrated: `supabase/migrations/20261121000100_core.sql`)

Local stack: API `http://127.0.0.1:56321`, DB `56322`, Studio `56323`, Mail (Mailpit) `http://127.0.0.1:56324`. Keys from `supabase status -o env`.

- Auth: email one-time code (6 digits), `signInWithOtp` / `verifyOtp`. Local codes are read from Mailpit (`/api/v1/messages`). Parents get a `parents` row automatically; staff are rows in `staff_users`.
- Tables: `parents`, `child_profiles`, `devices`, `missions`, `badges`, `mission_attempts`, `wallet_events` (insert-only), `child_badges`, `contact_messages`, `staff_users`; view `child_balances` (coins, saved, xp).
- RPCs: `set_pin(pin)`, `verify_pin(pin) -> 'ok'|'wrong'|'locked'`, `export_my_family()`, `delete_my_family()`, `submit_contact(name,email,topic,message) -> reference`.
- RLS: a parent sees only their family; staff (in `staff_users`) read across families; clients can never read `pin_hash`.
- Seed (`scripts/seed.mjs`, run with the service key): users `parent@example.com` and `staff@example.com`, the sample family from `shared/sample-family.json` (Ama, Kofi, Zara, Tobi), all 17 missions and the badges.

## Cross-cutting conventions

1. **Demo states.** Every screen that has loading / empty / error variants in the design honours `?state=loading|empty|error|offline` (web) or a `ScreenState` argument (app). Real behaviour sets the state naturally; the override exists so each of the 168 designs can be opened and checked directly. Web enables the override only when `NEXT_PUBLIC_DEMO_STATES=1`.
2. **Gallery.** App: debug route `/screen/<canvas-id>` renders any of the 108 screens. Web: every screen has a real URL listed in `design/coverage-map.json`.
3. **Brand.** Tokens from `shared/tokens.css` / `docs/design/tokens.json`; fonts Baloo 2 + Nunito (bundled, no runtime CDN in the app); images from `shared/brand/`. Touch targets ≥ 48 dp on phone, 44 px on web.
4. **Money.** Fictional only: GH₵, ₦, £ from region config. No payment code anywhere.
5. **Vulnerability guard.** `web`: `npm run audit` = `npm audit --omit=dev --audit-level=moderate`, wired into `prebuild` so the build fails on a finding; exact-pinned dependencies; Dependabot config. `app`: `dart pub outdated` / `flutter pub upgrade` clean, no unmaintained packages.
6. **Secrets.** Only the anon key reaches clients. The service key is used by `scripts/seed.mjs` and tests only. `.env*` stays out of git; `.env.example` committed.

## Testing

- Web: Playwright (`web/tests`): coverage (all 60 screens render), journeys (sign-in with a real code from Mailpit, child view, PIN change, export, delete, contact form valid/invalid, staff vs non-staff), access (family A cannot read family B, anon gets nothing), `npm audit` clean.
- App: `flutter analyze` + `flutter test` (widget tests for band rules: 4–6 has no failure screen, 7–15 retry keeps balance), and an integration test run on the booted iOS simulator driving onboarding → mission → wallet, with screenshots through the simulator tool.
- Backend: SQL/JS access tests with two families and a staff user.

## Delivery

1. Local stack + seed (done by `scripts/dev-up.sh`).
2. Android APK (`flutter build apk --release`) pointed at the backend URL passed by `--dart-define`.
3. Online link: web built (`next build`) and served; backend and web exposed through a public tunnel until a hosting account is attached (recommendation: Vercel for `web/`, Supabase Cloud project for the backend; moving is env-only: `SUPABASE_URL`, `SUPABASE_ANON_KEY`).
4. Everything committed and pushed on `006-build-kudicubs-platform`, PR to `main`.
