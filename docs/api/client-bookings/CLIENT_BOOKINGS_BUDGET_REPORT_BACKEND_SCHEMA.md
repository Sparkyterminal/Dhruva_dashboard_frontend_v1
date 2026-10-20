# Client Bookings — Budget Report (Excel) Backend Schema & API Contract

Share this with the backend team. It covers how **Client Bookings / Events list** exposes budget reports and how **View / Add new / Clone** work with the Excel workbook model.

**Frontend**

| Area | Path |
|------|------|
| List cell (View / Budget menu) | `src/Dashboard/Accounts/budgetreport/BudgetReportListCell.jsx` |
| Client Bookings table | `src/Dashboard/Accounts/clientBookings/ClientBookingsListTab.jsx` |
| Excel module | `src/Dashboard/Accounts/budgetreport/excel/` |
| Full workbook storage contract | `src/Dashboard/Accounts/budgetreport/excel/BUDGET_REPORT_EXCEL_BACKEND_SCHEMA.md` |

---

## Product behaviour (what the UI expects)

On each booking row in **Client Bookings** (and Marketing View Inflow):

| Condition | UI |
|-----------|-----|
| Event **has** a budget report | Show **View** → opens read-only Excel at `/user/budgetreport/view/:eventId` |
| Event **has no** budget report | Show **Budget** button with two options |

**Budget menu**

1. **Clone from existing** — modal lists other events that already have a budget report; cloning copies the **full multi-sheet Excel** onto this event.
2. **Add new** — navigates to `/user/budgetreport` with `preselectedEventId` = this event’s `_id`, then user opens the Excel editor mapped to that event.

---

## Event list payload (required fields)

`GET /events` (and any client-bookings list that returns events) must include budget summary fields on **each event**:

### Example (no budget yet) — matches current frontend sample

```json
{
  "_id": "6a560dd7145c50b5dbd196e0",
  "eventName": {
    "_id": "695b86a68517cfd3a6730e0c",
    "name": "Engagement"
  },
  "clientName": "Poorna Varun",
  "eventConfirmation": "Confirmed Event",
  "eventTypes": [],
  "budgetReport": null,
  "budgetReportsCount": 0
}
```

### Example (budget Excel exists)

```json
{
  "_id": "6a560dd7145c50b5dbd196e0",
  "eventName": {
    "_id": "695b86a68517cfd3a6730e0c",
    "name": "Engagement"
  },
  "clientName": "Poorna Varun",
  "eventConfirmation": "Confirmed Event",
  "budgetReport": {
    "_id": "686f1a2b3c4d5e6f7a8b9c0d",
    "module": "budget-report",
    "key": "6a560dd7145c50b5dbd196e0",
    "title": "Budget Report — Engagement - Poorna Varun",
    "version": 4,
    "updatedAt": "2026-07-18T06:15:00.000Z",
    "meta": {
      "eventId": "6a560dd7145c50b5dbd196e0",
      "eventName": "Engagement",
      "clientName": "Poorna Varun",
      "sheetCount": 3,
      "sheetNames": ["Summary", "Vendors", "Payments"],
      "cellCount": 842
    }
  },
  "budgetReportsCount": 1
}
```

### Field rules

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `budgetReport` | object \| `null` | yes | **Never** embed full `workbookData` in list payloads (too large). Meta only. |
| `budgetReportsCount` | number | yes | `0` if none; `1` when Excel workbook exists for this event (one workbook per event). |

**Frontend presence check** (any of these → show **View**):

- `budgetReportsCount > 0`
- `budgetReport` is a non-empty string id
- `budgetReport` is a non-empty object (`_id` / `key` / `module` / etc.)

If both are `null` / `0`, UI shows the **Budget** button.

---

## Storage model (Excel workbook)

Budget reports are stored in the shared collection **`spreadsheet_workbooks`**:

| Field | Value for budget report |
|-------|-------------------------|
| `module` | `"budget-report"` |
| `key` | **Event Mongo `_id`** (string), e.g. `"6a560dd7145c50b5dbd196e0"` |
| `workbookData` | Full Univer `IWorkbookData` (all sheets) |
| `meta.eventId` | Same as `key` |
| `meta.eventName` / `meta.clientName` | For list labels |
| `meta.sheetCount` | Optional denormalized count |
| `version` | Optimistic concurrency integer |

**Unique index:** `{ module: 1, key: 1 }`

Full details: `BUDGET_REPORT_EXCEL_BACKEND_SCHEMA.md`.

### How to populate `budgetReport` on GET /events

When serializing each event:

```js
const wb = await SpreadsheetWorkbook.findOne({
  module: "budget-report",
  key: String(event._id),
}).select("-workbookData"); // IMPORTANT: exclude heavy workbookData

if (wb) {
  event.budgetReport = {
    _id: wb._id,
    module: wb.module,
    key: wb.key,
    title: wb.title,
    version: wb.version,
    updatedAt: wb.updatedAt,
    meta: wb.meta || {},
  };
  event.budgetReportsCount = 1;
} else {
  event.budgetReport = null;
  event.budgetReportsCount = 0;
}
```

For list endpoints, prefer a **single aggregation / `$lookup`** (or batch `find({ module, key: { $in: eventIds } })`) instead of N+1 queries.

---

## API endpoints used by Client Bookings cell

Base URL: `${API_BASE_URL}`

Auth header (same as rest of dashboard):

```http
Authorization: <access_token>
```

### 1. Events list (already exists — extend response)

```http
GET /events?page=1&limit=...
```

**Must return** `budgetReport` + `budgetReportsCount` as above on every event.

---

### 2. Get Excel workbook for View / Edit

```http
GET /spreadsheet-workbooks?module=budget-report&key=<eventId>
```

Returns full `workbookData` (all sheets).  
Frontend route: `/user/budgetreport/view/<eventId>` or `/edit/<eventId>`.

---

### 3. Create / save Excel for Add new

```http
PUT /spreadsheet-workbooks
```

```json
{
  "module": "budget-report",
  "key": "<eventId>",
  "title": "Budget Report — Engagement - Poorna Varun",
  "workbookData": { "...": "full IWorkbookData" },
  "version": 0,
  "meta": {
    "eventId": "<eventId>",
    "eventName": "Engagement",
    "clientName": "Poorna Varun",
    "sheetCount": 2,
    "sheetNames": ["Sheet1", "Sheet2"],
    "cellCount": 120
  }
}
```

After save, subsequent `GET /events` for that event must show `budgetReportsCount: 1` and a non-null `budgetReport` meta object.

---

### 4. List workbooks (clone source dropdown)

```http
GET /spreadsheet-workbooks?module=budget-report&list=1
```

Return **metadata only** (no `workbookData`):

```json
{
  "data": [
    {
      "_id": "...",
      "module": "budget-report",
      "key": "<sourceEventId>",
      "title": "Budget Report — Wedding - Priya",
      "meta": {
        "eventId": "<sourceEventId>",
        "eventName": "Wedding",
        "clientName": "Priya",
        "sheetCount": 3
      },
      "version": 2,
      "updatedAt": "2026-07-17T10:00:00.000Z"
    }
  ]
}
```

Frontend also falls back to `GET /events` filtered by `budgetReport != null` if this list endpoint is missing (`404`/`501`).

---

### 5. Clone budget report onto another event (**required for Clone menu**)

#### Preferred endpoint

```http
POST /spreadsheet-workbooks/clone
Content-Type: application/json
```

**Body**

```json
{
  "module": "budget-report",
  "sourceKey": "<sourceEventId>",
  "targetKey": "<targetEventId>",
  "meta": {
    "eventId": "<targetEventId>",
    "eventName": "Engagement",
    "clientName": "Poorna Varun"
  }
}
```

**Server behaviour (exact)**

1. Load source document: `{ module: "budget-report", key: sourceKey }`.
2. If missing → `404` `{ "message": "Source budget report not found" }`.
3. If `sourceKey === targetKey` → `400`.
4. If target already exists for `(module, targetKey)` → `409`  
   `{ "message": "Target event already has a budget report" }`.
5. Create **new** document:
   - `module`: `"budget-report"`
   - `key`: `targetKey`
   - `workbookData`: **deep copy** of source `workbookData` (entire multi-sheet JSON — do not share references)
   - `title`: optional from body, or derive from target meta
   - `meta`: merge body `meta` with refreshed `sheetCount` / `sheetNames` from the copied workbook
   - `version`: `1`
   - `createdBy` / `updatedBy`: current user
6. Return the new document (may omit `workbookData` in response if large; frontend reloads list via `onAfterMutation`).

**Success `201` or `200`**

```json
{
  "_id": "...",
  "module": "budget-report",
  "key": "<targetEventId>",
  "title": "Budget Report — Engagement - Poorna Varun",
  "meta": {
    "eventId": "<targetEventId>",
    "eventName": "Engagement",
    "clientName": "Poorna Varun",
    "sheetCount": 3
  },
  "version": 1,
  "updatedAt": "2026-07-18T10:00:00.000Z"
}
```

**Errors**

| Status | When |
|--------|------|
| `400` | Missing/invalid `module`, `sourceKey`, `targetKey` |
| `401` | Unauthorized |
| `404` | Source workbook missing |
| `409` | Target already has a workbook |
| `413` | Copied payload too large (should be rare if source already stored) |

#### Frontend fallback (if clone endpoint is `404`/`501`)

1. `GET` source workbook (full `workbookData`)
2. `PUT` under `targetKey` with `version: 0` (create)
3. If target already has data → error shown in UI

So implementing the dedicated **clone** endpoint is strongly recommended for performance (avoids downloading large JSON to the browser).

#### Legacy (optional)

Older AG Grid reports may still support:

```http
POST /budget-report/:sourceReportId/clone
{ "eventId": "<targetEventId>" }
```

Frontend only uses this if Excel source has no `workbookData` but a legacy report id exists.

---

## Multi-sheet clone rules (critical)

When cloning:

- Copy **entire** `workbookData`: `sheetOrder`, every `sheets[id]`, all `cellData`, `styles`, `resources`.
- Do **not** clone only the active sheet.
- Do **not** mutate the source document.
- Target must be a **new** document under a different `key` (event id).

---

## Suggested Mongoose / handler sketch

```js
// Enrich events list
async function attachBudgetReportMeta(events) {
  const ids = events.map((e) => String(e._id));
  const wbs = await SpreadsheetWorkbook.find({
    module: "budget-report",
    key: { $in: ids },
  }).select("-workbookData");

  const byKey = new Map(wbs.map((w) => [String(w.key), w]));

  return events.map((e) => {
    const wb = byKey.get(String(e._id));
    if (!wb) {
      return { ...e.toObject?.() ?? e, budgetReport: null, budgetReportsCount: 0 };
    }
    return {
      ...e.toObject?.() ?? e,
      budgetReport: {
        _id: wb._id,
        module: wb.module,
        key: wb.key,
        title: wb.title,
        version: wb.version,
        updatedAt: wb.updatedAt,
        meta: wb.meta || {},
      },
      budgetReportsCount: 1,
    };
  });
}

// Clone
router.post("/spreadsheet-workbooks/clone", auth, async (req, res) => {
  const { module, sourceKey, targetKey, meta } = req.body;
  if (module !== "budget-report") {
    return res.status(400).json({ message: "Unsupported module" });
  }
  if (!sourceKey || !targetKey || sourceKey === targetKey) {
    return res.status(400).json({ message: "Invalid sourceKey/targetKey" });
  }

  const source = await SpreadsheetWorkbook.findOne({ module, key: sourceKey });
  if (!source) {
    return res.status(404).json({ message: "Source budget report not found" });
  }

  const existing = await SpreadsheetWorkbook.findOne({ module, key: targetKey });
  if (existing) {
    return res.status(409).json({ message: "Target event already has a budget report" });
  }

  // Deep copy JSON
  const workbookData = JSON.parse(JSON.stringify(source.workbookData));

  const created = await SpreadsheetWorkbook.create({
    module,
    key: targetKey,
    title: req.body.title || source.title,
    workbookData,
    meta: {
      ...(source.meta || {}),
      ...(meta || {}),
      eventId: targetKey,
    },
    version: 1,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  const out = created.toObject();
  delete out.workbookData; // optional for response size
  return res.status(201).json(out);
});
```

---

## Frontend wiring (already implemented)

| Action | Frontend behaviour |
|--------|-------------------|
| View | `navigate(/user/budgetreport/view/:eventId)` when `budgetReport` / count present |
| Add new | `navigate(/user/budgetreport, { state: { preselectedEventId } })` |
| Clone | `POST /spreadsheet-workbooks/clone` → fallback GET+PUT copy |
| After clone | `onAfterMutation()` refreshes bookings list |

Helpers: `eventHasBudgetReport`, `cloneBudgetReportWorkbook`, `fetchBudgetReportCloneSources` in  
`budgetreport/excel/budgetReportExcelApi.js`.

---

## Minimal acceptance checklist for backend

- [ ] `GET /events` (and client-bookings list) returns `budgetReport` + `budgetReportsCount` on every event
- [ ] List embed **excludes** `workbookData`
- [ ] Workbook stored as `module=budget-report`, `key=<eventId>`
- [ ] After PUT save, list shows `budgetReportsCount: 1`
- [ ] `GET /spreadsheet-workbooks?module=budget-report&list=1` returns clone sources (meta only)
- [ ] `POST /spreadsheet-workbooks/clone` deep-copies full multi-sheet `workbookData`
- [ ] Clone rejects same source/target (`400`) and existing target (`409`)
- [ ] View/Edit GET returns full workbook so all sheets open

---

## Summary for backend team

1. **One Excel workbook per event:** `spreadsheet_workbooks` with `module: "budget-report"`, `key: event._id`.
2. **Events list:** attach lightweight `budgetReport` meta + `budgetReportsCount` (0 or 1).
3. **View / Add / Edit:** use existing GET/PUT workbook APIs by event id.
4. **Clone:** implement `POST /spreadsheet-workbooks/clone` as a full deep copy onto the target event key.
5. Never send full `workbookData` inside the bookings/events list payload.

This is the complete contract the Client Bookings **Budget Report** column depends on.
