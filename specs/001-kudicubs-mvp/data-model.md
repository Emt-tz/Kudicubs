# Data Model: KudiCubs MVP

**Feature**: `001-kudicubs-mvp` | **Date**: 2026-11-14 | **Plan**: [plan.md](./plan.md) |
**Research**: [research.md](./research.md)

The model has three layers:

1. **Server**: Supabase Postgres, the system of record for synced family data. Row-level
   security (RLS) is enabled on every table.
2. **Device**: SQLite via Drift, the source of truth for the UI and for offline play. It mirrors
   the synced tables and adds an outbox and app state.
3. **Content**: versioned JSON in content packs (missions, worlds, badges, levels, regions,
   band rules), described in [contracts/](./contracts/). Only catalogue rows (`missions`,
   `badges`, `content_versions`) live in Postgres.

Conventions:

- Ids are UUID v7 and are **generated on the device** for synced rows, so writes made offline
  are idempotent.
- Timestamps are `timestamptz`, stored in UTC.
- Each synced table has `server_seq bigint`, assigned by the server from one global sequence on
  every insert or update. It drives `sync_pull`.
- Soft deletion (`deleted_at`) is used only where a deletion must sync between devices. Family
  deletion is a hard cascade.

---

## 1. Entity overview

```text
auth.users (Supabase Auth, parent email)
   │ 1:1
parents ──1:1── parent_secrets          (no client access)
   │ 1:N ── consent_records
   │ 1:N ── devices
   │ 1:N ── retention_notices           (no client access)
   │ 1:N
child_profiles
   │ 1:N ── mission_attempts ──N:1── missions (catalogue) ──N:1── content_versions
   │ 1:N ── wallet_events  ──N:1── mission_attempts (optional)
   │ 1:N ── child_badges   ──N:1── badges (catalogue)
   │ 1:N ── child_items             (cosmetic inventory)
   │ 1:N ── analytics_events        (only if the parent opted in)
crash_reports                         (anonymous, no foreign keys)
otp_attempts                          (no client access)
app_meta                              (schema version)
```

How the spec's key entities map to tables:

| Spec entity | Table or content |
|---|---|
| Family Account | `parents` (+ `auth.users`) |
| Consent Record | `consent_records` (+ `parents.consented_at`) |
| Device | `devices` |
| Child Profile | `child_profiles` |
| Wallet Transaction | `wallet_events` |
| Badge | `badges` (catalogue) + `child_badges` |
| Mission | `missions` (catalogue) + mission JSON content |
| Reward | Expressed as `wallet_events` (coins and XP) + `child_badges` + derived level |
| Daily Challenge | `mission_attempts` with `kind = 'daily_challenge'` |
| Age Band, World, Screen Type, Curriculum Pillar, Region Configuration | Enums and content (see §4) |

---

## 2. Server tables (Postgres)

### 2.1 `parents`: the family account

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | = `auth.users.id`; `ON DELETE CASCADE` from `auth.users` |
| `region_code` | text | `CHECK (region_code IN ('gh','ng','uk'))`; default `'gh'` |
| `consented_at` | timestamptz null | Set by `otp-verify` on the first verification (FR-007a) |
| `privacy_notice_version` | text | The semver of the notice agreed to |
| `analytics_opt_in` | boolean | Default **false** (R19) |
| `last_active_at` | timestamptz | Updated by `sync_push` and sign-in; drives retention (FR-007i) |
| `created_at`, `updated_at` | timestamptz | |
| `server_seq` | bigint | |

The email is not copied here. It stays in `auth.users` only (minimal data).

- **RLS**: `select`, `update` where `id = auth.uid()`. Only `region_code` and
  `analytics_opt_in` can be updated by the client (column privileges). Clients can't insert;
  `otp-verify` creates the row.

### 2.2 `parent_secrets`

| Column | Type | Rules |
|---|---|---|
| `parent_id` | uuid PK, FK → `parents` cascade | |
| `pin_hash`, `pin_salt` | bytea | PBKDF2-HMAC-SHA256 (R14) |
| `pin_params` | jsonb | Algorithm and iteration count, to allow future upgrades |
| `failed_attempts` | int | Reset on success |
| `locked_until` | timestamptz null | |
| `pin_updated_at` | timestamptz | |

- **RLS**: enabled with **no policies**, so clients can't access it. Only the `pin-set` and
  `pin-verify` Edge Functions use it, with the service role.

### 2.3 `consent_records`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `parent_id` | uuid FK cascade | |
| `kind` | enum `consent_kind` (`privacy_notice`, `analytics`) | |
| `version` | text | The version of the document consented to |
| `method` | text | `'email_otp'` for the privacy notice, `'parent_area_toggle'` for analytics |
| `granted_at` | timestamptz | |
| `revoked_at` | timestamptz null | |

- **RLS**: `select` own rows. `insert` only through functions (`otp-verify`, `set_analytics_opt_in`).

### 2.4 `devices`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | A random id generated at install. **Not a hardware or advertising id.** |
| `parent_id` | uuid FK cascade | |
| `mode` | enum `device_mode` (`family`, `parent`) | FR-007h |
| `platform` | text | `'android'` / `'ios'` |
| `app_version` | text | semver |
| `last_seen_at` | timestamptz | |
| `server_seq` | bigint | |

- **RLS**: `select`, `insert`, `update` where `parent_id = auth.uid()`. `delete` on own rows
  (sign out of a device).

### 2.5 `child_profiles`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | Generated on the device |
| `parent_id` | uuid FK cascade | |
| `nickname` | text | 2–16 characters, passed by the word filter on the device (R31). `CHECK (char_length BETWEEN 2 AND 16)` |
| `avatar_id` | text | Must exist in the avatar catalogue (content). No photos (FR-005). |
| `age_band` | enum `age_band` (`b4_6`, `b7_9`, `b10_12`, `b13_15`) | Must be a band whose world is released (FR-015b). Checked by `sync_push` against `missions.released`. |
| `settings` | jsonb | `{ "sound": bool, "narration": bool }` only (schema-checked) |
| `client_updated_at` | timestamptz | For last-write-wins |
| `deleted_at` | timestamptz null | Tombstone, so a profile removal syncs (FR-036) |
| `created_at` | timestamptz | |
| `server_seq` | bigint | |

**No other columns.** There is no name, birth date, photo, location or contact (FR-005, FR-007f).

- **RLS**: all operations where `parent_id = auth.uid()`.

### 2.6 `missions` (catalogue, read-only to clients)

| Column | Type | Rules |
|---|---|---|
| `id` | text PK | e.g. `mc.lost_coins` (`{worldPrefix}.{slug}`) |
| `world_id` | text | `money_choices` / `build_grow` / `founder_mode` / `side_hustle` |
| `age_band` | `age_band` | |
| `order_index` | int | 1-based within the world; drives unlocking (FR-014) |
| `pillars` | `pillar[]` | Non-empty (FR-018) |
| `stage` | int | 1–4 (FR-015a) |
| `released` | boolean | A band is selectable only if at least one mission in its world is released |
| `current_version` | text | The latest released mission semver |
| `pack_id` | text | The world pack that contains it |

- **RLS**: `select` for `authenticated` and `anon`. Writes only by migrations or the content
  publish script (service role).

### 2.7 `content_versions` (catalogue)

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `pack_id` | text | e.g. `world.money_choices`, `region.ng` |
| `pack_type` | enum (`world`, `region`, `parent`) | `parent` is reserved (R30) |
| `version` | text | semver; `UNIQUE (pack_id, version)` |
| `schema_version` | text | The content schema semver |
| `min_app_version` | text | semver |
| `sha256` | text | Hex |
| `size_bytes` | bigint | Shown to the parent before a mobile-data download |
| `storage_path` | text | `content/{packId}/{version}/pack.zip` |
| `status` | enum (`draft`, `released`, `withdrawn`) | Clients see only `released` |
| `released_at` | timestamptz | |

- **RLS**: `select where status = 'released'` for everyone. Writes by service role only.

### 2.8 `mission_attempts`

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | Generated on the device |
| `child_id` | uuid FK → `child_profiles` cascade | |
| `mission_id` | text FK → `missions` | |
| `mission_version` | text | The version played; replays may use a newer one |
| `kind` | enum (`mission`, `daily_challenge`) | |
| `challenge_date` | date null | Required when `kind = 'daily_challenge'`; `UNIQUE (child_id, challenge_date)` where kind is daily (one per day, FR-011) |
| `retry_of` | uuid null FK → `mission_attempts` | Set by Try Again (FR-032) |
| `is_first_completion` | boolean | Computed by the engine; drives full versus replay rewards (R10) |
| `status` | enum `attempt_status` (`in_progress`, `completed`, `abandoned`) | See state machine §3.2 |
| `current_step_id` | text null | Resume point: the start of this step (spec US2 scenario 10) |
| `step_state` | jsonb | The child's choices per step (e.g. `{ "decide_save_spend": "save" }`); ≤ 16 KB |
| `outcome` | jsonb null | Round results, e.g. `{ revenue, costs, profit }` or a 4–6 recap |
| `started_at`, `completed_at` | timestamptz | |
| `client_updated_at` | timestamptz | For last-write-wins |
| `device_id` | uuid | Breaks last-write-wins ties |
| `server_seq` | bigint | |

**Merge rule** (in `sync_push`): accept an incoming row if
`(incoming.client_updated_at, incoming.device_id) > (stored.client_updated_at, stored.device_id)`
**and** it does not move `status` from `completed` to anything else (Flag F3).

- **RLS**: all operations where `child_id` belongs to `auth.uid()` (via an `EXISTS` on
  `child_profiles`).

### 2.9 `wallet_events` (append-only ledger)

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | Generated on the device. Idempotency key: `ON CONFLICT (id) DO NOTHING`. |
| `child_id` | uuid FK cascade | |
| `attempt_id` | uuid null FK → `mission_attempts` | |
| `kind` | enum `wallet_event_kind` (`earn`, `bonus`, `reward`, `spend`, `save`, `unsave`, `interest`) | `interest` is simulated in-game interest only (13–15 bank) |
| `coins_delta` | int | |
| `savings_delta` | int | |
| `xp_delta` | int | `>= 0` (XP is never removed, FR-027) |
| `source` | text | A machine key, e.g. `mission:mc.lost_coins:sort_bonus`, `daily:2026-11-14` |
| `category` | text | A chart bucket for the Wallet (FR-033): `missions`, `bonus`, `daily`, `treats`, `savings`, `business_costs`, `business_sales` |
| `item_id` | text null | For `spend` on a cosmetic treat |
| `occurred_at` | timestamptz | Device time |
| `device_id` | uuid | |
| `server_seq` | bigint | |

**Constraints per kind**:

| Kind | `coins_delta` | `savings_delta` |
|---|---|---|
| `earn`, `bonus`, `reward` | ≥ 0 | 0 |
| `spend` | < 0 | 0 |
| `save` | < 0 | = −`coins_delta` |
| `unsave` | > 0 | = −`coins_delta` |
| `interest` | 0 | > 0 |

**Plausibility caps**: `abs(coins_delta) <= 100000` and `xp_delta <= 5000`. These are not a
security boundary, because the coins have no value, but they catch bugs.

There are **no `UPDATE` or `DELETE` privileges** for clients. Rows go only through `sync_push`.

- **RLS**: `select` and `insert` where `child_id` belongs to `auth.uid()`.

### 2.10 `badges` (catalogue) and `child_badges`

**`badges`**:

| Column | Type | Rules |
|---|---|---|
| `id` | text PK | e.g. `smart_saver`, `hard_worker`, `rainy_day_hero` |
| `world_id` | text null | `null` = badge for any world |
| `name_key`, `icon` | text | |
| `criteria` | jsonb | Mirrors the content |

**`child_badges`**:

| Column | Type | Rules |
|---|---|---|
| `child_id` | uuid FK cascade | |
| `badge_id` | text FK → `badges` | |
| `earned_at` | timestamptz | |
| `attempt_id` | uuid null | |
| `server_seq` | bigint | |

- **PK**: `(child_id, badge_id)`. It is a grow-only set: `ON CONFLICT DO NOTHING`, and clients
  have no delete privilege (FR-027).
- **RLS**: `badges` can be read by everyone. `child_badges` `select` and `insert` for the
  family's own children.

### 2.11 `child_items`: cosmetic inventory

| Column | Type | Rules |
|---|---|---|
| `child_id` | uuid FK cascade | |
| `item_id` | text | From the content cosmetic catalogue (e.g. `sticker.sun`, `hat.party`) |
| `acquired_at` | timestamptz | |
| `wallet_event_id` | uuid null FK | The `spend` event that bought it (FR-022) |
| `server_seq` | bigint | |

- **PK**: `(child_id, item_id)`. Grow-only.
- **RLS**: as `child_badges`.

### 2.12 `analytics_events`: written only if the parent opted in

| Column | Type | Rules |
|---|---|---|
| `id` | uuid PK | |
| `child_id` | uuid FK cascade | |
| `event` | enum `analytics_event` | See [contracts/analytics-events.md](./contracts/analytics-events.md) |
| `mission_id` | text | |
| `step_id` | text null | |
| `props` | jsonb | Whitelisted keys only, ≤ 1 KB |
| `occurred_at` | timestamptz | |
| `app_version` | text | |

`sync_push` drops these events unless `parents.analytics_opt_in = true`. A daily job deletes rows
older than 12 months.

- **RLS**: `insert` for own children. **No `select` for clients.** Analysis happens server-side
  on aggregated data.

### 2.13 Operational tables (no client access)

| Table | Columns | Purpose |
|---|---|---|
| `crash_reports` | `id`, `app_version`, `platform`, `os_version`, `device_class`, `stack text`, `occurred_at` | No family, child or device id (R20). Inserted by the `crash-report` function. |
| `otp_attempts` | `email_hash` (SHA-256 with a server pepper) PK, `window_started_at`, `failures`, `locked_until` | The 5-failure lockout (FR-007g) |
| `retention_notices` | `parent_id` FK cascade, `kind` (`warn_30`, `warn_7`), `sent_at`; PK `(parent_id, kind)` | FR-007i, SC-015 |
| `app_meta` | `key` PK, `value` | `schema_version` (semver, R28) |

### 2.14 Derived views (`security_invoker = true`, so RLS applies)

| View | Definition |
|---|---|
| `child_balances` | Per child: `coins = sum(coins_delta)`, `savings = sum(savings_delta)`, `xp = sum(xp_delta)` |
| `child_pillar_progress` | Per child and pillar: the share of released missions with that pillar that the child has completed (`count(distinct mission_id) where status = 'completed'` ÷ released missions with that pillar). Feeds FR-034 and the parent view. |
| `child_recent_missions` | The last 10 completed attempts per child, for the parent view (FR-007h) |

The level is **not** stored. The device computes it from `xp` and the world's level thresholds in
the content (FR-026), so changing the content can retune levels without a migration.

---

## 3. State machines

### 3.1 Family account life cycle

```text
          onboarding done, no network / OTP not yet verified
 (none) ───────────────────────────────▶ LOCAL_ONLY
                                           │ otp-verify succeeds (consent recorded)
                                           ▼
                                        ACTIVE ◀─────────────── any sign-in or sync_push
                                           │ last_active_at > 11 months
                                           ▼
                                   WARNED_30 ─(> 12 months − 7 days)─▶ WARNED_7
                                           │                                │
                                           │ activity resets the clock       │ > 12 months
                                           ▼                                ▼
                                        ACTIVE                          DELETED (cascade)
 ACTIVE ──parent requests deletion (gate + PIN + confirmation)──▶ DELETED
```

- `LOCAL_ONLY` exists only on the device. Data is written to the outbox but never pushed
  (FR-007a).
- Warning states are recorded in `retention_notices`. They are cleared when activity resets the
  clock.

### 3.2 Mission attempt

```text
 new ──▶ in_progress ──(Reward step reached)──▶ completed     (terminal)
              │
              ├──(app closed)──▶ in_progress   (resume at the start of current_step_id)
              ├──(band changed / child left the mission for > 7 days)──▶ abandoned  (terminal)
              └──(Try Again on a 7–15 Round Summary)──▶ completed or abandoned,
                                                        plus a new attempt with retry_of = old id
```

- Rewards already emitted (`wallet_events`) are **never reversed**, whatever the attempt's final
  status (FR-027, FR-032).
- Only one `in_progress` attempt per child and mission. The engine resumes it instead of creating
  a new one.

### 3.3 Onboarding (device only, persisted after each step, FR-008)

```text
welcome → age_band → avatar → gate_challenge → region → pin_set → email_entry
   → otp_entry (may be skipped: "confirm later") → joined_pride → home
```

- If the device is offline at `email_entry`, onboarding moves to `joined_pride` in
  `LOCAL_ONLY`. The parent area shows a "confirm your email" reminder (spec edge case).
- **Adding a second child** (FR-038): `welcome → age_band → avatar → joined_pride`, skipping the
  parent steps.

### 3.4 Device mode (FR-007h)

```text
unset ──(first device of the family, at onboarding)──▶ family
unset ──(sign-in on an additional device: the parent chooses)──▶ family | parent
family ⇄ parent       (parent area, behind the gate and PIN)
```

### 3.5 Content pack on the device

```text
absent → downloading → verifying (sha256) → installed(version)
installed(v1) → downloading(v2) → verifying → installed(v2)   (v1 deleted only after v2 is verified)
verifying fails → absent or installed(v1)   (retry with backoff)
```

---

## 4. Enumerations and content-defined types

| Type | Values | Defined in |
|---|---|---|
| `age_band` | `b4_6`, `b7_9`, `b10_12`, `b13_15` | Postgres enum + `kudi_content` |
| World | `money_choices` (4–6), `build_grow` (7–9), `founder_mode` (10–12), `side_hustle` (13–15) | World pack manifest |
| `pillar` | `know`, `understand`, `decide`, `invest`, `share` | Postgres enum + mission schema |
| Step kind | Content screen types `decision`, `resource_management`, `action_result`, `market_simulation`, `round_summary`; plus `activity` (Flag F2). The framing screens `mission_intro` and `reward` are engine-owned. | [mission-content.schema.json](./contracts/mission-content.schema.json) |
| Region | `gh`, `ng`, `uk` | [region-config.schema.json](./contracts/region-config.schema.json) |
| Band rules | One document per band | [band-rules.schema.json](./contracts/band-rules.schema.json) |

---

## 5. Device database (Drift)

Synced tables mirror §2 with the same columns: `parents` (own row only), `devices`,
`child_profiles`, `mission_attempts`, `wallet_events`, `child_badges`, `child_items`, and the
catalogue `missions` and `badges`. **The device has no `parent_secrets`.** The PIN hash is in
secure storage (R14).

Tables that exist only on the device:

| Table | Columns | Purpose |
|---|---|---|
| `outbox` | `id` (autoincrement), `entity`, `row_id`, `op` (`upsert`/`insert`), `payload` (JSON), `created_at`, `attempts`, `last_error` | Written in the same transaction as the change. Drained by the sync worker in order. |
| `sync_state` | `key` PK, `value` | `pull_cursor` (the last `server_seq`), `last_push_at`, `last_pull_at`, `protocol_version` |
| `installed_packs` | `pack_id` PK, `version`, `sha256`, `path`, `installed_at`, `size_bytes` | The content cache (§3.5) |
| `app_state` | `key` PK, `value` | `onboarding_step`, `active_child_id`, `device_mode`, `account_state` (`LOCAL_ONLY` / `ACTIVE`), `pin_lock_until`, `pin_failures`, `analytics_queue_enabled` |
| `analytics_queue` | As `analytics_events` | Filled **only** when the parent has opted in. Drained through `outbox`. |
| `crash_queue` | `id`, `payload`, `created_at` | Sent to `crash-report` |

**Local derived data**: the same folds as the §2.14 views, computed in Dart from the reactive
Drift streams. The coin balance shown on screen is **always** the fold of `wallet_events`, never
a cached number.

**Migrations**: versioned Drift schema (`schemaVersion` int, mapped to semver in `app_meta`).
Every migration has a test that upgrades a populated database from the previous stage's version,
so SC-013 holds (no progress lost on update).

---

## 6. Validation rules and the requirements they serve

| Rule | Where enforced | Serves |
|---|---|---|
| Nickname 2–16 characters, filtered, no email, phone or URL patterns | Device (input) + DB `CHECK` on length | FR-005, R31 |
| No personal data columns on child tables | Schema review + pgTAP column whitelist test | FR-005, FR-007f, Constitution V |
| Push only after consent | `sync_push` checks `parents.consented_at IS NOT NULL`; the client also gates | FR-007a |
| Never lose or duplicate rewards | `wallet_events` idempotent inserts; badge and item sets grow only; attempt status guard | FR-007d, SC-011 |
| Balance and savings never below zero | Engine and economy domain check before emitting `spend` / `save` / `unsave`; server check in `sync_push` on the folded balance | R10 |
| XP is never negative, rewards never removed | `CHECK (xp_delta >= 0)`; no client update or delete privileges | FR-027 |
| One daily challenge per child per day | Partial unique index | FR-011 |
| Age band must be released | `sync_push` + device band picker | FR-015b |
| 5 wrong OTP codes → lock | `otp_attempts` in `otp-verify` | FR-007g |
| 5 wrong PINs → cooling-off | Device `app_state` + `parent_secrets` | FR-037 |
| Analytics only when opted in | `sync_push` filter + device queue gate | FR-041, R19 |
| Inactive for 12 months → deleted, with warnings | `retention-sweep` + `retention_notices` | FR-007i, SC-015 |
| Content compatible with the app | `min_app_version` + `schema_version` checked before install | R28 |
