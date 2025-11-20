/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { message, Table, Button, Card, Typography, Space, Row, Col, Tag, Tooltip } from "antd";
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, CalendarOutlined, EnvironmentOutlined, DollarOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { motion } from "framer-motion";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";

const { Title, Text } = Typography;

// Custom styles with cormoreg font and enhanced glassmorphism
const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.85);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.4);
  }

  .glass-summary-card {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 1.2rem;
    box-shadow: 0 4px 24px 0 rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.45);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
    position: relative;
  }

  .glass-summary-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
    opacity: 0;
    transition: opacity 0.4s ease;
  }

  .glass-summary-card:hover::before {
    opacity: 1;
  }

  .glass-summary-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px 0 rgba(79, 70, 229, 0.25);
  }

  .advance-card {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
    border-radius: 0.75rem;
    padding: 12px 16px;
    border: 1px solid rgba(99, 102, 241, 0.2);
    transition: all 0.3s ease;
  }

  .advance-card:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12));
    border-color: rgba(99, 102, 241, 0.4);
    transform: translateX(4px);
  }

  .ant-table-thead > tr > th {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(124, 58, 237, 0.12)) !important;
    font-weight: 700 !important;
    color: #4f46e5 !important;
    border-bottom: 2px solid #6366f1 !important;
    font-size: 15px !important;
    font-family: 'cormoreg', serif !important;
  }

  .ant-table-tbody > tr {
    transition: all 0.25s ease;
    font-family: 'cormoreg', serif !important;
  }

  .ant-table-tbody > tr:hover {
    background: rgba(99, 102, 241, 0.06) !important;
    transform: scale(1.005);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
  }

  .table-row-light {
    background-color: rgba(255, 255, 255, 0.9);
  }

  .table-row-dark {
    background-color: rgba(239, 246, 255, 0.7);
  }

  .ant-table-tbody > tr > td {
    color: #1e293b;
    font-weight: 500;
    font-family: 'cormoreg', serif !important;
  }

  .ant-table-wrapper {
    border-radius: 1rem;
    overflow: hidden;
  }

  .ant-table {
    background: transparent;
  }

  .ant-pagination-item-active {
    background: linear-gradient(135deg, #4f46e5, #7c3aed) !important;
    border-color: #4f46e5 !important;
  }

  .ant-pagination-item-active a {
    color: white !important;
  }

  .ant-pagination-item:hover {
    border-color: #7c3aed;
  }

  .ant-pagination-item:hover a {
    color: #7c3aed;
  }

  .gradient-text {
    background: linear-gradient(135deg, #4f46e5, #7c3aed, #ec4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-family: 'cormoreg', serif !important;
  }

  .icon-wrapper {
    font-size: 56px;
    margin-bottom: 12px;
    filter: drop-shadow(0 4px 8px rgba(79, 70, 229, 0.2));
  }

  .stat-number {
    font-family: 'cormoreg', serif !important;
    font-size: 42px;
    font-weight: 700;
    line-height: 1.2;
  }

  * {
    font-family: 'cormoreg', serif !important;
  }
`;

const ViewInflow = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // Fetch bookings data with pagination
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

  // Format date in "DD MMM YYYY" format
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format amounts with rupee symbol and thousands separator
  const formatAmount = (amount) => {
    if (!amount) return "₹0";
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  // Calculate total expected advances
  const calculateTotalExpected = (advances) => {
    if (!advances || advances.length === 0) return 0;
    return advances.reduce((sum, adv) => sum + (adv.expectedAmount || 0), 0);
  };

  // Define table columns
  const columns = [
    {
      title: "Client Details",
      key: "clientDetails",
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={4}>
          <Text strong style={{ fontSize: 18, color: "#1e293b" }}>
            {record.clientName}
          </Text>
          <Text style={{ fontSize: 18, color: "#64748b" }}>
            {record.brideName} & {record.groomName}
          </Text>
        </Space>
      ),
    },
    {
      title: "Event Date",
      dataIndex: "eventDate",
      key: "eventDate",
      width: 140,
      sorter: (a, b) => new Date(a.eventDate) - new Date(b.eventDate),
      render: (date) => (
        <Tag
          icon={<CalendarOutlined />}
          color="blue"
          style={{ fontSize: 15, padding: "4px 12px", fontWeight: 600 }}
        >
          {formatDate(date)}
        </Tag>
      ),
    },
    {
      title: "Venue",
      dataIndex: "venueLocation",
      key: "venueLocation",
      width: 180,
      ellipsis: true,
      render: (venue) => (
        <Space>
          <EnvironmentOutlined style={{ color: "#ec4899" }} />
          <Text style={{ fontSize: 16 }}>{venue}</Text>
        </Space>
      ),
    },
    {
      title: "Agreed Amount",
      dataIndex: "agreedAmount",
      key: "agreedAmount",
      width: 150,
      align: "right",
      sorter: (a, b) => a.agreedAmount - b.agreedAmount,
      render: (amount) => (
        <Text strong style={{ fontSize: 15, color: "#059669" }}>
          {formatAmount(amount)}
        </Text>
      ),
    },
    {
      title: "Advance Schedule",
      dataIndex: "advances",
      key: "advances",
      width: 400,
      render: (advances) => {
        if (!advances || advances.length === 0) return <Text type="secondary">No advances</Text>;
        
        const totalExpected = calculateTotalExpected(advances);
        
        return (
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {advances.map((adv, index) => (
              <div key={index} className="advance-card">
                <Row gutter={12} align="middle">
                  <Col span={14}>
                    <Space direction="vertical" size={2}>
                      <Text strong style={{ color: "#4f46e5", fontSize: 14 }}>
                        Advance {adv.advanceNumber}
                      </Text>
                      <Space size={4}>
                        <ClockCircleOutlined style={{ color: "#64748b", fontSize: 12 }} />
                        <Text style={{ fontSize: 14, color: "#000", }}>
                          {formatDate(adv.advanceDate)}
                        </Text>
                      </Space>
                    </Space>
                  </Col>
                  <Col span={10} style={{ textAlign: 'right' }}>
                    <Text strong style={{ color: "#059669", fontSize: 14 }}>
                      {formatAmount(adv.expectedAmount)}
                    </Text>
                  </Col>
                </Row>
              </div>
            ))}
            <div style={{ 
              marginTop: 4, 
              paddingTop: 8, 
              borderTop: '2px solid rgba(99, 102, 241, 0.2)',
              textAlign: 'right'
            }}>
              <Text strong style={{ color: "#4f46e5", fontSize: 14 }}>
                Total Expected: {formatAmount(totalExpected)}
              </Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <Tooltip title="Edit booking details">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/user/editclient/${record._id}`)}
            style={{
              borderRadius: 10,
              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
              border: "none",
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
              height: 40,
            }}
          >
            Edit
          </Button>
        </Tooltip>
      ),
    },
  ];

  // Summary calculations
  const totalBookings = pagination.total || bookings.length;
  const totalAdvances = bookings.reduce((acc, curr) => acc + (curr.advances?.length || 0), 0);
  const totalRevenue = bookings.reduce((acc, curr) => acc + (curr.agreedAmount || 0), 0);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 30%, #ede9fe 60%, #fce7f3 100%)",
        padding: "28px",
        position: "relative",
      }}
    >
      <style>{customStyles}</style>

      {/* Animated Background Orbs */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.5,
          backgroundImage:
            `radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 45%),` +
            `radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 45%),` +
            `radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),` +
            `radial-gradient(circle at 80% 20%, rgba(59, 130, 246, 0.12) 0%, transparent 40%)`,
        }}
      />

      <div style={{ position: "relative", zIndex: 10, maxWidth: "1600px", margin: "0 auto" }}>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          {/* Header Card */}
          <div className="glass-card" style={{ padding: "32px 40px", marginBottom: "32px" }}>
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
              <Col xs={24} sm={8} md={6}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate("/user")}
                    size="large"
                    style={{
                      borderRadius: 12,
                      background: "linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(124, 58, 237, 0.1))",
                      border: "1px solid rgba(79, 70, 229, 0.3)",
                      color: "#4f46e5",
                      fontWeight: 600,
                      height: 50,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      paddingLeft: 20,
                      paddingRight: 20,
                    }}
                  >
                    Back Home
                  </Button>
                </motion.div>
              </Col>

              <Col xs={24} sm={8} md={12} style={{ textAlign: "center" }}>
                <Title
                  level={1}
                  className="gradient-text"
                  style={{
                    margin: 0,
                    fontSize: "clamp(28px, 4vw, 44px)",
                    fontWeight: 700,
                    letterSpacing: "-0.5px",
                  }}
                >
                  💍 Client Bookings Dashboard
                </Title>
              </Col>

              <Col xs={24} sm={8} md={6} style={{ textAlign: "right" }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => navigate("/user/addclient")}
                    style={{
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      border: "none",
                      fontWeight: 600,
                      height: 50,
                      boxShadow: "0 6px 20px rgba(79, 70, 229, 0.35)",
                      paddingLeft: 24,
                      paddingRight: 24,
                    }}
                  >
                    New Booking
                  </Button>
                </motion.div>
              </Col>
            </Row>
          </div>

          {/* Summary Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
              <Col xs={24} sm={8}>
                <div className="glass-summary-card" style={{ padding: "32px 24px", textAlign: "center" }}>
                  <div className="icon-wrapper">📊</div>
                  <Title level={4} style={{ margin: "8px 0 12px", color: "#64748b", fontSize: 16 }}>
                    Total Bookings
                  </Title>
                  <Text className="gradient-text stat-number">
                    {totalBookings}
                  </Text>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div className="glass-summary-card" style={{ padding: "32px 24px", textAlign: "center" }}>
                  <div className="icon-wrapper">💰</div>
                  <Title level={4} style={{ margin: "8px 0 12px", color: "#64748b", fontSize: 16 }}>
                    Total Revenue
                  </Title>
                  <Text className="gradient-text stat-number">
                    {formatAmount(totalRevenue)}
                  </Text>
                </div>
              </Col>

              <Col xs={24} sm={8}>
                <div className="glass-summary-card" style={{ padding: "32px 24px", textAlign: "center" }}>
                  <div className="icon-wrapper">📝</div>
                  <Title level={4} style={{ margin: "8px 0 12px", color: "#64748b", fontSize: 16 }}>
                    Total Advances
                  </Title>
                  <Text className="gradient-text stat-number">
                    {totalAdvances}
                  </Text>
                </div>
              </Col>
            </Row>
          </motion.div>

          {/* Table Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="glass-card" style={{ padding: 28 }}>
              <Table
                columns={columns}
                dataSource={bookings}
                loading={loading}
                rowKey="_id"
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} bookings`,
                  pageSizeOptions: ["10", "20", "50", "100"],
                  style: { marginTop: 24 }
                }}
                onChange={handleTableChange}
                scroll={{ x: 1400 }}
                bordered
                rowClassName={(record, index) =>
                  index % 2 === 0 ? "table-row-light" : "table-row-dark"
                }
              />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default ViewInflow;