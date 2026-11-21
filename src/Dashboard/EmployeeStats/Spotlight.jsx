import React from "react";
import { Crown, Sparkles } from "lucide-react";
import { formatCompactINR, formatINR, formatPercent, initials, rankEmployees, risingStar, shareOfTotal } from "./statsMath";
import "./EmployeeStats.css";

/** The top performer for the period (by booked amount) and, when there is a comparison, the rising star. */
const Spotlight = ({ employees, teamBooked, onSelect }) => {
  const ranked = rankEmployees(employees, "bookedAmount").filter((e) => e.metricValue > 0);
  if (ranked.length === 0) return null;

  const leaders = ranked.filter((e) => e.rank === 1);
  const lead = leaders[0];
  const share = shareOfTotal(lead.totals.bookedAmount, teamBooked);
  const star = risingStar(employees);

  return (
    <section className="es-spot" aria-label="Spotlight">
      <article className="es-top">
        <span className="es-top-crown" aria-hidden="true">
          <Crown size={22} />
        </span>
        <div className="es-top-body">
          <p className="es-top-kicker">Top performer</p>
          <h3>
            <button type="button" disabled={!lead.userId} onClick={() => lead.userId && onSelect(lead.userId)}>
              {lead.name}
            </button>
            {leaders.length > 1 ? <em> + {leaders.length - 1} tied</em> : null}
          </h3>
          <p className="es-top-dept">{(lead.departments || []).join(", ") || "—"}</p>
          <div className="es-top-stats">
            <div>
              <b title={formatINR(lead.totals.bookedAmount)}>{formatCompactINR(lead.totals.bookedAmount)}</b>
              <span>booked</span>
            </div>
            <div>
              <b>{lead.totals.confirmed}</b>
              <span>confirmed</span>
            </div>
            <div>
              <b>{share == null ? "—" : `${Math.round(share)}%`}</b>
              <span>of the team</span>
            </div>
            <div>
              <b>{formatPercent(lead.totals.conversionRate)}</b>
              <span>conversion</span>
            </div>
          </div>
        </div>
        <span className="es-avatar is-lg" aria-hidden="true">
          {initials(lead.name)}
        </span>
      </article>

      {star ? (
        <article className="es-star">
          <span className="es-star-icon" aria-hidden="true">
            <Sparkles size={20} />
          </span>
          <div>
            <p className="es-top-kicker">Rising star</p>
            <h3>
              <button type="button" disabled={!star.employee.userId} onClick={() => star.employee.userId && onSelect(star.employee.userId)}>
                {star.employee.name}
              </button>
            </h3>
            <p className="es-star-line">
              <b>+{star.percent}%</b> booked amount compared with the previous period
            </p>
            <p className="es-top-dept">
              {formatCompactINR(star.employee.previous.bookedAmount)} → {formatCompactINR(star.employee.totals.bookedAmount)}
            </p>
          </div>
        </article>
      ) : null}
    </section>
  );
};

export default Spotlight;
