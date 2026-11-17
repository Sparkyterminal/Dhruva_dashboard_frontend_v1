# Advance Calendar — Backend Notes

**Screen:** "Advance Calendar" tab (Accounts home, CA home, Client Bookings page)
**Code:** `src/Components/AdvanceCalenderClients.jsx`
**Endpoint used:** `GET /events` (no new endpoint)

## Status: no backend change is required for the current version

The frontend was fixed entirely on its side. This file records what it relies on, so the backend does not break it, plus optional improvements for the future.

## What the screen sends

```
GET /events?status=confirmed&limit=100&startDate=<dataCutoffDate>&page=1..N
Authorization: <access_token>
```

It follows `totalPages` until the last page, then keeps only events where `eventConfirmation === "Confirmed Event"` (the same rule as the Confirmed calendar).

## What the screen relies on (please keep stable)

| Field | Use |
|---|---|
| `eventConfirmation` | must be `"Confirmed Event"` for an event to appear |
| `eventTypes[].advances[].advanceDate` | day the advance is due; advances without it are skipped |
| `eventTypes[].advances[].advanceNumber` | label, and the de-duplication key for complete-package weddings |
| `eventTypes[].advances[].expectedAmount` | expected amount |
| `eventTypes[].advances[].receivedAmount` | **source of truth for received/pending** |
| `advancePaymentType === "complete"` (Wedding) | the schedule is shown once, not once per ceremony |
| `totalPages` | pagination |

## Rules the screen applies (must match the backend's own totals)

- **Received** = `receivedAmount > 0` and `receivedAmount >= expectedAmount`.
- **Partly received** = `receivedAmount > 0` but below `expectedAmount`.
- **Pending** = nothing received. The advance's saved `status` text is ignored, because it can say `Pending` while money is already received.
- **Pending amount** = `max(expectedAmount - receivedAmount, 0)`; it is never negative.
- **Complete-package weddings:** advances are de-duplicated by `advanceNumber` across ceremonies, keeping the one with the highest `receivedAmount`. This is the same rule as `COMPLETE_WEDDING_ADVANCE_TOTALS_BACKEND.md`.
- Dates are shown on the user's local calendar day. `advanceDate` is stored in UTC (midnight IST = 18:30 UTC the previous day), so the backend must keep sending the full ISO timestamp and not truncate it to a date.

## Optional future improvements (not needed now)

1. **Fix `advanceTotals` for complete packages** (already requested in `docs/api/client-bookings/COMPLETE_WEDDING_ADVANCE_TOTALS_BACKEND.md`). Until then the frontend computes its own totals from the raw advances.
2. **Month-scoped query.** Today the screen downloads all confirmed events and groups by month in the browser. If this gets slow, add `advanceFrom` / `advanceTo` filters to `GET /events` that return only events having an advance due in the range.
3. **Server-side advance state.** Add a derived `advance.state` (`received | partial | pending`) using the rules above, so the frontend and reports never disagree with the stored `status`.
4. **Backfill stale `status`.** Set `advances[].status` to `Received` when `receivedAmount > 0` and covers `expectedAmount`. Only on the owner's explicit request, after a JSON backup.

## How it was tested (frontend, mocked API)

A mocked `/events` response (IST browser) with:
- a normal booking with 3 advances (received / partly received / pending),
- a complete-package wedding with the same two advances copied onto 3 ceremonies, with different received amounts,
- a cancelled event and an advance without a date (both must be ignored),
- an advance in the following month.

Expected for November 2026 (calculated by hand): expected ₹1,95,000, received ₹1,35,000, pending ₹60,000, 2 of 5 received. The screen showed exactly these values. The next month showed ₹8,000 pending, 0 of 1. Each advance appeared on its correct IST day.
