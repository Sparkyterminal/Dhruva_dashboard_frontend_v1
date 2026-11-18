import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Paperclip, Pencil, Plus, Receipt, Trash2 } from "lucide-react";
import { EmptyState } from "@/Components/PageKit";
import { ConfirmDialog } from "@/Components/AdminKit";
import { toast } from "@/Components/AdminKit/toast";
import ExpenseDialog from "./ExpenseDialog";
import ExpenseSummaryCards from "./ExpenseSummaryCards";
import LockChip from "./LockChip";
import StatusChip from "./StatusChip";
import { deleteExpense, fetchMyExpenses } from "./everydayApi";
import { formatMoney, istDay, lockInfo } from "./everydayRules";
import { openBill } from "./openBill";
import { serverNow, useServerNow } from "./serverClock";
import "./Everyday.css";

const monthOf = (ymd) => ymd.slice(0, 7);

const shiftMonth = (month, delta) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
};

const monthLabel = (month) => {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });
};

const dayLabel = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const groupByDay = (expenses) => {
  const map = new Map();
  [...expenses]
    .sort((a, b) => (a.expenseDate === b.expenseDate ? String(b.createdAt).localeCompare(String(a.createdAt)) : a.expenseDate < b.expenseDate ? 1 : -1))
    .forEach((e) => {
      const day = String(e.expenseDate).slice(0, 10);
      if (!map.has(day)) map.set(day, []);
      map.get(day).push(e);
    });
  return [...map.entries()].map(([day, items]) => ({
    day,
    items,
    total: items.filter((i) => i.status !== "REJECTED").reduce((t, i) => t + (Number(i.reimbursable) || 0), 0),
  }));
};

const detailLine = (e) => {
  const snap = e.categorySnapshot || {};
  const parts = [];
  if (e.amount != null && e.amount !== "") parts.push(`Spent ${formatMoney(e.amount)}`);
  if (e.units != null && e.units !== "") parts.push(`${e.units} ${snap.unitLabel || "unit"}${Number(e.units) === 1 ? "" : "s"}`);
  if (e.dutyEndTime) parts.push(`Duty ended ${e.dutyEndTime}`);
  return parts.join(" · ");
};

/** Everyone's own expenses: month totals, a list grouped by day, add / edit / delete until the lock. */
const MyExpensesTab = ({ categories, me, authHeaders }) => {
  const now = useServerNow(1000);
  const thisMonth = monthOf(istDay(serverNow()));
  const [month, setMonth] = useState(thisMonth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({ open: false, mode: "add", record: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchMyExpenses({ month, authHeaders }));
    } catch {
      toast.error("Could not load your expenses");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [month, authHeaders]);

  useEffect(() => {
    load();
  }, [load]);

  const expenses = useMemo(() => data?.expenses ?? [], [data]);
  const days = useMemo(() => groupByDay(expenses), [expenses]);
  const activeCategories = categories.filter((c) => c.active !== false);

  const openDialog = (mode, record = null) => setDialog({ open: true, mode, record });
  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  const afterSave = (mode) => {
    closeDialog();
    toast.success(mode === "edit" ? "Expense updated" : "Expense added");
    load();
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpense({ id: toDelete._id, authHeaders });
      toast.success("Expense deleted");
      setToDelete(null);
      load();
    } catch (err) {
      if (err?.response?.status === 409) {
        toast.error("This expense is now locked and can no longer be deleted.");
        setToDelete(null);
        load();
      } else {
        toast.error(err?.response?.data?.message || "Could not delete the expense");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="ee-tab">
      <div className="ee-toolbar">
        <div className="ee-month" role="group" aria-label="Month">
          <button type="button" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <strong>{monthLabel(month)}</strong>
          <button type="button" aria-label="Next month" disabled={month >= thisMonth} onClick={() => setMonth(shiftMonth(month, 1))}>
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>
        <button type="button" className="ee-add" onClick={() => openDialog("add")} disabled={!me}>
          <Plus size={16} strokeWidth={2.4} aria-hidden="true" /> Add expense
        </button>
      </div>

      <ExpenseSummaryCards totals={data?.totals} />

      {loading && !data ? (
        <div className="ee-skeleton" aria-hidden="true">
          <i /> <i /> <i />
        </div>
      ) : days.length === 0 ? (
        <EmptyState
          icon={<Receipt size={24} aria-hidden="true" />}
          title={`No expenses in ${monthLabel(month)}`}
          hint="Spent money for work today? Tap “Add expense” and attach the bill."
        />
      ) : (
        <div className="ee-days">
          {days.map((group) => (
            <section key={group.day} className="ee-day">
              <header>
                <h3>{dayLabel(group.day)}</h3>
                <span>You will get {formatMoney(group.total)}</span>
              </header>
              {group.items.map((e) => {
                const snap = e.categorySnapshot || {};
                const unlocked = !lockInfo(e, now).locked && e.status === "SUBMITTED";
                const line = detailLine(e);
                return (
                  <article key={e._id} className={`ee-item${e.status === "REJECTED" ? " is-rejected" : ""}`}>
                    <div className="ee-item-top">
                      <div className="ee-item-main">
                        <strong>{snap.name || "Expense"}</strong>
                        <span>{[snap.group, line].filter(Boolean).join(" · ")}</span>
                      </div>
                      <div className="ee-item-money">
                        <strong>{formatMoney(e.reimbursable)}</strong>
                        <span>you get</span>
                      </div>
                    </div>

                    {e.cappedBy ? <p className="ee-why">{e.cappedBy}</p> : null}
                    {e.note ? <p className="ee-note">{e.note}</p> : null}
                    {e.status === "REJECTED" && e.rejection?.reason ? (
                      <p className="ee-reject">Rejected: {e.rejection.reason}</p>
                    ) : null}
                    {e.status === "REPAID" && e.repayment ? (
                      <p className="ee-repaid">
                        Repaid {formatMoney(e.repayment.amount)} on {dayLabel(String(e.repayment.date).slice(0, 10))}
                        {e.repayment.mode ? ` · ${e.repayment.mode}` : ""}
                        {e.repayment.reference ? ` · ${e.repayment.reference}` : ""}
                      </p>
                    ) : null}

                    <div className="ee-item-foot">
                      <div className="ee-chips">
                        <StatusChip status={e.status} />
                        <LockChip entry={e} now={now} />
                        {(e.bills || []).map((b, i) => (
                          <button
                            key={b.key}
                            type="button"
                            className="ee-bill-chip"
                            onClick={() => openBill({ key: b.key, authHeaders })}
                            title={b.name}
                          >
                            <Paperclip size={12} aria-hidden="true" /> Bill {e.bills.length > 1 ? i + 1 : ""}
                          </button>
                        ))}
                      </div>
                      <div className="ee-actions">
                        {unlocked ? (
                          <>
                            <button type="button" aria-label={`Edit ${snap.name || "expense"}`} onClick={() => openDialog("edit", e)}>
                              <Pencil size={14} aria-hidden="true" /> Edit
                            </button>
                            <button type="button" className="is-danger" aria-label={`Delete ${snap.name || "expense"}`} onClick={() => setToDelete(e)}>
                              <Trash2 size={14} aria-hidden="true" /> Delete
                            </button>
                          </>
                        ) : (
                          <button type="button" aria-label={`Add ${snap.name || "expense"} again`} onClick={() => openDialog("copy", e)}>
                            <Copy size={14} aria-hidden="true" /> Add again
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}
        </div>
      )}

      <ExpenseDialog
        open={dialog.open}
        mode={dialog.mode}
        record={dialog.record}
        categories={activeCategories}
        me={me}
        existing={expenses}
        authHeaders={authHeaders}
        onClose={closeDialog}
        onSaved={afterSave}
        onLocked={() => {
          closeDialog();
          load();
        }}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this expense?"
        message="It will be removed. You can only do this until 12:00 am today."
        confirmLabel="Yes, delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
};

export default MyExpensesTab;
