# GET Daybook API — Frontend contract (inflow by `receivedDate`)

This document describes **`GET /daybook`** only: query parameters, how **inflow** is built from **received dates**, and the JSON response shape.

Full daybook CRUD (inflows, accounts open/close, etc.) is still summarized in `Routes/daybook/FRONTEND.md`.

Base URL: **`GET ${API_BASE_URL}daybook`**

Example host (dev): `https://dk5h700gx5.execute-api.ap-south-1.amazonaws.com/api/daybook`

---

## Authentication

- Header: **`Authorization`** — JWT (same as other protected routes).

---

## Endpoint

`GET /daybook`

---

## Query parameters

| Name | Type | Required | Example | Notes |
|---|---:|:---:|---|---|
| `startDate` | `YYYY-MM-DD` | Yes* | `2026-04-17` | Inclusive start (UTC calendar day used for event advances). |
| `endDate` | `YYYY-MM-DD` | Yes* | `2026-04-20` | Inclusive end. |
| `date` | `YYYY-MM-DD` | Yes* | `2026-04-17` | Shorthand: if `startDate` / `endDate` omitted, `date` can supply both ends (same day when only `date` is used as in code: both `start` and `end` fall back to `date`). Prefer explicit `startDate` + `endDate` for ranges. |
| `limit` | number | No | `200` | Max rows returned in **`inflow.data`** and **`outflow.data`**. Clamped server-side (default 200, max 1000). |
| `includeEventAdvances` | string | No | `true` | Default **`true`**. Accepts `false`, `0`, `no` (case-insensitive) to **disable** merging booking advances into `inflow`. |

\*The API returns `400` if the resolved start/end are missing or not `YYYY-MM-DD`, or if `startDate > endDate`.

---

## How `inflow` is built (received date)

When **`includeEventAdvances`** is **true** (default):

1. **Manual inflows** (`DaybookInflow` collection)  
   - Included if **`receivedDate`** (string `YYYY-MM-DD`) satisfies:  
     `startDate <= receivedDate <= endDate` (string range).

2. **Event booking advances** (`Event` → `eventTypes[].advances[]`)  
   - Included if **`advances.receivedDate`** (Date) is inside:  
     `[startDate 00:00:00.000Z, endDate 23:59:59.999Z]`  
   - And **`advances.receivedAmount > 0`**.

3. **Merge & sort**  
   - Both sources are mapped to the **same row shape** (below).  
   - Sorted by **`receivedDate`** descending (newest first).  
   - Then **truncated** to **`limit`** rows in **`inflow.data`**.

4. **Totals**  
   - **`inflow.total`**: sum of `amountReceived` from manual rows **plus** sum of `receivedAmount` from matched advances.  
   - **`inflow.count`**: count of all matching manual rows **plus** all matching advances (not limited by `limit`).  
   - **`profitAndLoss.value`**: `inflow.total - outflow.total` (unchanged rule).

When **`includeEventAdvances`** is **false**: only manual inflows are used for `inflow` (same as older behavior).

---

## `inflow.data` row shape (unified)

Each element:

| Field | Type | Notes |
|---|---|---|
| `_id` | string | Manual rows: MongoDB id string. **Event advances:** synthetic id `eventadvance:<eventId>:<eventTypeIndex>:<advanceIndex>` — **not** an ObjectId; do not call delete/update inflow APIs with this id. |
| `name` | string | Manual: payer name. Event: `clientName` (or `"Client"`). |
| `receivedDate` | string | Always `YYYY-MM-DD` (UTC date derived from stored value). |
| `receivedIn` | `"CASH"` \| `"ACCOUNT"` | Manual: as stored. Event: from `modeOfPayment` (`account` → `ACCOUNT`, else `CASH`). |
| `accountName` | string \| null | Manual: set when `receivedIn === "ACCOUNT"`. Event: currently `null`. |
| `amountReceived` | number | Manual: `amountReceived`. Event: `receivedAmount`. |
| `receivedBy` | string | Manual: `receivedBy`. Event: `collectedBy` / `givenBy` joined when present. |
| `eventReference` | string \| null | Manual: optional linked event id. Event: **booking** `_id`. |
| `note` | string | Manual: note text. Event: e.g. `Advance — <event name> / <event type name>`. |

---

## Example requests

Single day (manual + advances on that UTC day):

```http
GET /api/daybook?startDate=2026-04-17&endDate=2026-04-17
Authorization: <jwt>
```

Range:

```http
GET /api/daybook?startDate=2026-04-16&endDate=2026-04-20&limit=100
Authorization: <jwt>
```

Manual inflows only (no booking advances in `inflow`):

```http
GET /api/daybook?startDate=2026-04-17&endDate=2026-04-17&includeEventAdvances=false
Authorization: <jwt>
```

---

## Example response (shape)

```json
{
  "inflow": {
    "count": 12,
    "total": 450000,
    "data": [
      {
        "_id": "674a...",
        "name": "Rahul",
        "receivedDate": "2026-04-17",
        "receivedIn": "CASH",
        "accountName": null,
        "amountReceived": 5000,
        "receivedBy": "ACCOUNTS",
        "eventReference": null,
        "note": ""
      },
      {
        "_id": "eventadvance:674b...:0:1",
        "name": "Priya & Arjun",
        "receivedDate": "2026-04-17",
        "receivedIn": "ACCOUNT",
        "accountName": null,
        "amountReceived": 25000,
        "receivedBy": "Coordinator A",
        "eventReference": "674b...",
        "note": "Advance — Wedding / Reception"
      }
    ]
  },
  "outflow": {
    "count": 3,
    "total": 12000,
    "data": []
  },
  "profitAndLoss": {
    "value": 438000,
    "type": "PROFIT"
  },
  "accounts": {
    "openCloseBalances": [
      {
        "_id": "...",
        "balanceDate": "2026-04-17",
        "cashOpeningBalance": 10000,
        "cashClosingBalance": 8500,
        "accountBalances": [],
        "accountOpeningBalance": 200000,
        "accountClosingBalance": 204000
      }
    ]
  }
}
```

---

## Error responses (typical)

| Status | When |
|---:|---|
| `400` | Missing/invalid dates, invalid `startDate > endDate`. |
| `401` | Missing/invalid `Authorization`. |
| `403` / unauthorized role | Token role not allowed for daybook (server uses finance-related roles). |

---

## Related

- **`Routes/daybook/FRONTEND.md`** — full daybook module (inflow CRUD, accounts open/close, schemas).
