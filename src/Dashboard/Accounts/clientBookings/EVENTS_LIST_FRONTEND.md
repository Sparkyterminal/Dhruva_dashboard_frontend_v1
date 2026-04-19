# Events list API — Frontend contract (`GET /events`)

Base URL: **`GET ${API_BASE_URL}events`**

Example: `https://dk5h700gx5.execute-api.ap-south-1.amazonaws.com/api/events?page=1&limit=20`

This document focuses on the **list response**, especially **`totalsByStatus`** and how filters apply.

---

## Endpoint

`GET /events`

**Auth:** This route is **not** wrapped with `isAuth` in the current server (public list). If you add auth later, update this doc.

---

## Query parameters (list + aggregates)

| Name | Type | Required | Notes |
|---|---:|:---:|---|
| `page` | number | No | Default `1` when `limit` is set. |
| `limit` | number | No | If set, paginates `events` (clamped `1..500`). If omitted, all matching events are returned (use with care). |
| `status` or `eventConfirmation` | string | No | Filters **only the `events` array**: `confirmed` → `Confirmed Event`, `inprogress` → `InProgress`, `cancelled` / `canceled` → `Cancelled`. Invalid value → `400`. |
| `eventName` | string | No | ObjectId of event name **or** partial name (case-insensitive). |
| `startDate` | ISO date | No | Filters on `eventTypes` via `$elemMatch` on `startDate >= startDate`. |
| `endDate` | ISO date | No | `eventTypes.endDate <= endDate`. |
| `venue` / `venueLocation` | ObjectId | No | Sub-match on `eventTypes.venueLocation`. |
| `subVenue` / `subVenueLocation` | ObjectId | No | Sub-match on `eventTypes.subVenueLocation`. |

---

## Important: `totalsByStatus` vs list filter

- The **`events`** array uses **`query`** = `baseQuery` + optional **`status`** filter.
- **`totalsByStatus`** is computed from **`baseQuery` only** (same venue/date/name filters **without** `status`).

So when you call `?status=confirmed`, the list shows only confirmed rows, but **`totalsByStatus`** still describes **all** statuses that match the rest of the filters (dashboard-style totals).

---

## Response shape (high level)

```json
{
  "totalEvents": 84,
  "events": [],
  "summary": {
    "summaryScope": "allBookingsMatchingFilter",
    "totalBookings": 84,
    "bookingsInResponse": 20,
    "totalExpectedAdvance": 0,
    "totalReceivedAmount": 0,
    "totalPending": 0,
    "totalAdvanceEntries": 0,
    "totalPayableSum": 0
  },
  "totalsByStatus": {},
  "eventConfirmationFilter": "Confirmed Event",
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

- **`summary`** uses the **same filter as the list** (`query`): counts and money for the current page’s filter scope (see controller for exact fields).
- **`totalsByStatus`**: breakdown by lifecycle status using **payable** and **received** rules below, on **`baseQuery`** only.

Pagination fields appear only when `limit` is sent.

---

## Money rules (used in `totalsByStatus`)

Per **booking** (event document):

1. **Expected / payable amount (`_payable`)**  
   - If `advancePaymentType === 'complete'`: use **`eventTypes[0].totalPayable`** only.  
   - Else: sum **`eventTypes[].totalPayable`** across all types.  
   - Values are rounded to **whole rupees** before sums.

2. **Received amount (`_received`)**  
   - Sum of **`eventTypes[].advances[].receivedAmount`** across the booking (non-numeric treated as `0`).

Backend rounds monetary aggregates to whole rupees in JSON.

---

## `totalsByStatus` object

### `all`

Rollup over every booking matching **`baseQuery`** (not restricted by `status` query).

| Field | Type | Description |
|---|---|---|
| `totalExpectedAmount` | number | Sum of **payable** (`_payable`) for all matched bookings. |
| `totalBookingsNumber` | number | Count of all matched bookings. |
| `confirmedTotalExpectedAmount` | number | Sum of payable for **`Confirmed Event`** only (subset of `baseQuery`). |
| `confirmedTotalBookingsNumber` | number | Count of confirmed bookings. |
| `pendingTotalExpectedAmount` | number | Sum of payable for **`InProgress`** (treated as “pending” pipeline). |
| `pendingTotalBookingsNumber` | number | Count of in-progress bookings. |

### `confirmed`

Only bookings with **`eventConfirmation === 'Confirmed Event'`** (still within `baseQuery`).

| Field | Type | Description |
|---|---|---|
| `totalExpectedAmount` | number | Sum of payable for confirmed bookings. |
| `totalBookingsNumber` | number | Confirmed booking count. |
| `totalReceivedAmount` | number | Sum of **`_received`** on confirmed bookings. |
| `bookingsWithAnyReceiptCount` | number | Confirmed bookings where **total received &gt; 0** (at least some money received). |
| `totalBalanceAmount` | number | Sum of **(payable − received)** per confirmed booking. |
| `bookingsWithOutstandingBalanceCount` | number | Confirmed bookings where **payable ≠ received** (after rounding), i.e. not fully settled to the payable total. |

### `pending` and `inprogress`

Same object reference in the API: both describe **`InProgress`** bookings.

| Field | Type | Description |
|---|---|---|
| `totalBookingsNumber` | number | Count of **`InProgress`** bookings. |
| `totalExpectedAmount` | number | Sum of payable for **`InProgress`**. |

### `cancelled`

Bookings with **`eventConfirmation === 'Cancelled'`**.

| Field | Type | Description |
|---|---|---|
| `totalBookingsNumber` | number | Cancelled booking count. |
| `totalExpectedAmount` | number | Sum of payable for cancelled bookings. |

---

## Example `totalsByStatus`

```json
{
  "all": {
    "totalExpectedAmount": 171908236,
    "totalBookingsNumber": 84,
    "confirmedTotalExpectedAmount": 137406436,
    "confirmedTotalBookingsNumber": 68,
    "pendingTotalExpectedAmount": 25540000,
    "pendingTotalBookingsNumber": 7
  },
  "confirmed": {
    "totalExpectedAmount": 137406436,
    "totalBookingsNumber": 68,
    "totalReceivedAmount": 55013910,
    "bookingsWithAnyReceiptCount": 42,
    "totalBalanceAmount": 82392526,
    "bookingsWithOutstandingBalanceCount": 35
  },
  "pending": {
    "totalBookingsNumber": 7,
    "totalExpectedAmount": 25540000
  },
  "inprogress": {
    "totalBookingsNumber": 7,
    "totalExpectedAmount": 25540000
  },
  "cancelled": {
    "totalBookingsNumber": 9,
    "totalExpectedAmount": 8961800
  }
}
```

*(Example numbers are illustrative; `cancelled` counts depend on data.)*

---

## Related docs

- **`BALANCE_SHEET_FRONTEND.md`** — `GET /events/balance-sheet` (confirmed-only payable vs received).
