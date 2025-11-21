/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
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
  Modal,
  Descriptions,
  Divider,
  Badge,
  Statistic
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
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined
} from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";

const { Title, Text } = Typography;

const ViewInflow = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchRequirementsData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`, {
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
  }, []);

  const handleTableChange = (paginationConfig) => {
    fetchRequirementsData(paginationConfig.current, paginationConfig.pageSize);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Helper function to check if event is Wedding type with event-specific amounts
  const isWeddingWithEventSpecificAmounts = (record) => {
    return record.eventName === "Wedding" && 
           record.eventTypes?.some(et => et.agreedAmount !== undefined);
  };

  // Helper function to check if event is Wedding with common amounts
  const isWeddingWithCommonAmounts = (record) => {
    return record.eventName === "Wedding" && 
           record.eventTypes?.every(et => et.agreedAmount === undefined);
  };

  // Calculate total agreed amount for a booking
  const getTotalAgreedAmount = (record) => {
    if (isWeddingWithEventSpecificAmounts(record)) {
      // Type 1: Wedding with event-specific amounts
      return record.eventTypes.reduce((sum, et) => sum + (et.agreedAmount || 0), 0);
    } else if (isWeddingWithCommonAmounts(record)) {
      // Type 2: Wedding with common amount (stored at event level, not yet in API)
      return record.agreedAmount || 0;
    } else {
      // Type 3: Other events (single event type with agreed amount)
      return record.eventTypes?.[0]?.agreedAmount || 0;
    }
  };

  // Calculate total expected advances
  const getTotalExpectedAdvances = (record) => {
    let total = 0;
    if (isWeddingWithEventSpecificAmounts(record)) {
      record.eventTypes?.forEach(et => {
        et.advances?.forEach(adv => {
          total += adv.expectedAmount || 0;
        });
      });
    } else if (isWeddingWithCommonAmounts(record)) {
      record.advances?.forEach(adv => {
        total += adv.expectedAmount || 0;
      });
    } else {
      record.eventTypes?.[0]?.advances?.forEach(adv => {
        total += adv.expectedAmount || 0;
      });
    }
    return total;
  };

  // Calculate total received advances
  const getTotalReceivedAdvances = (record) => {
    let total = 0;
    if (isWeddingWithEventSpecificAmounts(record)) {
      record.eventTypes?.forEach(et => {
        et.advances?.forEach(adv => {
          total += adv.receivedAmount || 0;
        });
      });
    } else if (isWeddingWithCommonAmounts(record)) {
      record.advances?.forEach(adv => {
        total += adv.receivedAmount || 0;
      });
    } else {
      record.eventTypes?.[0]?.advances?.forEach(adv => {
        total += adv.receivedAmount || 0;
      });
    }
    return total;
  };

  const showEventDetailsModal = (record) => {
    setSelectedEvent(record);
    setModalVisible(true);
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
            <Text strong className="text-base">{record.clientName}</Text>
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
          {record.altContactNumber && record.altContactNumber !== record.contactNumber && (
            <div className="flex items-center gap-1">
              <PhoneOutlined className="text-orange-500 text-xs" />
              <Text className="text-sm text-gray-500">{record.altContactNumber}</Text>
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
        const percentage = expected > 0 ? Math.round((received / expected) * 100) : 0;
        
        return (
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Text className="text-xs text-gray-500">Received:</Text>
              <Text strong className="text-sm text-green-600">{formatAmount(received)}</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-xs text-gray-500">Expected:</Text>
              <Text className="text-sm">{formatAmount(expected)}</Text>
            </div>
            <Tag color={percentage === 100 ? "success" : percentage > 0 ? "warning" : "default"}>
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
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 90,
      align: "center",
      render: (_, record) => (
        <Button
          type="default"
          icon={<EditOutlined />}
          onClick={() => navigate(`/user/editclient/${record._id}`)}
          className="border-blue-400 text-blue-600 hover:bg-blue-50"
        >
          Edit
        </Button>
      ),
    },
  ];

  // Calculate statistics
  const totalBookings = bookings.length;
  const totalAgreedRevenue = bookings.reduce((acc, curr) => acc + getTotalAgreedAmount(curr), 0);
  const totalReceivedRevenue = bookings.reduce((acc, curr) => acc + getTotalReceivedAdvances(curr), 0);
  const totalPendingRevenue = bookings.reduce((acc, curr) => {
    const expected = getTotalExpectedAdvances(curr);
    const received = getTotalReceivedAdvances(curr);
    return acc + (expected - received);
  }, 0);
  const totalEventTypes = bookings.reduce((acc, curr) => acc + (curr.eventTypes?.length || 0), 0);

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
              <Title level={2} className="!mb-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
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

        {/* Statistics Cards */}
        <Row gutter={[24, 24]} className="mt-4" align="stretch">
          <Col xs={24} sm={12} md={6}>
            <Card
              className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all h-full"
              style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: 'white' }}
            >
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Total Bookings</Text>}
                value={totalBookings}
                prefix="📊"
                valueStyle={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}
              />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Active client bookings
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all h-full"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white' }}
            >
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Total Agreed Amount</Text>}
                value={totalAgreedRevenue}
                prefix="💰"
                valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                formatter={(value) => formatAmount(value)}
              />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Total contracted revenue
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all h-full"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white' }}
            >
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Amount Received</Text>}
                value={totalReceivedRevenue}
                prefix="✅"
                valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                formatter={(value) => formatAmount(value)}
              />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Payments collected so far
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card
              className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all h-full"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: 'white' }}
            >
              <Statistic
                title={<Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>Pending Amount</Text>}
                value={totalPendingRevenue}
                prefix="⏳"
                valueStyle={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}
                formatter={(value) => formatAmount(value)}
              />
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                Outstanding payments due
              </Text>
            </Card>
          </Col>
        </Row>

        {/* Table */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 rounded-2xl overflow-hidden">
          <Table
            columns={columns}
            dataSource={bookings}
            loading={loading}
            rowKey="_id"
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} bookings`,
              pageSizeOptions: ["10", "20", "50"],
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>
      </div>

      {/* Event Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Event Details - {selectedEvent?.eventName}
            </span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1000}
        className="event-details-modal"
        bodyStyle={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}
      >
        {selectedEvent && (
          <div className="space-y-6" style={{ paddingRight: 8 }}>
            {/* Client Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <Descriptions column={2} size="small">
                <Descriptions.Item label={<span className="font-semibold">Client Name</span>}>
                  <Text strong>{selectedEvent.clientName}</Text>
                </Descriptions.Item>
                {selectedEvent.brideName && selectedEvent.groomName && (
                  <>
                    <Descriptions.Item label={<span className="font-semibold">Bride</span>}>
                      {selectedEvent.brideName}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span className="font-semibold">Groom</span>}>
                      {selectedEvent.groomName}
                    </Descriptions.Item>
                  </>
                )}
                <Descriptions.Item label={<span className="font-semibold">Contact</span>}>
                  {selectedEvent.contactNumber}
                </Descriptions.Item>
                {selectedEvent.altContactNumber && (
                  <Descriptions.Item label={<span className="font-semibold">Alt Contact</span>}>
                    {selectedEvent.altContactNumber}
                  </Descriptions.Item>
                )}
                {selectedEvent.lead1 && (
                  <Descriptions.Item label={<span className="font-semibold">Lead 1</span>}>
                    {selectedEvent.lead1}
                  </Descriptions.Item>
                )}
                {selectedEvent.lead2 && (
                  <Descriptions.Item label={<span className="font-semibold">Lead 2</span>}>
                    {selectedEvent.lead2}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* Check event type and render accordingly */}
            {isWeddingWithCommonAmounts(selectedEvent) && (
              // Type 2: Wedding with common agreed amount and advances
              <>
                <Card className="bg-yellow-50 border-yellow-300">
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                        <DollarOutlined className="text-green-600 text-lg" />
                        <div>
                          <Text className="text-xs text-gray-500 block">Common Agreed Amount</Text>
                          <Text strong className="text-lg text-green-700">
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
                    className="border-2 border-blue-200 hover:border-blue-400 transition-all"
                    title={
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-700">
                          {eventType.eventType}
                        </span>
                        <Tag color="blue" className="text-sm">
                          Event {index + 1}
                        </Tag>
                      </div>
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <CalendarOutlined className="text-blue-600 text-lg" />
                          <div>
                            <Text className="text-xs text-gray-500 block">Start Date</Text>
                            <Text strong>{formatDate(eventType.startDate)}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                          <CalendarOutlined className="text-purple-600 text-lg" />
                          <div>
                            <Text className="text-xs text-gray-500 block">End Date</Text>
                            <Text strong>{formatDate(eventType.endDate)}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                          <EnvironmentOutlined className="text-pink-600 text-lg" />
                          <div>
                            <Text className="text-xs text-gray-500 block">Venue</Text>
                            <Text strong>{eventType.venueLocation}</Text>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                ))}

                {/* Common Advances */}
                <Card className="bg-green-50 border-green-300" title={<span className="font-bold text-green-700">Common Advance Payments</span>}>
                  {selectedEvent.advances?.map((advance, advIndex) => (
                    <Card
                      key={advIndex}
                      size="small"
                      className="bg-white border border-gray-200 mb-3"
                      title={
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">Advance #{advance.advanceNumber}</span>
                          {advance.receivedAmount > 0 ? (
                            <Badge 
                              status="success" 
                              text={<span className="font-semibold text-green-600">Received</span>} 
                            />
                          ) : (
                            <Badge 
                              status="warning" 
                              text={<span className="font-semibold text-orange-600">Pending</span>} 
                            />
                          )}
                        </div>
                      }
                    >
                      <Row gutter={[8, 8]}>
                        <Col span={12}>
                          <Text className="text-xs text-gray-500">Expected Amount</Text>
                          <div className="font-semibold text-blue-600">
                            {formatAmount(advance.expectedAmount)}
                          </div>
                        </Col>
                        <Col span={12}>
                          <Text className="text-xs text-gray-500">Received Amount</Text>
                          <div className="font-semibold text-green-600">
                            {formatAmount(advance.receivedAmount)}
                          </div>
                        </Col>
                        <Col span={12}>
                          <Text className="text-xs text-gray-500">Expected Date</Text>
                          <div className="font-medium">{formatDate(advance.advanceDate)}</div>
                        </Col>
                        <Col span={12}>
                          <Text className="text-xs text-gray-500">Received Date</Text>
                          <div className="font-medium">
                            {advance.receivedDate ? formatDate(advance.receivedDate) : "-"}
                          </div>
                        </Col>
                      </Row>

                      {(advance.remarks?.accounts || advance.remarks?.owner || advance.remarks?.approver) && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <Text className="text-xs text-gray-500 block mb-2">Remarks:</Text>
                          <div className="space-y-1">
                            {advance.remarks.accounts && (
                              <div className="text-sm">
                                <Text type="secondary">Accounts:</Text> {advance.remarks.accounts}
                              </div>
                            )}
                            {advance.remarks.owner && (
                              <div className="text-sm">
                                <Text type="secondary">Owner:</Text> {advance.remarks.owner}
                              </div>
                            )}
                            {advance.remarks.approver && (
                              <div className="text-sm">
                                <Text type="secondary">Approver:</Text> {advance.remarks.approver}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </Card>
              </>
            )}

            {(isWeddingWithEventSpecificAmounts(selectedEvent) || !selectedEvent.eventName.includes("Wedding")) && (
              // Type 1: Wedding with event-specific amounts OR Type 3: Other events
              selectedEvent.eventTypes?.map((eventType, index) => (
                <Card
                  key={index}
                  className="border-2 border-purple-200 hover:border-purple-400 transition-all"
                  title={
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-purple-700">
                        {eventType.eventType}
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
                            <Text className="text-xs text-gray-500 block">Start Date</Text>
                            <Text strong>{formatDate(eventType.startDate)}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                          <CalendarOutlined className="text-purple-600 text-lg" />
                          <div>
                            <Text className="text-xs text-gray-500 block">End Date</Text>
                            <Text strong>{formatDate(eventType.endDate)}</Text>
                          </div>
                        </div>
                      </Col>
                      <Col span={8}>
                        <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                          <EnvironmentOutlined className="text-pink-600 text-lg" />
                          <div>
                            <Text className="text-xs text-gray-500 block">Venue</Text>
                            <Text strong>{eventType.venueLocation}</Text>
                          </div>
                        </div>
                      </Col>
                      {eventType.agreedAmount !== undefined && (
                        <Col span={24}>
                          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                            <DollarOutlined className="text-green-600 text-lg" />
                            <div>
                              <Text className="text-xs text-gray-500 block">Agreed Amount</Text>
                              <Text strong className="text-lg text-green-700">
                                {formatAmount(eventType.agreedAmount)}
                              </Text>
                            </div>
                          </div>
                        </Col>
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
                            <span className="font-semibold">Advance #{advance.advanceNumber}</span>
                            {advance.receivedAmount > 0 ? (
                              <Badge 
                                status="success" 
                                text={<span className="font-semibold text-green-600">Received</span>} 
                              />
                            ) : (
                              <Badge 
                                status="warning" 
                                text={<span className="font-semibold text-orange-600">Pending</span>} 
                              />
                            )}
                          </div>
                        }
                        style={{ marginBottom: 12 }}
                      >
                        <Row gutter={[8, 8]}>
                          <Col span={12}>
                            <Text className="text-xs text-gray-500">Expected Amount</Text>
                            <div className="font-semibold text-blue-600">
                              {formatAmount(advance.expectedAmount)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text className="text-xs text-gray-500">Received Amount</Text>
                            <div className="font-semibold text-green-600">
                              {formatAmount(advance.receivedAmount)}
                            </div>
                          </Col>
                          <Col span={12}>
                            <Text className="text-xs text-gray-500">Expected Date</Text>
                            <div className="font-medium">{formatDate(advance.advanceDate)}</div>
                          </Col>
                          <Col span={12}>
                            <Text className="text-xs text-gray-500">Received Date</Text>
                            <div className="font-medium">
                              {advance.receivedDate ? formatDate(advance.receivedDate) : "-"}
                            </div>
                          </Col>
                        </Row>

                        {(advance.remarks?.accounts || advance.remarks?.owner || advance.remarks?.approver) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <Text className="text-xs text-gray-500 block mb-2">Remarks:</Text>
                            <div className="space-y-1">
                              {advance.remarks.accounts && (
                                <div className="text-sm">
                                  <Text type="secondary">Accounts:</Text> {advance.remarks.accounts}
                                </div>
                              )}
                              {advance.remarks.owner && (
                                <div className="text-sm">
                                  <Text type="secondary">Owner:</Text> {advance.remarks.owner}
                                </div>
                              )}
                              {advance.remarks.approver && (
                                <div className="text-sm">
                                  <Text type="secondary">Approver:</Text> {advance.remarks.approver}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </Modal>

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

        .event-details-modal .ant-modal-header {
          background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
          border-bottom: 2px solid #c7d2fe;
        }

        .event-details-modal .ant-modal-body {
          padding: 24px !important;
          max-height: 70vh;
          overflow-y: auto;
        }

        .event-details-modal .ant-modal-content {
          border-radius: 12px;
        }

        .event-details-modal .ant-descriptions-item-label {
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