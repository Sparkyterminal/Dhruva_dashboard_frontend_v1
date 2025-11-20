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
  Badge
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
  ClockCircleOutlined
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

  const showEventDetailsModal = (record) => {
    setSelectedEvent(record);
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Event Name",
      dataIndex: "eventName",
      key: "eventName",
      width: 160,
      render: (text) => (
        <Tag color="purple" className="text-sm font-semibold px-3 py-1">
          {text}
        </Tag>
      ),
    },
    {
      title: "Client Details",
      key: "clientDetails",
      width: 200,
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
      width: 140,
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
      title: "Event Types",
      key: "eventTypes",
      width: 100,
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
      width: 100,
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
  const totalRevenue = bookings.reduce((acc, curr) => {
    return acc + (curr.eventTypes?.reduce((sum, et) => sum + (et.agreedAmount || 0), 0) || 0);
  }, 0);
  const totalEventTypes = bookings.reduce((acc, curr) => acc + (curr.eventTypes?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
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
        <Row gutter={[24, 24]} className="mt-4" align="middle">
          <Col xs={24} sm={8}>
            <Card
              className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{ padding: 24, minHeight: 140, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', color: 'white' }}
            >
              <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 36 }}>📊</div>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Total Bookings</Text>
                <Title level={2} style={{ color: 'white', margin: 0 }}>{totalBookings}</Title>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{ padding: 24, minHeight: 140, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', color: 'white' }}
            >
              <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 36 }}>💰</div>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Total Revenue</Text>
                <Title level={2} style={{ color: 'white', margin: 0 }}>{formatAmount(totalRevenue)}</Title>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={8}>
            <Card
              className="border-0 rounded-xl shadow-lg hover:shadow-xl transition-all"
              style={{ padding: 24, minHeight: 140, background: 'linear-gradient(135deg,#fb7185,#fb923c)', color: 'white' }}
            >
              <div className="text-center" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 36 }}>🎉</div>
                <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Total Events</Text>
                <Title level={2} style={{ color: 'white', margin: 0 }}>{totalEventTypes}</Title>
              </div>
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
            scroll={{ x: 900 }}
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
        width={900}
        className="event-details-modal"
        bodyStyle={{ padding: 24, maxHeight: '70vh', overflowY: 'auto' }}
      >
        {selectedEvent && (
          <div className="space-y-6" style={{ paddingRight: 8 }}>
            {/* Client Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200" style={{ padding: 18 }}>
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
              </Descriptions>
            </Card>

            {/* Event Types */}
            {selectedEvent.eventTypes?.map((eventType, index) => (
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
                style={{ marginBottom: 16, padding: 18 }}
              >
                <div className="space-y-4">
                  {/* Event Basic Info */}
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                        <CalendarOutlined className="text-blue-600 text-lg" />
                        <div>
                          <Text className="text-xs text-gray-500 block">Event Date</Text>
                          <Text strong>{formatDate(eventType.eventDate)}</Text>
                        </div>
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="flex items-center gap-2 p-3 bg-pink-50 rounded-lg">
                        <EnvironmentOutlined className="text-pink-600 text-lg" />
                        <div>
                          <Text className="text-xs text-gray-500 block">Venue</Text>
                          <Text strong>{eventType.venueLocation}</Text>
                        </div>
                      </div>
                    </Col>
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
                      style={{ marginBottom: 12, padding: 12 }}
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

                      {/* Remarks */}
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
            ))}
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

        .event-details-modal .ant-modal-footer {
          padding: 16px 24px;
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