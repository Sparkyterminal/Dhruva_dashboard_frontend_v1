# Everyday Expenses — Execution Plan

> Implement task by task; commit after each task. Spec: `docs/superpowers/specs/2026-11-18-everyday-expenses-design.md`.

**Goal:** Every employee logs work expenses with bills in S3; amounts are reimbursed only up to management's standard rates; reviewers see and settle everything; entries lock at 12 am IST.
**Architecture:** New folder `src/Dashboard/EverydayExpenses/`. Pure rules in `everydayRules.js`; API in `everydayApi.js` (+ S3 upload helper); one page with `ScrollTabs`; shared dialogs; routes/nav added to **every** role tree.
**Tech:** React 19, PageKit/FormKit/AdminKit, dayjs, exceljs (existing Excel layer), axiosClient.

## Owner decisions (approved 2026-11-18)
- HR = a user whose department is named **HR DEPARTMENT** (`HR` also accepted); HR is an expense reviewer like CA, Approver, Owner.
- Remove **both** old Excel screens (`/user/daily-expenses*` and `/user/expenses`) and, on the owner's go-ahead, their database data.
- Plan calls approved as written (lock by day added, 7-day claim window, reject-with-reason, grades, v1 non-goals).

## Global constraints
Match `docs/api/everyday-expenses/EVERYDAY_EXPENSES_BACKEND.md` names exactly. IST for "today"/lock. No console.log, no logo/"Dhruva" text, ₹ Indian grouping. Existing routes `/user/daily-expenses*` untouched. Lint stays at 0 errors, no new warnings.

## Review focus (inputs most likely to bite)
1. Phone clock wrong/timezone different → countdown and lock use server time + IST.
2. Midnight passes while a dialog is open → Save must fail gracefully ("This entry is now locked") and refresh.
3. Cap maths with paise (₹199.99 etc.), 0 km, 0 nights, negative or non-numeric input.
4. Category edited by management after entries exist → old entries keep the numbers they were saved with.
5. Large/odd bill files (HEIC, 30 MB photo, PDF) and an interrupted upload.

## Tasks

### 1. Backend contract (docs)
- Create `docs/api/everyday-expenses/EVERYDAY_EXPENSES_BACKEND.md` (reviewer rule includes the HR department; cleanup section for the old Daily Expenses data): collections (`expensecategories`, `expensegrades`, `everydayexpenses`, `expensesettings`), endpoints, calc rules (same as spec §4), lock rule + `409 LOCKED`, `serverTime`, S3 presign flow + bucket policy/CORS notes, permissions matrix, seed data, worked examples, backend checklist.
- Verify: re-read against spec §3–§6. Commit.

### 2. Rules engine + verification script
- Create `everydayRules.js`: `round2`, `calcReimbursement({ category, grade, entry }) → { reimbursable, cappedBy: string|null, notes: string[] }`, `validateEntry(category, entry) → { field: message }`, `lockInfo(entry, nowMs) → { locked, msLeft }`, `istDay(ms) → "YYYY-MM-DD"`, `msUntilIstMidnight(ms)`.
- Verification (node script outside the repo, hand-calculated cases from the policy): night food ₹350 at 9:30 pm → ₹200; at 8:30 pm → ₹0 "not applicable"; company-provided → ₹0; two-wheeler 17.4 km → ₹87; four-wheeler 10 km → ₹120; hotel 2 nights ₹5,000 for Junior → ₹3,000, Executive → ₹4,000, Manager → ₹5,000; meals 3 days ₹2,100 → ₹1,800; misc 3 days ₹500 → ₹500; taxi ₹480 → ₹480; event purchase ₹2,600 without approval → invalid, with approval → ₹2,600; lock at 23:59:59 IST editable, 00:00:00 locked; device in another timezone gives the same IST day.
- Commit.

### 3. API layer + S3 upload
- Create `everydayApi.js`: `fetchCategories`, `saveCategory`, `fetchGrades`, `saveGrades`, `fetchMyExpenses({month})`, `createExpense`, `updateExpense`, `deleteExpense`, `fetchOverview(filters)`, `rejectExpenses(ids, reason)`, `markRepaid(ids, {date, mode, reference})`, `getBillUrl(key)`, `uploadBill(file, onProgress) → {key,name,size,contentType}` (presign → PUT via axiosClient absolute URL, no Authorization → returns metadata).
- Create `useServerClock.js`: keeps `offsetMs` from `serverTime` in responses; `now()`.
- Create `compressImage.js`: shrink photos (max 1600 px, JPEG ~0.8), leave PDFs.
- Verify: lint. Commit.

### 4. Shared building blocks
- `LockChip.jsx` (Editable + live countdown → flips to Locked at IST midnight without refresh), `BillUploader.jsx` (drop-zone, camera on phones, previews, progress, remove before lock, type/size/count checks), `BillViewer.jsx` (lightbox using signed URL), `StatusChip.jsx`, `ExpenseSummaryCards.jsx`.
- Verify: lint. Commit.

### 5. Add / edit expense dialog
- `ExpenseDialog.jsx`: grouped searchable category select → dynamic fields by calc type → live "You will get ₹X" + reason → duplicate warning → bills → save (handles `409 LOCKED` and validation errors from the server). Edit mode only while unlocked; "Copy as new" for locked/rejected.
- Verify: lint, node check that the dialog's maths equals the rules script. Commit.

### 6. My expenses + Rate card tabs
- `MyExpensesTab.jsx` (month picker, cards, date-grouped list, lock chips, edit/delete while unlocked), `RateCardTab.jsx` (read-only categories, limits, grade table, non-reimbursable list).
- Verify: lint, build. Commit.

### 7. Reviewer tabs (CA / Approver / Owner / HR only)
- `OverviewTab.jsx`: filters, cards, per-person groups + totals, flags, row details with bills, **Reject** and **Mark repaid** via selection + floating bar + confirmation dialog (reuse the pattern in `Dashboard/CA/bulk/`), **Settle up** per person, Excel export (`everydayExcel.js` through `src/lib/excel`).
- `CategoriesTab.jsx` (add/edit/disable categories, rate fields by calc type, grade caps), `PeopleTab.jsx` (assign grades).
- Verify: lint, build. Commit.

### 8. Page, routes, navigation, HR access
- Create `src/utils/expenseAccess.js`: `isExpenseReviewer(user)` = role is CA / APPROVER / OWNER, or the user belongs to the HR department (name match, case-insensitive; the exact department name is a constant to confirm). Never by email. Same rule written into the backend contract.
- `EverydayExpensesPage.jsx` (ScrollTabs; reviewer tabs only when `isExpenseReviewer`).
- `App.jsx`: add `/user/everyday-expenses` to **every** role tree incl. Admin (`AdminLayout` menu entry too). HR users already land in the Department tree, so they get the route there. `config/roleNav.js`: add "Everyday Expenses" to every role's menu, including the department menu used by HR.
- Verify: lint, build, check every role tree has the route and that an HR-department user sees the reviewer tabs while a normal Department user does not (logic check of `isExpenseReviewer`). Commit.

### 8b. Remove the Excel Daily Expenses
- Delete `src/Dashboard/Accounts/DailyExpenses/` (8 files) and `src/Dashboard/Owner/DailyExpense.jsx`; remove their imports and the `/user/daily-expenses*` routes from every role tree in `App.jsx`; remove the "Daily Expenses" / "Daily Expense" entries from `config/roleNav.js`; remove `SPREADSHEET_MODULE_DAILY_EXPENSES` from `Components/UniverSheets`; delete `docs/api/expenses/DAILY_EXPENSES_EXCEL_BACKEND_SCHEMA.md`.
- Approved: also delete `src/Dashboard/Accounts/Expenses/`, the `/user/expenses` routes and `docs/api/expenses/EXPENSES_BACKEND_SCHEMA.md`.
- Check nothing else imports the deleted files (grep), Budget Report and Leads still build.
- Backend contract gets the section "Removing the old Daily Expenses data" (look → back up outside git → confirm counts → delete; `spreadsheetworkbooks` `module: daily-expenses`, and the old expenses collection if that screen goes). **The database is not touched from this repo; it runs only on the owner's explicit go, with a connection string, read-only first.**
- Verify: lint, build. Commit.

### 9. Wrap-up
- Update `AGENTS.md` (structure, routes, roles incl. HR rule, lock rule, S3 flow, removal of the Excel Daily Expenses). Final lint + scratch build. Report exactly what was and was not tested. Commit; push only if asked.

## Test plan (only when the owner asks)
Hand-listed browser checks: add each calc type, midnight lock flip, bill upload, reviewer reject/repay, role visibility. Until the backend exists, a mock API is used for these checks only.
