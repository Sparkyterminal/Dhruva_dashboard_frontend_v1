import React, { useMemo } from "react";
import { Empty, Table, Tag, Typography } from "antd";
import { formatAmountINR, formatDateTime, formatEventName } from "./daybookUtils";

const { Text } = Typography;

const DaybookInflowTable = ({ rows }) => {
  const dataSource = Array.isArray(rows) ? rows : [];

  const columns = useMemo(
    () => [
      {
        title: "Client / Event",
        key: "client_event",
        width: 320,
        render: (_, record) => (
          <div className="space-y-1">
            <Text strong className="text-slate-800" style={{ display: "block" }}>
              {record?.client?.clientName || "-"}
            </Text>
            <Text className="text-slate-500" style={{ display: "block", fontSize: 12 }}>
              {formatEventName(record?.event?.eventName?.name)}
            </Text>
            <Text className="text-slate-400" style={{ display: "block", fontSize: 12 }}>
              {record?.event?.eventType?.name || ""}
            </Text>
          </div>
        ),
      },
      {
        title: "Advance #",
        key: "advanceNumber",
        width: 120,
        render: (_, record) => (
          <Text strong>#{record?.advance?.advanceNumber ?? "-"}</Text>
        ),
      },
      // {
      //   title: "Status",
      //   key: "status",
      //   width: 130,
      //   render: (_, record) => {
      //     const status = record?.advance?.status;
      //     const colorMap = {
      //       Pending: "orange",
      //       Received: "green",
      //       Cancelled: "red",
      //     };
      //     return (
      //       <Tag color={colorMap[status] || "default"} style={{ borderRadius: 999 }}>
      //         {status || "-"}
      //       </Tag>
      //     );
      //   },
      // },
      {
        title: "Received Amount",
        key: "receivedAmount",
        width: 160,
        align: "right",
        render: (_, record) => (
          <Text strong className="text-green-700">
            {formatAmountINR(record?.advance?.receivedAmount)}
          </Text>
        ),
      },
      {
        title: "Expected Amount",
        key: "expectedAmount",
        width: 160,
        align: "right",
        render: (_, record) => (
          <Text className="text-slate-500">
            {formatAmountINR(record?.advance?.expectedAmount)}
          </Text>
        ),
      },
      {
        title: "Received Date",
        key: "receivedDate",
        width: 190,
        render: (_, record) => (
          <Text>{formatDateTime(record?.advance?.receivedDate)}</Text>
        ),
      },
      {
        title: "Payment Mode",
        key: "modeOfPayment",
        width: 160,
        render: (_, record) => (
          <Tag color="blue" style={{ borderRadius: 999 }}>
            {record?.advance?.modeOfPayment || "-"}
          </Tag>
        ),
      },
      {
        title: "Given By",
        key: "givenBy",
        width: 170,
        render: (_, record) => (
          <Text>{record?.advance?.givenBy || "-"}</Text>
        ),
      },
      {
        title: "Collected By",
        key: "collectedBy",
        width: 170,
        render: (_, record) => (
          <Text>{record?.advance?.collectedBy || "-"}</Text>
        ),
      },
      {
        title: "Remarks",
        key: "remarks",
        width: 220,
        render: (_, record) => (
          <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
            {record?.advance?.remarks || "-"}
          </div>
        ),
      },
    ],
    [],
  );

  if (!dataSource.length) {
    return <Empty description="No inflow transactions found." />;
  }

  return (
    <Table
      rowKey={(record, idx) =>
        `${record?.eventId || "event"}-${record?.advance?.advanceNumber ?? "adv"}-${idx}`
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

export default DaybookInflowTable;