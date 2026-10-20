import React, { useEffect, useState, useCallback } from "react";
import { message, Table, Typography, Select, Popconfirm } from "antd";
import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import axiosClient from "@/api/axiosClient";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  CLIENT_BOOKINGS_LIST_TAB_API_STATUS,
} from "../Accounts/clientBookings/clientBookingsUtils";
import BudgetReportListCell from "../Accounts/budgetreport/BudgetReportListCell";
import { getEffectiveCutoffDate } from "../../utils/dataCutoff";
import { CalendarDays, Eye, Heart, Pencil, Phone, Plus, Trash2, Users, X } from "lucide-react";
import { PageHero, Segmented } from "@/Components/PageKit";
import EventDetailsDrawer from "../Accounts/clientBookings/EventDetailsDrawer";
import "../Accounts/clientBookings/Bookings.css";

const { Title, Text } = Typography;

const ViewInflow = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [listStatusTab, setListStatusTab] = useState("inprogress");
  const [eventsScope, setEventsScope] = useState("mine"); // mine => /events/my-events, all => /events
  const [filterEventName, setFilterEventName] = useState(undefined);
  const [eventNameOptions, setEventNameOptions] = useState([]);
  const [mineSummary, setMineSummary] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const user = useSelector((state) => state.user.value);

  const fetchRequirementsData = useCallback(async () => {
    setLoading(true);
    const config = { headers: { Authorization: user?.access_token } };
    try {
      const statusParam = CLIENT_BOOKINGS_LIST_TAB_API_STATUS[listStatusTab];
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        // Default to the data-visibility cutoff — a real, server-filtered
        // query. See src/utils/dataCutoff.js.
        startDate: getEffectiveCutoffDate(user),
        ...(statusParam ? { status: statusParam } : {}),
        ...(filterEventName ? { eventName: filterEventName } : {}),
      };

      const endpoint =
        eventsScope === "all"
          ? `events`
          : `events/my-events`;

      // IMPORTANT: axiosClient.get(url, config) where `config.params` carries query params
      const res = await axiosClient.get(endpoint, { ...config, params });

      const events = Array.isArray(res.data?.events)
        ? res.data.events
        : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
            ? res.data
            : [];

      setBookings(events);

      // If already using `events` endpoint (All scope), derive dropdown options from this response.
      // When using Mine scope, we fetch dropdown options separately (see `fetchEventNameOptions`).
      if (eventsScope === "all") {
        const uniqueNames = new Set();
        (Array.isArray(events) ? events : []).forEach((ev) => {
          const name =
            typeof ev.eventName === "string"
              ? ev.eventName
              : ev.eventName?.name || "N/A";
          if (name && name !== "N/A") uniqueNames.add(name);
        });
        if (filterEventName) uniqueNames.add(filterEventName);
        setEventNameOptions(
          Array.from(uniqueNames)
            .sort((a, b) => String(a).localeCompare(String(b)))
            .map((n) => ({ label: n, value: n })),
        );
      }

      setPagination((prev) => ({
        ...prev,
        current: res.data.currentPage || res.data.page || pagination.current,
        pageSize: res.data.limit || res.data.pageSize || pagination.pageSize,
        total: res.data.total || res.data.totalEvents || 0,
      }));

      // Only `/events/my-events` returns `summary` (as per your example)
      if (eventsScope === "mine") {
        setMineSummary(res.data?.summary || null);
      } else {
        setMineSummary(null);
      }
    } catch (err) {
      message.error("Failed to fetch client bookings");
      console.error(err);
      setMineSummary(null);
    } finally {
      setLoading(false);
    }
  }, [
    user?.access_token,
    pagination.current,
    pagination.pageSize,
    listStatusTab,
    eventsScope,
    filterEventName,
  ]);

  useEffect(() => {
    fetchRequirementsData();
  }, [fetchRequirementsData]);

  const handleTableChange = (paginationConfig) => {
    setPagination((prev) => ({
      ...prev,
      current: paginationConfig.current,
      pageSize: paginationConfig.pageSize,
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Helper function to get event name as string
  const getEventName = (eventName) => {
    if (typeof eventName === "string") return eventName;
    return eventName?.name || "N/A";
  };

  const fetchEventNameOptions = useCallback(async () => {
    try {
      if (eventsScope === "all") return;

      const statusParam = CLIENT_BOOKINGS_LIST_TAB_API_STATUS[listStatusTab];
      const config = { headers: { Authorization: user?.access_token } };

      // Like list view: pull event names from `events` endpoint (not `my-events`)
      const res = await axiosClient.get(`events`, {
        ...config,
        params: {
          page: 1,
          limit: 200,
          ...(statusParam ? { status: statusParam } : {}),
        },
      });

      const events = Array.isArray(res.data?.events)
        ? res.data.events
        : res.data?.data;

      const uniqueNames = new Set();
      (Array.isArray(events) ? events : []).forEach((ev) => {
        const name = getEventName(ev.eventName);
        if (name && name !== "N/A") uniqueNames.add(name);
      });

      if (filterEventName) uniqueNames.add(filterEventName);

      setEventNameOptions(
        Array.from(uniqueNames)
          .sort((a, b) => String(a).localeCompare(String(b)))
          .map((n) => ({ label: n, value: n })),
      );
    } catch (err) {
      // Dropdown is optional; keep UI usable even if this fails.
      console.error(err);
    }
  }, [user?.access_token, listStatusTab, filterEventName, eventsScope]);

  useEffect(() => {
    fetchEventNameOptions();
  }, [fetchEventNameOptions]);

  // Helper function to check if Wedding with complete advancePaymentType
  const isCompletePaymentWedding = (record) => {
    const eventNameStr = getEventName(record.eventName);
    return (
      eventNameStr === "Wedding" && record.advancePaymentType === "complete"
    );
  };

  // Calculate total agreed amount for a booking (for display purposes)
  const getTotalAgreedAmount = (record) => {
    if (isCompletePaymentWedding(record)) {
      // Complete wedding: use only first event type (represents whole package)
      return record.eventTypes?.[0]?.agreedAmount || 0;
    } else {
      // Other events: sum all event types
      return record.eventTypes.reduce(
        (sum, et) => sum + (et.agreedAmount || 0),
        0,
      );
    }
  };

  // Calculate total expected advances
  const getTotalExpectedAdvances = (record) => {
    if (isCompletePaymentWedding(record)) {
      // Same advance schedule is copied onto each ceremony — count once.
      const byKey = new Map();
      (record.eventTypes || []).forEach((et) => {
        (et.advances || []).forEach((adv, idx) => {
          const key =
            adv?.advanceNumber != null && adv.advanceNumber !== ""
              ? `n:${adv.advanceNumber}`
              : `i:${idx}`;
          const amt = Number(adv?.expectedAmount);
          const value = Number.isFinite(amt) ? amt : 0;
          const prev = byKey.get(key) ?? 0;
          if (value > prev) byKey.set(key, value);
        });
      });
      let total = 0;
      for (const value of byKey.values()) total += value;
      return total;
    }
    let total = 0;
    record.eventTypes?.forEach((et) => {
      et.advances?.forEach((adv) => {
        total += adv.expectedAmount || 0;
      });
    });
    return total;
  };

  // Calculate total received advances (sum of receivedAmount on advance entries)
  const getTotalReceivedAdvances = (record) => {
    if (isCompletePaymentWedding(record)) {
      // Deduplicate by advanceNumber so copied ceremonies do not double-count,
      // while still counting a receipt saved only on a non-first event type.
      const byKey = new Map();
      (record.eventTypes || []).forEach((et) => {
        (et.advances || []).forEach((adv, idx) => {
          const key =
            adv?.advanceNumber != null && adv.advanceNumber !== ""
              ? `n:${adv.advanceNumber}`
              : `i:${idx}`;
          const amt = Number(adv?.receivedAmount);
          const value = Number.isFinite(amt) ? amt : 0;
          const prev = byKey.get(key) ?? 0;
          if (value > prev) byKey.set(key, value);
        });
      });
      let total = 0;
      for (const value of byKey.values()) total += value;
      return total;
    }
    let total = 0;
    record.eventTypes?.forEach((et) => {
      et.advances?.forEach((adv) => {
        total += adv.receivedAmount || 0;
      });
    });
    return total;
  };

  /**
   * Complete weddings must not use advanceTotals.totalReceivedAmount — backend
   * currently sums all eventTypes and double-counts shared advances.
   */
  const getTotalReceivedAmount = (record) => {
    if (isCompletePaymentWedding(record)) {
      return getTotalReceivedAdvances(record);
    }
    return (
      record?.advanceTotals?.totalReceivedAmount ??
      getTotalReceivedAdvances(record)
    );
  };

  /** Balance still owed = agreed amount − received amount (never negative). */
  const getBalanceAmount = (record) => {
    const agreed = getTotalAgreedAmount(record);
    const received = getTotalReceivedAmount(record);
    return Math.max(0, agreed - received);
  };

  const showEventDetailsDrawer = (record) => {
    setSelectedEvent(record);
    setDrawerVisible(true);
  };

  const handleDelete = async (record) => {
    try {
      const config = { headers: { Authorization: user?.access_token } };
      await axiosClient.delete(`events/${record._id}`, config);
      message.success("Booking deleted successfully");
      fetchRequirementsData();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete booking");
      console.error(err);
    }
  };

  const CONFIRMATION_TONE = {
    "Confirmed Event": "",
    "In Progress": "is-gold",
    InProgress: "is-gold",
    "Almost Booked": "is-blue",
    Cancelled: "is-red",
  };

  const columns = [
    {
      title: "Booked by",
      key: "bookedBy",
      width: 130,
      render: (_, record) => {
        const bookedByFirst =
          record?.bookedBy?.first_name ?? record?.bookedBy?.firstName ?? null;
        const createdByFirst =
          record?.createdBy?.first_name ?? record?.createdBy?.firstName ?? null;

        const raw = bookedByFirst ?? createdByFirst;
        const firstName =
          typeof raw === "string" ? raw.trim().split(/\s+/)[0] : null;

        return <strong style={{ fontWeight: 600 }}>{firstName || "-"}</strong>;
      },
    },
    {
      title: "Status",
      dataIndex: "eventConfirmation",
      key: "eventConfirmation",
      width: 150,
      render: (status) => (
        <span className={`pk-pill ${CONFIRMATION_TONE[status] ?? "is-gold"}`}>
          {status || "Pending"}
        </span>
      ),
    },
    {
      title: "Event",
      dataIndex: "eventName",
      key: "eventName",
      width: 140,
      render: (text) => {
        // Handle both string and object cases
        const eventNameStr =
          typeof text === "string" ? text : text?.name || text?.id || "N/A";
        return <span className="bk-event">{eventNameStr}</span>;
      },
    },
    {
      title: "Note",
      key: "note",
      width: 200,
      render: (_, record) => (
        <span className={`bk-wrap${record.note ? "" : " pk-muted"}`}>
          {record.note ? record.note : "N/A"}
        </span>
      ),
    },
    ...(["inprogress", "almostbooked", "cancelled"].includes(listStatusTab)
      ? [
          {
            title: "Next meeting",
            key: "meetingDate",
            width: 170,
            render: (_, record) =>
              record.meetingDate ? (
                <span className="bk-line">
                  <CalendarDays size={14} aria-hidden="true" /> {formatDate(record.meetingDate)}
                </span>
              ) : (
                <span className="pk-muted">Not set</span>
              ),
          },
        ]
      : []),
    {
      title: "Client",
      key: "clientDetails",
      width: 220,
      render: (_, record) => (
        <div className="pk-who bk-client">
          <span className="pk-avatar is-soft" aria-hidden="true">
            {String(record.clientName || "?").trim().charAt(0).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <strong className="bk-wrap">{record.clientName}</strong>
            {record.brideName && record.groomName && (
              <span className="bk-wrap bk-heart">
                <Heart size={12} aria-hidden="true" /> {record.brideName} &amp; {record.groomName}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 150,
      render: (_, record) => (
        <div className="bk-stack">
          <span className="bk-line">
            <Phone size={13} aria-hidden="true" /> {record.contactNumber}
          </span>
          {record.altContactNumber && record.altContactNumber !== record.contactNumber && (
            <span className="bk-line is-muted">
              <Phone size={13} aria-hidden="true" /> {record.altContactNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      title: "Leads",
      key: "leads",
      width: 150,
      render: (_, record) => (
        <div className="bk-stack">
          {record.lead1 && (
            <span className="bk-line">
              <Users size={13} aria-hidden="true" />
              {typeof record.lead1 === "string" ? record.lead1 : record.lead1?.name || "N/A"}
            </span>
          )}
          {record.lead2 && (
            <span className="bk-line">
              <Users size={13} aria-hidden="true" />
              {typeof record.lead2 === "string" ? record.lead2 : record.lead2?.name || "N/A"}
            </span>
          )}
          {!record.lead1 && !record.lead2 && <span className="pk-muted">No leads</span>}
        </div>
      ),
    },
    {
      title: "Agreed amount",
      key: "agreedAmount",
      width: 140,
      align: "right",
      render: (_, record) => (
        <span className="pk-money">{formatAmount(getTotalAgreedAmount(record))}</span>
      ),
    },
    {
      title: "Payment",
      key: "paymentStatus",
      width: 200,
      render: (_, record) => {
        const agreed = getTotalAgreedAmount(record);
        const received = getTotalReceivedAmount(record);
        const balance = getBalanceAmount(record);
        const percentage =
          agreed > 0 ? Math.min(Math.round((received / agreed) * 100), 100) : 0;

        return (
          <div className="bk-pay">
            <div className="bk-pay-row">
              <span>Received</span>
              <strong className="is-green">{formatAmount(received)}</strong>
            </div>
            <div className="bk-pay-row">
              <span>Balance</span>
              <strong className="is-red">{formatAmount(balance)}</strong>
            </div>
            <div className="bk-bar" aria-hidden="true">
              <i style={{ width: `${percentage}%` }} />
            </div>
            <span className="bk-pay-pct">{percentage}% collected</span>
          </div>
        );
      },
    },
    {
      title: "Budget report",
      key: "budgetReport",
      width: 150,
      align: "center",
      render: (_, record) => (
        <BudgetReportListCell
          record={record}
          getEventName={getEventName}
          accessToken={user?.access_token}
          onAfterMutation={fetchRequirementsData}
        />
      ),
    },
    {
      title: "",
      key: "eventTypes",
      width: 120,
      align: "right",
      render: (_, record) => (
        <button type="button" className="pk-btn" onClick={() => showEventDetailsDrawer(record)}>
          <Eye size={14} aria-hidden="true" /> View ({record.eventTypes?.length || 0})
        </button>
      ),
    },
    ...(eventsScope === "mine"
      ? [
          {
            title: "",
            key: "actions",
            fixed: "right",
            width: 190,
            align: "right",
            render: (_, record) => (
              <div className="pk-actions">
                <button
                  type="button"
                  className="pk-btn is-solid"
                  onClick={() => navigate(`/user/editclient/${record._id}`)}
                >
                  <Pencil size={13} aria-hidden="true" /> Edit
                </button>
                <Popconfirm
                  title="Delete Booking"
                  description="Are you sure you want to delete this booking? This action cannot be reversed."
                  onConfirm={() => handleDelete(record)}
                  onCancel={() => message.info("Delete cancelled")}
                  okText="Yes, Delete"
                  cancelText="No, Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <button type="button" className="pk-btn is-danger" aria-label="Delete booking">
                    <Trash2 size={14} aria-hidden="true" /> Delete
                  </button>
                </Popconfirm>
              </div>
            ),
          },
        ]
      : []),
  ];

  // Summary from `/events/my-events` (Mine scope) — agreed / received / pending
  const pageAgreedSum = bookings.reduce(
    (acc, curr) => acc + getTotalAgreedAmount(curr),
    0,
  );
  const pageReceivedSum = bookings.reduce(
    (acc, curr) => acc + getTotalReceivedAmount(curr),
    0,
  );
  const pageExpectedAdvancePendingSum = bookings.reduce((acc, curr) => {
    const expected = getTotalExpectedAdvances(curr);
    const received = getTotalReceivedAmount(curr);
    return acc + Math.max(0, expected - received);
  }, 0);

  const mineTotalBookings = Number(mineSummary?.totalBookings || 0);
  const mineTotalAgreedAmount =
    mineSummary?.totalAgreedAmount != null
      ? Number(mineSummary.totalAgreedAmount)
      : mineSummary?.totalAgreedSum != null
        ? Number(mineSummary.totalAgreedSum)
        : pageAgreedSum;
  const mineTotalReceivedAmount =
    mineSummary?.totalReceivedAmount != null
      ? Number(mineSummary.totalReceivedAmount)
      : pageReceivedSum;
  const mineTotalPendingAmount = Math.max(
    0,
    mineTotalAgreedAmount - mineTotalReceivedAmount,
  );
  // Expected advance not yet received (advance schedule pending)
  const mineExpectedAdvanceNotReceived =
    mineSummary?.totalPendingAdvance != null
      ? Number(mineSummary.totalPendingAdvance)
      : mineSummary?.totalExpectedAdvance != null
        ? Math.max(
            0,
            Number(mineSummary.totalExpectedAdvance) -
              Number(mineSummary.totalReceivedAmount || 0),
          )
        : pageExpectedAdvancePendingSum;

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Marketing"
          title="Bookings Dashboard"
          subtitle="Your client bookings, their payments and what is still to be collected."
          onBack={() => navigate("/user")}
          backLabel="Back home"
        >
          <button type="button" className="pk-cta" onClick={() => navigate("/user/addclient")}>
            <Plus size={18} strokeWidth={2.4} aria-hidden="true" /> New booking
          </button>
        </PageHero>

        {/* Statistics (Mine only) */}
        {eventsScope === "mine" && mineSummary && (
          <div className="bk-stats">
            <div className="bk-stat-grid">
              <div className="bk-stat">
                <p className="bk-stat-title">Total bookings</p>
                <p className="bk-stat-value">{mineTotalBookings}</p>
                <p className="bk-stat-sub">Bookings matching current filters</p>
              </div>
              <div className="bk-stat">
                <p className="bk-stat-title">Total agreed amount</p>
                <p className="bk-stat-value">{formatAmount(mineTotalAgreedAmount)}</p>
                <p className="bk-stat-sub">Sum of agreed amounts for filtered bookings</p>
              </div>
              <div className="bk-stat">
                <p className="bk-stat-title">Received amount</p>
                <p className="bk-stat-value">{formatAmount(mineTotalReceivedAmount)}</p>
                <p className="bk-stat-sub">Amount received so far</p>
              </div>
              <div className="bk-stat is-grey">
                <p className="bk-stat-title">Expected advance</p>
                <p className="bk-stat-value">{formatAmount(mineExpectedAdvanceNotReceived)}</p>
                <p className="bk-stat-sub">Expected advance not yet received</p>
              </div>
              <div className="bk-stat is-gold">
                <p className="bk-stat-title">Pending amount</p>
                <p className="bk-stat-value">{formatAmount(mineTotalPendingAmount)}</p>
                <p className="bk-stat-sub">Agreed amount − received amount</p>
              </div>
            </div>
          </div>
        )}

        <section className="pk-panel">
          <div className="pk-toolbar">
            <div className="pk-toolbar-left">
              <Segmented
                label="Booking status"
                value={listStatusTab}
                onChange={(key) => {
                  setListStatusTab(key);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                options={[
                  { value: "inprogress", label: "In progress", count: listStatusTab === "inprogress" ? bookings.length : undefined },
                  { value: "almostbooked", label: "Almost booked", count: listStatusTab === "almostbooked" ? bookings.length : undefined },
                  { value: "confirmed", label: "Confirmed", count: listStatusTab === "confirmed" ? bookings.length : undefined },
                  { value: "cancelled", label: "Cancelled", count: listStatusTab === "cancelled" ? bookings.length : undefined },
                ]}
              />
            </div>
            <div className="pk-toolbar-right">
              <span className="bk-scope-label">Show</span>
              <Segmented
                label="Scope"
                value={eventsScope}
                onChange={(value) => {
                  setEventsScope(value);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                options={[
                  { value: "mine", label: "Mine" },
                  { value: "all", label: "All" },
                ]}
              />
            </div>
          </div>

          <div className="bk-filters bk-filters-flat">
            <div className="bk-field">
              <label>Event name</label>
              <Select
                allowClear
                placeholder="All events"
                value={filterEventName ?? undefined}
                onChange={(value) => {
                  setFilterEventName(value);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                options={eventNameOptions}
                style={{ width: "100%" }}
                size="large"
              />
            </div>
            <button
              type="button"
              className="pk-btn bk-clear"
              disabled={!filterEventName}
              onClick={() => {
                setFilterEventName(undefined);
                setPagination((p) => ({ ...p, current: 1 }));
              }}
            >
              <X size={14} aria-hidden="true" /> Clear
            </button>
          </div>

          <Table
            columns={columns}
            dataSource={bookings}
            loading={loading}
            rowKey="_id"
            pagination={{
              ...pagination,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} bookings`,
              pageSizeOptions: ["10", "20", "50"],
            }}
            onChange={handleTableChange}
            scroll={{ x: 1650 }}
            className="pk-table bk-table"
          />
        </section>
      </div>

      <EventDetailsDrawer
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        event={selectedEvent}
        balanceBasis="agreed"
        amountsRule="always-or-positive"
      />
    </div>
  );
};

export default ViewInflow;
