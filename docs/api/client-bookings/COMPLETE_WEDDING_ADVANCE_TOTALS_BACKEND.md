# Complete Wedding — `advanceTotals` Double-Count Fix (Backend)

Share this with the backend team. Frontend already corrects row-level **Received / Balance** for complete-payment weddings; list **summary / totalsByStatus** cards still depend on API rollups until this is fixed.

**Related UI:** Accounts Client Bookings, Marketing Bookings Dashboard (`ViewInflow`)  
**Endpoints:** `GET /events`, `GET /events/my-events`, and any path that builds `advanceTotals` / `_received`

---

## Problem (production example)

Booking: Wedding, `advancePaymentType: "complete"`, package agreed **₹24,00,000**.

Advances actually collected (once for the package):

| Advance # | Received |
|-----------|---------:|
| 1 | ₹1,75,000 |
| 2 | ₹6,50,000 |
| 3 | ₹5,00,000 |
| **Correct total** | **₹13,25,000** |
| **Correct balance** | **₹10,75,000** |

Current API `advanceTotals`:

```json
"advanceTotals": {
  "totalExpectedAdvance": 6625000,
  "totalReceivedAmount": 2150000,
  "pendingAdvanceAmount": 4475000,
  "advanceEntriesCount": 15,
  "agreedAmount": 2400000,
  "pendingAmount": 250000
}
```

| Field | Current (wrong) | Expected |
|-------|----------------:|---------:|
| `totalReceivedAmount` | ₹21,50,000 | ₹13,25,000 |
| `pendingAmount` | ₹2,50,000 | ₹10,75,000 |
| `totalExpectedAdvance` | ₹66,25,000 | ₹13,25,000 (schedule once) |
| `advanceEntriesCount` | 15 | 3 (one schedule) |

### Why it happens

For `advancePaymentType === "complete"`, the **same advance schedule is copied onto every `eventTypes[]` ceremony**. Receipts may be filled on more than one ceremony (e.g. Bride Nelugu + Muhurtham).

Backend currently does:

```text
totalReceivedAmount = sum(eventTypes[].advances[].receivedAmount)   // ALL ceremonies
```

That **double-counts** the same package advances.

`agreedAmount` is already correct for complete (once / from first event type). Received must use the **same “count once” rule**.

---

## Required money rules (must match frontend)

### Detect complete package

```js
function isCompletePaymentWedding(event) {
  const name =
    typeof event?.eventName === "string"
      ? event.eventName
      : event?.eventName?.name;
  return name === "Wedding" && event?.advancePaymentType === "complete";
}
```

### Agreed / payable (unchanged — already correct)

| Case | Rule |
|------|------|
| Complete wedding | `eventTypes[0].agreedAmount` / `totalPayable` only |
| Everything else | Sum across all `eventTypes[]` |

### Received (`_received` / `advanceTotals.totalReceivedAmount`)

| Case | Rule |
|------|------|
| Complete wedding | **Do not** sum every ceremony. Deduplicate by `advanceNumber` (fallback: advance index). For each key, take **max** numeric `receivedAmount` across all event types, then sum those values. |
| Everything else (`separate`, non-wedding, etc.) | Sum `eventTypes[].advances[].receivedAmount` as today |

```js
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

**Why max-per-`advanceNumber` (not only `eventTypes[0]`):**  
Receipts are sometimes saved on a later ceremony while the first ceremony still has `receivedAmount: null`. Using only `[0]` would **lose** those amounts. Deduping keeps every unique advance once and never double-counts.

### Expected advance total (`advanceTotals.totalExpectedAdvance`)

Same complete-wedding rule as received, but on `expectedAmount` (dedupe by `advanceNumber`, take max, then sum).

### Pending vs agreed

```text
advanceTotals.agreedAmount     = getBookingAgreedAmount(event)   // already OK
advanceTotals.totalReceivedAmount = getBookingReceivedAmount(event)
advanceTotals.pendingAmount    = max(0, agreedAmount − totalReceivedAmount)
advanceTotals.pendingAdvanceAmount = max(0, totalExpectedAdvance − totalReceivedAmount)
advanceTotals.advanceEntriesCount  = unique advance keys for complete; else raw entry count
```

### Example after fix (same booking)

```json
"advanceTotals": {
  "totalExpectedAdvance": 1325000,
  "totalReceivedAmount": 1325000,
  "pendingAdvanceAmount": 0,
  "advanceEntriesCount": 3,
  "agreedAmount": 2400000,
  "pendingAmount": 1075000
}
```

---

## Also update aggregate rollups

Wherever `_received` is computed for:

- `summary.totalReceivedAmount`
- `summary.totalPendingAmount` / balance
- `totalsByStatus.*.totalReceivedAmount`
- `totalsByStatus.*.totalBalanceAmount`
- balance-sheet `receivedAmount`

…use **`getBookingReceivedAmount`** above (complete-aware), **not** a flat sum of all nested advances.

Payable / agreed aggregates should keep using the existing complete-wedding payable rule (`eventTypes[0]` only).

---

## Data migration / storage (optional, do not wipe money)

**Do not delete** existing `receivedAmount` values on event types.

Optional cleanup (safe):

1. For complete weddings, treat advances on `eventTypes[0]` as the source of truth going forward when **writing** new receipts.
2. When updating a complete-wedding advance, write the same received fields to all event types **or** only to `[0]` — but **read** path must always dedupe as above so historical double-fills stay correct.

No destructive migration required for the read-path fix.

---

## Acceptance checklist

- [ ] Complete wedding with same advances filled on 2+ ceremonies → `totalReceivedAmount` equals **unique** advance sum (e.g. ₹13,25,000 not ₹21,50,000)
- [ ] `pendingAmount` = `agreedAmount − totalReceivedAmount` (e.g. ₹10,75,000)
- [ ] Receipt only on a non-first ceremony still counted (dedupe, not “first only”)
- [ ] `advancePaymentType === "separate"` (and non-wedding) still sums all event types unchanged
- [ ] `totalsByStatus` / `summary` received & balance use the same per-booking helper
- [ ] Existing advance documents are not cleared or overwritten by a migration that drops money

---

## Frontend interim behaviour

Until backend ships this:

- Client Bookings Payment Status uses local complete-wedding dedupe (ignores inflated `advanceTotals.totalReceivedAmount` for complete packages).
- Marketing `ViewInflow` does the same.
- API summary cards may still show inflated received/balance until this contract is implemented server-side.
