import React from "react";
import { BadgeIndianRupee, CircleCheck, ClipboardList, Clock3, Percent, Hourglass, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { changeInPoints, changeVsPrevious, formatCompactINR, formatINR, formatPercent, shareOfTotal } from "./statsMath";
import "./EmployeeStats.css";

/**
 * "▲ 12.5% vs previous period". Direction and meaning are separate: more pending money is a rise but not good.
 * An icon and words always come with the colour.
 */
const Delta = ({ change, upIsGood = true, unit = "%" }) => {
  if (!change || change.kind === "none") return null;
  const amount = unit === "pts" ? change.points : change.percent;
  let text;
  let Icon = Minus;
  if (change.kind === "new") text = "New";
  else if (change.kind === "flat") text = "No change";
  else {
    Icon = change.kind === "up" ? TrendingUp : TrendingDown;
    text = `${Math.abs(amount)}${unit === "pts" ? " pts" : "%"}`;
  }
  const good = change.kind === "up" ? upIsGood : change.kind === "down" ? !upIsGood : null;
  const tone = change.kind === "flat" ? "is-flat" : change.kind === "new" ? "is-new" : good ? "is-good" : "is-bad";
  const word = change.kind === "up" ? "up" : change.kind === "down" ? "down" : change.kind === "new" ? "new" : "unchanged";
  return (
    <span className={`es-delta ${tone}`} title="Compared with the previous period of the same length">
      <Icon size={13} aria-hidden="true" />
      {text}
      <span className="es-sr"> {word} compared with the previous period</span>
    </span>
  );
};

const Card = ({ icon, label, value, full, sub, delta }) => (
  <div className="es-kpi">
    <span className="es-kpi-icon" aria-hidden="true">{icon}</span>
    <div>
      <p className="es-kpi-label">{label}</p>
      <p className="es-kpi-value" title={full}>{value}</p>
      <p className="es-kpi-sub">
        {delta}
        {sub ? <span>{sub}</span> : null}
      </p>
    </div>
  </div>
);

/** The six headline numbers for the period, each compared with the previous period when there is one. */
const KpiCards = ({ totals, previous }) => {
  const t = totals || {};
  const p = previous || null;
  const receivedShare = shareOfTotal(t.receivedAmount, t.bookedAmount);
  return (
    <section className="es-kpis" aria-label="Summary for the period">
      <Card
        icon={<ClipboardList size={20} />}
        label="Bookings"
        value={t.bookings ?? 0}
        sub={`${t.confirmed ?? 0} confirmed`}
        delta={<Delta change={changeVsPrevious(t.bookings, p?.bookings)} />}
      />
      <Card
        icon={<BadgeIndianRupee size={20} />}
        label="Booked amount"
        value={formatCompactINR(t.bookedAmount)}
        full={formatINR(t.bookedAmount)}
        sub={t.confirmed ? `avg ${formatCompactINR(t.avgBookingValue)}` : null}
        delta={<Delta change={changeVsPrevious(t.bookedAmount, p?.bookedAmount)} />}
      />
      <Card
        icon={<CircleCheck size={20} />}
        label="Received"
        value={formatCompactINR(t.receivedAmount)}
        full={formatINR(t.receivedAmount)}
        sub={receivedShare == null ? null : `${Math.round(receivedShare)}% of booked`}
        delta={<Delta change={changeVsPrevious(t.receivedAmount, p?.receivedAmount)} />}
      />
      <Card
        icon={<Clock3 size={20} />}
        label="Pending"
        value={formatCompactINR(t.pendingAmount)}
        full={formatINR(t.pendingAmount)}
        sub="still to collect"
        delta={<Delta change={changeVsPrevious(t.pendingAmount, p?.pendingAmount)} upIsGood={false} />}
      />
      <Card
        icon={<Percent size={20} />}
        label="Conversion"
        value={formatPercent(t.conversionRate)}
        sub="confirmed of all bookings"
        delta={<Delta change={changeInPoints(t.conversionRate, p ? p.conversionRate : null)} unit="pts" />}
      />
      <Card
        icon={<Hourglass size={20} />}
        label="Pipeline"
        value={formatCompactINR(t.pipelineAmount)}
        full={formatINR(t.pipelineAmount)}
        sub="in progress + almost booked"
        delta={<Delta change={changeVsPrevious(t.pipelineAmount, p?.pipelineAmount)} />}
      />
    </section>
  );
};

export default KpiCards;
