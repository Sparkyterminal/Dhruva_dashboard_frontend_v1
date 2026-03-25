# Budget report & event detail — Frontend integration

This document describes how the **budget report** is returned on **single-event fetch**, the **clone** API, and how it lines up with the **event form**.

---

## Base URL

Budget routes mount at **`/api/budget-report`**. Events mount at **`/api/events`** (see your `app.js` / `API_ROOT` if different).

---

## Authentication

Protected routes expect the same **`Authorization`** header (JWT) as other `isAuth` routes in this project.

---

## 1. Get event with budget report (event form / detail page)

### Request

| Method | Path |
|--------|------|
| `GET` | `/api/events/:eventId` |

`:eventId` is the MongoDB `_id` of the **booking / event** document.

### Response shape (200)

```json
{
  "event": { },
  "budgetReport": { },
  "budgetReportsCount": 0
}
```

| Field | Type | Description |
|--------|------|-------------|
| **`event`** | object | Same populated event document as before (eventName, eventTypes, leads, createdBy, etc.). |
| **`budgetReport`** | object \| `null` | **Latest** budget report for this `eventId` (by `createdAt` descending). Same populated shape as `GET /api/budget-report/:id` (see below). **`null`** if none exists. |
| **`budgetReportsCount`** | number | Total reports stored for this event (e.g. after clones you may have `count > 1` while `budgetReport` is still only the newest). |

### Using this on the event form

1. Load **`GET /api/events/:eventId`** once.
2. Bind the form from **`event`** as today.
3. If **`budgetReport`** is non-null, initialise the budget UI from **`budgetReport.budgetData`**, **`budgetReport.exteriorDetails`**, **`budgetReport.metadata`**, and use **`budgetReport._id`** for updates (`PUT /api/budget-report/:id`).
4. If **`budgetReport`** is `null`, the event has no budget yet → create with **`POST /api/budget-report`** (body includes `eventId` = this event’s `_id`).
5. If **`budgetReportsCount > 1`**, you may show a note or a separate “versions” UI; the API still returns only the **latest** on this endpoint. For a full list for one event, you can use **`GET /api/budget-report`** (all reports) and filter client-side by `eventId._id`, or ask backend for a dedicated list-by-event if needed.

### List / other event GET endpoints (same budget fields on each event)

These responses include **`budgetReport`** and **`budgetReportsCount`** on **each** event object (latest populated report + total count for that booking), using the same populated shape as above:

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/events` | Each item in **`events`** has `budgetReport`, `budgetReportsCount` (plus existing fields like `advanceTotals`). |
| `GET` | `/api/events/my-events` | Same on each **`events`** item. |
| `GET` | `/api/events/minimal` | Each slim row includes **`budgetReport`** / **`budgetReportsCount`** (payload can be large if many events have budgets). |

**Leaderboard:** `GET /api/events/leaderboard` in **`mode=mostAmount`** (amount mode only): each object inside **`leaderboard[].events`** includes **`budgetReport`** and **`budgetReportsCount`**. The **mostBooked** mode does not return per-event rows, so there is no budget there.

### Populated `budgetReport` (high level)

After aggregation, the report matches other budget endpoints:

- **`_id`**, **`budgetData`**, **`exteriorDetails`**, **`metadata`**, **`createdAt`**, **`updatedAt`**
- **`eventId`**: expanded to the **event** subdocument (with nested **eventName** from `eventnames`), not a bare ObjectId.
- **`vendorIds`**: replaced by an array of **vendor** subdocuments (`name`, `vendor_code`, `email`, `cont_person`, `mobile_no`) for rows referenced in `budgetData.groups`.

Raw `budgetData` structure (from your domain) looks like:

- **`budgetData.groups`**: object whose keys are group names (e.g. `"Infrastructure"`, `"Stationery"`); each value is an array of line items (`slNo`, `particulars`, `vendorId`, `vendorCode`, `vendorName`, amounts, flags, etc.).
- **`budgetData.grandTotals`**, **`budgetData.summary`**: rolled-up numbers.

---

## 2. Clone budget report

### Request

| Method | Path |
|--------|------|
| `POST` | `/api/budget-report/:id/clone` |

`:id` is the **`_id` of the budget report** to copy (not the event id).

### Body (JSON, optional)

| Field | Required | Description |
|--------|----------|-------------|
| **`eventId`** | No | If set, the **new** report is linked to this event. Must exist. If omitted, the clone keeps the **same** `eventId` as the source (second report on the same event). |
| **`metadata`** | No | Plain object merged **on top of** a deep copy of the source `metadata` (before the server adds clone fields). |

The server always sets on the new document:

- **`metadata.clonedFromReportId`** — source report id (string)
- **`metadata.clonedAt`** — ISO timestamp

### Response (201)

Same pattern as create:

```json
{
  "message": "Budget report cloned successfully",
  "data": { }
}
```

`data` is the **new** report with the same populated shape as **`GET /api/budget-report/:id`**.

### Typical frontend flows

**A. Duplicate budget on the same event**

```http
POST /api/budget-report/69998e0fa45e031c877b1b6a/clone
Content-Type: application/json

{}
```

Then refresh event detail or refetch **`GET /api/events/:eventId`** — `budgetReport` will be the **newest** clone.

**B. Copy budget to another event’s form**

```http
POST /api/budget-report/69998e0fa45e031c877b1b6a/clone
Content-Type: application/json

{ "eventId": "6971d0e0b799243ee039032b" }
```

Navigate to the target event and load **`GET /api/events/:targetEventId`** to show the linked budget.

### Errors (summary)

| Situation | Typical status |
|-----------|----------------|
| Invalid `:id` | `400` |
| Source report not found | `404` (project uses custom code; treat as not found) |
| Invalid / missing target `eventId` | `400` |
| Target event not found | `404` |
| Source `budgetData` not cloneable | `422` |

---

## 3. Related budget endpoints (reference)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/budget-report` | Create (`eventId`, `budgetData`, optional `metadata`, `exteriorDetails`) |
| `GET` | `/api/budget-report/:id` | Single report (same populated shape as on event GET) |
| `PUT` | `/api/budget-report/:id` | Update |
| `GET` | `/api/budget-report/event/:eventId` | Latest report for event only (no full event payload) |
| `GET` | `/api/vendor/minimal` | Dropdown: `_id`, `name`, `vendor_code` |

---

## 4. Vendor minimal list (budget lines)

`GET /api/vendor/minimal?search=&limit=`

Returns `{ success, totalVendors, vendors: [{ _id, name, vendor_code }], meta }` for binding **`vendorId`** / display codes on budget rows.

---

*Last updated for: event GET includes `budgetReport` + `budgetReportsCount`, budget clone `POST /:id/clone`.*
