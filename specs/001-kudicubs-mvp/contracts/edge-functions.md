# Contract: Edge Functions (API v1)

**Base**: `https://<project>.supabase.co/functions/v1/`

**Format**: JSON in and out. Every response carries `X-KC-API-Version: 1.x.y` (R28).

**Auth column**:

| Value | Meaning |
|---|---|
| `parent` | Requires the parent's access token |
| `anon` | Public anon key only |
| `service` | Called by `pg_cron` or the admin with the service role |

The functions are written in TypeScript (Deno) and tested with `deno test` (R26).

| Function | Auth | Purpose | Spec |
|---|---|---|---|
| `otp-verify` | anon | Verify the emailed code, enforce the lockout, create the family account, record consent | FR-007, FR-007a, FR-007c, FR-007g |
| `pin-set` | parent (recent) | Set or reset the parent PIN | FR-006, FR-037 |
| `pin-verify` | parent | Verify the PIN on a new device | FR-007c, FR-037 |
| `family-export` | parent | Download the family's data | FR-007e |
| `family-delete` | parent | Permanently delete the family | FR-007e |
| `retention-sweep` | service | Warn, then delete inactive families | FR-007i, SC-015 |
| `crash-report` | anon | Anonymous crash intake | R20 |

Sending the code is **not** a custom function. The client calls Supabase Auth
`signInWithOtp({ email, shouldCreateUser: true })`. The OTP length is 6 digits, expiry is
600 s, and the email template shows the code only (R13).

---

## `POST /otp-verify`

### Request

```json
{
  "email": "parent@example.com",
  "code": "482913",
  "privacyNoticeVersion": "1.0.0",
  "device": { "id": "uuid", "platform": "android", "appVersion": "1.0.0", "mode": "family" }
}
```

`device.mode` is `family` or `parent`. It is required when the account already exists (a sign-in
on an additional device, FR-007h). It is ignored for a new account, where the first device is
`family`.

### Steps

1. **Check the lockout.** If `otp_attempts[sha256(pepper‖lower(email))].locked_until > now()`,
   return `429`.
2. **Verify the code** by calling Auth verify (`type: "email"`).
   - On failure: `failures += 1`. If that makes 5 within the window, set
     `locked_until = now() + 15 min`. Return `401`.
3. **On success**:
   - Reset the attempt counter.
   - If there's no `parents` row, insert one, with `consented_at = now()` and
     `privacy_notice_version`, and insert a `consent_records` row (`privacy_notice`,
     `method = email_otp`). **This is the consent event** (FR-007a).
   - Upsert the `devices` row.
   - Set `last_active_at = now()`.

### Response `200`

```json
{
  "session": { "access_token": "…", "refresh_token": "…", "expires_in": 3600 },
  "parent": { "isNew": true, "consentedAt": "2026-11-14T09:00:00Z", "hasPin": false, "regionCode": "gh" }
}
```

### Errors

| Status | Body | When |
|---|---|---|
| `401` | `{ "code": "invalid_code", "remainingAttempts": 3 }` | Wrong code |
| `410` | `{ "code": "code_expired" }` | Code expired |
| `429` | `{ "code": "locked", "lockedUntil": "…" }` | Locked out |

---

## `POST /pin-set`

- **Auth**: parent. A **reset** needs a session authenticated within the last 10 minutes,
  based on the token's `iat` or `amr` claim (R14).
- **Request**: `{ "pin": "4831" }`. The PIN must be exactly 4 digits. `0000`, `1234` and all
  repeated digits are rejected with `400 { "code": "weak_pin" }`.
- **Effect**: stores a new salt and hash in `parent_secrets` and resets the failure counter and
  lock. Returns `204`.
- The device then stores its own local hash (R14). The PIN is never logged.

---

## `POST /pin-verify`

- **Auth**: parent.
- **Request**: `{ "pin": "4831" }`.

### Responses

| Status | Body | When |
|---|---|---|
| `200` | `{ "ok": true }` | Correct PIN |
| `401` | `{ "ok": false, "remainingAttempts": 2 }` | Wrong PIN |
| `429` | `{ "code": "locked", "lockedUntil": "…" }` | Locked out |

The cooling-off schedule after 5 failures is 1, then 5, then 15 minutes (FR-037).

---

## `GET /family-export`

- **Auth**: parent.
- **Response**: `200 application/json` with
  `Content-Disposition: attachment; filename="kudicubs-family-export-YYYY-MM-DD.json"`.

```json
{
  "exportVersion": "1.0.0",
  "exportedAt": "…",
  "family": { "email": "…", "region": "gh", "createdAt": "…", "consents": [ … ], "devices": [ … ] },
  "children": [
    { "nickname": "…", "avatarId": "…", "ageBand": "b4_6",
      "balances": { "coins": 12, "savings": 30, "xp": 140 },
      "badges": [ … ], "items": [ … ], "missionAttempts": [ … ], "walletEvents": [ … ] }
  ]
}
```

The export never includes PIN data, OTP data, crash reports or analytics. Analytics are listed
only as a count, with a statement that they are kept for at most 12 months.

---

## `POST /family-delete`

- **Auth**: parent. The app reaches this only after the gate, the PIN and a typed or held
  confirmation (FR-007e).
- **Request**: `{ "confirm": "DELETE" }`.
- **Effect**:
  1. Delete the `auth.users` row through the admin API. All family tables cascade.
  2. Send the deletion confirmation email.
- **Response**: `202`. The device wipes its local data and returns to onboarding.

---

## `POST /retention-sweep`

- **Auth**: service. Runs daily at 02:00 UTC from `pg_cron`.

### Logic (FR-007i)

| Condition | Action |
|---|---|
| `last_active_at < now() − 335 days` and no `warn_30` notice | Send the 30-day warning; insert `warn_30` |
| `last_active_at < now() − 358 days` and no `warn_7` notice | Send the 7-day warning; insert `warn_7` |
| `last_active_at < now() − 365 days` **and** both notices sent at least 7 days ago | Same as `family-delete` |
| `last_active_at` newer than a notice | Delete that family's `retention_notices` (the clock was reset) |

Analytics events and crash reports older than 12 months are also deleted.

- **Response**: `200 { "warned30": n, "warned7": n, "deleted": n }`.

---

## `POST /crash-report`

- **Auth**: anon. Rate-limited per IP to 20 requests per hour. The IP is not stored.
- **Request**:

```json
{
  "appVersion": "1.0.0",
  "platform": "android",
  "osVersion": "13",
  "deviceClass": "low_ram",
  "stack": "…",
  "occurredAt": "…"
}
```

`deviceClass` is `low_ram`, `phone` or `tablet`. `stack` is at most 16 KB.

- **The request contains no ids of any kind.** The function strips anything that looks like an
  email or UUID from `stack` before storing it.
- **Response**: `202`.
