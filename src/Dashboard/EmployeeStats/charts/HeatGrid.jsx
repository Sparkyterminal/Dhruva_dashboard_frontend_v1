import React from "react";
import { Crown } from "lucide-react";
import { formatCompactINR, formatINR, heatLevel, monthLabel } from "../statsMath";
import { HEAT_RAMP } from "./chartTokens";
import { EmptyChart } from "./ChartCard";
import TipLayer from "./TipLayer";
import { useChartTip } from "./useChartHelpers";
import "./Charts.css";

/**
 * Employee x month grid, shaded by booked amount (one green hue, light to dark, with a scale legend).
 * A crown marks the month's winner. It is a real table, so it reads fine without the colours.
 *   employees: { userId, name, totals, byMonth[] }[]   months: "YYYY-MM"[]   monthly: per-month totals
 *   winners: { [month]: userId | null }
 */
const HeatGrid = ({ employees, months, monthly, winners, onSelect }) => {
  const { tip, show, hide } = useChartTip();
  const cells = employees.flatMap((e) => e.byMonth.map((m) => Number(m.bookedAmount) || 0));
  const max = Math.max(0, ...cells);
  if (employees.length === 0 || max <= 0) return <EmptyChart>No confirmed bookings in this period.</EmptyChart>;

  return (
    <div className="ec-heat">
      <div className="ec-heat-scroll">
        <table>
          <caption className="ec-sr">Booked amount by employee and month. A crown marks the top employee of each month.</caption>
          <thead>
            <tr>
              <th scope="col" className="ec-heat-name">Employee</th>
              {months.map((m) => (
                <th key={m} scope="col">{monthLabel(m, false)}<small>{m.slice(0, 4)}</small></th>
              ))}
              <th scope="col" className="ec-heat-total">Total</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.userId ?? "unassigned"}>
                <th scope="row" className="ec-heat-name">
                  {onSelect && e.userId ? (
                    <button type="button" onClick={() => onSelect(e.userId)} title={e.name}>{e.name}</button>
                  ) : (
                    <span title={e.name}>{e.name}</span>
                  )}
                </th>
                {months.map((m) => {
                  const row = e.byMonth.find((x) => x.month === m) || {};
                  const value = Number(row.bookedAmount) || 0;
                  const step = HEAT_RAMP[heatLevel(value, max)];
                  const isWinner = winners?.[m] != null && winners[m] === e.userId && value > 0;
                  const tipNode = (
                    <>
                      <strong>{e.name} · {monthLabel(m)}</strong>
                      <span>Booked <b>{formatINR(value)}</b></span>
                      <span>{row.confirmed || 0} confirmed of {row.bookings || 0} bookings</span>
                      {isWinner ? <span>Top of the month</span> : null}
                    </>
                  );
                  return (
                    <td
                      key={m}
                      tabIndex={0}
                      style={{ background: step.bg, color: step.fg }}
                      aria-label={`${e.name}, ${monthLabel(m)}: ${formatINR(value)}${isWinner ? ", top of the month" : ""}`}
                      onMouseEnter={(ev) => show(ev.currentTarget, tipNode)}
                      onFocus={(ev) => show(ev.currentTarget, tipNode)}
                      onMouseLeave={hide}
                      onBlur={hide}
                    >
                      {isWinner ? <Crown size={12} aria-hidden="true" /> : null}
                      {value > 0 ? formatCompactINR(value) : "–"}
                    </td>
                  );
                })}
                <td className="ec-heat-total"><b>{formatCompactINR(e.totals.bookedAmount)}</b></td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="ec-heat-name">Team</th>
              {months.map((m) => {
                const row = (monthly || []).find((x) => x.month === m) || {};
                return <td key={m}>{(Number(row.bookedAmount) || 0) > 0 ? formatCompactINR(row.bookedAmount) : "–"}</td>;
              })}
              <td className="ec-heat-total"><b>{formatCompactINR(employees.reduce((t, e) => t + (Number(e.totals.bookedAmount) || 0), 0))}</b></td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="ec-heat-scale" aria-hidden="true">
        <span>None</span>
        {HEAT_RAMP.slice(1).map((s) => (
          <i key={s.bg} style={{ background: s.bg }} />
        ))}
        <span>Most</span>
      </div>
      <TipLayer tip={tip} />
    </div>
  );
};

export default HeatGrid;
