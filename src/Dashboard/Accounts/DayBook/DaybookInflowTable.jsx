import React, { useMemo } from "react";
import { Button, Empty, Modal, Table, Tag, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import {
  formatAmountINR,
  formatDate,
  formatDateTime,
  formatEventName,
  isEventAdvanceDaybookRow,
} from "./daybookUtils";

const { Text } = Typography;

const DaybookInflowTable = ({
  rows,
  onEdit,
  onDelete,
  deletingId,
}) => {
  const dataSource = Array.isArray(rows) ? rows : [];

  const isNewModel = dataSource.some(
    (r) =>
      r?.receivedDate !== undefined ||
      r?.receivedIn !== undefined ||
      r?.amountReceived !== undefined ||
      r?.receivedBy !== undefined,
  );

  const columns = useMemo(
    () => [
      ...(isNewModel
        ? [
            {
              title: "Name",
              key: "name",
              width: 280,
              render: (_, record) => (
                <div className="flex flex-wrap items-center gap-2">
                  <Text strong className="text-slate-800">
                    {record?.name || "-"}
                  </Text>
                  {isEventAdvanceDaybookRow(record) ? (
                    <Tag color="purple" style={{ borderRadius: 999, marginInlineEnd: 0 }}>
                      Booking advance
                    </Tag>
                  ) : null}
                </div>
              ),
            },
            {
              title: "Received Date",
              key: "receivedDate",
              width: 190,
              render: (_, record) => (
                <Text>{formatDate(record?.receivedDate)}</Text>
              ),
            },
            {
              title: "Received In",
              key: "receivedIn",
              width: 160,
              render: (_, record) => {
                const receivedIn = String(record?.receivedIn || "").toUpperCase();
                const color = receivedIn === "ACCOUNT" ? "green" : "blue";
                return (
                  <Tag color={color} style={{ borderRadius: 999 }}>
                    {receivedIn || "-"}
                  </Tag>
                );
              },
            },
            {
              title: "Account",
              key: "accountName",
              width: 180,
              render: (_, record) => {
                const receivedIn = String(record?.receivedIn || "").toUpperCase();
                return (
                  <Text>
                    {receivedIn === "ACCOUNT" ? record?.accountName || "-" : "-"}
                  </Text>
                );
              },
            },
            {
              title: "Amount Received",
              key: "amountReceived",
              width: 190,
              align: "right",
              render: (_, record) => (
                <Text strong className="text-green-700">
                  {formatAmountINR(record?.amountReceived)}
                </Text>
              ),
            },
            {
              title: "Received By",
              key: "receivedBy",
              width: 220,
              render: (_, record) => <Text>{record?.receivedBy || "-"}</Text>,
            },
            {
              title: "Event Reference",
              key: "eventReference",
              width: 190,
              render: (_, record) => (
                <Text>{record?.eventReference || "-"}</Text>
              ),
            },
            {
              title: "Note",
              key: "note",
              width: 260,
              render: (_, record) => (
                <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                  {record?.note || "-"}
                </div>
              ),
            },
            {
              title: "Actions",
              key: "actions",
              width: 200,
              render: (_, record) => {
                const id = record?._id ?? record?.id;
                if (isEventAdvanceDaybookRow(record)) {
                  return (
                    <Text type="secondary" className="text-xs">
                      Managed on event
                    </Text>
                  );
                }
                return (
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <Button
                      icon={<EditOutlined />}
                      size="small"
                      onClick={() => onEdit?.(record)}
                    >
                      Edit
                    </Button>
                    <Button
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      loading={deletingId === id}
                      onClick={() => {
                        Modal.confirm({
                          title: "Delete Inflow",
                          content:
                            "Are you sure you want to delete this inflow? Once deleted, it cannot be retrieved.",
                          okText: "Delete",
                          okType: "danger",
                          onOk: () => onDelete?.(record),
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                );
              },
            },
          ]
        : [
            {
              title: "Client / Event",
              key: "client_event",
              width: 320,
              render: (_, record) => (
                <div className="space-y-1">
                  <Text strong className="text-slate-800" style={{ display: "block" }}>
                    {record?.client?.clientName || "-"}
                  </Text>
                  <Text
                    className="text-slate-500"
                    style={{ display: "block", fontSize: 12 }}
                  >
                    {formatEventName(record?.event?.eventName?.name)}
                  </Text>
                  <Text
                    className="text-slate-400"
                    style={{ display: "block", fontSize: 12 }}
                  >
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
          ]),
    ],
    [deletingId, isNewModel, onDelete, onEdit],
  );

  if (!dataSource.length) {
    return <Empty description="No inflow transactions found." />;
  }

  return (
    <Table
      rowKey={(record, idx) =>
        String(record?._id ?? record?.id ?? `inflow-${idx}`)
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