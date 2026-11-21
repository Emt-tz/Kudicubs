# Mobile app gap audit (spec 005, T021 and T036)

Audit of the prototype against spec 001 stories 1 to 6 and 005 FR-005 to FR-010. Written after the build; "Built" names the routes
in `prototype/assets/data/screens.manifest.json`. Facts only: what exists, what is partial, what is not built.

## 1. Child screens (T021)

The 22 screens before 005 covered Story 1 (join the Pride), Story 2 (The Lost Coins), and the 4–6 versions of Story 3 and 4.

| Gap found | Story | Status now | Built as |
|---|---|---|---|
| Ages 7–9, 10–12, 13–15 were "Coming soon" | 001-US5, FR-006 | Built (one mission per band) | `age-select` (all enabled), `m7-*`, `m10-*`, `m13-*` |
| No mission above 4–6 | 001-US5 | Built | `m7-intro/decision/result/summary`, `m10-intro/resource/market/result/summary`, `m13-intro/budget/market/result/summary`, all ending at `reward` |
| No retry for 7–15 | Constitution III | Built | Result offers **Try again** first on a poor outcome; Reward alone grants anything |
| Home always pointed at The Lost Coins | 001-US3 | Built | `home` is band-aware (Continue goes to the band's mission) |
| No daily challenge screen | 001-US3 | Built | `daily-challenge` (default, done) |
| No level-up moment | 001-US3 | Built | `level-up`; Reward offers it as a secondary action when a level is crossed |
| No badge detail | 001-US4 | Built | `badge-detail` (earned, locked) |
| No profile | 001-US6 | Built | `profile` (friend, nickname, level, sound and narration switches, entry to the gate) |
| Wallet and Progress identical in every band | 001-US4 | Partly | Same layout; the empty states, the Continue route and the button size follow the band. No band-specific charts. |
| Only one mission per band | 001-US5 | Out of scope | Journey row J-APP-25 |

Narration: 38 new lines in `docs/design/narration/lines.json`, all pending recordings (no audio generated, nothing synthesised).
10–12 and 13–15 prompts play when tapped (age-band-rules); every spoken line has its words on screen.

## 2. Parent area (T036)

Before 005 the only parent screen was the gate (hold, maths, PIN twice, region, email) at sign-up.

| FR-010 item | Status | Built as |
|---|---|---|
| Gate | Existed; now also the way back in once a family has joined | `parent-gate` (hold, maths, PIN) |
| PIN set and confirm | Existed | `parent-gate` (onboarding) |
| Wrong PIN, lock-out | Built | `parent-gate` (tries left), `parent-lockout` (5 minute pause, way back to play) |
| PIN recovery | Built | `parent-pin-recover` (one-time code, new PIN twice) |
| Children list, one child's progress | Built | `parent-home`, `parent-child` |
| Add a child | Built (preset nicknames only, no real names) | `parent-add-child` |
| Settings: age band, sound, narration | Built | `parent-settings` |
| Region | Built | `parent-region` |
| Device mode | Built | `parent-device-mode` |
| New-device sign-in with an emailed code | Built (default, wrong, expired, resend) | `parent-signin` |
| Sign-out | Built | `parent-signed-out` |
| Account deletion with warnings | Built | `parent-delete` (what is erased, 12 months, way back, PIN again) |

Limits: only nicknames are shown; the PIN (2580) and code (123456) are fixed demo values; "added" children and the two sample
children (Kofi, Zara) are fictional and live for the visit only; no data leaves the phone.
