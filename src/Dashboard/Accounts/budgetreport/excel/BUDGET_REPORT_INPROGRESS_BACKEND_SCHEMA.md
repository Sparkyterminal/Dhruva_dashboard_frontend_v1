# Budget Report Excel — Support InProgress Events (Backend)

Share this with the backend team. Frontend now allows **budget report Excel** for both:

| `eventConfirmation` | Eligible? |
|---------------------|-----------|
| `"Confirmed Event"` | Yes |
| `"InProgress"` | **Yes (new)** |
| `"Cancelled"` | No |

**Frontend:** `src/Dashboard/Accounts/budgetreport/excel/`  
**Related full contract:** `BUDGET_REPORT_EXCEL_BACKEND_SCHEMA.md`

---

## What changed on frontend

1. Create dropdown loads **Confirmed + InProgress** events (not confirmed-only).
2. List enrichment / fallback uses the same allowlist.
3. Workbook storage is unchanged: still `module=budget-report`, `key=<eventId>`.

---

## Required backend behaviour

### 1. Do **not** reject InProgress keys

If PUT/GET currently validates:

```text
event must have eventConfirmation === "Confirmed Event"
```

**Change to** allow either:

```text
eventConfirmation === "Confirmed Event"
OR
eventConfirmation === "InProgress"
```

Reject only cancelled / unknown statuses (optional but recommended).

### 2. Events list filters (already supported)

Frontend may call:

```http
GET /events?page=1&limit=1000&status=confirmed
GET /events?page=1&limit=1000&status=inprogress
```

| Query `status` | Maps to `eventConfirmation` |
|----------------|-----------------------------|
| `confirmed` | `Confirmed Event` |
| `inprogress` | `InProgress` |

Ensure both return the full event documents (same shape as today). Frontend merges both lists client-side.

Fallback if status filter fails: `GET /events?page=1&limit=1000` and filter by `eventConfirmation` in the app.

### 3. Spreadsheet workbook APIs (no schema change)

| Action | Endpoint |
|--------|----------|
| Load | `GET /spreadsheet-workbooks?module=budget-report&key=<eventId>` |
| Save | `PUT /spreadsheet-workbooks` |
| List | `GET /spreadsheet-workbooks?module=budget-report&list=1` |

`key` remains the event Mongo `_id` whether the event is confirmed or in progress.

Optional `meta` on PUT (unchanged):

```json
{
  "eventId": "<eventId>",
  "eventName": "Wedding",
  "clientName": "…",
  "eventConfirmation": "InProgress",
  "sheetCount": 2,
  "sheetNames": ["Sheet1", "Costs"],
  "cellCount": 120
}
```

Frontend may send `meta.eventConfirmation` when known; backend can also set it from the event document on save.

### 4. Optional validation sketch

```js
const ELIGIBLE = new Set(["Confirmed Event", "InProgress"]);

async function assertBudgetReportEvent(eventId) {
  const event = await Event.findById(eventId).lean();
  if (!event) {
    const err = new Error("Event not found");
    err.status = 404;
    throw err;
  }
  if (!ELIGIBLE.has(event.eventConfirmation)) {
    const err = new Error(
      "Budget report Excel is only allowed for Confirmed Event or InProgress bookings.",
    );
    err.status = 400;
    throw err;
  }
  return event;
}

// On PUT /spreadsheet-workbooks when module === "budget-report":
// await assertBudgetReportEvent(req.body.key);
```

### 5. Status change after workbook exists

If an InProgress event later becomes Confirmed (or vice versa), the same workbook document remains valid (`key` is still the event id). No migration needed.

If an event becomes **Cancelled**, decide product policy:

| Policy | Behaviour |
|--------|-----------|
| **Recommended** | Keep existing workbook (GET/list still work); block new PUT with `400` |
| Alternative | Allow edit until deleted |

---

## Acceptance checklist

- [ ] PUT `module=budget-report` + `key=<InProgress event id>` succeeds (same as Confirmed)
- [ ] GET by that key returns full `workbookData`
- [ ] Optional validation accepts `"Confirmed Event"` and `"InProgress"` only
- [ ] `GET /events?status=inprogress` returns InProgress bookings
- [ ] `GET /events?status=confirmed` returns Confirmed bookings
- [ ] List workbooks still returns meta rows for both statuses
- [ ] No unique-index change (still unique on `{ module, key }`)

---

## Summary for backend team

1. Budget report Excel is no longer confirmed-only — **InProgress** is allowed.
2. Storage model is unchanged (`budget-report` + event id).
3. Relax any server-side “confirmed only” check to include **`InProgress`**.
4. Keep `status=confirmed` / `status=inprogress` filters on `GET /events` working.

Frontend is already calling this contract.
