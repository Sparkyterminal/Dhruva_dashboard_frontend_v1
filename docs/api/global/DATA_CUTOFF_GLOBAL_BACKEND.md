# Global Data Visibility Cutoff — April 2026 onward

Share this with the backend team. It covers a **cross-cutting change**: the client
wants the dashboard to only show data from **April 2026 onward**, across every
list/report screen — bookings/events, leads, bills, daybook, expenses, budget
reports, requirements, calendars, leaderboard. Everything recorded before the
cutoff must be excluded from API responses. This is not a UI toggle — it must be
enforced **server-side**, since the frontend cannot be trusted as the boundary.

> **Update (2026-09-10):** the cutoff date is changing from `2026-03-01` to
> `2026-04-01`. Nothing else in this contract changes — same settings document,
> same login field, same endpoint list. Only the stored `value` needs updating
> (see section 1). No frontend code change is required either way: the frontend
> has no hardcoded cutoff date and simply reads whatever `dataCutoffDate` the
> backend returns on login (`src/utils/dataCutoff.js`).

This is a frontend-only repo; there is no shared backend contract file location,
so this doc follows the same format already used for feature-specific contracts
(e.g. `src/Dashboard/Accounts/clientBookings/CLIENT_BOOKINGS_ALL_TAB_ESTIMATED_BUDGET_BACKEND.md`)
but lives at `src/Dashboard/` root since it applies across every module.

---

## ⚠️ Correction needed — the filter must not depend on a query parameter

This was tested directly against the live API on 2026-09-09:

```
GET https://dk5h700gx5.execute-api.ap-south-1.amazonaws.com/api/events?page=1&limit=20&startDate=2026-03-01
```

The response was exactly right in shape: `events[]` contained only March-2026+
records, and `totalsByStatus.all.totalBookingsNumber` (164) matched the
filtered list count exactly, with `summary` and every `totalsByStatus` bucket
recomputed consistently off the restricted set. **The aggregation logic itself
is correct.**

**The bug:** this only happens because `startDate=2026-03-01` was explicitly
put in the URL. A plain `GET /events` — zero query params — still returns
every event ever created, pre-March-2026 included. That means what's live
today is the **pre-existing, optional, user-driven `startDate`/`endDate`
filter** (already documented in `CLIENT_BOOKINGS_VIEW_ONLY_FRONTEND.md`, used
by the Bookings Dashboard's own date-range picker), not the mandatory,
always-on cutoff this document asks for. Those are two different features:
the existing param is a user choice; this cutoff is a floor nobody — not even
a client that sends no parameters, or a direct API call from Postman/devtools
— can go beneath.

**Required fix:** apply the cutoff as an unconditional floor, merged with
whatever `startDate` the client optionally sends — never gated on the client
sending anything:

```js
const cutoff = await getDataCutoffDate();                    // e.g. "2026-03-01"
const clientStart = req.query.startDate ? new Date(req.query.startDate) : null;
const effectiveStart =
  clientStart && clientStart > new Date(cutoff) ? clientStart : new Date(cutoff);
// effectiveStart is NEVER earlier than the cutoff, regardless of req.query.startDate
// (including when req.query.startDate is absent entirely)
```

**Acceptance test that must pass:** a plain `GET /events` (no query params at
all) must return the **identical** `totalEvents`, `events[]` count, and
`totalsByStatus.all.totalBookingsNumber` that `GET /events?startDate=2026-03-01`
returns today. If a param-less request ever returns more rows than that, the
cutoff is not actually enforced yet.

This same correction applies to **every** endpoint in the table in section 3
below — none of them should need any query parameter for the cutoff to apply.

Also please confirm separately whether `POST /user/login` is already
returning `dataCutoffDate` (section 2) — that's a distinct piece from the
filter itself, and this test doesn't verify it.

---

## 1) Where the cutoff value lives

A single settings document, changeable **without a redeploy**:

```json
{ "key": "dataVisibilityCutoffDate", "value": "2026-04-01" }
```

Store it in whatever settings/config collection or table already exists for
app-wide config, or create a minimal one if none exists (one document is enough
for v1 — no need for a generic key/value settings system unless one already
exists).

- Read through a short in-memory cache (e.g. 60s TTL) so it isn't re-queried on
  every single list/report request.
- **Inclusive** semantics: a record dated exactly `2026-04-01` **is shown**.
  Filter rule everywhere is `recordDate >= cutoff`, matching "from April 2026
  onward."

---

## 2) How the frontend learns the cutoff

### Primary — `POST /user/login`

Add `dataCutoffDate` to the `data` object already returned on login, for
**every role** (no role gating):

```json
{
  "status": 200,
  "data": {
    "access_token": "...",
    "user_id": "...",
    "name": "Archana",
    "email_id": "archana@example.com",
    "role": "ACCOUNTS",
    "departments": [{ "id": "...", "name": "ACCOUNTS" }],
    "dataCutoffDate": "2026-04-01"
  }
}
```

The frontend already dispatches this entire object into its session state on
login, so no new endpoint is required for the common case — every role gets the
current cutoff automatically each time they sign in.

### Secondary (optional, not required for v1)

`GET /settings/data-cutoff` → `{ "cutoffDate": "2026-04-01" }`, authenticated,
any role. Lets a changed cutoff propagate to already-logged-in sessions without
forcing a re-login. A future admin-only `PUT` to change the value is the
intended long-term mechanism, but is out of scope here — just design the
settings document so that's possible later.

---

## 3) Endpoints that must apply the filter

Every list/report endpoint below must exclude records where the specified date
field is earlier than the cutoff. This table is the result of an audit of every
list-fetching call in the frontend.

| Endpoint | Filter field | Notes |
|---|---|---|
| `GET /events` | event / `eventTypes[].startDate` | Powers Client Bookings, Marketing "View Inflow", calendars |
| `GET /events/my-events` | same | |
| `GET /events/balance-sheet` | same | |
| `GET /events/leaderboard` | same | Aggregation must exclude pre-cutoff events **before** grouping/summing |
| `GET /client-leads` | lead `startDate` | Also feeds the embeddable Leads calendar |
| `GET /daybook` | daybook entry date | |
| `GET /expenses` | expense date | |
| `GET /spreadsheet-workbooks` (daily-expenses module) | business date (`date`/`from`/`to`) | |
| `GET /bills` | **open decision — see below** | Frontend currently sends no date param here at all |
| `GET /request/all` | `required_date` (see rationale below) | Same endpoint/rule for `RequirementsTableAc`, `AllRequirementsTable`, `RequirementTableApprover`, `CARequirementsTable` — no role branching |
| `GET /request/my-requests` | `required_date` | Same rule, single-user view |
| `GET /personal-calendar` | `startAt` | |

### Explicitly NOT filtered — catalog / master data

These are reference lists for dropdowns, not date-bound transactional records.
Applying the cutoff to these would break the UI (e.g. an old venue becoming
unselectable). Leave them untouched:

`event-names`, `venue`, `sub-venue-location`, `event-types`, `department/all`,
`vendor/all`.

### Open decision: `GET /bills`

No date filter exists on this endpoint today. Recommend filtering on `emiDate`
if that field exists on the bill record, otherwise the record's creation date.
Please confirm which field represents "when this bill belongs to" — flagging
this explicitly rather than guessing.

### Judgment call: Requirements use `required_date`, not `createdAt`

A requirement's meaningful business date is **when it's required**, not when
the request record was administratively entered into the system. Filtering on
`createdAt` would hide requirements that were logged late for an April-2026+
need, and show requirements entered in April for a need dated earlier. Use
`required_date` consistently across all four requirements screens.

---

## 4) Aggregates, summaries, and pagination

Every computed total must be calculated **after** the cutoff filter is applied,
not against the full unfiltered dataset:

- `totalsByStatus` (all buckets) on `GET /events`
- `summary.totalEstimatedBudget` / `totalConvertedBudget` on `GET /client-leads`
- Leaderboard sums on `GET /events/leaderboard`
- Running/period totals on `GET /daybook`
- `total` / `totalPages` pagination counts on every paginated endpoint above

### Erratum on `CLIENT_BOOKINGS_ALL_TAB_ESTIMATED_BUDGET_BACKEND.md`

That doc asked for `totalsByStatus.all.totalEstimatedBudget` to be sourced from
the leads collection **unfiltered by any `/events` query params** (venue,
eventName, date range). That instruction still stands for those params
specifically — but it does **not** mean unfiltered by this cutoff. Once the
cutoff exists, pre-cutoff leads must be excluded from that figure too, the same
as everywhere else. The two docs are not in conflict: "unfiltered" in that
doc refers only to `/events`' own filters, never to this global cutoff.

---

## 5) Example — `GET /events`

### Before (cutoff not applied)

```json
{
  "totalEvents": 192,
  "events": [
    { "_id": "a1", "eventTypes": [{ "startDate": "2025-11-10" }] },
    { "_id": "a2", "eventTypes": [{ "startDate": "2026-04-02" }] }
  ],
  "totalsByStatus": { "all": { "totalExpectedAmount": 263993734, "totalBookingsNumber": 192 } }
}
```

### After (cutoff = 2026-04-01 applied)

```json
{
  "totalEvents": 177,
  "events": [
    { "_id": "a2", "eventTypes": [{ "startDate": "2026-04-02" }] }
  ],
  "totalsByStatus": { "all": { "totalExpectedAmount": 250800000, "totalBookingsNumber": 177 } }
}
```

`a1` (dated before the cutoff) disappears from both the list and every
aggregate/count. (Figures above are illustrative only — the point is that
`a2`, dated 2026-04-02, still clears an April-2026 cutoff; a record dated
e.g. 2026-03-15 would now also be excluded, unlike under the old March cutoff.)

---

## 6) Implementation sketch

```js
// Shared helper, read once per request (cached)
async function getDataCutoffDate() {
  const cached = cutoffCache.get("dataVisibilityCutoffDate");
  if (cached) return cached;
  const doc = await Settings.findOne({ key: "dataVisibilityCutoffDate" });
  const value = doc?.value ?? null;
  cutoffCache.set("dataVisibilityCutoffDate", value, 60 /* seconds */);
  return value;
}

// Applied inside each list/report query, e.g. GET /events — note this does
// NOT depend on req.query.startDate being present. It always applies the
// cutoff, and only raises the floor higher if the client also asked for a
// later start date.
const cutoff = await getDataCutoffDate();
const clientStart = req.query.startDate ? new Date(req.query.startDate) : null;
const effectiveStart =
  cutoff && (!clientStart || clientStart < new Date(cutoff))
    ? new Date(cutoff)
    : clientStart;
const dateFilter = effectiveStart
  ? { "eventTypes.startDate": { $gte: effectiveStart } }
  : {};
const events = await Event.find({ ...existingFilters, ...dateFilter });
// ...then compute totalsByStatus / pagination from this already-filtered set
```

```js
// POST /user/login
const cutoff = await getDataCutoffDate();
return res.status(200).json({
  data: {
    ...existingLoginData,
    dataCutoffDate: cutoff,
  },
});
```

---

## Non-breaking

- Purely a read-side filter — no records are deleted. Disabling the cutoff
  (clearing the settings value) restores full visibility instantly.
- Additive field on the login response — existing clients that ignore
  `dataCutoffDate` are unaffected.
- Catalog/reference endpoints are explicitly untouched.

---

## Acceptance checklist for backend

- [ ] Settings document created and seeded with `2026-04-01`
- [ ] `POST /user/login` returns `data.dataCutoffDate` for every role
- [ ] **A plain `GET /events` with zero query params returns the same `totalEvents` / `events[]` count / `totalsByStatus.all.totalBookingsNumber` as `GET /events?startDate=2026-03-01` does today** — this is the specific bug found on 2026-09-09 (filter currently only applies when the client happens to pass `startDate`)
- [ ] Same param-less test repeated for every other endpoint in the table below — none should require any query parameter for the cutoff to apply
- [ ] `GET /events` (+ `/my-events`, `/balance-sheet`, `/leaderboard`) filter on event/`eventTypes` date
- [ ] `GET /client-leads` filters on lead `startDate`
- [ ] `GET /daybook` filters on daybook entry date
- [ ] `GET /expenses` filters on expense date
- [ ] `GET /spreadsheet-workbooks` (daily-expenses) filters on business date
- [ ] `GET /bills` date field confirmed with product/frontend, then filtered
- [ ] `GET /request/all` and `GET /request/my-requests` filter on `required_date` (not `createdAt`), identically across all four requirements screens
- [ ] `GET /personal-calendar` filters on `startAt`
- [ ] Catalog endpoints (`event-names`, `venue`, `sub-venue-location`, `event-types`, `department/all`, `vendor/all`) remain unfiltered
- [ ] All aggregates/summaries/totals and pagination counts (`total`, `totalPages`) are computed from the already-filtered set
- [ ] `totalsByStatus.all.totalEstimatedBudget` (per the existing budget doc) also respects this cutoff
- [ ] Changing the settings value takes effect within the cache TTL, with no redeploy
