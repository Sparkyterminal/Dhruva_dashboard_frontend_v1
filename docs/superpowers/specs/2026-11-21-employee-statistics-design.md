# Employee Statistics — Design

**Status:** draft for owner approval. Nothing is built until it is approved.

## 1. Intent

CA, Approver, Owner and the HR department need one good-looking page that answers: **who is booking the most, for how much, and who was on top in each month**. Today the Leaderboard ranks people (most booked, most amount) with an optional month filter, but it cannot show a month-by-month picture, received or pending money, trends, or charts.

## 2. Goals / non-goals / anti-goals

**Goals**
- Per employee: bookings (by status), booked amount, received, pending, conversion, average booking value.
- **Month by month:** who was top in each month (by amount and by bookings), plus an employee × month grid.
- Compare any period with the previous period of the same length (▲ ▼).
- Charts that are easy to read and match the brand; the same page works on a phone.
- Access: **CA, Approver, Owner and the HR DEPARTMENT only**.
- Export to Excel.

**Non-goals (v1)**: targets/goals and incentives, lead-level statistics, employee self-view ("my own stats"), forecasts.
**Anti-goals**: numbers that disagree with the Bookings screens (same money rules), cancelled or almost-booked money mixed into the totals, anyone outside the four groups seeing the page or the API.

## 3. Definitions (so every number means one thing)

- **Employee** = the person a booking is credited to: `bookedBy` (fallback `createdBy`), the same as the Bookings list and the Leaderboard.
- **Month** = the month the booking was **made** (booking created). A switch lets reviewers count by **event date** instead. Default: booking date ("who sold the most this month").
- **Booked amount** = total payable of **Confirmed** bookings, counted with the existing money rules (complete-package weddings once, from the first event type; never summed across all event types). This matches today's "Most amount booked" board.
- **Received** = advances actually received on those bookings (complete packages de-duplicated by advance number, received amount is the truth). **Pending** = booked − received (never below 0).
- **Bookings** = all bookings by status: Confirmed, In progress, Almost booked, Cancelled. In-progress and almost-booked amounts are shown separately as **pipeline** and are **not** added to booked amount; cancelled amount is never counted.
- **Conversion** = confirmed ÷ (confirmed + in progress + almost booked + cancelled).
- **Average booking value** = booked amount ÷ confirmed bookings.
- Money is shown with Indian grouping (₹12,34,567). Data before the configured data floor is never requested or shown, and the floor is never mentioned on the page or in the export.

## 4. The page (`/user/employee-stats`)

1. **Hero + filters.** Period presets (This month, Last 3 months, This year, Custom range), "Count by: Booking date | Event date", Department, Employee (multi-select). Defaults to this year.
2. **KPI cards.** Bookings, Confirmed, Booked amount, Received, Pending, Conversion. Each shows the change against the previous period.
3. **Spotlight.** A gold "Top performer" card (name, department, amount, bookings, share of the total) and an optional "Rising star" (biggest growth against the previous period, minimum 3 bookings).
4. **Month winners.** One card per month in the range: the winner by amount and by bookings, with their numbers. This is the "in which month who top" answer.
5. **Charts** (own-code SVG, brand colours, readable on a phone): monthly trend (bars = booked amount, line = bookings), employee ranking (horizontal bars, switch between Amount / Bookings / Received), and a status mix donut for the whole team.
6. **Employee × month grid.** A heat table: rows = employees, columns = months, shade = amount, crown on each month's winner; totals row and column.
7. **Leaderboard table.** Rank, employee, bookings by status, conversion, booked, received, pending, average value, a tiny monthly sparkline. Sortable. Click a row → a side panel with that person's monthly chart and their bookings.
8. **Export Excel**: By employee · Employee × month · Month winners.

## 5. Approaches considered

1. **Backend aggregate endpoint (recommended).** One call returns totals, per employee, per month and the month winners already calculated. Small payload, fast, one set of rules in one place, and it keeps working as data grows.
2. Build it in the browser from `GET /events` (load every booking, calculate here). Works with today's API but downloads every booking for every visit and duplicates the money rules in a second place; slow as data grows.
3. Extend `/events/leaderboard`. It is built for one ranking with paging; adding months, previous period and winners to it makes it hard to keep correct.

**Charts:** no chart library is installed. Own-code SVG components keep the bundle small and match the design exactly (consistent with the existing own-code kits); adding a library would add a heavy dependency for five simple charts.

## 6. Access

Same people as the expense reviewers (role `CA`, `APPROVER`, `OWNER`, or a user in the department named `HR DEPARTMENT`, `HR` also accepted), through one helper `canViewEmployeeStats(user)` so it can diverge later. Admin, Accounts, Marketing and other staff get no menu entry, the page shows "no access" if opened by link, and the backend answers `403`. HR users are ordinary Department users, so the menu entry is added for them in the Department menu only when the helper says so.

## 7. Constraints

- No backend code in this repo: a full contract with worked numbers goes in `docs/api/employee-stats/`. The page works live only when the backend implements it.
- Reuse: PageKit/FormKit/AdminKit, `ExcelDownloadButton`, the shared Excel layer, brand tokens, Montserrat. No logo or "Dhruva" text. ₹ with Indian grouping. Motion minimal and `prefers-reduced-motion` respected.
- Charts are accessible: each has a text summary, values are readable by keyboard/tooltip, colour is never the only signal, contrast ≥ 4.5:1 for text.
- Lint 0 errors, no new warnings; browser tests only when the owner asks.
