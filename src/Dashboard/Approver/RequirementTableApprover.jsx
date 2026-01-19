/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import {
  Table,
  Input,
  Button,
  Space,
  message,
  Card,
  Row,
  Col,
  Tag,
  Collapse,
  DatePicker,
} from "antd";
import {
  EditOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { API_BASE_URL } from "../../../config";

const { Panel } = Collapse;

const RequirementTableApprover = () => {
  const user = useSelector((state) => state.user.value);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Editable row IDs and values for planned_amount, amount_paid, and approver_amount
  const [editRowId, setEditRowId] = useState(null);
  const [editPlannedAmount, setEditPlannedAmount] = useState(null);
  const [editAmountPaid, setEditAmountPaid] = useState(null);
  const [editApproverAmount, setEditApproverAmount] = useState(null);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  // Calculate statistics
  const stats = {
    total: requirements.length,
    pending: requirements.filter((r) => r.status === "PENDING").length,
    completed: requirements.filter((r) => r.status === "COMPLETED").length,
  };

  const fetchRequirementsData = async (searchQuery = "", date = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (date) params.append("singleDate", date);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const res = await axios.get(
        `${API_BASE_URL}request${queryString}`,
        config,
      );
      setRequirements(res.data.items || []);
    } catch (err) {
      message.error("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData("", dayjs().format("YYYY-MM-DD"));
  }, []);

  useEffect(() => {
    // Fetch data on each search input change with a slight debounce
    const timeoutId = setTimeout(() => {
      fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      );
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, selectedDate]);

  // Group requirements by department id
  const requirementsByDept = requirements.reduce((acc, req) => {
    const deptId = req.department?.id || "unknown";
    if (!acc[deptId]) acc[deptId] = { department: req.department, items: [] };
    acc[deptId].items.push(req);
    return acc;
  }, {});

  const sortedRequirements = (list) => {
    return [...list].sort((a, b) => {
      const statusOrder = {
        PENDING: 0,
        COMPLETED: 1,
        REJECTED: 1,
      };
      const statusA = statusOrder[a.status] ?? 0;
      const statusB = statusOrder[b.status] ?? 0;
      return statusA - statusB;
    });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Start editing planned_amount, amount_paid, and approver_amount for a row
  const handleEditClick = (row) => {
    setEditRowId(row.id);
    setEditPlannedAmount(row.planned_amount ?? "");
    setEditAmountPaid(row.amount_paid ?? "");
    setEditApproverAmount(row.approver_amount ?? "");
  };
  const handlePlannedAmountChange = (e) => setEditPlannedAmount(e.target.value);
  const handleAmountPaidChange = (e) => setEditAmountPaid(e.target.value);
  const handleApproverAmountChange = (e) =>
    setEditApproverAmount(e.target.value);

  // Save the editable fields: planned_amount, amount_paid, and approver_amount
  const handleSaveClick = async (row) => {
    const planned = Number(editPlannedAmount);
    const paid = Number(editAmountPaid);
    const approved = Number(editApproverAmount);
    if (isNaN(planned) || planned < 0) {
      message.error("Please enter a valid planned amount");
      return;
    }
    if (isNaN(paid) || paid < 0) {
      message.error("Please enter a valid amount paid");
      return;
    }
    if (isNaN(approved) || approved < 0) {
      message.error("Please enter a valid approved amount");
      return;
    }

    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        {
          planned_amount: planned,
          amount_paid: paid,
          approver_amount: approved,
        },
        config,
      );
      message.success("Updated successfully");
      setEditRowId(null);
      fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      );
    } catch (err) {
      message.error("Failed to update amounts");
    }
  };

  const handleComplete = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "COMPLETED" },
        config,
      );
      message.success("Request marked as completed");
      fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      );
    } catch (err) {
      message.error("Failed to mark as completed");
    }
  };

  const handleReject = async (row) => {
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { status: "REJECTED" },
        config,
      );
      message.success("Request marked as rejected");
      fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      );
    } catch (err) {
      message.error("Failed to reject request");
    }
  };

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
      title: "Requested At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          {date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "-"}
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
          style={{ borderRadius: 6, fontWeight: 700, fontSize: 12 }}
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
      title: "Vendor Name",
      dataIndex: ["vendor", "name"],
      key: "vendor_name",
      width: 150,
      render: (_, record) => (
        <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
          {record.vendor?.name || "-"}
        </span>
      ),
    },
    {
      title: "Event Reference",
      dataIndex: "event_reference",
      key: "event_reference",
      width: 150,
      render: (text) => (
        <span style={{ fontWeight: 700, fontSize: 18, color: "#000" }}>
          {text || "-"}
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
    // {
    //   title: "Priority",
    //   dataIndex: "priority",
    //   key: "priority",
    //   width: 100,
    //   render: (priority) => (
    //     <Tag
    //       color={
    //         priority === "HIGH"
    //           ? "#fee2e2"
    //           : priority === "MEDIUM"
    //           ? "#fef3c7"
    //           : "#d1fae5"
    //       }
    //       style={{
    //         color:
    //           priority === "HIGH"
    //             ? "#991b1b"
    //             : priority === "MEDIUM"
    //             ? "#92400e"
    //             : "#065f46",
    //         borderRadius: 6,
    //         border: "none",
    //         fontWeight: 700,
    //         fontSize: 16,
    //       }}
    //     >
    //       {priority}
    //     </Tag>
    //   ),
    // },
    // {
    //   title: "Updated At",
    //   dataIndex: "updatedAt",
    //   key: "updatedAt",
    //   width: 150,
    //   render: (date) => (
    //     <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
    //       {date ? dayjs(date).format("DD-MM-YYYY HH:mm") : "-"}
    //     </span>
    //   ),
    // },
    {
      title: "Planned Amount",
      dataIndex: "planned_amount",
      key: "planned_amount",
      width: 180,
      render: (planned_amount, row) =>
        row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 120, fontWeight: 600, fontSize: 18 }}
              value={editPlannedAmount}
              onChange={handlePlannedAmountChange}
              size="small"
            />
          </Space>
        ) : (
          <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
            {planned_amount?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ),
    },
    {
      title: "Approved Amount",
      dataIndex: "approver_amount",
      key: "approver_amount",
      width: 180,
      render: (approver_amount, row) =>
        row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 120, fontWeight: 600, fontSize: 18 }}
              value={editApproverAmount}
              onChange={handleApproverAmountChange}
              size="small"
            />
          </Space>
        ) : (
          <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
            {approver_amount?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ),
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 180,
      render: (amount_paid, row) =>
        row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 120, fontWeight: 600, fontSize: 18 }}
              value={editAmountPaid}
              onChange={handleAmountPaidChange}
              size="small"
            />
          </Space>
        ) : (
          <span style={{ fontWeight: 700, color: "#000", fontSize: 18 }}>
            {amount_paid?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || "₹0"}
          </span>
        ),
    },

    {
      title: "Approver Check",
      dataIndex: "approver_check",
      key: "approver_check",
      width: 200,
      render: (_, row) => {
        if (row.approver_check === "PENDING") {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => handleComplete(row)}
                icon={<CheckCircleOutlined />}
                style={{ background: "#10b981", borderColor: "#10b981" }}
              >
                Approved
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleReject(row)}
                icon={<CloseCircleOutlined />}
              >
                Rejected
              </Button>
            </Space>
          );
        } else if (row.approver_check === "APPROVED") {
          return (
            <Tag
              color="#34d399"
              style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
            >
              Approved
            </Tag>
          );
        } else if (row.approver_check === "REJECTED") {
          return (
            <Tag
              color="#f87171"
              style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
            >
              Rejected
            </Tag>
          );
        }
        return "-";
      },
    },
    {
      title: "Accounts Check",
      dataIndex: "accounts_check",
      key: "accounts_check",
      width: 140,
      render: (val) => (
        <Tag
          color={
            val === "APPROVED"
              ? "#34d399"
              : val === "PENDING"
                ? "#fbbf24"
                : "#f87171"
          }
          style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
        >
          {val || "-"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      fixed: "right",
      render: (_, row) => {
        if (row.id === editRowId) {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => handleSaveClick(row)}
                icon={<CheckOutlined />}
              >
                Save
              </Button>
            </Space>
          );
        } else {
          return (
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditClick(row)}
            />
          );
        }
      },
    },
  ];

  const rowClassName = (record) => {
    if (record.status === "COMPLETED") return "completed-row";
    if (record.status === "REJECTED") return "rejected-row";
    return "";
  };

  // Header for each accordion panel with counts
  const getPanelHeader = (deptObj) => {
    const items = deptObj.items;
    const approvedCount = items.filter(
      (r) => r.approver_check === "APPROVED",
    ).length;
    const pendingCount = items.filter(
      (r) => r.approver_check === "PENDING",
    ).length;
    const rejectedCount = items.filter(
      (r) => r.approver_check === "REJECTED",
    ).length;

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontWeight: 600,
          fontSize: 20,
          color: "#fff",
          padding: "0 12px",
          alignItems: "center",
          height: "46px",
          borderRadius: "12px",
        }}
      >
        <span>{deptObj.department?.name || "Unknown Department"}</span>
        <span>
          Approved: {approvedCount} | Pending: {pendingCount} | Rejected:{" "}
          {rejectedCount}
        </span>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen w-full relative"
      style={{ background: "transparent" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        * {
          font-family: 'Cormorant Garamond', serif;
        }
        .completed-row {
          background: #f0fdf4 !important;
          opacity: 0.85;
        }
        .rejected-row {
          background: #fef2f2 !important;
          opacity: 0.75;
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
        .ant-collapse-item {
          border-radius: 12px;
          margin-bottom: 12px;
          overflow: hidden;
          border: none !important;
        }
        .ant-collapse-header {
          background: linear-gradient(135deg, #7b2ff7, #f107a3);
          color: white !important;
          font-weight: 700;
          font-size: 20px;
          border-radius: 12px;
          padding: 0 12px !important;
        }
        .ant-collapse-content {
          background: linear-gradient(180deg, #d8b4fe 0%, #fbcfe8 100%);
          border-radius: 0 0 12px 12px;
          padding: 12px !important;
        }
        .ant-collapse-arrow svg {
          fill: white;
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
          Request's Dashboard
        </h1>

        {/* Statistics Cards */}
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

        {/* Search and Date Filter */}
        <div
          className="filter-section"
          style={{
            marginBottom: 24,
            background: "#fff",
            padding: 24,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Input
            placeholder="Search requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
            style={{ width: 320, borderRadius: 8 }}
            size="large"
          />
          <DatePicker
            value={selectedDate}
            onChange={handleDateChange}
            format="DD-MM-YYYY"
            style={{ width: 200, borderRadius: 8 }}
            size="large"
            placeholder="Select date"
          />
        </div>

        {/* Accordion grouped by department */}
        <Collapse
          accordion={false}
          bordered={false}
          expandIconPosition="end"
          defaultActiveKey={Object.keys(requirementsByDept)} // expand all by default
        >
          {Object.entries(requirementsByDept).map(([deptId, deptObj]) => (
            <Panel key={deptId} header={getPanelHeader(deptObj)}>
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={sortedRequirements(deptObj.items)}
                pagination={false} // No pagination as requested
                scroll={{ x: 1600 }}
                size="middle"
                rowClassName={rowClassName}
              />
            </Panel>
          ))}
        </Collapse>
      </div>
    </div>
  );
};

export default RequirementTableApprover;
