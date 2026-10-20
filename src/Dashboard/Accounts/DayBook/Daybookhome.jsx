import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { message, Spin, Switch } from "antd";
import { ArrowLeft, CalendarDays, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import DaybookDateSelector from "./DaybookDateSelector";
import DaybookSummaryCards from "./DaybookSummaryCards";
import DaybookInflowTable from "./DaybookInflowTable";
import DaybookOutflowTable from "./DaybookOutflowTable";
import DaybookInflowModal from "./DaybookInflowModal";
import DaybookAccountsBalanceTable from "./DaybookAccountsBalanceTable";
import DaybookAccountsBalanceModal from "./DaybookAccountsBalanceModal";
import {
  deleteInflow,
  deleteOpenCloseBalance,
  fetchDaybookAll,
  fetchDaybookRange,
} from "./daybookApi";
import { isEventAdvanceDaybookRow } from "./daybookUtils";
import "./Daybook.css";
import ExcelDownloadButton from "@/Components/ExcelDownloadButton";
import { downloadDaybookExcel } from "./daybookExcel";

const DEFAULT_DATA_LIMIT = 200;
// Start of the overall (till date) download when no data cutoff is configured.
const OVERALL_FALLBACK_START = "2025-01-01";

const Daybookhome = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);

  const [selectedRange, setSelectedRange] = useState(() => [dayjs(), dayjs()]);
  const [includeEventAdvances, setIncludeEventAdvances] = useState(true);
  const [loading, setLoading] = useState(false);
  const [daybook, setDaybook] = useState(null);
  const [activeTab, setActiveTab] = useState("inflow");

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: user?.access_token } }),
    [user?.access_token],
  );

  const startDate = selectedRange?.[0];
  const endDate = selectedRange?.[1];

  const startDateStr = startDate?.isValid?.() ? startDate.format("YYYY-MM-DD") : "";
  const endDateStr = endDate?.isValid?.() ? endDate.format("YYYY-MM-DD") : "";

  const normalizedRangeLabel = useMemo(() => {
    if (!startDateStr || !endDateStr) return "-";
    if (startDateStr === endDateStr) return startDateStr;
    return `${startDateStr} to ${endDateStr}`;
  }, [startDateStr, endDateStr]);

  const fetchDaybook = useCallback(async () => {
    if (!startDateStr || !endDateStr) return;
    setLoading(true);
    try {
      const resData = await fetchDaybookRange({
        startDate: startDateStr,
        endDate: endDateStr,
        limit: DEFAULT_DATA_LIMIT,
        includeEventAdvances,
        authHeaders,
      });
      setDaybook(resData || null);
    } catch (err) {
      message.error("Failed to fetch daybook data");
       
      console.error(err);
      setDaybook(null);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, endDateStr, startDateStr, includeEventAdvances]);

  useEffect(() => {
    fetchDaybook();
  }, [fetchDaybook]);

  // mode: "overall" (everything till today) | "daywise" (the selected dates, per day)
  const downloadDaybook = async (mode) => {
    const range =
      mode === "overall"
        ? {
            startDate: user?.dataCutoffDate || OVERALL_FALLBACK_START,
            endDate: dayjs().format("YYYY-MM-DD"),
          }
        : { startDate: startDateStr, endDate: endDateStr };
    if (!range.startDate || !range.endDate) return;

    const key = "daybook-excel-progress";
    try {
      const data = await fetchDaybookAll({
        ...range,
        includeEventAdvances,
        authHeaders,
        onProgress: (done, total) =>
          total > 1 &&
          message.loading({
            content: `Collecting daybook (${done}/${total} months)...`,
            key,
            duration: 0,
          }),
      });
      const entries =
        (data.inflow?.data?.length ?? 0) +
        (data.outflow?.data?.length ?? 0) +
        (data.accounts?.openCloseBalances?.length ?? 0);
      if (entries === 0) {
        message.info("No daybook entries to download for this period");
        return;
      }
      await downloadDaybookExcel(data, { mode, ...range });
    } finally {
      message.destroy(key);
    }
  };

  const accountsCount = daybook?.accounts?.openCloseBalances?.length ?? 0;

  const [inflowModalOpen, setInflowModalOpen] = useState(false);
  const [inflowModalMode, setInflowModalMode] = useState("add"); // add | edit
  const [inflowEditingRecord, setInflowEditingRecord] = useState(null);

  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceModalMode, setBalanceModalMode] = useState("add"); // add | edit
  const [balanceEditingRecord, setBalanceEditingRecord] = useState(null);

  const [deletingInflowId, setDeletingInflowId] = useState(null);
  const [deletingBalanceId, setDeletingBalanceId] = useState(null);

  const handleAddInflow = () => {
    setInflowModalMode("add");
    setInflowEditingRecord(null);
    setInflowModalOpen(true);
  };

  const handleEditInflow = (record) => {
    if (isEventAdvanceDaybookRow(record)) {
      message.warning(
        "This row is a booking advance from an event. Edit it on the event, not in daybook inflow.",
      );
      return;
    }
    setInflowModalMode("edit");
    setInflowEditingRecord(record);
    setInflowModalOpen(true);
  };

  const handleDeleteInflow = async (record) => {
    if (isEventAdvanceDaybookRow(record)) {
      message.warning(
        "Booking advances cannot be deleted from daybook. Remove or change the advance on the event.",
      );
      return;
    }
    const id = record?._id ?? record?.id;
    if (!id) return;
    setDeletingInflowId(id);
    try {
      await deleteInflow({ id, authHeaders });
      message.success("Inflow deleted successfully");
      await fetchDaybook();
    } catch (err) {
       
      console.error(err);
      message.error("Failed to delete inflow");
    } finally {
      setDeletingInflowId(null);
    }
  };

  const handleInflowModalSuccess = () => {
    setInflowModalOpen(false);
    message.success(
      inflowModalMode === "edit"
        ? "Inflow updated successfully"
        : "Inflow added successfully",
    );
    fetchDaybook();
  };

  const handleAddBalance = () => {
    setBalanceModalMode("add");
    setBalanceEditingRecord(null);
    setBalanceModalOpen(true);
  };

  const handleEditBalance = (record) => {
    setBalanceModalMode("edit");
    setBalanceEditingRecord(record);
    setBalanceModalOpen(true);
  };

  const handleDeleteBalance = async (record) => {
    const id = record?._id ?? record?.id;
    if (!id) return;
    setDeletingBalanceId(id);
    try {
      await deleteOpenCloseBalance({ id, authHeaders });
      message.success("Balance record deleted successfully");
      await fetchDaybook();
    } catch (err) {
       
      console.error(err);
      message.error("Failed to delete balance record");
    } finally {
      setDeletingBalanceId(null);
    }
  };

  const handleBalanceModalSuccess = () => {
    setBalanceModalOpen(false);
    message.success(
      balanceModalMode === "edit"
        ? "Balance record updated successfully"
        : "Balance record added successfully",
    );
    fetchDaybook();
  };

  const tabs = [
    { key: "inflow", label: "Inflow", count: daybook?.inflow?.count ?? 0 },
    { key: "outflow", label: "Outflow", count: daybook?.outflow?.count ?? 0 },
    { key: "accounts", label: "Accounts", count: accountsCount },
  ];

  return (
    <div className="db-page">
      <div className="db-wrap">
        <header className="db-hero">
          <div>
            <button type="button" className="db-back" onClick={() => navigate("/user")}>
              <ArrowLeft size={14} aria-hidden="true" /> Back to home
            </button>
            <p className="db-eyebrow">Accounts</p>
            <h1 className="db-title">Daybook</h1>
            <p className="db-sub">Day-to-day money in, money out and balances.</p>
          </div>
          <span className="db-period">
            <CalendarDays size={16} aria-hidden="true" /> {normalizedRangeLabel}
          </span>
        </header>

        <section className="db-controls">
          <DaybookDateSelector
            value={selectedRange}
            onChange={setSelectedRange}
            cutoffDate={user?.dataCutoffDate}
          />
          <div className="db-controls-right">
            <label
              className="db-toggle"
              title="Counts booking advances as inflow when their received date falls in the range"
            >
              <Switch
                size="small"
                checked={includeEventAdvances}
                onChange={setIncludeEventAdvances}
              />
              Include booking advances
            </label>
            <ExcelDownloadButton
              label="Overall Excel"
              onDownload={() => downloadDaybook("overall")}
            />
            <ExcelDownloadButton
              label="Day-wise Excel"
              onDownload={() => downloadDaybook("daywise")}
              disabled={!startDateStr || !endDateStr}
            />
          </div>
        </section>

        <DaybookSummaryCards
          loading={loading}
          inflow={daybook?.inflow}
          outflow={daybook?.outflow}
          accounts={daybook?.accounts}
        />

        <section className="db-panel">
          <div className="db-panel-head">
            <div className="db-tabs" role="group" aria-label="Entries">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={activeTab === t.key}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label} <span className="count">{t.count}</span>
                </button>
              ))}
            </div>
            {activeTab === "inflow" && (
              <button type="button" className="db-add" onClick={handleAddInflow}>
                <Plus size={16} strokeWidth={2.4} aria-hidden="true" /> Add inflow
              </button>
            )}
            {activeTab === "accounts" && (
              <button type="button" className="db-add" onClick={handleAddBalance}>
                <Plus size={16} strokeWidth={2.4} aria-hidden="true" /> Add open/close balance
              </button>
            )}
          </div>

          <div className="db-body">
            {loading && (
              <div className="db-loading">
                <Spin />
              </div>
            )}

            {!loading && activeTab === "inflow" && (
              <DaybookInflowTable
                rows={daybook?.inflow?.data}
                onEdit={handleEditInflow}
                onDelete={handleDeleteInflow}
                deletingId={deletingInflowId}
              />
            )}
            {!loading && activeTab === "outflow" && (
              <DaybookOutflowTable rows={daybook?.outflow?.data} />
            )}
            {!loading && activeTab === "accounts" && (
              <DaybookAccountsBalanceTable
                rows={daybook?.accounts?.openCloseBalances}
                onEdit={handleEditBalance}
                onDelete={handleDeleteBalance}
                deletingId={deletingBalanceId}
              />
            )}

            {!loading && !daybook && (
              <div className="db-empty">
                <strong>No daybook data found</strong>
                <span>Try a different date range.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <DaybookInflowModal
        open={inflowModalOpen}
        mode={inflowModalMode}
        initialValues={inflowEditingRecord}
        authHeaders={authHeaders}
        onCancel={() => setInflowModalOpen(false)}
        onSuccess={handleInflowModalSuccess}
      />

      <DaybookAccountsBalanceModal
        open={balanceModalOpen}
        mode={balanceModalMode}
        initialValues={balanceEditingRecord}
        existingBalances={daybook?.accounts?.openCloseBalances}
        authHeaders={authHeaders}
        onCancel={() => setBalanceModalOpen(false)}
        onSuccess={handleBalanceModalSuccess}
      />
    </div>
  );
};

export default Daybookhome;
