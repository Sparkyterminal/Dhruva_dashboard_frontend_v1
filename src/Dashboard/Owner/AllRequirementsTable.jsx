/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Table,
  Input,
  Button,
  DatePicker,
  Select,
  Space,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
} from "antd";
import {
  EditOutlined,
  CheckOutlined,
  SearchOutlined,
  ReloadOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import Lottie from "lottie-react";
import homeIcon from "../../assets/home.json";
import completed from "../../assets/completed.json";
import total from "../../assets/total.json";
import pending from "../../assets/pending.json";

import { API_BASE_URL } from "../../../config";

const { Option } = Select;

const departmentsList = [
  { name: "Hennur Godown", id: "68fdf1cfe66ed5069ddb9f25" },
];

const AllRequirementsTable = () => {
  const user = useSelector((state) => state.user.value);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [editRowId, setEditRowId] = useState(null);
  const [editAmountPaid, setEditAmountPaid] = useState(null);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  // Calculate statistics
  const stats = {
    total: requirements.length,
    pending: requirements.filter((r) => r.status === "PENDING").length,
    completed: requirements.filter((r) => r.status === "COMPLETED").length,
  };

  const fetchRequirementsData = async (params = {}) => {
    setLoading(true);
    try {
      let query = [];
      if (params.search) query.push(`search=${params.search}`);
      if (params.due_date)
        query.push(`due_date=${params.due_date.format("YYYY-MM-DD")}`);
      if (params.department) query.push(`department=${params.department}`);
      const queryString = query.length ? `?${query.join("&")}` : "";
      const res = await axios.get(
        `${API_BASE_URL}request${queryString}`,
        config
      );
      setRequirements(res.data.items || []);
    } catch (err) {
      message.error("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
  }, []);

  const handleSearch = (e) => setSearch(e.target.value);
  const handleSearchSubmit = () =>
    fetchRequirementsData({
      search,
      due_date: selectedDate,
      department: selectedDept,
    });

  const handleDateChange = (date) => setSelectedDate(date);
  const handleDeptChange = (value) => setSelectedDept(value);

  const handleAmountPaidSave = async (row) => {
    if (editAmountPaid == null || isNaN(editAmountPaid)) {
      message.error("Please enter a valid number for amount paid");
      return;
    }
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { amount_paid: Number(editAmountPaid) },
        config
      );
      message.success("Amount paid updated");
      setEditRowId(null);
      fetchRequirementsData({
        search,
        due_date: selectedDate,
        department: selectedDept,
      });
    } catch (err) {
      message.error("Failed to update amount paid");
    }
  };

  const handleFullPaymentDone = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "COMPLETED" },
        config
      );
      message.success("Payment marked as completed");
      fetchRequirementsData({
        search,
        due_date: selectedDate,
        department: selectedDept,
      });
    } catch (err) {
      message.error("Failed to mark as completed");
    }
  };

  const handleReject = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "REJECTED" },
        config
      );
      message.success("Request marked as rejected");
      fetchRequirementsData({
        search,
        due_date: selectedDate,
        department: selectedDept,
      });
    } catch (err) {
      message.error("Failed to reject request");
    }
  };

  const handleAmountPaidEdit = (row) => {
    setEditRowId(row.id);
    setEditAmountPaid(row.amount_paid);
  };
  const handleAmountPaidChange = (e) => setEditAmountPaid(e.target.value);

  const columns = [
    {
      title: "Sl. No",
      key: "slno",
      width: 70,
      fixed: "left",
      render: (_, __, idx) => (
        <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
          {idx + 1}
        </span>
      ),
    },
    {
      title: "Requester",
      dataIndex: ["requested_by", "first_name"],
      key: "first_name",
      width: 120,
      render: (_, record) => (
        <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
          {record.requested_by?.first_name || "-"}
        </span>
      ),
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department",
      width: 150,
      render: (_, record) => (
        <Tag
          color="blue"
          style={{ borderRadius: 6, fontWeight: 700, fontSize: 14 }}
        >
          {record.department?.name || "-"}
        </Tag>
      ),
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
      width: 200,
      // ellipsis: true,
      render: (text) => (
        <span
          style={{
            fontWeight: 700,
            fontSize: 18,
            color: "#000",
            whiteSpace: "normal",
            wordBreak: "break-word",
            display: "inline-block",
            maxWidth: 200,
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (amt) => (
        <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
          {amt?.toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
          })}
        </span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => (
        <Tag
          color={
            priority === "HIGH"
              ? "#fee2e2"
              : priority === "MEDIUM"
              ? "#fef3c7"
              : "#d1fae5"
          }
          style={{
            color:
              priority === "HIGH"
                ? "#991b1b"
                : priority === "MEDIUM"
                ? "#92400e"
                : "#065f46",
            borderRadius: 6,
            border: "none",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          {priority}
        </Tag>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      width: 120,
      render: (date, record) => {
        const isOverdue =
          date &&
          dayjs(date).isBefore(dayjs(), "day") &&
          record.status === "PENDING";
        return date ? (
          <span
            style={{
              color: isOverdue ? "#dc2626" : "#555",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            {dayjs(date).format("DD-MM-YYYY")}
          </span>
        ) : (
          "-"
        );
      },
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 150,
      render: (date) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          {date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "-"}
        </span>
      ),
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 180,
      render: (amount_paid, row) =>
        row.status === "COMPLETED" || row.status === "REJECTED" ? (
          <span style={{ color: "#555", fontWeight: 700, fontSize: 18 }}>
            {amount_paid?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ) : row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 100, fontWeight: 600, fontSize: 18 }}
              value={editAmountPaid}
              onChange={handleAmountPaidChange}
              size="small"
            />
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleAmountPaidSave(row)}
              style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
            />
          </Space>
        ) : (
          <Space>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
              {amount_paid?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              }) || "₹0"}
            </span>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleAmountPaidEdit(row)}
            />
          </Space>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      fixed: "right",
      render: (_, row) => (
        <Space>
          <Button
            type="primary"
            size="small"
            disabled={row.status !== "PENDING" || row.amount_paid >= row.amount}
            onClick={() => handleFullPaymentDone(row)}
            icon={<CheckCircleOutlined />}
            style={{
              background:
                row.status === "PENDING" && row.amount_paid < row.amount
                  ? "#10b981"
                  : undefined,
              borderColor:
                row.status === "PENDING" && row.amount_paid < row.amount
                  ? "#10b981"
                  : undefined,
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Complete
          </Button>
          <Button
            danger
            size="small"
            disabled={row.status !== "PENDING"}
            onClick={() => handleReject(row)}
            icon={<CloseCircleOutlined />}
            style={{ fontWeight: 700, fontSize: 18 }}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const rowClassName = (record) => {
    if (record.status === "COMPLETED") return "completed-row";
    if (record.status === "REJECTED") return "rejected-row";
    if (record.due_date && dayjs(record.due_date).isBefore(dayjs(), "day")) {
      return "overdue-row";
    }
    return "";
  };

  return (
    <div className="min-h-screen w-full bg-[#fefcff] relative">
      {/* Dreamy Sky Pink Glow */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 30% 70%, rgba(173, 216, 230, 0.35), transparent 60%),
            radial-gradient(circle at 70% 30%, rgba(255, 182, 193, 0.4), transparent 60%)`,
        }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Cormorant Garamond', serif;
        }
        
        .overdue-row {
          background: #fef2f2 !important;
          border-left: 3px solid #fca5a5 !important;
        }
        .completed-row {
          background: #f0fdf4 !important;
          opacity: 0.85;
        }
        .rejected-row {
          background: #fef2f2 !important;
          opacity: 0.75;
        }
        .stat-card {
          transition: all 0.3s ease;
          border-radius: 16px;
          border: 1px solid transparent;
          background: linear-gradient(135deg, #ffafbd 0%, #ffc3a0 100%);
          color: #1f2937;
          font-weight: 700;
          font-size: 20px;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 175, 189, 0.5);
        }
        .back-button {
          transition: all 0.3s ease;
          border-radius: 12px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .back-button:hover {
          transform: translateX(-4px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }
        .ant-table-thead > tr > th {
          background: #1d174c !important;
          color: #fff !important;
          font-size: 18px !important;
          font-weight: 700 !important;
          border-bottom: 2px solid #e5e7eb !important;
        }
        .ant-table-tbody > tr > td {
          color: #000 !important;
          font-size: 18px !important;
          font-weight: 700 !important;
        }
        .filter-section {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
      `}</style>

      <div
        style={{
          padding: "32px",
          background: "transparent",
          minHeight: "100vh",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Back Button */}
        <div>
          <Button
            className="back-button"
            onClick={() => (window.location.href = "/")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 48,
              padding: "0 20px",
              fontSize: 16,
            }}
          >
            <div style={{ width: 32, height: 32, marginRight: 8 }}>
              <Lottie animationData={homeIcon} loop={true} />
            </div>
            <span style={{ fontWeight: 500 }}>Back</span>
          </Button>
        </div>

        {/* Centered Heading */}
        <h1
          style={{
            textAlign: "center",
            fontSize: 48,
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}
        >
          Requirements Dashboard
        </h1>

        {/* Statistics Cards - Smaller width and colorful */}
        <Row
          gutter={[24, 24]}
          style={{
            marginBottom: 32,
            maxWidth: 900,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <Col xs={24} sm={8}>
            <Card
              className="stat-card"
              hoverable
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderColor: "transparent",
                color: "#ffffff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div style={{ width: 40, height: 40, flexShrink: 0 }}>
                  <Lottie animationData={total} loop={true} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: 8,
                    }}
                  >
                    Total Requests
                  </div>
                  <div
                    style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
                  >
                    {stats.total}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              className="stat-card"
              hoverable
              style={{
                background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                borderColor: "transparent",
                color: "#ffffff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div style={{ width: 40, height: 40, flexShrink: 0 }}>
                  <Lottie animationData={pending} loop={true} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: 8,
                    }}
                  >
                    Pending
                  </div>
                  <div
                    style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
                  >
                    {stats.pending}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card
              className="stat-card"
              hoverable
              style={{
                background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                borderColor: "transparent",
                color: "#ffffff",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
              >
                <div style={{ width: 40, height: 40, flexShrink: 0 }}>
                  <Lottie animationData={completed} loop={true} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#ffffff",
                      marginBottom: 8,
                    }}
                  >
                    Completed
                  </div>
                  <div
                    style={{ color: "#ffffff", fontSize: 34, fontWeight: 700 }}
                  >
                    {stats.completed}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <div className="filter-section" style={{ marginBottom: 24 }}>
          <Space size="middle" wrap style={{ width: "100%" }}>
            <Input
              placeholder="Search requirements..."
              value={search}
              onChange={handleSearch}
              onPressEnter={handleSearchSubmit}
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              style={{ width: 240, borderRadius: 8 }}
              size="large"
            />
            <DatePicker
              placeholder="Due date"
              value={selectedDate}
              onChange={handleDateChange}
              allowClear
              style={{ width: 180, borderRadius: 8 }}
              size="large"
            />
            <Select
              placeholder="Department"
              value={selectedDept}
              onChange={handleDeptChange}
              allowClear
              style={{ width: 180, borderRadius: 8 }}
              size="large"
            >
              {departmentsList.map((dept) => (
                <Option value={dept.id} key={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
            <Button
              type="primary"
              size="large"
              onClick={handleSearchSubmit}
              icon={<SearchOutlined />}
              style={{
                borderRadius: 8,
                background: "#3b82f6",
                borderColor: "#3b82f6",
              }}
            >
              Search
            </Button>
            <Button
              size="large"
              onClick={() => {
                setSearch("");
                setSelectedDate(null);
                setSelectedDept(null);
                fetchRequirementsData();
              }}
              icon={<ReloadOutlined />}
              style={{ borderRadius: 8 }}
            >
              Reset
            </Button>
          </Space>
        </div>

        {/* Table */}
        <Card
          variant={false}
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <Table
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={requirements}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} requirements`,
              showSizeChanger: true,
            }}
            scroll={{ x: 1500 }}
            variant
            size="middle"
            rowClassName={rowClassName}
          />
        </Card>
      </div>
    </div>
  );
};

export default AllRequirementsTable;
