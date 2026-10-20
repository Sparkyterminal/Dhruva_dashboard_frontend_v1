import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { DatePicker, Table, message } from "antd";
import {
  ArrowLeft,
  CalendarDays,
  CircleCheck,
  Clock,
  Eye,
  FileSpreadsheet,
  Layers,
  Pencil,
  Plus,
  ReceiptText,
} from "lucide-react";
import dayjs from "dayjs";
import { fetchDailyExpenseList } from "./dailyExpensesApi";
import { formatDisplayDate, todayBusinessDate } from "./dailyExpensesUtils";
import "./DailyExpenses.css";

const { RangePicker } = DatePicker;

const Empty = ({ text, hint }) => (
  <div className="de-empty">
    <span className="ring">
      <ReceiptText size={28} strokeWidth={1.6} aria-hidden="true" />
    </span>
    <strong>{text}</strong>
    {hint ? <span>{hint}</span> : null}
  </div>
);

/**
 * Daily Expenses list page.
 * Hero + Add Expense, summary stats, Today | All (date range) switch, View + Edit actions.
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

  const todayKey = todayBusinessDate();

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

  const stats = useMemo(() => {
    const sheets = rows.reduce(
      (sum, r) => sum + (Number(r.sheetCount) || r.sheetNames?.length || 0),
      0,
    );
    const latest = rows.reduce(
      (max, r) =>
        r.updatedAt && (!max || dayjs(r.updatedAt).isAfter(max)) ? r.updatedAt : max,
      null,
    );
    return { days: rows.length, sheets, latest };
  }, [rows]);

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 210,
      render: (val) => {
        const d = dayjs(val);
        const isToday = val === todayKey;
        return (
          <div className="de-date">
            <div className={`de-date-chip${isToday ? " is-today" : ""}`}>
              <span className="mon">{d.format("MMM")}</span>
              <span className="day">{d.format("DD")}</span>
            </div>
            <div className="de-date-meta">
              <strong>{isToday ? "Today" : d.format("dddd")}</strong>
              <span>{formatDisplayDate(val)}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: "Workbook",
      dataIndex: "title",
      key: "title",
      width: 260,
      render: (val) => (
        <div className="de-name">
          <FileSpreadsheet size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>{val || "—"}</span>
        </div>
      ),
    },
    {
      title: "Sheets",
      key: "sheets",
      width: 260,
      render: (_, record) => {
        const names = Array.isArray(record.sheetNames) ? record.sheetNames : [];
        if (names.length === 0) {
          return <span className="de-pill">{record.sheetCount || 0} sheets</span>;
        }
        return (
          <div className="de-pills">
            {names.map((n) => (
              <span key={n} className="de-pill">
                {n}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: "Last updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 190,
      render: (val) =>
        val ? (
          <span>{dayjs(val).format("DD MMM YYYY, hh:mm A")}</span>
        ) : (
          <span className="de-muted">—</span>
        ),
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      width: 100,
      render: (val) =>
        val > 0 ? (
          <span className="de-version">v{val}</span>
        ) : (
          <span className="de-muted">—</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 190,
      fixed: "right",
      render: (_, record) => (
        <div className="de-actions">
          <button
            type="button"
            className="de-icon-btn"
            onClick={() => navigate(`/user/daily-expenses/view/${record.date}`)}
          >
            <Eye size={15} aria-hidden="true" /> View
          </button>
          <button
            type="button"
            className="de-icon-btn is-solid"
            onClick={() => navigate(`/user/daily-expenses/edit/${record.date}`)}
          >
            <Pencil size={14} aria-hidden="true" /> Edit
          </button>
        </div>
      ),
    },
  ];

  const statCards = [
    {
      icon: CalendarDays,
      label: activeTab === "today" ? "Workbooks today" : "Days in range",
      value: stats.days,
    },
    { icon: Layers, label: "Total sheets", value: stats.sheets },
    {
      icon: Clock,
      label: "Last updated",
      value: stats.latest ? dayjs(stats.latest).format("DD MMM, hh:mm A") : "—",
      small: true,
    },
    {
      icon: CircleCheck,
      label: "Today's workbook",
      value:
        activeTab === "today" ? (rows.length ? "Created" : "Not yet") : "See Today tab",
      small: true,
    },
  ];

  return (
    <div className="de-page">
      <div className="de-wrap">
        <header className="de-hero">
          <div style={{ position: "relative", zIndex: 1 }}>
            <button type="button" className="de-back" onClick={() => navigate("/user")}>
              <ArrowLeft size={14} aria-hidden="true" /> Back to home
            </button>
            <p className="de-eyebrow">Accounts</p>
            <h1 className="de-title">Daily Expenses</h1>
            <p className="de-sub">
              One Excel workbook for every business day. Open a day to view it, or edit and
              save your entries.
            </p>
          </div>
          <button
            type="button"
            className="de-add"
            onClick={() => navigate(`/user/daily-expenses/add?date=${todayKey}`)}
          >
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add expense
          </button>
        </header>

        <section className="de-stats" aria-label="Summary">
          {statCards.map(({ icon, label, value, small }) => {
            const Icon = icon;
            return (
              <div className="de-stat" key={label}>
                <span className="de-stat-icon">
                  <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <div>
                  <p className="de-stat-label">{label}</p>
                  <p className={`de-stat-value${small ? " is-small" : ""}`}>{value}</p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="de-panel">
          <div className="de-toolbar">
            <div className="de-seg" role="group" aria-label="View">
              <button
                type="button"
                aria-pressed={activeTab === "today"}
                onClick={() => setActiveTab("today")}
              >
                Today
              </button>
              <button
                type="button"
                aria-pressed={activeTab === "all"}
                onClick={() => setActiveTab("all")}
              >
                All days
              </button>
            </div>

            {activeTab === "today" ? (
              <span className="de-today-chip">
                <CalendarDays size={15} aria-hidden="true" /> {formatDisplayDate(todayKey)}
              </span>
            ) : (
              <div className="de-filters">
                <RangePicker
                  value={range}
                  onChange={(vals) => setRange(vals || [null, null])}
                  disabledDate={(current) =>
                    user?.dataCutoffDate
                      ? current && current.isBefore(dayjs(user.dataCutoffDate), "day")
                      : false
                  }
                  format="DD-MM-YYYY"
                  allowClear
                  size="large"
                />
                <button type="button" className="de-btn is-primary" onClick={loadList}>
                  Apply filter
                </button>
              </div>
            )}
          </div>

          <Table
            className="de-table"
            rowKey="date"
            columns={columns}
            dataSource={rows}
            loading={loading}
            pagination={
              activeTab === "all"
                ? {
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} days`,
                  }
                : false
            }
            locale={{
              emptyText: loading ? null : activeTab === "today" ? (
                <Empty
                  text="No expense sheet for today yet"
                  hint="Click “Add expense” to start today's workbook."
                />
              ) : (
                <Empty text="No expense sheets in this date range" hint="Try a wider range." />
              ),
            }}
            scroll={{ x: 1100 }}
          />
        </section>
      </div>
    </div>
  );
};

export default DailyExpensesHome;
