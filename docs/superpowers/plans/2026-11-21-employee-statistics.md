# Employee Statistics — Execution Plan

> Task by task; commit after each task. Spec: `docs/superpowers/specs/2026-11-21-employee-statistics-design.md`.

**Goal:** A good-looking Employee Statistics page for CA, Approver, Owner and HR: bookings and amounts per employee, month by month, with the top performer of each month.
**Architecture:** New folder `src/Dashboard/EmployeeStats/`. One backend aggregate call; small pure helpers for derived numbers; own-code SVG charts in `charts/`; one page with sections; route + menu entries for the four groups only.
**Tech:** React 19, PageKit/FormKit/AdminKit, dayjs, exceljs (existing Excel layer), axiosClient. No new dependency.

## Global constraints
Match `docs/api/employee-stats/EMPLOYEE_STATS_BACKEND.md` names exactly. Money rules and definitions from spec section 3. ₹ Indian grouping; no logo/"Dhruva" text; never mention the data floor on the page or in exports. Lint 0 errors, no new warnings.

## Review focus (inputs most likely to bite)
1. Empty or tiny data (one employee, one month, zero bookings) must still look right: no divide-by-zero, no NaN%, no empty charts.
2. A month in the range with no bookings at all (winner = none, not a crash).
3. Ties for top performer (stable, deterministic order, both shown or first by name).
4. Very long names, many employees (30+) and many months (12+) on a phone.
5. Previous period of 0 (change shown as "new", not ∞%).

## Tasks

### 1. Backend contract (docs)
- Create `docs/api/employee-stats/EMPLOYEE_STATS_BACKEND.md`: access rule (CA/APPROVER/OWNER or HR DEPARTMENT, `403` otherwise), `GET /employee-stats` (query `from`, `to`, `dateBasis=booked|event`, `department`, `userId[]`), response (`range`, `months`, `totals`, `previous`, `employees[]` with `totals`, `previous` and `byMonth[]`, `monthly[]`, `monthlyTop[]`), `GET /employee-stats/:userId/bookings` (paged, for the side panel), every definition from spec section 3, indexes, a small worked example with hand-calculated numbers, backend checklist.
- Verify: re-read against the spec. Commit.

### 2. Derived-number helpers + verification script
- `statsMath.js`: `pct(part, whole)`, `changeVsPrevious(current, previous) → { kind: "up"|"down"|"flat"|"new", percent }`, `rankEmployees(employees, metric)`, `topOfMonth(employees, month, metric)`, `shareOfTotal`, `risingStar(employees)`, `heatLevel(value, max)`, `sparkPoints(values, w, h)`.
- Verify with a node script against the worked example in the contract: totals, ties, empty month, previous 0, 1 employee.
- Commit.

### 3. Access, API layer, menu helper
- `src/utils/employeeStatsAccess.js` → `canViewEmployeeStats(user)`.
- `statsApi.js`: `fetchEmployeeStats({ filters, authHeaders })`, `fetchEmployeeBookings({ userId, filters, page, authHeaders })`.
- Verify: node check of the access helper (all four groups yes; Admin, Accounts, Marketing, other no; never by e-mail). Commit.

### 4. Chart components (own-code SVG)
- Before writing: load the `dataviz` skill and follow it (brand-family palette, accessible, light only).
- `charts/BarLineChart.jsx` (monthly trend), `charts/HBarChart.jsx` (ranking), `charts/Donut.jsx` (status mix), `charts/Sparkline.jsx`, `charts/HeatGrid.jsx`; shared `charts/chartTokens.js`. Responsive via `viewBox`, text summary and `<title>` tooltips, keyboard-focusable points.
- Verify: lint, build. Commit.

### 5. Page sections
- `EmployeeStatsPage.jsx` (filters, loading/error/empty states, no-access state), `KpiCards.jsx`, `Spotlight.jsx`, `MonthWinners.jsx`, `EmployeeHeatTable.jsx`, `EmployeeTable.jsx`, `EmployeeDrawer.jsx`, `EmployeeStats.css`.
- Verify: lint, build. Commit.

### 6. Excel export
- `statsExcel.js`: sheets "By employee", "Employee × month", "Month winners" through `src/lib/excel`; info message instead of an empty file.
- Verify: node check of the sheet builder on the worked example. Commit.

### 7. Route, menu, docs
- `App.jsx`: add `/user/employee-stats` to the Department, Owner, Approver and CA trees (not Accounts, Marketing, Admin); the page itself shows "no access" if `canViewEmployeeStats` is false (the Department tree also holds non-HR staff).
- `config/roleNav.js`: add "Employee Statistics" to the Owner, Approver and CA menus, and to the Department menu **only for HR users** (`getNavItems`).
- `AGENTS.md`: structure, route, access rule, definitions, charts note.
- Verify: lint, build, logic check of who gets the menu entry. Commit.

### 8. Wrap-up
- Final lint + scratch build; report what was and was not tested. Browser checks only if the owner asks (list: each section with sample data, phone width, the four roles, no-access user).
