# CA Bulk Approve / Reject — Backend Notes

**Screen:** CA home → Dashboard tab (`src/Dashboard/CA/CARequirementsTable.jsx`, `src/Dashboard/CA/bulk/`)
**Endpoint used today:** `PATCH /request/:id`

## Status: no backend change is required for the current version

The CA can now tick several pending requirements (or "Select all pending"), press **Approve** or **Reject**, and confirm once in a dialog. There is no bulk endpoint, so the frontend sends **one `PATCH /request/:id` per selected requirement, 4 at a time**, with the same body the old per-row buttons used:

```json
{ "ca_check": "APPROVED", "ca_approved": true }
{ "ca_check": "REJECTED", "ca_approved": false }
```

Each request succeeds or fails on its own. Failures are listed in the dialog and can be retried; the ones that succeeded stay done.

## Optional improvement: one bulk call

For long lists (dozens of requirements) a single request would be faster and all-or-nothing safe.

```http
PATCH /request/ca-check/bulk
Authorization: <jwt>

{ "ids": ["674a…", "674b…"], "ca_check": "APPROVED" }      // or "REJECTED"
```

Response:

```json
{ "updated": ["674a…"], "failed": [{ "id": "674b…", "message": "Not found" }] }
```

Rules to keep identical to `PATCH /request/:id`:
- Allowed for the CA role (and any role that can set `ca_check` today).
- `ca_check` must be `APPROVED` or `REJECTED`; set `ca_approved` to `true` / `false` to match.
- Only requirements whose `ca_check` is currently `PENDING` should change; skip the rest and list them in `failed`.
- Cap `ids` (for example 200) and return `400` above the cap.
- Return a per-id result, never fail the whole call because one id is bad.

If this is built, the frontend can switch `runBulkCaCheck` in `src/Dashboard/CA/bulk/bulkCaCheck.js` to a single call with no UI change.
