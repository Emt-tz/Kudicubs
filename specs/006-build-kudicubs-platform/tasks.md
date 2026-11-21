# Tasks: Build the KudiCubs Platform

Parallel workstreams; each owns separate folders so merges are trivial. [P] = can run in parallel with the others in its phase.

## Phase 1 — Foundations (parallel)
- [x] T001 [P] Spec, plan, checklist (`specs/006-*`), canvas source in `design/canvas/`, index in `design/canvas-index.json`
- [x] T002 [P] Backend schema + RLS + RPCs (`supabase/migrations`), local stack on ports 563xx
- [ ] T003 [P] Backend seed, `scripts/dev-up.sh`, access tests (sample family, staff, second family)
- [ ] T004 [P] Flutter foundation: theme, widgets, repositories, router, 108 screen stubs, gallery, band-rule tests (`app/`)
- [ ] T005 [P] Web foundation: tokens, auth guards, layouts, 60 route stubs, Playwright coverage, vulnerability guard (`web/`)

## Phase 2 — Screens (parallel, after T004/T005)
- [ ] T010 [P] App: onboarding + grown-up gate (App 1–2, 12 screens)
- [ ] T011 [P] App: parent setup, verify, returning sign-in (App 3–5, 18 screens)
- [ ] T012 [P] App: home, daily challenge, rewards + system states (App 6–7 incl. ms-20..22, App 18, 24 screens)
- [ ] T013 [P] App: missions ages 4–6 and 7–9 (App 8–10, 18 screens)
- [ ] T014 [P] App: missions ages 10–12 and 13–15 (App 11–12, 12 screens)
- [ ] T015 [P] App: wallet, progress, badges, profile (App 13–14, 12 screens)
- [ ] T016 [P] App: parent area (App 15–17, 18 screens)
- [ ] T020 [P] Web: website (18 screens) incl. contact form + family sign-in
- [ ] T021 [P] Web: Parent Dashboard auth, overview, child pages (≈15 screens)
- [ ] T022 [P] Web: Parent Dashboard settings, devices, export/delete, summary, notifications, errors (≈15 screens)
- [ ] T023 [P] Web: Team Console (12 screens)

## Phase 3 — Verification
- [ ] T030 Web: Playwright coverage (60/60), journeys, access checks, `npm audit` clean
- [ ] T031 App: `flutter analyze`, widget tests, band rules; integration test on the booted iOS simulator; screenshots of all 108 screens
- [ ] T032 Backend access tests (cross-family isolation, staff role, wallet append-only)
- [ ] T033 Cross-surface check: earn coins on the app → visible in web dashboard

## Phase 4 — Delivery
- [ ] T040 Android APK (`flutter build apk --release`) with backend URL
- [ ] T041 Online link for web + backend (tunnel now; permanent hosting is env-only)
- [ ] T042 README / handoff (`docs/build/HANDOFF.md`): URLs, demo accounts, commands
- [ ] T043 Commit, push `006-build-kudicubs-platform`, open PR to `main`
