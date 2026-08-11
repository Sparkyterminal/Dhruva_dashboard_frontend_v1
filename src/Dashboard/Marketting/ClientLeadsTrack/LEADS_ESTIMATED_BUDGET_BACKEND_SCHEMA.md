# Client Leads — Estimated Budget & Marketing Conversion (Backend Schema)

Share this with the backend team. Marketing Track Leads shows **Estimated Budget** and **Successfully Converted** cards, filtered by the lead’s **event `startDate`**.

**Frontend:** `src/Dashboard/Marketting/ClientLeadsTrack/`  
**Endpoints:** `GET/POST/PUT /client-leads`, `GET/PUT /client-leads/:id`

---

## Why this exists

When marketing converts a lead into a **Client Booking**, the same money must not stay in the pipeline **Estimated Budget** card. Marking **Lead Successfully Converted By Marketing Team** moves that lead’s `estimatedBudget` into a separate **Successfully Converted** card. Conversion is **independent of `status`** (`Inprogress` / `Confirmed` / `Cancelled`).

---

## New / updated fields on Client Lead

| Field | Type | Required | Notes |
|-------|------|:--------:|-------|
| `estimatedBudget` | number | Yes* | ≥ 0. Whole rupees preferred. Kept after conversion (do **not** zero it). |
| `convertedByMarketing` | boolean | No | Default `false`. When `true`, amount counts toward Converted card only. |
| `convertedAt` | string (ISO datetime) \| null | No | Set when flag becomes `true`; clear to `null` when unchecked. Audit only — **cards still filter by `startDate`**. |

\*Frontend treats budget as required for accurate cards. Backend may accept omit as `0` for legacy rows.

Existing fields unchanged: `status`, `clientDetails`, `eventTypeDetails`, `notes`, `assignedTo`, `startDate`, `endDate`.

---

## Card math (must match frontend)

Filter leads whose **`startDate`** falls in the selected month / range (inclusive). Then:

```text
totalEstimatedBudget  = sum(estimatedBudget) where convertedByMarketing !== true
totalConvertedBudget  = sum(estimatedBudget) where convertedByMarketing === true
estimatedLeadsCount   = count of leads in estimated set (with numeric budget)
convertedLeadsCount   = count of leads in converted set
```

When a month/range filter is active, leads **without** `startDate` are excluded from both card totals (they may still appear in the unfiltered list if no date filter is sent).

---

## `GET /client-leads` — query params

| Name | Type | Notes |
|------|------|-------|
| `status` | string | Existing |
| `assignedTo` | string | Existing (coordinator id) |
| `startDate` | `YYYY-MM-DD` | Inclusive lower bound on lead **`startDate`** |
| `endDate` | `YYYY-MM-DD` | Inclusive upper bound on lead **`startDate`** |
| `month` | `YYYY-MM` | Optional shorthand: expand to first/last day of that month on lead `startDate`. If both `month` and `startDate`/`endDate` are sent, prefer **explicit range**. |

### Example

```http
GET /client-leads?month=2026-08&status=Inprogress
GET /client-leads?startDate=2026-08-01&endDate=2026-08-31
Authorization: <jwt>
```

### Response (add `summary`)

```json
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "status": "Inprogress",
      "clientDetails": "...",
      "eventTypeDetails": "...",
      "notes": "...",
      "startDate": "2026-08-15",
      "endDate": "2026-08-17",
      "estimatedBudget": 500000,
      "convertedByMarketing": false,
      "convertedAt": null,
      "assignedTo": { "_id": "...", "name": "..." }
    }
  ],
  "summary": {
    "totalEstimatedBudget": 1200000,
    "totalConvertedBudget": 800000,
    "estimatedLeadsCount": 3,
    "convertedLeadsCount": 2
  }
}
```

`summary` must respect the **same** filters as `data` (status, assignedTo, startDate range / month).

---

## Create / Update

### `POST /client-leads`

```json
{
  "status": "Inprogress",
  "clientDetails": "Client name: ABC Corp...",
  "eventTypeDetails": "Wedding...",
  "notes": "...",
  "assignedTo": "696f832492c5abff543b25bc",
  "startDate": "2026-08-15",
  "endDate": "2026-08-17",
  "estimatedBudget": 500000,
  "convertedByMarketing": false,
  "convertedAt": null
}
```

### `PUT /client-leads/:id` (mark converted)

```json
{
  "estimatedBudget": 500000,
  "convertedByMarketing": true,
  "convertedAt": "2026-08-10T09:30:00.000Z"
}
```

### Uncheck conversion

```json
{
  "convertedByMarketing": false,
  "convertedAt": null
}
```

Do **not** clear `estimatedBudget` when converting.

### Validation

1. `estimatedBudget` number ≥ 0 (if provided).
2. `convertedByMarketing` boolean.
3. If `convertedByMarketing === true` and `convertedAt` omitted, server may set `convertedAt = now`.
4. If `convertedByMarketing === false`, set `convertedAt = null`.

---

## Suggested schema snippet

```js
{
  estimatedBudget: { type: Number, min: 0, default: 0 },
  convertedByMarketing: { type: Boolean, default: false },
  convertedAt: { type: Date, default: null },
  startDate: { type: String }, // YYYY-MM-DD — indexed for month/range filters
}
```

```js
db.clientLeads.createIndex({ startDate: 1 });
db.clientLeads.createIndex({ convertedByMarketing: 1, startDate: 1 });
```

---

## Acceptance checklist

- [ ] Create/update accept `estimatedBudget`, `convertedByMarketing`, `convertedAt`
- [ ] List supports `startDate`/`endDate` and/or `month` on lead `startDate`
- [ ] `summary.totalEstimatedBudget` excludes converted leads
- [ ] `summary.totalConvertedBudget` includes only converted leads
- [ ] Converting does not wipe `estimatedBudget`
- [ ] `status: Confirmed` alone does **not** move amount to converted totals

---

## Related

- Example JSON: `clientLeadSchema.example.json`
- UI: `ViewLeads.jsx`, `LeadForm.jsx`
