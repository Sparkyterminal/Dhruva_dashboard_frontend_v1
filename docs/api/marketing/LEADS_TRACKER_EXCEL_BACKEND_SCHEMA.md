# Univer Sheets Workbooks — Backend Schema & API Contract

This document describes how to **store and serve Univer Sheets workbook data** for the Dhruva dashboard frontend.

Share this with the backend team so they can design the MongoDB (or equivalent) model and REST APIs.

**Frontend component:** `src/Components/UniverSheets/` (reusable)  
**First consumer:** Leads Tracker Excel — `/user/client-leads/excel`  
**UI page:** `src/Dashboard/Marketting/ClientLeadsTrack/LeadsTrackerExcel.jsx`

---

## Overview

The Excel UI is powered by **[Univer Sheets](https://docs.univer.ai/)**.  
The frontend does **not** store individual cells as separate DB rows.

Instead:

1. User edits the spreadsheet in the browser.
2. Frontend calls `workbook.save()` → returns one JSON object: **`IWorkbookData`**.
3. Backend stores that JSON as a **single document** (or blob field).
4. On open, frontend loads the same JSON and passes it to `createWorkbook(workbookData)`.

This preserves:

- Multiple sheets (tabs)
- Cell values, formulas, styles
- Column/row sizes, merges, freeze panes
- Sheet order and names
- Plugin resources (when used)

**Do not** try to normalize every cell into SQL columns unless you have a strong reason. Treat the workbook snapshot as the source of truth.

---

## Authentication

Same as other dashboard APIs:

```http
Authorization: <access_token from login>
```

Only authenticated users with access to the related module (e.g. Client Leads) should call these endpoints.

---

## Recommended MongoDB schema

Use one collection that can serve **Leads Tracker Excel** today and other Excel modules later.

### Collection: `spreadsheet_workbooks`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | yes | Document id |
| `module` | string | yes | Which feature owns this workbook. See module keys below. |
| `key` | string | yes | Stable business key within the module (e.g. `"default"`, or a date / event id). |
| `title` | string | no | Display title (e.g. `"Leads Tracker Excel"`). |
| `workbookData` | object | yes | Full Univer `IWorkbookData` snapshot (opaque JSON to backend). |
| `version` | number | yes | Optimistic concurrency counter. Start at `1`, increment on each save. |
| `createdBy` | ObjectId / ref User | yes | Who created it |
| `updatedBy` | ObjectId / ref User | yes | Who last saved |
| `createdAt` | Date | yes | |
| `updatedAt` | Date | yes | |

**Unique index (required):**

```text
{ module: 1, key: 1 }  unique
```

### Module keys (frontend will send these)

| `module` value | Feature | Suggested `key` |
|----------------|---------|-----------------|
| `client-leads` | Leads Tracker Excel | `"default"` (one shared workbook for the org) **or** per-user: `user:<userId>` |
| *(future)* `expenses` | Daily expenses sheet | `date:YYYY-MM-DD` |
| *(future)* other modules | … | module-specific |

> **Decision for backend team:** For Leads Tracker, confirm whether the workbook is **org-shared** (`key: "default"`) or **per-user** (`key: "user:<id>"`). Frontend can support either; pick one and document it.

### Example document

```json
{
  "_id": "686f1a2b3c4d5e6f7a8b9c0d",
  "module": "client-leads",
  "key": "default",
  "title": "Leads Tracker Excel",
  "workbookData": {
    "id": "workbook-xyz",
    "name": "Leads Tracker Excel",
    "appVersion": "0.25.1",
    "locale": "enUS",
    "styles": {},
    "sheetOrder": ["sheet-1", "sheet-2"],
    "sheets": {
      "sheet-1": {
        "id": "sheet-1",
        "name": "Sheet1",
        "rowCount": 100,
        "columnCount": 26,
        "cellData": {
          "0": {
            "0": { "v": "Client Name" },
            "1": { "v": "Status" }
          },
          "1": {
            "0": { "v": "Poorna Varun" },
            "1": { "v": "Inprogress" }
          }
        },
        "mergeData": [],
        "rowData": {},
        "columnData": {}
      },
      "sheet-2": {
        "id": "sheet-2",
        "name": "Follow-ups",
        "rowCount": 100,
        "columnCount": 26,
        "cellData": {},
        "mergeData": []
      }
    },
    "resources": []
  },
  "version": 3,
  "createdBy": "696f739a92c5abff543b22bb",
  "updatedBy": "696f739a92c5abff543b22bb",
  "createdAt": "2026-07-18T05:00:00.000Z",
  "updatedAt": "2026-07-18T06:15:00.000Z"
}
```

### Storage notes

- `workbookData` can grow large (many cells + styles). Prefer **MongoDB document** with `workbookData` as Mixed/Object. If documents approach 16MB, move `workbookData` to GridFS / S3 and store a URL instead.
- Backend should **not parse or rewrite** `workbookData` fields unless explicitly versioning/migrating. Treat it as opaque JSON.
- Always return the **exact** object the frontend saved so Univer can reopen it correctly.

---

## Univer `IWorkbookData` shape (what frontend saves)

This is produced by:

```js
const snapshot = univerAPI.getActiveWorkbook().save();
```

### Top-level fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Workbook id |
| `name` | string | Workbook name |
| `appVersion` | string | Univer model version |
| `locale` | string | e.g. `"enUS"` |
| `styles` | object | Shared style map |
| `sheetOrder` | string[] | Sheet ids in tab order |
| `sheets` | object | Map of `sheetId → IWorksheetData` |
| `resources` | array | Optional plugin data |

### Each sheet (`sheets[sheetId]`) — important fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Sheet id |
| `name` | string | Tab name (user-editable; multiple sheets supported) |
| `rowCount` / `columnCount` | number | Grid size |
| `cellData` | object | Sparse matrix: `cellData[row][col] = { v, t, s, f, ... }` |
| `mergeData` | array | Merged ranges |
| `rowData` / `columnData` | object | Row/column metadata (height, width, hidden) |
| `freeze` | object | Frozen rows/cols |
| … | … | Other Univer fields — store as-is |

### Cell object (inside `cellData`)

| Field | Meaning |
|-------|---------|
| `v` | Display / raw value |
| `t` | Cell type |
| `s` | Style id (references `styles`) |
| `f` | Formula string (if any) |
| `p` | Rich text / paragraph data (if any) |

Frontend references: [Workbook data](https://docs.univer.ai/guides/sheets/model/workbook-data), [Worksheet data](https://docs.univer.ai/guides/sheets/model/worksheet-data).

---

## API endpoints

Base URL: `${API_BASE_URL}` (same prefix as `client-leads`, `events`, etc.)

### Option A — Module-scoped routes (recommended for Leads Tracker)

#### 1. Get workbook

```http
GET /spreadsheet-workbooks?module=client-leads&key=default
```

**Success `200`**

```json
{
  "_id": "686f1a2b3c4d5e6f7a8b9c0d",
  "module": "client-leads",
  "key": "default",
  "title": "Leads Tracker Excel",
  "workbookData": { "...": "full IWorkbookData" },
  "version": 3,
  "updatedAt": "2026-07-18T06:15:00.000Z",
  "updatedBy": {
    "_id": "696f739a92c5abff543b22bb",
    "first_name": "archana",
    "last_name": "km"
  }
}
```

**Not found:** return `200` with `workbookData: null` (frontend opens a blank workbook), **or** `404` — pick one and keep it consistent. Prefer `200` + null for simpler UX.

#### 2. Create / upsert workbook

```http
PUT /spreadsheet-workbooks
Content-Type: application/json
```

**Body**

```json
{
  "module": "client-leads",
  "key": "default",
  "title": "Leads Tracker Excel",
  "workbookData": { "...": "full IWorkbookData from workbook.save()" },
  "version": 3
}
```

**Behavior**

- If no document for `(module, key)` → create with `version: 1` (ignore client version or set to 1).
- If exists → require client `version` to match current DB `version` (optimistic lock). On success, set `version = version + 1`, replace `workbookData`, set `updatedBy` / `updatedAt`.

**Success `200`**

```json
{
  "_id": "686f1a2b3c4d5e6f7a8b9c0d",
  "module": "client-leads",
  "key": "default",
  "title": "Leads Tracker Excel",
  "workbookData": { "...": "echo saved snapshot" },
  "version": 4,
  "updatedAt": "2026-07-18T06:20:00.000Z"
}
```

**Conflict `409`** (someone else saved first)

```json
{
  "message": "Workbook was updated by another user. Please reload.",
  "currentVersion": 5
}
```

#### 3. Optional — delete workbook

```http
DELETE /spreadsheet-workbooks?module=client-leads&key=default
```

### Option B — Dedicated Leads Tracker routes (simpler if only one sheet for now)

```http
GET  /client-leads/excel
PUT  /client-leads/excel
```

**PUT body**

```json
{
  "workbookData": { "...": "IWorkbookData" },
  "version": 3
}
```

Internally still store with `module: "client-leads"`, `key: "default"` so you can reuse the same collection later.

---

## Frontend save / load contract

### Load

```http
GET ... → { workbookData, version }
```

Frontend:

```js
univerAPI.createWorkbook(workbookData || {});
```

### Save

```js
const workbookData = sheetsRef.current.getWorkbookData(); // IWorkbookData
await axios.put(url, { module: "client-leads", key: "default", workbookData, version });
```

### Autosave (optional, backend-ready)

Frontend may debounce saves (e.g. every 10–30s or on blur). Backend must accept frequent PUTs and keep versioning cheap.

---

## Validation rules (backend)

| Rule | Detail |
|------|--------|
| Auth required | Reject unauthenticated requests |
| `module` allowlist | e.g. only `"client-leads"` initially |
| `workbookData` required on PUT | Must be a plain object (not string/array) |
| Max size | Reject if payload > agreed limit (e.g. 8–12 MB) with `413` |
| Version check | On update, mismatch → `409` |
| Do not strip unknown keys | Preserve entire `workbookData` tree |

---

## Permissions

| Role | Suggested access |
|------|------------------|
| Marketing / Owner / Accounts / Approver (same as Client Leads page) | Read + Write |
| Others | No access |

Mirror whatever roles already use `/user/client-leads`.

---

## Suggested Mongoose sketch

```js
const SpreadsheetWorkbookSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, index: true },
    key: { type: String, required: true },
    title: { type: String, default: "" },
    workbookData: { type: mongoose.Schema.Types.Mixed, required: true },
    version: { type: Number, required: true, default: 1 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

SpreadsheetWorkbookSchema.index({ module: 1, key: 1 }, { unique: true });
```

---

## Minimal acceptance checklist for backend

- [ ] Collection + unique index on `(module, key)`
- [ ] `GET` returns workbook for `module=client-leads&key=default` (or dedicated `/client-leads/excel`)
- [ ] `PUT` creates if missing, updates if present
- [ ] `PUT` stores full `workbookData` JSON without mutation
- [ ] Version / optimistic concurrency (`409` on stale version)
- [ ] Auth + role checks match Client Leads access
- [ ] Payload size limit documented
- [ ] Re-open after save restores multiple sheets, values, and formulas

---

## Out of scope (for now)

- Real-time multiplayer collaboration (Univer has a separate collaboration product)
- Cell-level history / audit of every edit
- Server-side Excel `.xlsx` import/export (can be added later; storage remains `IWorkbookData`)
- Parsing sheet cells into Client Leads list rows (list view stays on `/api/client-leads`; Excel is a separate workspace unless product asks to sync)

---

## Multi-sheet / large workbook rules (critical)

Frontend always sends the **entire** `IWorkbookData` on every save:

- `sheetOrder` — all tab ids in order
- `sheets` — **every** sheet object with its full `cellData` (not only the active tab)
- `styles`, `resources` — kept intact

Backend must:

1. **Replace** `workbookData` wholesale on PUT (do not deep-merge only changed cells / only active sheet).
2. Not strip nested keys under `sheets[*].cellData`.
3. Allow large JSON payloads (multi-sheet + many cells); raise body parser limit if needed (e.g. 10–16MB).
4. Return the same full object on GET so all tabs reopen correctly.

`endEditingAsync` only commits the cell currently being typed. It does **not** clear or shrink other sheets.

---

## Frontend integration status

**Implemented** on `LeadsTrackerExcel.jsx`:

- Load: `GET /spreadsheet-workbooks?module=client-leads&key=default`
- Save: `PUT /spreadsheet-workbooks` with `{ module, key, title, workbookData, version }`
- UI: **Save**, **Reload**, last-saved timestamp, `409` conflict message
- Shared API helpers: `src/Components/UniverSheets/spreadsheetWorkbooksApi.js`

Until the backend endpoints exist, Load shows an error (or blank after 404) and Save will fail with the API error message.

---

## Summary for backend team

1. Store one **opaque JSON snapshot** (`workbookData` = Univer `IWorkbookData`).
2. Identify workbooks by **`module` + `key`** (Leads Tracker: `client-leads` + `default`).
3. Expose **GET + PUT** with **version** for safe overwrites.
4. Do not normalize cells into tables for v1.

The frontend is already calling these endpoints from the Leads Tracker Excel page.