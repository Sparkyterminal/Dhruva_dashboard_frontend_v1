import React from "react";
import { Card, Col, Row, Skeleton, Typography } from "antd";
import { formatAmountINR } from "./daybookUtils";

const { Text } = Typography;

const SummaryCard = ({ title, amount, count, gradient }) => {
  const safeAmount = Number(amount) || 0;
  return (
    <Card
      style={{
        background: gradient,
        borderRadius: 16,
        border: "none",
        color: "white",
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
      bodyStyle={{ padding: "18px 18px" }}
    >
      <Text style={{ color: "rgba(255,255,255,0.92)", fontWeight: 700 }}>
        {title}
      </Text>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6 }}>
        {formatAmountINR(safeAmount)}
      </div>
      <div style={{ marginTop: 6, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
        Count: {count ?? 0}
      </div>
    </Card>
  );
};

const BalanceValueCard = ({ title, amount, valueColor }) => {
  const safeAmount = Number(amount) || 0;
  return (
    <Card
      style={{
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        background: "#ffffff",
      }}
      bodyStyle={{ padding: "14px 16px" }}
    >
      <Text className="text-slate-500" style={{ fontWeight: 600 }}>
        {title}
      </Text>
      <div
        style={{
          marginTop: 4,
          fontSize: 22,
          lineHeight: 1.1,
          fontWeight: 800,
          color: valueColor || "#0f172a",
        }}
      >
        {formatAmountINR(safeAmount)}
      </div>
    </Card>
  );
};

const DaybookSummaryCards = ({
  loading,
  inflow,
  outflow,
  accounts,
  selectedDateLabel,
}) => {
  const inflowTotal = inflow?.total ?? 0;
  const inflowCount = inflow?.count ?? 0;
  const outflowTotal = outflow?.total ?? 0;
  const outflowCount = outflow?.count ?? 0;
  const currentBalance = Array.isArray(accounts?.openCloseBalances)
    ? accounts.openCloseBalances[0]
    : null;

  return (
    <Card
      className="border-0 shadow-sm"
      style={{
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(10px)",
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      <div style={{ marginBottom: 14 }}>
        <Text className="text-slate-700 font-semibold">
          Summary for {selectedDateLabel || "-"}
        </Text>
      </div>

      {loading ? (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Col>
            <Col xs={24} md={6}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Col>
            <Col xs={24} md={6}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Col>
            <Col xs={24} md={6}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col xs={24} md={12}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Col>
            <Col xs={24} md={12}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Col>
          </Row>
        </>
      ) : (
        <>
          <Row gutter={[16, 16]} align="stretch" style={{ marginBottom: 8 }}>
            <Col xs={24} sm={12} lg={6}>
              <BalanceValueCard
                title="Cash Opening Balance"
                amount={currentBalance?.cashOpeningBalance}
                valueColor="#15803d"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <BalanceValueCard
                title="Cash Closing Balance"
                amount={currentBalance?.cashClosingBalance}
                valueColor="#dc2626"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <BalanceValueCard
                title="Account Opening Balance"
                amount={currentBalance?.accountOpeningBalance}
                valueColor="#15803d"
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <BalanceValueCard
                title="Account Closing Balance"
                amount={currentBalance?.accountClosingBalance}
                valueColor="#dc2626"
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} align="stretch">
            <Col xs={24} md={12}>
              <SummaryCard
                title="Inflow"
                amount={inflowTotal}
                count={inflowCount}
                gradient="linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)"
              />
            </Col>
            <Col xs={24} md={12}>
              <SummaryCard
                title="Outflow"
                amount={outflowTotal}
                count={outflowCount}
                gradient="linear-gradient(135deg,#ef4444 0%,#dc2626 100%)"
              />
            </Col>
          </Row>
        </>
      )}
    </Card>
  );
};

export default DaybookSummaryCards;

