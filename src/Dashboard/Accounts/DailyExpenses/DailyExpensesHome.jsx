import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fetchDailyExpenseList } from "./dailyExpensesApi";
import {
  formatDisplayDate,
  todayBusinessDate,
} from "./dailyExpensesUtils";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

/**
 * Daily Expenses list/view page.
 * Header + Add Expense (right). Tabs: Today | All (with start/end date filter).
 * View + Edit actions.
 */
const DailyExpensesHome = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const authHeaders = { headers: { Authorization: user?.access_token } };

  const [activeTab, setActiveTab] = useState("today");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState([
    dayjs().subtract(30, "day"),
    dayjs().subtract(1, "day"),
  ]);

  const loadList = useCallback(async () => {
    if (!user?.access_token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (activeTab === "today") {
        const list = await fetchDailyExpenseList({
          authHeaders,
          mode: "today",
        });
        setRows(list);
      } else {
        const from = range?.[0]?.format?.("YYYY-MM-DD");
        const to = range?.[1]?.format?.("YYYY-MM-DD");
        const list = await fetchDailyExpenseList({
          authHeaders,
          mode: "all",
          from,
          to,
        });
        setRows(list);
      }
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message || "Failed to load daily expenses",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.access_token, activeTab, range]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 140,
      render: (val) => formatDisplayDate(val),
    },
    {
      title: "Excel name",
      dataIndex: "title",
      key: "title",
      width: 220,
      ellipsis: true,
      render: (val) => val || "—",
    },
    {
      title: "Sheets",
      key: "sheets",
      width: 260,
      render: (_, record) => {
        const names = Array.isArray(record.sheetNames) ? record.sheetNames : [];
        if (names.length === 0) {
          return <Tag color="blue">{record.sheetCount || 0}</Tag>;
        }
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {names.map((n) => (
              <Tag key={n} color="blue">
                {n}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: "Last updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 180,
      render: (val) =>
        val
          ? dayjs(val).format("DD MMM YYYY, hh:mm A")
          : "—",
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 90,
      render: (val) => (val > 0 ? `v${val}` : "—"),
    },
    {
      title: "Actions",
      key: "actions",
      width: 200,
      fixed: "right",
      render: (_, record) => (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() =>
              navigate(`/user/daily-expenses/view/${record.date}`)
            }
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() =>
              navigate(`/user/daily-expenses/edit/${record.date}`)
            }
          >
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const todayLabel = formatDisplayDate(todayBusinessDate());

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(226,232,240,0.9)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={14}>
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
                    Daily Expenses
                  </Title>
                  <Text type="secondary" className="text-sm">
                    Excel workbooks mapped by date — View or Edit.
                  </Text>
                </div>
              </div>
            </Col>
            <Col xs={24} md={10} className="text-right">
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                className="rounded-xl border-0"
                style={{
                  background:
                    "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)",
                }}
                onClick={() =>
                  navigate(
                    `/user/daily-expenses/add?date=${todayBusinessDate()}`,
                  )
                }
              >
                Add Expense
              </Button>
            </Col>
          </Row>
        </Card>

        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(226,232,240,0.9)",
          }}
          bodyStyle={{ padding: "16px 24px 24px" }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "today",
                label: `Today (${todayLabel})`,
                children: (
                  <Table
                    rowKey="date"
                    columns={columns}
                    dataSource={rows}
                    loading={loading}
                    pagination={false}
                    locale={{
                      emptyText: loading
                        ? null
                        : "No expense sheet for today yet. Click Add Expense to create one.",
                    }}
                    scroll={{ x: 1100 }}
                  />
                ),
              },
              {
                key: "all",
                label: "All",
                children: (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div>
                        <Text strong className="block mb-2 text-slate-700">
                          Start & end date
                        </Text>
                        <RangePicker
                          value={range}
                          onChange={(vals) =>
                            setRange(vals || [null, null])
                          }
                          format="DD-MM-YYYY"
                          allowClear
                          size="large"
                        />
                      </div>
                      <Button size="large" onClick={loadList}>
                        Apply filter
                      </Button>
                    </div>
                    <Table
                      rowKey="date"
                      columns={columns}
                      dataSource={rows}
                      loading={loading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Total ${total} days`,
                      }}
                      locale={{
                        emptyText: loading
                          ? null
                          : "No expense sheets in this date range.",
                      }}
                      scroll={{ x: 1100 }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default DailyExpensesHome;
