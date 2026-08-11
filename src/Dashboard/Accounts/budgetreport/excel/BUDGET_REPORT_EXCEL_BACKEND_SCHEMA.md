# Budget Report Excel — Backend Schema & API Contract

Share this with the backend team. It describes how to **store and serve Univer Sheets workbook data** for **event-mapped Budget Reports** in the Dhruva dashboard.

**Frontend location:** `src/Dashboard/Accounts/budgetreport/excel/`  
**Shared spreadsheet stack:** `src/Components/UniverSheets/`  
**Routes:**

| Route | Purpose |
|-------|---------|
| `/user/budgetreport/eventwise` | List (View + Edit actions only) |
| `/user/budgetreport` | Pick a **confirmed or in-progress** event → open Excel |
| `/user/budgetreport/view/:eventId` | Read-only Excel (all sheets) |
| `/user/budgetreport/edit/:eventId` | Editable Excel mapped to that event |

---

## Overview

Budget Report Excel is **one multi-sheet workbook per eligible event** (`Confirmed Event` **or** `InProgress`).

1. User selects a confirmed or in-progress event.
2. Frontend opens Univer Sheets and loads/saves a full **`IWorkbookData`** snapshot.
3. Backend stores that JSON keyed by **`module + key`**, where:
   - `module` = `"budget-report"`
   - `key` = **Mongo event `_id`** (string)

Users can add **many sheets** and large cell data per sheet. Every save sends the **entire** workbook (all tabs + all `cellData`). Backend must **replace** `workbookData` wholesale — never merge only the active sheet.

This reuses the same collection pattern as **Leads Tracker Excel** (`module: "client-leads"`).

---

## Authentication

```http
Authorization: <access_token from login>
```

Mirror roles that already access Budget Report (Accounts, Marketing, Owner, Approver, CA, Department as applicable).

---

## Recommended MongoDB schema

### Collection: `spreadsheet_workbooks` (shared)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | yes | Document id |
| `module` | string | yes | `"budget-report"` for this feature |
| `key` | string | yes | **Event `_id`** (`Confirmed Event` or `InProgress`) |
| `title` | string | no | e.g. `"Budget Report — Wedding - Priya"` |
| `workbookData` | object | yes | Full Univer `IWorkbookData` (opaque JSON) |
| `meta` | object | no | Denormalized list fields (see below) |
| `version` | number | yes | Optimistic concurrency. Start at `1`, increment on each save |
| `createdBy` | ObjectId / User | yes | |
| `updatedBy` | ObjectId / User | yes | |
| `createdAt` | Date | yes | |
| `updatedAt` | Date | yes | |

**Unique index (required):**

```text
{ module: 1, key: 1 }  unique
```

### `meta` (recommended for list UI)

Frontend sends `meta` on every PUT so the list page can avoid loading huge `workbookData`:

```json
{
  "eventId": "67fabc1234567890abcd1234",
  "eventName": "Wedding",
  "clientName": "Priya Sharma",
  "sheetCount": 3,
  "sheetNames": ["Summary", "Vendors", "Payments"],
  "cellCount": 842
}
```

| Field | Type | Notes |
|-------|------|-------|
| `eventId` | string | Same as `key` |
| `eventName` | string | Display |
| `clientName` | string | Display |
| `sheetCount` | number | From frontend stats |
| `sheetNames` | string[] | Optional |
| `cellCount` | number | Optional |

Validate that `key` / `meta.eventId` references an existing event with `eventConfirmation` of `"Confirmed Event"` **or** `"InProgress"` (recommended).

### Example document

```json
{
  "_id": "686f1a2b3c4d5e6f7a8b9c0d",
  "module": "budget-report",
  "key": "67fabc1234567890abcd1234",
  "title": "Budget Report — Wedding - Priya Sharma",
  "workbookData": {
    "id": "workbook-xyz",
    "name": "Budget Report",
    "appVersion": "0.25.1",
    "locale": "enUS",
    "styles": {},
    "sheetOrder": ["sheet-1", "sheet-2"],
    "sheets": {
      "sheet-1": {
        "id": "sheet-1",
        "name": "Summary",
        "rowCount": 200,
        "columnCount": 40,
        "cellData": {
          "0": {
            "0": { "v": "Particulars" },
            "1": { "v": "Budget" }
          }
        },
        "mergeData": [],
        "rowData": {},
        "columnData": {}
      },
      "sheet-2": {
        "id": "sheet-2",
        "name": "Vendors",
        "rowCount": 500,
        "columnCount": 26,
        "cellData": {},
        "mergeData": []
      }
    },
    "resources": []
  },
  "meta": {
    "eventId": "67fabc1234567890abcd1234",
    "eventName": "Wedding",
    "clientName": "Priya Sharma",
    "sheetCount": 2,
    "sheetNames": ["Summary", "Vendors"],
    "cellCount": 2
  },
  "version": 4,
  "createdBy": "696f739a92c5abff543b22bb",
  "updatedBy": "696f739a92c5abff543b22bb",
  "createdAt": "2026-07-18T05:00:00.000Z",
  "updatedAt": "2026-07-18T06:15:00.000Z"
}
```

### Storage notes

- Prefer Mixed/Object for `workbookData`. If near Mongo 16MB, move blob to S3/GridFS and store a URL (frontend would need a follow-up change).
- **Do not parse or rewrite** nested `workbookData` keys.
- Always return the **exact** snapshot that was saved so all sheets reopen correctly.

---

## Univer `IWorkbookData` (opaque to backend)

Produced by:

```js
const snapshot = await sheetsRef.current.getWorkbookDataAsync();
```

Important top-level fields:

| Field | Description |
|-------|-------------|
| `sheetOrder` | All sheet ids in tab order |
| `sheets` | Map of every sheet → full `cellData` |
| `styles` / `resources` | Keep intact |

Backend must store and return the whole object. See also `LEADS_TRACKER_EXCEL_BACKEND_SCHEMA.md` for cell-level detail.

---

## API endpoints

Base URL: `${API_BASE_URL}` (same as other dashboard APIs).

### 1. Get workbook for an event

```http
GET /spreadsheet-workbooks?module=budget-report&key=<eventId>
```

**Success `200`**

```json
{
  "_id": "...",
  "module": "budget-report",
  "key": "<eventId>",
  "title": "Budget Report — …",
  "workbookData": { "...": "full IWorkbookData" },
  "meta": { "eventId": "<eventId>", "eventName": "…", "clientName": "…", "sheetCount": 2 },
  "version": 4,
  "updatedAt": "2026-07-18T06:15:00.000Z",
  "updatedBy": { "_id": "…", "first_name": "…", "last_name": "…" }
}
```

**Not found:** prefer `200` with `"workbookData": null` and `"version": 0` (frontend opens blank workbook), **or** `404` (frontend also treats 404 as blank).

### 2. Create / upsert workbook for an event

```http
PUT /spreadsheet-workbooks
Content-Type: application/json
```

**Body**

```json
{
  "module": "budget-report",
  "key": "<eventId>",
  "title": "Budget Report — Wedding - Priya Sharma",
  "workbookData": { "...": "full IWorkbookData from workbook.save()" },
  "version": 4,
  "meta": {
    "eventId": "<eventId>",
    "eventName": "Wedding",
    "clientName": "Priya Sharma",
    "sheetCount": 2,
    "sheetNames": ["Summary", "Vendors"],
    "cellCount": 120
  }
}
```

**Behavior**

| Case | Action |
|------|--------|
| No doc for `(module, key)` | Create with `version: 1` |
| Exists and client `version` matches | Replace `workbookData` + `meta`, set `version = version + 1`, update `updatedBy` / `updatedAt` |
| Exists and version mismatch | `409` Conflict |

**Success `200`** — echo saved document (including full `workbookData`).

**Conflict `409`**

```json
{
  "message": "Workbook was updated by another user. Please reload.",
  "currentVersion": 5
}
```

### 3. List budget report workbooks (required for event-wise table)

```http
GET /spreadsheet-workbooks?module=budget-report&list=1
```

**Do not** return full `workbookData` in the list response (too large). Return metadata only:

```json
{
  "data": [
    {
      "_id": "...",
      "module": "budget-report",
      "key": "<eventId>",
      "title": "Budget Report — Wedding - Priya Sharma",
      "meta": {
        "eventId": "<eventId>",
        "eventName": "Wedding",
        "clientName": "Priya Sharma",
        "sheetCount": 2
      },
      "version": 4,
      "updatedAt": "2026-07-18T06:15:00.000Z"
    }
  ]
}
```

Frontend also accepts `{ workbooks: [...] }` or `{ items: [...] }` or a bare array.

Until this list endpoint exists, the frontend falls back to listing **eligible events** (`Confirmed Event` + `InProgress`) from `GET /events` (View/Edit still load per-event workbooks).

### 4. Optional — delete

```http
DELETE /spreadsheet-workbooks?module=budget-report&key=<eventId>
```

### 5. Eligible events (already exists)

```http
GET /events?page=1&limit=1000&status=confirmed
GET /events?page=1&limit=1000&status=inprogress
```

Frontend loads Confirmed + InProgress for the create dropdown (or filters `eventConfirmation` client-side).

```http
GET /events/:eventId
```

Used for header labels on View/Edit pages.

---

## Frontend integration (already wired)

| Action | Call |
|--------|------|
| List | `GET /spreadsheet-workbooks?module=budget-report&list=1` (+ fallback eligible events) |
| Load | `GET /spreadsheet-workbooks?module=budget-report&key=<eventId>` |
| Save | `PUT /spreadsheet-workbooks` with `{ module, key, title, workbookData, version, meta }` |
| View UI | Univer `readOnly` — toolbar/formula bar hidden; all sheet tabs still visible |
| Edit UI | Full editable Univer; Save persists **all** sheets |

Helpers:

- `src/Components/UniverSheets/spreadsheetWorkbooksApi.js`
- `src/Dashboard/Accounts/budgetreport/excel/budgetReportExcelApi.js`

Module constant: `SPREADSHEET_MODULE_BUDGET_REPORT = "budget-report"`.

---

## Multi-sheet / large workbook rules (critical)

On every PUT, frontend sends the **entire** `IWorkbookData`:

- `sheetOrder` — all tab ids
- `sheets` — **every** sheet with full `cellData`
- `styles`, `resources` — intact

Backend must:

1. **Replace** `workbookData` wholesale (no deep-merge of only active sheet).
2. Not strip nested keys under `sheets[*].cellData`.
3. Allow large JSON (raise body parser limit, e.g. 10–16MB).
4. Return the same full object on GET.

---

## Validation rules

| Rule | Detail |
|------|--------|
| Auth required | Reject unauthenticated |
| `module` allowlist | Include `"budget-report"` (and `"client-leads"`) |
| `key` | Non-empty string; preferably valid Confirmed / InProgress event `_id` |
| `workbookData` on PUT | Plain object required |
| Max size | Reject `413` if over agreed limit |
| Version check | Mismatch → `409` |
| Do not strip unknown keys | Preserve entire `workbookData` tree |

---

## Suggested Mongoose sketch

```js
const SpreadsheetWorkbookSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, index: true },
    key: { type: String, required: true },
    title: { type: String, default: "" },
    workbookData: { type: mongoose.Schema.Types.Mixed, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
    version: { type: Number, required: true, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SpreadsheetWorkbookSchema.index({ module: 1, key: 1 }, { unique: true });
```

Example handler notes:

```js
// GET list — omit workbookData
const docs = await SpreadsheetWorkbook.find({ module: "budget-report" })
  .select("-workbookData")
  .sort({ updatedAt: -1 });

// PUT — replace workbookData entirely
existing.workbookData = req.body.workbookData; // full replace
existing.meta = req.body.meta || existing.meta;
existing.version += 1;
```

---

## Migration from legacy Budget Report

The old AG Grid / `budget-report` row documents are **deprecated** in the frontend Excel flow.

Optional backend work:

1. Keep old `budget-report` collection read-only for historical data.
2. New Excel reports live only in `spreadsheet_workbooks` with `module: "budget-report"`.
3. Do **not** require migrating old grid JSON into Univer format unless product asks for it.

---

## Minimal acceptance checklist

- [ ] Unique index on `(module, key)`
- [ ] Allow `module: "budget-report"`
- [ ] `GET` by `module` + `key` returns full `workbookData`
- [ ] `PUT` creates/updates with optimistic `version` (`409` on stale)
- [ ] `PUT` stores full multi-sheet snapshot without mutation
- [ ] `GET ?module=budget-report&list=1` returns meta rows **without** `workbookData`
- [ ] Optional: validate `key` is a Confirmed Event or InProgress event
- [ ] Payload size limit documented / body parser raised
- [ ] Re-open after save restores **all** sheets, values, and formulas

---

## Summary for backend team

1. One **opaque JSON** workbook per eligible event: `module=budget-report`, `key=<eventId>` (`Confirmed Event` or `InProgress`).
2. Expose **GET (one)**, **PUT**, and **GET list** (`list=1`).
3. Store optional **`meta`** for fast list UI.
4. Always **full replace** of `workbookData` — multi-sheet safe.
5. Version concurrency with **`409`** on conflict.

The frontend Excel module is already calling these contracts.

---

## Related: Client Bookings column + Clone

For **events list embedding** (`budgetReport`, `budgetReportsCount`) and **`POST /spreadsheet-workbooks/clone`**, see:

`src/Dashboard/Accounts/clientBookings/CLIENT_BOOKINGS_BUDGET_REPORT_BACKEND_SCHEMA.md`
