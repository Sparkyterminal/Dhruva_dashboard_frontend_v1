# Bookings Dashboard — Agreed Amount & Payment Balance (Backend Schema)

Share this with the backend team. The Marketing **Bookings Dashboard** (`ViewInflow.jsx`) and Accounts client bookings list use the same payment display rules.

**Frontend:** `src/Dashboard/Marketting/ViewInflow.jsx`  
**Endpoints:** `GET /events` and `GET /events/my-events`

---

## Problem (current vs required)

### Current (incorrect for UI)

| Area | Current behaviour | Issue |
|------|-------------------|--------|
| Table **Balance** | Shows **expected advance** total | Should be **agreed − received** |
| Table **% Collected** | `received / expectedAdvance` | Should be `received / agreedAmount` |
| Summary **Pending** | `totalExpectedAdvance − totalReceivedAmount` | Should be **totalAgreedAmount − totalReceivedAmount** |

Example from production data:

| Field | Value |
|-------|------:|
| `eventTypes[0].agreedAmount` | ₹9,50,000 |
| `advanceTotals.totalReceivedAmount` | ₹50,000 |
| **Correct balance** | **₹9,00,000** |
| Old `totalExpectedAdvance` (advances only) | ₹50,000 → wrong denominator |

---

## Per-booking money rules (must match frontend)

These rules apply to **each event document** in `events[]`.

### 1. Agreed amount (`_agreed`)

| Case | Rule |
|------|------|
| `eventName` is **Wedding** AND `advancePaymentType === "complete"` | Use **`eventTypes[0].agreedAmount`** only (whole package) |
| All other bookings | **Sum** `eventTypes[].agreedAmount` (treat missing as `0`) |

Round to **whole rupees** before storing in rollups.

```js
function getBookingAgreedAmount(event) {
  const isCompleteWedding =
    event?.eventName?.name === "Wedding" &&
    event?.advancePaymentType === "complete";

  if (isCompleteWedding) {
    return Math.round(Number(event?.eventTypes?.[0]?.agreedAmount) || 0);
  }

  return Math.round(
    (event?.eventTypes || []).reduce(
      (sum, et) => sum + (Number(et?.agreedAmount) || 0),
      0,
    ),
  );
}
```

### 2. Received amount (`_received`)

| Case | Rule |
|------|------|
| Wedding + `advancePaymentType === "complete"` | **Deduplicate** by `advanceNumber` (fallback index) across all `eventTypes`. For each key take **max** `receivedAmount`, then sum. Do **not** flat-sum every ceremony (that double-counts copied schedules). |
| All other bookings | Sum `eventTypes[].advances[].receivedAmount` (non-numeric / null → `0`) |

See also: `src/Dashboard/Accounts/clientBookings/COMPLETE_WEDDING_ADVANCE_TOTALS_BACKEND.md` (full example + acceptance checklist).

```js
function isCompletePaymentWedding(event) {
  const name =
    typeof event?.eventName === "string"
      ? event.eventName
      : event?.eventName?.name;
  return name === "Wedding" && event?.advancePaymentType === "complete";
}

function getBookingReceivedAmount(event) {
  if (isCompletePaymentWedding(event)) {
    const byKey = new Map();
    for (const et of event?.eventTypes || []) {
      (et?.advances || []).forEach((adv, idx) => {
        const key =
          adv?.advanceNumber != null && adv.advanceNumber !== ""
            ? `n:${adv.advanceNumber}`
            : `i:${idx}`;
        const amt = Number(adv?.receivedAmount);
        const value = Number.isFinite(amt) ? amt : 0;
        const prev = byKey.get(key) ?? 0;
        if (value > prev) byKey.set(key, value);
      });
    }
    let total = 0;
    for (const v of byKey.values()) total += v;
    return Math.round(total);
  }

  let total = 0;
  for (const et of event?.eventTypes || []) {
    for (const adv of et?.advances || []) {
      total += Number(adv?.receivedAmount) || 0;
    }
  }
  return Math.round(total);
}
```

Prefer exposing this on each event as **`advanceTotals.totalReceivedAmount`** (must follow the rules above).

### 3. Balance / pending per booking

```text
balanceAmount = max(0, agreedAmount − receivedAmount)
```

Optional denormalized fields on each event (recommended):

```json
"advanceTotals": {
  "totalExpectedAdvance": 50000,
  "totalReceivedAmount": 50000,
  "pendingAdvanceAmount": 0,
  "advanceEntriesCount": 1,
  "agreedAmount": 950000,
  "pendingAmount": 900000
}
```

| New field | Formula |
|-----------|---------|
| `advanceTotals.agreedAmount` | `_agreed` for this booking |
| `advanceTotals.pendingAmount` | `max(0, agreedAmount − totalReceivedAmount)` |

Keep existing `totalExpectedAdvance` for advance-schedule features; do **not** use it for dashboard balance.

---

## List response `summary` block

Both **`GET /events`** and **`GET /events/my-events`** should return consistent summary money fields when `summary` is included.

### Required summary fields (updated)

```json
{
  "summary": {
    "summaryScope": "allBookingsMatchingFilter",
    "totalBookings": 18,
    "bookingsInResponse": 10,

    "totalAgreedAmount": 12500000,
    "totalReceivedAmount": 15159910,
    "totalPendingAmount": 734010,

    "totalAdvanceEntries": 52,
    "totalExpectedAdvance": 23449000,
    "totalPayableSum": 14868830
  }
}
```

| Field | Type | Required for new UI | Description |
|-------|------|---------------------|-------------|
| `totalAgreedAmount` | number | **Yes** | Sum of `_agreed` for all bookings matching the **same filter as the list** (not only current page) |
| `totalReceivedAmount` | number | **Yes** | Sum of `_received` for those bookings |
| `totalPendingAmount` | number | **Yes** | `max(0, totalAgreedAmount − totalReceivedAmount)` |
| `totalExpectedAdvance` | number | Optional (legacy) | Sum of advance `expectedAmount` — keep for reports, not for balance UI |
| `totalPendingAdvance` | number | Deprecated | Replace with `totalPendingAmount` |
| `totalPayableSum` | number | Optional | Sum of payable (unchanged) |

### Formulas

```js
totalAgreedAmount = sum(getBookingAgreedAmount(event) for each event in filtered set)
totalReceivedAmount = sum(getBookingReceivedAmount(event) for each event in filtered set)
totalPendingAmount = max(0, totalAgreedAmount - totalReceivedAmount)
```

**Important:** Summary must cover **all** bookings matching filters (`totalBookings`), not only `bookingsInResponse` on the current page.

---

## `GET /events` — `totalsByStatus` (optional enhancement)

If Accounts dashboard should also use agreed-based totals, add parallel fields under each bucket (e.g. `confirmed`):

```json
"confirmed": {
  "totalExpectedAmount": 137406436,
  "totalAgreedAmount": 140000000,
  "totalReceivedAmount": 55013910,
  "totalBalanceAmount": 84986090,
  "totalBookingsNumber": 68
}
```

| Field | Description |
|-------|-------------|
| `totalAgreedAmount` | Sum of `_agreed` in this bucket |
| `totalReceivedAmount` | Sum of `_received` in this bucket |
| `totalBalanceAmount` | Sum of per-booking `max(0, agreed − received)` |

Existing `totalExpectedAmount` (payable-based) can remain for backward compatibility.

---

## Example booking (from API)

```json
{
  "_id": "6a7053e07ffe98946772752c",
  "eventName": { "name": "Engagement" },
  "eventTypes": [
    {
      "agreedAmount": 950000,
      "advances": [
        { "expectedAmount": 50000, "receivedAmount": 50000 }
      ]
    }
  ],
  "advanceTotals": {
    "totalExpectedAdvance": 50000,
    "totalReceivedAmount": 50000,
    "pendingAdvanceAmount": 0,
    "advanceEntriesCount": 1,
    "agreedAmount": 950000,
    "pendingAmount": 900000
  }
}
```

**UI table row:**

| Agreed Amount | Received | Balance |
|--------------:|---------:|--------:|
| ₹9,50,000 | ₹50,000 | ₹9,00,000 |

---

## Wedding with `advancePaymentType: "separate"`

```json
{
  "eventName": { "name": "Wedding" },
  "advancePaymentType": "separate",
  "eventTypes": [
    { "eventType": { "name": "Reception" }, "agreedAmount": 1425000, "advances": [...] },
    { "eventType": { "name": "Muhurtham" }, "agreedAmount": 0, "advances": [...] }
  ]
}
```

**Agreed amount** = `1425000 + 0` = **₹14,25,000** (sum all event types).

---

## Wedding with `advancePaymentType: "complete"`

Use **only** `eventTypes[0].agreedAmount` even if other types exist.

---

## Frontend integration (already wired)

| UI location | Logic |
|-------------|--------|
| Column **Agreed Amount** | `getTotalAgreedAmount(record)` |
| Payment Status **Received** | `advanceTotals.totalReceivedAmount` or sum of `advances[].receivedAmount` |
| Payment Status **Balance** | `max(0, agreed − received)` |
| Summary **Total Agreed Amount** | `summary.totalAgreedAmount` |
| Summary **Received Amount** | `summary.totalReceivedAmount` |
| Summary **Pending Amount** | `summary.totalAgreedAmount − summary.totalReceivedAmount` |

Until `totalAgreedAmount` is deployed, summary cards may fall back to summing the **current page** only; backend should add `totalAgreedAmount` for accurate filter-wide totals.

---

## Acceptance checklist

- [ ] Per booking: `advanceTotals.agreedAmount` and `advanceTotals.pendingAmount` (or equivalent) computed with rules above
- [ ] `GET /events/my-events` `summary.totalAgreedAmount` = sum of agreed for full filtered set
- [ ] `summary.totalPendingAmount` = `totalAgreedAmount − totalReceivedAmount` (not expected-advance based)
- [ ] `GET /events` returns the same summary shape when applicable
- [ ] Wedding `complete` uses first event type agreed amount only
- [ ] Wedding `separate` / non-wedding sums all `eventTypes[].agreedAmount`
- [ ] Monetary values rounded to whole rupees in JSON

---

## Summary for backend team

1. **Agreed amount** drives the dashboard — not expected advance or payable alone.
2. **Balance** per booking = **agreed − received**.
3. Add **`summary.totalAgreedAmount`** and **`summary.totalPendingAmount`** on both list endpoints.
4. Optionally extend **`advanceTotals`** on each event with `agreedAmount` and `pendingAmount`.
