# Contract: Mission Analytics Events (1.0.0)

**Scope**: mission events only (architecture input). They are first-party, sent through
`sync_push`, and stored in `analytics_events`.

**Collected only when the parent has opted in.** The default is off (research R19, Flag F5). With
analytics off, the device doesn't even queue events.

## What is never collected

- Advertising ids (AAID or IDFA). The Android `com.google.android.gms.permission.AD_ID`
  permission is removed in the merged manifest.
- Device or hardware ids, IP addresses, location, contacts.
- Free text of any kind, including the nickname.
- Screen recordings or touch heatmaps.
- Any third-party SDK.

## Events

| Event | When | `props` (whitelist; all optional) |
|---|---|---|
| `mission_started` | Mission Intro shown | `missionVersion`, `isReplay` (bool), `kind` (`mission`/`daily_challenge`) |
| `step_completed` | A step finishes | `stepKind`, `durationSec` (int), `choiceId` (Decision only: a content id, not text) |
| `hint_shown` | An idle hint fires (FR-012) | `stepKind`, `level` (1–3), `idleSec` |
| `retry_selected` | Try Again chosen (7–15) | `roundIndex` |
| `mission_completed` | Reward screen reached | `durationSec`, `firstCompletion` (bool), `bonusIds` (array of content ids) |
| `mission_abandoned` | Attempt marked abandoned | `lastStepKind` |

**Common columns**: `id`, `child_id`, `event`, `mission_id`, `step_id`, `occurred_at`,
`app_version`.

**Validation**:

- The server drops unknown events and any `props` key not in the whitelist.
- `props` is at most 1 KB.

## Use

- Funnels per mission and step.
- Hint frequency: the proxy for SC-003 hesitation outside moderated sessions.
- Retry rate.

Analysis runs on **aggregates only**, through views with a minimum group size of 10 children.
Nothing is sent to third parties.

## Retention

Rows are deleted after 12 months (`retention-sweep`). Turning analytics off revokes the
`consent_records` row and deletes that family's `analytics_events` within 24 hours.

## Versioning

Adding an event or a `props` key is a MINOR change. Changing the meaning of an event is a MAJOR
change, and the event is then renamed.
