import React from "react";
import { Award, Crown } from "lucide-react";
import { formatCompactINR, formatINR, monthLabel, topOfMonth } from "./statsMath";
import "./EmployeeStats.css";

/**
 * One card per month of the period: who was top by booked amount and by confirmed bookings.
 * Uses the server's `monthlyTop`; if it is missing the winners are worked out from each employee's month rows.
 */
const MonthWinners = ({ months, monthly, monthlyTop, employees, onSelect }) => {
  if (!months || months.length === 0) return null;

  const winnerFor = (month, metric) => {
    const entry = (monthlyTop || []).find((m) => m.month === month);
    if (entry) return metric === "amount" ? entry.byAmount : entry.byBookings;
    return topOfMonth(employees, month, metric);
  };

  const teamBooked = (month) => Number((monthly || []).find((m) => m.month === month)?.bookedAmount) || 0;
  const best = Math.max(0, ...months.map(teamBooked));

  return (
    <section aria-label="Top of each month">
      <h3 className="es-h3">Who was on top, month by month</h3>
      <ol className="es-months">
        {months.map((month) => {
          const byAmount = winnerFor(month, "amount");
          const byBookings = winnerFor(month, "bookings");
          const total = teamBooked(month);
          const isBest = best > 0 && total === best;
          return (
            <li key={month} className={`es-month${byAmount ? "" : " is-quiet"}`}>
              <header>
                <strong>{monthLabel(month)}</strong>
                {isBest ? (
                  <span className="es-best">
                    <Award size={12} aria-hidden="true" /> Best month
                  </span>
                ) : null}
              </header>
              {byAmount ? (
                <>
                  <p className="es-month-win">
                    <Crown size={15} aria-hidden="true" />
                    <button type="button" disabled={!byAmount.userId} onClick={() => byAmount.userId && onSelect(byAmount.userId)}>
                      {byAmount.name}
                    </button>
                  </p>
                  <p className="es-month-amt" title={formatINR(byAmount.bookedAmount)}>
                    {formatCompactINR(byAmount.bookedAmount)}
                    <span> · {byAmount.confirmed} confirmed</span>
                  </p>
                  {byBookings && byBookings.userId !== byAmount.userId ? (
                    <p className="es-month-alt">
                      Most bookings: <b>{byBookings.name}</b> ({byBookings.confirmed})
                    </p>
                  ) : null}
                  <p className="es-month-team">Team booked {formatCompactINR(total)}</p>
                </>
              ) : (
                <p className="es-month-none">No confirmed bookings</p>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
};

export default MonthWinners;
