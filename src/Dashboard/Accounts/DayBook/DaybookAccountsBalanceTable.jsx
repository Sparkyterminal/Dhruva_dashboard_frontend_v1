import React, { useMemo } from "react";
import { Button, Empty, Modal, Table, Typography } from "antd";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { formatAmountINR, formatDate } from "./daybookUtils";

const { Text } = Typography;

const DaybookAccountsBalanceTable = ({
  rows,
  onEdit,
  onDelete,
  deletingId,
}) => {
  const dataSource = Array.isArray(rows) ? rows : [];

  const columns = useMemo(
    () => [
      {
        title: "Date",
        key: "balanceDate",
        width: 170,
        render: (_, record) => <Text>{formatDate(record?.balanceDate)}</Text>,
      },
      {
        title: "Cash Opening",
        key: "cashOpeningBalance",
        width: 170,
        align: "right",
        render: (_, record) => (
          <Text strong className="text-slate-800">
            {formatAmountINR(record?.cashOpeningBalance)}
          </Text>
        ),
      },
      {
        title: "Cash Closing",
        key: "cashClosingBalance",
        width: 170,
        align: "right",
        render: (_, record) => (
          <Text strong className="text-slate-800">
            {formatAmountINR(record?.cashClosingBalance)}
          </Text>
        ),
      },
      {
        title: "Account Opening",
        key: "accountOpeningBalance",
        width: 190,
        align: "right",
        render: (_, record) => (
          <Text strong className="text-slate-800">
            {formatAmountINR(record?.accountOpeningBalance)}
          </Text>
        ),
      },
      {
        title: "Account Closing",
        key: "accountClosingBalance",
        width: 190,
        align: "right",
        render: (_, record) => (
          <Text strong className="text-slate-800">
            {formatAmountINR(record?.accountClosingBalance)}
          </Text>
        ),
      },
      {
        title: "Accounts",
        key: "accountBalances",
        width: 340,
        render: (_, record) => {
          const accountRows = Array.isArray(record?.accountBalances)
            ? record.accountBalances
            : [];
          if (!accountRows.length) return <Text type="secondary">-</Text>;
          return (
            <div style={{ display: "grid", gap: 4 }}>
              {accountRows.map((row, index) => (
                <Text key={`${row?.accountName ?? "account"}-${index}`}>
                  {row?.accountName || "-"}: O {formatAmountINR(row?.openingBalance)} / C{" "}
                  {formatAmountINR(row?.closingBalance)}
                </Text>
              ))}
            </div>
          );
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 160,
        render: (_, record) => {
          const id = record?._id ?? record?.id;
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
                    title: "Delete Balance Record",
                    content:
                      "Are you sure you want to delete this balance record? Once deleted, it cannot be retrieved.",
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
    ],
    [deletingId, onDelete, onEdit],
  );

  if (!dataSource.length) {
    return <Empty description="No account balance records found." />;
  }

  return (
    <Table
      rowKey={(record, idx) =>
        `${record?._id ?? record?.id ?? "balance"}-${record?.balanceDate ?? "date"}-${idx}`
      }
      columns={columns}
      dataSource={dataSource}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        pageSizeOptions: ["10", "20", "50"],
      }}
      scroll={{ x: 1500 }}
      size="middle"
    />
  );
};

export default DaybookAccountsBalanceTable;

