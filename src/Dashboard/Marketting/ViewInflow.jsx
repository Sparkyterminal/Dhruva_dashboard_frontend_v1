/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useCallback } from "react";
import {
  message,
  Table,
  Button,
  Card,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Drawer,
  Descriptions,
  Divider,
  Badge,
  Statistic,
  Select,
  Radio,
  Grid,
  Tabs,
  Popconfirm,
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  UserOutlined,
  PhoneOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
import { useSelector } from "react-redux";
import { CLIENT_BOOKINGS_LIST_TAB_API_STATUS } from "../Accounts/clientBookings/clientBookingsUtils";
import BudgetReportDrawerSection from "../Accounts/budgetreport/BudgetReportDrawerSection";
import BudgetReportListCell from "../Accounts/budgetreport/BudgetReportListCell";

const { Title, Text } = Typography;

const ViewInflow = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [budgetReportDrawerOpen, setBudgetReportDrawerOpen] = useState(false);
  const [budgetReportDrawerRecord, setBudgetReportDrawerRecord] =
    useState(null);
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
  const screens = Grid.useBreakpoint();
  const statsValueFontSize = screens.xl
    ? 30
    : screens.lg
      ? 26
      : screens.md
        ? 22
        : 18;
  const statsValueCommonStyle = {
    lineHeight: 1.1,
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    whiteSpace: "normal",
  };

  const fetchRequirementsData = useCallback(async () => {
    setLoading(true);
    const config = { headers: { Authorization: user?.access_token } };
    try {
      const statusParam = CLIENT_BOOKINGS_LIST_TAB_API_STATUS[listStatusTab];
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...(statusParam ? { status: statusParam } : {}),
        ...(filterEventName ? { eventName: filterEventName } : {}),
      };

      const endpoint =
        eventsScope === "all"
          ? `${API_BASE_URL}events`
          : `${API_BASE_URL}events/my-events`;

      // IMPORTANT: axios.get(url, config) where `config.params` carries query params
      const res = await axios.get(endpoint, { ...config, params });

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
      const res = await axios.get(`${API_BASE_URL}events`, {
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

  // Helper function to check if should display as single/complete event
  const isSingleDisplayEvent = (record) => {
    const eventNameStr = getEventName(record.eventName);
    // If Wedding with 'complete' advancePaymentType, treat as single event display
    if (
      eventNameStr === "Wedding" &&
      record.advancePaymentType === "complete"
    ) {
      return true;
    }
    // Non-wedding events are always single display
    if (eventNameStr !== "Wedding") {
      return true;
    }
    // Wedding with 'separate' shows each event type separately
    return false;
  };

  // Helper function to check if Wedding with complete advancePaymentType
  const isCompletePaymentWedding = (record) => {
    const eventNameStr = getEventName(record.eventName);
    return (
      eventNameStr === "Wedding" && record.advancePaymentType === "complete"
    );
  };

  // Calculate total payable for a booking
  const getTotalPayable = (record) => {
    if (isCompletePaymentWedding(record)) {
      // Complete wedding: use only first event type (represents whole package)
      return record.eventTypes?.[0]?.totalPayable || 0;
    } else {
      // Other events: sum all event types
      return record.eventTypes.reduce(
        (sum, et) => sum + (et.totalPayable || 0),
        0,
      );
    }
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
    let total = 0;
    if (isCompletePaymentWedding(record)) {
      // Complete wedding: use only first event type advances
      record.eventTypes?.[0]?.advances?.forEach((adv) => {
        total += adv.expectedAmount || 0;
      });
    } else {
      // Other events: sum advances from all event types
      record.eventTypes?.forEach((et) => {
        et.advances?.forEach((adv) => {
          total += adv.expectedAmount || 0;
        });
      });
    }
    return total;
  };

  // Calculate total received advances
  const getTotalReceivedAdvances = (record) => {
    let total = 0;
    if (isCompletePaymentWedding(record)) {
      // Complete wedding: use only first event type advances
      record.eventTypes?.[0]?.advances?.forEach((adv) => {
        total += adv.receivedAmount || 0;
      });
    } else {
      // Other events: sum received advances from all event types
      record.eventTypes?.forEach((et) => {
        et.advances?.forEach((adv) => {
          total += adv.receivedAmount || 0;
        });
      });
    }
    return total;
  };

  const showEventDetailsDrawer = (record) => {
    setSelectedEvent(record);
    setDrawerVisible(true);
  };

  const openBudgetReportDrawer = (record) => {
    setBudgetReportDrawerRecord(record);
    setBudgetReportDrawerOpen(true);
  };

  const closeBudgetReportDrawer = () => {
    setBudgetReportDrawerOpen(false);
    setBudgetReportDrawerRecord(null);
  };

  const handleDelete = async (record) => {
    try {
      const config = { headers: { Authorization: user?.access_token } };
      await axios.delete(`${API_BASE_URL}events/${record._id}`, config);
      message.success("Booking deleted successfully");
      fetchRequirementsData();
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to delete booking");
      console.error(err);
    }
  };

  const columns = [
    {
      title: "Booked By",
      key: "bookedBy",
      width: 160,
      render: (_, record) => {
        const bookedByFirst =
          record?.bookedBy?.first_name ?? record?.bookedBy?.firstName ?? null;
        const createdByFirst =
          record?.createdBy?.first_name ?? record?.createdBy?.firstName ?? null;

        const raw = bookedByFirst ?? createdByFirst;
        const firstName =
          typeof raw === "string" ? raw.trim().split(/\s+/)[0] : null;

        return (
          <Text strong className="text-slate-800">
            {firstName || "-"}
          </Text>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "eventConfirmation",
      key: "eventConfirmation",
      width: 120,
      render: (status) => {
        let color = "default";
        let icon = "⏳";
        if (status === "Confirmed Event") {
          color = "success";
          icon = "✅";
        } else if (status === "In Progress") {
          color = "processing";
          icon = "🔄";
        } else {
          color = "warning";
          icon = "⏳";
        }
        return (
          <Tag
            color={color}
            className="text-xs font-semibold px-2 py-1 break-words whitespace-normal"
          >
            {icon} {status || "Pending"}
          </Tag>
        );
      },
    },
    {
      title: "Event Name",
      dataIndex: "eventName",
      key: "eventName",
      width: 140,
      render: (text) => {
        // Handle both string and object cases
        const eventNameStr =
          typeof text === "string" ? text : text?.name || text?.id || "N/A";
        return (
          <Tag
            color="purple"
            className="text-sm font-semibold px-3 py-1 text-wrap"
          >
            {eventNameStr}
          </Tag>
        );
      },
    },
    {
      title: "Note",
      key: "note",
      width: 120,
      align: "right",
      render: (_, record) => (
        <Text strong className="text-black text-wrap">
          {record.note ? record.note : "N/A"}
        </Text>
      ),
    },
    ...(listStatusTab === "inprogress" || listStatusTab === "cancelled"
      ? [
          {
            title: "Next Meeting Date",
            key: "meetingDate",
            width: 140,
            render: (_, record) => (
              <div className="flex items-center gap-1">
                {/* <CalendarOutlined className="text-blue-500 text-xs" /> */}
                <Text className="text-sm">
                  {record.meetingDate
                    ? formatDate(record.meetingDate)
                    : "Not Set"}
                </Text>
              </div>
            ),
          },
        ]
      : []),
    {
      title: "Client Details",
      key: "clientDetails",
      width: 180,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <UserOutlined className="text-blue-500" />
            <Text strong className="text-base">
              {record.clientName}
            </Text>
          </div>
          {record.brideName && record.groomName && (
            <div className="flex items-center gap-2">
              <HeartOutlined className="text-pink-500" />
              <Text className="text-sm text-gray-600">
                {record.brideName} & {record.groomName}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      width: 130,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <PhoneOutlined className="text-green-500 text-xs" />
            <Text className="text-sm">{record.contactNumber}</Text>
          </div>
          {record.altContactNumber &&
            record.altContactNumber !== record.contactNumber && (
              <div className="flex items-center gap-1">
                <PhoneOutlined className="text-orange-500 text-xs" />
                <Text className="text-sm text-gray-500">
                  {record.altContactNumber}
                </Text>
              </div>
            )}
        </div>
      ),
    },
    {
      title: "Leads",
      key: "leads",
      width: 120,
      render: (_, record) => (
        <div className="space-y-1">
          {record.lead1 && (
            <div className="flex items-center gap-1">
              <TeamOutlined className="text-blue-500 text-xs" />
              <Text className="text-sm">
                {typeof record.lead1 === "string"
                  ? record.lead1
                  : record.lead1?.name || "N/A"}
              </Text>
            </div>
          )}
          {record.lead2 && (
            <div className="flex items-center gap-1">
              <TeamOutlined className="text-purple-500 text-xs" />
              <Text className="text-sm">
                {typeof record.lead2 === "string"
                  ? record.lead2
                  : record.lead2?.name || "N/A"}
              </Text>
            </div>
          )}
          {!record.lead1 && !record.lead2 && (
            <Text className="text-xs text-gray-400">No leads</Text>
          )}
        </div>
      ),
    },
    // {
    //   title: "Total Payable",
    //   key: "totalPayable",
    //   width: 120,
    //   align: "right",
    //   render: (_, record) => (
    //     <Text strong className="text-green-600 text-base">
    //       {formatAmount(getTotalPayable(record))}
    //     </Text>
    //   ),
    // },
    {
      title: "Payment Status",
      key: "paymentStatus",
      width: 150,
      render: (_, record) => {
        const expected = getTotalExpectedAdvances(record);
        const received = getTotalReceivedAdvances(record);
        const percentage =
          expected > 0 ? Math.round((received / expected) * 100) : 0;

        return (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Text className="text-xs text-gray-500">Received:</Text>
              <Text strong className="text-sm text-green-600">
                {formatAmount(received)}
              </Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-xs text-gray-500">Balance:</Text>
              <Text className="text-sm">{formatAmount(expected)}</Text>
            </div>
            <Tag
              color={
                percentage === 100
                  ? "success"
                  : percentage > 0
                    ? "warning"
                    : "default"
              }
            >
              {percentage}% Collected
            </Tag>
          </div>
        );
      },
    },
    {
      title: "Budget Report",
      key: "budgetReport",
      width: 120,
      align: "center",
      render: (_, record) => (
        <BudgetReportListCell
          record={record}
          getEventName={getEventName}
          onView={openBudgetReportDrawer}
          accessToken={user?.access_token}
          onAfterMutation={fetchRequirementsData}
        />
      ),
    },
    {
      title: "Event Types",
      key: "eventTypes",
      width: 110,
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => showEventDetailsDrawer(record)}
          className="bg-gradient-to-r from-blue-500 to-purple-500 border-none"
        >
          View ({record.eventTypes?.length || 0})
        </Button>
      ),
    },
    ...(eventsScope === "mine"
      ? [
          {
            title: "Actions",
            key: "actions",
            fixed: "right",
            width: 160,
            align: "center",
            render: (_, record) => (
              <Space size="small">
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  onClick={() => navigate(`/user/editclient/${record._id}`)}
                  className="border-blue-400 text-blue-600 hover:bg-blue-50"
                  size="small"
                >
                  Edit
                </Button>
                <Popconfirm
                  title="Delete Booking"
                  description="Are you sure you want to delete this booking? This action cannot be reversed."
                  onConfirm={() => handleDelete(record)}
                  onCancel={() => message.info("Delete cancelled")}
                  okText="Yes, Delete"
                  cancelText="No, Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="default"
                    icon={<DeleteOutlined />}
                    danger
                    size="small"
                  >
                    Delete
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  // Calculate statistics
  const totalBookings = bookings.length;
  const totalAgreedRevenue = bookings.reduce(
    (acc, curr) => acc + getTotalAgreedAmount(curr),
    0,
  );
  const totalPayableRevenue = bookings.reduce(
    (acc, curr) => acc + getTotalPayable(curr),
    0,
  );
  const totalReceivedRevenue = bookings.reduce(
    (acc, curr) => acc + getTotalReceivedAdvances(curr),
    0,
  );
  const totalPendingRevenue = bookings.reduce((acc, curr) => {
    const expected = getTotalExpectedAdvances(curr);
    const received = getTotalReceivedAdvances(curr);
    return acc + (expected - received);
  }, 0);
  const totalEventTypes = bookings.reduce(
    (acc, curr) => acc + (curr.eventTypes?.length || 0),
    0,
  );

  // Summary from `/events/my-events` (Mine scope)
  const mineTotalBookings = Number(mineSummary?.totalBookings || 0);
  const mineTotalExpectedAdvance = Number(
    mineSummary?.totalExpectedAdvance || 0,
  );
  const mineTotalReceivedAmount = Number(mineSummary?.totalReceivedAmount || 0);
  const mineTotalPendingAdvance = Number(mineSummary?.totalPendingAdvance || 0);
  const mineTotalPayableSum = Number(mineSummary?.totalPayableSum || 0);

  // Tab items
  const tabItems = [
    {
      key: "inprogress",
      label: (
        <span>
          <ClockCircleOutlined /> InProgress
          {listStatusTab === "inprogress" ? ` (${bookings.length})` : ""}
        </span>
      ),
    },
    {
      key: "confirmed",
      label: (
        <span>
          <CheckCircleOutlined /> Confirmed Event
          {listStatusTab === "confirmed" ? ` (${bookings.length})` : ""}
        </span>
      ),
    },
    {
      key: "cancelled",
      label: (
        <span>
          ❌ Cancelled
          {listStatusTab === "cancelled" ? ` (${bookings.length})` : ""}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl">
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate("/user")}
                size="large"
                className="border-gray-300 hover:border-blue-500 hover:text-blue-500"
              >
                Back Home
              </Button>
            </Col>

            <Col xs={24} sm={8} className="text-center">
              <Title
                level={2}
                className="!mb-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"
              >
                📋 Bookings Dashboard
              </Title>
            </Col>

            <Col xs={24} sm={8} className="text-right">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate("/user/addclient")}
                className="bg-gradient-to-r from-blue-500 to-purple-600 border-none shadow-lg hover:shadow-xl"
              >
                New Booking
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Statistics Cards (Mine only) */}
        {eventsScope === "mine" && mineSummary && (
          <div className="mt-4 w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Card
                className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all h-full"
                style={{
                  background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                  color: "white",
                }}
              >
                <Statistic
                  title={
                    <Text
                      style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}
                    >
                      Total Bookings
                    </Text>
                  }
                  value={mineTotalBookings}
                  prefix="📊"
                  valueStyle={{
                    color: "white",
                    fontSize: statsValueFontSize,
                    fontWeight: "bold",
                    ...statsValueCommonStyle,
                  }}
                />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                  Bookings matching current filters
                </Text>
              </Card>
            </div>
            <div>
              <Card
                className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all h-full"
                style={{
                  background: "linear-gradient(135deg,#10b981,#059669)",
                  color: "white",
                }}
              >
                <Statistic
                  title={
                    <Text
                      style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}
                    >
                      Total Payable
                    </Text>
                  }
                  value={mineTotalPayableSum}
                  prefix="💰"
                  valueStyle={{
                    color: "white",
                    fontSize: statsValueFontSize,
                    fontWeight: "bold",
                    ...statsValueCommonStyle,
                  }}
                  formatter={(value) => formatAmount(value)}
                />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                  Payable sum (from server)
                </Text>
              </Card>
            </div>
            <div>
              <Card
                className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all h-full"
                style={{
                  background: "linear-gradient(135deg,#4f46e5,#4338ca)",
                  color: "white",
                }}
              >
                <Statistic
                  title={
                    <Text
                      style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}
                    >
                      Expected Advance
                    </Text>
                  }
                  value={mineTotalExpectedAdvance}
                  prefix="📈"
                  valueStyle={{
                    color: "white",
                    fontSize: statsValueFontSize,
                    fontWeight: "bold",
                    ...statsValueCommonStyle,
                  }}
                  formatter={(value) => formatAmount(value)}
                />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                  Total advance expected
                </Text>
              </Card>
            </div>

            <div>
              <Card
                className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all h-full"
                style={{
                  background: "linear-gradient(135deg,#22c55e,#16a34a)",
                  color: "white",
                }}
              >
                <Statistic
                  title={
                    <Text
                      style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}
                    >
                      Received Amount
                    </Text>
                  }
                  value={mineTotalReceivedAmount}
                  prefix="✅"
                  valueStyle={{
                    color: "white",
                    fontSize: statsValueFontSize,
                    fontWeight: "bold",
                    ...statsValueCommonStyle,
                  }}
                  formatter={(value) => formatAmount(value)}
                />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                  Amount received so far
                </Text>
              </Card>
            </div>

            <div>
              <Card
                className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all h-full"
                style={{
                  background: "linear-gradient(135deg,#f59e0b,#d97706)",
                  color: "white",
                }}
              >
                <Statistic
                  title={
                    <Text
                      style={{ color: "rgba(255,255,255,0.9)", fontSize: 14 }}
                    >
                      Pending Advance
                    </Text>
                  }
                  value={mineTotalPendingAdvance}
                  prefix="⏳"
                  valueStyle={{
                    color: "white",
                    fontSize: statsValueFontSize,
                    fontWeight: "bold",
                    ...statsValueCommonStyle,
                  }}
                  formatter={(value) => formatAmount(value)}
                />
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                  Advance still pending
                </Text>
              </Card>
            </div>
          </div>
        )}

        {/* Table */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
          <Row gutter={[16, 12]} align="middle" style={{ padding: 16 }}>
            <Col xs={24} sm={12} md={8}>
              <Text strong className="text-slate-700 text-sm block mb-1">
                Event Name
              </Text>
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
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button
                size="large"
                onClick={() => {
                  setFilterEventName(undefined);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
                style={{ marginTop: 30 }}
                disabled={!filterEventName}
              >
                Clear
              </Button>
            </Col>
          </Row>
          <Row
            gutter={[16, 12]}
            align="middle"
            style={{ padding: "0 16px 16px" }}
          >
            <Col xs={24} sm={12} md={6}>
              <Text strong className="text-slate-700 text-sm block mb-1">
                Scope
              </Text>
              <Radio.Group
                value={eventsScope}
                onChange={(e) => {
                  setEventsScope(e.target.value);
                  setPagination((p) => ({ ...p, current: 1 }));
                }}
              >
                <Radio.Button value="mine">Mine</Radio.Button>
                <Radio.Button value="all">All</Radio.Button>
              </Radio.Group>
            </Col>
          </Row>
          <Tabs
            activeKey={listStatusTab}
            onChange={(key) => {
              setListStatusTab(key);
              setPagination((p) => ({ ...p, current: 1 }));
            }}
            items={tabItems}
            size="large"
            className="mb-4"
          />
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
            scroll={{ x: 1320 }}
            className="custom-table"
          />
        </Card>
      </div>

      {/* Event Details Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Event Details - {getEventName(selectedEvent?.eventName)}
            </span>
          </div>
        }
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width="80%"
        placement="right"
        styles={{ body: { padding: 24 } }}
      >
        {selectedEvent && (
          <div className="space-y-6" style={{ paddingRight: 8 }}>
            {/* Client Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <Descriptions column={2} size="small">
                <Descriptions.Item
                  label={<span className="font-semibold">Client Name</span>}
                >
                  <Text strong>{selectedEvent.clientName}</Text>
                </Descriptions.Item>
                {selectedEvent.brideName && selectedEvent.groomName && (
                  <>
                    <Descriptions.Item
                      label={<span className="font-semibold">Bride</span>}
                    >
                      {selectedEvent.brideName}
                    </Descriptions.Item>
                    <Descriptions.Item
                      label={<span className="font-semibold">Groom</span>}
                    >
                      {selectedEvent.groomName}
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item
                  label={<span className="font-semibold">Contact</span>}
                >
                  {selectedEvent.contactNumber}
                </Descriptions.Item>
                {selectedEvent.altContactNumber && (
                  <Descriptions.Item
                    label={<span className="font-semibold">Alt Contact</span>}
                  >
                    {selectedEvent.altContactNumber}
                    {selectedEvent.altContactName && (
                      <Text type="secondary" className="ml-2">
                        ({selectedEvent.altContactName})
                      </Text>
                    )}
                  </Descriptions.Item>
                )}
                {selectedEvent.lead1 && (
                  <Descriptions.Item
                    label={
                      <span className="font-semibold">
                        Project Coordinator 1
                      </span>
                    }
                  >
                    {typeof selectedEvent.lead1 === "string"
                      ? selectedEvent.lead1
                      : selectedEvent.lead1?.name || "N/A"}
                  </Descriptions.Item>
                )}
                {selectedEvent.lead2 && (
                  <Descriptions.Item
                    label={
                      <span className="font-semibold">
                        Project Coordinator 2
                      </span>
                    }
                  >
                    {typeof selectedEvent.lead2 === "string"
                      ? selectedEvent.lead2
                      : selectedEvent.lead2?.name || "N/A"}
                  </Descriptions.Item>
                )}
                {selectedEvent.note && (
                  <Descriptions.Item
                    label={<span className="font-semibold">Note</span>}
                    span={2}
                  >
                    <Text>{selectedEvent.note}</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Check event type and render accordingly */}
            {isSingleDisplayEvent(selectedEvent) && (
              // Single display mode: Wedding with 'complete' OR Non-wedding events
              <>
                {/* For complete wedding: Show all event details first, then complete package card */}
                {isCompletePaymentWedding(selectedEvent) && (
                  <>
                    {/* Show each event type's details */}
                    {selectedEvent.eventTypes?.map((eventType, index) => {
                      const eventTypeName = !eventType.eventType
                        ? "Main Event"
                        : typeof eventType.eventType === "string"
                          ? eventType.eventType
                          : eventType.eventType?.name || "N/A";
                      return (
                        <Card
                          key={index}
                          className="border-2 border-green-200 hover:border-green-400 transition-all mb-4"
                          title={
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-green-700">
                                {eventTypeName}
                              </span>
                              <Tag color="green" className="text-sm">
                                Event {index + 1}
                              </Tag>
                            </div>
                          }
                        >
                          <div className="space-y-4">
                            {/* Event Details */}
                            <Row gutter={[16, 16]}>
                              <Col span={8}>
                                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                  <CalendarOutlined className="text-blue-600 text-lg" />
                                  <div>
                                    <Text className="text-xs text-gray-500 block">
                                      Start Date
                                    </Text>
                                    <Text strong>
                                      {formatDate(eventType.startDate)}
                                    </Text>
                                  </div>
                                </div>
                              </Col>
                              <Col span={8}>
                                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                                  <CalendarOutlined className="text-purple-600 text-lg" />
                                  <div>
                                    <Text className="text-xs text-gray-500 block">
                                      End Date
                                    </Text>
                                    <Text strong>
                                      {formatDate(eventType.endDate)}
                                    </Text>
                                  </div>
                                </div>
                              </Col>
                              <Col span={8}>
                                <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                                  <EnvironmentOutlined className="text-pink-600 text-lg" />
                                  <div>
                                    <Text className="text-xs text-gray-500 block">
                                      Venue
                                    </Text>
                                    <Text strong>
                                      {eventType.venueLocation?.name ||
                                        eventType.venueLocation ||
                                        "-"}
                                    </Text>
                                  </div>
                                </div>
                              </Col>
                              {eventType.subVenueLocation && (
                                <Col span={8}>
                                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                                    <EnvironmentOutlined className="text-orange-600 text-lg" />
                                    <div>
                                      <Text className="text-xs text-gray-500 block">
                                        Sub Venue
                                      </Text>
                                      <Text strong>
                                        {eventType.subVenueLocation?.name ||
                                          eventType.subVenueLocation ||
                                          "-"}
                                      </Text>
                                    </div>
                                  </div>
                                </Col>
                              )}
                              {eventType.coordinator && (
                                <Col span={8}>
                                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                    <UserOutlined className="text-green-600 text-lg" />
                                    <div>
                                      <Text className="text-xs text-gray-500 block">
                                        Event Coordinator
                                      </Text>
                                      <Text strong>
                                        {eventType.coordinator?.name ||
                                          eventType.coordinator ||
                                          "-"}
                                      </Text>
                                    </div>
                                  </div>
                                </Col>
                              )}
                            </Row>
                          </div>
                        </Card>
                      );
                    })}

                    {/* Complete Package Card with Amounts and Advances */}
                    <Card
                      className="border-2 border-blue-200 hover:border-blue-400 transition-all"
                      title={
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-700">
                            Complete Package
                          </span>
                        </div>
                      }
                    >
                      <div className="space-y-4">
                        {/* Amount breakdown for first event type */}
                        {selectedEvent.eventTypes?.[0] && (
                          <>
                            <Divider className="my-2">Amount Breakdown</Divider>
                            <Row gutter={[12, 12]}>
                              <Col span={12}>
                                <div className="p-2 bg-green-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Agreed Amount
                                  </Text>
                                  <Text strong className="text-green-700">
                                    {formatAmount(
                                      selectedEvent.eventTypes[0]
                                        .agreedAmount || 0,
                                    )}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-blue-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Account Amount
                                  </Text>
                                  <Text strong className="text-blue-700">
                                    {formatAmount(
                                      selectedEvent.eventTypes[0]
                                        .accountAmount || 0,
                                    )}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-purple-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    GST (18%)
                                  </Text>
                                  <Text strong className="text-purple-700">
                                    {formatAmount(
                                      selectedEvent.eventTypes[0].accountGst ||
                                        0,
                                    )}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-pink-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Account + GST
                                  </Text>
                                  <Text strong className="text-pink-700">
                                    {formatAmount(
                                      selectedEvent.eventTypes[0]
                                        .accountAmountWithGst || 0,
                                    )}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-yellow-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Cash Amount
                                  </Text>
                                  <Text strong className="text-yellow-700">
                                    {formatAmount(
                                      selectedEvent.eventTypes[0].cashAmount ||
                                        0,
                                    )}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-emerald-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Total Payable
                                  </Text>
                                  <Text strong className="text-emerald-700">
                                    {formatAmount(
                                      selectedEvent.eventTypes[0]
                                        .totalPayable || 0,
                                    )}
                                  </Text>
                                </div>
                              </Col>
                            </Row>

                            <Divider className="my-2">Advance Payments</Divider>

                            {/* Advances from first event type */}
                            {selectedEvent.eventTypes[0].advances &&
                            selectedEvent.eventTypes[0].advances.length > 0 ? (
                              selectedEvent.eventTypes[0].advances.map(
                                (advance, advIndex) => (
                                  <Card
                                    key={advIndex}
                                    size="small"
                                    className="bg-gray-50 border border-gray-200"
                                    title={
                                      <div className="flex items-center justify-between">
                                        <span className="font-semibold">
                                          Advance #{advance.advanceNumber}
                                        </span>
                                        {advance.receivedAmount > 0 ? (
                                          <Badge
                                            status="success"
                                            text={
                                              <span className="font-semibold text-green-600">
                                                Received
                                              </span>
                                            }
                                          />
                                        ) : (
                                          <Badge
                                            status="warning"
                                            text={
                                              <span className="font-semibold text-orange-600">
                                                Pending
                                              </span>
                                            }
                                          />
                                        )}
                                      </div>
                                    }
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Row gutter={[8, 8]}>
                                      <Col span={12}>
                                        <Text className="text-xs text-gray-500">
                                          Expected Amount
                                        </Text>
                                        <div className="font-semibold text-blue-600">
                                          {formatAmount(advance.expectedAmount)}
                                        </div>
                                      </Col>
                                      <Col span={12}>
                                        <Text className="text-xs text-gray-500">
                                          Received Amount
                                        </Text>
                                        <div className="font-semibold text-green-600">
                                          {formatAmount(advance.receivedAmount)}
                                        </div>
                                      </Col>
                                      <Col span={12}>
                                        <Text className="text-xs text-gray-500">
                                          Expected Date
                                        </Text>
                                        <div className="font-medium">
                                          {formatDate(advance.advanceDate)}
                                        </div>
                                      </Col>
                                      <Col span={12}>
                                        <Text className="text-xs text-gray-500">
                                          Received Date
                                        </Text>
                                        <div className="font-medium">
                                          {advance.receivedDate
                                            ? formatDate(advance.receivedDate)
                                            : "-"}
                                        </div>
                                      </Col>
                                      <Col span={12}>
                                        <Text className="text-xs text-gray-500">
                                          Given By
                                        </Text>
                                        <div className="font-medium">
                                          {advance.givenBy || "-"}
                                        </div>
                                      </Col>
                                      <Col span={12}>
                                        <Text className="text-xs text-gray-500">
                                          Collected By
                                        </Text>
                                        <div className="font-medium">
                                          {advance.collectedBy || "-"}
                                        </div>
                                      </Col>
                                      <Col span={12}>
                                        <Text className="text-xs text-gray-500">
                                          Mode of Payment
                                        </Text>
                                        <div className="font-medium">
                                          {advance.modeOfPayment || "-"}
                                        </div>
                                      </Col>
                                    </Row>
                                  </Card>
                                ),
                              )
                            ) : (
                              <Text className="text-xs text-gray-400">
                                No advances configured
                              </Text>
                            )}
                          </>
                        )}
                      </div>
                    </Card>
                  </>
                )}

                {/* For non-wedding events or single event: Show event details with amounts */}
                {!isCompletePaymentWedding(selectedEvent) &&
                  selectedEvent.eventTypes
                    ?.slice(0, undefined)
                    .map((eventType, index) => {
                      const eventTypeName = !eventType.eventType
                        ? "Main Event"
                        : typeof eventType.eventType === "string"
                          ? eventType.eventType
                          : eventType.eventType?.name || "N/A";
                      return (
                        <Card
                          key={index}
                          className="border-2 border-blue-200 hover:border-blue-400 transition-all"
                          title={
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-blue-700">
                                {selectedEvent.eventTypes?.length > 1
                                  ? eventTypeName
                                  : "Event Details"}
                              </span>
                              {selectedEvent.eventTypes?.length > 1 && (
                                <Tag color="blue" className="text-sm">
                                  Event {index + 1}
                                </Tag>
                              )}
                            </div>
                          }
                        >
                          <div className="space-y-4">
                            {/* Dates and Venue */}
                            <Row gutter={[16, 16]}>
                              <Col span={8}>
                                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                                  <CalendarOutlined className="text-blue-600 text-lg" />
                                  <div>
                                    <Text className="text-xs text-gray-500 block">
                                      Start Date
                                    </Text>
                                    <Text strong>
                                      {formatDate(eventType.startDate)}
                                    </Text>
                                  </div>
                                </div>
                              </Col>
                              <Col span={8}>
                                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                                  <CalendarOutlined className="text-purple-600 text-lg" />
                                  <div>
                                    <Text className="text-xs text-gray-500 block">
                                      End Date
                                    </Text>
                                    <Text strong>
                                      {formatDate(eventType.endDate)}
                                    </Text>
                                  </div>
                                </div>
                              </Col>
                              <Col span={8}>
                                <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                                  <EnvironmentOutlined className="text-pink-600 text-lg" />
                                  <div>
                                    <Text className="text-xs text-gray-500 block">
                                      Venue
                                    </Text>
                                    <Text strong>
                                      {eventType.venueLocation?.name ||
                                        eventType.venueLocation ||
                                        "-"}
                                    </Text>
                                  </div>
                                </div>
                              </Col>
                              {eventType.subVenueLocation && (
                                <Col span={8}>
                                  <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                                    <EnvironmentOutlined className="text-orange-600 text-lg" />
                                    <div>
                                      <Text className="text-xs text-gray-500 block">
                                        Sub Venue
                                      </Text>
                                      <Text strong>
                                        {eventType.subVenueLocation?.name ||
                                          eventType.subVenueLocation ||
                                          "-"}
                                      </Text>
                                    </div>
                                  </div>
                                </Col>
                              )}
                              {eventType.coordinator && (
                                <Col span={8}>
                                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                                    <UserOutlined className="text-green-600 text-lg" />
                                    <div>
                                      <Text className="text-xs text-gray-500 block">
                                        Event Coordinator
                                      </Text>
                                      <Text strong>
                                        {eventType.coordinator?.name ||
                                          eventType.coordinator ||
                                          "-"}
                                      </Text>
                                    </div>
                                  </div>
                                </Col>
                              )}
                            </Row>

                            <Divider className="my-2">Amount Breakdown</Divider>

                            {/* Amount breakdown */}
                            <Row gutter={[12, 12]}>
                              <Col span={12}>
                                <div className="p-2 bg-green-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Agreed Amount
                                  </Text>
                                  <Text strong className="text-green-700">
                                    {formatAmount(eventType.agreedAmount || 0)}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-blue-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Account Amount
                                  </Text>
                                  <Text strong className="text-blue-700">
                                    {formatAmount(eventType.accountAmount || 0)}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-purple-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    GST (18%)
                                  </Text>
                                  <Text strong className="text-purple-700">
                                    {formatAmount(eventType.accountGst || 0)}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-pink-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Account + GST
                                  </Text>
                                  <Text strong className="text-pink-700">
                                    {formatAmount(
                                      eventType.accountAmountWithGst || 0,
                                    )}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-yellow-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Cash Amount
                                  </Text>
                                  <Text strong className="text-yellow-700">
                                    {formatAmount(eventType.cashAmount || 0)}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-emerald-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Total Payable
                                  </Text>
                                  <Text strong className="text-emerald-700">
                                    {formatAmount(eventType.totalPayable || 0)}
                                  </Text>
                                </div>
                              </Col>
                            </Row>

                            <Divider className="my-2">Advance Payments</Divider>

                            {/* Advances */}
                            {eventType.advances &&
                            eventType.advances.length > 0 ? (
                              eventType.advances.map((advance, advIndex) => (
                                <Card
                                  key={advIndex}
                                  size="small"
                                  className="bg-gray-50 border border-gray-200"
                                  title={
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold">
                                        Advance #{advance.advanceNumber}
                                      </span>
                                      {advance.receivedAmount > 0 ? (
                                        <Badge
                                          status="success"
                                          text={
                                            <span className="font-semibold text-green-600">
                                              Received
                                            </span>
                                          }
                                        />
                                      ) : (
                                        <Badge
                                          status="warning"
                                          text={
                                            <span className="font-semibold text-orange-600">
                                              Pending
                                            </span>
                                          }
                                        />
                                      )}
                                    </div>
                                  }
                                  style={{ marginBottom: 8 }}
                                >
                                  <Row gutter={[8, 8]}>
                                    <Col span={12}>
                                      <Text className="text-xs text-gray-500">
                                        Expected Amount
                                      </Text>
                                      <div className="font-semibold text-blue-600">
                                        {formatAmount(advance.expectedAmount)}
                                      </div>
                                    </Col>
                                    <Col span={12}>
                                      <Text className="text-xs text-gray-500">
                                        Received Amount
                                      </Text>
                                      <div className="font-semibold text-green-600">
                                        {formatAmount(advance.receivedAmount)}
                                      </div>
                                    </Col>
                                    <Col span={12}>
                                      <Text className="text-xs text-gray-500">
                                        Expected Date
                                      </Text>
                                      <div className="font-medium">
                                        {formatDate(advance.advanceDate)}
                                      </div>
                                    </Col>
                                    <Col span={12}>
                                      <Text className="text-xs text-gray-500">
                                        Received Date
                                      </Text>
                                      <div className="font-medium">
                                        {advance.receivedDate
                                          ? formatDate(advance.receivedDate)
                                          : "-"}
                                      </div>
                                    </Col>
                                    <Col span={12}>
                                      <Text className="text-xs text-gray-500">
                                        Given By
                                      </Text>
                                      <div className="font-medium">
                                        {advance.givenBy || "-"}
                                      </div>
                                    </Col>
                                    <Col span={12}>
                                      <Text className="text-xs text-gray-500">
                                        Collected By
                                      </Text>
                                      <div className="font-medium">
                                        {advance.collectedBy || "-"}
                                      </div>
                                    </Col>
                                    <Col span={12}>
                                      <Text className="text-xs text-gray-500">
                                        Mode of Payment
                                      </Text>
                                      <div className="font-medium">
                                        {advance.modeOfPayment || "-"}
                                      </div>
                                    </Col>
                                  </Row>
                                </Card>
                              ))
                            ) : (
                              <Text className="text-xs text-gray-400">
                                No advances configured
                              </Text>
                            )}
                          </div>
                        </Card>
                      );
                    })}
              </>
            )}

            {!isSingleDisplayEvent(selectedEvent) &&
              // Type 1: Wedding with event-specific amounts OR Type 3: Other events
              selectedEvent.eventTypes?.map((eventType, index) => {
                const eventTypeName = !eventType.eventType
                  ? "Engagement"
                  : typeof eventType.eventType === "string"
                    ? eventType.eventType
                    : eventType.eventType?.name || "N/A";
                return (
                  <Card
                    key={index}
                    className="border-2 border-purple-200 hover:border-purple-400 transition-all"
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-purple-700">
                          {eventTypeName}
                        </span>
                        <Tag color="purple" className="text-sm">
                          Event {index + 1}
                        </Tag>
                      </div>
                    }
                  >
                    <div className="space-y-4">
                      {/* Event Basic Info */}
                      <Row gutter={[16, 16]}>
                        <Col span={8}>
                          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                            <CalendarOutlined className="text-blue-600 text-lg" />
                            <div>
                              <Text className="text-xs text-gray-500 block">
                                Start Date
                              </Text>
                              <Text strong>
                                {formatDate(eventType.startDate)}
                              </Text>
                            </div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                            <CalendarOutlined className="text-purple-600 text-lg" />
                            <div>
                              <Text className="text-xs text-gray-500 block">
                                End Date
                              </Text>
                              <Text strong>
                                {formatDate(eventType.endDate)}
                              </Text>
                            </div>
                          </div>
                        </Col>
                        <Col span={8}>
                          <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                            <EnvironmentOutlined className="text-pink-600 text-lg" />
                            <div>
                              <Text className="text-xs text-gray-500 block">
                                Venue
                              </Text>
                              <Text strong>
                                {eventType.venueLocation?.name ||
                                  eventType.venueLocation ||
                                  "-"}
                              </Text>
                            </div>
                          </div>
                        </Col>
                        {eventType.subVenueLocation && (
                          <Col span={8}>
                            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg">
                              <EnvironmentOutlined className="text-orange-600 text-lg" />
                              <div>
                                <Text className="text-xs text-gray-500 block">
                                  Sub Venue
                                </Text>
                                <Text strong>
                                  {eventType.subVenueLocation?.name ||
                                    eventType.subVenueLocation ||
                                    "-"}
                                </Text>
                              </div>
                            </div>
                          </Col>
                        )}
                        {eventType.coordinator && (
                          <Col span={8}>
                            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                              <UserOutlined className="text-green-600 text-lg" />
                              <div>
                                <Text className="text-xs text-gray-500 block">
                                  Event Coordinator
                                </Text>
                                <Text strong>
                                  {eventType.coordinator?.name ||
                                    eventType.coordinator ||
                                    "-"}
                                </Text>
                              </div>
                            </div>
                          </Col>
                        )}
                        {eventType.agreedAmount !== undefined &&
                          eventType.agreedAmount > 0 && (
                            <>
                              <Col span={24}>
                                <Divider className="my-2">
                                  Amount Breakdown
                                </Divider>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-green-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Agreed Amount
                                  </Text>
                                  <Text strong className="text-green-700">
                                    {formatAmount(eventType.agreedAmount)}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-blue-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Account Amount
                                  </Text>
                                  <Text strong className="text-blue-700">
                                    {formatAmount(eventType.accountAmount || 0)}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-purple-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    GST (18%)
                                  </Text>
                                  <Text strong className="text-purple-700">
                                    {formatAmount(eventType.accountGst || 0)}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-pink-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Account + GST
                                  </Text>
                                  <Text strong className="text-pink-700">
                                    {formatAmount(
                                      eventType.accountAmountWithGst || 0,
                                    )}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-yellow-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Cash Amount
                                  </Text>
                                  <Text strong className="text-yellow-700">
                                    {formatAmount(eventType.cashAmount || 0)}
                                  </Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div className="p-2 bg-emerald-50 rounded">
                                  <Text className="text-xs text-gray-500 block">
                                    Total Payable
                                  </Text>
                                  <Text strong className="text-emerald-700">
                                    {formatAmount(eventType.totalPayable || 0)}
                                  </Text>
                                </div>
                              </Col>
                            </>
                          )}
                      </Row>

                      <Divider className="my-4">Advance Payments</Divider>

                      {/* Advances */}
                      {eventType.advances?.map((advance, advIndex) => (
                        <Card
                          key={advIndex}
                          size="small"
                          className="bg-gray-50 border border-gray-200"
                          title={
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">
                                Advance #{advance.advanceNumber}
                              </span>
                              {advance.receivedAmount > 0 ? (
                                <Badge
                                  status="success"
                                  text={
                                    <span className="font-semibold text-green-600">
                                      Received
                                    </span>
                                  }
                                />
                              ) : (
                                <Badge
                                  status="warning"
                                  text={
                                    <span className="font-semibold text-orange-600">
                                      Pending
                                    </span>
                                  }
                                />
                              )}
                            </div>
                          }
                          style={{ marginBottom: 12 }}
                        >
                          <Row gutter={[8, 8]}>
                            <Col span={12}>
                              <Text className="text-xs text-gray-500">
                                Expected Amount
                              </Text>
                              <div className="font-semibold text-blue-600">
                                {formatAmount(advance.expectedAmount)}
                              </div>
                            </Col>
                            <Col span={12}>
                              <Text className="text-xs text-gray-500">
                                Received Amount
                              </Text>
                              <div className="font-semibold text-green-600">
                                {formatAmount(advance.receivedAmount)}
                              </div>
                            </Col>
                            <Col span={12}>
                              <Text className="text-xs text-gray-500">
                                Expected Date
                              </Text>
                              <div className="font-medium">
                                {formatDate(advance.advanceDate)}
                              </div>
                            </Col>
                            <Col span={12}>
                              <Text className="text-xs text-gray-500">
                                Received Date
                              </Text>
                              <div className="font-medium">
                                {advance.receivedDate
                                  ? formatDate(advance.receivedDate)
                                  : "-"}
                              </div>
                            </Col>
                            <Col span={12}>
                              <Text className="text-xs text-gray-500">
                                Given By
                              </Text>
                              <div className="font-medium">
                                {advance.givenBy || "-"}
                              </div>
                            </Col>
                            <Col span={12}>
                              <Text className="text-xs text-gray-500">
                                Collected By
                              </Text>
                              <div className="font-medium">
                                {advance.collectedBy || "-"}
                              </div>
                            </Col>
                            <Col span={12}>
                              <Text className="text-xs text-gray-500">
                                Mode of Payment
                              </Text>
                              <div className="font-medium">
                                {advance.modeOfPayment || "-"}
                              </div>
                            </Col>
                          </Row>

                          {(advance.remarks?.accounts ||
                            advance.remarks?.owner ||
                            advance.remarks?.approver) && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <Text className="text-xs text-gray-500 block mb-2">
                                Remarks:
                              </Text>
                              <div className="space-y-1">
                                {advance.remarks.accounts && (
                                  <div className="text-sm">
                                    <Text type="secondary">Accounts:</Text>{" "}
                                    {advance.remarks.accounts}
                                  </div>
                                )}
                                {advance.remarks.owner && (
                                  <div className="text-sm">
                                    <Text type="secondary">Owner:</Text>{" "}
                                    {advance.remarks.owner}
                                  </div>
                                )}
                                {advance.remarks.approver && (
                                  <div className="text-sm">
                                    <Text type="secondary">Approver:</Text>{" "}
                                    {advance.remarks.approver}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </Drawer>

      <Drawer
        title={
          <div>
            <div className="text-lg font-semibold text-slate-800">
              Budget report
            </div>
            {budgetReportDrawerRecord && (
              <div className="text-xs text-slate-500 font-normal mt-0.5">
                {getEventName(budgetReportDrawerRecord.eventName)} ·{" "}
                {budgetReportDrawerRecord.clientName}
              </div>
            )}
          </div>
        }
        open={budgetReportDrawerOpen}
        onClose={closeBudgetReportDrawer}
        width="90%"
        placement="right"
        styles={{ body: { padding: 16, background: "#f8fafc" } }}
      >
        {budgetReportDrawerRecord?.budgetReport ? (
          <BudgetReportDrawerSection
            budgetReport={budgetReportDrawerRecord.budgetReport}
            count={budgetReportDrawerRecord.budgetReportsCount}
          />
        ) : null}
      </Drawer>

      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
          font-weight: 600;
          color: #6366f1;
          border-bottom: 2px solid #a5b4fc;
        }

        .custom-table .ant-table-tbody > tr:hover > td {
          background: #f0f4ff !important;
        }

        .custom-table .ant-pagination-item-active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-color: #6366f1;
        }

        .custom-table .ant-pagination-item-active a {
          color: white;
        }

        .ant-drawer-header {
          background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
          border-bottom: 2px solid #c7d2fe;
        }

        .ant-drawer-body {
          padding: 24px !important;
        }

        .ant-drawer-content {
          border-radius: 12px 0 0 12px;
        }

        .ant-descriptions-item-label {
          font-weight: 600;
          color: #6366f1;
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
        }
      `}</style>
    </div>
  );
};

export default ViewInflow;
