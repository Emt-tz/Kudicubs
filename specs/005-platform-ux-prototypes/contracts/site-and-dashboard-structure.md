# Contract: Website, Parent Dashboard and Team Console Structure (1.0.0)

**Spec**: FR-011–FR-018 · **Research**: R7, R8, R10, R11

## Website pages (`/website/`)

| Page id | Purpose | Primary action | Notes |
|---|---|---|---|
| `index` | What KudiCubs is, the promise, Kudi | Get the app | Brand header, three benefits, age bands teaser |
| `how-it-works` | Missions, rewards, pillars | Get the app | No child play |
| `age-bands` | What each band does | Get the app | Four bands with examples per region |
| `safety` | Parent gate, PIN, no real money, data | Read privacy | Plain words |
| `get-the-app` | Android and iOS routes | Choose store | Desktop shows "send me the link" with sent state |
| `faq` | Questions | Contact us | Expand and collapse; empty search state |
| `contact` | Form | Send | Empty, filled, error, sending, sent |
| `sign-in` | Family sign-in | Send code | Leads to the Parent Dashboard |
| `privacy`, `terms`, `children-privacy` | Legal | n/a | Placeholder text pending legal review |

Rules: no child data collection, no ads, no countdown timers, one primary action per page, a footer
with legal links, `noindex`. Layout switches at 640, 1024 and 1280 px.

## Parent Dashboard views (`/dashboard/parent/`)

| View id | States |
|---|---|
| `sign-in` | default, error (wrong code), expired, loading |
| `code` | default, error, resend sent |
| `overview` | default, new-family empty, loading, error |
| `child` | default, no-play-yet empty |
| `skills` | default, empty |
| `badges` | default, empty |
| `activity` | default, empty |
| `settings-child` | default, saved, error (age band change confirmation) |
| `settings-family` | default, saved (PIN, email, region) |
| `devices` | default, sign-out-device confirm |
| `data` | export ready, delete confirm, deleted |
| `monthly-summary` | default, empty |
| `signed-out` | default |

Money always shown in the child's own region currency. Layout: side navigation at ≥ 1024 px,
bottom or top navigation below.

## Team Console views (`/dashboard/team/`)

| View id | Role | States |
|---|---|---|
| `sign-in` | any | default, role chooser |
| `families` | support | default, empty search, loading |
| `family` | support | default (nicknames only) |
| `content` | content-editor | default, filtered empty |
| `mission` | content-editor | default (age band, regions, voice-recording status) |
| `no-access` | any | default |

## Shared adult components (`shared/adult-components.css`)

`top-nav`, `side-nav`, `table`, `form-field`, `button` (primary, quiet), `card`, `tabs`,
`stat-tile`, `chart-shell`, `empty-state`, `toast`, `modal`. Each is documented with states and
sizes (compact, comfortable) in `docs/design/components.md`. Contrast and touch-size rules are the
existing ones; adult touch targets are 44 px minimum.
