import React, { useCallback, useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { DatePicker, Spin, Table, message } from "antd";
import { X } from "lucide-react";
import { useSelector } from "react-redux";
import { getEffectiveCutoffDate } from "../../../utils/dataCutoff";
import "@/Components/PageKit/PageKit.css";
import "./Bookings.css";

const { RangePicker } = DatePicker;

const formatAmount = (value) => {
  const n = Number(value);
  if (value === null || value === undefined || Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
};

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
    // Default to the data-visibility cutoff when no range is picked — a
    // real, server-filtered query. See src/utils/dataCutoff.js.
    return d?.isValid?.() ? d.format("YYYY-MM-DD") : getEffectiveCutoffDate(user);
  }, [dateRange, user]);

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

      const res = await axiosClient.get(`events/balance-sheet`, {
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
    } catch {
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
        title: "Client",
        dataIndex: "clientName",
        key: "clientName",
        width: 240,
        render: (value) => (
          <div className="pk-who">
            <span className="pk-avatar is-soft" aria-hidden="true">
              {String(value || "?").trim().charAt(0).toUpperCase()}
            </span>
            <div style={{ minWidth: 0 }}>
              <strong className="bk-wrap">{value || "-"}</strong>
            </div>
          </div>
        ),
      },
      {
        title: "Event",
        key: "eventName",
        width: 200,
        render: (_, record) => (
          <span className="bk-event">{record?.eventName?.name || record?.eventName || "-"}</span>
        ),
      },
      {
        title: "Status",
        dataIndex: "eventConfirmation",
        key: "eventConfirmation",
        width: 170,
        render: (value) => <span className="pk-pill">{value || "-"}</span>,
      },
      {
        title: "Payable",
        dataIndex: "payableAmount",
        key: "payableAmount",
        width: 150,
        align: "right",
        render: (value) => <span className="pk-money">{formatAmount(value)}</span>,
      },
      {
        title: "Received",
        dataIndex: "receivedAmount",
        key: "receivedAmount",
        width: 150,
        align: "right",
        render: (value) => (
          <span className="pk-money" style={{ color: "#226a36" }}>
            {formatAmount(value)}
          </span>
        ),
      },
      {
        title: "Balance",
        dataIndex: "balanceAmount",
        key: "balanceAmount",
        width: 150,
        align: "right",
        render: (value) => (
          <span className="pk-money" style={{ color: Number(value) < 0 ? "#b03a2e" : "#82682a" }}>
            {formatAmount(value)}
          </span>
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

  const collectedPct =
    Number(summary.totalPayableAmount) > 0
      ? Math.min(
          Math.round((Number(summary.totalReceivedAmount) / Number(summary.totalPayableAmount)) * 100),
          100,
        )
      : 0;

  return (
    <div className="bk-list">
      <div className="bk-intro">
        <h3>Balance sheet</h3>
        <p>
          Confirmed events summary and balances. Filter by event type dates (start / end on an
          event type must fall in the range you pick).
        </p>
      </div>

      <div className="bk-filters">
        <div className="bk-field bk-field-wide">
          <label>Event date range</label>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
            allowEmpty={[true, true]}
            style={{ width: "100%" }}
            size="large"
            placeholder={["Start date", "End date"]}
          />
        </div>
        <button type="button" className="pk-btn bk-clear" onClick={clearDateFilter} disabled={!dateRange}>
          <X size={14} aria-hidden="true" /> Clear dates
        </button>
      </div>

      <div className="bk-stats">
        <div className="bk-stat-grid">
          <div className="bk-stat">
            <p className="bk-stat-title">Total payable amount</p>
            <p className="bk-stat-value">{formatAmount(summary.totalPayableAmount)}</p>
          </div>
          <div className="bk-stat">
            <p className="bk-stat-title">Total received amount</p>
            <p className="bk-stat-value">{formatAmount(summary.totalReceivedAmount)}</p>
            <div className="bk-bar" aria-hidden="true">
              <i style={{ width: `${collectedPct}%` }} />
            </div>
            <p className="bk-stat-sub">{collectedPct}% of payable collected</p>
          </div>
          <div className="bk-stat is-gold">
            <p className="bk-stat-title">Total balance amount</p>
            <p className="bk-stat-value">{formatAmount(summary.totalBalanceAmount)}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bk-center">
          <Spin />
        </div>
      ) : rows.length ? (
        <Table
          className="pk-table bk-table"
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
          scroll={{ x: 1100 }}
        />
      ) : (
        <div className="pk-empty">
          <strong>No balance sheet events found</strong>
          <span>Try a different date range.</span>
        </div>
      )}
    </div>
  );
};

export default BalanceSheets;
