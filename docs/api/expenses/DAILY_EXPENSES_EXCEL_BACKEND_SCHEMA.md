# Daily Expenses Excel — Backend Schema & API Contract

Share this document with the backend team. It describes how to **store and serve Univer Sheets workbook data** for **date-mapped Daily Expenses** in the Dhruva dashboard.

**Frontend location:** `src/Dashboard/Accounts/DailyExpenses/`  
**Shared spreadsheet stack:** `src/Components/UniverSheets/`  
**Owner entry:** `src/Dashboard/Owner/DailyExpense.jsx` (same list UI)  
**Approver:** navigates to the same routes as Owner

## Routes (frontend)

| Path | Purpose |
|------|---------|
| `/user/daily-expenses` | List — **Today** tab + **All** tab (start/end date filter). Actions: **View**, **Edit** |
| `/user/daily-expenses/add` | Add Expense — Excel editor, date picker (defaults to today) |
| `/user/daily-expenses/view/:date` | Read-only Excel (`:date` = `YYYY-MM-DD`) |
| `/user/daily-expenses/edit/:date` | Editable Excel mapped to that date |

Roles with access: **Accounts**, **Owner**, **Approver**, **CA** (same as Daybook / expenses access).

---

## Overview

Daily Expenses Excel is **one multi-sheet workbook per business date**.

1. User picks a date (`YYYY-MM-DD`) on Add / Edit.
2. Frontend opens **Univer Sheets** and loads/saves a full **`IWorkbookData`** snapshot.
3. Backend stores that JSON keyed by **`module + key`**:
   - `module` = `"daily-expenses"`
   - `key` = **business date** as `"YYYY-MM-DD"` (example: `"2026-07-18"`)

Users can add **many sheets** and large / long-form cell data per sheet. Every save sends the **entire** workbook (all tabs + all `cellData`). Backend must **replace** `workbookData` wholesale — never merge only the active sheet.

### Naming (workbook title + sheet tabs) — required for UI

Users can **name the Excel workbook** and **rename each sheet tab** on Add / Edit.

| Layer | Field | Where stored | Notes |
|-------|--------|--------------|-------|
| Workbook title | `title` | Top-level document field | User-editable (e.g. `"Daily Expenses — Petty cash"`). Also mirrored into `workbookData.name` when present. |
| Sheet tab names | `sheets[sheetId].name` | Inside opaque `workbookData` | e.g. `"Cash"`, `"UPI"`. Persist exactly as saved. |
| List helper | `meta.sheetNames` | Denormalized string[] | Same order as tabs; used by list UI without loading full workbook. |
| List helper | `meta.sheetCount` | number | Count of tabs |

**Rules for backend**

1. Accept and store client-provided **`title`** on PUT (do not overwrite with a hardcoded string if client sends one).
2. Never rewrite or strip `workbookData.sheets[*].name`.
3. Prefer updating `meta.sheetNames` / `meta.sheetCount` from the PUT body `meta` (frontend already computes them from the snapshot).
4. List responses must return `title` and `meta.sheetNames` (or top-level `sheetNames`) so Accounts can show Excel name + sheet tags.

Example after user renames sheets:

```json
{
  "module": "daily-expenses",
  "key": "2026-07-18",
  "title": "Daily Expenses — Petty cash July",
  "workbookData": {
    "name": "Daily Expenses — Petty cash July",
    "sheetOrder": ["sheet-1", "sheet-2"],
    "sheets": {
      "sheet-1": { "id": "sheet-1", "name": "Cash", "cellData": {} },
      "sheet-2": { "id": "sheet-2", "name": "UPI", "cellData": {} }
    }
  },
  "meta": {
    "date": "2026-07-18",
    "sheetCount": 2,
    "sheetNames": ["Cash", "UPI"],
    "cellCount": 42
  }
}
```

This reuses the same `spreadsheet_workbooks` collection pattern as:

- Leads Tracker (`module: "client-leads"`)
- Budget Report Excel (`module: "budget-report"`)

---

## Authentication

```http
Authorization: <access_token from login>
```

Only authenticated users with Daily Expenses / Daybook access may call these endpoints.

---

## Recommended MongoDB schema

### Collection: `spreadsheet_workbooks` (shared)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | yes | Document id |
| `module` | string | yes | `"daily-expenses"` for this feature |
| `key` | string | yes | **Business date** `YYYY-MM-DD` |
| `title` | string | no | **User-editable Excel name.** Prefer client value on PUT. Fallback: `"Daily Expenses — {date}"` |
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

**Recommended secondary indexes for list filters:**

```text
{ module: 1, "meta.date": 1, updatedAt: -1 }
{ module: 1, key: 1, updatedAt: -1 }
```

### `key` format (critical)

| Rule | Detail |
|------|--------|
| Format | Exactly `YYYY-MM-DD` (ISO calendar date, no time) |
| Example | `"2026-07-18"` |
| Timezone | Treat as **business date** in Asia/Kolkata (or org timezone). Do not convert using UTC midnight of another zone when comparing filters |
| Validation | Reject keys that do not match `/^\d{4}-\d{2}-\d{2}$/` with `400` |

There is **exactly one** workbook document per `(module, key)` pair. Saving again for the same date **updates** that document (with version check).

### `meta` (recommended for list UI)

Frontend sends `meta` on every PUT so the list page can avoid loading huge `workbookData`:

```json
{
  "date": "2026-07-18",
  "sheetCount": 3,
  "sheetNames": ["Cash", "UPI", "Notes"],
  "cellCount": 1250
}
```

| Field | Type | Notes |
|-------|------|-------|
| `date` | string | Same as `key` (`YYYY-MM-DD`) |
| `sheetCount` | number | From frontend workbook stats |
| `sheetNames` | string[] | Optional |
| `cellCount` | number | Optional |

Backend may also set `meta.date = key` server-side on save if client omits it.

### Example document

```json
{
  "_id": "686f1a2b3c4d5e6f7a8b9c0d",
  "module": "daily-expenses",
  "key": "2026-07-18",
  "title": "Daily Expenses — 18 Jul 2026",
  "workbookData": {
    "id": "workbook-xyz",
    "name": "Daily Expenses",
    "appVersion": "0.25.1",
    "locale": "enUS",
    "styles": {},
    "sheetOrder": ["sheet-1", "sheet-2"],
    "sheets": {
      "sheet-1": {
        "id": "sheet-1",
        "name": "Cash",
        "rowCount": 500,
        "columnCount": 40,
        "cellData": {
          "0": {
            "0": { "v": "Particulars" },
            "1": { "v": "Amount" }
          },
          "1": {
            "0": { "v": "Office tea" },
            "1": { "v": 120 }
          }
        },
        "mergeData": [],
        "rowData": {},
        "columnData": {}
      },
      "sheet-2": {
        "id": "sheet-2",
        "name": "UPI",
        "rowCount": 500,
        "columnCount": 26,
        "cellData": {},
        "mergeData": []
      }
    },
    "resources": []
  },
  "meta": {
    "date": "2026-07-18",
    "sheetCount": 2,
    "sheetNames": ["Cash", "UPI"],
    "cellCount": 4
  },
  "version": 3,
  "createdBy": "696f739a92c5abff543b22bb",
  "updatedBy": "696f739a92c5abff543b22bb",
  "createdAt": "2026-07-18T05:00:00.000Z",
  "updatedAt": "2026-07-18T09:15:00.000Z"
}
```

### Storage notes

- Prefer Mixed/Object for `workbookData`. If near Mongo **16MB**, move blob to S3/GridFS and store a URL (frontend would need a follow-up).
- **Do not parse or rewrite** nested `workbookData` keys.
- Always return the **exact** snapshot that was saved so all sheets reopen correctly.
- Long-form / multi-page data is expected — raise body parser limit (e.g. **10–16MB**).

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

Backend must store and return the whole object without stripping nested keys.

---

## API endpoints

Base URL: `${API_BASE_URL}` (same prefix as other dashboard APIs).

Module allowlist must include: `"daily-expenses"` (and existing `"client-leads"`, `"budget-report"`).

---

### 1. Get workbook for a date

```http
GET /spreadsheet-workbooks?module=daily-expenses&key=2026-07-18
```

**Success `200`**

```json
{
  "_id": "...",
  "module": "daily-expenses",
  "key": "2026-07-18",
  "title": "Daily Expenses — 18 Jul 2026",
  "workbookData": { "...": "full IWorkbookData" },
  "meta": {
    "date": "2026-07-18",
    "sheetCount": 2,
    "sheetNames": ["Cash", "UPI"],
    "cellCount": 4
  },
  "version": 3,
  "updatedAt": "2026-07-18T09:15:00.000Z",
  "updatedBy": {
    "_id": "…",
    "first_name": "…",
    "last_name": "…"
  }
}
```

**Not found:** prefer `200` with `"workbookData": null` and `"version": 0` (frontend opens a blank workbook), **or** `404` (frontend also treats 404 as blank).

**Errors**

| Status | When |
|--------|------|
| `400` | Invalid `key` (not `YYYY-MM-DD`) |
| `401` | Unauthorized |

---

### 2. Create / upsert workbook for a date

```http
PUT /spreadsheet-workbooks
Content-Type: application/json
```

**Body**

```json
{
  "module": "daily-expenses",
  "key": "2026-07-18",
  "title": "Daily Expenses — 18 Jul 2026",
  "workbookData": { "...": "full IWorkbookData from workbook.save()" },
  "version": 3,
  "meta": {
    "date": "2026-07-18",
    "sheetCount": 2,
    "sheetNames": ["Cash", "UPI"],
    "cellCount": 120
  }
}
```

**Behavior**

| Case | Action |
|------|--------|
| No doc for `(module, key)` | Create with `version: 1` |
| Exists and client `version` matches | Replace `workbookData` + `meta` entirely, set `version = version + 1`, update `updatedBy` / `updatedAt` |
| Exists and version mismatch | `409` Conflict |

**Success `200`** — echo saved document (including full `workbookData`).

**Conflict `409`**

```json
{
  "message": "Workbook was updated by another user. Please reload.",
  "currentVersion": 5
}
```

**Errors**

| Status | When |
|--------|------|
| `400` | Missing/invalid `module`, `key`, or `workbookData` |
| `401` | Unauthorized |
| `409` | Stale `version` |
| `413` | Payload too large |

---

### 3. List daily expense workbooks (required for Today / All tabs)

```http
GET /spreadsheet-workbooks?module=daily-expenses&list=1
```

**Optional query filters**

| Param | Type | Description |
|-------|------|-------------|
| `list` | `1` | Required for list mode — return **metadata only** |
| `date` | `YYYY-MM-DD` | Exact date (Today tab uses this) |
| `from` | `YYYY-MM-DD` | Inclusive start (All tab) |
| `to` | `YYYY-MM-DD` | Inclusive end (All tab) |

**Filter semantics**

- Compare on `key` **or** `meta.date` (both should equal `YYYY-MM-DD`).
- `date=2026-07-18` → only that day’s row.
- `from` + `to` → `key >= from AND key <= to` (string compare works for ISO dates).
- If only `from` → `key >= from`.
- If only `to` → `key <= to`.
- Sort recommended: `key` descending (newest date first).

**Do not** return full `workbookData` in list responses (too large).

**Success `200`**

```json
{
  "data": [
    {
      "_id": "...",
      "module": "daily-expenses",
      "key": "2026-07-17",
      "title": "Daily Expenses — 17 Jul 2026",
      "meta": {
        "date": "2026-07-17",
        "sheetCount": 2,
        "sheetNames": ["Cash", "UPI"],
        "cellCount": 80
      },
      "version": 2,
      "updatedAt": "2026-07-17T18:00:00.000Z"
    }
  ]
}
```

Frontend also accepts `{ workbooks: [...] }`, `{ items: [...] }`, or a bare array.

**Today tab (frontend):**

```http
GET /spreadsheet-workbooks?module=daily-expenses&list=1&date=2026-07-18
```

**All tab (frontend):**

```http
GET /spreadsheet-workbooks?module=daily-expenses&list=1&from=2026-06-01&to=2026-07-17
```

Frontend excludes “today” from the All tab in the UI; backend may still return today if asked — that is fine.

---

### 4. Optional — delete

```http
DELETE /spreadsheet-workbooks?module=daily-expenses&key=2026-07-18
```

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
| `module` allowlist | Must include `"daily-expenses"` |
| `key` | Must match `^\d{4}-\d{2}-\d{2}$` |
| `workbookData` on PUT | Plain object required |
| Max size | Reject `413` if over agreed limit |
| Version check | Mismatch → `409` |
| Do not strip unknown keys | Preserve entire `workbookData` tree |
| List mode | When `list=1`, omit `workbookData` from response |

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
SpreadsheetWorkbookSchema.index({ module: 1, "meta.date": 1, updatedAt: -1 });

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

// GET one
// query: module=daily-expenses&key=YYYY-MM-DD

// PUT — full replace
// existing.workbookData = req.body.workbookData;
// existing.meta = { ...(req.body.meta || {}), date: req.body.key };
// existing.version += 1;

// LIST
// const q = { module: "daily-expenses" };
// if (date) q.key = date;
// if (from || to) q.key = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
// SpreadsheetWorkbook.find(q).select("-workbookData").sort({ key: -1 });
```

---

## Relation to legacy AG Grid `/expenses`

An older **row-based** Daily Expenses UI may still exist at `/user/expenses` (AG Grid + `GET/PUT /expenses`).

| Feature | Storage |
|---------|---------|
| **New Excel Daily Expenses** (this doc) | `spreadsheet_workbooks` · `module: "daily-expenses"` · `key: YYYY-MM-DD` |
| Legacy grid expenses | Separate `expenses` collection / API (if still used) |

Do **not** mix the two models. New UI only uses spreadsheet workbooks.

---

## Frontend integration (already wired)

| Action | Call |
|--------|------|
| Today list | `GET ...?module=daily-expenses&list=1&date=<today>` |
| All list | `GET ...?module=daily-expenses&list=1&from=&to=` |
| Load | `GET ...?module=daily-expenses&key=<YYYY-MM-DD>` |
| Save | `PUT` with `{ module, key, title, workbookData, version, meta }` |
| View UI | Univer `readOnly` — all sheet tabs visible, not editable |
| Edit / Add UI | Editable + date picker; Save persists **all** sheets for that date |

Helpers:

- `src/Components/UniverSheets/spreadsheetWorkbooksApi.js`
- `src/Dashboard/Accounts/DailyExpenses/dailyExpensesApi.js`

Module constant: `SPREADSHEET_MODULE_DAILY_EXPENSES = "daily-expenses"`.

---

## Minimal acceptance checklist

- [ ] Unique index on `(module, key)`
- [ ] Allow `module: "daily-expenses"`
- [ ] Validate `key` is `YYYY-MM-DD`
- [ ] `GET` by `module` + `key` returns full `workbookData`
- [ ] `PUT` creates/updates with optimistic `version` (`409` on stale)
- [ ] `PUT` stores full multi-sheet snapshot without mutation (preserve `sheets[*].name`)
- [ ] `PUT` persists client-provided **`title`** (user Excel name)
- [ ] `meta.sheetNames` / `meta.sheetCount` saved for list UI
- [ ] `GET ?module=daily-expenses&list=1` returns `title` + sheet names **without** `workbookData`
- [ ] List supports `date`, `from`, `to` filters on `key` / `meta.date`
- [ ] Payload size limit documented / body parser raised
- [ ] Re-open after save restores **all** sheets, **sheet tab names**, values, and formulas

---

## Summary for backend team

1. One **opaque JSON** workbook per calendar day: `module=daily-expenses`, `key=YYYY-MM-DD`.
2. Store user **`title`** (Excel name) and full multi-sheet `workbookData` including each tab’s **`name`**.
3. Expose **GET (one)**, **PUT**, and **GET list** (`list=1` + `date` / `from` / `to`).
4. Store optional **`meta`** (`date`, `sheetCount`, `sheetNames`, …) for fast list UI.
5. Always **full replace** of `workbookData` — multi-sheet + rename safe.
5. Version concurrency with **`409`** on conflict.

The frontend Daily Expenses Excel module is already calling these contracts.
