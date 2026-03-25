import React from "react";
import { Card, Col, Row, Skeleton, Typography } from "antd";
import { formatAmountINR } from "./daybookUtils";
import DaybookProfitLossCard from "./DaybookProfitLossCard";

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

const DaybookSummaryCards = ({
  loading,
  inflow,
  outflow,
  profitAndLoss,
  selectedDateLabel,
}) => {
  const inflowTotal = inflow?.total ?? 0;
  const inflowCount = inflow?.count ?? 0;
  const outflowTotal = outflow?.total ?? 0;
  const outflowCount = outflow?.count ?? 0;

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
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Col>
          <Col xs={24} md={8}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Col>
          <Col xs={24} md={8}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Col>
        </Row>
      ) : (
        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} md={8}>
            <SummaryCard
              title="Inflow"
              amount={inflowTotal}
              count={inflowCount}
              gradient="linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%)"
            />
          </Col>
          <Col xs={24} md={8}>
            <SummaryCard
              title="Outflow"
              amount={outflowTotal}
              count={outflowCount}
              gradient="linear-gradient(135deg,#ef4444 0%,#dc2626 100%)"
            />
          </Col>
          <Col xs={24} md={8}>
            <DaybookProfitLossCard profitAndLoss={profitAndLoss} />
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default DaybookSummaryCards;

