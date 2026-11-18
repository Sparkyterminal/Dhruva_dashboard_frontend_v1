# Everyday Expenses — Design

**Status:** approved by the owner on 2026-11-18 (the HR department is named "HR DEPARTMENT", `HR` also accepted; both old Excel screens are removed).
**Source:** owner's brief + "Travel, Night Shift, Food Allowance & Expense Reimbursement Policy" (Skyblue Event Management India Pvt Ltd).

## 1. Intent

Every employee records what they spent for work, in the app, every day. The app works out how much the company will reimburse using the **standard rates the management sets once** (so nobody is paid more than policy), and keeps the **bill** safely in S3. CA, Approver, Owner and HR get one place to see **who spent what and who has been repaid**, and to mark repayments. An entry can be changed only **on the day it was added**; at **12:00 am (IST)** it locks and can never be altered.

This is **new and separate** from the old Excel-style "Daily Expenses", which is removed completely (section 8).

## 2. Goals / non-goals / anti-goals

**Goals**
- Every role except Admin can add and see their own expenses.
- Categories and their rules/limits are set by management and shown to everyone.
- Reimbursable amount is calculated live in the form and is the only amount that can be repaid.
- Bills uploaded straight to S3; viewable by the owner of the entry and by the four reviewer roles (CA, Approver, Owner, HR).
- Hard lock at 12 am IST, enforced by the server (UI only mirrors it).
- Reviewers (CA, Approver, Owner, HR): overview by employee/date/category/status, flag problems, reject with a reason, mark repaid (single or "settle up" for a person), export to Excel.

**Non-goals (v1)**: advance requests and settlement (policy section 11); prior-approval workflow for travel/hotel (policy 3.2/6); multi-level approval chains; push notifications; linking repayments into the Daybook.
**Anti-goals**: a reimbursement above the standard rate; an edit or delete after the lock (by anyone, including reviewers/Admin); a bill that anybody without permission can open by guessing a link.

## 3. Roles

| Role | My expenses | Rate card | Overview (everyone's) | Manage categories, rates, grades | Reject / mark repaid |
|---|:-:|:-:|:-:|:-:|:-:|
| Accounts, Marketing, other Department staff (everyone except Admin) | yes | read-only | – | – | – |
| **Admin** | **no access** (no menu entry, no route; the server answers `403`) | – | – | – | – |
| **CA, Approver, Owner, HR** (the "expense reviewers") | yes | yes | **yes** | **yes** | **yes** |

CA, Approver, Owner and HR are also employees, so they use "My expenses" like everyone else.

**How HR is identified (needs the owner's confirmation).** HR users today are ordinary Department users (role `DEPARTMENT`), exactly like Accounts and Marketing staff. The app already tells those apart **by department name** (`departments[0].name`). Recommended: do the same for HR — a user in the **HR department** is an expense reviewer. Nothing changes for the existing HR login (their screens, requirements and bookings stay exactly as they are); only Everyday Expenses gains the reviewer tabs. The check lives in one helper (`isExpenseReviewer(user)` in `src/utils/expenseAccess.js`) and is **never** based on an email address. The backend must apply the **same rule** (role CA / APPROVER / OWNER, or the user belongs to the HR department) because the screen alone is not security. Alternative considered: a brand-new `HR` role — cleaner on paper, but it forces a backend role change and risks breaking every existing HR permission that is checked as `DEPARTMENT`, so it is not recommended now.

## 4. How the policy becomes rules

A **category** has a calculation type, an optional limit, and optional conditions. One pure function (`calcReimbursement`) is used by the form and mirrored on the server; the server result is the one stored.

| Calc type | Formula | Example from the policy |
|---|---|---|
| `ACTUAL` | `min(amount, cap?)` | Auto, Taxi, Metro, Bus, Parking, Toll (no cap); Train/Bus/Flight tickets; Event purchases |
| `PER_UNIT` | `units × rate` (no amount typed) | Two-wheeler **₹5/km**, Four-wheeler **₹12/km** |
| `CAPPED_PER_UNIT` | `min(amount, cap × units)` | Hotel per night by grade; Meals **₹600/day**; Miscellaneous **₹200/day** |
| `FIXED_MAX` | `min(amount, cap)` | Night food **₹200** (only after 9:00 pm) |

Conditions a category can switch on: `requiresBill` (default yes), `capByGrade` (hotel: Junior ₹1,500 · Executive ₹2,000 · Manager ₹3,000), `maxClaimsPerDay` (night food = 1), `afterTime` (night food: duty end time after 21:00, else not applicable), `companyProvidedZero` (a "food/meal was arranged by company/venue/client" tick makes it ₹0), `approvalAbove` (event purchases above ₹2,000 need "prior approval taken" + approver name before they can be submitted), `guidance` (text shown in the form, e.g. travel class by grade), `unit` (km, nights, days).

**Seed categories** (management can edit/add/disable; the backend seeds these once):

| Group | Category | Type | Rate / limit | Notes |
|---|---|---|---|---|
| Food | Night shift food | FIXED_MAX | ₹200 | after 9 pm, 1 per day, bill, ₹0 if company-provided |
| Local travel | Auto-rickshaw · Taxi/Cab · Metro · Bus · Parking · Toll | ACTUAL | – | bill or digital receipt |
| Mileage | Two-wheeler | PER_UNIT | ₹5 / km | distance; proof optional |
| Mileage | Four-wheeler | PER_UNIT | ₹12 / km | distance; proof optional |
| Outstation | Train / Bus / Flight ticket | ACTUAL | – | guidance = travel class by grade; ticket as bill |
| Accommodation | Hotel | CAPPED_PER_UNIT | per night by grade | nights; bill required |
| Daily allowance | Meals | CAPPED_PER_UNIT | ₹600 / day | ₹0 for a meal arranged by company |
| Daily allowance | Miscellaneous | CAPPED_PER_UNIT | ₹200 / day | |
| Event purchases | Event purchase | ACTUAL | approval above ₹2,000 | GST invoice advised |

**Grades** (used for hotel limits and travel guidance): Junior Staff, Executive / Coordinator, Senior Executive, Manager. The policy's hotel table lists only three; **Senior Executive uses the Executive limit (₹2,000) as a starting value — editable.** Management assigns each person a grade (People tab); a person without a grade is treated as Junior Staff.

**Not reimbursable** (policy section 12: personal purchases, alcohol/tobacco, fines, entertainment, family/friends, loss of belongings, hotel minibar/laundry/spa…) is shown on the Rate card; there is no category for them.

## 5. The one-day lock

- An entry is editable/deletable only **on the day it was added, until 12:00 am IST**; from `00:00:00` IST the next day it is locked for everyone. The server stores `editableUntil` on each entry and rejects PUT/DELETE after it with `409 LOCKED`.
- The browser never trusts the phone's clock: every API response includes `serverTime`; the UI keeps an offset and shows **"Editable until 12:00 am · 3h 12m left"**, then flips to **Locked** at midnight without a refresh.
- The **expense date** can be today or up to **7 days back** (the policy's claim window; setting editable by management), but the lock follows the day it was **added**.
- A reviewer's **decision** (rejected + reason, repaid + date/mode/reference) is separate data and is not blocked by the lock. The employee's own fields (category, amount, units, bills, note) never change after the lock. A rejected entry is corrected by adding a **new** entry (a "Copy as new" button is provided).

## 6. Bills and S3

API Gateway/Lambda cannot take large uploads, so the browser uploads **directly to S3** with a short-lived presigned URL:
1. `POST everyday-expenses/uploads/presign` `{ fileName, contentType, size }` → `{ uploadUrl, key }` (server checks type and size).
2. Browser `PUT`s the file to `uploadUrl` (with progress). No auth header is sent to S3.
3. The entry stores `bills: [{ key, name, size, contentType }]`.
4. Viewing: `GET everyday-expenses/uploads/url?key=…` → short-lived signed GET URL (permission-checked: owner of the entry or a reviewer role). The bucket is private.

Allowed: JPG, PNG, WEBP, HEIC, PDF; up to 5 files per entry, 10 MB each (settings). Photos are shrunk in the browser before upload to save mobile data. Bills cannot be added/removed after the lock.

## 7. Screens (one page, `/user/everyday-expenses`, with a scrollable tab bar)

- **My expenses** (everyone): month totals (spent · reimbursable · repaid · pending); date-grouped list with status chips (Editable + countdown / Locked / Rejected / Repaid); **Add expense** opens a dialog: category (grouped, searchable) → form adapts (amount, km, nights/days, time, "provided by company", prior-approval details) → live line **"You will get ₹X"** with the reason when capped ("Capped at ₹200 per day") → bill drop-zone/camera → Save.
- **Rate card** (everyone): categories grouped with limits, conditions, grade table and the non-reimbursable list. Reviewers get an **Edit** mode.
- **Overview** (CA/Approver/Owner/HR): filters (dates, person, department, category, status), summary cards, per-person groups with totals and a **Settle up** action, row details with bill viewer, flags (over limit, no bill, duplicate), **Reject** (reason) and **Mark repaid** (date, mode, reference) for one or many with a confirmation dialog, **Export Excel**.
- **Categories & rates** and **People & grades** (CA/Approver/Owner/HR).

Extra touches I am adding: duplicate warning (same person + category + date + amount), "Copy as new", month-end reminder chip when entries are about to pass the 7-day claim window, and a clear "Why this amount?" line on every entry.

## 8. Removing the Excel "Daily Expenses" (replaces the earlier rename idea)

The owner wants the Excel-style Daily Expenses **removed completely, including its data**. That removes the word "Daily Expenses" from the menu for good; **Everyday Expenses** is the only expenses screen left.

**Frontend (done in the build, plan task 8):** delete `src/Dashboard/Accounts/DailyExpenses/` (8 files), `src/Dashboard/Owner/DailyExpense.jsx`, the `/user/daily-expenses*` routes and imports in every role tree, the "Daily Expenses"/"Daily Expense" menu entries in `config/roleNav.js`, the `daily-expenses` spreadsheet module constant, and the doc `docs/api/expenses/DAILY_EXPENSES_EXCEL_BACKEND_SCHEMA.md`. The shared spreadsheet engine stays (Budget Report and Leads use it).

**An older second screen also exists:** `/user/expenses` (`src/Dashboard/Accounts/Expenses/`, titled "Daily Expenses — Excel-style sheet", contract `docs/api/expenses/EXPENSES_BACKEND_SCHEMA.md`). It lost its entry button when the Daybook was rebuilt, so it is unreachable from the menu. **Approved: it is removed as well, and its data too.**

**Database (needs the owner's go-ahead, cannot be run from this repo):** the old Excel data lives in the `spreadsheetworkbooks` collection under `module: "daily-expenses"` (and, for the older screen, the expenses collection described in `EXPENSES_BACKEND_SCHEMA.md`). Cleanup script and order (look → back up outside git → confirm counts → delete) go into the backend contract, section "Removing the old Daily Expenses data". The backend must also stop accepting the `daily-expenses` module and delete the `/expenses` routes if the older screen goes.

## 9. Approaches considered

1. **Configurable rules engine (chosen).** Categories carry a calc type + limits; one shared function computes the amount; the server stores the authoritative result. Editable by management, no code change for new rates.
2. Hard-coded rates in the app — rejected: management must change rates themselves.
3. Free-form formulas per category — rejected: powerful but easy to misconfigure, hard to audit.
4. For bills: upload through the backend — rejected (API Gateway/Lambda payload limits); direct-to-S3 presigned upload chosen.

## 10. Constraints

- No backend code in this repo: a full contract goes in `docs/api/everyday-expenses/` (written in task 1 of the plan). The screens cannot work live until the backend implements it.
- All HTTP through `axiosClient`; the S3 `PUT` also uses it with an absolute URL and no auth header.
- Own-code kits (PageKit/FormKit/AdminKit), brand tokens, Montserrat, no logo/"Dhruva" text, ₹ with Indian grouping, mobile-first (the bill camera matters on phones).
- Dates are `YYYY-MM-DD` strings; "today" and the lock use **IST**.
- No test framework: money logic verified with a node script against the policy examples; lint 0 errors; scratch build. Browser tests only on request.
