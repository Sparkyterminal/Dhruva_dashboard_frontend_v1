# Budget Report Module

> **Excel flow (current):** see [`excel/BUDGET_REPORT_EXCEL_BACKEND_SCHEMA.md`](./excel/BUDGET_REPORT_EXCEL_BACKEND_SCHEMA.md)

The UI now uses **Univer Sheets** with one multi-sheet workbook per **confirmed or in-progress** event.

Legacy AG Grid pages are disabled at the entry points and archived under [`legacy/`](./legacy/).

## Frontend routes

| Path | Screen |
|------|--------|
| `/user/budgetreport/eventwise` | List — **View** + **Edit** only |
| `/user/budgetreport` | Select confirmed / in-progress event → open Excel |
| `/user/budgetreport/view/:id` | Read-only Excel (all sheets) |
| `/user/budgetreport/edit/:id` | Editable Excel (`:id` = event id) |

## Key mapping

- `module`: `budget-report`
- `key`: event Mongo `_id` (`Confirmed Event` or `InProgress`)

## Backend docs

- Full contract: [`excel/BUDGET_REPORT_EXCEL_BACKEND_SCHEMA.md`](./excel/BUDGET_REPORT_EXCEL_BACKEND_SCHEMA.md)
- InProgress support: [`excel/BUDGET_REPORT_INPROGRESS_BACKEND_SCHEMA.md`](./excel/BUDGET_REPORT_INPROGRESS_BACKEND_SCHEMA.md)
