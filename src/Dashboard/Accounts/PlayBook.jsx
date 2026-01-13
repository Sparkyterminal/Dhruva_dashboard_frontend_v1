/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../../config";
import { message, Table, Tag } from "antd";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const customStyles = `
  .glass-card {
    background: rgba(255, 255, 255, 0.75);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.12);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }

  .gradient-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1rem;
    padding: 1.5rem;
    color: white;
  }

  .custom-table .ant-table {
    background: transparent;
    font-family: 'cormoreg', sans-serif;
  }

  .custom-table .ant-table-thead > tr > th {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    border: none;
    font-size: 14px;
    padding: 16px 12px;
  }

  .custom-table .ant-table-tbody > tr > td {
    border-bottom: 1px solid rgba(139, 92, 246, 0.1);
    padding: 14px 12px;
    font-size: 14px;
  }

  .custom-table .ant-table-tbody > tr:hover > td {
    background: rgba(102, 126, 234, 0.05);
  }

  .custom-table .ant-table-container {
    border-radius: 1rem;
    overflow: hidden;
  }

  .custom-table .ant-table-footer {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
    border-radius: 0 0 1rem 1rem;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }

  .float-animation {
    animation: float 3s ease-in-out infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .shimmer {
    animation: shimmer 2s infinite;
    background: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
    background-size: 1000px 100%;
  }
`;

const PlayBook = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  console.log("user", user);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchRequirementsData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}request/all`, config);
      console.log("requirements data", res.data);
      setRequests(res.data.items || res.data || []);
    } catch (err) {
      message.error("Failed to fetch requirements");
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
    // eslint-disable-next-line
  }, []);

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING: "orange",
      APPROVED: "green",
      REJECTED: "red",
      COMPLETED: "blue",
      IN_PROGRESS: "purple",
    };
    return statusColors[status?.toUpperCase()] || "default";
  };

  const getPriorityColor = (priority) => {
    const priorityColors = {
      HIGH: "red",
      MEDIUM: "orange",
      LOW: "green",
      URGENT: "volcano",
    };
    return priorityColors[priority?.toUpperCase()] || "default";
  };

  const columns = [
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      fixed: "left",
      width: 180,
      render: (text) => (
        <span className="font-semibold text-gray-800">{text}</span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => a.amount - b.amount,
      width: 130,
      render: (amount) => (
        <span className="font-bold text-indigo-600">
          ₹{amount?.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Requested By",
      key: "requested_by",
      width: 200,
      render: (_, record) =>
        `${record.requested_by?.first_name || ""} ${
          record.requested_by?.last_name || ""
        } (${record.requested_by?.designation || ""})`,
    },
    {
      title: "Department",
      key: "department",
      width: 150,
      render: (_, record) => (
        <Tag color="cyan">{record.department?.name || ""}</Tag>
      ),
    },
    {
      title: "Vendor",
      key: "vendor",
      width: 150,
      render: (_, record) => record.vendor?.name || "-",
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 130,
      render: (amount) =>
        amount ? (
          <span className="font-semibold text-green-600">
            ₹{amount?.toLocaleString()}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "Planned Amount",
      dataIndex: "planned_amount",
      key: "planned_amount",
      width: 140,
      render: (amount) =>
        amount ? (
          <span className="font-semibold text-purple-600">
            ₹{amount?.toLocaleString()}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 160,
      render: (text) =>
        text
          ? new Date(text).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
    },
  ];

  // Calculate totals
  const totalAmount = requests.reduce((sum, req) => sum + (req.amount || 0), 0);
  const totalAmountPaid = requests.reduce(
    (sum, req) => sum + (req.amount_paid || 0),
    0
  );
  const totalPlannedAmount = requests.reduce(
    (sum, req) => sum + (req.planned_amount || 0),
    0
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative font-[cormoreg]">
      <style>{customStyles}</style>

      {/* Animated Gradient Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            `radial-gradient(circle at 15% 85%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/user")}
            className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 font-semibold text-indigo-600"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </motion.button>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            DayBook
          </motion.h1>

          <div className="w-24" />
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="gradient-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-xs font-medium mb-1">
                  Total Requests
                </p>
                <p className="text-3xl font-bold">{requests.length}</p>
              </div>
              <div className="float-animation">
                <svg
                  className="w-12 h-12 text-white/30"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">
                  Total Amount Requested
                </p>
                <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ₹{totalAmount.toLocaleString()}
                </p>
              </div>
              <div className="float-animation">
                <svg
                  className="w-12 h-12 text-indigo-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">
                  Planned Amount
                </p>
                <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  ₹{totalPlannedAmount.toLocaleString()}
                </p>
              </div>
              <div className="float-animation">
                <svg
                  className="w-12 h-12 text-purple-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path
                    fillRule="evenodd"
                    d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium mb-1">
                  Amount Paid
                </p>
                <p className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  ₹{totalAmountPaid.toLocaleString()}
                </p>
              </div>
              <div className="float-animation">
                <svg
                  className="w-12 h-12 text-green-200"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="glass-card p-6 custom-table"
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600 font-semibold">
                Loading playbook data...
              </p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-24 h-24 mx-auto text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-600 font-semibold text-lg">
                No requests found
              </p>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={requests}
              rowKey={(record) => record.id}
              loading={loading}
              bordered={false}
              pagination={false}
              scroll={{ x: "max-content" }}
              footer={() => (
                <div className="flex flex-wrap gap-6 justify-center md:justify-end px-4 py-3">
                  <div className="text-center">
                    <div className="text-white/80 text-xs mb-1">
                      Total Amount
                    </div>
                    <div className="text-xl font-bold text-white">
                      ₹{totalAmount.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/80 text-xs mb-1">Total Paid</div>
                    <div className="text-xl font-bold text-white">
                      ₹{totalAmountPaid.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/80 text-xs mb-1">
                      Total Planned
                    </div>
                    <div className="text-xl font-bold text-white">
                      ₹{totalPlannedAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PlayBook;
