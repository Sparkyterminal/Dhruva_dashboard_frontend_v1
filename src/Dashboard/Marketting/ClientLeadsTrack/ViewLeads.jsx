import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Table,
  Button,
  Drawer,
  Card,
  Typography,
  Popconfirm,
  message,
  Spin,
  Tabs,
  Select,
  Row,
  Col,
  DatePicker,
  Tag,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  FundOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import AddLeads from "./AddLeads";
import LeadForm, { STATUS_OPTIONS } from "./LeadForm";
import LeadsCalendar from "../../../Components/LeadsCalendar";
import { API_BASE_URL } from "../../../../config";

const { Title, Text } = Typography;
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

/** Get notes display */
function getNotesDisplay(notes) {
  if (!notes) return "—";
  return notes.length > 100 ? `${notes.substring(0, 100)}...` : notes;
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
    return { startDate: null, endDate: null, month: null };
  }, [filterDateRange, filterMonth]);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterAssignedTo) params.assignedTo = filterAssignedTo;
      if (activeDateBounds.startDate && activeDateBounds.endDate) {
        params.startDate = activeDateBounds.startDate;
        params.endDate = activeDateBounds.endDate;
        if (activeDateBounds.month && !filterDateRange) {
          params.month = activeDateBounds.month;
        }
      }
      const res = await axios.get(`${API_BASE_URL}client-leads`, {
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
        const res = await axios.get(`${API_BASE_URL}coordinators`, config);
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
    axios
      .get(`${API_BASE_URL}client-leads/${editingLeadId}`, config)
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
      await axios.put(
        `${API_BASE_URL}client-leads/${editingLeadId}`,
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
    axios
      .get(`${API_BASE_URL}client-leads/${id}`, config)
      .then((res) => {
        const raw = res.data?.data ?? res.data;
        setViewingLead(raw);
      })
      .catch(() => message.error("Failed to load lead."))
      .finally(() => setViewFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config from closure
  };

  const handleDelete = async (record) => {
    const id = record._id ?? record.id;
    if (!id) return;
    try {
      await axios.delete(`${API_BASE_URL}client-leads/${id}`, config);
      message.success("Lead deleted.");
      fetchLeads();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete lead.");
    }
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

  const columns = [
    {
      title: "Sl no",
      key: "slNo",
      width: 70,
      align: "center",
      render: (_, __, index) => index + 1,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status, record) => (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span>{status || "—"}</span>
          {record?.convertedByMarketing ? (
            <Tag color="success" style={{ marginInlineEnd: 0, width: "fit-content" }}>
              Converted
            </Tag>
          ) : null}
        </div>
      ),
    },
    {
      title: "Estimated budget",
      dataIndex: "estimatedBudget",
      key: "estimatedBudget",
      width: 140,
      align: "right",
      render: (v) => (
        <Text strong style={{ color: "#0f172a" }}>
          {formatAmountINR(v)}
        </Text>
      ),
    },
    {
      title: "Client details",
      dataIndex: "clientDetails",
      key: "clientDetails",
      ellipsis: true,
      render: (t) => t || "—",
    },
    {
      title: "Event type details",
      dataIndex: "eventTypeDetails",
      key: "eventTypeDetails",
      ellipsis: true,
      render: (t) => t || "—",
    },
    {
      title: "Start date",
      dataIndex: "startDate",
      key: "startDate",
      width: 120,
      render: (_, record) => formatDateDisplay(record.startDate),
    },
    {
      title: "End date",
      dataIndex: "endDate",
      key: "endDate",
      width: 120,
      render: (_, record) => formatDateDisplay(record.endDate),
    },
    {
      title: "Assign to",
      dataIndex: ["assignedTo", "name"],
      key: "assignedTo",
      width: 140,
      ellipsis: true,
      render: (_, record) => {
        const a = record.assignedTo;
        if (!a) return "—";
        return getPersonDisplayName(a) || "—";
      },
    },
    {
      title: "Notes",
      key: "notes",
      width: 220,
      ellipsis: true,
      render: (_, record) => (
        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {getNotesDisplay(record.notes)}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      width: readOnly ? 90 : 180,
      render: (_, record) => {
        const id = record._id ?? record.id;
        return (
          <>
            <Button
              type="link"
              size="small"
              onClick={() => openViewDrawer(record._id ?? record.id)}
            >
              View
            </Button>
            {!readOnly ? (
              <>
                <Button
                  type="link"
                  size="small"
                  onClick={() => openEditDrawer(id)}
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete this lead?"
                  description="This action cannot be undone."
                  onConfirm={() => handleDelete(record)}
                  okText="Delete"
                  okButtonProps={{ danger: true }}
                  cancelText="Cancel"
                >
                  <Button type="link" size="small" danger>
                    Delete
                  </Button>
                </Popconfirm>
              </>
            ) : null}
          </>
        );
      },
    },
  ];

  const shellStyle = embedded
    ? {
        padding: 0,
        maxWidth: "none",
        margin: 0,
        minHeight: 0,
        background: "transparent",
      }
    : {
        padding: 24,
        maxWidth: 1280,
        margin: "0 auto",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, rgba(239,246,255,0.65) 0%, rgba(245,243,255,0.7) 45%, rgba(253,242,248,0.65) 100%)",
      };

  return (
    <div style={shellStyle}>
      <Card
        variant="borderless"
        style={{
          borderRadius: embedded ? 0 : 20,
          boxShadow: embedded ? "none" : "0 10px 30px rgba(15, 23, 42, 0.08)",
          background: embedded ? "transparent" : "rgba(255, 255, 255, 0.9)",
          backdropFilter: embedded ? "none" : "blur(8px)",
        }}
        styles={{ body: { padding: embedded ? "0 0 8px 0" : "24px 28px" } }}
      >
        {!embedded ? (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/user")}
                style={{ padding: "4px 0" }}
              >
                Back
              </Button>
              <Title level={4} style={{ margin: 0 }}>
                Track Leads
              </Title>
            </div>
            {!readOnly ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  icon={<FileExcelOutlined />}
                  onClick={() => navigate("/user/client-leads/excel")}
                  style={{ borderRadius: 10 }}
                >
                  Excel
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setDrawerOpen(true)}
                  style={{ borderRadius: 10 }}
                >
                  Add leads
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{
                borderRadius: 14,
                background: "linear-gradient(135deg,#eff6ff 0%,#f5f3ff 100%)",
                border: "1px solid #e0e7ff",
              }}
            >
              <Statistic
                title={
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FundOutlined /> Estimated Budget (pipeline)
                  </span>
                }
                value={budgetCards.totalEstimatedBudget}
                formatter={(v) => formatAmountINR(v)}
                suffix={
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    · {budgetCards.estimatedLeadsCount} leads
                  </Text>
                }
              />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card
              size="small"
              style={{
                borderRadius: 14,
                background: "linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 100%)",
                border: "1px solid #bbf7d0",
              }}
            >
              <Statistic
                title={
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircleOutlined /> Successfully Converted Leads
                  </span>
                }
                value={budgetCards.totalConvertedBudget}
                formatter={(v) => formatAmountINR(v)}
                valueStyle={{ color: "#15803d" }}
                suffix={
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    · {budgetCards.convertedLeadsCount} leads
                  </Text>
                }
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 12]} style={{ marginBottom: 20 }} align="bottom">
          <Col xs={24} sm={12} md={8} lg={5}>
            <Text
              strong
              style={{
                display: "block",
                marginBottom: 6,
                color: "#475569",
                fontSize: 13,
              }}
            >
              Status
            </Text>
            <Select
              allowClear
              placeholder="All statuses"
              value={filterStatus}
              onChange={setFilterStatus}
              options={STATUS_OPTIONS}
              style={{ width: "100%" }}
              size="large"
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={5}>
            <Text
              strong
              style={{
                display: "block",
                marginBottom: 6,
                color: "#475569",
                fontSize: 13,
              }}
            >
              Coordinator
            </Text>
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
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Text
              strong
              style={{
                display: "block",
                marginBottom: 6,
                color: "#475569",
                fontSize: 13,
              }}
            >
              Month (by start date)
            </Text>
            <DatePicker
              picker="month"
              value={filterMonth}
              onChange={(m) => {
                setFilterMonth(m);
                if (m) setFilterDateRange(null);
              }}
              style={{ width: "100%" }}
              size="large"
              allowClear
              placeholder="Select month"
            />
          </Col>
          <Col xs={24} sm={12} md={10} lg={6}>
            <Text
              strong
              style={{
                display: "block",
                marginBottom: 6,
                color: "#475569",
                fontSize: 13,
              }}
            >
              Start date range
            </Text>
            <RangePicker
              value={filterDateRange}
              onChange={(r) => {
                setFilterDateRange(r);
                if (r?.[0] && r?.[1]) setFilterMonth(null);
              }}
              format="DD MMM YYYY"
              style={{ width: "100%" }}
              size="large"
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4}>
            <Button size="large" disabled={!hasAnyFilter} onClick={clearFilters}>
              Clear filters
            </Button>
          </Col>
        </Row>

        <Tabs
          activeKey={activeViewTab}
          onChange={setActiveViewTab}
          size="large"
          items={[
            {
              key: "list",
              label: `List View (${leads.length})`,
              children: (
                <Table
                  rowKey={(r) => r._id ?? r.id}
                  columns={columns}
                  dataSource={leads}
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (t) => `${t} leads`,
                  }}
                  scroll={{ x: 1400 }}
                  locale={{
                    emptyText:
                      "No leads yet. Click “Add leads” to create one.",
                  }}
                />
              ),
            },
            {
              key: "calendar",
              label: (
                <span>
                  <CalendarOutlined /> Calendar View
                </span>
              ),
              children: (
                <div
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 14,
                    padding: 14,
                    background: "#ffffff",
                  }}
                >
                  <LeadsCalendar leads={leads} loading={loading} />
                </div>
              ),
            },
          ]}
        />
      </Card>

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
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Status
              </div>
              <div style={{ fontSize: 15, color: "#0f172a" }}>
                {viewingLead.status || "—"}
                {viewingLead.convertedByMarketing ? (
                  <Tag color="success" style={{ marginLeft: 8 }}>
                    Converted by Marketing
                  </Tag>
                ) : null}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Estimated budget
              </div>
              <div style={{ fontSize: 15, color: "#0f172a" }}>
                {formatAmountINR(viewingLead.estimatedBudget)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Assign to
              </div>
              <div style={{ fontSize: 15, color: "#0f172a" }}>
                {getPersonDisplayName(viewingLead.assignedTo) || "—"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Client details
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: "#0f172a",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {viewingLead.clientDetails || "—"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Event type details
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: "#0f172a",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {viewingLead.eventTypeDetails || "—"}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Start date
              </div>
              <div style={{ fontSize: 15, color: "#0f172a" }}>
                {formatDateDisplay(viewingLead.startDate)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                End date
              </div>
              <div style={{ fontSize: 15, color: "#0f172a" }}>
                {formatDateDisplay(viewingLead.endDate)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Notes
              </div>
              <div
                style={{
                  fontSize: 15,
                  color: "#0f172a",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {viewingLead.notes || "—"}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default ViewLeads;
