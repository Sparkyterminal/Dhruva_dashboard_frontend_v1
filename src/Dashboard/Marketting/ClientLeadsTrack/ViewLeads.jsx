import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { useSelector } from "react-redux";
import {
  Table,
  Drawer,
  Popconfirm,
  message,
  Spin,
  Select,
  DatePicker,
} from "antd";
import {
  BadgeCheck,
  Eye,
  FileSpreadsheet,
  Pencil,
  Percent,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import {
  EmptyState,
  PageHero,
  Segmented,
  StatCard,
  StatRow,
} from "@/Components/PageKit";
import "./TrackLeads.css";
import dayjs from "dayjs";
import AddLeads from "./AddLeads";
import LeadForm, { STATUS_OPTIONS } from "./LeadForm";
import LeadsCalendar from "../../../Components/LeadsCalendar";
import { getEffectiveCutoffDate } from "../../../utils/dataCutoff";
import ExcelDownloadButton from "@/Components/ExcelDownloadButton";
import { downloadLeadsExcel } from "./leadsExcel";

const { RangePicker } = DatePicker;

/** Display name for a coordinator / assignedTo object */
function getPersonDisplayName(person) {
  if (!person) return "";
  if (typeof person === "string") return person;
  const full = [
    person.first_name ?? person.firstName,
    person.last_name ?? person.lastName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    person.name || full || person.email || String(person._id ?? person.id ?? "")
  );
}

/** Format date for display (YYYY-MM-DD or ISO string to DD MMM YYYY) */
function formatDateDisplay(dateStr) {
  if (!dateStr) return "—";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("DD MMM YYYY") : "—";
}

function formatAmountINR(value) {
  const n = Number(value);
  if (value == null || Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

/**
 * Interim client-side card totals when API summary is missing.
 * Date filters apply to lead startDate; converted flag splits the two cards.
 */
function computeBudgetSummaryFromLeads(leads, rangeStart, rangeEnd) {
  let totalEstimatedBudget = 0;
  let totalConvertedBudget = 0;
  let estimatedLeadsCount = 0;
  let convertedLeadsCount = 0;
  const hasRange = Boolean(rangeStart && rangeEnd);

  for (const lead of leads || []) {
    const budget = Number(lead?.estimatedBudget) || 0;
    const start = lead?.startDate ? dayjs(lead.startDate) : null;
    if (hasRange) {
      if (!start || !start.isValid()) continue;
      const ymd = start.format("YYYY-MM-DD");
      if (ymd < rangeStart || ymd > rangeEnd) continue;
    }
    if (lead?.convertedByMarketing) {
      totalConvertedBudget += budget;
      convertedLeadsCount += 1;
    } else {
      totalEstimatedBudget += budget;
      estimatedLeadsCount += 1;
    }
  }

  return {
    totalEstimatedBudget,
    totalConvertedBudget,
    estimatedLeadsCount,
    convertedLeadsCount,
  };
}

const ViewLeads = ({ readOnly = false, embedded = false }) => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const dataCutoffDate = user?.dataCutoffDate;
  const disabledBeforeCutoff = (current) =>
    dataCutoffDate ? current && current.isBefore(dayjs(dataCutoffDate), "day") : false;
  const [leads, setLeads] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [editInitialValues, setEditInitialValues] = useState(null);
  const [editFetching, setEditFetching] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [viewingLead, setViewingLead] = useState(null);
  const [viewFetching, setViewFetching] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState("list");
  const [filterStatus, setFilterStatus] = useState(undefined);
  const [filterAssignedTo, setFilterAssignedTo] = useState(undefined);
  const [filterMonth, setFilterMonth] = useState(null);
  const [filterDateRange, setFilterDateRange] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [coordinatorsLoading, setCoordinatorsLoading] = useState(false);

  const activeDateBounds = useMemo(() => {
    if (
      filterDateRange?.[0]?.isValid?.() &&
      filterDateRange?.[1]?.isValid?.()
    ) {
      return {
        startDate: filterDateRange[0].format("YYYY-MM-DD"),
        endDate: filterDateRange[1].format("YYYY-MM-DD"),
        month: null,
      };
    }
    if (filterMonth?.isValid?.()) {
      return {
        startDate: filterMonth.startOf("month").format("YYYY-MM-DD"),
        endDate: filterMonth.endOf("month").format("YYYY-MM-DD"),
        month: filterMonth.format("YYYY-MM"),
      };
    }
    // No explicit filter — default to the data-visibility cutoff (real,
    // server-filtered query; see src/utils/dataCutoff.js) rather than
    // fetching everything.
    return { startDate: getEffectiveCutoffDate(user), endDate: null, month: null };
  }, [filterDateRange, filterMonth, user]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterAssignedTo) params.assignedTo = filterAssignedTo;
      if (activeDateBounds.startDate) params.startDate = activeDateBounds.startDate;
      if (activeDateBounds.endDate) params.endDate = activeDateBounds.endDate;
      if (activeDateBounds.month && !filterDateRange) {
        params.month = activeDateBounds.month;
      }
      const res = await axiosClient.get(`client-leads`, {
        ...config,
        params,
      });
      const list = res.data?.data ?? res.data?.leads ?? res.data;
      setLeads(Array.isArray(list) ? list : []);
      const serverSummary = res.data?.summary ?? null;
      setSummary(
        serverSummary && typeof serverSummary === "object"
          ? serverSummary
          : null,
      );
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to load leads.");
      setLeads([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config from closure
  }, [
    filterStatus,
    filterAssignedTo,
    activeDateBounds.startDate,
    activeDateBounds.endDate,
    activeDateBounds.month,
    filterDateRange,
  ]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    const fetchCoordinators = async () => {
      if (!user?.access_token) return;
      setCoordinatorsLoading(true);
      try {
        const res = await axiosClient.get(`coordinators`, config);
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.coordinators)
            ? raw.coordinators
            : Array.isArray(raw?.items)
              ? raw.items
              : Array.isArray(raw?.data)
                ? raw.data
                : [];
        setCoordinators(list);
      } catch {
        setCoordinators([]);
      } finally {
        setCoordinatorsLoading(false);
      }
    };
    fetchCoordinators();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config from closure
  }, [user?.access_token]);

  const budgetCards = useMemo(() => {
    if (
      summary &&
      (summary.totalEstimatedBudget != null ||
        summary.totalConvertedBudget != null)
    ) {
      return {
        totalEstimatedBudget: Number(summary.totalEstimatedBudget) || 0,
        totalConvertedBudget: Number(summary.totalConvertedBudget) || 0,
        estimatedLeadsCount: Number(summary.estimatedLeadsCount) || 0,
        convertedLeadsCount: Number(summary.convertedLeadsCount) || 0,
        fromServer: true,
      };
    }
    return {
      ...computeBudgetSummaryFromLeads(
        leads,
        activeDateBounds.startDate,
        activeDateBounds.endDate,
      ),
      fromServer: false,
    };
  }, [summary, leads, activeDateBounds.startDate, activeDateBounds.endDate]);

  const handleAddSuccess = () => {
    setDrawerOpen(false);
    fetchLeads();
  };

  const openEditDrawer = (id) => {
    setEditingLeadId(id);
    setEditDrawerOpen(true);
    setEditInitialValues(null);
  };

  useEffect(() => {
    if (!editDrawerOpen || !editingLeadId) return;
    setEditFetching(true);
    axiosClient
      .get(`client-leads/${editingLeadId}`, config)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setEditInitialValues(raw);
      })
      .catch(() => {
        message.error("Failed to load lead.");
        setEditDrawerOpen(false);
      })
      .finally(() => setEditFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config from closure
  }, [editDrawerOpen, editingLeadId]);

  const handleEditSubmit = async (values) => {
    setEditSaving(true);
    try {
      await axiosClient.put(
        `client-leads/${editingLeadId}`,
        values,
        config,
      );
      message.success("Lead updated successfully.");
      setEditDrawerOpen(false);
      setEditingLeadId(null);
      setEditInitialValues(null);
      fetchLeads();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update lead.");
    } finally {
      setEditSaving(false);
    }
  };

  const openViewDrawer = (id) => {
    setViewDrawerOpen(true);
    setViewingLead(null);
    setViewFetching(true);
    axiosClient
      .get(`client-leads/${id}`, config)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setViewingLead(raw);
      })
      .catch(() => message.error("Failed to load lead."))
      .finally(() => setViewFetching(false));
     
  };

  const handleDelete = async (record) => {
    const id = record._id ?? record.id;
    if (!id) return;
    try {
      await axiosClient.delete(`client-leads/${id}`, config);
      message.success("Lead deleted.");
      fetchLeads();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete lead.");
    }
  };

  const handleDownloadExcel = async () => {
    if (leads.length === 0) {
      message.info("No leads to download");
      return;
    }
    const parts = [];
    if (filterStatus) parts.push(`Status: ${filterStatus}`);
    if (filterAssignedTo) {
      const person = coordinators.find(
        (c) => String(c._id ?? c.id) === String(filterAssignedTo),
      );
      parts.push(`Assigned to: ${getPersonDisplayName(person) || "Selected"}`);
    }
    if (filterDateRange?.[0] && filterDateRange?.[1]) {
      parts.push(`Dates: ${filterDateRange[0].format("DD MMM YYYY")} - ${filterDateRange[1].format("DD MMM YYYY")}`);
    } else if (filterMonth?.isValid?.()) {
      parts.push(`Month: ${filterMonth.format("MMMM YYYY")}`);
    }
    await downloadLeadsExcel(leads, { filterLines: parts.length ? [parts.join("   |   ")] : [] });
  };

  const clearFilters = () => {
    setFilterStatus(undefined);
    setFilterAssignedTo(undefined);
    setFilterMonth(null);
    setFilterDateRange(null);
  };

  const hasAnyFilter =
    Boolean(filterStatus) ||
    Boolean(filterAssignedTo) ||
    Boolean(filterMonth) ||
    Boolean(filterDateRange?.[0] && filterDateRange?.[1]);

  const statusTone = (status) =>
    status === "Confirmed" ? "" : status === "Cancelled" ? "is-red" : "is-gold";

  const initialOf = (text) => (String(text || "?").trim()[0] || "?").toUpperCase();
  const firstLine = (text) => String(text || "").split("\n")[0].trim();

  const statusFilterOptions = [
    { value: undefined, label: "All" },
    ...STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];

  const columns = [
    {
      title: "Client",
      key: "client",
      width: 260,
      render: (_, record) => (
        <div className="pk-who">
          <span className="pk-avatar" aria-hidden="true">
            {initialOf(firstLine(record.clientDetails))}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong className="tl-wrap">{firstLine(record.clientDetails) || "—"}</strong>
            <span className="tl-wrap">{firstLine(record.eventTypeDetails) || "No event type"}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
          {status ? (
            <span className={`pk-pill ${statusTone(status)}`}>{status}</span>
          ) : (
            <span className="pk-muted">—</span>
          )}
          {record?.convertedByMarketing ? <span className="pk-pill is-blue">Converted</span> : null}
        </div>
      ),
    },
    {
      title: "Estimated budget",
      dataIndex: "estimatedBudget",
      key: "estimatedBudget",
      width: 150,
      align: "right",
      render: (v) => <span className="pk-money">{formatAmountINR(v)}</span>,
    },
    {
      title: "Dates",
      key: "dates",
      width: 200,
      render: (_, record) => (
        <div>
          <div>{formatDateDisplay(record.startDate)}</div>
          <div className="pk-muted" style={{ fontSize: 12 }}>
            to {formatDateDisplay(record.endDate)}
          </div>
        </div>
      ),
    },
    {
      title: "Assigned to",
      key: "assignedTo",
      width: 180,
      render: (_, record) => {
        const name = getPersonDisplayName(record.assignedTo);
        return name ? (
          <div className="pk-who">
            <span className="pk-avatar is-soft" style={{ width: 30, height: 30, fontSize: 12, borderRadius: 9 }} aria-hidden="true">
              {initialOf(name)}
            </span>
            <span className="tl-wrap" style={{ fontSize: 13.5, color: "var(--ink)" }}>{name}</span>
          </div>
        ) : (
          <span className="pk-muted">Unassigned</span>
        );
      },
    },
    {
      title: "Notes",
      key: "notes",
      width: 300,
      render: (_, record) => (
        <span className="pk-muted tl-wrap">{record.notes || "—"}</span>
      ),
    },
    {
      title: "",
      key: "action",
      width: readOnly ? 110 : 270,
      align: "right",
      fixed: "right",
      render: (_, record) => {
        const id = record._id ?? record.id;
        return (
          <div className="pk-actions">
            <button type="button" className="pk-btn" onClick={() => openViewDrawer(id)}>
              <Eye size={14} aria-hidden="true" /> View
            </button>
            {!readOnly ? (
              <>
                <button type="button" className="pk-btn is-solid" onClick={() => openEditDrawer(id)}>
                  <Pencil size={13} aria-hidden="true" /> Edit
                </button>
                <Popconfirm
                  title="Delete this lead?"
                  description="This action cannot be undone."
                  onConfirm={() => handleDelete(record)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  cancelText="Cancel"
                >
                  <button type="button" className="pk-btn is-danger is-icon" aria-label="Delete lead">
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </Popconfirm>
              </>
            ) : null}
          </div>
        );
      },
    },
  ];

  const totalLeadsInBudget = budgetCards.estimatedLeadsCount + budgetCards.convertedLeadsCount;
  const conversionRate = totalLeadsInBudget
    ? Math.round((budgetCards.convertedLeadsCount / totalLeadsInBudget) * 100)
    : 0;

  const stats = (
    <StatRow>
      <StatCard
        tone="gold"
        icon={<TrendingUp size={21} aria-hidden="true" />}
        label={`Pipeline budget · ${budgetCards.estimatedLeadsCount} leads`}
        value={formatAmountINR(budgetCards.totalEstimatedBudget)}
      />
      <StatCard
        icon={<BadgeCheck size={21} aria-hidden="true" />}
        label={`Converted budget · ${budgetCards.convertedLeadsCount} leads`}
        value={formatAmountINR(budgetCards.totalConvertedBudget)}
      />
      <StatCard
        tone="blue"
        icon={<Users size={21} aria-hidden="true" />}
        label="Leads shown"
        value={leads.length}
      />
      <StatCard
        icon={<Percent size={21} aria-hidden="true" />}
        label="Conversion rate"
        value={`${conversionRate}%`}
      />
    </StatRow>
  );

  const panel = (
    <section className="pk-panel">
      <div className="pk-toolbar">
        <div className="pk-toolbar-left">
          <Segmented
            label="Status"
            options={statusFilterOptions}
            value={filterStatus}
            onChange={setFilterStatus}
          />
        </div>
        <div className="pk-toolbar-right">
          <Segmented
            label="View"
            value={activeViewTab}
            onChange={setActiveViewTab}
            options={[
              { value: "list", label: "List", count: leads.length },
              { value: "calendar", label: "Calendar" },
            ]}
          />
          <ExcelDownloadButton onDownload={handleDownloadExcel} />
        </div>
      </div>

      <div className="tl-filters">
        <div className="tl-field">
          <label>Coordinator</label>
          <Select
            allowClear
            showSearch
            placeholder="All coordinators"
            value={filterAssignedTo}
            onChange={setFilterAssignedTo}
            loading={coordinatorsLoading}
            optionFilterProp="label"
            options={coordinators.map((c) => ({
              value: c._id ?? c.id,
              label: getPersonDisplayName(c) || String(c._id ?? c.id),
            }))}
            style={{ width: "100%" }}
            size="large"
          />
        </div>
        <div className="tl-field">
          <label>Month (by start date)</label>
          <DatePicker
            picker="month"
            value={filterMonth}
            onChange={(m) => {
              setFilterMonth(m);
              if (m) setFilterDateRange(null);
            }}
            disabledDate={disabledBeforeCutoff}
            style={{ width: "100%" }}
            size="large"
            allowClear
            placeholder="Select month"
          />
        </div>
        <div className="tl-field tl-field-wide">
          <label>Start date range</label>
          <RangePicker
            value={filterDateRange}
            onChange={(r) => {
              setFilterDateRange(r);
              if (r?.[0] && r?.[1]) setFilterMonth(null);
            }}
            disabledDate={disabledBeforeCutoff}
            format="DD MMM YYYY"
            style={{ width: "100%" }}
            size="large"
            allowClear
          />
        </div>
        <button type="button" className="pk-btn tl-clear" disabled={!hasAnyFilter} onClick={clearFilters}>
          <X size={14} aria-hidden="true" /> Clear filters
        </button>
      </div>

      {activeViewTab === "list" ? (
        <Table
          className="pk-table tl-table"
          rowKey={(r) => r._id ?? r.id}
          columns={columns}
          dataSource={leads}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `${t} leads`,
          }}
          scroll={{ x: 1450 }}
          locale={{
            emptyText: loading ? null : (
              <EmptyState
                icon={<Target size={26} aria-hidden="true" />}
                title={hasAnyFilter ? "No leads match these filters" : "No leads yet"}
                hint={
                  hasAnyFilter
                    ? "Try clearing a filter."
                    : readOnly
                      ? undefined
                      : "Use “Add leads” to create the first one."
                }
              />
            ),
          }}
        />
      ) : (
        <div className="tl-calendar">
          <LeadsCalendar leads={leads} loading={loading} />
        </div>
      )}
    </section>
  );

  const detail = (label, value, wide) => (
    <div className={`tl-detail${wide ? " is-wide" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );

  return (
    <div className={embedded ? "tl-embedded" : "pk-page"}>
      <div className="pk-wrap" style={embedded ? { maxWidth: "none" } : undefined}>
        {!embedded ? (
          <PageHero
            eyebrow="Marketing"
            title="Track Leads"
            subtitle="Follow every enquiry from first contact to confirmed booking."
            onBack={() => navigate("/user")}
          >
            {!readOnly ? (
              <>
                <button type="button" className="pk-cta is-ghost" onClick={() => navigate("/user/client-leads/excel")}>
                  <FileSpreadsheet size={16} aria-hidden="true" /> Excel
                </button>
                <button type="button" className="pk-cta" onClick={() => setDrawerOpen(true)}>
                  <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> Add leads
                </button>
              </>
            ) : null}
          </PageHero>
        ) : null}

        {stats}
        {panel}
      </div>

      {!readOnly ? (
        <>
          <Drawer
            title="Add lead"
            placement="right"
            width={480}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            destroyOnHidden
          >
            <AddLeads onSuccess={handleAddSuccess} inDrawer />
          </Drawer>

          <Drawer
            title="Edit lead"
            placement="right"
            width={480}
            open={editDrawerOpen}
            onClose={() => {
              setEditDrawerOpen(false);
              setEditingLeadId(null);
              setEditInitialValues(null);
            }}
            destroyOnHidden
          >
            {editFetching ? (
              <div style={{ padding: 24, textAlign: "center" }}>
                <Spin size="large" tip="Loading lead…" />
              </div>
            ) : (
              <LeadForm
                initialValues={editInitialValues}
                onSubmit={handleEditSubmit}
                submitLabel="Update lead"
                loading={editSaving}
              />
            )}
          </Drawer>
        </>
      ) : null}

      <Drawer
        title="Lead details"
        placement="right"
        width={480}
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setViewingLead(null);
        }}
        destroyOnHidden
        styles={{ body: { paddingTop: 16 } }}
      >
        {viewFetching ? (
          <div style={{ padding: 24, textAlign: "center" }}>
            <Spin size="large" tip="Loading…" />
          </div>
        ) : viewingLead ? (
          <div>
            <div className="tl-view-head">
              <div className="pk-pills">
                {viewingLead.status ? (
                  <span className={`pk-pill ${statusTone(viewingLead.status)}`}>{viewingLead.status}</span>
                ) : null}
                {viewingLead.convertedByMarketing ? (
                  <span className="pk-pill is-blue">Converted by Marketing</span>
                ) : null}
              </div>
              <p className="tl-view-budget">{formatAmountINR(viewingLead.estimatedBudget)}</p>
              <p className="tl-view-sub">Estimated budget</p>
            </div>

            <dl className="tl-details">
              {detail("Assigned to", getPersonDisplayName(viewingLead.assignedTo) || "—")}
              {detail("Dates", `${formatDateDisplay(viewingLead.startDate)} to ${formatDateDisplay(viewingLead.endDate)}`)}
              {detail("Client details", viewingLead.clientDetails || "—", true)}
              {detail("Event type details", viewingLead.eventTypeDetails || "—", true)}
              {detail("Notes", viewingLead.notes || "—", true)}
            </dl>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default ViewLeads;
