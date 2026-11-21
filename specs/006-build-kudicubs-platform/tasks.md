# Tasks: Build the KudiCubs Platform

Parallel workstreams; each owns separate folders so merges are trivial. [P] = can run in parallel with the others in its phase.

## Phase 1 — Foundations (parallel)
- [x] T001 [P] Spec, plan, checklist (`specs/006-*`), canvas source in `design/canvas/`, index in `design/canvas-index.json`
- [x] T002 [P] Backend schema + RLS + RPCs (`supabase/migrations`), local stack on ports 563xx
- [x] T003 [P] Backend seed, `scripts/dev-up.sh`, access tests (sample family, staff, second family)
- [x] T004 [P] Flutter foundation: theme, widgets, repositories, router, 108 screen stubs, gallery, band-rule tests (`app/`)
- [x] T005 [P] Web foundation: tokens, auth guards, layouts, 60 route stubs, Playwright coverage, vulnerability guard (`web/`)

## Phase 2 — Screens (parallel, after T004/T005)
- [x] T010 [P] App: onboarding + grown-up gate (App 1–2, 12 screens)
- [x] T011 [P] App: parent setup, verify, returning sign-in (App 3–5, 18 screens)
- [x] T012 [P] App: home, daily challenge, rewards + system states (App 6–7 incl. ms-20..22, App 18, 24 screens)
- [x] T013 [P] App: missions ages 4–6 and 7–9 (App 8–10, 18 screens)
- [x] T014 [P] App: missions ages 10–12 and 13–15 (App 11–12, 12 screens)
- [x] T015 [P] App: wallet, progress, badges, profile (App 13–14, 12 screens)
- [x] T016 [P] App: parent area (App 15–17, 18 screens)
- [x] T020 [P] Web: website (18 screens) incl. contact form + family sign-in
- [x] T021 [P] Web: Parent Dashboard auth, overview, child pages (≈15 screens)
- [x] T022 [P] Web: Parent Dashboard settings, devices, export/delete, summary, notifications, errors (≈15 screens)
- [x] T023 [P] Web: Team Console (12 screens)

## Phase 3 — Verification
- [x] T030 Web: Playwright coverage (60/60), journeys, access checks, `npm audit` clean
- [X] T031 App: `flutter analyze`, widget tests, band rules; integration test on the booted iOS simulator (app/integration_test/simulator_test.dart: real email-code sign-in, children from backend, all 108 screens in 2 states, no exceptions; found and fixed an au-12 overflow). Also walked by hand on the simulator (taps and screenshots): splash, welcome, intro, age, friend, parent gate (hold + maths), PIN create and confirm (including the mismatch recovery), region, email, real emailed code, joined screen, home, wallet and mission intro. Screenshots of all 108 screens in normal and error states were captured on the simulator and reviewed; this found and fixed a missing page wrapper that drew the 12 error states of the 10-15 missions on a black background. Not done: Playwright against the simulator (the Flutter runner and simulator tool were used). Known copy nit: the mission text says Kofi, whatever the child's name.
- [x] T032 Backend access tests (cross-family isolation, staff role, wallet append-only)
- [ ] T033 Cross-surface check: earn coins on the app → visible in web dashboard

## Phase 4 — Delivery
- [x] T040 Android APK (`flutter build apk --release`) with backend URL
- [x] T041 Online link for web + backend (tunnel now; permanent hosting is env-only)
- [x] T042 README / handoff (`docs/build/HANDOFF.md`): URLs, demo accounts, commands
- [ ] T043 Commit, push `006-build-kudicubs-platform`, open PR to `main`
