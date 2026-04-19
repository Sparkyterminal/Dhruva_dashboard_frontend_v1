import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../../../config";

const { RangePicker } = DatePicker;

const { Text, Title } = Typography;

const formatAmount = (value) => {
  const n = Number(value);
  if (value === null || value === undefined || Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
};

const StatCard = ({ title, value, color }) => (
  <Card
    className="border-0 shadow-sm"
    style={{ borderRadius: 12, borderLeft: `4px solid ${color}` }}
    bodyStyle={{ padding: "14px 16px" }}
  >
    <Text type="secondary">{title}</Text>
    <div className="text-xl font-semibold mt-1">{formatAmount(value)}</div>
  </Card>
);

const BalanceSheets = () => {
  const user = useSelector((state) => state.user.value);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({
    totalPayableAmount: 0,
    totalReceivedAmount: 0,
    totalBalanceAmount: 0,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  /** Event-type date window: `startDate` / `endDate` as YYYY-MM-DD per BALANCE_SHEET_FRONTEND.md */
  const [dateRange, setDateRange] = useState(null);

  const startDateParam = useMemo(() => {
    const d = dateRange?.[0];
    return d?.isValid?.() ? d.format("YYYY-MM-DD") : null;
  }, [dateRange]);

  const endDateParam = useMemo(() => {
    const d = dateRange?.[1];
    return d?.isValid?.() ? d.format("YYYY-MM-DD") : null;
  }, [dateRange]);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: user?.access_token } }),
    [user?.access_token],
  );

  const fetchBalanceSheet = useCallback(async () => {
    if (!user?.access_token) return;
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
      };
      if (startDateParam) params.startDate = startDateParam;
      if (endDateParam) params.endDate = endDateParam;

      const res = await axios.get(`${API_BASE_URL}events/balance-sheet`, {
        ...authHeaders,
        params,
      });

      const data = res?.data || {};
      const events = Array.isArray(data?.events) ? data.events : [];
      setRows(events);
      setSummary({
        totalPayableAmount: data?.summary?.totalPayableAmount ?? 0,
        totalReceivedAmount: data?.summary?.totalReceivedAmount ?? 0,
        totalBalanceAmount: data?.summary?.totalBalanceAmount ?? 0,
      });
      setPagination((prev) => ({
        ...prev,
        current: data?.page ?? prev.current,
        pageSize: data?.limit ?? prev.pageSize,
        total: data?.totalEvents ?? events.length,
      }));
    } catch (err) {
      setRows([]);
      setSummary({
        totalPayableAmount: 0,
        totalReceivedAmount: 0,
        totalBalanceAmount: 0,
      });
      message.error("Failed to fetch balance sheet");
    } finally {
      setLoading(false);
    }
  }, [
    authHeaders,
    endDateParam,
    pagination.current,
    pagination.pageSize,
    startDateParam,
    user?.access_token,
  ]);

  useEffect(() => {
    fetchBalanceSheet();
  }, [fetchBalanceSheet]);

  const columns = useMemo(
    () => [
      {
        title: "Client Name",
        dataIndex: "clientName",
        key: "clientName",
        width: 220,
        render: (value) => <Text strong>{value || "-"}</Text>,
      },
      {
        title: "Event Name",
        key: "eventName",
        width: 220,
        render: (_, record) => (
          <Text>{record?.eventName?.name || record?.eventName || "-"}</Text>
        ),
      },
      {
        title: "Status",
        dataIndex: "eventConfirmation",
        key: "eventConfirmation",
        width: 180,
        render: (value) => <Tag color="blue">{value || "-"}</Tag>,
      },
    //   {
    //     title: "Advance Type",
    //     dataIndex: "advancePaymentType",
    //     key: "advancePaymentType",
    //     width: 160,
    //     render: (value) => (
    //       <Text>{value ? String(value).toUpperCase() : "-"}</Text>
    //     ),
    //   },
      {
        title: "Payable Amount",
        dataIndex: "payableAmount",
        key: "payableAmount",
        width: 170,
        align: "right",
        render: (value) => <Text>{formatAmount(value)}</Text>,
      },
      {
        title: "Received Amount",
        dataIndex: "receivedAmount",
        key: "receivedAmount",
        width: 170,
        align: "right",
        render: (value) => (
          <Text className="text-green-700">{formatAmount(value)}</Text>
        ),
      },
      {
        title: "Balance Amount",
        dataIndex: "balanceAmount",
        key: "balanceAmount",
        width: 170,
        align: "right",
        render: (value) => (
          <Text className={Number(value) < 0 ? "text-red-600" : "text-orange-600"}>
            {formatAmount(value)}
          </Text>
        ),
      },
    ],
    [],
  );

  const onTableChange = (paginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current || prev.current,
      pageSize: paginationConfig.pageSize || prev.pageSize,
    }));
  };

  const handleDateRangeChange = (dates) => {
    if (!dates) {
      setDateRange(null);
      setPagination((p) => ({ ...p, current: 1 }));
      return;
    }
    if (
      dates[0] &&
      dates[1] &&
      dates[0].isAfter(dates[1], "day")
    ) {
      message.warning("Start date must be on or before end date.");
      return;
    }
    setDateRange(dates);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  const clearDateFilter = () => {
    setDateRange(null);
    setPagination((p) => ({ ...p, current: 1 }));
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
        <Title level={4} className="mb-1!">
          Balance Sheet
        </Title>
        <Text type="secondary">
          Confirmed events summary and balances. Filter by event type dates
          (start / end on an event type must fall in the range you pick).
        </Text>

        <Row gutter={[16, 16]} align="middle" className="mt-4">
          <Col xs={24} md={16} lg={14}>
            <Space direction="vertical" size={4} className="w-full">
              <Text className="text-slate-600 text-sm font-medium">
                Event date range
              </Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                format="YYYY-MM-DD"
                allowEmpty={[true, true]}
                className="w-full max-w-md"
                size="large"
                placeholder={["Start date", "End date"]}
              />
            </Space>
          </Col>
          <Col xs={24} md={8} lg={10} className="text-left md:text-right">
            <Button size="large" onClick={clearDateFilter} disabled={!dateRange}>
              Clear dates
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <StatCard
            title="Total Payable Amount"
            value={summary.totalPayableAmount}
            color="#3b82f6"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="Total Received Amount"
            value={summary.totalReceivedAmount}
            color="#16a34a"
          />
        </Col>
        <Col xs={24} md={8}>
          <StatCard
            title="Total Balance Amount"
            value={summary.totalBalanceAmount}
            color="#f97316"
          />
        </Col>
      </Row>

      <Card className="border-0 shadow-sm" style={{ borderRadius: 12 }}>
        {loading ? (
          <div className="py-10 text-center">
            <Spin />
          </div>
        ) : rows.length ? (
          <Table
            rowKey={(record, idx) => record?._id || `balance-row-${idx}`}
            columns={columns}
            dataSource={rows}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
            }}
            onChange={onTableChange}
            scroll={{ x: 1200 }}
          />
        ) : (
          <Empty description="No balance sheet events found." />
        )}
      </Card>
    </div>
  );
};

export default BalanceSheets;

