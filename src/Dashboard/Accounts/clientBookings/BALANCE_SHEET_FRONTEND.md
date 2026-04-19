# Balance Sheet API (Frontend Contract)

This document defines the API contract for the confirmed-events balance sheet.

Base URL: `${API_BASE_URL}events`

---

## Endpoint

`GET /events/balance-sheet`

- Auth: required (`Authorization` header with JWT token)
- Scope: only bookings where `eventConfirmation = "Confirmed Event"`

---

## Query Parameters

| Name | Type | Required | Example | Notes |
|---|---|---|---|---|
| `page` | number | No | `1` | Default `1`, minimum `1` |
| `limit` | number | No | `20` | Default `20`, clamped to `1..500` |
| `startDate` | string (ISO date) | No | `2026-04-01` | At least one **event type** on the booking must have **`eventTypes.startDate` ≥ query `startDate`** (parsed with `new Date(...)`). |
| `endDate` | string (ISO date) | No | `2026-04-30` | In the same `$elemMatch`, **`eventTypes.endDate` ≤ query `endDate`**. Pass both for a window; either can be omitted. |
| `search` | string | No | `rahul` | Text search on `clientName`, `brideName`, `groomName`, `contactNumber`, `altContactNumber`, `altContactName`, `note`, and event name |
| `eventName` | string | No | `Haldi` or `67fabc...` | Supports event name text (case-insensitive) or EventName `_id` |
| `venue` / `venueLocation` | string (ObjectId) | No | `67fab...` | Venue filter |
| `subVenue` / `subVenueLocation` | string (ObjectId) | No | `67fac...` | Sub-venue filter |

### Date filter detail

When **`startDate`** and/or **`endDate`** are present, the server applies a single **`eventTypes` `$elemMatch`**: one sub-document must meet all of the conditions you pass (dates and/or venue). Same behaviour as **`GET /api/events`**.

If the query string includes **`startDate`** but the value cannot be parsed as a date → **`400`**. Same for **`endDate`**. If both are valid and **`startDate > endDate`** → **`400`**.

---

## Formula

- `payableAmount` = booking payable total (same logic as existing events APIs)
- `receivedAmount` = sum of all `eventTypes[].advances[].receivedAmount`
- `balanceAmount` = `payableAmount - receivedAmount`

The same formula is used in row-level data and top-level summary.

---

## Success Response (`200`)

```json
{
  "scope": "confirmedEventsOnly",
  "totalEvents": 57,
  "summary": {
    "totalPayableAmount": 1850000,
    "totalReceivedAmount": 970000,
    "totalBalanceAmount": 880000
  },
  "events": [
    {
      "_id": "67f2d0d9d0a9c5f97d0cc001",
      "clientName": "Rahul Sharma",
      "eventName": {
        "_id": "67f1f2c2100adbb6f35ab001",
        "name": "Wedding"
      },
      "eventConfirmation": "Confirmed Event",
      "advancePaymentType": "separate",
      "payableAmount": 250000,
      "receivedAmount": 90000,
      "balanceAmount": 160000
    }
  ],
  "bookingsInResponse": 20,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

---

## Empty Result Response (`200`)

```json
{
  "scope": "confirmedEventsOnly",
  "totalEvents": 0,
  "summary": {
    "totalPayableAmount": 0,
    "totalReceivedAmount": 0,
    "totalBalanceAmount": 0
  },
  "events": [],
  "bookingsInResponse": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

---

## Validation Errors

- `400 Bad Request`
  - `Invalid startDate` / `Invalid endDate`
  - `startDate must be <= endDate`
  - `Invalid venue id`
  - `Invalid subVenue id`

---

## Example Requests

- First page (default pagination):
  - `GET /events/balance-sheet`
- Pagination + **event type date window** (same pattern as your deployed API):
  - `GET https://dk5h700gx5.execute-api.ap-south-1.amazonaws.com/api/events/balance-sheet?page=1&limit=20&startDate=2026-04-01&endDate=2026-04-30`
  - Relative: `GET /events/balance-sheet?page=1&limit=20&startDate=2026-04-01&endDate=2026-04-30`
- With explicit pagination only:
  - `GET /events/balance-sheet?page=2&limit=50`
- Search + date range:
  - `GET /events/balance-sheet?search=rahul&startDate=2026-04-01&endDate=2026-04-30`
- Event name filter + venue:
  - `GET /events/balance-sheet?eventName=Wedding&venue=67fabcd1234567890abcd123`

