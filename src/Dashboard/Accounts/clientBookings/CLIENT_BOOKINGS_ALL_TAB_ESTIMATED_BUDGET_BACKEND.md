# Client Bookings — "All" tab: add Leads pipeline (`totalEstimatedBudget`) into `totalsByStatus.all`

Share this with the backend team. It covers **one additive change**: expose the Leads
pipeline total inside the same `GET /events` response that already powers the
Client Bookings **All** tab stat cards, so the frontend does not need a second
round-trip / manual merge to show it next to bookings totals.

**Frontend**

| Area | Path |
|------|------|
| Stats cards (All tab) | `src/Dashboard/Accounts/clientBookings/ClientBookingsStatsCards.jsx` |
| Bookings list / tabs | `src/Dashboard/Accounts/clientBookings/ClientBookingsListTab.jsx` |
| Leads tab (reused, read-only) | `src/Dashboard/Accounts/clientBookings/ClientBookingsLeadsTab.jsx` → `src/Dashboard/Marketting/ClientLeadsTrack/ViewLeads.jsx` |
| Leads contract (existing) | `src/Dashboard/Marketting/ClientLeadsTrack/LEADS_TRACKER_VIEW_ONLY_FRONTEND.md` |
| Bookings contract (existing) | `CLIENT_BOOKINGS_VIEW_ONLY_FRONTEND.md` |

---

## Current behaviour (why this is needed)

`ViewClientsBookings.jsx` has two tabs:

1. **List View** — calls `GET /events`, gets `totalsByStatus` (per-status rollups), renders `ClientBookingsStatsCards` for the active tab.
2. **Leads** — renders `<ViewLeads readOnly embedded />`, which independently calls `GET /client-leads` and gets its own `summary.totalEstimatedBudget` (pipeline budget for leads **not yet** `convertedByMarketing`).

These two numbers currently live in **two unrelated API responses**. Product wants the **All** tab's amount cards to also show the Leads pipeline figure (`totalEstimatedBudget`) alongside the existing booking totals, without the frontend having to fetch and stitch together two endpoints just for one stat card.

---

## Required change

`GET /events` — inside the existing `totalsByStatus.all` bucket — add:

| Field | Type | Meaning |
|-------|------|---------|
| `totalEstimatedBudget` | number | Sum of `estimatedBudget` across all **Client Leads** where `convertedByMarketing !== true`. **Identical computation** to the `totalEstimatedBudget` already returned by `GET /client-leads`'s `summary` block. |
| `grandTotalExpectedAmount` | number | `totalsByStatus.all.totalExpectedAmount + totalsByStatus.all.totalEstimatedBudget` (bookings expected + leads pipeline, pre-computed so the frontend doesn't re-derive it). |

Everything else in `totalsByStatus` is **unchanged** — this is a pure addition of two fields inside the existing `all` object.

### Important: this figure is filter-independent

`GET /events` accepts booking-specific filters (`status`, `eventName`, `venue`/`venueLocation`, `startDate`/`endDate` on `eventTypes`). The **Lead** schema has no equivalent fields (leads filter by `assignedTo`, lead `startDate`, `month`) — there is no meaningful way to apply the events-list filters to leads.

So: **`totalEstimatedBudget` must always be the global, unfiltered leads pipeline total** — i.e. the same number `GET /client-leads` returns when called with **no query params**. Do **not** attempt to scope it by whatever `venue`/`eventName`/date params were sent to `/events`. This keeps it consistent no matter which booking filters are active.

---

## Example

### Before (current `totalsByStatus.all`)

```json
{
  "all": {
    "totalExpectedAmount": 263993734,
    "totalBookingsNumber": 192,
    "totalAgreedAmount": 295785321,
    "totalReceivedAmount": 145568911,
    "totalBalanceAmount": 151638411,
    "confirmedTotalExpectedAmount": 213598169,
    "confirmedTotalBookingsNumber": 159,
    "pendingTotalExpectedAmount": 20200000,
    "pendingTotalBookingsNumber": 18
  }
}
```

### After (additive — two new fields only)

```json
{
  "all": {
    "totalExpectedAmount": 263993734,
    "totalBookingsNumber": 192,
    "totalAgreedAmount": 295785321,
    "totalReceivedAmount": 145568911,
    "totalBalanceAmount": 151638411,
    "confirmedTotalExpectedAmount": 213598169,
    "confirmedTotalBookingsNumber": 159,
    "pendingTotalExpectedAmount": 20200000,
    "pendingTotalBookingsNumber": 18,

    "totalEstimatedBudget": 218150000,
    "grandTotalExpectedAmount": 482143734
  }
}
```

(`482143734 = 263993734 + 218150000`, i.e. bookings total expected + leads pipeline estimate.)

Cross-check: this `totalEstimatedBudget` must equal `GET /client-leads` (no params) → `summary.totalEstimatedBudget` at the same point in time.

---

## Implementation sketch

```js
// Alongside the existing events/totalsByStatus aggregation for GET /events
const leadsPipelineAgg = await ClientLead.aggregate([
  { $match: { convertedByMarketing: { $ne: true } } },
  { $group: { _id: null, totalEstimatedBudget: { $sum: "$estimatedBudget" } } },
]);

const totalEstimatedBudget = leadsPipelineAgg[0]?.totalEstimatedBudget ?? 0;

totalsByStatus.all.totalEstimatedBudget = totalEstimatedBudget;
totalsByStatus.all.grandTotalExpectedAmount =
  (totalsByStatus.all.totalExpectedAmount ?? 0) + totalEstimatedBudget;
```

Round the same way money is already rounded elsewhere in `totalsByStatus` (whole rupees).

---

## Non-breaking

- Purely additive fields on `totalsByStatus.all`. No existing field changes shape or meaning.
- No changes to `GET /client-leads` — it keeps returning its own `summary.totalEstimatedBudget` unchanged, since the Leads tab still uses it directly.
- `confirmed` / `pending` / `inprogress` / `cancelled` buckets are **not** touched — this is only requested for `all`.

---

## Acceptance checklist for backend

- [ ] `GET /events` → `totalsByStatus.all.totalEstimatedBudget` added (sum of non-converted leads' `estimatedBudget`, unfiltered by any `/events` query params)
- [ ] `GET /events` → `totalsByStatus.all.grandTotalExpectedAmount` added (`totalExpectedAmount + totalEstimatedBudget`)
- [ ] Value matches `GET /client-leads` (no params) `summary.totalEstimatedBudget` exactly, at the same moment
- [ ] No other bucket (`confirmed`, `pending`, `inprogress`, `cancelled`) is modified
- [ ] No existing `totalsByStatus.all` field renamed, removed, or changed in meaning
- [ ] Money value is a whole-rupee number, consistent with the rest of `totalsByStatus`
