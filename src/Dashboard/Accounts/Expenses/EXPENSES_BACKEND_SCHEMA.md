# Daily Expenses API — Backend Schema & Contract

This document describes the REST API and database shape expected by the **Daily Expenses** screen in the Dhruva dashboard frontend.

**Frontend location:** `src/Dashboard/Accounts/Expenses/`  
**Route:** `/user/expenses` (Accounts, Owner, Approver, CA — same roles that have Daybook)  
**Entry point:** **Expenses** button on the Daybook header (`/user/daybook`)

---

## Overview

Users pick a **business date** (default: today) and edit an Excel-like grid of expense lines. The UI uses **AG Grid Community** (client-side, no third-party API quota). Persistence is your backend **`expenses`** API. Until the API exists, the frontend falls back to **browser localStorage** per user + date.

---

## Authentication

Same as other dashboard APIs:

```http
Authorization: <access_token from login>
```

Only authenticated users with Daybook access should call these endpoints.

---

## Endpoints

Base URL: `${API_BASE_URL}` (same prefix as `daybook`, `request`, etc.)

### 1. Get expenses for a date

```http
GET /expenses?date=YYYY-MM-DD
```

**Query parameters**

| Name   | Type   | Required | Description                          |
|--------|--------|----------|--------------------------------------|
| `date` | string | Yes      | Business date in `YYYY-MM-DD` format |

**Success response `200`**

```json
{
  "date": "2026-05-19",
  "rows": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "slNo": 1,
      "eventReferenceId": "67fabc1234567890abcd1234",
      "eventReferenceLabel": "Wedding — Priya Sharma",
      "particulars": "Office stationery",
      "category": "Admin",
      "inAmount": 0,
      "outAmount": 1250.5,
      "paidTo": "ABC Stores",
      "paymentMode": "UPI",
      "entityAccount": "Sky blue HDFC",
      "remarks": "Invoice #102"
    }
  ],
  "totalInAmount": 0,
  "totalOutAmount": 1250.5,
  "totalNetAmount": -1250.5,
  "updatedAt": "2026-05-19T10:30:00.000Z",
  "updatedBy": "user@example.com"
}
```

**Empty day:** return `200` with `"rows": []` (frontend will show blank template rows).

**Errors**

| Status | When |
|--------|------|
| `400`  | Invalid or missing `date` |
| `401`  | Unauthorized |
| `404`  | Optional: no document for date — frontend treats as empty and may use local cache |

---

### 2. Save (bulk upsert) expenses for a date

```http
PUT /expenses
Content-Type: application/json
```

**Request body**

```json
{
  "date": "2026-05-19",
  "rows": [
    {
      "slNo": 1,
      "eventReferenceId": "67fabc1234567890abcd1234",
      "eventReferenceLabel": "Wedding — Priya Sharma",
      "particulars": "Office stationery",
      "category": "Admin",
      "inAmount": 0,
      "outAmount": 1250.5,
      "paidTo": "ABC Stores",
      "paymentMode": "UPI",
      "entityAccount": "Sky blue HDFC",
      "remarks": "Invoice #102"
    }
  ]
}
```

**Semantics (recommended)**

- One document per **`date`** (and optionally per **organization/tenant** if multi-tenant).
- **Replace** all line items for that date with the payload `rows` array (full snapshot save).
- Ignore rows where all meaningful fields are empty (frontend already filters before save).
- Recompute and store `totalInAmount`, `totalOutAmount`, `totalNetAmount` server-side (`net = in − out`).
- Validate `eventReferenceId` against `GET /events` (Mongo `events` collection `_id`) when present.
- Set `updatedAt` / `updatedBy` on each save.

**Success response `200`**

```json
{
  "message": "Expenses saved",
  "date": "2026-05-19",
  "rowCount": 1,
  "totalInAmount": 0,
  "totalOutAmount": 1250.5,
  "totalNetAmount": -1250.5
}
```

**Errors**

| Status | When |
|--------|------|
| `400`  | Validation failed (invalid date, invalid event id, etc.) |
| `401`  | Unauthorized |
| `501`  | Not implemented yet — frontend falls back to localStorage |

---

## Row field specification

| Field                 | Type    | Required on save | Notes |
|-----------------------|---------|------------------|-------|
| `slNo`                | number  | Yes              | 1-based display order; backend may renumber |
| `eventReferenceId`    | string  | No               | `_id` from **`GET /events`** (client booking) |
| `eventReferenceLabel` | string  | No               | Denormalized display: e.g. `Wedding — Client Name` |
| `particulars`         | string  | No*              | Description of expense |
| `category`            | string  | No               | Free text or enum later |
| `inAmount`            | number  | No*              | Money **in** (INR); `>= 0` |
| `outAmount`           | number  | No*              | Money **out** (INR); `>= 0` |
| `paidTo`              | string  | No               | Payee name |
| `paymentMode`   | string  | No               | Enum: `CASH`, `ACCOUNT`, `UPI`, `CHEQUE`, `OTHER` |
| `entityAccount` | string  | No               | Which company/bank account paid from |
| `remarks`       | string  | No               | Notes |

\*At least one of `eventReferenceId`, `particulars`, `category`, `paidTo`, `remarks`, `inAmount > 0`, or `outAmount > 0` should be present for a row to be stored (frontend enforces this before save).

**Legacy:** older payloads may send a single `amount` field — map it to `outAmount` when `inAmount`/`outAmount` are absent.

### Event Reference dropdown (frontend)

- Loaded via existing **`GET /events?page=1&limit=500`** (same as client bookings list).
- Dropdown stores `eventReferenceId`; label is built as `{eventName} — {clientName}`.
- Optional denormalized `eventReferenceLabel` is saved with each row for reporting without joins.

### Suggested `entityAccount` values (configurable later)

- Blue Pulse Ventures Pvt Lmtd.
- Sky Blue Event Management India Pvt Lmtd.
- Sky blue ICICI
- Sky blue HDFC
- Dhrua Kumar H P
- MM account
- Cash Payment

---

## MongoDB schema (example)

### Collection: `expenses_daily`

One document per calendar day (adjust if you need per-branch documents).

```javascript
{
  _id: ObjectId,
  date: "2026-05-19",           // string YYYY-MM-DD, indexed unique per tenant
  rows: [
    {
      _id: ObjectId,            // optional per-line id for audit
      slNo: 1,
      eventReferenceId: ObjectId, // ref events, optional
      eventReferenceLabel: String,
      particulars: String,
      category: String,
      inAmount: Number,
      outAmount: Number,
      paidTo: String,
      paymentMode: String,      // uppercase enum
      entityAccount: String,
      remarks: String
    }
  ],
  totalInAmount: Number,
  totalOutAmount: Number,
  totalNetAmount: Number,
  createdBy: ObjectId,          // ref users
  updatedBy: ObjectId,
  createdAt: ISODate,
  updatedAt: ISODate
}
```

**Indexes**

```javascript
db.expenses_daily.createIndex({ date: 1 }, { unique: true });
// If multi-tenant:
// db.expenses_daily.createIndex({ tenantId: 1, date: 1 }, { unique: true });
```

---

## Optional future endpoints

Not required for current frontend; listed for planning:

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/expenses/range?startDate=&endDate=` | Export / reports |
| `DELETE` | `/expenses?date=` | Clear a day |
| `GET` | `/expenses/categories` | Master list for dropdown |

---

## Frontend behaviour summary

| Topic | Behaviour |
|-------|-----------|
| Default date | Today (`dayjs()`) |
| Grid | AG Grid — click to edit, Tab/Enter navigation, undo, add/delete rows |
| Save | `PUT /expenses` with all meaningful rows for selected date |
| Load | `GET /expenses?date=` on date change |
| API missing (`404`/`501`) | Read/write `localStorage` key `dhruva-expenses-v1-{userId}-{date}` |
| Total row | Computed in UI only (pinned bottom row), not sent to API |

---

## Example Express-style handler sketch

```javascript
// GET /expenses
async function getExpenses(req, res) {
  const { date } = req.query;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: "Invalid date" });
  }
  const doc = await ExpensesDaily.findOne({ date });
  return res.json({
    date,
    rows: doc?.rows ?? [],
    totalInAmount: doc?.totalInAmount ?? 0,
    totalOutAmount: doc?.totalOutAmount ?? 0,
    totalNetAmount: doc?.totalNetAmount ?? 0,
    updatedAt: doc?.updatedAt,
  });
}

// PUT /expenses
async function putExpenses(req, res) {
  const { date, rows } = req.body;
  const totalInAmount = rows.reduce((s, r) => s + (Number(r.inAmount) || 0), 0);
  const totalOutAmount = rows.reduce((s, r) => s + (Number(r.outAmount) || 0), 0);
  const totalNetAmount = totalInAmount - totalOutAmount;
  const doc = await ExpensesDaily.findOneAndUpdate(
    { date },
    {
      $set: {
        rows,
        totalInAmount,
        totalOutAmount,
        totalNetAmount,
        updatedBy: req.user.id,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
  return res.json({
    message: "Expenses saved",
    date,
    rowCount: rows.length,
    totalInAmount,
    totalOutAmount,
    totalNetAmount,
  });
}
```

---

## Integration checklist for backend

- [ ] Implement `GET /expenses?date=YYYY-MM-DD`
- [ ] Implement `PUT /expenses` with body `{ date, rows }`
- [ ] Use same `Authorization` middleware as Daybook
- [ ] Validate `paymentMode` enum
- [ ] Store `totalInAmount`, `totalOutAmount`, `totalNetAmount` on document
- [ ] Return `200` with empty `rows` for new dates
- [ ] Add to `FRONTEND_ALL_APIS_FINAL.md` when ready

---

## Note on “free API with 1000 requests/month”

The spreadsheet UI does **not** call an external SaaS API. **AG Grid Community** runs entirely in the browser (free license for this use case). Request volume is only your own backend `GET`/`PUT` per date change and save — no third-party monthly cap applies to the grid itself.
