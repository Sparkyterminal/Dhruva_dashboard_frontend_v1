import React, { useMemo } from "react";
import { Empty, Table, Tag, Typography } from "antd";
import {
  formatAmountINR,
  formatDateTime,
  formatEventName,
  statusTag,
  toSafeText,
} from "./daybookUtils";

const { Text } = Typography;

const DaybookOutflowTable = ({ rows }) => {
  const dataSource = Array.isArray(rows) ? rows : [];

  const columns = useMemo(
    () => [
      {
        title: "Purpose / Vendor",
        key: "purpose_vendor",
        width: 360,
        render: (_, record) => (
          <div className="space-y-1">
            <Text strong className="text-slate-800" style={{ display: "block" }}>
              {record?.purpose || "-"}
            </Text>
            <Text className="text-slate-600" style={{ display: "block" }}>
              {record?.vendor?.name
                ? record.vendor.name
                : record?.vendor?.vendor_code
                  ? `${record.vendor.vendor_code}`
                  : "-"}
            </Text>
          </div>
        ),
      },
      {
        title: "Amount Paid",
        dataIndex: "amountPaid",
        key: "amountPaid",
        width: 170,
        align: "right",
        render: (amt) => (
          <Text strong className="text-red-700">
            {formatAmountINR(amt)}
          </Text>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (s) => {
          const tag = statusTag(s);
          return (
            <Tag
              color={tag.color}
              style={{ borderRadius: 999, fontWeight: 700 }}
            >
              {tag.text}
            </Tag>
          );
        },
      },
      {
        title: "Entity Account",
        dataIndex: "entityAccount",
        key: "entityAccount",
        width: 200,
        render: (v) => <Text>{v || "-"}</Text>,
      },
      {
        title: "Paid At",
        dataIndex: "paidAt",
        key: "paidAt",
        width: 190,
        render: (d) => <Text>{formatDateTime(d)}</Text>,
      },
      {
        title: "Required Date",
        dataIndex: "requiredDate",
        key: "requiredDate",
        width: 190,
        render: (d) => <Text>{formatDateTime(d)}</Text>,
      },
      {
        title: "Paid To",
        dataIndex: "amountPaidTo",
        key: "amountPaidTo",
        width: 200,
        render: (v) => <Text>{toSafeText(v)}</Text>,
      },
      {
        title: "Event (Client Ref)",
        key: "event_reference",
        width: 240,
        render: (_, record) => (
          <div>
            <Text>
              {record?.eventReference?.clientName
                ? record.eventReference.clientName
                : "-"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              {formatEventName(record?.eventReference)}
            </Text>
          </div>
        ),
      },
      {
        title: "Remarks",
        key: "remarks",
        width: 280,
        render: (_, record) => (
          <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
            {record?.remarks || "-"}
          </div>
        ),
      },
    ],
    [],
  );

  if (!dataSource.length) {
    return <Empty description="No outflow transactions found." />;
  }

  return (
    <Table
      rowKey={(record, idx) =>
        `${record?.requestId || "req"}-${record?.amountPaid ?? "amt"}-${idx}`
      }
      columns={columns}
      dataSource={dataSource}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
      }}
      scroll={{ x: 1600 }}
      size="middle"
    />
  );
};

export default DaybookOutflowTable;

