import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeIndianRupee, ChevronDown, ChevronRight, Paperclip, Users } from "lucide-react";
import { EmptyState, StatCard, StatRow } from "@/Components/PageKit";
import { toast } from "@/Components/AdminKit/toast";
import ExcelDownloadButton from "@/Components/ExcelDownloadButton";
import { DateField, SelectField } from "@/Components/FormKit";
import { RejectDialog, RepayDialog } from "./OverviewDialogs";
import SelectionBar from "./SelectionBar";
import StatusChip from "./StatusChip";
import { downloadExpensesExcel } from "./everydayExcel";
import { fetchOverviewAll, fetchPeople } from "./everydayApi";
import { formatMoney, istDay } from "./everydayRules";
import { openBill } from "./openBill";
import { serverNow } from "./serverClock";
import "./Everyday.css";

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Pending repayment" },
  { value: "REPAID", label: "Repaid" },
  { value: "REJECTED", label: "Rejected" },
];

const dayText = (ymd) => {
  const [y, m, d] = String(ymd).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
};

const defaultFilters = () => {
  const today = istDay(serverNow());
  return { startDate: `${today.slice(0, 7)}-01`, endDate: today, userId: "", department: "", categoryId: "", status: "" };
};

/** Problems a reviewer should look at: over the limit, no bill, or the same entry twice. */
const flagsOf = (e, duplicateKeys) => {
  const flags = [];
  if (e.cappedBy && e.status !== "REJECTED" && /limit|capped/i.test(e.cappedBy)) flags.push("Over the limit");
  if (!(e.bills || []).length && e.status !== "REJECTED") flags.push("No bill");
  if (duplicateKeys.has(`${e.userId}|${e.categoryId}|${e.expenseDate}|${e.amount ?? e.units}`)) flags.push("Possible duplicate");
  return flags;
};

/** What CA / Approver / Owner / HR see: everyone's expenses, who is owed what, and settling up. */
const OverviewTab = ({ categories, me, authHeaders }) => {
  const [filters, setFilters] = useState(defaultFilters);
  const [people, setPeople] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(() => new Set());
  const [selected, setSelected] = useState(() => new Set());
  const [dialog, setDialog] = useState(null); // { kind: "repay" | "reject", rows }

  useEffect(() => {
    fetchPeople({ authHeaders })
      .then((d) => setPeople(d?.people || []))
      .catch(() => toast.error("Could not load the list of people"));
  }, [authHeaders]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchOverviewAll({ filters, authHeaders }));
    } catch {
      toast.error("Could not load the expenses");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters, authHeaders]);

  useEffect(() => {
    const id = setTimeout(load, 250);
    return () => clearTimeout(id);
  }, [load]);

  const expenses = useMemo(() => data?.expenses ?? [], [data]);

  const duplicateKeys = useMemo(() => {
    const seen = new Map();
    expenses.forEach((e) => {
      if (e.status === "REJECTED") return;
      const key = `${e.userId}|${e.categoryId}|${e.expenseDate}|${e.amount ?? e.units}`;
      seen.set(key, (seen.get(key) || 0) + 1);
    });
    return new Set([...seen].filter(([, n]) => n > 1).map(([k]) => k));
  }, [expenses]);

  const byUser = useMemo(() => {
    const map = new Map();
    expenses.forEach((e) => map.set(e.userId, [...(map.get(e.userId) || []), e]));
    return map;
  }, [expenses]);

  const persons = useMemo(() => data?.byPerson ?? [], [data]);
  const canDecide = (e) => e.status === "SUBMITTED" && e.userId !== me?.userId;
  const selectable = useMemo(() => expenses.filter(canDecide), [expenses, me]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedRows = selectable.filter((e) => selected.has(e._id));
  const selectedTotal = selectedRows.reduce((t, e) => t + (Number(e.reimbursable) || 0), 0);

  // Keep the selection to rows that are still on screen and still waiting.
  useEffect(() => {
    setSelected((prev) => {
      const live = new Set(selectable.map((e) => e._id));
      const next = new Set([...prev].filter((id) => live.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [selectable]);

  const toggle = (rows, on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      rows.forEach((r) => (on ? next.add(r._id) : next.delete(r._id)));
      return next;
    });

  const set = (key) => (value) => setFilters((f) => ({ ...f, [key]: value || "" }));
  const departments = [...new Set(people.flatMap((p) => p.departments || []))].sort();

  const settleUp = (userId) => {
    const rows = (byUser.get(userId) || []).filter(canDecide);
    if (rows.length === 0) return toast.info("Nothing waiting for this person");
    setDialog({ kind: "repay", rows });
  };

  const afterDecision = (updatedIds) => {
    toggle(
      expenses.filter((e) => updatedIds.includes(e._id)),
      false,
    );
    load();
  };

  const exportExcel = async () => {
    if (expenses.length === 0) return toast.info("No expenses to download for these filters");
    await downloadExpensesExcel(data, filters);
  };

  const totals = data?.totals || {};
  const allSelected = selectable.length > 0 && selectedRows.length === selectable.length;

  return (
    <div className="ee-tab">
      <div className="ee-filters">
        <DateField label="From" value={filters.startDate} onChange={set("startDate")} />
        <DateField label="To" value={filters.endDate} onChange={set("endDate")} />
        <SelectField
          label="Person"
          value={filters.userId}
          onChange={set("userId")}
          options={people.map((p) => ({ value: p.userId, label: p.name }))}
          placeholder="Everyone"
          allowClear
        />
        <SelectField
          label="Department"
          value={filters.department}
          onChange={set("department")}
          options={departments.map((d) => ({ value: d, label: d }))}
          placeholder="All departments"
          allowClear
        />
        <SelectField
          label="Category"
          value={filters.categoryId}
          onChange={set("categoryId")}
          options={categories.map((c) => ({ value: c._id, label: c.group ? `${c.group} · ${c.name}` : c.name }))}
          placeholder="All categories"
          allowClear
        />
        <SelectField label="Status" value={filters.status} onChange={set("status")} options={STATUS_OPTIONS} placeholder="Any status" allowClear />
      </div>

      <div className="ee-toolbar">
        <label className="ee-selectall">
          <input
            type="checkbox"
            checked={allSelected}
            disabled={selectable.length === 0}
            onChange={(e) => toggle(selectable, e.target.checked)}
          />
          <span>Select all waiting for repayment ({selectable.length})</span>
        </label>
        <ExcelDownloadButton label="Download Excel" onDownload={exportExcel} disabled={expenses.length === 0} />
      </div>

      <StatRow>
        <StatCard icon={<Users size={21} aria-hidden="true" />} label="People" value={persons.length} />
        <StatCard tone="blue" icon={<BadgeIndianRupee size={21} aria-hidden="true" />} label="Reimbursable" value={formatMoney(totals.reimbursable)} />
        <StatCard icon={<BadgeIndianRupee size={21} aria-hidden="true" />} label="Repaid" value={formatMoney(totals.repaid)} />
        <StatCard tone="gold" icon={<BadgeIndianRupee size={21} aria-hidden="true" />} label="Pending repayment" value={formatMoney(totals.pending)} />
      </StatRow>

      {loading && !data ? (
        <div className="ee-skeleton" aria-hidden="true">
          <i /> <i /> <i />
        </div>
      ) : persons.length === 0 ? (
        <EmptyState icon={<Users size={24} aria-hidden="true" />} title="No expenses for these filters" hint="Change the dates or clear a filter." />
      ) : (
        <div className="ee-people">
          {persons.map((p) => {
            const rows = byUser.get(p.userId) || [];
            const isOpen = open.has(p.userId);
            const waiting = rows.filter(canDecide);
            return (
              <section key={p.userId} className="ee-person">
                <header>
                  <button
                    type="button"
                    className="ee-person-toggle"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpen((prev) => {
                        const next = new Set(prev);
                        if (isOpen) next.delete(p.userId);
                        else next.add(p.userId);
                        return next;
                      })
                    }
                  >
                    {isOpen ? <ChevronDown size={17} aria-hidden="true" /> : <ChevronRight size={17} aria-hidden="true" />}
                    <span className="ee-avatar" aria-hidden="true">
                      {String(p.name || "?").charAt(0).toUpperCase()}
                    </span>
                    <span className="ee-person-name">
                      <strong>{p.name}</strong>
                      <em>{p.count} {p.count === 1 ? "entry" : "entries"}</em>
                    </span>
                  </button>
                  <div className="ee-person-sums">
                    <span>
                      <em>Reimbursable</em>
                      {formatMoney(p.reimbursable)}
                    </span>
                    <span>
                      <em>Repaid</em>
                      {formatMoney(p.repaid)}
                    </span>
                    <span className={p.pending > 0 ? "is-owed" : ""}>
                      <em>Pending</em>
                      {formatMoney(p.pending)}
                    </span>
                    <button type="button" className="ee-settle" disabled={waiting.length === 0} onClick={() => settleUp(p.userId)}>
                      Settle up
                    </button>
                  </div>
                </header>

                {isOpen ? (
                  <div className="ee-scroll">
                    <table className="ee-table">
                      <thead>
                        <tr>
                          <th aria-label="Select" />
                          <th>Date</th>
                          <th>Category</th>
                          <th className="r">Spent</th>
                          <th className="r">To repay</th>
                          <th>Status</th>
                          <th>Flags</th>
                          <th>Bills</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((e) => {
                          const flags = flagsOf(e, duplicateKeys);
                          return (
                            <tr key={e._id} className={e.status === "REJECTED" ? "is-rejected" : ""}>
                              <td>
                                {canDecide(e) ? (
                                  <input
                                    type="checkbox"
                                    aria-label={`Select ${e.categorySnapshot?.name || "expense"} on ${dayText(e.expenseDate)}`}
                                    checked={selected.has(e._id)}
                                    onChange={(ev) => toggle([e], ev.target.checked)}
                                  />
                                ) : null}
                              </td>
                              <td>{dayText(e.expenseDate)}</td>
                              <td>
                                <strong>{e.categorySnapshot?.name || "-"}</strong>
                                {e.cappedBy ? <em className="ee-sub">{e.cappedBy}</em> : null}
                                {e.note ? <em className="ee-sub">{e.note}</em> : null}
                                {e.status === "REJECTED" && e.rejection?.reason ? <em className="ee-sub is-bad">Rejected: {e.rejection.reason}</em> : null}
                                {e.status === "REPAID" && e.repayment ? (
                                  <em className="ee-sub">
                                    Repaid {dayText(e.repayment.date)} · {e.repayment.mode}
                                    {e.repayment.reference ? ` · ${e.repayment.reference}` : ""}
                                  </em>
                                ) : null}
                              </td>
                              <td className="r">{e.amount == null || e.amount === "" ? "-" : formatMoney(e.amount)}</td>
                              <td className="r">
                                <strong>{formatMoney(e.reimbursable)}</strong>
                              </td>
                              <td>
                                <StatusChip status={e.status} />
                              </td>
                              <td>
                                {flags.length === 0 ? (
                                  <span className="ee-muted">—</span>
                                ) : (
                                  <div className="ee-flags">
                                    {flags.map((f) => (
                                      <span key={f}>{f}</span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td>
                                {(e.bills || []).length === 0 ? (
                                  <span className="ee-muted">—</span>
                                ) : (
                                  <div className="ee-chips">
                                    {e.bills.map((b, i) => (
                                      <button key={b.key} type="button" className="ee-bill-chip" title={b.name} onClick={() => openBill({ key: b.key, authHeaders })}>
                                        <Paperclip size={12} aria-hidden="true" /> {e.bills.length > 1 ? i + 1 : "View"}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      )}

      <SelectionBar
        count={selectedRows.length}
        total={selectedTotal}
        onRepay={() => setDialog({ kind: "repay", rows: selectedRows })}
        onReject={() => setDialog({ kind: "reject", rows: selectedRows })}
        onClear={() => setSelected(new Set())}
      />
      <RepayDialog
        open={dialog?.kind === "repay"}
        rows={dialog?.rows || []}
        authHeaders={authHeaders}
        onClose={() => setDialog(null)}
        onDone={afterDecision}
      />
      <RejectDialog
        open={dialog?.kind === "reject"}
        rows={dialog?.rows || []}
        authHeaders={authHeaders}
        onClose={() => setDialog(null)}
        onDone={afterDecision}
      />
    </div>
  );
};

export default OverviewTab;
