# Dashboard Production Refactor & UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Design tasks (Phase 5) must also invoke `frontend-design:frontend-design`.

**Goal:** Make the Dhruva dashboard look professional and be production-grade (clean folders, no junk, no Lottie, typed-by-convention API layer, small components) with **zero change in functionality**.

**Architecture:** Behavior-preserving, phase-by-phase refactor on one branch. Cleanup first (lowest risk), then config/API/folder structure, then splitting giant files, then a design-system pass done through shared shells + antd theme tokens (not 136 hand-restyled files). Each phase ends with lint + build + a role smoke-check and is its own commit(s), so any phase can be reverted alone.

**Tech Stack (existing, kept):** React 19, Vite 7, Redux Toolkit + redux-persist, React Router 7, Axios, Ant Design 5, Tailwind 4, AG Grid, FullCalendar, Univer, dayjs, lucide-react.

**Spec:** This conversation (user request 2026-10-17). Conventions from the `react-frontend-builder` skill (existing-project mode).

## Global Constraints

- **No functional change.** Same routes, same role access (`ROLES`), same API calls/payloads, same data-visibility cutoff behavior (`src/utils/dataCutoff.js` stays as is).
- **No Lottie anywhere**: no `lottie-react` dependency, no `*.json` animation files, no `<Lottie>` usage.
- No tests/test runner added (project convention). Verification = `npm run lint`, `npm run build`, manual role smoke-check.
- No hardcoded URLs/secrets outside `src/config/config.js`; values from `VITE_*` env vars; `.env` gitignored, `.env.example` committed.
- Folder-per-component (`Name/index.jsx`), pages stay thin, components < ~300 lines, no commented-out code, no `console.log`.
- Never touch production data/DB as part of this work. Never commit `docs/backup/`.
- Lint must end at **0 errors** (currently 22 errors, 49 warnings); build must pass after every task.

## Review Focus

- A role (Owner/Approver/Accounts/CA/Marketing/User/Admin) loses a menu item or route after folder moves/lazy-loading → each role's full menu must still open every page.
- Persisted login (redux-persist) from before the refactor must still restore the session after `reducers/` → `redux/` move (persist key + state shape unchanged).
- Windows case-insensitive rename (`Components` → `components`) silently not applying in git → use the two-step `git mv` and confirm with `git ls-files`.
- Excel/PDF/Word exports (`xlsx`, `jspdf`, `docx`, `html2canvas-pro`) still work after dynamic-import conversion.
- Splitting 1,000–3,800-line forms (Add/Edit Inflow, ViewClientsBookings…) drops a field/validation or changes payload shape → diff request payloads before/after on a sample submit.

---

## Phase 0 — Safety net

### Task 1: Branch + baseline

**Files:** Create `docs/refactor/baseline.md`, `docs/refactor/smoke-checklist.md`

- [ ] **Step 1:** `git switch -c refactor/production-ui` from `main` (user's uncommitted `DATA_CUTOFF_GLOBAL_BACKEND.md` edit stays untouched/committed separately by user).
- [ ] **Step 2:** Run `npm run lint` and `npm run build`; record error counts and bundle size (`dist/assets/*.js` sizes) in `baseline.md`.
- [ ] **Step 3:** Write `smoke-checklist.md`: per role, login → open every sidebar item → one list view loads → one add/edit form opens → one export (Bookings, Daybook, Budget report) works. Capture baseline screenshots of Login, one Home per role, Bookings list, one big form.
- [ ] **Step 4:** Commit `chore: add refactor baseline and smoke checklist`.

---

## Phase 1 — Remove junk (lowest risk, biggest visible win)

### Task 2: Remove all Lottie

**Files:**
- Modify: `src/Dashboard/Accounts/AccountsHome.jsx`, `Approver/ApproverHome.jsx`, `CA/CAHomePage.jsx`, `Marketting/MarketHome.jsx`, `User/Home.jsx`, `User/ViewRequirements.jsx`, `Owner/Meetings.jsx`, `package.json`
- Delete: all 27 `src/assets/*.json` (8 are already unused: `completed, Eye, home, pending, Profile, requirements, total, total1`; the rest are used only by the 7 files above)

**Interfaces:**
- Produces: `src/components/Icon/index.jsx` — `Icon({ name, size, className })` thin wrapper over `lucide-react`, plus `src/constants/meetingIcons.js` — `MEETING_ICONS: Record<meetingTitle, LucideIcon>` replacing `lottieMap` in `Meetings.jsx`.

- [ ] **Step 1:** In each of the 5 role Home pages, replace the 5 Lottie uses (welcome, logout, target audience, password, rainbow) with static lucide icons inside a soft tinted circle (e.g. `Hand`/`LogOut`/`Target`/`KeyRound`/ plain gradient header — decorative only, `aria-hidden`). Keep every button/handler/text exactly as is.
- [ ] **Step 2:** `Meetings.jsx`: replace `lottieMap` + 9 animation imports with `MEETING_ICONS` (Clock fallback). `User/ViewRequirements.jsx`: replace its Lottie usage the same way.
- [ ] **Step 3:** `git rm src/assets/*.json`; `npm uninstall lottie-react`.
- [ ] **Step 4:** Verify: `grep -ri lottie src package.json` returns nothing; `npm run build` passes; open the 5 Home pages + Meetings in dev server — no blank spaces left where animations were.
- [ ] **Step 5:** Commit `refactor: remove lottie animations and dependency`.

### Task 3: Remove dead code, dead deps, tracked build output

**Files:** Delete `src/Dashboard/Accounts/budgetreport/legacy/` (4 `.legacy.jsx` + README) after confirming no imports; delete `src/Dashboard/Marketting/editinflow.txt`; modify `.gitignore`, `package.json`, files with `// import` lines (32) and `console.log` (48).

- [ ] **Step 1:** For each candidate, `grep -rn` imports first; only delete when zero importers. Re-verify per dependency before removing: `react-icons`, `lenis`, `react-fast-marquee`, `react-persist` (0 imports found), `html2canvas` vs `html2canvas-pro` (keep the one imported), `moment`/`moment-timezone` (1 file → migrate to `dayjs`, then remove), `react-jwt` (keep if `decodeToken` still used). Also check `framer-motion` — it's imported in 21 files but **not in `package.json`** (only `motion`); fix by importing from `motion/react` or declaring the dep.
- [ ] **Step 2:** `npm uninstall` the confirmed-unused packages.
- [ ] **Step 3:** Delete commented-out imports and all `console.log`/`debugger` (keep `console.error` inside catch blocks only where it is the sole error signal — replace with the shared error helper from Task 6 later).
- [ ] **Step 4:** Add `dist` to `.gitignore`; `git rm -r --cached dist` (89 tracked build files).
- [ ] **Step 5:** Fix the 22 ESLint errors and the auto-fixable warnings (`npx eslint . --fix`, then manual). Do **not** blanket-disable rules.
- [ ] **Step 6:** Verify lint = 0 errors, build passes, smoke-check 2 roles. Commit `chore: remove dead code, unused deps, tracked dist; fix lint errors`.

### Task 4: Tidy root and docs

**Files:** Move root `FRONTEND_ALL_APIS_FINAL.md`, `PAYLOAD_EXAMPLES.md`, `budget report reference.xlsx`, and the 18 backend-contract `.md` files scattered in `src/**` into `docs/api/` (keep names; update the one cross-reference in `DATA_CUTOFF_GLOBAL_BACKEND.md`). Rewrite `README.md` (setup, scripts, env vars, folder map).

- [ ] **Step 1:** `git mv` each file (history preserved). **Step 2:** write README. **Step 3:** Commit `docs: consolidate API contracts under docs/api`.

---

## Phase 2 — Config, security, API layer

### Task 5: Config and secrets

**Files:** Create `src/config/config.js`, `.env.example`; delete root `config.js`; modify every importer of `../config` (`ROLES` etc.).

**Interfaces:** Produces `API_BASE_URL: string` (from `import.meta.env.VITE_API_BASE_URL`), `SOCKET_URL`, `ROLES` (unchanged values) from `src/config/config.js`; `ROLES` additionally re-exported from `src/constants/roles.js`.

- [ ] **Step 1:** Move constants; read URLs from env with the current production URL as `.env.example` value. **Remove `JWT_SECRET`** — it is hardcoded in the shipped bundle and unused (only defined in `config.js`); any JWT secret belongs on the backend. Remove dead exports (`BASE_LINK`, `SOCKET_PATH`, `DEFAULT_IP_ADDRESS`, `AUTHOR_NAME`, `LOGGER`) after grepping for use.
- [ ] **Step 2:** Verify `grep -rn "amazonaws" src` returns nothing; build passes with a `.env` copied from `.env.example`. Commit `refactor: env-driven config, drop frontend JWT secret`.
- [ ] **Note to user:** rotate the exposed `JWT_SECRET` on the backend if it was ever the real signing key.

### Task 6: Central API layer

**Files:** Create `src/api/axiosClient.js` and one file per domain (`authApi, usersApi, departmentsApi, requirementsApi, vendorsApi, eventsApi, leadsApi, billsApi, daybookApi, expensesApi, budgetReportApi, checklistsApi, calendarApi, …` — derived from the 61 files importing `axios` directly); modify those 61 files.

**Interfaces:** Produces `axiosClient` (baseURL from config, auth header from the existing persisted token exactly as today, 401 → existing `logout` flow, response error normalized) and `getErrorMessage(err): string` in `src/lib/errors.js`. Each `*Api.js` exports plain async functions returning `response.data`, e.g. `eventsApi.list(params)`.

- [ ] **Step 1:** Create client + `getErrorMessage`; **keep the current auth mechanism unchanged** (changing to httpOnly cookies needs a backend change — listed under "Out of scope").
- [ ] **Step 2:** Migrate **one domain at a time** (one commit each): replace inline `axios.get/post` with the domain function; keep call sites' behavior (same params, same payload). Order: auth → users/departments → vendors → requirements → bills → events/bookings → leads → daybook/expenses/budget report → calendars/checklists.
- [ ] **Step 3:** After each domain: build + open that domain's pages; for write calls compare request payload in DevTools Network before/after.
- [ ] **Step 4:** Done when `grep -rln "from \"axios\"\|from 'axios'" src` lists only `src/api/axiosClient.js`.

---

## Phase 3 — Folder structure

### Task 7: Move to the target structure (no logic changes)

Adapt `react-frontend-builder` structure to what exists. Mapping:

| Today | Target |
|---|---|
| `src/Components/*` (generic + calendars) | `src/components/` (generic) and `src/features/calendars/` |
| `src/Dashboard/<Role>/…` | `src/pages/<role>/…` (route-level, thin) |
| `src/Layout/AdminLayout.jsx` | `src/layouts/MainLayout/index.jsx` |
| `src/Pages/*` | `src/pages/common/` |
| `src/Login/*` | `src/pages/auth/` |
| `src/reducers/users.js`, `verifyToken.js` | `src/redux/slices/userSlice.js`, `src/lib/verifyToken.js` |
| `src/utils/*` | `src/lib/*` |
| `App.jsx` route table (610 lines) | `src/routes/AppRoutes.jsx` + `ProtectedRoute.jsx` |

- [ ] **Step 1:** Do it in 4 commits (components+layouts, pages, redux+lib, routes). Use `git mv`; for case-only renames use two steps (`git mv Components components_tmp && git mv components_tmp components`).
- [ ] **Step 2:** `redux/store.js` keeps the **same redux-persist key and state shape** so existing sessions survive.
- [ ] **Step 3:** `routes/AppRoutes.jsx`: every page via `React.lazy` + `Suspense` (existing `LoadingPage` as fallback); add `ErrorBoundary` at layout level.
- [ ] **Step 4:** Verify full smoke-checklist for **all** roles (every menu item opens). Commit per sub-step.
- [ ] **Open decision:** keep PascalCase folders (`Components/`, `Dashboard/`) instead of renaming? Less churn, less convention. Recommended: rename.

---

## Phase 4 — Break up giant files

### Task 8: Split the largest files (one file per sub-task, one commit each)

Targets (lines): `EditInflow` 3781, `AddInflow` 3396, `ViewInflow` 2172, `ViewClientsBookings` 1906, `ViewBill` 1622, `RequirementsTableAc` 1575, `AllRequirementsTable` 1482, `CARequirementsTable` 1461, `ViewVendor` 1296, `DataGridSpreadsheet` 1275, `RequirementTableApprover` 1251.

- [ ] **Step 1 (shared first):** the near-duplicate tables (`AllRequirementsTable`, `CARequirementsTable`, `RequirementTableApprover`, `RequirementsTableAc`) and Add/Edit Inflow pairs share most logic → extract shared pieces to `src/features/requirements/` and `src/features/inflow/` (`useXxxData` hook, `XxxFilters`, `XxxTable`, `XxxForm` sections) **before** splitting each file, so the duplicate is removed once.
- [ ] **Step 2 (per file):** container page (<150 lines) + `use<Name>` hook (data/state) + presentational sections + constants/helpers into `lib/`. Heavy libs (`xlsx`, `jspdf`, `docx`, `html2canvas-pro`) become dynamic `import()` at the export click.
- [ ] **Step 3 (per file):** every async block gets loading/error/empty state; replace `message.error(err…)` boilerplate with `getErrorMessage`.
- [ ] **Step 4 (per file):** verify with sample create/edit: compare request payload before/after; export still downloads; commit `refactor(<area>): split <File> into hook + sections`.
- [ ] Do the Inflow pair last (largest risk); stop and ask if a split would change behavior.

---

## Phase 5 — Professional UI

> Strategy: 1,215 inline `style={{}}` blocks make per-file restyling wasteful. Style **once** through design tokens + shared shells, then fix per-page leftovers while touching files in Phase 4.

### Task 9: Design tokens and theme

**Files:** Create `src/styles/tokens.css`, `src/config/theme.js`; modify `src/index.css` (450 lines of budget-report CSS move to `src/features/budgetReport/budgetReport.css`), `src/main.jsx`.

**Proposed direction (confirm before building):** calm, minimal, professional — keep the existing **deep forest green** as brand anchor.
- Palette: primary `#0b3d0b`-family green (hover/active tints), neutrals on slate scale, app background soft off-white `#f6f7f5`, cards white, one muted accent (warm gold) for highlights; semantic success/warning/error/info. All text ≥ 4.5:1 contrast.
- Type: Inter (UI, tables, forms) + existing Cormorant Garamond for page titles/logo only; fixed scale (12/14/16/20/24/32).
- Shape: 10–12px radius, 1px `slate-200` borders, soft low-contrast shadows; 8px spacing grid.
- Motion: 150–200ms ease on hover/focus only; respect `prefers-reduced-motion`.

- [ ] **Step 1:** Define CSS variables in `tokens.css`; map them into antd via `ConfigProvider theme={{ token, components }}` in `theme.js` (Button, Table, Input, Select, Modal, Menu, Card, Tag) so all ~88 antd-using files restyle automatically.
- [ ] **Step 2:** Style AG Grid (`theme` params) and FullCalendar (CSS vars) to match tokens.
- [ ] **Step 3:** Verify visually on 3 pages; commit `feat(ui): design tokens and antd theme`.

### Task 10: Shared shells and primitives

**Files:** Create `src/components/PageHeader/`, `StatCard/`, `EmptyState/`, `PageSkeleton/`, `ErrorFallback/`; modify `src/layouts/MainLayout/index.jsx`.

**Interfaces:** `PageHeader({ title, subtitle, actions })`, `StatCard({ label, value, icon, tone, loading })`, `EmptyState({ icon, title, description, action })`.

- [ ] **Step 1:** Rebuild `MainLayout`: clean sidebar (grouped menu, active indicator, collapse to icons, drawer on mobile), slim header (page title, user menu, logout), content max-width + consistent padding. Same menu items/roles/routes.
- [ ] **Step 2:** Role Home pages (5) rebuilt from `PageHeader` + `StatCard` grid (replaces the Lottie hero areas); Meetings uses `MEETING_ICONS` in cards.
- [ ] **Step 3:** Tables: consistent toolbar (search/filters left, actions right), sticky header, zebra-free hover, empty/loading states; forms: single-column on mobile, labeled sections, consistent button placement.
- [ ] **Step 4:** Verify at 375 / 768 / 1280 px on Login, one Home per role, Bookings list, one form. Commit per component group.

### Task 11: Login and polish pass

- [ ] **Step 1:** Login/ChangePassword: centered card, logo (`public/assets/dhruvalogo.png`), tokens, clear error text, visible focus.
- [ ] **Step 2:** Accessibility sweep: visible focus rings, `alt` on images, labels on inputs, keyboard-operable custom controls, icon-only buttons get `aria-label`.
- [ ] **Step 3:** Page `<title>` per route (lightweight `document.title` hook, since app is behind login; no `react-helmet` dependency).
- [ ] **Step 4:** Commit `feat(ui): login redesign and accessibility pass`.

---

## Phase 6 — Final verification

### Task 12: Release checks

- [ ] **Step 1:** `npm run lint` → 0 errors; `npm run build` → compare against baseline (expect smaller initial bundle from lazy routes, dynamic export libs, removed deps).
- [ ] **Step 2:** Full smoke-checklist for all 7 roles, desktop + mobile width; verify data-cutoff still applied (Bookings list shows nothing before 2026-04-01).
- [ ] **Step 3:** Open PR `refactor/production-ui` → `main`; description lists phases, removed deps, and anything deferred.

---

## Out of scope (needs a decision/backend)

- Moving auth token to httpOnly cookie (needs backend change) — current mechanism is kept; flagged as a security follow-up.
- TypeScript migration, automated tests (project convention: none unless requested).
- Replacing antd/AG Grid/Univer.

## Self-review

- **Coverage:** junk data (T2–T4), proper folders (T7), production code (T5, T6, T8), UI polish (T9–T11), remove Lottie (T2), no functional change (Global Constraints + per-task verification).
- **Test convention:** no test steps by design (project skill); verification is lint/build/manual.
- **Risk ordering:** deletions and config first, structural moves second, file splitting third, visual work last on a stable base.
