# AGENTS.md — Dhruva Dashboard (frontend)

Guide for any AI coding agent (or new developer) working in this repo. Read it fully before changing anything, and **update it in the same change** whenever you alter structure, conventions, routes, exports or tooling. If this file and the code disagree, fix whichever is wrong.

---

## 1. What this is

The internal operations dashboard for **Dhruva**, an event/wedding management company (Karnataka, India). Staff use it for client **bookings**, event calendars, **daybook** (cash/account inflow-outflow), **bills/EMIs**, **vendors**, **budget reports** (spreadsheets per event), **leads tracking**, requirements/approvals, and admin (users, departments).

It is a React single-page app that talks to a separate backend REST API (not in this repo). There is no backend code here; backend contracts live as markdown files next to the screens that use them (see §9).

---

## 2. Commands

```bash
npm install            # use npm; package-lock.json is committed
npm run dev            # Vite dev server, http://localhost:5173
npm run lint           # ESLint — must stay at 0 errors
npm run build          # production build into ./dist
npm run preview        # serve a built dist
```

- **No test runner is installed** (deliberate project convention). Verify with `npm run lint`, `npm run build`, and manual checks in the browser. Do not add a test framework unless the owner asks.
- Build **into a scratch folder** when you only want to check that it compiles, so tracked `dist/` is not modified:
  `npx vite build --outDir <tmp-folder> --emptyOutDir`
- Vite pre-bundles dependencies on first start and after any `package.json`/lockfile change; the first request can take 1–2 minutes. That is normal, not a hang.

---

## 3. Tech stack

React 19 · Vite 7 · React Router 7 · Redux Toolkit + redux-persist · Axios · Ant Design 5 · Tailwind CSS 4 · lucide-react (icons) · framer-motion · dayjs · FullCalendar · AG Grid · Univer (spreadsheet engine for budget/leads workbooks) · exceljs, docx, jspdf (+autotable), file-saver (exports). Language is **JavaScript** (no TypeScript). Package manager is **npm**.

Import alias: `@` → `src` (configured in `vite.config.js`; `jsconfig.json` is only for the editor). Example: `import axiosClient from "@/api/axiosClient"`.

---

## 4. Project structure

```
src/
  api/axiosClient.js        The ONLY file allowed to import axios (see §6)
  config/
    config.js               API_BASE_URL (env or fallback) and ROLES — the only place for env-dependent values
    theme.js                Ant Design theme tokens (ConfigProvider in main.jsx)
  styles/theme.css          Design tokens: CSS variables, Tailwind @theme palette, base typography, antd/calendar touch-ups
  index.css                 Tailwind entry (source(".") — scans src only) + legacy budget-report styles
  lib/
    async.js                mapLimit(items, limit, worker)
    excel/                  Shared styled-Excel layer (see §8)
  utils/                    dataCutoff.js, captureElementAsImage.js
  reducers/users.js         The single Redux slice (current user session)
  verifyToken.js            Decodes/validates the JWT locally (no signature check)
  Components/               Shared components. Own-code UI kits (no antd): PageKit, FormKit, AdminKit, CalendarKit; plus AppMenu (site-wide hamburger drawer), RoleHome, RequestsDashboard, ExcelDownloadButton, calendars, checklists, UniverSheets
  Layout/AdminLayout.jsx    Layout used by the ADMIN role only (People / Organisation menu)
  Login/                    Login.jsx, ChangePassword.jsx, AuthLayout.jsx (shared split screen)
  Pages/                    LoadingPage, calendar pages
  Dashboard/                One folder per area:
    Accounts/   bookings (clientBookings/), daybook (DayBook/), bills (Bills/), budget reports (budgetreport/excel/ — the only implementation), expenses, daily expenses, requirement tables
    Admin/      users, departments, project coordinators
    Approver/ CA/ Owner/ User/   role homes and their screens
    Marketting/ inflow (bookings forms), leads tracker, venues, sub-venues, event names, sub-events, MarketHome
  App.jsx                   Route table, split by role (see §5)
  main.jsx                  Providers: Redux + redux-persist + antd ConfigProvider + Router
public/                     Static assets (logo PNGs, `_redirects` for Netlify SPA routing)
dist/                       Committed build output (see §12)
docs/                       docs/api/<area>/ backend contracts, docs/reference/ reference files; docs/backup/ and docs/*.docx|pdf are gitignored (client data)
```

**Folder-name caveat (Windows):** the repo has `src/Components` (capital C) from history. Windows treats `Components` and `components` as the same folder but git and Linux do not. **Always use the exact existing casing** (`@/Components/...`) and never create a differently-cased twin. New top-level folders (`api`, `config`, `lib`, `styles`) are lowercase.

---

## 5. Roles and routing

Roles come from the login response (`role`, plus `departments[0].name`). `src/App.jsx` builds a different `<Routes>` tree per role, in this priority order:

| Condition | Who | Home |
|---|---|---|
| `role === ADMIN` | Admin | `/dashboard/*` inside `AdminLayout` |
| `departments[0].name === "ACCOUNTS"` | Accounts staff | `/user` → `AccountsHome` |
| `departments[0].name === "MARKETING"` | Marketing staff | `/user` → `MarketHome` |
| `role === DEPARTMENT` | Other department staff | `/user` → `User/Home` |
| `role === OWNER` | Owner | `/user` → `Owner/Home` |
| `role === APPROVER` | Approver | `/user` → `ApproverHome` |
| `role === CA` | Chartered accountant | `/user` → `CAHomePage` |

- Not logged in → only `/login` exists.
- The same screen component (e.g. `ViewClientsBookings` at `/user/viewclientbookings`) is mounted in several role trees. A change to a shared screen affects every role that routes to it — check `App.jsx` for all occurrences before assuming a screen is single-role.
- A session expires when the JWT `exp` passes (timer in `App.jsx`); the user is logged out with a toast.
- **Adding a page:** create the component, add `<Route>` entries in every role tree that should see it, and add a nav link in that role's home (§7).

---

## 6. Auth, API and data conventions

- **All HTTP goes through `src/api/axiosClient.js`.** Never `import axios` anywhere else. Call with a path relative to the API root: `axiosClient.get("events", { params, ...config })`. Never hardcode URLs or `${API_BASE_URL}` in call sites.
- **Auth header is passed per call** by each screen: `{ headers: { Authorization: user?.access_token } }` (token read from Redux via `useSelector((s) => s.user.value)`). The client deliberately has **no interceptor** that attaches the token to every request (that could send tokens to the login endpoint). Keep passing headers explicitly unless the owner approves a change.
- The token is stored in the persisted Redux state (key `root`). Moving it to an httpOnly cookie needs a backend change; do not attempt it unilaterally.
- Config: `VITE_API_BASE_URL` overrides the API root; if unset, the production URL in `src/config/config.js` is used, so a Netlify deploy needs no environment variables. Only public values may go in `VITE_*` variables. `.env` is gitignored; `.env.example` is committed.
- Every async call needs loading, error and empty handling (`message.error(...)` is the established pattern). Do not leave `console.log` in committed code.

### Data cutoff (important business rule)

The client only wants data **from a floor date onward** (currently `2026-04-01`). It lives in the backend settings document `dataVisibilityCutoffDate` and arrives at login as `user.dataCutoffDate`. The frontend never hardcodes it: use `getEffectiveCutoffDate(user)` from `src/utils/dataCutoff.js` and send it as `startDate` on list queries. The backend is supposed to enforce it too (see `docs/api/global/DATA_CUTOFF_GLOBAL_BACKEND.md`).
**Never mention the cutoff inside generated documents/exports** (owner requirement). Date pickers already disable dates before it.

---

## 7. Design system (the redesign)

Brand: **forest green** with the logo's **gold** as the single accent; sage-white pages; serif headings, sans body. Subject-grounded details: a hand-drawn gold *toran* (garland) strip is the signature ornament — keep it to the greeting masthead and the sign-in panel; do not scatter it.

| Token | Value | Use |
|---|---|---|
| `--brand` / `forest-900` | `#0B3D0B` | Rails, wordmark surfaces, headings |
| `--brand-action` | `#17542A` | Primary buttons, links |
| `--gold` / `gold-300` | `#E0D085` | Accent on green, active marker, avatar |
| `--gold-deep` | `#C4A747` | Underlines, today marker on light surfaces |
| `--bg-page` | `#F4F6F2` | Page background |
| `--line` | `#E1E6DF` | Hairline borders |
| `--ink` / `--ink-soft` | `#1D261D` / `#5B665A` | Text |

- **Fonts:** **Montserrat everywhere** (loaded from Google Fonts in `index.html`); do not add other fonts.
- **Branding (owner rule):** no logo and no "Dhruva" text anywhere in the UI (tab title is "Dashboard").
- **Tailwind palette remap:** in `src/styles/theme.css`, the Tailwind palettes `indigo`, `violet`, `purple`, `blue`, `emerald`, `green` are re-pointed to the brand green scale, `fuchsia` and `pink` to gold, and `slate`/`gray` to green-tinted greys. So `bg-indigo-600` is **green** in this app — this is intentional and re-colours old screens without per-file edits. Prefer the explicit `forest-*` and `gold-*` utilities in new code.
- **Ant Design:** themed once via `src/config/theme.js` (`ConfigProvider` in `main.jsx`). Change colours there, not per component. Keep `theme.js` and `theme.css` in sync.
- **Do not** introduce purple/blue/pink hex colours, neon greens, gradient washes, glassmorphism, or Lottie/animated mascots. No Lottie anywhere — `lottie-react` and its JSON files were removed on purpose. Use lucide icons.
- **Motion:** minimal. The only choreographed moment is the garland drawing in. Respect `prefers-reduced-motion` (already global).
- **Radii/borders:** panels 14px with a 1px `--line` border (no heavy shadows); controls 10px.

### Shared UI building blocks

- `Components/AppMenu` + `config/roleNav.js` — the site-wide hamburger menu/drawer. Per-role navigation (with `section` headings) is defined only in `roleNav.js`; add new pages there.
- `Components/RoleHome` — shared role home: greeting, live clock and a tabbed workspace. A role home defines `TABS` (`{ key, label, content, framed? }`) and renders `<RoleHome tabs defaultTab />`. `framed: false` for content that renders its own card (calendars).
- `Components/PageKit` (PageHero, StatCard/StatRow, SearchBox, Segmented, EmptyState), `FormKit` (fields, Dialog, Drawer, FormCard…), `AdminKit` (Toaster/`toast`, ConfirmDialog, DataTable), `CalendarKit` — own-code building blocks with `pk-`, `fk-` prefixed CSS. Use these for new screens instead of raw antd; the admin dashboard and small master-data forms use no antd.
- `Login/AuthLayout` — shared sign-in / change-password screen.
- `Components/ExcelDownloadButton` — "Download Excel" button with loading/error handling.

Some large legacy forms (booking forms, vendor forms) and tables still use antd; they inherit the look through tokens.

---

## 8. Export features (Excel / Word / PDF)

All exports run **in the browser** from data already available via the API — no backend changes.

- **Excel** (preferred format; `exceljs`, loaded on click via dynamic import):
  - Shared layer `src/lib/excel/`: `downloadExcel({ fileName, sheets, extend })` builds a styled workbook from sheet specs `{ name, title, subtitle, columns[{header,type,width,wrap}], groups, rows, totals, freezeColumns }`. Column types: `text | number | money | percent | date | datetime`. `money` uses Indian digit grouping (₹12,34,567). `buildSheet.js` styles header, group bands, filters and frozen panes. `univerToExcel.js` converts stored Univer spreadsheets (budget workbooks) with styles, merges, widths and formulas.
  - Per-module builders (pure functions that return sheet specs, plus a `download…Excel` wrapper):
    `Accounts/clientBookings/export/bookingsExcel.js`, `User/vendors/vendorsExcel.js`, `Accounts/Bills/billsExcel.js`, `Marketting/ClientLeadsTrack/leadsExcel.js`, `Accounts/DayBook/daybookExcel.js`, `Accounts/budgetreport/excel/budgetReportExcelExport.js`.
  - Layout rule requested by the owner: **one row per client/entity** with everything in that row; repeating items (event types, advances, EMI months) are laid out in column groups ("Event Type 1", "Advance 1"…).
  - Dates: Excel has no time zone — `toExcelDate` shifts so the sheet shows the same wall-clock time as the app. Date-only strings (`YYYY-MM-DD`) must be parsed as **local** days (see `ymdToDate` in `daybookExcel.js`).
  - Totals rows: the label ("Total") must survive number/date columns (handled in `buildSheet.js`).
- **Word / PDF** exist for the **Bookings Dashboard** only (`Accounts/clientBookings/export/`): summary table then a detail section per booking. PDFs use "Rs." because built-in PDF fonts lack ₹; Word uses ₹.
- **Complete-package weddings:** amounts come from `eventTypes[0]` once and advances are de-duplicated by advance number (same rule as `clientBookingsUtils.js`); never sum all event types naively or you double count.
- Daybook has two Excel downloads: *Overall (till date)* and *Day-wise*. The daybook API returns at most 1000 rows per request, so `fetchDaybookAll` fetches month by month and joins results.
- Vendors export **excludes Aadhaar numbers** on purpose.
- Exports respect the active list filters/tab, and must show an info message instead of an empty file.

---

## 9. Backend and data notes

- Backend contract documents (markdown) all live under `docs/api/` (overview, daybook, expenses, budget-report, client-bookings, marketing, requests, global). Read the relevant one before changing an API call.
- MongoDB (database `test`) collections seen: `events` (bookings; `eventTypes[]` each with `advances[]`), `clientleads`, `vendors`, `bills` (`emiStatus[]`), `daybookinflows`, `daybookaccountopenclosebalances`, `spreadsheetworkbooks` (module `budget-report` keyed by event id, also `client-leads`, `daybook-*`, `daily-expenses`), `appsettings`, plus reference collections (`users`, `departments`, `venues`, `eventnames`, `eventtypes`, `coordinators`…). The API returns populated objects (`eventName: { name }`) where raw documents only hold ids.
- Data quirks to expect, not "fix" in the UI: advances can have `receivedAmount > 0` while `status` still says `Pending` (treat **received amount** as truth); some bookings have `totalPayable = 0` with money received; event dates are stored in UTC (IST evening shows as the same date, midnight IST = 18:30 UTC the day before).
- Database credentials are **not** in this repo and must never be committed or written into docs. If you need data access, ask the owner for a connection string at the time, read-only first.

---

## 10. Coding conventions

- Match the surrounding code's style, naming and comment density. Components PascalCase; functions/variables camelCase.
- New components: folder-per-component (`Components/Thing/index.jsx`), small and single-purpose. Do not grow the 1000+ line files further; extract hooks/sections when you touch them.
- No dead code, unused imports or debug logging. No inline URL strings. Use `lucide-react` for new icons.
- Shared logic goes in `src/lib` (generic) or beside its feature (domain). Do not copy-paste between screens.
- Accessibility baseline: semantic elements, labelled inputs, visible focus (global), `aria-label` on icon-only buttons, text contrast ≥ 4.5:1.
- Responsive: mobile-first; check ~390px, ~768px and ~1280px.
- **ESLint false positive:** the lint config cannot see JSX-only usage of lowercase `motion` (`<motion.div>`), so it flags the import as unused. `eslint.config.js` whitelists `motion`; **never delete a `framer-motion` import because lint complained**. In general, before removing an "unused" import, search the file for JSX usage.
- Line endings: many source files are **CRLF** and some are LF; git on Windows warns about conversion. When editing programmatically, detect the file's line ending and match it so multi-line replacements apply and mixed endings are not introduced.

---

## 11. Verify before you say "done"

1. `npm run lint` → **0 errors** (a few dozen warnings exist; do not add new ones).
2. `npm run build` (to a scratch `--outDir` if you don't intend to change `dist/`) → succeeds.
3. Open the affected screens in the browser and confirm the change, including the role(s) that mount them.
4. For UI work, look at it (desktop and ~390px). Check the browser console for errors.
5. For API/data changes, confirm the request payload/shape matches the contract document.
6. State plainly what you did **not** verify.

Handy for local UI checks without a real login: the app only decodes the JWT locally. Put a fake session in `localStorage["persist:root"]` (`{ user: JSON.stringify({ value: {..., access_token: <jwt with future exp>, is_logged_in: true, role, departments} }), _persist: JSON.stringify({version:-1, rehydrated:true}) }`) and mock the API with Playwright `page.route` limited to the **API host only** — a broad `**/api/**` pattern also intercepts Vite's own `/src/api/axiosClient.js` and breaks the page.

---

## 12. Git, branches and deployment

- **Deployment:** the owner builds and **drags the `dist/` folder onto Netlify's Deploys page** (no Netlify-side build). `dist/` is tracked in git and committed with a commit named `build`. `public/_redirects` provides SPA routing. No environment variables are needed on Netlify.
- `main` is what gets deployed. **Do not push to `main`, force-push, merge to `main`, or rebuild/commit `dist/` unless the owner asks.** Commit locally and report what a push would contain (including side changes).
- The UI redesign was developed on branch `phase2-ui-redesign` in a separate **git worktree** (`E:\Shared\dhruva\Dhruva_dashboard_phase2`, served on port 5174) so the running app on 5173 stayed untouched. In a worktree, `.git` is a **file** pointing at the real git directory — never append to it or treat it as a folder. When a worktree/branch is finished and merged, remove it with `git worktree remove <path>` and delete the branch only when the owner says so.
- Commit messages: imperative summary + short body explaining what and why. Keep commits focused (one concern each).
- Never commit client data: `docs/backup/`, `docs/*.docx`, `docs/*.pdf` are gitignored. Generated exports and database backups contain names and phone numbers.
- Destructive database actions (deletes/updates) only on the owner's explicit request: look at the target first, take a JSON backup (outside git), confirm the count, then act and report the result.

---

## 13. Environment gotchas

- Windows + Git Bash/PowerShell. Multi-line shell heredocs with quotes are unreliable here — write scripts/files with the file tools and run them.
- Tailwind 4 is configured to scan only `src/` (`@import "tailwindcss" source(".")`). Without that it scanned the committed `dist/` bundle and rebuilds took minutes. Keep it.
- Vite can look hung for ~2 minutes after dependency or config changes (re-optimising); wait before assuming a crash.
- Ant Design logs `bodyStyle is deprecated` warnings in the console for older screens; they are known and harmless (migrate to `styles.body` when touching those files).
- Google Fonts are loaded over the network; offline dev falls back to system fonts.

---

## 14. Known debt and roadmap

Done: env-driven config and central API client; Excel/Word/PDF exports; design system, shared role home, sign-in/admin redesign; Lottie and dead code removed; lint at 0 errors.

Not done (from `docs/superpowers/plans/2026-10-17-dashboard-production-refactor.md`):
- Per-domain API modules (`eventsApi.list()` …) instead of path strings at call sites (~178 calls).
- Folder restructure to `components/pages/layouts/routes/redux` and a lazy-loaded route table (`App.jsx` still imports every page statically; main bundle ≈ 10 MB).
- Splitting the 1000–3800 line files (`EditInflow`, `AddInflow`, `ViewInflow`, `ViewClientsBookings`, `ViewBill`, requirement tables…).
- A shared inner-page shell/`PageHeader`; inner screens still carry their own headers and many inline styles.
- Error boundaries; replacing remaining `message.error(err)` boilerplate with a shared helper.
- `App.jsx` repeats near-identical route blocks per role; generate them from a shared route list.
- `npm audit` reports vulnerabilities that only clear with major upgrades (Univer 1.x, exceljs); major bumps pending: antd 6, vite 8, eslint 10, react-hooks plugin 7, ag-grid 36, @fullcalendar/react 7, lucide 1.x, jspdf 4. Upgrade deliberately, one at a time.
- 26 `react-hooks/exhaustive-deps` lint warnings (data-fetch effects); fix with care to avoid refetch loops.
- Stopping tracking of `dist/` (only if the owner changes the deploy workflow).

---

## 15. Working agreement with the owner

- Be precise about scope: say exactly what a commit/push contains.
- When asked not to test something, don't; logic checks outside the browser are still fine. For requested visual work, review it visually.
- Don't spawn sub-agents unless asked.
- Surface mistakes immediately (and fix them) rather than hiding them.
- Keep this file current: if you add a route, role, export, token, convention or gotcha, update the matching section before finishing.
