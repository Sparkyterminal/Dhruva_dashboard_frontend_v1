# Bookings List — Event-Date Ordering (Backend, optional)

**Screen:** Bookings Dashboard → List View (`src/Dashboard/Accounts/ViewClientsBookings.jsx`, `clientBookings/ClientBookingsListTab.jsx`)
**Endpoint:** `GET /events`

## Status: no backend change is required for the current version

The list must show **upcoming bookings first (nearest date at the top) and completed ones below (most recent first)**, with an **Event date** column. `GET /events` has no sort option, so the sort cannot be done page by page. The frontend therefore loads every page of the filtered list (`limit=100`, pages 2..N in parallel), sorts in the browser and pages locally. The first response is still used for `totalsByStatus` (stats cards and tab counts).

This is fine for a few hundred bookings. It will get slower as the number of bookings grows (one extra request per 100 bookings on every list load).

## Rules the screen applies (keep identical if the backend ever sorts)

For each booking, look at `eventTypes[].startDate` / `endDate` (local calendar days; stored in UTC, so midnight IST = 18:30 UTC the day before):

1. **Primary event date** = the earliest ceremony whose end day (`endDate`, else `startDate`) is **today or later**. If every ceremony is over, the **latest** ceremony.
2. **Group order:** (0) upcoming or happening now, (1) completed, (2) no event date at all.
3. **Within a group:** upcoming → nearest `startDate` first; completed → most recent first; no-date → by `clientName`.
4. Ties are broken by `clientName` (A–Z).

## Optional improvement: server-side sort

Add to `GET /events` a `sort=eventDate` query param (used together with `page`/`limit`) that returns the same order as above, plus a computed `primaryEventDate` on each row. Then the frontend can go back to normal server paging (one request per page) and drop the load-everything step.

Requirements if implemented:
- The order must match the rules above exactly, across pages (stable sort, `_id` as the last tie-break).
- "Today" must be the owner's local day (IST), not UTC.
- Respect all existing filters (`status`, `eventName`, `venueId`, `startDate`, `endDate`) and keep `totalsByStatus` unchanged.
