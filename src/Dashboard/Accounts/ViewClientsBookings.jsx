/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";
import {
  message,
  Modal,
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
} from "antd";
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  DollarOutlined,
  UserOutlined,
  PhoneOutlined,
  HeartOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import CalendarClients from "../../Components/calendarClients";

const { Title, Text } = Typography;

const ViewClientsBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingAdvances, setEditingAdvances] = useState([]);
  const [savingAdvance, setSavingAdvance] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState("list");

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

  // Helper function to check if event is Wedding type with event-specific amounts
  const isWeddingWithEventSpecificAmounts = (record) => {
    return (
      record.eventName === "Wedding" &&
      record.eventTypes?.some((et) => et.agreedAmount !== undefined)
    );
  };

  // Helper function to check if event is Wedding with common amounts
  const isWeddingWithCommonAmounts = (record) => {
    return (
      record.eventName === "Wedding" &&
      record.eventTypes?.every((et) => et.agreedAmount === undefined)
    );
  };

  // Calculate total agreed amount for a booking
  const getTotalAgreedAmount = (record) => {
    if (isWeddingWithEventSpecificAmounts(record)) {
      return record.eventTypes.reduce(
        (sum, et) => sum + (et.agreedAmount || 0),
        0
      );
    } else if (isWeddingWithCommonAmounts(record)) {
      return record.agreedAmount || 0;
    } else {
      return record.eventTypes?.[0]?.agreedAmount || 0;
    }
  };

  // Calculate total expected advances
  const getTotalExpectedAdvances = (record) => {
    let total = 0;
    if (isWeddingWithEventSpecificAmounts(record)) {
      record.eventTypes?.forEach((et) => {
        et.advances?.forEach((adv) => {
          total += adv.expectedAmount || 0;
        });
      });
    } else if (isWeddingWithCommonAmounts(record)) {
      record.advances?.forEach((adv) => {
        total += adv.expectedAmount || 0;
      });
    } else {
      record.eventTypes?.[0]?.advances?.forEach((adv) => {
        total += adv.expectedAmount || 0;
      });
    }
    return total;
  };

  // Calculate total received advances
  const getTotalReceivedAdvances = (record) => {
    let total = 0;
    if (isWeddingWithEventSpecificAmounts(record)) {
      record.eventTypes?.forEach((et) => {
        et.advances?.forEach((adv) => {
          total += adv.receivedAmount || 0;
        });
      });
    } else if (isWeddingWithCommonAmounts(record)) {
      record.advances?.forEach((adv) => {
        total += adv.receivedAmount || 0;
      });
    } else {
      record.eventTypes?.[0]?.advances?.forEach((adv) => {
        total += adv.receivedAmount || 0;
      });
    }
    return total;
  };

  const showEventDetailsModal = (record) => {
    setSelectedEvent(record);
    // Initialize editing advances based on event type
    let advancesToEdit = [];

    if (isWeddingWithCommonAmounts(record)) {
      advancesToEdit =
        record.advances?.map((adv) => ({
          advanceNumber: adv.advanceNumber,
          expectedAmount: adv.expectedAmount,
          advanceDate: adv.advanceDate,
          receivedAmount: adv.receivedAmount || "",
          receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
          eventTypeIndex: null, // Common advances
        })) || [];
    } else if (isWeddingWithEventSpecificAmounts(record)) {
      record.eventTypes?.forEach((et, etIndex) => {
        et.advances?.forEach((adv) => {
          advancesToEdit.push({
            advanceNumber: adv.advanceNumber,
            expectedAmount: adv.expectedAmount,
            advanceDate: adv.advanceDate,
            receivedAmount: adv.receivedAmount || "",
            receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
            eventTypeIndex: etIndex,
            eventTypeId: et._id || etIndex,
          });
        });
      });
    } else {
      record.eventTypes?.[0]?.advances?.forEach((adv) => {
        advancesToEdit.push({
          advanceNumber: adv.advanceNumber,
          expectedAmount: adv.expectedAmount,
          advanceDate: adv.advanceDate,
          receivedAmount: adv.receivedAmount || "",
          receivedDate: adv.receivedDate ? dayjs(adv.receivedDate) : null,
          eventTypeIndex: 0,
          eventTypeId: record.eventTypes?.[0]?._id || 0,
        });
      });
    }

    setEditingAdvances(advancesToEdit);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedEvent(null);
    setEditingAdvances([]);
    setSavingAdvance(null);
  };

  const handleAdvanceChange = (index, field, value) => {
    const updated = [...editingAdvances];
    updated[index][field] = value;
    setEditingAdvances(updated);
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
        userId: user?.id,
      };

      // Only include received amount and date if both are provided
      if (advance.receivedAmount && advance.receivedDate) {
        payload.receivedAmount = parseFloat(advance.receivedAmount);
        payload.receivedDate = advance.receivedDate.toISOString();
      }

      if (isWeddingWithCommonAmounts(selectedEvent)) {
        // Common advances at event level
        endpoint = `${API_BASE_URL}events/${selectedEvent._id}/advances/${advance.advanceNumber}`;
      } else {
        // Event-specific advances
        const eventType = selectedEvent.eventTypes?.[advance.eventTypeIndex];
        if (!eventType) {
          message.error("Event type not found");
          return;
        }
        endpoint = `${API_BASE_URL}events/${selectedEvent._id}/eventTypes/${
          eventType._id || advance.eventTypeIndex
        }/advances/${advance.advanceNumber}`;
      }

      await axios.patch(endpoint, payload, config);

      message.success(`Advance ${advance.advanceNumber} updated successfully`);

      // Refresh data
      await fetchRequirementsData(pagination.current, pagination.pageSize);

      // Update modal with fresh data
      const updatedEvent = bookings.find((e) => e._id === selectedEvent._id);
      if (updatedEvent) {
        showEventDetailsModal(updatedEvent);
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
      title: "Event Name",
      dataIndex: "eventName",
      key: "eventName",
      width: 140,
      render: (text) => (
        <Tag color="purple" className="text-sm font-semibold px-3 py-1">
          {text}
        </Tag>
      ),
    },
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
              <Text className="text-sm">{record.lead1}</Text>
            </div>
          )}
          {record.lead2 && (
            <div className="flex items-center gap-1">
              <TeamOutlined className="text-purple-500 text-xs" />
              <Text className="text-sm">{record.lead2}</Text>
            </div>
          )}
          {!record.lead1 && !record.lead2 && (
            <Text className="text-xs text-gray-400">No leads</Text>
          )}
        </div>
      ),
    },
    {
      title: "Agreed Amount",
      key: "agreedAmount",
      width: 120,
      align: "right",
      render: (_, record) => (
        <Text strong className="text-green-600 text-base">
          {formatAmount(getTotalAgreedAmount(record))}
        </Text>
      ),
    },
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
              <Text className="text-xs text-gray-500">Expected:</Text>
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
          onClick={() => showEventDetailsModal(record)}
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

  // Calculate statistics
  const totalBookings = bookings.length;
  const totalAgreedRevenue = bookings.reduce(
    (acc, curr) => acc + getTotalAgreedAmount(curr),
    0
  );
  const totalReceivedRevenue = bookings.reduce(
    (acc, curr) => acc + getTotalReceivedAdvances(curr),
    0
  );
  const totalPendingRevenue = bookings.reduce((acc, curr) => {
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
                        Agreed Amount
                      </Text>
                    }
                    value={totalAgreedRevenue}
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
                dataSource={bookings}
                loading={loading}
                rowKey="_id"
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showTotal: (total) => (
                    <span className="text-slate-600 text-sm">
                      Total {total} bookings
                    </span>
                  ),
                  pageSizeOptions: ["10", "20", "50"],
                }}
                onChange={handleTableChange}
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
      label: "Calendar View",
      children: <CalendarClients />,
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
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  size="large"
                  onClick={() => navigate("/user/addclient")}
                  className="border-0 shadow-md hover:shadow-lg"
                  style={{
                    borderRadius: "10px",
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                  }}
                >
                  New Booking
                </Button>
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

      {/* Event Details Modal */}
      <Modal
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
                {selectedEvent?.eventName}
              </div>
              <div className="text-xs text-slate-500 font-normal">
                Event Details
              </div>
            </div>
          </div>
        }
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={1000}
        className="event-details-modal"
        bodyStyle={{ padding: 24, maxHeight: "70vh", overflowY: "auto" }}
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
                    label={<span className="font-semibold">Lead 1</span>}
                  >
                    {selectedEvent.lead1}
                  </Descriptions.Item>
                )}
                {selectedEvent.lead2 && (
                  <Descriptions.Item
                    label={<span className="font-semibold">Lead 2</span>}
                  >
                    {selectedEvent.lead2}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Check event type and render accordingly */}
            {isWeddingWithCommonAmounts(selectedEvent) && (
              <>
                <Card
                  className="border-0"
                  style={{
                    borderRadius: "12px",
                    background: "white",
                    border: "1px solid #e2e8f0",
                  }}
                  bodyStyle={{ padding: "20px" }}
                >
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <div
                        className="flex items-center gap-3 p-4 rounded-lg"
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ background: "#10b981" }}
                        >
                          <DollarOutlined className="text-white text-lg" />
                        </div>
                        <div>
                          <Text className="text-xs text-slate-500 block font-medium">
                            Common Agreed Amount
                          </Text>
                          <Text
                            strong
                            className="text-xl text-slate-800"
                            style={{ fontWeight: 700 }}
                          >
                            {formatAmount(selectedEvent.agreedAmount || 0)}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card>

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
                          {eventType.eventType}
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
                              {eventType.venueLocation}
                            </Text>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}

                {/* Common Advances with Edit */}
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
                  {editingAdvances.map((advance, advIndex) => (
                    <Card
                      key={advIndex}
                      size="small"
                      className="border-0 mb-3"
                      style={{
                        borderRadius: "10px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                      }}
                      title={
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            Advance #{advance.advanceNumber}
                          </span>
                          {advance.receivedAmount > 0 ? (
                            <Badge
                              status="success"
                              text={
                                <span className="font-medium text-sm text-green-600">
                                  Received
                                </span>
                              }
                            />
                          ) : (
                            <Badge
                              status="warning"
                              text={
                                <span className="font-medium text-sm text-orange-600">
                                  Pending
                                </span>
                              }
                            />
                          )}
                        </div>
                      }
                      bodyStyle={{ padding: "16px" }}
                    >
                      <Row gutter={[12, 12]}>
                        <Col span={12}>
                          <Text className="text-xs text-slate-500 font-medium block mb-1">
                            Expected Amount
                          </Text>
                          <div className="font-semibold text-slate-800 text-sm">
                            {formatAmount(advance.expectedAmount)}
                          </div>
                        </Col>
                        <Col span={12}>
                          <Text className="text-xs text-slate-500 font-medium block mb-1">
                            Received Amount
                          </Text>
                          <div className="font-semibold text-green-600 text-sm">
                            {formatAmount(advance.receivedAmount || 0)}
                          </div>
                        </Col>
                        <Col span={12}>
                          <Text className="text-xs text-slate-500 font-medium block mb-1">
                            Expected Date
                          </Text>
                          <div className="font-medium text-slate-700 text-sm">
                            {formatDate(advance.advanceDate)}
                          </div>
                        </Col>
                        <Col span={12}>
                          <Text className="text-xs text-slate-500 font-medium block mb-1">
                            Received Date
                          </Text>
                          <div className="font-medium text-slate-700 text-sm">
                            {advance.receivedDate
                              ? formatDate(advance.receivedDate)
                              : "-"}
                          </div>
                        </Col>
                      </Row>

                      {/* Edit Section */}
                      <Divider
                        className="my-4"
                        style={{ marginTop: "16px", marginBottom: "16px" }}
                      >
                        <span className="text-xs text-slate-500 font-medium">
                          Edit Payment
                        </span>
                      </Divider>
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Received Date
                          </label>
                          <DatePicker
                            value={advance.receivedDate}
                            onChange={(date) =>
                              handleAdvanceChange(
                                advIndex,
                                "receivedDate",
                                date
                              )
                            }
                            format="DD-MM-YYYY"
                            size="large"
                            className="w-full"
                            placeholder="Select date"
                            style={{ borderRadius: "8px" }}
                          />
                        </Col>
                        <Col span={12}>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Received Amount
                          </label>
                          <InputNumber
                            value={advance.receivedAmount}
                            onChange={(value) =>
                              handleAdvanceChange(
                                advIndex,
                                "receivedAmount",
                                value
                              )
                            }
                            size="large"
                            className="w-full"
                            min={0}
                            formatter={(value) =>
                              `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            }
                            parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
                            placeholder="Enter received amount"
                            style={{ borderRadius: "8px" }}
                          />
                        </Col>
                      </Row>

                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => saveAdvance(advIndex)}
                        disabled={savingAdvance === advIndex}
                        className={`w-full mt-3 py-2.5 text-white rounded-lg font-medium transition-all duration-200 ${
                          savingAdvance === advIndex
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        style={{
                          background:
                            savingAdvance === advIndex
                              ? "#94a3b8"
                              : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          boxShadow:
                            savingAdvance === advIndex
                              ? "none"
                              : "0 2px 4px rgba(16, 185, 129, 0.2)",
                        }}
                      >
                        {savingAdvance === advIndex ? (
                          <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Save Advance #{advance.advanceNumber}
                          </span>
                        )}
                      </motion.button>
                    </Card>
                  ))}
                </Card>
              </>
            )}

            {(isWeddingWithEventSpecificAmounts(selectedEvent) ||
              !selectedEvent.eventName.includes("Wedding")) && (
              <>
                {selectedEvent.eventTypes?.map((eventType, index) => {
                  const eventTypeAdvances = editingAdvances.filter(
                    (adv) => adv.eventTypeIndex === index
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
                            {eventType.eventType}
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
                                  {eventType.venueLocation}
                                </Text>
                              </div>
                            </div>
                          </Col>
                          {eventType.agreedAmount !== undefined && (
                            <Col span={24}>
                              <div
                                className="flex items-center gap-3 p-4 rounded-lg"
                                style={{
                                  background: "#f0fdf4",
                                  border: "1px solid #bbf7d0",
                                }}
                              >
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                                  style={{ background: "#10b981" }}
                                >
                                  <DollarOutlined className="text-white text-lg" />
                                </div>
                                <div>
                                  <Text className="text-xs text-slate-500 block font-medium">
                                    Agreed Amount
                                  </Text>
                                  <Text
                                    strong
                                    className="text-xl text-slate-800"
                                    style={{ fontWeight: 700 }}
                                  >
                                    {formatAmount(eventType.agreedAmount)}
                                  </Text>
                                </div>
                              </div>
                            </Col>
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

                        {/* Advances with Edit */}
                        {eventTypeAdvances.map((advance, advIndex) => {
                          const globalIndex = editingAdvances.findIndex(
                            (adv) =>
                              adv.advanceNumber === advance.advanceNumber &&
                              adv.eventTypeIndex === index
                          );
                          return (
                            <Card
                              key={advIndex}
                              size="small"
                              className="border-0"
                              style={{
                                borderRadius: "10px",
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                marginBottom: "12px",
                              }}
                              title={
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-slate-800">
                                    Advance #{advance.advanceNumber}
                                  </span>
                                  {advance.receivedAmount > 0 ? (
                                    <Badge
                                      status="success"
                                      text={
                                        <span className="font-medium text-sm text-green-600">
                                          Received
                                        </span>
                                      }
                                    />
                                  ) : (
                                    <Badge
                                      status="warning"
                                      text={
                                        <span className="font-medium text-sm text-orange-600">
                                          Pending
                                        </span>
                                      }
                                    />
                                  )}
                                </div>
                              }
                              bodyStyle={{ padding: "16px" }}
                            >
                              <Row gutter={[12, 12]}>
                                <Col span={12}>
                                  <Text className="text-xs text-slate-500 font-medium block mb-1">
                                    Expected Amount
                                  </Text>
                                  <div className="font-semibold text-slate-800 text-sm">
                                    {formatAmount(advance.expectedAmount)}
                                  </div>
                                </Col>
                                <Col span={12}>
                                  <Text className="text-xs text-slate-500 font-medium block mb-1">
                                    Received Amount
                                  </Text>
                                  <div className="font-semibold text-green-600 text-sm">
                                    {formatAmount(advance.receivedAmount || 0)}
                                  </div>
                                </Col>
                                <Col span={12}>
                                  <Text className="text-xs text-slate-500 font-medium block mb-1">
                                    Expected Date
                                  </Text>
                                  <div className="font-medium text-slate-700 text-sm">
                                    {formatDate(advance.advanceDate)}
                                  </div>
                                </Col>
                                <Col span={12}>
                                  <Text className="text-xs text-slate-500 font-medium block mb-1">
                                    Received Date
                                  </Text>
                                  <div className="font-medium text-slate-700 text-sm">
                                    {advance.receivedDate
                                      ? formatDate(advance.receivedDate)
                                      : "-"}
                                  </div>
                                </Col>
                              </Row>

                              {/* Edit Section */}
                              <Divider
                                className="my-4"
                                style={{
                                  marginTop: "16px",
                                  marginBottom: "16px",
                                }}
                              >
                                <span className="text-xs text-slate-500 font-medium">
                                  Edit Payment
                                </span>
                              </Divider>
                              <Row gutter={[16, 16]}>
                                <Col span={12}>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Received Date
                                  </label>
                                  <DatePicker
                                    value={advance.receivedDate}
                                    onChange={(date) =>
                                      handleAdvanceChange(
                                        globalIndex,
                                        "receivedDate",
                                        date
                                      )
                                    }
                                    format="DD-MM-YYYY"
                                    size="large"
                                    className="w-full"
                                    placeholder="Select date"
                                    style={{ borderRadius: "8px" }}
                                  />
                                </Col>
                                <Col span={12}>
                                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Received Amount
                                  </label>
                                  <InputNumber
                                    value={advance.receivedAmount}
                                    onChange={(value) =>
                                      handleAdvanceChange(
                                        globalIndex,
                                        "receivedAmount",
                                        value
                                      )
                                    }
                                    size="large"
                                    className="w-full"
                                    min={0}
                                    formatter={(value) =>
                                      `₹ ${value}`.replace(
                                        /\B(?=(\d{3})+(?!\d))/g,
                                        ","
                                      )
                                    }
                                    parser={(value) =>
                                      value.replace(/₹\s?|(,*)/g, "")
                                    }
                                    placeholder="Enter received amount"
                                    style={{ borderRadius: "8px" }}
                                  />
                                </Col>
                              </Row>

                              <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => saveAdvance(globalIndex)}
                                disabled={savingAdvance === globalIndex}
                                className={`w-full mt-3 py-2.5 text-white rounded-lg font-medium transition-all duration-200 ${
                                  savingAdvance === globalIndex
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                style={{
                                  background:
                                    savingAdvance === globalIndex
                                      ? "#94a3b8"
                                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                                  boxShadow:
                                    savingAdvance === globalIndex
                                      ? "none"
                                      : "0 2px 4px rgba(16, 185, 129, 0.2)",
                                }}
                              >
                                {savingAdvance === globalIndex ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Saving...
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center gap-2">
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                    Save Advance #{advance.advanceNumber}
                                  </span>
                                )}
                              </motion.button>
                            </Card>
                          );
                        })}
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>
        )}
      </Modal>

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

        .event-details-modal .ant-modal-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 20px 24px;
        }

        .event-details-modal .ant-modal-body {
          padding: 24px !important;
          max-height: 70vh;
          overflow-y: auto;
          background: #f8fafc;
        }

        .event-details-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .event-details-modal .ant-descriptions-item-label {
          font-weight: 600;
          color: #64748b;
          font-size: 13px;
        }

        .event-details-modal .ant-descriptions-item-content {
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
