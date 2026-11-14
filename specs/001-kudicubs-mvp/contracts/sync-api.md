# Contract: Sync API (protocol 1.0.0)

**Transport**: Supabase PostgREST RPC (`POST /rest/v1/rpc/<fn>`), called with the parent's access
token. Both functions are `SECURITY INVOKER`, so **row-level security applies to every row
read or written**.

**Related**: [data-model.md](../data-model.md) §2 (tables) and §6 (rules), and
[research.md](../research.md) R12.

---

## 1. `sync_push`

### Request

```json
{
  "p_protocol_version": "1.0.0",
  "p_device_id": "0193…-uuid",
  "p_app_version": "1.0.0",
  "p_batch": {
    "child_profiles":   [ { "id": "…", "nickname": "Ama", "avatar_id": "cub_03", "age_band": "b4_6",
                            "settings": { "sound": true, "narration": true },
                            "client_updated_at": "2026-11-14T09:00:00Z", "deleted_at": null } ],
    "mission_attempts": [ { "id": "…", "child_id": "…", "mission_id": "mc.lost_coins", "mission_version": "1.0.0",
                            "kind": "mission", "challenge_date": null, "retry_of": null,
                            "is_first_completion": true, "status": "completed",
                            "current_step_id": null, "step_state": { "choice": "save" },
                            "outcome": { "recap": ["found", "sorted", "counted", "saved"] },
                            "started_at": "…", "completed_at": "…", "client_updated_at": "…" } ],
    "wallet_events":    [ { "id": "…", "child_id": "…", "attempt_id": "…", "kind": "earn",
                            "coins_delta": 8, "savings_delta": 0, "xp_delta": 0,
                            "source": "mission:mc.lost_coins:count", "category": "missions",
                            "item_id": null, "occurred_at": "…" } ],
    "child_badges":     [ { "child_id": "…", "badge_id": "badge.hard_worker", "earned_at": "…", "attempt_id": "…" } ],
    "child_items":      [ { "child_id": "…", "item_id": "sticker.sun", "acquired_at": "…", "wallet_event_id": "…" } ],
    "analytics_events": [ { "id": "…", "child_id": "…", "event": "mission_completed", "mission_id": "mc.lost_coins",
                            "step_id": null, "props": { "durationSec": 312 }, "occurred_at": "…" } ]
  }
}
```

**Limits**:

- At most 500 rows in total per batch and at most 512 KB per request. The client splits larger
  outboxes into several batches.
- The client sends rows in outbox order.
- The server applies the entity groups in this order: `child_profiles` → `mission_attempts` →
  `wallet_events` → `child_badges` → `child_items` → `analytics_events`. This keeps foreign keys
  satisfied inside a single batch.

### Response `200`

```json
{
  "protocol_version": "1.0.0",
  "server_time": "2026-11-14T09:00:03Z",
  "account_state": "active",
  "applied":  { "wallet_events": ["…"], "mission_attempts": ["…"] },
  "ignored":  [ { "entity": "mission_attempts", "id": "…", "code": "stale_write" },
                { "entity": "wallet_events",    "id": "…", "code": "duplicate" } ],
  "rejected": [ { "entity": "wallet_events",    "id": "…", "code": "invariant_negative_balance" } ]
}
```

What the client does with each list:

| List | Client action |
|---|---|
| `applied` | Remove the rows from the outbox. |
| `ignored` | Remove from the outbox. This is the expected outcome of idempotent retries and stale writes. |
| `rejected` | Remove from the outbox, record locally, and send a `crash_report`-style diagnostic (a bug signal). **Never** retried as-is. |

### Merge semantics (normative)

| Entity | Rule | `ignored` code |
|---|---|---|
| `wallet_events` | `INSERT … ON CONFLICT (id) DO NOTHING` | `duplicate` |
| `mission_attempts` | Upsert if `(client_updated_at, device_id)` is greater than the stored values **and** the write doesn't change `status = 'completed'` to anything else | `stale_write`, `status_regression` |
| `child_badges`, `child_items` | `INSERT … ON CONFLICT DO NOTHING` | `duplicate` |
| `child_profiles` | Upsert, last-write-wins on `client_updated_at`. A `deleted_at` tombstone wins over a non-tombstone. | `stale_write` |
| `analytics_events` | Insert only if `parents.analytics_opt_in = true`, otherwise dropped | `analytics_disabled` |

**Rejection codes**:

| Code | Meaning |
|---|---|
| `invariant_negative_balance` | After applying the event, the child's folded coins or savings would be below zero. |
| `plausibility` | A delta is beyond the caps in data-model §2.9. |
| `band_not_released` | `age_band` is not selectable (FR-015b). |
| `unknown_mission` | `mission_id` is not in the catalogue. |
| `schema` | The row doesn't match the column rules. |

**Side effect**: every call sets `parents.last_active_at = now()` and
`devices.last_seen_at = now()` (FR-007i).

### Errors

| HTTP / code | When | Client behaviour |
|---|---|---|
| `401` | Token invalid or expired | Refresh the session. If refresh returns *user not found* → **`account_deleted`** flow: wipe local data and go to onboarding. |
| `409 consent_required` | `parents.consented_at IS NULL` | Keep the outbox and show the parent "confirm email" reminder (FR-007a). |
| `426 protocol_unsupported` | Major version not supported | Block sync and ask for an app update (with a parent-gated store link). |
| `413 batch_too_large` | Over the limits | Halve the batch size and retry. |
| `5xx` / network | — | Exponential backoff (2 s → 5 min), jittered, while online. |

---

## 2. `sync_pull`

### Request

```json
{ "p_protocol_version": "1.0.0", "p_device_id": "…", "p_cursor": 18234, "p_limit": 1000 }
```

`p_cursor` is the last `server_seq` the device has seen (`0` on a new device). `p_limit` is at
most 1000.

### Response `200`

```json
{
  "protocol_version": "1.0.0",
  "changes": {
    "parents":          [ { "id": "…", "region_code": "ng", "analytics_opt_in": false, "consented_at": "…", "server_seq": 18240 } ],
    "devices":          [ … ],
    "child_profiles":   [ … ],
    "mission_attempts": [ … ],
    "wallet_events":    [ … ],
    "child_badges":     [ … ],
    "child_items":      [ … ]
  },
  "catalogue": { "missions_version": "2026-11-14T08:00:00Z", "content_versions_changed": true },
  "next_cursor": 18301,
  "has_more": false
}
```

**Rules**:

- Rows are returned with `server_seq > p_cursor`, in ascending order, across all entities, up to
  `p_limit`.
- The client applies them with the same merge rules locally, then saves `next_cursor`. It keeps
  pulling while `has_more` is true.
- If `catalogue.content_versions_changed` is true, the client re-reads `missions` and the
  released `content_versions`, and schedules pack downloads (R11).
- `analytics_events` and `parent_secrets` are **never** returned.

---

## 3. Small RPCs

| Function | Arguments | Effect |
|---|---|---|
| `set_analytics_opt_in(p_enabled boolean)` | — | Updates `parents.analytics_opt_in`. Inserts or revokes a `consent_records` row with `kind = 'analytics'`. |
| `set_region(p_region text)` | `'gh'`, `'ng'` or `'uk'` | Updates `parents.region_code`. Coin counts don't change (FR-043). |
| `register_device(p_device_id uuid, p_mode text, p_platform text, p_app_version text)` | — | Upserts `devices` (FR-007h). |

---

## 4. Timing (SC-011)

| Trigger | Action |
|---|---|
| After any step that emits events | Push |
| App comes to the foreground | Push, then pull |
| Connectivity regained | Push, then pull |
| Every 30 s while in the foreground and online | Push, then pull |
| The parent opens a child in the parent view | Immediate pull |

The worst case for a change on device A to appear on device B, with both foregrounded and online,
is ≤ 30 s (A's push) + ≤ 30 s (B's pull) = 60 s.

---

## 5. Versioning

- `protocol_version` follows semantic versioning. The server accepts the current major version
  and the one before it.
- **Adding** optional fields is a MINOR change. Renaming, removing or changing the meaning of a
  field is a MAJOR change.
- Contract tests are in `supabase/tests/sync_*.sql` (pgTAP) and `app/test/core/sync/*`.
