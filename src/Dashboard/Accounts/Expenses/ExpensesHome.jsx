import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  SaveOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import ExpensesSpreadsheet from "./ExpensesSpreadsheet";
import {
  fetchEventsForExpenses,
  fetchExpensesByDate,
  saveExpensesByDate,
} from "./expensesApi";
import {
  computeExpenseInTotal,
  computeExpenseNetTotal,
  computeExpenseOutTotal,
  createDefaultRows,
  hasMeaningfulRow,
  renumberRows,
} from "./expensesUtils";

const { Title, Text } = Typography;

const ExpensesHome = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);

  const [selectedDate, setSelectedDate] = useState(() => dayjs());
  const [rows, setRows] = useState(() => createDefaultRows());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataSource, setDataSource] = useState("");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: user?.access_token } }),
    [user?.access_token],
  );

  const dateStr = selectedDate?.isValid?.()
    ? selectedDate.format("YYYY-MM-DD")
    : "";

  const userId = user?.id || user?._id || user?.email_id;

  const loadExpenses = useCallback(async () => {
    if (!dateStr) return;
    setLoading(true);
    try {
      const result = await fetchExpensesByDate({
        date: dateStr,
        authHeaders,
        userId,
      });
      setRows(renumberRows(result.rows));
      setDataSource(result.source);
    } catch (err) {
      console.error(err);
      message.error("Failed to load expenses");
      setRows(createDefaultRows());
    } finally {
      setLoading(false);
    }
  }, [authHeaders, dateStr, userId]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    let cancelled = false;
    const loadEvents = async () => {
      setEventsLoading(true);
      try {
        const list = await fetchEventsForExpenses({ authHeaders });
        if (!cancelled) setEvents(list);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          message.error("Failed to load events for dropdown");
          setEvents([]);
        }
      } finally {
        if (!cancelled) setEventsLoading(false);
      }
    };
    loadEvents();
    return () => {
      cancelled = true;
    };
  }, [authHeaders]);

  const handleSave = async () => {
    const meaningful = rows.filter(hasMeaningfulRow);
    if (!meaningful.length) {
      message.warning("Add at least one expense row before saving");
      return;
    }

    setSaving(true);
    try {
      const result = await saveExpensesByDate({
        date: dateStr,
        rows: meaningful,
        authHeaders,
        userId,
      });
      if (result.source === "local") {
        message.success("Saved locally (backend API not available yet)");
      } else {
        message.success("Expenses saved successfully");
      }
      await loadExpenses();
    } catch (err) {
      console.error(err);
      message.error(err?.response?.data?.message || "Failed to save expenses");
    } finally {
      setSaving(false);
    }
  };

  const totalIn = computeExpenseInTotal(rows);
  const totalOut = computeExpenseOutTotal(rows);
  const totalNet = computeExpenseNetTotal(rows);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(10px)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} md={6}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/user/daybook")}
                size="large"
                className="border-0 shadow-none hover:bg-slate-100 text-slate-600"
              >
                Back to Daybook
              </Button>
            </Col>

            <Col xs={24} md={12} className="text-center">
              <Title level={2} className="mb-0! text-2xl! md:text-3xl! font-semibold text-slate-800">
                <WalletOutlined style={{ marginRight: 8 }} />
                Daily Expenses
              </Title>
              <Text className="text-xs md:text-sm text-slate-500">
                Excel-style sheet — click a cell to edit, Tab/Enter to move
              </Text>
            </Col>

            <Col xs={24} md={6} className="text-right">
              <Button
                type="primary"
                icon={<SaveOutlined />}
                size="large"
                loading={saving}
                onClick={handleSave}
              >
                Save
              </Button>
            </Col>
          </Row>
        </Card>

        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.85)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={10}>
              <Text strong className="text-slate-700 block mb-2">
                Select date
              </Text>
              <DatePicker
                value={selectedDate}
                onChange={(d) => setSelectedDate(d || dayjs())}
                format="DD-MM-YYYY"
                size="large"
                style={{ width: "100%", maxWidth: 280 }}
                allowClear={false}
              />
            </Col>
            <Col xs={24} md={14}>
              <Space wrap>
                <Button size="large" onClick={() => setSelectedDate(dayjs())}>
                  Today
                </Button>
                {dataSource && (
                  <Tag color={dataSource === "api" ? "green" : "gold"}>
                    Source: {dataSource}
                  </Tag>
                )}
                <Tag color="green">
                  In: ₹{totalIn.toLocaleString("en-IN")}
                </Tag>
                <Tag color="red">
                  Out: ₹{totalOut.toLocaleString("en-IN")}
                </Tag>
                <Tag color="blue">
                  Net: ₹{totalNet.toLocaleString("en-IN")}
                </Tag>
                {eventsLoading && <Tag>Loading events…</Tag>}
              </Space>
            </Col>
          </Row>
        </Card>

        <Card
          className="border-0 shadow-sm"
          style={{
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.95)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          {loading ? (
            <div className="py-20 text-center">
              <Spin size="large" />
            </div>
          ) : (
            <ExpensesSpreadsheet
              rows={rows}
              onRowsChange={setRows}
              events={events}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default ExpensesHome;
