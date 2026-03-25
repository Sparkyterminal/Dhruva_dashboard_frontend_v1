import React from "react";
import { Card, Col, Row, Typography, Tag } from "antd";
import { formatAmountINR } from "./daybookUtils";

const { Text } = Typography;

const DaybookProfitLossCard = ({ profitAndLoss }) => {
  const rawValue = profitAndLoss?.value ?? 0;
  const value = Number(rawValue) || 0;
  const type =
    profitAndLoss?.type ||
    (value >= 0 ? "PROFIT" : "LOSS");

  const isProfit = String(type).toUpperCase() === "PROFIT" || value >= 0;
  const gradient = isProfit
    ? "linear-gradient(135deg,#22c55e 0%,#16a34a 100%)"
    : "linear-gradient(135deg,#ef4444 0%,#dc2626 100%)";
  const icon = isProfit ? "📈" : "📉";

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
      className="daybook-card"
    >
      <Text style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
        {icon} Profit / Loss
      </Text>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          marginTop: 6,
          lineHeight: 1.1,
        }}
      >
        {formatAmountINR(value)}
      </div>

      <div style={{ marginTop: 8 }}>
        <Tag
          style={{
            borderRadius: 999,
            border: "none",
            background: "rgba(255,255,255,0.18)",
            color: "white",
            fontWeight: 800,
          }}
        >
          {isProfit ? "PROFIT" : "LOSS"}
        </Tag>
      </div>
    </Card>
  );
};

export default DaybookProfitLossCard;

