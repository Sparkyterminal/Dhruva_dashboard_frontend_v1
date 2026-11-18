import React, { useCallback, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { message, Spin } from "antd";
import { ArrowLeft, CalendarDays, Plus, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { ConfirmDialog } from "@/Components/AdminKit";
import ExcelDownloadButton from "@/Components/ExcelDownloadButton";
import DaybookDateSelector from "./DaybookDateSelector";
import DaybookSummaryCards from "./DaybookSummaryCards";
import DaybookInflowTable from "./DaybookInflowTable";
import DaybookOutflowTable from "./DaybookOutflowTable";
import DaybookBalancesTable from "./DaybookBalancesTable";
import DaybookInflowDialog from "./DaybookInflowDialog";
import DaybookOutflowDialog from "./DaybookOutflowDialog";
import DaybookOpeningDialog from "./DaybookOpeningDialog";
import {
  deleteInflow,
  deleteOutflow,
  fetchDaybookAll,
  fetchDaybookRange,
  fetchOpeningBalance,
} from "./daybookApi";
import { downloadDaybookExcel } from "./daybookExcel";
import { formatDate } from "./daybookUtils";
import "./Daybook.css";

const DEFAULT_DATA_LIMIT = 200;
// Start of the overall (till date) download when no data cutoff is configured.
const OVERALL_FALLBACK_START = "2025-01-01";

const Daybookhome = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);

  const [selectedRange, setSelectedRange] = useState(() => [dayjs(), dayjs()]);
  const [loading, setLoading] = useState(false);
  const [daybook, setDaybook] = useState(null);
  const [opening, setOpening] = useState(null);
  const [activeTab, setActiveTab] = useState("inflow");

  const [inflowDialog, setInflowDialog] = useState({ open: false, mode: "add", record: null });
  const [outflowDialog, setOutflowDialog] = useState({ open: false, mode: "add", record: null });
  const [openingDialogOpen, setOpeningDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { kind: "inflow" | "outflow", record }
  const [deleting, setDeleting] = useState(false);

  const authHeaders = useMemo(
    () => ({ headers: { Authorization: user?.access_token } }),
    [user?.access_token],
  );

  const startDateStr = selectedRange?.[0]?.isValid?.() ? selectedRange[0].format("YYYY-MM-DD") : "";
  const endDateStr = selectedRange?.[1]?.isValid?.() ? selectedRange[1].format("YYYY-MM-DD") : "";

  const rangeLabel = useMemo(() => {
    if (!startDateStr || !endDateStr) return "-";
    return startDateStr === endDateStr ? startDateStr : `${startDateStr} to ${endDateStr}`;
  }, [startDateStr, endDateStr]);

  const fetchDaybook = useCallback(async () => {
    if (!startDateStr || !endDateStr) return;
    setLoading(true);
    try {
      const data = await fetchDaybookRange({
        startDate: startDateStr,
        endDate: endDateStr,
        limit: DEFAULT_DATA_LIMIT,
        authHeaders,
      });
      setDaybook(data || null);
    } catch {
      message.error("Failed to fetch daybook data");
      setDaybook(null);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, endDateStr, startDateStr]);

  const fetchOpening = useCallback(async () => {
    try {
      setOpening(await fetchOpeningBalance({ authHeaders }));
    } catch {
      message.error("Failed to fetch the starting balance");
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchDaybook();
  }, [fetchDaybook]);

  useEffect(() => {
    fetchOpening();
  }, [fetchOpening]);

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
        (data.balances?.days?.length ?? 0);
      if (entries === 0) {
        message.info("No daybook entries to download for this period");
        return;
      }
      await downloadDaybookExcel(data, { mode, ...range });
    } finally {
      message.destroy(key);
    }
  };

  const openInflow = (mode, record = null) => setInflowDialog({ open: true, mode, record });
  const openOutflow = (mode, record = null) => setOutflowDialog({ open: true, mode, record });

  const afterSave = (kind) => (mode) => {
    if (kind === "inflow") setInflowDialog((d) => ({ ...d, open: false }));
    else setOutflowDialog((d) => ({ ...d, open: false }));
    message.success(
      `${kind === "inflow" ? "Inflow" : "Outflow"} ${mode === "edit" ? "updated" : "added"} successfully`,
    );
    fetchDaybook();
  };

  const afterOpeningSaved = () => {
    setOpeningDialogOpen(false);
    message.success("Starting balance saved");
    fetchOpening();
    fetchDaybook();
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { kind, record } = pendingDelete;
    const id = record?._id ?? record?.id;
    if (!id) return;
    setDeleting(true);
    try {
      if (kind === "inflow") await deleteInflow({ id, authHeaders });
      else await deleteOutflow({ id, authHeaders });
      message.success(`${kind === "inflow" ? "Inflow" : "Outflow"} deleted successfully`);
      setPendingDelete(null);
      await fetchDaybook();
    } catch (err) {
      message.error(err?.response?.data?.message || `Failed to delete ${kind}`);
    } finally {
      setDeleting(false);
    }
  };

  const days = daybook?.balances?.days;
  const openingSet = Boolean(opening?.asOfDate);
  const inflowRows = daybook?.inflow?.data;
  const outflowRows = daybook?.outflow?.data;

  const tabs = [
    { key: "inflow", label: "Inflow", count: daybook?.inflow?.count ?? 0 },
    { key: "outflow", label: "Outflow", count: daybook?.outflow?.count ?? 0 },
    { key: "balances", label: "Balances", count: days?.length ?? 0 },
  ];

  const truncatedNote = (list, total) =>
    Array.isArray(list) && total > list.length ? (
      <p className="db-truncated">
        Showing the latest {list.length} of {total} entries. Totals above include all of them; pick a shorter period to see the rest.
      </p>
    ) : null;

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
            <p className="db-sub">Money in, money out and balances, day by day.</p>
          </div>
          <span className="db-period">
            <CalendarDays size={16} aria-hidden="true" /> {rangeLabel}
          </span>
        </header>

        {!openingSet && opening ? (
          <div className="db-banner" role="status">
            <div>
              <strong>Set the starting balance to switch on balances</strong>
              <span>Enter what cash and each account hold on the first day. After that, balances carry forward on their own.</span>
            </div>
            <button type="button" className="db-add" onClick={() => setOpeningDialogOpen(true)}>
              Set starting balance
            </button>
          </div>
        ) : null}

        <section className="db-controls">
          <DaybookDateSelector value={selectedRange} onChange={setSelectedRange} cutoffDate={user?.dataCutoffDate} />
          <div className="db-controls-right">
            {openingSet ? (
              <button
                type="button"
                className="db-ghost"
                onClick={() => setOpeningDialogOpen(true)}
                title={`Balances start on ${formatDate(opening.asOfDate)}`}
              >
                <Settings2 size={15} aria-hidden="true" /> Starting balance
              </button>
            ) : null}
            <ExcelDownloadButton label="Overall Excel" onDownload={() => downloadDaybook("overall")} />
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
          surplusDeficit={daybook?.surplusDeficit}
          days={days}
        />

        <section className="db-panel">
          <div className="db-panel-head">
            <div className="db-tabs" role="group" aria-label="Entries">
              {tabs.map((t) => (
                <button key={t.key} type="button" aria-pressed={activeTab === t.key} onClick={() => setActiveTab(t.key)}>
                  {t.label} <span className="count">{t.count}</span>
                </button>
              ))}
            </div>
            {activeTab === "inflow" && (
              <button type="button" className="db-add" onClick={() => openInflow("add")}>
                <Plus size={16} strokeWidth={2.4} aria-hidden="true" /> Add inflow
              </button>
            )}
            {activeTab === "outflow" && (
              <button type="button" className="db-add" onClick={() => openOutflow("add")}>
                <Plus size={16} strokeWidth={2.4} aria-hidden="true" /> Add outflow
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
              <>
                <DaybookInflowTable
                  rows={inflowRows}
                  onEdit={(r) => openInflow("edit", r)}
                  onDelete={(r) => setPendingDelete({ kind: "inflow", record: r })}
                />
                {truncatedNote(inflowRows, daybook?.inflow?.count)}
              </>
            )}
            {!loading && activeTab === "outflow" && (
              <>
                <DaybookOutflowTable
                  rows={outflowRows}
                  onEdit={(r) => openOutflow("edit", r)}
                  onDelete={(r) => setPendingDelete({ kind: "outflow", record: r })}
                />
                {truncatedNote(outflowRows, daybook?.outflow?.count)}
              </>
            )}
            {!loading && activeTab === "balances" && <DaybookBalancesTable days={days} />}

            {!loading && !daybook && (
              <div className="db-empty">
                <strong>No daybook data found</strong>
                <span>Try a different date range.</span>
              </div>
            )}
          </div>
        </section>
      </div>

      <DaybookInflowDialog
        open={inflowDialog.open}
        mode={inflowDialog.mode}
        initialValues={inflowDialog.record}
        authHeaders={authHeaders}
        onClose={() => setInflowDialog((d) => ({ ...d, open: false }))}
        onSaved={afterSave("inflow")}
      />
      <DaybookOutflowDialog
        open={outflowDialog.open}
        mode={outflowDialog.mode}
        initialValues={outflowDialog.record}
        authHeaders={authHeaders}
        onClose={() => setOutflowDialog((d) => ({ ...d, open: false }))}
        onSaved={afterSave("outflow")}
      />
      <DaybookOpeningDialog
        open={openingDialogOpen}
        current={opening}
        authHeaders={authHeaders}
        onClose={() => setOpeningDialogOpen(false)}
        onSaved={afterOpeningSaved}
      />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Delete ${pendingDelete?.kind ?? "entry"}?`}
        message="This removes the entry and recalculates the balances from that day onward."
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default Daybookhome;
