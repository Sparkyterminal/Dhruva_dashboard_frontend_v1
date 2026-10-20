import React from "react";
import { getEventsListTotalsBucket } from "./clientBookingsUtils";
import "./Bookings.css";

/** tone: "" (green) | "gold" | "red" | "grey" */
const Stat = ({ title, subtitle, value, tone = "" }) => (
  <div className={`bk-stat${tone ? ` is-${tone}` : ""}`}>
    <p className="bk-stat-title">{title}</p>
    <p className="bk-stat-value">{value}</p>
    {subtitle && String(subtitle).trim() ? <p className="bk-stat-sub">{subtitle}</p> : null}
  </div>
);

const Group = ({ label, children }) => (
  <div className="bk-stat-group">
    <h3>{label}</h3>
    <div className="bk-stat-grid">{children}</div>
  </div>
);

/**
 * Renders aggregates from `totalsByStatus` (API contract) per active list tab.
 * Falls back to client-summed page props only when API block is missing.
 */
const ClientBookingsStatsCards = ({
  summary,
  statusKey = "all",
  totalPayableRevenue,
  totalPendingRevenue,
  totalReceivedRevenue,
  formatAmount,
}) => {
  const fmt = formatAmount || ((n) => `₹${Number(n || 0).toLocaleString("en-IN")}`);
  const totalsByStatus =
    summary && typeof summary === "object" ? summary.totalsByStatus : null;

  const hasApiTotals =
    totalsByStatus &&
    typeof totalsByStatus === "object" &&
    Object.keys(totalsByStatus).length > 0;

  const bucket = getEventsListTotalsBucket(totalsByStatus, statusKey);
  const allRollup = totalsByStatus?.all;

  if (!hasApiTotals) {
    return (
      <div className="bk-stats">
        <Group label="Amounts (this page only)">
          <Stat title="Total expected" value={fmt(totalPayableRevenue ?? 0)} />
          <Stat title="Total received" value={fmt(totalReceivedRevenue ?? 0)} />
          <Stat
            title="Difference (expected − received)"
            value={fmt(totalPendingRevenue ?? 0)}
            tone="gold"
          />
        </Group>
      </div>
    );
  }

  if (statusKey === "all" && allRollup) {
    return (
      <div className="bk-stats">
        <Group label="Amounts (₹)">
          <Stat
            title="Total expected"
            subtitle="Confirmed + In progress + Almost booked, total business (expected)"
            value={fmt(
              (allRollup.confirmedTotalExpectedAmount ?? 0) +
                (allRollup.pendingTotalExpectedAmount ?? 0) +
                (allRollup.almostBookedTotalExpectedAmount ?? 0),
            )}
          />
          <Stat
            title="Confirmed — total business"
            value={fmt(allRollup.confirmedTotalExpectedAmount ?? 0)}
          />
          <Stat
            title="In progress — total business (expected)"
            value={fmt(allRollup.pendingTotalExpectedAmount ?? 0)}
            tone="gold"
          />
          <Stat
            title="Almost booked — total business (expected)"
            value={fmt(allRollup.almostBookedTotalExpectedAmount ?? 0)}
          />
        </Group>
        <Group label="Booking counts">
          <Stat title="Total bookings" value={allRollup.totalBookingsNumber ?? 0} />
          <Stat
            title="Confirmed bookings"
            subtitle="Events marked as confirmed"
            value={allRollup.confirmedTotalBookingsNumber ?? 0}
          />
          <Stat
            title="In progress bookings"
            subtitle="Events still in the pipeline (not cancelled)"
            value={allRollup.pendingTotalBookingsNumber ?? 0}
            tone="gold"
          />
          <Stat
            title="Almost booked bookings"
            subtitle="Events that are nearly confirmed"
            value={allRollup.almostBookedTotalBookingsNumber ?? 0}
          />
        </Group>
      </div>
    );
  }

  if (statusKey === "confirmed" && bucket) {
    return (
      <div className="bk-stats">
        <Group label="Amounts (₹)">
          <Stat title="Total expected" value={fmt(bucket.totalExpectedAmount ?? 0)} />
          <Stat title="Total Booked" value={fmt(bucket.totalReceivedAmount ?? 0)} />
          <Stat title="Total balance" value={fmt(bucket.totalBalanceAmount ?? 0)} tone="gold" />
        </Group>
        <Group label="Booking counts">
          <Stat
            title="Confirmed bookings"
            subtitle="Total confirmed events in this view"
            value={bucket.totalBookingsNumber ?? 0}
          />
          <Stat
            title="Where payment has started"
            subtitle="Bookings where the client has already paid something (even a small part). Does not mean fully paid."
            value={bucket.bookingsWithAnyReceiptCount ?? 0}
          />
          <Stat
            title="Where full amount is not yet settled"
            subtitle="Bookings where money received still does not match the full agreed total (includes not started, partly paid, or rounding differences)."
            value={bucket.bookingsWithOutstandingBalanceCount ?? 0}
            tone="gold"
          />
        </Group>
      </div>
    );
  }

  if (statusKey === "inprogress" && bucket) {
    return (
      <div className="bk-stats">
        <div className="bk-stat-grid">
          <Stat title="In progress bookings" value={bucket.totalBookingsNumber ?? 0} tone="gold" />
          <Stat title="Total expected" value={fmt(bucket.totalExpectedAmount ?? 0)} />
        </div>
      </div>
    );
  }

  if (statusKey === "almostbooked" && bucket) {
    return (
      <div className="bk-stats">
        <div className="bk-stat-grid">
          <Stat title="Almost booked bookings" value={bucket.totalBookingsNumber ?? 0} />
          <Stat title="Total expected" value={fmt(bucket.totalExpectedAmount ?? 0)} />
        </div>
      </div>
    );
  }

  if (statusKey === "cancelled" && bucket) {
    return (
      <div className="bk-stats">
        <div className="bk-stat-grid">
          <Stat title="Cancelled bookings" value={bucket.totalBookingsNumber ?? 0} tone="red" />
          <Stat title="Total expected" value={fmt(bucket.totalExpectedAmount ?? 0)} tone="grey" />
        </div>
      </div>
    );
  }

  return null;
};

export default ClientBookingsStatsCards;
