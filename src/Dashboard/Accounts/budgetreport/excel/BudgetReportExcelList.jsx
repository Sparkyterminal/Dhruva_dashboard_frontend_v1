import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { Table, message } from "antd";
import { Eye, FileSpreadsheet, Layers, Pencil, Plus, Search, Table2 } from "lucide-react";
import {
  EmptyState,
  PageHero,
  SearchBox,
  StatCard,
  StatRow,
} from "@/Components/PageKit";
import { fetchBudgetReportExcelList } from "./budgetReportExcelApi";
import ExcelDownloadButton from "@/Components/ExcelDownloadButton";
import {
  downloadAllBudgetReportsExcel,
  downloadBudgetReportExcel,
} from "./budgetReportExcelExport";

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

  const handleDownloadAll = async () => {
    if (rows.length === 0) {
      message.info("No budget reports to download");
      return;
    }
    const key = "budget-excel-progress";
    try {
      await downloadAllBudgetReportsExcel({
        rows,
        authHeaders,
        onProgress: (done, total) =>
          message.loading({
            content: `Collecting budget reports (${done}/${total})...`,
            key,
            duration: 0,
          }),
      });
    } finally {
      message.destroy(key);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setSearchParams(value ? { search: value } : {});
  };

  const submitSearch = (e) => {
    e.preventDefault();
    handleSearch(searchQuery.trim());
  };

  const eventState = (record) => ({
    eventName: record.eventName,
    clientName: record.clientName,
    eventLabel: [record.eventName, record.clientName].filter(Boolean).join(" - "),
  });

  const withReport = rows.filter((r) => r.hasWorkbook).length;
  const totalSheets = rows.reduce((sum, r) => sum + (Number(r.sheetCount) || 0), 0);

  const columns = [
    {
      title: "Event",
      key: "event",
      render: (_, record) => (
        <div className="pk-who">
          <span className="pk-avatar" aria-hidden="true">
            {(record.eventName || "?").trim().charAt(0).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong>{record.eventName || "—"}</strong>
            <span>{record.clientName || "No client"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Workbook",
      key: "sheetCount",
      width: 170,
      render: (_, record) =>
        record.hasWorkbook ? (
          <span className="pk-pill">
            {record.sheetCount || 0} {Number(record.sheetCount) === 1 ? "sheet" : "sheets"}
          </span>
        ) : (
          <span className="pk-pill is-grey">Not created</span>
        ),
    },
    {
      title: "Last updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 170,
      render: (val) =>
        val ? (
          new Date(val).toLocaleDateString("en-IN", { dateStyle: "medium" })
        ) : (
          <span className="pk-muted">—</span>
        ),
    },
    {
      title: "",
      key: "actions",
      width: 330,
      align: "right",
      render: (_, record) => (
        <div className="pk-actions">
          <ExcelDownloadButton
            size="middle"
            label="Excel"
            disabled={!record.hasWorkbook}
            onDownload={() => downloadBudgetReportExcel({ row: record, authHeaders })}
            style={{ borderRadius: 9, fontWeight: 600, fontSize: 12.5 }}
          />
          <button
            type="button"
            className="pk-btn"
            onClick={() =>
              navigate(`/user/budgetreport/view/${record.eventId}`, { state: eventState(record) })
            }
          >
            <Eye size={14} aria-hidden="true" /> View
          </button>
          <button
            type="button"
            className="pk-btn is-solid"
            onClick={() =>
              navigate(`/user/budgetreport/edit/${record.eventId}`, { state: eventState(record) })
            }
          >
            <Pencil size={13} aria-hidden="true" /> Edit
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Accounts"
          title="Budget Reports"
          subtitle="One Excel workbook per confirmed or in-progress event. Open it to view, or edit the figures."
          onBack={() => navigate("/user")}
        >
          <button type="button" className="pk-cta" onClick={() => navigate("/user/budgetreport")}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add budget report
          </button>
        </PageHero>

        <StatRow>
          <StatCard icon={<FileSpreadsheet size={21} aria-hidden="true" />} label="Events listed" value={rows.length} />
          <StatCard tone="gold" icon={<Layers size={21} aria-hidden="true" />} label="With a workbook" value={withReport} />
          <StatCard tone="blue" icon={<Table2 size={21} aria-hidden="true" />} label="Total sheets" value={totalSheets} />
        </StatRow>

        <section className="pk-panel">
          <div className="pk-toolbar">
            <form className="pk-toolbar-left" onSubmit={submitSearch} role="search">
              <SearchBox
                icon={<Search size={16} aria-hidden="true" />}
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  if (!val) {
                    setSearchParams({});
                    fetchList("");
                  }
                }}
                placeholder="Search event name, client or event ID — press Enter"
                label="Search budget reports"
              />
              <button type="submit" className="pk-btn is-solid" style={{ height: 42 }}>
                Search
              </button>
            </form>
            <div className="pk-toolbar-right">
              <ExcelDownloadButton label="Download all (Excel)" onDownload={handleDownloadAll} />
            </div>
          </div>

          <Table
            className="pk-table"
            rowKey="eventId"
            columns={columns}
            dataSource={rows}
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} reports`,
            }}
            scroll={{ x: 760 }}
            locale={{
              emptyText: loading ? null : (
                <EmptyState
                  icon={<FileSpreadsheet size={26} aria-hidden="true" />}
                  title={searchQuery ? `No reports match “${searchQuery}”` : "No budget reports yet"}
                  hint={searchQuery ? "Try a different search." : "Use “Add budget report” to create the first one."}
                />
              ),
            }}
          />
        </section>
      </div>
    </div>
  );
};

export default BudgetReportExcelList;
