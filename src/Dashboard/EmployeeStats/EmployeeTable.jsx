import React, { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Sparkline from "./charts/Sparkline";
import { SERIES } from "./charts/chartTokens";
import { formatCompactINR, formatINR, formatPercent, initials, rankEmployees } from "./statsMath";
import "./EmployeeStats.css";

const COLUMNS = [
  { key: "bookings", label: "Bookings", get: (t) => t.bookings, text: (t) => t.bookings },
  { key: "confirmed", label: "Confirmed", get: (t) => t.confirmed, text: (t) => t.confirmed },
  { key: "inProgress", label: "In progress", get: (t) => t.inProgress, text: (t) => t.inProgress },
  { key: "almostBooked", label: "Almost booked", get: (t) => t.almostBooked, text: (t) => t.almostBooked },
  { key: "cancelled", label: "Cancelled", get: (t) => t.cancelled, text: (t) => t.cancelled },
  { key: "conversionRate", label: "Conversion", get: (t) => t.conversionRate ?? -1, text: (t) => formatPercent(t.conversionRate) },
  { key: "bookedAmount", label: "Booked", get: (t) => t.bookedAmount, text: (t) => formatCompactINR(t.bookedAmount), full: (t) => formatINR(t.bookedAmount), strong: true },
  { key: "receivedAmount", label: "Received", get: (t) => t.receivedAmount, text: (t) => formatCompactINR(t.receivedAmount), full: (t) => formatINR(t.receivedAmount) },
  { key: "pendingAmount", label: "Pending", get: (t) => t.pendingAmount, text: (t) => formatCompactINR(t.pendingAmount), full: (t) => formatINR(t.pendingAmount) },
  { key: "avgBookingValue", label: "Avg booking", get: (t) => t.avgBookingValue ?? -1, text: (t) => (t.avgBookingValue == null ? "—" : formatCompactINR(t.avgBookingValue)), full: (t) => (t.avgBookingValue == null ? "" : formatINR(t.avgBookingValue)) },
];

/** Every employee with their numbers. Click a heading to sort; click a name for their detail panel. */
const EmployeeTable = ({ employees, onSelect }) => {
  const [sort, setSort] = useState({ key: "bookedAmount", dir: "desc" });

  const rows = useMemo(() => {
    const ranked = rankEmployees(employees, "bookedAmount"); // gives the overall rank by booked amount
    const column = COLUMNS.find((c) => c.key === sort.key) || COLUMNS[6];
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...ranked].sort(
      (a, b) => factor * (column.get(a.totals) - column.get(b.totals)) || String(a.name).localeCompare(String(b.name)),
    );
  }, [employees, sort]);

  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }));

  if (employees.length === 0) return null;

  return (
    <section className="es-panel" aria-label="All employees">
      <header className="es-panel-head">
        <h3>All employees</h3>
        <p>Click a heading to sort. Click a name to see their months and bookings.</p>
      </header>
      <div className="es-table-scroll">
        <table className="es-table">
          <thead>
            <tr>
              <th scope="col" className="es-col-name">Employee</th>
              {COLUMNS.map((c) => {
                const active = sort.key === c.key;
                const Icon = !active ? ChevronsUpDown : sort.dir === "desc" ? ArrowDown : ArrowUp;
                return (
                  <th key={c.key} scope="col" className="r" aria-sort={active ? (sort.dir === "desc" ? "descending" : "ascending") : "none"}>
                    <button type="button" onClick={() => toggle(c.key)}>
                      {c.label} <Icon size={12} aria-hidden="true" />
                    </button>
                  </th>
                );
              })}
              <th scope="col">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.userId ?? "unassigned"}>
                <th scope="row" className="es-col-name">
                  <span className="es-rank" title="Rank by booked amount">{e.metricValue > 0 ? e.rank : "–"}</span>
                  <span className="es-avatar" aria-hidden="true">{initials(e.name)}</span>
                  <span className="es-who">
                    {e.userId ? (
                      <button type="button" onClick={() => onSelect(e.userId)}>{e.name}</button>
                    ) : (
                      <strong>{e.name}</strong>
                    )}
                    <em>{(e.departments || []).join(", ") || "—"}</em>
                  </span>
                </th>
                {COLUMNS.map((c) => (
                  <td key={c.key} className={`r${c.strong ? " is-strong" : ""}`} title={c.full ? c.full(e.totals) : undefined}>
                    {c.text(e.totals)}
                  </td>
                ))}
                <td>
                  <Sparkline
                    values={e.byMonth.map((m) => m.bookedAmount)}
                    color={SERIES[0]}
                    label={`${e.name}: booked amount by month`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default EmployeeTable;
