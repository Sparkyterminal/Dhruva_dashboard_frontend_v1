import React from "react";
import { Card, Row, Col, Statistic, Typography } from "antd";

const { Text } = Typography;

const cardStyle = (leftColor) => ({
  borderRadius: "14px",
  background: "white",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  borderLeft: `4px solid ${leftColor}`,
});

const ClientBookingsStatsCards = ({
  summary,
  // Legacy props (used only when `summary` is not provided)
  totalBookings,
  totalPayableRevenue,
  totalPendingRevenue,
  totalReceivedRevenue,
  formatAmount,
}) => {
  const useApiSummary =
    summary && typeof summary === "object" && summary.totalBookings != null;

  const apiCards = useApiSummary
    ? [
        {
          title: "Total Bookings",
          value: summary.totalBookings ?? 0,
          color: "#6366f1",
        },
        {
          title: "Bookings in Response",
          value: summary.bookingsInResponse ?? 0,
          color: "#3b82f6",
        },
        {
          title: "Total Expected Advance",
          value: summary.totalExpectedAdvance ?? 0,
          color: "#10b981",
          money: true,
        },
        {
          title: "Total Received Amount",
          value: summary.totalReceivedAmount ?? 0,
          color: "#22c55e",
          money: true,
        },
        {
          title: "Total Pending Advance",
          value: summary.totalPendingAdvance ?? 0,
          color: "#f59e0b",
          money: true,
        },
        {
          title: "Total Advance Entries",
          value: summary.totalAdvanceEntries ?? 0,
          color: "#f97316",
        },
        {
          title: "Total Payable Sum",
          value: summary.totalPayableSum ?? 0,
          color: "#ec4899",
          money: true,
        },
      ]
    : [
        // Fallback to old 4-card layout (current page dataset computed on client)
        { title: "Total Bookings", value: totalBookings ?? 0, color: "#6366f1" },
        {
          title: "Total Payable",
          value: totalPayableRevenue ?? 0,
          color: "#10b981",
          money: true,
        },
        {
          title: "Pending Amount",
          value: totalPendingRevenue ?? 0,
          color: "#f59e0b",
          money: true,
        },
        {
          title: "Amount Received",
          value: totalReceivedRevenue ?? 0,
          color: "#22c55e",
          money: true,
        },
      ];

  return (
    <Row gutter={[16, 16]} className="mb-6" align="stretch">
      {apiCards.map((c) => (
        <Col key={c.title} xs={24} sm={12} md={6}>
          <Card className="border-0 h-full" style={cardStyle(c.color)} bodyStyle={{ padding: "20px" }}>
            <Statistic
              title={
                <Text className="text-slate-500 text-sm font-medium">
                  {c.title}
                </Text>
              }
              value={c.value}
              valueStyle={{
                color: "#1e293b",
                fontSize: "28px",
                fontWeight: "700",
                marginTop: "8px",
              }}
              formatter={c.money ? (value) => formatAmount(value) : undefined}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default ClientBookingsStatsCards;
