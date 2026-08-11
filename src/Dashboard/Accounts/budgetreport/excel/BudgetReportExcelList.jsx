import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, Card, Input, Table, Tag, Typography, message } from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { fetchBudgetReportExcelList } from "./budgetReportExcelApi";

const { Search } = Input;
const { Title, Text } = Typography;

/**
 * Event-wise budget report Excel list.
 * Actions: View (read-only, all sheets) + Edit. No Accounts edit.
 */
const BudgetReportExcelList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((state) => state.user.value);
  const authHeaders = { headers: { Authorization: user?.access_token } };

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );

  const fetchList = useCallback(
    async (searchTerm = "") => {
      if (!user?.access_token) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const list = await fetchBudgetReportExcelList({
          authHeaders,
          search: searchTerm,
        });
        setRows(list);
      } catch (err) {
        console.error(err);
        message.error(
          err?.response?.data?.message || "Failed to load budget reports",
        );
        setRows([]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.access_token],
  );

  useEffect(() => {
    const searchTerm = searchParams.get("search") || "";
    setSearchQuery(searchTerm);
    fetchList(searchTerm);
  }, [fetchList, searchParams]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    setSearchParams(value ? { search: value } : {});
  };

  const columns = [
    {
      title: "Event",
      dataIndex: "eventName",
      key: "eventName",
      width: 220,
      render: (val) => val || "—",
    },
    {
      title: "Client",
      dataIndex: "clientName",
      key: "clientName",
      width: 180,
      render: (val) => val || "—",
    },
    {
      title: "Sheets",
      dataIndex: "sheetCount",
      key: "sheetCount",
      width: 100,
      render: (val, record) =>
        record.hasWorkbook ? (
          <Tag color="blue">{val || "—"}</Tag>
        ) : (
          <Tag>Not created</Tag>
        ),
    },
    {
      title: "Last updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 160,
      render: (val) =>
        val
          ? new Date(val).toLocaleDateString("en-IN", { dateStyle: "medium" })
          : "—",
    },
    {
      title: "Actions",
      key: "actions",
      width: 220,
      fixed: "right",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              navigate(`/user/budgetreport/view/${record.eventId}`, {
                state: {
                  eventName: record.eventName,
                  clientName: record.clientName,
                  eventLabel: [record.eventName, record.clientName]
                    .filter(Boolean)
                    .join(" - "),
                },
              })
            }
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/user/budgetreport/edit/${record.eventId}`, {
                state: {
                  eventName: record.eventName,
                  clientName: record.clientName,
                  eventLabel: [record.eventName, record.clientName]
                    .filter(Boolean)
                    .join(" - "),
                },
              })
            }
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="budget-report-container budget-report-eventwise">
      <div className="budget-report-shell space-y-6">
        <Card
          className="border-0 shadow-md"
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(226,232,240,0.9)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/user")}
                size="large"
                className="rounded-xl"
              >
                Back to Home
              </Button>
              <div>
                <Title level={3} className="!mb-0 !text-slate-800">
                  Budget reports (Excel)
                </Title>
                <Text type="secondary" className="text-sm">
                  Each workbook is mapped to a confirmed or in-progress event —
                  View (read-only) or Edit.
                </Text>
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              className="rounded-xl shadow-md border-0"
              style={{
                background:
                  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)",
                boxShadow: "0 4px 14px -4px rgba(79, 70, 229, 0.45)",
              }}
              onClick={() => navigate("/user/budgetreport")}
            >
              Add budget report
            </Button>
          </div>
        </Card>

        <Card
          className="border-0 shadow-md budget-report-ant-table"
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(226,232,240,0.9)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div className="mb-5 max-w-xl">
            <Text strong className="text-slate-700 block mb-2">
              Search
            </Text>
            <Search
              placeholder="Event name, client, or event ID"
              allowClear
              enterButton="Search"
              size="large"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val) {
                  setSearchParams({});
                  fetchList("");
                }
              }}
              onSearch={handleSearch}
              className="rounded-xl"
            />
          </div>

          <Table
            rowKey="eventId"
            columns={columns}
            dataSource={rows}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} reports`,
            }}
            scroll={{ x: 700 }}
            locale={{
              emptyText: loading
                ? null
                : searchQuery
                  ? `No reports found matching "${searchQuery}"`
                  : "No budget reports yet. Add one from the button above.",
            }}
          />
        </Card>
      </div>
    </div>
  );
};

export default BudgetReportExcelList;
