# Contract: App Routes and Guards (go_router)

This is the UI contract between features. Each feature owns its routes, and `app/lib/app/router.dart`
composes them. Guards are evaluated **only** in the global `redirect`, so there is one place to
test them (research R4).

## Route map

| Path | Screen | Owner feature | Shell |
|---|---|---|---|
| `/onboarding/:step` | Welcome, age band, avatar, gate, region, PIN, email, OTP, joined | `onboarding` | none |
| `/profiles` | Picture-based child profile picker (FR-038) | `profile` | none |
| `/home` | Home dashboard (FR-009–012) | `home` | ChildShell |
| `/world` | World map and mission cards (FR-014) | `home` | ChildShell |
| `/wallet` | Wallet (FR-033) | `wallet` | ChildShell |
| `/progress` | Level path, badges, pillars (FR-034) | `progress` | ChildShell |
| `/profile` | Avatar, nickname, settings, parent entry (FR-035) | `profile` | ChildShell |
| `/mission/:missionId` | Mission runner: intro → steps → reward | `mission_engine` | MissionRoute (full-screen) |
| `/daily/:date` | Daily challenge runner | `mission_engine` | MissionRoute |
| `/gate` | Parent gate: challenge + PIN (FR-006); takes `?then=` | `parent` | none (modal) |
| `/parent` | Parent home: all children summary (FR-007h) | `parent` | ParentShell |
| `/parent/child/:childId` | Child progress, band change, edit or remove (FR-036) | `parent` | ParentShell |
| `/parent/settings` | Region, PIN, email, analytics opt-in, device mode, export, delete | `parent` | ParentShell |
| `/parent/learn/**` | **Reserved** for a future parent curriculum (R30) | `parent` | ParentShell |

ChildShell has a bottom navigation bar with icons and narrated labels, in this order: Home,
World, Wallet, Progress, Profile. No "Parent" tab is visible to children. The parent area is
reached from Profile only, through `/gate`.

## Guards, in evaluation order

1. **`account_deleted`** (wiped by sync) → `/onboarding/welcome`.
2. **Onboarding incomplete** → `/onboarding/<saved step>` (FR-008).
3. **Device mode `parent`** and the target is outside `/parent/**` or `/gate` →
   `/gate?then=/parent`. Parent devices never reach the child shell or the mission runner
   (FR-007h).
4. **The target is `/parent/**`** and there is no valid parent session → `/gate?then=<target>`.
   - A parent session is valid for 5 minutes of inactivity on family devices and 15 minutes on
     parent devices.
   - The session is cleared whenever the app goes to the background on a family device.
5. **No active child** and the target is in the ChildShell or MissionRoute, on a family device →
   `/profiles`. If the family has only one child, that child is selected automatically.
6. **Mission locked** (the previous mission isn't completed, FR-014) or **band not released**
   (FR-015b) → `/world`, with an unlock hint animation.

## External links

Any URL outside the app (privacy policy, store page, support email) opens **only** through
`ParentGate.guardExternal(url)`. That call passes the gate and then the system browser or share
sheet (FR-042). Lint rule: `url_launcher` may be imported only in `features/parent/`.

## Deep links

The MVP has none, apart from the OS returning to the app. The OTP email shows a code, not a link
(R13).
