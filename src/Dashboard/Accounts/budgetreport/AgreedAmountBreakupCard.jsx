import React from "react";
import { Card, Col, Divider, Row, Tag, Typography } from "antd";

const { Text } = Typography;

const formatAmount = (amount) => {
  if (amount != null && !isNaN(Number(amount)))
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  return "₹0";
};

/**
 * Returns true if event is "complete" style (single package: one card for first eventType only).
 */
const isCompletePaymentWedding = (event) => {
  const name = typeof event?.eventName === "object" ? event?.eventName?.name : event?.eventName;
  return name === "Wedding" && event?.advancePaymentType === "complete";
};

/**
 * Read-only agreed amount breakup: Agreed Amount, Account Amount, GST, Account+GST, Cash, Total Payable.
 * No advances. Used in BudgetReportHome and BudgetReportEventWise drawer.
 */
const AgreedAmountBreakupCard = ({ event }) => {
  if (!event?.eventTypes?.length) return null;

  const renderAmountRow = (eventType) => (
    <Row gutter={[12, 12]}>
      <Col xs={24} sm={12} md={8}>
        <div className="p-2 rounded" style={{ background: "#f0fdf4" }}>
          <Text className="text-xs text-gray-500 block">Agreed Amount</Text>
          <Text strong style={{ color: "#166534" }}>
            {formatAmount(eventType.agreedAmount)}
          </Text>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <div className="p-2 rounded" style={{ background: "#eff6ff" }}>
          <Text className="text-xs text-gray-500 block">Account Amount</Text>
          <Text strong style={{ color: "#1e40af" }}>
            {formatAmount(eventType.accountAmount)}
          </Text>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <div className="p-2 rounded" style={{ background: "#faf5ff" }}>
          <Text className="text-xs text-gray-500 block">GST (18%)</Text>
          <Text strong style={{ color: "#6b21a8" }}>
            {formatAmount(eventType.accountGst)}
          </Text>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <div className="p-2 rounded" style={{ background: "#fdf2f8" }}>
          <Text className="text-xs text-gray-500 block">Account + GST</Text>
          <Text strong style={{ color: "#9d174d" }}>
            {formatAmount(eventType.accountAmountWithGst)}
          </Text>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <div className="p-2 rounded" style={{ background: "#fefce8" }}>
          <Text className="text-xs text-gray-500 block">Cash Amount</Text>
          <Text strong style={{ color: "#854d0e" }}>
            {formatAmount(eventType.cashAmount)}
          </Text>
        </div>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <div className="p-2 rounded" style={{ background: "#ecfdf5" }}>
          <Text className="text-xs text-gray-500 block">Total Payable</Text>
          <Text strong style={{ color: "#065f46" }}>
            {formatAmount(eventType.totalPayable)}
          </Text>
        </div>
      </Col>
    </Row>
  );

  const eventName = typeof event.eventName === "object" ? event.eventName?.name : event.eventName;

  if (isCompletePaymentWedding(event) && event.eventTypes[0]) {
    return (
      <Card
        style={{
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: 16,
        }}
        title={
          <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
            Agreed Amount & Breakup (Complete Package)
          </span>
        }
        bodyStyle={{ padding: "16px 20px" }}
      >
        <Divider style={{ margin: "12px 0" }}>Amount Breakdown</Divider>
        {renderAmountRow(event.eventTypes[0])}
      </Card>
    );
  }

  return (
    <>
      {event.eventTypes.map((eventType, index) => (
        <Card
          key={eventType._id || index}
          style={{
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            marginBottom: 16,
          }}
          title={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "14px" }}>
                {eventType.eventType?.name || eventType.eventType || "Event Type"} — Agreed Amount & Breakup
              </span>
              <Tag color="blue" style={{ borderRadius: 6, margin: 0 }}>
                Event {index + 1}
              </Tag>
            </div>
          }
          bodyStyle={{ padding: "16px 20px" }}
        >
          <Divider style={{ margin: "12px 0" }}>Amount Breakdown</Divider>
          {renderAmountRow(eventType)}
        </Card>
      ))}
    </>
  );
};

export default AgreedAmountBreakupCard;
