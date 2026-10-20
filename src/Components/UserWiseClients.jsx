import React, { useEffect, useState, useCallback } from "react";
import { Trophy, Users, Award, Medal, X, Calendar, DollarSign, TrendingUp } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { message, Drawer, Typography, Table, DatePicker } from "antd";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { PageHero, Segmented } from "@/Components/PageKit";
import "./UserWiseClients.css";

const { Text, Title } = Typography;

/**
 * Events leaderboard.
 * @param {boolean} mostBookedOnly — when true, only show "Most Booked" (HR DEPARTMENT).
 *   Default false keeps both tabs for Accounts / others.
 */
const UserWiseClients = ({ mostBookedOnly = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const showBackToHome = location.pathname === "/user/leaderboard";
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserEvents, setSelectedUserEvents] = useState([]);
  const [activeTab, setActiveTab] = useState("mostBooked");
  const [selectedMonthYear, setSelectedMonthYear] = useState(null); // null = All time; dayjs = that month
  const [mostBookedRows, setMostBookedRows] = useState([]);
  const [mostAmountRows, setMostAmountRows] = useState([]);
  const [mostBookedMeta, setMostBookedMeta] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalUsers: 0,
  });
  const [mostAmountMeta, setMostAmountMeta] = useState({
    page: 1,
    limit: 20,
    totalPages: 1,
    totalUsers: 0,
  });
  const user = useSelector((state) => state.user.value);

  useEffect(() => {
    if (mostBookedOnly && activeTab !== "mostBooked") {
      setActiveTab("mostBooked");
    }
  }, [mostBookedOnly, activeTab]);

  const fetchLeaderboard = useCallback(
    async ({ mode, page, limit, month }) => {
      if (!user?.access_token) {
        message.error("Authentication required. Please login again.");
        return;
      }

      setLoading(true);
      try {
        const params = {
          mode,
          page,
          limit,
        };
        if (month) params.month = month;

        const res = await axiosClient.get(
          `events/leaderboard`,
          {
            headers: { Authorization: user.access_token },
            params,
          },
        );

        const d = res.data || {};
        const leaderboard = Array.isArray(d.leaderboard)
          ? d.leaderboard
          : [];

        const totalPages = d.totalPages ?? 1;
        const totalUsers = d.totalUsers ?? 0;

        if (mode === "mostBooked") {
          setMostBookedRows(leaderboard);
          setMostBookedMeta({
            page: d.page ?? page,
            limit: d.limit ?? limit,
            totalPages,
            totalUsers,
          });
        } else {
          setMostAmountRows(leaderboard);
          setMostAmountMeta({
            page: d.page ?? page,
            limit: d.limit ?? limit,
            totalPages,
            totalUsers,
          });
        }

        if (leaderboard.length === 0) {
          message.info("No leaderboard data found");
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        message.error(
          err?.response?.data?.message ||
            "Failed to fetch leaderboard. Please try again later.",
        );
        if (mode === "mostBooked") setMostBookedRows([]);
        else setMostAmountRows([]);
      } finally {
        setLoading(false);
      }
    },
    [user?.access_token],
  );

  const fetchActiveLeaderboard = useCallback(() => {
    const month = selectedMonthYear ? selectedMonthYear.format("YYYY-MM") : null;
    if (mostBookedOnly || activeTab === "mostBooked") {
      fetchLeaderboard({
        mode: "mostBooked",
        page: mostBookedMeta.page,
        limit: mostBookedMeta.limit,
        month,
      });
    } else {
      fetchLeaderboard({
        mode: "mostAmount",
        page: mostAmountMeta.page,
        limit: mostAmountMeta.limit,
        month,
      });
    }
  }, [
    activeTab,
    fetchLeaderboard,
    mostBookedOnly,
    mostAmountMeta.limit,
    mostAmountMeta.page,
    mostBookedMeta.limit,
    mostBookedMeta.page,
    selectedMonthYear,
  ]);

  useEffect(() => {
    fetchActiveLeaderboard();
  }, [fetchActiveLeaderboard]);

  const formatText = (v) => {
    try {
      if (v === null || v === undefined) return "";
      if (typeof v === "string" || typeof v === "number") return String(v);
      if (Array.isArray(v)) return v.map((x) => formatText(x)).join(", ");
      if (typeof v === "object") {
        if (v.name) return String(v.name);
        if (v.title) return String(v.title);
        if (v.label) return String(v.label);
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      }
      return String(v);
    } catch {
      return "";
    }
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  /** Capitalize first letter (e.g. "archana" → "Archana"). */
  const capitalizeFirstLetter = (value) => {
    if (value == null) return "";
    const s = String(value).trim();
    if (!s) return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const getEventName = (eventName) => {
    if (typeof eventName === "string") return eventName;
    return eventName?.name || "N/A";
  };

  const handleUserClick = (row) => {
    // API returns different shapes per mode; normalize what the drawer expects.
    if (activeTab === "mostBooked") {
      const first = row?.user?.first_name || row?.user?.firstName || "";
      const last = row?.user?.last_name || row?.user?.lastName || "";
      setSelectedUser({
        ...(row?.user || {}),
        fullName: `${capitalizeFirstLetter(first)} ${capitalizeFirstLetter(last)}`.trim(),
        inProgress: row?.inProgress ?? 0,
        confirmed: row?.confirmed ?? 0,
        almostBooked: row?.almostBooked ?? 0,
        cancelled: row?.cancelled ?? 0,
        total: row?.total ?? 0,
      });
      setSelectedUserEvents([]);
    } else {
      const first = row?.user?.first_name || row?.user?.firstName || "";
      const last = row?.user?.last_name || row?.user?.lastName || "";
      setSelectedUser({
        ...(row?.user || {}),
        fullName: `${capitalizeFirstLetter(first)} ${capitalizeFirstLetter(last)}`.trim(),
        totalAmount: row?.totalAmountBooked ?? row?.totalAmount ?? 0,
      });
      setSelectedUserEvents(Array.isArray(row?.events) ? row.events : []);
    }
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedUser(null);
    setSelectedUserEvents([]);
  };

  const userStatsMostBooked = mostBookedRows;
  const userStatsMostAmount = mostAmountRows;

  const personName = (record) => {
    const first = capitalizeFirstLetter(record?.user?.first_name || record?.user?.firstName || "");
    const last = capitalizeFirstLetter(record?.user?.last_name || record?.user?.lastName || "");
    return { first: first || "-", last, full: `${first} ${last}`.trim() || "-" };
  };

  const rankBadge = (index) =>
    index < 3 ? (
      <span className={`lb-rank is-${index + 1}`} title={`Top ${index + 1}`}>
        {index === 0 ? <Trophy size={16} /> : index === 1 ? <Medal size={16} /> : <Award size={16} />}
      </span>
    ) : (
      <span className="lb-rank">{index + 1}</span>
    );

  const personCell = (record) => {
    const n = personName(record);
    return (
      <div className="pk-who">
        <span className="pk-avatar" aria-hidden="true">
          {n.first.charAt(0).toUpperCase()}
        </span>
        <div style={{ minWidth: 0 }}>
          <strong>{n.first}</strong>
          {n.last ? <span>{n.last}</span> : null}
        </div>
      </div>
    );
  };

  const mostBookedColumns = [
    {
      title: "Rank",
      key: "rank",
      width: 90,
      render: (_, __, index) => rankBadge(index),
    },
    {
      title: "User",
      key: "userName",
      render: (_, record) => personCell(record),
    },
    {
      title: "In progress",
      key: "inProgress",
      align: "center",
      width: 120,
      render: (_, record) => <span className="pk-pill is-gold">{record.inProgress}</span>,
    },
    {
      title: "Almost booked",
      key: "almostBooked",
      align: "center",
      width: 130,
      render: (_, record) => <span className="pk-pill is-blue">{record.almostBooked ?? 0}</span>,
    },
    {
      title: "Confirmed",
      key: "confirmed",
      align: "center",
      width: 120,
      render: (_, record) => <span className="pk-pill">{record.confirmed}</span>,
    },
    {
      title: "Cancelled",
      key: "cancelled",
      align: "center",
      width: 120,
      render: (_, record) => <span className="pk-pill is-red">{record.cancelled}</span>,
    },
    {
      title: "Total booked",
      key: "total",
      align: "center",
      width: 130,
      render: (_, record) => <span className="lb-total">{record.total}</span>,
    },
    {
      title: "",
      key: "action",
      align: "right",
      width: 150,
      render: (_, record) => (
        <button type="button" className="pk-btn is-solid" onClick={() => handleUserClick(record)}>
          <Calendar size={14} aria-hidden="true" /> View details
        </button>
      ),
    },
  ];

  const mostAmountColumns = [
    {
      title: "Rank",
      key: "rank",
      width: 90,
      render: (_, __, index) => rankBadge(index),
    },
    {
      title: "User",
      key: "userName",
      render: (_, record) => personCell(record),
    },
    {
      title: "Total amount",
      key: "totalAmount",
      align: "right",
      width: 190,
      render: (_, record) => (
        <span className="lb-total is-money">
          {formatAmount(record.totalAmountBooked ?? record.totalAmount ?? 0)}
        </span>
      ),
    },
    {
      title: "Events",
      key: "eventsCount",
      align: "center",
      width: 110,
      render: (_, record) => (
        <span className="pk-pill is-blue">{record?.eventsCount ?? record?.events?.length ?? 0}</span>
      ),
    },
    {
      title: "",
      key: "action",
      align: "right",
      width: 150,
      render: (_, record) => (
        <button type="button" className="pk-btn is-solid" onClick={() => handleUserClick(record)}>
          <TrendingUp size={14} aria-hidden="true" /> View details
        </button>
      ),
    },
  ];

  const onBoardChange = (mode, setMeta) => (paginationConfig) => {
    const month = selectedMonthYear ? selectedMonthYear.format("YYYY-MM") : null;
    const page = paginationConfig.current ?? 1;
    const limit = paginationConfig.pageSize ?? 20;
    setMeta((prev) => ({ ...prev, page, limit }));
    fetchLeaderboard({ mode, page, limit, month });
  };

  const isBooked = mostBookedOnly || activeTab === "mostBooked";
  const boardRows = isBooked ? userStatsMostBooked : userStatsMostAmount;
  const boardMeta = isBooked ? mostBookedMeta : mostAmountMeta;
  const podium = boardMeta.page === 1 ? boardRows.slice(0, 3) : [];

  const board = (
    <section className="pk-panel">
      <div className="pk-toolbar">
        <div className="pk-toolbar-left">
          {!mostBookedOnly && (
            <Segmented
              label="Leaderboard"
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: "mostBooked", label: "Most booked" },
                { value: "mostAmount", label: "Most amount booked" },
              ]}
            />
          )}
        </div>
        <div className="pk-toolbar-right">
          <span className="lb-hint">
            {mostBookedOnly ? "Filter by month" : "Month filter applies to both boards"}
          </span>
          <DatePicker
            picker="month"
            value={selectedMonthYear}
            onChange={(date) => setSelectedMonthYear(date || null)}
            allowClear
            placeholder="All time"
            format="MMM YYYY"
            size="large"
            style={{ minWidth: 150 }}
          />
        </div>
      </div>

      {podium.length > 0 && (
        <div className="lb-podium">
          {podium.map((row, i) => (
            <div key={row?.user?._id || row?.user?.id || i} className={`lb-top is-${i + 1}`}>
              {rankBadge(i)}
              <div className="lb-top-name">{personName(row).full}</div>
              <div className="lb-top-value">
                {isBooked
                  ? `${row.total} bookings`
                  : formatAmount(row.totalAmountBooked ?? row.totalAmount ?? 0)}
              </div>
            </div>
          ))}
        </div>
      )}

      {boardRows.length === 0 && !loading ? (
        <div className="pk-empty">
          <span className="ring">
            {isBooked ? <Users size={26} /> : <DollarSign size={26} />}
          </span>
          <strong>{isBooked ? "No bookings found" : "No confirmed events found"}</strong>
          <span>Try another month or clear the filter.</span>
        </div>
      ) : (
        <Table
          className="pk-table"
          columns={isBooked ? mostBookedColumns : mostAmountColumns}
          dataSource={boardRows}
          loading={loading}
          rowKey={(row) => row?.user?._id || row?.user?.id || row?.rank}
          pagination={{
            current: boardMeta.page,
            pageSize: boardMeta.limit,
            total: boardMeta.totalUsers,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `Total ${total} users`,
          }}
          onChange={
            isBooked
              ? onBoardChange("mostBooked", setMostBookedMeta)
              : onBoardChange("mostAmount", setMostAmountMeta)
          }
          scroll={{ x: 800 }}
        />
      )}
    </section>
  );

  return (
    <div className={showBackToHome ? "pk-page" : "lb-embedded"}>
      <div className="pk-wrap" style={showBackToHome ? undefined : { maxWidth: "none" }}>
        {showBackToHome ? (
          <PageHero
            eyebrow="Bookings"
            title="Events Leaderboard"
            subtitle="Top performers ranked by bookings and revenue."
            onBack={() => navigate("/user")}
          />
        ) : (
          <div className="ck-head">
            <div className="ck-title">
              <span className="ck-title-icon">
                <Trophy size={20} aria-hidden="true" />
              </span>
              <div>
                <h2>Events leaderboard</h2>
                <p>Top performers ranked by bookings and revenue</p>
              </div>
            </div>
          </div>
        )}

        {board}
      </div>

      {/* Drawer for Event Details */}
      <Drawer
        title={
          <div className="pk-who">
            <span className="pk-avatar" aria-hidden="true">
              {String(selectedUser?.fullName || "?").trim().charAt(0).toUpperCase()}
            </span>
            <div style={{ minWidth: 0 }}>
              <strong>{selectedUser?.fullName}</strong>
              <span>
                {activeTab === "mostBooked"
                  ? `${selectedUser?.total || 0} Total Bookings`
                  : `${formatAmount(selectedUser?.totalAmount || 0)} Total`}
              </span>
            </div>
          </div>
        }
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={700}
        closeIcon={<X className="w-5 h-5" />}
      >
        {selectedUserEvents.length === 0 && activeTab !== "mostBooked" ? (
          <div className="pk-empty">
            <span className="ring">
              <Calendar size={26} />
            </span>
            <strong>No events found</strong>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTab === "mostBooked" ? (
              <>
                {/* Summary Cards */}
                <div className="lb-mini">
                  <div className="lb-mini-card is-gold">
                    <span>InProgress</span>
                    <strong>{selectedUser?.inProgress || 0}</strong>
                  </div>
                  <div className="lb-mini-card is-blue">
                    <span>Almost booked</span>
                    <strong>{selectedUser?.almostBooked || 0}</strong>
                  </div>
                  <div className="lb-mini-card">
                    <span>Confirmed</span>
                    <strong>{selectedUser?.confirmed || 0}</strong>
                  </div>
                  <div className="lb-mini-card is-red">
                    <span>Cancelled</span>
                    <strong>{selectedUser?.cancelled || 0}</strong>
                  </div>
                </div>

                {/* Events List */}
                {selectedUserEvents.length === 0 ? (
                  <Text type="secondary">
                    Event list is not included in the API response for Most Booked leaderboard.
                  </Text>
                ) : (
                  <Table
                    className="pk-table"
                    dataSource={selectedUserEvents}
                    rowKey="_id"
                    pagination={false}
                    columns={[
                      {
                        title: "#",
                        key: "index",
                        width: 60,
                        render: (_, __, index) => <span className="pk-pill is-grey">{index + 1}</span>,
                      },
                      {
                        title: "Event",
                        key: "eventName",
                        render: (_, record) => <strong>{getEventName(record.eventName)}</strong>,
                      },
                      {
                        title: "Client",
                        key: "clientName",
                        render: (_, record) => <span>{formatText(record.clientName) || "N/A"}</span>,
                      },
                      {
                        title: "Status",
                        key: "status",
                        width: 130,
                        render: (_, record) => {
                          const status = record.eventConfirmation;
                          const tone =
                            status === "Confirmed Event" ? "" : status === "Cancelled" ? "is-red" : status === "Almost Booked" ? "is-blue" : "is-gold";
                          return <span className={`pk-pill ${tone}`}>{status}</span>;
                        },
                      },
                    ]}
                    size="small"
                  />
                )}
              </>
            ) : (
              <>
                {/* Summary Card */}
                <div className="lb-sum">
                  <span>Total amount booked</span>
                  <strong>{formatAmount(selectedUser?.totalAmount || 0)}</strong>
                  <em>{selectedUserEvents.length} confirmed events</em>
                </div>

                {/* Events Breakdown */}
                <Table
                  className="pk-table"
                  dataSource={selectedUserEvents}
                  rowKey="_id"
                  pagination={false}
                  columns={[
                    {
                      title: "#",
                      key: "index",
                      width: 60,
                      render: (_, __, index) => <span className="pk-pill is-grey">{index + 1}</span>,
                    },
                    {
                      title: "Event",
                      key: "eventName",
                      render: (_, record) => <strong>{getEventName(record.eventName)}</strong>,
                    },
                    {
                      title: "Client",
                      key: "clientName",
                      render: (_, record) => <span>{formatText(record.clientName) || "N/A"}</span>,
                    },
                    {
                      title: "Amount booked",
                      key: "amountBooked",
                      align: "right",
                      width: 160,
                      render: (_, record) => (
                        <span className="pk-money">{formatAmount(record.amountBooked || 0)}</span>
                      ),
                    },
                  ]}
                  size="small"
                />
              </>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default UserWiseClients;
