import React from "react";
import { Card, Row, Col, Statistic, Typography } from "antd";
import { getEventsListTotalsBucket } from "./clientBookingsUtils";

const { Text } = Typography;

const cardStyle = (leftColor) => ({
  borderRadius: "14px",
  background: "white",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  borderLeft: `4px solid ${leftColor}`,
});

const colThree = { xs: 24, sm: 12, lg: 8 };

const SectionLabel = ({ children }) => (
  <Col span={24} className="mb-2">
    <Text className="text-slate-600 text-sm font-semibold uppercase tracking-wide">
      {children}
    </Text>
  </Col>
);

const MoneyCard = ({ title, subtitle, value, color, formatAmount }) => (
  <Col {...colThree}>
    <Card
      className="border-0 h-full"
      style={cardStyle(color)}
      bodyStyle={{ padding: "20px" }}
    >
      <Text className="text-slate-500 text-sm font-medium block">{title}</Text>
      {subtitle ? (
        <Text type="secondary" className="text-xs block mt-1 leading-snug">
          {subtitle}
        </Text>
      ) : null}
      <div
        className="text-slate-800 tabular-nums"
        style={{ fontSize: "26px", fontWeight: 700, marginTop: "10px" }}
      >
        {formatAmount(value)}
      </div>
    </Card>
  </Col>
);

const CountCard = ({ title, subtitle, value, color }) => (
  <Col {...colThree}>
    <Card
      className="border-0 h-full"
      style={cardStyle(color)}
      bodyStyle={{ padding: "20px" }}
    >
      <Text className="text-slate-500 text-sm font-medium block">{title}</Text>
      {subtitle ? (
        <Text type="secondary" className="text-xs block mt-1 leading-snug">
          {subtitle}
        </Text>
      ) : null}
      <div
        className="text-slate-800 tabular-nums"
        style={{ fontSize: "28px", fontWeight: 700, marginTop: "10px" }}
      >
        {value ?? 0}
      </div>
    </Card>
  </Col>
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
      <div className="mb-6">
        <Row gutter={[16, 8]}>
          <SectionLabel>Amounts (this page only)</SectionLabel>
        </Row>
        <Row gutter={[16, 16]} align="stretch">
          <MoneyCard
            title="Total expected"
            value={totalPayableRevenue ?? 0}
            color="#10b981"
            formatAmount={fmt}
          />
          <MoneyCard
            title="Total received"
            value={totalReceivedRevenue ?? 0}
            color="#22c55e"
            formatAmount={fmt}
          />
          <MoneyCard
            title="Difference (expected − received)"
            value={totalPendingRevenue ?? 0}
            color="#f59e0b"
            formatAmount={fmt}
          />
        </Row>
      </div>
    );
  }

  if (statusKey === "all" && allRollup) {
    return (
      <div className="mb-6 space-y-5">
        <Row gutter={[16, 8]}>
          <SectionLabel>Amounts (₹)</SectionLabel>
        </Row>
        <Row gutter={[16, 16]} align="stretch">
          <MoneyCard
            title="Total expected"
            value={allRollup.totalExpectedAmount ?? 0}
            color="#10b981"
            formatAmount={fmt}
          />
          <MoneyCard
            title="Confirmed — total business"
            value={allRollup.confirmedTotalExpectedAmount ?? 0}
            color="#22c55e"
            formatAmount={fmt}
          />
          <MoneyCard
            title="In progress — total business (expected)"
            value={allRollup.pendingTotalExpectedAmount ?? 0}
            color="#f59e0b"
            formatAmount={fmt}
          />
        </Row>

        <Row gutter={[16, 8]}>
          <SectionLabel>Booking counts</SectionLabel>
        </Row>
        <Row gutter={[16, 16]} align="stretch">
          <CountCard
            title="Total bookings"
            subtitle=" "
            value={allRollup.totalBookingsNumber ?? 0}
            color="#6366f1"
          />
          <CountCard
            title="Confirmed bookings"
            subtitle="Events marked as confirmed"
            value={allRollup.confirmedTotalBookingsNumber ?? 0}
            color="#22c55e"
          />
          <CountCard
            title="In progress bookings"
            subtitle="Events still in the pipeline (not cancelled)"
            value={allRollup.pendingTotalBookingsNumber ?? 0}
            color="#f59e0b"
          />
        </Row>
      </div>
    );
  }

  if (statusKey === "confirmed" && bucket) {
    return (
      <div className="mb-6 space-y-5">
        <Row gutter={[16, 8]}>
          <SectionLabel>Amounts (₹)</SectionLabel>
        </Row>
        <Row gutter={[16, 16]} align="stretch">
          <MoneyCard
            title="Total expected"
            value={bucket.totalExpectedAmount ?? 0}
            color="#10b981"
            formatAmount={fmt}
          />
          <MoneyCard
            title="Total received"
            value={bucket.totalReceivedAmount ?? 0}
            color="#22c55e"
            formatAmount={fmt}
          />
          <MoneyCard
            title="Total balance"
            subtitle=" "
            value={bucket.totalBalanceAmount ?? 0}
            color="#f59e0b"
            formatAmount={fmt}
          />
        </Row>

        <Row gutter={[16, 8]}>
          <SectionLabel>Booking counts</SectionLabel>
        </Row>
        <Row gutter={[16, 16]} align="stretch">
          <CountCard
            title="Confirmed bookings"
            subtitle="Total confirmed events in this view"
            value={bucket.totalBookingsNumber ?? 0}
            color="#6366f1"
          />
          <CountCard
            title="Where payment has started"
            subtitle="Bookings where the client has already paid something (even a small part). Does not mean fully paid."
            value={bucket.bookingsWithAnyReceiptCount ?? 0}
            color="#22c55e"
          />
          <CountCard
            title="Where full amount is not yet settled"
            subtitle="Bookings where money received still does not match the full agreed total (includes not started, partly paid, or rounding differences)."
            value={bucket.bookingsWithOutstandingBalanceCount ?? 0}
            color="#f59e0b"
          />
        </Row>
      </div>
    );
  }

  if (statusKey === "inprogress" && bucket) {
    return (
      <Row gutter={[16, 16]} className="mb-6" align="stretch">
        <Col {...colThree}>
          <Card
            className="border-0 h-full"
            style={cardStyle("#f59e0b")}
            bodyStyle={{ padding: "20px" }}
          >
            <Statistic
              title={
                <Text className="text-slate-500 text-sm font-medium">
                  In progress bookings
                </Text>
              }
              value={bucket.totalBookingsNumber ?? 0}
              valueStyle={{
                color: "#1e293b",
                fontSize: "26px",
                fontWeight: 700,
                marginTop: "8px",
              }}
            />
          </Card>
        </Col>
        <Col {...colThree}>
          <Card
            className="border-0 h-full"
            style={cardStyle("#10b981")}
            bodyStyle={{ padding: "20px" }}
          >
            <Statistic
              title={
                <Text className="text-slate-500 text-sm font-medium">
                  Total expected
                </Text>
              }
              value={bucket.totalExpectedAmount ?? 0}
              valueStyle={{
                color: "#1e293b",
                fontSize: "26px",
                fontWeight: 700,
                marginTop: "8px",
              }}
              formatter={(v) => fmt(v)}
            />
          </Card>
        </Col>
      </Row>
    );
  }

  if (statusKey === "cancelled" && bucket) {
    return (
      <Row gutter={[16, 16]} className="mb-6" align="stretch">
        <Col {...colThree}>
          <Card
            className="border-0 h-full"
            style={cardStyle("#ef4444")}
            bodyStyle={{ padding: "20px" }}
          >
            <Statistic
              title={
                <Text className="text-slate-500 text-sm font-medium">
                  Cancelled bookings
                </Text>
              }
              value={bucket.totalBookingsNumber ?? 0}
              valueStyle={{
                color: "#1e293b",
                fontSize: "26px",
                fontWeight: 700,
                marginTop: "8px",
              }}
            />
          </Card>
        </Col>
        <Col {...colThree}>
          <Card
            className="border-0 h-full"
            style={cardStyle("#94a3b8")}
            bodyStyle={{ padding: "20px" }}
          >
            <Statistic
              title={
                <Text className="text-slate-500 text-sm font-medium">
                  Total expected
                </Text>
              }
              value={bucket.totalExpectedAmount ?? 0}
              valueStyle={{
                color: "#1e293b",
                fontSize: "26px",
                fontWeight: 700,
                marginTop: "8px",
              }}
              formatter={(v) => fmt(v)}
            />
          </Card>
        </Col>
      </Row>
    );
  }

  return null;
};

export default ClientBookingsStatsCards;
