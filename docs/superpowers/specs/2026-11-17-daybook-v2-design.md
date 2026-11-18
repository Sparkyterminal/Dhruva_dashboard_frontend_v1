# Daybook V2 — Design

**Why:** The owner wants the Daybook to be a self-contained manual ledger. It must stop reading from expenses/requirements and booking advances, record GST/TDS properly, and carry balances forward on its own.

**Goals:** manual inflow (client, event date, optional event reference, amount, cash/account, GST+TDS for account receipts, net received); manual outflow (vendor from the vendor list, amount paid, TDS, GST, actual paid = paid − TDS + GST); balances computed automatically (closing of a day = opening of the next, per Cash and per bank account); "Net (profit)" renamed "Surplus/deficit".
**Non-goals:** no change to bookings, vendors, expenses or other screens; no backend code (this repo has none).
**Anti-goals:** any double counting (so booking advances are no longer merged); any hand-typed daily balance.

**Approaches considered:** (A) frontend computes balances from all entries — rejected, needs the whole history on every load; (B) backend stores a daily balance row — rejected, goes stale when an old entry is edited; (C) **chosen:** one stored opening balance at go-live, balances computed on read by the backend and returned per day.

**Decisions (owner):** actual paid = amount paid − TDS + GST. **Decisions (mine, announced and accepted with "go ahead"):** booking advances are not auto-merged; cash and each bank account carry forward separately; one starting balance is entered once at go-live; a "received on" date is added to inflow because the day-wise ledger needs it.
**Left to the builder:** layout details, column order, Excel sheet layout.

Backend contract: `docs/api/daybook/DAYBOOK_V2_BACKEND.md`. Worked example: section 7 of the same file.
