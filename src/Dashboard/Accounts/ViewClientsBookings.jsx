/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";
import {
  message,
  Drawer,
  DatePicker,
  Table,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Space,
  Descriptions,
  Divider,
  Badge,
  Statistic,
  Tabs,
  InputNumber,
  Input,
  Select,
} from "antd";
import {
  ArrowLeftOutlined,
  EditOutlined,
  EyeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  HeartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import CalendarClients from "../../Components/CalendarClients";
import UserWiseClients from "../../Components/UserWiseClients";
import ProgressCalenderClients from "../../Components/ProgressCalenderClients";

const { Title, Text } = Typography;

const ViewClientsBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingAdvances, setEditingAdvances] = useState([]);
  const [savingAdvance, setSavingAdvance] = useState(null);
  const [editingAdvanceKey, setEditingAdvanceKey] = useState(null); // Track which advance is being edited
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState("list");
  const [eventConfirmationTab, setEventConfirmationTab] =
    useState("InProgress");

  const user = useSelector((state) => state.user.value);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchRequirementsData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`, {
        ...config,
        params: { page, limit: pageSize },
      });
      setBookings(res.data.events || res.data.data || res.data || []);
      setPagination({
        current: res.data.currentPage || res.data.page || page,
        pageSize: res.data.limit || res.data.pageSize || pageSize,
        total: res.data.total || res.data.totalEvents || 0,
      });
    } catch (err) {
      message.error("Failed to fetch client bookings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTableChange = (paginationConfig) => {
    fetchRequirementsData(paginationConfig.current, paginationConfig.pageSize);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return dayjs(dateString).format("DD MMM YYYY");
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Helper function to get event name (handles both string and object format)
  const getEventName = (eventName) => {
    if (typeof eventName === "string") return eventName;
    return eventName?.name || "N/A";
  };

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
      return (
        record.eventTypes?.reduce(
          (sum, et) => sum + (et.totalPayable || 0),
          0,
        ) || 0
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
      return (
        record.eventTypes?.reduce(
          (sum, et) => sum + (et.agreedAmount || 0),
          0,
        ) || 0
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
    setEditingAdvanceKey(null); // Reset edit mode when opening drawer
    // Initialize editing advances based on event type
    let advancesToEdit = [];

    if (isCompletePaymentWedding(record)) {
      // Complete wedding: use only first event type advances
      record.eventTypes?.[0]?.advances?.forEach((adv) => {
        advancesToEdit.push({
          advanceNumber: adv.advanceNumber,
          expectedAmount: adv.expectedAmount,
          advanceDate: adv.advanceDate,
          receivedAmount: adv.receivedAmount || "",
          receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
          givenBy: adv.givenBy || "",
          collectedBy: adv.collectedBy || "",
          modeOfPayment: adv.modeOfPayment || "",
          remarks: adv.remarks || "",
          eventTypeIndex: 0,
          eventTypeId: record.eventTypes?.[0]?._id || 0,
        });
      });
    } else {
      // Separate mode or non-wedding: all event types
      record.eventTypes?.forEach((et, etIndex) => {
        et.advances?.forEach((adv) => {
          advancesToEdit.push({
            advanceNumber: adv.advanceNumber,
            expectedAmount: adv.expectedAmount,
            advanceDate: adv.advanceDate,
            receivedAmount: adv.receivedAmount || "",
            receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
            givenBy: adv.givenBy || "",
            collectedBy: adv.collectedBy || "",
            modeOfPayment: adv.modeOfPayment || "",
            remarks: adv.remarks || "",
            eventTypeIndex: etIndex,
            eventTypeId: et._id || etIndex,
          });
        });
      });
    }

    setEditingAdvances(advancesToEdit);
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setSelectedEvent(null);
    setEditingAdvances([]);
    setSavingAdvance(null);
    setEditingAdvanceKey(null);
  };

  const handleAdvanceChange = (index, field, value) => {
    const updated = [...editingAdvances];
    updated[index][field] = value;
    setEditingAdvances(updated);
  };

  // Generate unique key for advance (for tracking edit state)
  const getAdvanceKey = (advance) => {
    return `advance-${advance.advanceNumber}-${
      advance.eventTypeIndex ?? "common"
    }`;
  };

  // Start editing an advance
  const startEditingAdvance = (advance, index) => {
    const key = getAdvanceKey(advance);
    setEditingAdvanceKey(key);
  };

  // Cancel editing an advance
  const cancelEditingAdvance = () => {
    setEditingAdvanceKey(null);
    // Reset the advance data to original values
    if (selectedEvent) {
      showEventDetailsDrawer(selectedEvent);
    }
  };

  const saveAdvance = async (advanceIndex) => {
    const advance = editingAdvances[advanceIndex];

    if (!advance.expectedAmount) {
      message.warning("Expected amount is required");
      return;
    }

    setSavingAdvance(advanceIndex);
    try {
      let endpoint = "";
      let payload = {
        expectedAmount: parseFloat(advance.expectedAmount),
      };

      // Include received amount and date if provided
      if (advance.receivedAmount) {
        payload.receivedAmount = parseFloat(advance.receivedAmount);
      }
      if (advance.receivedDate) {
        payload.receivedDate = advance.receivedDate.toISOString();
      }

      // Include additional fields
      if (advance.givenBy) {
        payload.givenBy = advance.givenBy;
      }
      if (advance.collectedBy) {
        payload.collectedBy = advance.collectedBy;
      }
      if (advance.modeOfPayment) {
        payload.modeOfPayment = advance.modeOfPayment;
      }
      if (advance.remarks) {
        payload.remarks = advance.remarks;
      }

      // Event-specific advances (always use event-types endpoint)
      const eventType = selectedEvent.eventTypes?.[advance.eventTypeIndex];
      if (!eventType) {
        message.error("Event type not found");
        return;
      }
      endpoint = `${API_BASE_URL}events/${selectedEvent._id}/event-types/${
        eventType._id || advance.eventTypeId || advance.eventTypeIndex
      }/advances/${advance.advanceNumber}`;

      await axios.patch(endpoint, payload, config);

      message.success(`Advance ${advance.advanceNumber} updated successfully`);

      // Exit edit mode
      setEditingAdvanceKey(null);

      // Refresh table data
      await fetchRequirementsData(pagination.current, pagination.pageSize);

      // Fetch updated event data to refresh drawer
      const updatedEventResponse = await axios.get(
        `${API_BASE_URL}events/${selectedEvent._id}`,
        config,
      );
      const updatedEvent =
        updatedEventResponse.data.event ||
        updatedEventResponse.data.data ||
        updatedEventResponse.data;
      if (updatedEvent) {
        showEventDetailsDrawer(updatedEvent);
      }
    } catch (err) {
      message.error("Failed to update advance");
      console.error(err);
    } finally {
      setSavingAdvance(null);
    }
  };

  const columns = [
    {
      title: "Event Confirmation",
      dataIndex: "eventConfirmation",
      key: "eventConfirmation",
      width: 140,
      render: (status) => {
        const colorMap = {
          "Confirmed Event": "green",
          InProgress: "orange",
          Cancelled: "red",
          Pending: "blue",
        };
        return (
          <Tag
            color={colorMap[status] || "default"}
            className="text-sm font-semibold px-3 py-1"
          >
            {status || "N/A"}
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
        const eventNameStr = getEventName(text);
        return (
          <Tag color="purple" className="text-sm font-semibold px-3 py-1">
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
    ...(eventConfirmationTab === "InProgress" ||
    eventConfirmationTab === "Cancelled"
      ? [
          {
            title: "Next Meeting Date",
            key: "meetingDate",
            width: 140,
            render: (_, record) => (
              <div className="flex items-center gap-1">
                <CalendarOutlined className="text-blue-500 text-xs" />
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
    // {
    //   title: "Actions",
    //   key: "actions",
    //   fixed: "right",
    //   width: 90,
    //   align: "center",
    //   render: (_, record) => (
    //     <Button
    //       type="default"
    //       icon={<EditOutlined />}
    //       onClick={() => navigate(`/user/editclient/${record._id}`)}
    //       className="border-blue-400 text-blue-600 hover:bg-blue-50"
    //     >
    //       Edit
    //     </Button>
    //   ),
    // },
  ];

  // Calculate statistics based on filtered bookings
  const filteredBookings = bookings.filter(
    (booking) => booking.eventConfirmation === eventConfirmationTab,
  );
  const totalBookings = filteredBookings.length;
  const totalPayableRevenue = filteredBookings.reduce(
    (acc, curr) => acc + getTotalPayable(curr),
    0,
  );
  const totalAgreedRevenue = filteredBookings.reduce(
    (acc, curr) => acc + getTotalAgreedAmount(curr),
    0,
  );
  const totalReceivedRevenue = filteredBookings.reduce(
    (acc, curr) => acc + getTotalReceivedAdvances(curr),
    0,
  );
  const totalPendingRevenue = filteredBookings.reduce((acc, curr) => {
    const expected = getTotalExpectedAdvances(curr);
    const received = getTotalReceivedAdvances(curr);
    return acc + (expected - received);
  }, 0);

  const tabItems = [
    {
      key: "list",
      label: "List View",
      children: (
        <div className="space-y-6">
          {/* Event Confirmation Tabs */}
          <Tabs
            activeKey={eventConfirmationTab}
            onChange={setEventConfirmationTab}
            items={[
              {
                key: "InProgress",
                label: (
                  <span>
                    <ClockCircleOutlined /> InProgress (
                    {
                      bookings.filter(
                        (b) => b.eventConfirmation === "InProgress",
                      ).length
                    }
                    )
                  </span>
                ),
              },
              {
                key: "Confirmed Event",
                label: (
                  <span>
                    <CheckCircleOutlined /> Confirmed Event (
                    {
                      bookings.filter(
                        (b) => b.eventConfirmation === "Confirmed Event",
                      ).length
                    }
                    )
                  </span>
                ),
              },
              {
                key: "Cancelled",
                label: (
                  <span>
                    ❌ Cancelled (
                    {
                      bookings.filter(
                        (b) => b.eventConfirmation === "Cancelled",
                      ).length
                    }
                    )
                  </span>
                ),
              },
            ]}
          />

          {/* Statistics Cards */}
          <Row gutter={[16, 16]} className="mb-6" align="stretch">
            <Col xs={24} sm={12} md={6}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <Card
                  className="border-0 h-full"
                  style={{
                    borderRadius: "14px",
                    background: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #6366f1",
                  }}
                  bodyStyle={{ padding: "20px" }}
                >
                  <Statistic
                    title={
                      <Text className="text-slate-500 text-sm font-medium">
                        Total Bookings
                      </Text>
                    }
                    value={totalBookings}
                    valueStyle={{
                      color: "#1e293b",
                      fontSize: "28px",
                      fontWeight: "700",
                      marginTop: "8px",
                    }}
                  />
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <Card
                  className="border-0 h-full"
                  style={{
                    borderRadius: "14px",
                    background: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #10b981",
                  }}
                  bodyStyle={{ padding: "20px" }}
                >
                  <Statistic
                    title={
                      <Text className="text-slate-500 text-sm font-medium">
                        Total Payable
                      </Text>
                    }
                    value={totalPayableRevenue}
                    valueStyle={{
                      color: "#1e293b",
                      fontSize: "28px",
                      fontWeight: "700",
                      marginTop: "8px",
                    }}
                    formatter={(value) => formatAmount(value)}
                  />
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <Card
                  className="border-0 h-full"
                  style={{
                    borderRadius: "14px",
                    background: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #f59e0b",
                  }}
                  bodyStyle={{ padding: "20px" }}
                >
                  <Statistic
                    title={
                      <Text className="text-slate-500 text-sm font-medium">
                        Pending Amount
                      </Text>
                    }
                    value={totalPendingRevenue}
                    valueStyle={{
                      color: "#1e293b",
                      fontSize: "28px",
                      fontWeight: "700",
                      marginTop: "8px",
                    }}
                    formatter={(value) => formatAmount(value)}
                  />
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} sm={12} md={6}>
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card
                  className="border-0 h-full"
                  style={{
                    borderRadius: "14px",
                    background: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    borderLeft: "4px solid #22c55e",
                  }}
                  bodyStyle={{ padding: "20px" }}
                >
                  <Statistic
                    title={
                      <Text className="text-slate-500 text-sm font-medium">
                        Amount Received
                      </Text>
                    }
                    value={totalReceivedRevenue}
                    valueStyle={{
                      color: "#1e293b",
                      fontSize: "28px",
                      fontWeight: "700",
                      marginTop: "8px",
                    }}
                    formatter={(value) => formatAmount(value)}
                  />
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <Card
              className="border-0"
              style={{
                borderRadius: "14px",
                background: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
              bodyStyle={{ padding: "24px" }}
            >
              <Table
                columns={columns}
                dataSource={filteredBookings}
                loading={loading}
                rowKey="_id"
                pagination={{
                  current: 1,
                  pageSize: 10,
                  total: filteredBookings.length,
                  showSizeChanger: true,
                  showTotal: (total) => (
                    <span className="text-slate-600 text-sm">
                      Total {total} bookings
                    </span>
                  ),
                  pageSizeOptions: ["10", "20", "50"],
                }}
                scroll={{ x: 1200 }}
                className="custom-table"
              />
            </Card>
          </motion.div>
        </div>
      ),
    },
    {
      key: "calendar",
      label: "Confirmed Events Calendar",
      children: <CalendarClients />,
    },
    {
      key: "Progresscalendar",
      label: "Inprogress/Cancelled Events Calendar",
      children: <ProgressCalenderClients />,
    },
    {
      key: "leaderboard",
      label: "LeaderBoard",
      children: <UserWiseClients />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card
            className="border-0 shadow-sm"
            style={{
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(10px)",
            }}
            bodyStyle={{ padding: "20px 24px" }}
          >
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate("/user")}
                  size="large"
                  className="border-0 shadow-none hover:bg-slate-100 text-slate-600"
                  style={{ borderRadius: "10px" }}
                >
                  Back
                </Button>
              </Col>

              <Col xs={24} sm={8} className="text-center">
                <Title
                  level={2}
                  className="!mb-0 !text-2xl md:!text-3xl font-semibold text-slate-800"
                >
                  Bookings Dashboard
                </Title>
              </Col>

              <Col xs={24} sm={8} className="text-right">
                {/* Add Booking removed as requested */}
              </Col>
            </Row>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card
            className="border-0 shadow-sm"
            style={{
              borderRadius: "16px",
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(10px)",
            }}
            bodyStyle={{ padding: "24px" }}
          >
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
              size="large"
              className="modern-tabs"
            />
          </Card>
        </motion.div>
      </div>

      {/* Event Details Drawer */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              }}
            >
              <CalendarOutlined className="text-white text-lg" />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-800">
                {selectedEvent ? getEventName(selectedEvent.eventName) : ""}
              </div>
              <div className="text-xs text-slate-500 font-normal">
                Event Details
              </div>
            </div>
          </div>
        }
        open={drawerVisible}
        onClose={closeDrawer}
        width="80%"
        className="event-details-drawer"
        bodyStyle={{ padding: 24, background: "#f8fafc" }}
      >
        {selectedEvent && (
          <div className="space-y-6" style={{ paddingRight: 8 }}>
            {/* Client Info */}
            <Card
              className="border-0"
              style={{
                borderRadius: "12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
              bodyStyle={{ padding: "20px" }}
            >
              <Descriptions column={2} size="small" colon={false}>
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
              </Descriptions>
            </Card>

            {/* Check event type and render accordingly */}
            {isCompletePaymentWedding(selectedEvent) && (
              <>
                {/* Complete Package Amount Breakdown */}
                {selectedEvent.eventTypes?.[0] && (
                  <Card
                    className="border-0"
                    style={{
                      borderRadius: "12px",
                      background: "white",
                      border: "1px solid #e2e8f0",
                    }}
                    title={
                      <span className="font-semibold text-slate-800 text-base">
                        Complete Package Amount Breakdown
                      </span>
                    }
                    bodyStyle={{ padding: "20px" }}
                  >
                    <Divider className="my-2">Amount Breakdown</Divider>
                    <Row gutter={[12, 12]}>
                      <Col span={12}>
                        <div className="p-2 bg-green-50 rounded">
                          <Text className="text-xs text-gray-500 block">
                            Agreed Amount
                          </Text>
                          <Text strong className="text-green-700">
                            {formatAmount(
                              selectedEvent.eventTypes[0].agreedAmount || 0,
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
                              selectedEvent.eventTypes[0].accountAmount || 0,
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
                              selectedEvent.eventTypes[0].accountGst || 0,
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
                              selectedEvent.eventTypes[0].cashAmount || 0,
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
                              selectedEvent.eventTypes[0].totalPayable || 0,
                            )}
                          </Text>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* Event Types - Only dates and venue */}
                {selectedEvent.eventTypes?.map((eventType, index) => (
                  <Card
                    key={index}
                    className="border-0"
                    style={{
                      borderRadius: "12px",
                      background: "white",
                      border: "1px solid #e2e8f0",
                      marginBottom: "16px",
                    }}
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-base font-semibold text-slate-800">
                          {eventType.eventType?.name ||
                            eventType.eventType ||
                            "Event Type"}
                        </span>
                        <Tag
                          color="blue"
                          className="text-xs"
                          style={{
                            borderRadius: "6px",
                            border: "none",
                            padding: "2px 10px",
                          }}
                        >
                          Event {index + 1}
                        </Tag>
                      </div>
                    }
                    bodyStyle={{ padding: "20px" }}
                  >
                    <Row gutter={[12, 12]}>
                      <Col span={8}>
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <CalendarOutlined className="text-slate-600" />
                          <div>
                            <Text className="text-xs text-slate-500 block font-medium">
                              Start Date
                            </Text>
                            <Text strong className="text-sm text-slate-800">
                              {formatDate(eventType.startDate)}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <CalendarOutlined className="text-slate-600" />
                          <div>
                            <Text className="text-xs text-slate-500 block font-medium">
                              End Date
                            </Text>
                            <Text strong className="text-sm text-slate-800">
                              {formatDate(eventType.endDate)}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <EnvironmentOutlined className="text-slate-600" />
                          <div>
                            <Text className="text-xs text-slate-500 block font-medium">
                              Venue
                            </Text>
                            <Text strong className="text-sm text-slate-800">
                              {eventType.venueLocation?.name ||
                                eventType.venueLocation ||
                                "-"}
                            </Text>
                          </div>
                        </div>
                      </Col>
                      {eventType.subVenueLocation && (
                        <Col span={8}>
                          <div
                            className="flex items-center gap-3 p-3 rounded-lg"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <EnvironmentOutlined className="text-slate-600" />
                            <div>
                              <Text className="text-xs text-slate-500 block font-medium">
                                Sub Venue
                              </Text>
                              <Text strong className="text-sm text-slate-800">
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
                          <div
                            className="flex items-center gap-3 p-3 rounded-lg"
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                            }}
                          >
                            <UserOutlined className="text-slate-600" />
                            <div>
                              <Text className="text-xs text-slate-500 block font-medium">
                                Coordinator
                              </Text>
                              <Text strong className="text-sm text-slate-800">
                                {eventType.coordinator?.name ||
                                  eventType.coordinator ||
                                  "-"}
                              </Text>
                            </div>
                          </div>
                        </Col>
                      )}
                    </Row>
                  </Card>
                ))}

                {/* Common Advances with Edit - Table Format */}
                <Card
                  className="border-0"
                  style={{
                    borderRadius: "12px",
                    background: "white",
                    border: "1px solid #e2e8f0",
                  }}
                  title={
                    <span className="font-semibold text-slate-800 text-base">
                      Common Advance Payments
                    </span>
                  }
                  bodyStyle={{ padding: "20px" }}
                >
                  <Table
                    dataSource={editingAdvances}
                    rowKey={(record) => getAdvanceKey(record)}
                    pagination={false}
                    columns={[
                      {
                        title: "Advance #",
                        dataIndex: "advanceNumber",
                        key: "advanceNumber",
                        width: 100,
                        render: (text) => (
                          <Text strong className="text-slate-800">
                            #{text}
                          </Text>
                        ),
                      },
                      {
                        title: "Expected Amount",
                        dataIndex: "expectedAmount",
                        key: "expectedAmount",
                        width: 150,
                        align: "right",
                        render: (amount) => (
                          <Text strong className="text-slate-800">
                            {formatAmount(amount)}
                          </Text>
                        ),
                      },
                      {
                        title: "Expected Date",
                        dataIndex: "advanceDate",
                        key: "advanceDate",
                        width: 130,
                        render: (date) => (
                          <Text className="text-slate-700">
                            {formatDate(date)}
                          </Text>
                        ),
                      },
                      {
                        title: "Received Amount",
                        key: "receivedAmount",
                        width: 180,
                        align: "right",
                        render: (_, record, index) => {
                          const advanceKey = getAdvanceKey(record);
                          const isEditing = editingAdvanceKey === advanceKey;
                          if (isEditing) {
                            return (
                              <InputNumber
                                value={record.receivedAmount}
                                onChange={(value) =>
                                  handleAdvanceChange(
                                    index,
                                    "receivedAmount",
                                    value,
                                  )
                                }
                                size="small"
                                className="w-full"
                                min={0}
                                formatter={(value) =>
                                  `₹ ${value}`.replace(
                                    /\B(?=(\d{3})+(?!\d))/g,
                                    ",",
                                  )
                                }
                                parser={(value) =>
                                  value.replace(/₹\s?|(,*)/g, "")
                                }
                                placeholder="Enter amount"
                              />
                            );
                          }
                          return (
                            <Text
                              strong
                              className={
                                record.receivedAmount > 0
                                  ? "text-green-600"
                                  : "text-slate-400"
                              }
                            >
                              {formatAmount(record.receivedAmount || 0)}
                            </Text>
                          );
                        },
                      },
                      {
                        title: "Received Date",
                        key: "receivedDate",
                        width: 180,
                        render: (_, record, index) => {
                          const advanceKey = getAdvanceKey(record);
                          const isEditing = editingAdvanceKey === advanceKey;
                          if (isEditing) {
                            return (
                              <DatePicker
                                value={record.receivedDate}
                                onChange={(date) =>
                                  handleAdvanceChange(
                                    index,
                                    "receivedDate",
                                    date,
                                  )
                                }
                                format="DD-MM-YYYY"
                                size="small"
                                className="w-full"
                                placeholder="Select date"
                              />
                            );
                          }
                          return (
                            <Text className="text-slate-700">
                              {record.receivedDate
                                ? formatDate(record.receivedDate)
                                : "-"}
                            </Text>
                          );
                        },
                      },
                      {
                        title: "Given By",
                        key: "givenBy",
                        width: 150,
                        render: (_, record, index) => {
                          const advanceKey = getAdvanceKey(record);
                          const isEditing = editingAdvanceKey === advanceKey;
                          if (isEditing) {
                            return (
                              <Input
                                value={record.givenBy}
                                onChange={(e) =>
                                  handleAdvanceChange(
                                    index,
                                    "givenBy",
                                    e.target.value,
                                  )
                                }
                                size="small"
                                placeholder="Enter name"
                              />
                            );
                          }
                          return (
                            <Text className="text-slate-700">
                              {record.givenBy || "-"}
                            </Text>
                          );
                        },
                      },
                      {
                        title: "Collected By",
                        key: "collectedBy",
                        width: 150,
                        render: (_, record, index) => {
                          const advanceKey = getAdvanceKey(record);
                          const isEditing = editingAdvanceKey === advanceKey;
                          if (isEditing) {
                            return (
                              <Input
                                value={record.collectedBy}
                                onChange={(e) =>
                                  handleAdvanceChange(
                                    index,
                                    "collectedBy",
                                    e.target.value,
                                  )
                                }
                                size="small"
                                placeholder="Enter name"
                              />
                            );
                          }
                          return (
                            <Text className="text-slate-700">
                              {record.collectedBy || "-"}
                            </Text>
                          );
                        },
                      },
                      {
                        title: "Mode of Payment",
                        key: "modeOfPayment",
                        width: 150,
                        render: (_, record, index) => {
                          const advanceKey = getAdvanceKey(record);
                          const isEditing = editingAdvanceKey === advanceKey;
                          if (isEditing) {
                            return (
                              <Select
                                value={record.modeOfPayment}
                                onChange={(value) =>
                                  handleAdvanceChange(
                                    index,
                                    "modeOfPayment",
                                    value,
                                  )
                                }
                                size="small"
                                className="w-full"
                                placeholder="Select mode"
                                options={[
                                  { label: "Cash", value: "Cash" },
                                  { label: "Account", value: "Account" },
                                  { label: "Both", value: "Both" },
                                ]}
                              />
                            );
                          }
                          return (
                            <Text className="text-slate-700">
                              {record.modeOfPayment || "-"}
                            </Text>
                          );
                        },
                      },
                      {
                        title: "Status",
                        key: "status",
                        width: 120,
                        render: (_, record) => (
                          <Badge
                            status={
                              record.receivedAmount > 0 ? "success" : "warning"
                            }
                            text={
                              <span
                                className={
                                  record.receivedAmount > 0
                                    ? "text-green-600 text-sm"
                                    : "text-orange-600 text-sm"
                                }
                              >
                                {record.receivedAmount > 0
                                  ? "Received"
                                  : "Pending"}
                              </span>
                            }
                          />
                        ),
                      },
                      {
                        title: "Actions",
                        key: "actions",
                        width: 150,
                        fixed: "right",
                        render: (_, record, index) => {
                          const advanceKey = getAdvanceKey(record);
                          const isEditing = editingAdvanceKey === advanceKey;
                          const isSaving = savingAdvance === index;

                          if (isEditing) {
                            return (
                              <Space>
                                <Button
                                  size="small"
                                  onClick={cancelEditingAdvance}
                                  disabled={isSaving}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="primary"
                                  size="small"
                                  onClick={() => saveAdvance(index)}
                                  loading={isSaving}
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                    border: "none",
                                  }}
                                >
                                  Save
                                </Button>
                              </Space>
                            );
                          }
                          return (
                            <Button
                              type="primary"
                              icon={<EditOutlined />}
                              size="small"
                              onClick={() => startEditingAdvance(record, index)}
                              style={{
                                background:
                                  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                                border: "none",
                              }}
                            >
                              Edit
                            </Button>
                          );
                        },
                      },
                    ]}
                    scroll={{ x: 1400 }}
                  />
                </Card>
              </>
            )}

            {!isCompletePaymentWedding(selectedEvent) && (
              <>
                {selectedEvent.eventTypes?.map((eventType, index) => {
                  const eventTypeAdvances = editingAdvances.filter(
                    (adv) => adv.eventTypeIndex === index,
                  );
                  return (
                    <Card
                      key={index}
                      className="border-0"
                      style={{
                        borderRadius: "12px",
                        background: "white",
                        border: "1px solid #e2e8f0",
                        marginBottom: "16px",
                      }}
                      title={
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold text-slate-800">
                            {eventType.eventType?.name ||
                              eventType.eventType ||
                              "Event Type"}
                          </span>
                          <Tag
                            color="purple"
                            className="text-xs"
                            style={{
                              borderRadius: "6px",
                              border: "none",
                              padding: "2px 10px",
                            }}
                          >
                            Event {index + 1}
                          </Tag>
                        </div>
                      }
                      bodyStyle={{ padding: "20px" }}
                    >
                      <div className="space-y-4">
                        {/* Event Basic Info */}
                        <Row gutter={[12, 12]}>
                          <Col span={8}>
                            <div
                              className="flex items-center gap-3 p-3 rounded-lg"
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <CalendarOutlined className="text-slate-600" />
                              <div>
                                <Text className="text-xs text-slate-500 block font-medium">
                                  Start Date
                                </Text>
                                <Text strong className="text-sm text-slate-800">
                                  {formatDate(eventType.startDate)}
                                </Text>
                              </div>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div
                              className="flex items-center gap-3 p-3 rounded-lg"
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <CalendarOutlined className="text-slate-600" />
                              <div>
                                <Text className="text-xs text-slate-500 block font-medium">
                                  End Date
                                </Text>
                                <Text strong className="text-sm text-slate-800">
                                  {formatDate(eventType.endDate)}
                                </Text>
                              </div>
                            </div>
                          </Col>
                          <Col span={8}>
                            <div
                              className="flex items-center gap-3 p-3 rounded-lg"
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <EnvironmentOutlined className="text-slate-600" />
                              <div>
                                <Text className="text-xs text-slate-500 block font-medium">
                                  Venue
                                </Text>
                                <Text strong className="text-sm text-slate-800">
                                  {eventType.venueLocation?.name ||
                                    eventType.venueLocation ||
                                    "-"}
                                </Text>
                              </div>
                            </div>
                          </Col>
                          {eventType.subVenueLocation && (
                            <Col span={8}>
                              <div
                                className="flex items-center gap-3 p-3 rounded-lg"
                                style={{
                                  background: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <EnvironmentOutlined className="text-slate-600" />
                                <div>
                                  <Text className="text-xs text-slate-500 block font-medium">
                                    Sub Venue
                                  </Text>
                                  <Text
                                    strong
                                    className="text-sm text-slate-800"
                                  >
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
                              <div
                                className="flex items-center gap-3 p-3 rounded-lg"
                                style={{
                                  background: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <UserOutlined className="text-slate-600" />
                                <div>
                                  <Text className="text-xs text-slate-500 block font-medium">
                                    Coordinator
                                  </Text>
                                  <Text
                                    strong
                                    className="text-sm text-slate-800"
                                  >
                                    {eventType.coordinator?.name ||
                                      eventType.coordinator ||
                                      "-"}
                                  </Text>
                                </div>
                              </div>
                            </Col>
                          )}
                          {eventType.agreedAmount !== undefined && (
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
                            </>
                          )}
                        </Row>

                        <Divider
                          className="my-4"
                          style={{ marginTop: "20px", marginBottom: "20px" }}
                        >
                          <span className="text-xs text-slate-500 font-medium">
                            Advance Payments
                          </span>
                        </Divider>

                        {/* Advances with Edit - Table Format */}
                        <Table
                          dataSource={eventTypeAdvances}
                          rowKey={(record) => getAdvanceKey(record)}
                          pagination={false}
                          columns={[
                            {
                              title: "Advance #",
                              dataIndex: "advanceNumber",
                              key: "advanceNumber",
                              width: 100,
                              render: (text) => (
                                <Text strong className="text-slate-800">
                                  #{text}
                                </Text>
                              ),
                            },
                            {
                              title: "Expected Amount",
                              dataIndex: "expectedAmount",
                              key: "expectedAmount",
                              width: 150,
                              align: "right",
                              render: (amount) => (
                                <Text strong className="text-slate-800">
                                  {formatAmount(amount)}
                                </Text>
                              ),
                            },
                            {
                              title: "Expected Date",
                              dataIndex: "advanceDate",
                              key: "advanceDate",
                              width: 130,
                              render: (date) => (
                                <Text className="text-slate-700">
                                  {formatDate(date)}
                                </Text>
                              ),
                            },
                            {
                              title: "Received Amount",
                              key: "receivedAmount",
                              width: 180,
                              align: "right",
                              render: (_, record) => {
                                const globalIndex = editingAdvances.findIndex(
                                  (adv) =>
                                    adv.advanceNumber ===
                                      record.advanceNumber &&
                                    adv.eventTypeIndex === index,
                                );
                                const advanceKey = getAdvanceKey(record);
                                const isEditing =
                                  editingAdvanceKey === advanceKey;
                                if (isEditing) {
                                  return (
                                    <InputNumber
                                      value={record.receivedAmount}
                                      onChange={(value) =>
                                        handleAdvanceChange(
                                          globalIndex,
                                          "receivedAmount",
                                          value,
                                        )
                                      }
                                      size="small"
                                      className="w-full"
                                      min={0}
                                      formatter={(value) =>
                                        `₹ ${value}`.replace(
                                          /\B(?=(\d{3})+(?!\d))/g,
                                          ",",
                                        )
                                      }
                                      parser={(value) =>
                                        value.replace(/₹\s?|(,*)/g, "")
                                      }
                                      placeholder="Enter amount"
                                    />
                                  );
                                }
                                return (
                                  <Text
                                    strong
                                    className={
                                      record.receivedAmount > 0
                                        ? "text-green-600"
                                        : "text-slate-400"
                                    }
                                  >
                                    {formatAmount(record.receivedAmount || 0)}
                                  </Text>
                                );
                              },
                            },
                            {
                              title: "Received Date",
                              key: "receivedDate",
                              width: 180,
                              render: (_, record) => {
                                const globalIndex = editingAdvances.findIndex(
                                  (adv) =>
                                    adv.advanceNumber ===
                                      record.advanceNumber &&
                                    adv.eventTypeIndex === index,
                                );
                                const advanceKey = getAdvanceKey(record);
                                const isEditing =
                                  editingAdvanceKey === advanceKey;
                                if (isEditing) {
                                  return (
                                    <DatePicker
                                      value={record.receivedDate}
                                      onChange={(date) =>
                                        handleAdvanceChange(
                                          globalIndex,
                                          "receivedDate",
                                          date,
                                        )
                                      }
                                      format="DD-MM-YYYY"
                                      size="small"
                                      className="w-full"
                                      placeholder="Select date"
                                    />
                                  );
                                }
                                return (
                                  <Text className="text-slate-700">
                                    {record.receivedDate
                                      ? formatDate(record.receivedDate)
                                      : "-"}
                                  </Text>
                                );
                              },
                            },
                            {
                              title: "Given By",
                              key: "givenBy",
                              width: 150,
                              render: (_, record) => {
                                const globalIndex = editingAdvances.findIndex(
                                  (adv) =>
                                    adv.advanceNumber ===
                                      record.advanceNumber &&
                                    adv.eventTypeIndex === index,
                                );
                                const advanceKey = getAdvanceKey(record);
                                const isEditing =
                                  editingAdvanceKey === advanceKey;
                                if (isEditing) {
                                  return (
                                    <Input
                                      value={record.givenBy}
                                      onChange={(e) =>
                                        handleAdvanceChange(
                                          globalIndex,
                                          "givenBy",
                                          e.target.value,
                                        )
                                      }
                                      size="small"
                                      placeholder="Enter name"
                                    />
                                  );
                                }
                                return (
                                  <Text className="text-slate-700">
                                    {record.givenBy || "-"}
                                  </Text>
                                );
                              },
                            },
                            {
                              title: "Collected By",
                              key: "collectedBy",
                              width: 150,
                              render: (_, record) => {
                                const globalIndex = editingAdvances.findIndex(
                                  (adv) =>
                                    adv.advanceNumber ===
                                      record.advanceNumber &&
                                    adv.eventTypeIndex === index,
                                );
                                const advanceKey = getAdvanceKey(record);
                                const isEditing =
                                  editingAdvanceKey === advanceKey;
                                if (isEditing) {
                                  return (
                                    <Input
                                      value={record.collectedBy}
                                      onChange={(e) =>
                                        handleAdvanceChange(
                                          globalIndex,
                                          "collectedBy",
                                          e.target.value,
                                        )
                                      }
                                      size="small"
                                      placeholder="Enter name"
                                    />
                                  );
                                }
                                return (
                                  <Text className="text-slate-700">
                                    {record.collectedBy || "-"}
                                  </Text>
                                );
                              },
                            },
                            {
                              title: "Mode of Payment",
                              key: "modeOfPayment",
                              width: 150,
                              render: (_, record) => {
                                const globalIndex = editingAdvances.findIndex(
                                  (adv) =>
                                    adv.advanceNumber ===
                                      record.advanceNumber &&
                                    adv.eventTypeIndex === index,
                                );
                                const advanceKey = getAdvanceKey(record);
                                const isEditing =
                                  editingAdvanceKey === advanceKey;
                                if (isEditing) {
                                  return (
                                    <Select
                                      value={record.modeOfPayment}
                                      onChange={(value) =>
                                        handleAdvanceChange(
                                          globalIndex,
                                          "modeOfPayment",
                                          value,
                                        )
                                      }
                                      size="small"
                                      className="w-full"
                                      placeholder="Select mode"
                                      options={[
                                        { label: "Cash", value: "cash" },
                                        { label: "Account", value: "account" },
                                      ]}
                                    />
                                  );
                                }
                                return (
                                  <Text className="text-slate-700">
                                    {record.modeOfPayment || "-"}
                                  </Text>
                                );
                              },
                            },
                            {
                              title: "Status",
                              key: "status",
                              width: 120,
                              render: (_, record) => (
                                <Badge
                                  status={
                                    record.receivedAmount > 0
                                      ? "success"
                                      : "warning"
                                  }
                                  text={
                                    <span
                                      className={
                                        record.receivedAmount > 0
                                          ? "text-green-600 text-sm"
                                          : "text-orange-600 text-sm"
                                      }
                                    >
                                      {record.receivedAmount > 0
                                        ? "Received"
                                        : "Pending"}
                                    </span>
                                  }
                                />
                              ),
                            },
                            {
                              title: "Actions",
                              key: "actions",
                              width: 150,
                              fixed: "right",
                              render: (_, record) => {
                                const globalIndex = editingAdvances.findIndex(
                                  (adv) =>
                                    adv.advanceNumber ===
                                      record.advanceNumber &&
                                    adv.eventTypeIndex === index,
                                );
                                const advanceKey = getAdvanceKey(record);
                                const isEditing =
                                  editingAdvanceKey === advanceKey;
                                const isSaving = savingAdvance === globalIndex;

                                if (isEditing) {
                                  return (
                                    <Space>
                                      <Button
                                        size="small"
                                        onClick={cancelEditingAdvance}
                                        disabled={isSaving}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        type="primary"
                                        size="small"
                                        onClick={() => saveAdvance(globalIndex)}
                                        loading={isSaving}
                                        style={{
                                          background:
                                            "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                          border: "none",
                                        }}
                                      >
                                        Save
                                      </Button>
                                    </Space>
                                  );
                                }
                                return (
                                  <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    size="small"
                                    onClick={() =>
                                      startEditingAdvance(record, globalIndex)
                                    }
                                    style={{
                                      background:
                                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                                      border: "none",
                                    }}
                                  >
                                    Edit
                                  </Button>
                                );
                              },
                            },
                          ]}
                          scroll={{ x: 1400 }}
                        />
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        )}
      </Drawer>

      <style>{`
        .custom-table .ant-table-thead > tr > th {
          background: #f8fafc;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          padding: 16px;
        }

        .custom-table .ant-table-tbody > tr {
          transition: all 0.2s ease;
        }

        .custom-table .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }

        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 16px;
        }

        .custom-table .ant-pagination-item {
          border-radius: 8px;
          border-color: #e2e8f0;
        }

        .custom-table .ant-pagination-item-active {
          background: #6366f1;
          border-color: #6366f1;
        }

        .custom-table .ant-pagination-item-active a {
          color: white;
        }

        .custom-table .ant-pagination-item:hover {
          border-color: #6366f1;
        }

        .custom-table .ant-pagination-item:hover a {
          color: #6366f1;
        }

        .modern-tabs .ant-tabs-tab {
          border-radius: 8px 8px 0 0;
          padding: 12px 20px;
          font-weight: 500;
        }

        .modern-tabs .ant-tabs-tab-active {
          background: #f8fafc;
        }

        .modern-tabs .ant-tabs-ink-bar {
          height: 3px;
          border-radius: 3px 3px 0 0;
        }

        .event-details-drawer .ant-drawer-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 20px 24px;
        }

        .event-details-drawer .ant-drawer-body {
          padding: 24px !important;
          background: #f8fafc;
        }

        .event-details-drawer .ant-drawer-content {
          background: #f8fafc;
        }

        .event-details-drawer .ant-descriptions-item-label {
          font-weight: 600;
          color: #64748b;
          font-size: 13px;
        }

        .event-details-drawer .ant-descriptions-item-content {
          color: #1e293b;
          font-size: 13px;
        }

        .ant-card-head {
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 20px;
        }

        .ant-card-head-title {
          font-size: 15px;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default ViewClientsBookings;
