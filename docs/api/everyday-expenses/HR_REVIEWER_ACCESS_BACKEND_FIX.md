# Everyday Expenses — HR Department Reviewer Access (Backend Fix)

**For:** the backend team · **Area:** Everyday Expenses (`/everyday-expenses/*`)
**Full contract:** `docs/api/everyday-expenses/EVERYDAY_EXPENSES_BACKEND.md` (section 1 has the permission table this fix completes)

## 1. The issue

Users in the **HR DEPARTMENT** must be **expense reviewers**, exactly like `CA`, `APPROVER` and `OWNER`. Right now the server does **not** treat them as reviewers, so:

- `GET /everyday-expenses/me` returns `"isReviewer": false` for an HR user (or leaves it out).
- The reviewer-only endpoints (overview, categories/grades/settings management, reject, repay, bill access for other people's entries) refuse or empty-answer for an HR user.
- On screen the HR user only gets **My expenses** and **Rate card**. The **Overview**, **Categories & rates** and **People & grades** tabs are missing, or they open and show errors. The app now shows a gold notice when the app recognises the user as HR but the server does not.

## 2. Who the HR users are

HR staff are ordinary users. **Their role is `DEPARTMENT`**, the same as Accounts and Marketing staff. They are told apart only by their **department**:

- A user document stores departments as references: `department: { has_department: true, department: [ObjectId, ...] }`.
- Those ObjectIds point into the `departments` collection. The HR department there is:
  - `name`: **`HR DEPARTMENT`**
  - `department_id`: `9`
  - `_id`: `69007c4a3f65a8a483094d6e`
- Do **not** change the HR user's role and do **not** identify HR by e-mail address.

## 3. The rule to implement

A user is an **expense reviewer** when **either**:

1. `role` is `CA`, `APPROVER` or `OWNER`, **or**
2. **any** of the user's departments has the name `HR DEPARTMENT` (also accept `HR`).

Name comparison: trim, collapse repeated spaces, case-insensitive. A user can have several departments; one match is enough. `ADMIN` is **not** a reviewer and has no access to Everyday Expenses at all (`403` on every endpoint).

### Reference helper

```js
const REVIEWER_ROLES = ["CA", "APPROVER", "OWNER"];
const HR_DEPARTMENT_NAMES = ["HR", "HR DEPARTMENT"];
const norm = (s) => String(s || "").trim().replace(/\s+/g, " ").toUpperCase();

// `user` is the logged-in user document. departmentIds are user.department.department (ObjectIds).
async function isExpenseReviewer(user, DepartmentModel) {
  if (REVIEWER_ROLES.includes(user.role)) return true;
  const ids = user?.department?.department || [];
  if (!ids.length) return false;
  const depts = await DepartmentModel.find({ _id: { $in: ids }, is_active: true, is_archived: false }, { name: 1 }).lean();
  return depts.some((d) => HR_DEPARTMENT_NAMES.includes(norm(d.name)));
}
```

If the check currently reads department names from the JWT, make sure the token carries them (the login response already returns each department with its `name`); otherwise look them up as above. Use **one** shared function everywhere so the rule can never drift between endpoints.

## 4. Where it must apply

Use `isExpenseReviewer` for all of these (as in contract section 1):

| Endpoint | Reviewer behaviour |
|---|---|
| `GET /everyday-expenses/me` | return `"isReviewer": true` (this is what shows the tabs) |
| `GET /everyday-expenses/people` | allowed |
| `GET /everyday-expenses` (overview, everyone's entries) | allowed |
| `POST/PUT /everyday-expenses/categories`, `GET .../categories?includeInactive=true` | allowed |
| `PUT /everyday-expenses/grades`, `PUT /everyday-expenses/settings` | allowed |
| `POST /everyday-expenses/reject`, `POST /everyday-expenses/repay` | allowed, but never on the reviewer's **own** entries (per-id failure "Cannot settle your own claim") |
| `GET /everyday-expenses/uploads/url?key=` | allowed for any bill |

A user who is **not** a reviewer keeps getting `403` on all of the above except their own entries and the read-only endpoints.

## 5. How to check the fix

Log in as the HR user (role `DEPARTMENT`, department `HR DEPARTMENT`) and call each endpoint:

| # | Call | Expected |
|---|---|---|
| 1 | `GET /everyday-expenses/me` | `200`, `"isReviewer": true` |
| 2 | `GET /everyday-expenses?startDate=…&endDate=…` | `200` with everyone's entries, `totals`, `byPerson` |
| 3 | `GET /everyday-expenses/people` | `200` |
| 4 | `PUT /everyday-expenses/categories/:id` | `200` |
| 5 | `POST /everyday-expenses/repay` on **someone else's** entry | `200`, id in `updated` |
| 6 | `POST /everyday-expenses/repay` on the HR user's **own** entry | `200` with the id in `failed` ("Cannot settle your own claim") |
| 7 | Same calls as a user in `ACCOUNTS` or `MARKETING` | `/me` → `"isReviewer": false`; 2–5 → `403` |
| 8 | Same calls as `ADMIN` | `403` on everything |
| 9 | Same calls as `CA`, `APPROVER`, `OWNER` | unchanged: allowed |
| 10 | HR user whose department was written as `hr department` / `HR` | still a reviewer (name match is case/space-insensitive) |

When #1 returns `true`, the HR user's next page load shows **Overview**, **Categories & rates** and **People & grades** with no gold notice. Nothing needs to change in the frontend.

## 6. Notes

- The frontend already applies the same rule on its side (department name `HR DEPARTMENT` or `HR`). It decides only what to show; **this server rule is the real access control**.
- If Accounts staff should also become reviewers later, add `ACCOUNTS` to the same helper. It is a one-line change and nothing else moves.
