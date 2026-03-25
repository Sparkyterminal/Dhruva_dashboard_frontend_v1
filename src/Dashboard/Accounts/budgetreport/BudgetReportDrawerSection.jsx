import React from "react";
import { Card, Row, Col, Typography, Tag } from "antd";
import { FileTextOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import BudgetReportDetailsView from "./BudgetReportDetailsView";

const { Text } = Typography;

const fmtRupee = (n) => {
  if (n == null || n === "") return "—";
  const num = Number(n);
  if (Number.isNaN(num)) return "—";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Read-only budget block for event drawers. Pass API `budgetReport` object from event payload.
 */
const BudgetReportDrawerSection = ({ budgetReport, count }) => {
  if (!budgetReport) return null;

  const summary = budgetReport.budgetData?.summary;
  const meta = budgetReport.metadata;

  return (
    <Card
      className="border-0"
      style={{
        borderRadius: 12,
        background: "white",
        border: "1px solid #e2e8f0",
      }}
      title={
        <div className="flex flex-wrap items-center gap-2">
          <FileTextOutlined className="text-indigo-600" />
          <span className="font-semibold text-slate-800 text-base">
            Budget report
          </span>
          {(count != null && count > 0) || budgetReport._id ? (
            <Tag color="geekblue" className="m-0">
              {count != null ? `${count} saved` : "Saved"}
            </Tag>
          ) : null}
        </div>
      }
      extra={
        meta?.createdAt ? (
          <Text type="secondary" className="text-xs">
            Updated {dayjs(meta.createdAt).format("DD MMM YYYY, hh:mm A")}
          </Text>
        ) : null
      }
      bodyStyle={{ padding: "12px 16px 16px" }}
    >
      {summary && (
        <Row gutter={[12, 12]} className="mb-3">
          <Col xs={12} sm={6}>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <Text className="text-xs text-slate-500 block">Total cost</Text>
              <Text strong className="text-slate-800">
                {fmtRupee(summary.totalCost)}
              </Text>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <Text className="text-xs text-slate-500 block">Negotiated</Text>
              <Text strong className="text-slate-800">
                {fmtRupee(summary.negotiatedAmount)}
              </Text>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <Text className="text-xs text-slate-500 block">Actual paid</Text>
              <Text strong className="text-emerald-700">
                {fmtRupee(summary.actualPaidAmount)}
              </Text>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
              <Text className="text-xs text-slate-500 block">Line items</Text>
              <Text strong className="text-slate-800">
                {meta?.totalRows ?? "—"}
              </Text>
            </div>
          </Col>
        </Row>
      )}

      <div className="-mx-2 sm:-mx-3">
        <BudgetReportDetailsView reportData={budgetReport} />
      </div>
    </Card>
  );
};

export default BudgetReportDrawerSection;
