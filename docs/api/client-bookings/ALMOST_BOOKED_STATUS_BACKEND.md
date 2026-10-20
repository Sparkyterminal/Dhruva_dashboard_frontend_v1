# New booking status: "Almost Booked" — backend requirements

Audience: backend team. Frontend is already implemented and ships behind no flag; it degrades
gracefully (shows 0 / empty) until the backend changes below are live. Everything marked
**MUST** is needed for the feature to work end to end.

## 1. What is being added

A fourth value for the booking status field `eventConfirmation` on an **event** (booking):

| Meaning            | Stored value (`eventConfirmation`) | `status` query key (`GET /events?status=`) | `totalsByStatus` key |
| ------------------ | ---------------------------------- | ------------------------------------------ | -------------------- |
| In progress        | `InProgress`                       | `inprogress`                               | `inprogress`         |
| **Almost booked**  | **`Almost Booked`**                | **`almostbooked`**                         | **`almostbooked`**   |
| Confirmed          | `Confirmed Event`                  | `confirmed`                                | `confirmed`          |
| Cancelled          | `Cancelled`                        | `cancelled`                                | `cancelled`          |

Pipeline order is: InProgress → **Almost Booked** → Confirmed Event (Cancelled can happen from any stage).

> The stored value is exactly `Almost Booked` (capital A and B, one space). The frontend sends and
> compares this exact string. Please do not change the casing or spelling without telling us.

Almost Booked is an **open pipeline** status (like InProgress), not a confirmed booking: it is
counted in pipeline totals, is not counted as confirmed business, and gets the same meeting-date
treatment as InProgress.

## 2. Where the frontend uses it

| Screen | What changed |
| ------ | ------------ |
| New Event Booking / Edit Event Booking | "Almost Booked" added to the status select, between InProgress and Confirmed Event. Shows "Next Meeting Date" (same as InProgress). Advances are **not mandatory** (same as InProgress). |
| Bookings Dashboard → List View (Accounts / Owner / Approver / CA) | New status button **Almost booked** with a count; new stats; "Next meeting" column; Excel/PDF/Word exports include it. |
| Bookings Dashboard (Marketing) | New status button **Almost booked** (Mine / All scope). |
| In progress / Almost booked / Cancelled calendar | Shows Almost Booked events (blue) and their meeting dates. |
| Leaderboard → Most Booked | New "Almost booked" count per user. |
| Budget report (Excel) | Almost Booked events can have a budget workbook, same as InProgress. |
| Daybook inflow / Add requirement | The event picker lists Almost Booked events. |

## 3. Required backend changes

### 3.1 Schema / validation — MUST

* Add `"Almost Booked"` to the allowed values of `eventConfirmation` on the event model
  (enum / validator / Joi / Zod / DTO — wherever it is enforced).
* Accept it on:
  * `POST /events` (create booking)
  * `PUT` / `PATCH /events/:id` (edit booking)
* Existing documents need **no migration**: nothing changes for existing statuses.
* Status transitions: allow any transition to and from `Almost Booked` (including back to
  `InProgress`, forward to `Confirmed Event`, and to `Cancelled`).
* Validation rules that currently branch on `InProgress` must treat `Almost Booked` the same way:
  * `meetingDate` is allowed/optional (frontend shows the field for InProgress **and** Almost Booked).
  * Advances are optional (the frontend only makes advances mandatory for Confirmed Event and
    Cancelled). If the backend currently requires advances for "anything not InProgress", change
    that rule to "anything not InProgress and not Almost Booked".
* Error message for an unknown status should list the four allowed values.

### 3.2 `GET /events` — MUST

* `status=almostbooked` returns only events whose `eventConfirmation` is `Almost Booked`.
  Works together with all existing filters (`eventName`, `venueId` / `venueLocation`,
  `startDate`, `endDate`, `page`, `limit`) exactly like the other status keys.
* No `status` (the "All" tab) keeps returning **all four** statuses.
* `GET /events/my-events` (Marketing, "Mine" scope) must accept the same `status=almostbooked`.
* The data-visibility cutoff (`startDate` floor) applies as for the other statuses.

### 3.3 `totalsByStatus` on `GET /events` — MUST

`totalsByStatus` is built from the base query and ignores the list `status` filter (as today).
Add a bucket for the new status with the **same shape as the `inprogress` bucket**:

```json
"totalsByStatus": {
  "all":          { "...existing fields...": 0 },
  "confirmed":    { "...existing fields...": 0 },
  "inprogress":   { "totalBookingsNumber": 12, "totalExpectedAmount": 4800000 },
  "almostbooked": { "totalBookingsNumber": 5,  "totalExpectedAmount": 2750000 },
  "cancelled":    { "...existing fields...": 0 }
}
```

`almostbooked.totalExpectedAmount` is computed the same way as `inprogress.totalExpectedAmount`.

### 3.4 `totalsByStatus.all` rollup — MUST

Add two fields next to the existing `pendingTotal*` ones:

| New field                          | Meaning |
| ---------------------------------- | ------- |
| `almostBookedTotalExpectedAmount`  | Sum of expected amounts of Almost Booked events |
| `almostBookedTotalBookingsNumber`  | Count of Almost Booked events |

**Important — avoid double counting.** Today `pendingTotalExpectedAmount` /
`pendingTotalBookingsNumber` are documented as "events still in the pipeline (not cancelled)".
After this change they must mean **InProgress only**; Almost Booked is reported separately in the
two new fields. The frontend computes:

```
All tab → "Total expected" = confirmedTotalExpectedAmount
                           + pendingTotalExpectedAmount        (InProgress only)
                           + almostBookedTotalExpectedAmount
```

If the backend cannot make `pending*` InProgress-only, tell us and we will subtract instead — but
one of the two must be chosen explicitly. `totalBookingsNumber` on the `all` bucket must include
all four statuses. If `grandTotalExpectedAmount` (bookings + leads pipeline) is returned, it must
include Almost Booked.

### 3.5 `GET /events/my-events` summary — SHOULD

The Marketing "Mine" summary cards (`summary.totalBookings`, `totalAgreedAmount`,
`totalReceivedAmount`, `totalPendingAdvance` …) must include Almost Booked events when the filter
is "all statuses" and exclude them when another status is selected, consistent with how the other
statuses behave.

### 3.6 `GET /events/leaderboard` (mode `mostBooked`) — SHOULD

Each row currently returns per-status counts. Add one:

```json
{ "user": { "...": "..." }, "inProgress": 3, "almostBooked": 2, "confirmed": 8, "cancelled": 1, "total": 14 }
```

* `total` must include Almost Booked.
* Property name is exactly `almostBooked` (camelCase, like `inProgress`).
* Mode `mostAmount` is **unchanged** (it only counts confirmed events).
* Rows without the field are treated as 0 by the frontend.

### 3.7 `GET /events/balance-sheet` — no change

Balance sheet stays confirmed-only. Almost Booked events must **not** appear there.

### 3.8 Budget report Excel — MUST (if you want the workbook for these events)

The budget-report endpoints currently allow only `Confirmed Event` and `InProgress` events
(`GET/PUT /budget-report/...` workbook by event id, and the "eligible events" listing that the
frontend builds from `GET /events?status=confirmed` and `status=inprogress`). Please also allow
`Almost Booked`. The frontend now additionally calls `GET /events?status=almostbooked` for the
"Add budget report" event picker; if that call fails it is ignored, so nothing breaks before you ship.

### 3.9 Other readers of `eventConfirmation` — please check

Search the backend for every place that compares against the literal strings `"InProgress"`,
`"Confirmed Event"` or `"Cancelled"` (reports, cron jobs, notifications, dashboards, exports) and
decide for each whether Almost Booked belongs with InProgress (usual answer) or on its own.
Frontend consumers that read the status string, for reference:

* Daybook inflow modal and "Add requirement" event dropdowns build a label like
  `<statusKey>-<eventName>-<client>`; Almost Booked events are labelled `almostbooked-…`.
* Calendars read `eventConfirmation` and `meetingDate` from `GET /events`.

## 4. Responses the frontend relies on (unchanged shapes)

* Event documents keep the same fields; only the `eventConfirmation` value set grows.
* List responses keep `events`, `page`, `limit`, `totalEvents`, `totalPages`, `totalsByStatus`.

## 5. Backward compatibility / rollout

* The frontend can be deployed **before** the backend: missing `almostbooked` bucket → count and
  totals show `0`; the calendar and budget-report fetches for `almostbooked` swallow errors.
  Creating a booking with the new status will, however, fail validation until §3.1 is live —
  so ship §3.1 first.
* Suggested order: 3.1 → 3.2 → 3.3/3.4 → 3.6 → 3.8 → 3.5 → 3.9.

## 6. Acceptance tests

1. `POST /events` with `eventConfirmation: "Almost Booked"` and **no advances** → 201.
2. Same with `meetingDate` set → 201 and the date is returned.
3. `PATCH /events/:id` changes InProgress → Almost Booked → Confirmed Event → each succeeds.
4. `POST /events` with `eventConfirmation: "Almost booked"` (wrong case) → 400 listing the four valid values.
5. `GET /events?status=almostbooked` returns only Almost Booked events; `totalEvents` matches.
6. `GET /events?status=almostbooked&eventName=Wedding&startDate=2026-08-01&endDate=2026-08-31` filters correctly.
7. `GET /events` (no status) → `totalsByStatus.almostbooked` and the two `almostBooked*` fields on `all` are present; `all.totalBookingsNumber` = sum of the four statuses.
8. `pendingTotal*` no longer includes Almost Booked events (§3.4).
9. `GET /events/leaderboard?mode=mostBooked` rows contain `almostBooked` and `total` includes it.
10. `GET /events/balance-sheet` does not return Almost Booked events.
11. Budget report workbook can be created and saved for an Almost Booked event.
12. Existing InProgress / Confirmed / Cancelled behaviour is unchanged (regression).

## 7. Decisions made on the frontend (please confirm or correct)

1. Almost Booked behaves like InProgress for the form: shows a meeting date, advances optional.
2. "Total expected" on the All tab = Confirmed + InProgress + Almost Booked business.
3. Almost Booked events are eligible for the budget report Excel.
4. Almost Booked is excluded from the Balance Sheet and from the "Most amount booked" leaderboard.
