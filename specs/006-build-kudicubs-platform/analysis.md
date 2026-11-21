# Analysis: spec ↔ plan ↔ tasks (006)

| Check | Result |
|---|---|
| Every FR maps to a task | FR-001→T010–T016, FR-002→T020–T023, FR-003→demo-state convention (plan) + T030/T031, FR-004→T004 band rules + T013/T014, FR-006–009→T003/T011/T016/T021, FR-010–011→T004 repositories, FR-012→T020, FR-013→T003, FR-014→T005, FR-015→T040/T041, FR-016→T030/T031 |
| Every SC verifiable | SC-001 via `design/coverage-map.json` + tests; SC-006 via `npm audit` in prebuild; SC-007 via T032 |
| Constitution | no conflict; ages 4–6 failure-free and 7–15 retry are tested (T004, T031) |
| Gap found | Online hosting needs accounts the build does not have → plan states tunnel now, env-only move later (accepted risk) |
| Gap found | Email codes are not fixed in this CLI version → tests read Mailpit; the shared demo path for testers online is a tunnel plus a documented read-only code page (see T041) |
| Risk | Parallel agents touching shared files → mitigated by one-file-per-screen stubs and separate folders; only the lead commits |
