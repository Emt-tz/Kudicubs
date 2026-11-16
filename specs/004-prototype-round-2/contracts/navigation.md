# Contract: Navigation, Back and Route Guard (1.0.0)

**Spec**: FR-003, FR-004, FR-005, FR-006 · **Research**: R9 · **Supersedes** the Back rows of
002 `contracts/screen-flow.md` where they differ.

## 1. Back button visibility

| Screen | Back button |
|---|---|
| `welcome` | hidden (as before) |
| `home`, `wallet`, `progress` | **hidden** (FR-003) |
| everything else | shown |

## 2. Guard (runs on every navigation: `KC.go`, hash change, Back/Forward, refresh, deep link)

Evaluated in order. The first match redirects, with `history.replaceState`, so the redirect
itself leaves no history entry.

| # | Target | Condition | Redirect |
|---|---|---|---|
| G1 | `reward` | `run.pendingReward` is not set in this visit | `home`, granting nothing (FR-005) |
| G2 | `result-save`, `result-spend` | no active run, or the run hasn't reached Decision | `home`, granting nothing |
| G3 | `activity-find` … `summary` | no active run in this visit | `mission-intro` |
| G4 | `parent-gate`, `age-select`, `avatar` | `profile.onboarded` is true | `home` |
| G5 | `parent-gate` | reached by Back (any direction other than forward from `avatar`) | `home` once onboarded, else `avatar` |
| G6 | unknown id | — | `welcome` (or `home` once onboarded) |

## 3. Leaving no-return screens (FR-004)

Leaving `reward`, `result-*` or `parent-gate` forward uses `location.replace`. Their history entry
is replaced by the next screen, so Back from the next screen can never land on them.

**Expected Back chains** (tested):

| Journey | Back from | Lands on |
|---|---|---|
| … summary → reward → home | home | not reward, a result screen or the gate (the entry before the mission, or out of the app) |
| … decision → result-save → summary | summary | decision (result was replaced) |
| avatar → parent-gate → home | home | not parent-gate |

## 4. Replay narration (FR-006)

Reward decides `replay = run.isReplay` (set when the run started from an already completed
mission) **before** rendering. Title `reward.replay_title`, spoken line and caption
`reward.replay`. First completion uses `reward.title` and `reward.say`.

## 5. Returning player

When saved progress has `onboarded: true`: Welcome's main action goes to `home`, and the
onboarding and gate screens redirect (G4).
