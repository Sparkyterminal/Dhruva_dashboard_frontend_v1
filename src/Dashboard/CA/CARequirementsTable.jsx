/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Table,
  Button,
  message,
  Tag,
  Space,
  Input,
  DatePicker,
  Collapse,
  Select,
  Spin,
  Card,
  Row,
  Col,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  CheckOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../../config";

const { Panel } = Collapse;
const { Option } = Select;

const CARequirementsTable = () => {
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
  const [editEntityAccount, setEditEntityAccount] = useState(null);
  const [editAmountPaidTo, setEditAmountPaidTo] = useState(null);
  const [approvingId, setApprovingId] = useState(null);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  // Calculate statistics (CA context: completed = CA approved, pending = CA pending)
  const stats = {
    total: requirements.length,
    pending: requirements.filter((r) => r.ca_check === "PENDING").length,
    completed: requirements.filter((r) => r.ca_check === "APPROVED").length,
    caRejected: requirements.filter((r) => r.ca_check === "REJECTED").length,
  };

  const fetchRequirementsData = async (searchQuery = "", date = null) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}request/all`;
      const params = new URLSearchParams();

      if (searchQuery) params.append("search", searchQuery);
      if (date) params.append("date", date);

      if (params.toString()) url += `?${params.toString()}`;

      const res = await axios.get(url, config);
      setRequirements(res.data.items || []);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      );
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line
  }, [search, selectedDate]);

  // Group requirements by department id
  const requirementsByDept = requirements.reduce((acc, req) => {
    const deptId = req.department?.id || "no-dept";
    if (!acc[deptId]) {
      acc[deptId] = {
        department: req.department,
        requirements: [],
      };
    }
    acc[deptId].requirements.push(req);
    return acc;
  }, {});

  const sortedRequirements = (list) => {
    return list.sort((a, b) => {
      const priorityOrder = { HIGH: 1, MEDIUM: 2, LOW: 3 };
      return (
        priorityOrder[a.priority || "LOW"] - priorityOrder[b.priority || "LOW"]
      );
    });
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Start editing planned_amount, amount_paid, and approver_amount for a row
  const handleEditClick = (row) => {
    setEditRowId(row.id);
    setEditPlannedAmount(row.planned_amount || "");
    setEditAmountPaid(row.amount_paid || "");
    setEditApproverAmount(row.approver_amount || "");
    setEditEntityAccount(row.entity_account || "");
    setEditAmountPaidTo(row.amount_paid_to || "");
  };

  const handlePlannedAmountChange = (e) => setEditPlannedAmount(e.target.value);
  const handleAmountPaidChange = (e) => setEditAmountPaid(e.target.value);
  const handleApproverAmountChange = (e) =>
    setEditApproverAmount(e.target.value);
  const handleEntityAccountChange = (value) => setEditEntityAccount(value);
  const handleAmountPaidToChange = (e) => setEditAmountPaidTo(e.target.value);

  // Save the editable fields: planned_amount, amount_paid, and approver_amount
  const handleSaveClick = async (row) => {
    try {
      const payload = {
        planned_amount: parseFloat(editPlannedAmount) || row.planned_amount,
        amount_paid: parseFloat(editAmountPaid) || row.amount_paid,
        approver_amount: parseFloat(editApproverAmount) || row.approver_amount,
        entity_account: editEntityAccount || row.entity_account,
        amount_paid_to: editAmountPaidTo || row.amount_paid_to,
      };

      await axios.patch(`${API_BASE_URL}request/${row.id}`, payload, config);

      message.success("Updated successfully ✅");
      setEditRowId(null);
      fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to update ❌");
    }
  };

  const handleComplete = async (row) => {
    setApprovingId(row.id);
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { ca_check: "APPROVED", ca_approved: true },
        config,
      );
      message.success("CA Approved ✅");
      await fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to approve ❌");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (row) => {
    setApprovingId(row.id);
    try {
      await axios.patch(
        `${API_BASE_URL}request/${row.id}`,
        { ca_check: "REJECTED", ca_approved: false },
        config,
      );
      message.success("CA Rejected ❌");
      await fetchRequirementsData(
        search,
        selectedDate ? selectedDate.format("YYYY-MM-DD") : null,
      );
    } catch (err) {
      console.error(err);
      message.error("Failed to reject ❌");
    } finally {
      setApprovingId(null);
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
      render: (val) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          {val || "-"}
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
          {text?.clientName || "-"}
        </span>
      ),
    },
    {
      title: "Required Date",
      dataIndex: "required_date",
      key: "required_date",
      width: 150,
      render: (date) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          {date ? dayjs(date).format("DD-MM-YYYY") : "-"}
        </span>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 120,
      render: (val) => (
        <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
          ₹{val || 0}
        </span>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 120,
      render: (priority) => (
        <Tag
          color={
            priority === "HIGH"
              ? "#fee2e2"
              : priority === "MEDIUM"
                ? "#fef3c7"
                : "#dbeafe"
          }
          style={{
            color:
              priority === "HIGH"
                ? "#991b1b"
                : priority === "MEDIUM"
                  ? "#92400e"
                  : "#1e40af",
            borderRadius: 6,
            border: "none",
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {priority || "-"}
        </Tag>
      ),
    },
    {
      title: "Planned Amount",
      dataIndex: "planned_amount",
      key: "planned_amount",
      width: 180,
      render: (val, row) => {
        if (editRowId === row.id) {
          return (
            <Input
              value={editPlannedAmount}
              onChange={handlePlannedAmountChange}
              placeholder="Planned Amount"
              type="number"
              style={{ width: 140 }}
            />
          );
        }
        return (
          <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
            ₹{val || 0}
          </span>
        );
      },
    },
    {
      title: "Approver Amount",
      dataIndex: "approver_amount",
      key: "approver_amount",
      width: 180,
      render: (val, row) => {
        if (editRowId === row.id) {
          return (
            <Input
              value={editApproverAmount}
              onChange={handleApproverAmountChange}
              placeholder="Approver Amount"
              type="number"
              style={{ width: 140 }}
            />
          );
        }
        return (
          <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
            ₹{val || 0}
          </span>
        );
      },
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      width: 180,
      render: (val, row) => {
        if (editRowId === row.id) {
          return (
            <Input
              value={editAmountPaid}
              onChange={handleAmountPaidChange}
              placeholder="Amount Paid"
              type="number"
              style={{ width: 140 }}
            />
          );
        }
        return (
          <span style={{ fontSize: 18, color: "#000", fontWeight: 700 }}>
            ₹{val || 0}
          </span>
        );
      },
    },

    {
      title: "Entity Account",
      dataIndex: "entity_account",
      key: "entity_account",
      width: 220,
      render: (val, row) => {
        if (editRowId === row.id) {
          return (
            <Select
              value={editEntityAccount}
              onChange={handleEntityAccountChange}
              placeholder="Select Entity Account"
              style={{ width: 200 }}
            >
              <Option value="Blue Pulse Ventures Pvt Lmtd.">
                Blue Pulse Ventures Pvt Lmtd.
              </Option>
              <Option value="Nandini Multipurpose Pvt Lmtd.">
                Nandini Multipurpose Pvt Lmtd.
              </Option>
              <Option value="Sky Blue Event Management India Pvt Lmtd.">
                Sky Blue Event Management India Pvt Lmtd.
              </Option>
              <Option value="Dhrua Kumar H P">Dhrua Kumar H P</Option>
            </Select>
          );
        }
        return (
          <span style={{ fontSize: 16, color: "#000", fontWeight: 700 }}>
            {val || "-"}
          </span>
        );
      },
    },
    {
      title: "Amount Paid To",
      dataIndex: "amount_paid_to",
      key: "amount_paid_to",
      width: 180,
      render: (val, row) => {
        if (editRowId === row.id) {
          return (
            <Input
              value={editAmountPaidTo}
              onChange={handleAmountPaidToChange}
              placeholder="Amount Paid To"
              style={{ width: 160 }}
            />
          );
        }
        return (
          <span style={{ fontSize: 16, color: "#000", fontWeight: 700 }}>
            {val || "-"}
          </span>
        );
      },
    },
    {
      title: "Approver Check",
      dataIndex: "approver_check",
      key: "approver_check",
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
          {val || "PENDING"}
        </Tag>
      ),
    },
    {
      title: "CA Check",
      dataIndex: "ca_check",
      key: "ca_check",
      width: 200,
      render: (_, row) => {
        const isApproving = approvingId === row.id;
        if (row.ca_check === "PENDING") {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                loading={isApproving}
                disabled={isApproving}
                onClick={() => handleComplete(row)}
                icon={<CheckCircleOutlined />}
                style={{ background: "#10b981", borderColor: "#10b981" }}
              >
                Approve
              </Button>
              <Button
                danger
                size="small"
                loading={isApproving}
                disabled={isApproving}
                onClick={() => handleReject(row)}
                icon={<CloseCircleOutlined />}
              >
                Reject
              </Button>
            </Space>
          );
        } else if (row.ca_check === "APPROVED") {
          return (
            <Tag
              color="#34d399"
              style={{ fontWeight: 700, fontSize: 16, borderRadius: 6 }}
            >
              Approved
            </Tag>
          );
        } else if (row.ca_check === "REJECTED") {
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
      title: "Owner Check",
      dataIndex: "owner_check",
      key: "owner_check",
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (val) => (
        <Tag
          color={
            val === "COMPLETED"
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
      width: 100,
      fixed: "right",
      render: (_, row) => {
        if (editRowId === row.id) {
          return (
            <Button
              type="primary"
              size="small"
              onClick={() => handleSaveClick(row)}
              icon={<CheckOutlined />}
            >
              Save
            </Button>
          );
        }
        return (
          <Button
            type="default"
            size="small"
            onClick={() => handleEditClick(row)}
            icon={<EditOutlined />}
          >
            Edit
          </Button>
        );
      },
    },
  ];

  const rowClassName = (record) => {
    if (record.status === "COMPLETED") return "ca-row-completed";
    if (record.status === "REJECTED") return "ca-row-rejected";
    if (record.ca_check === "APPROVED") return "ca-row-ca-approved";
    return "";
  };

  const getPanelHeader = (deptObj) => {
    const items = deptObj.requirements;
    const approvedCount = items.filter((r) => r.ca_check === "APPROVED").length;
    const pendingCount = items.filter((r) => r.ca_check === "PENDING").length;
    const rejectedCount = items.filter((r) => r.ca_check === "REJECTED").length;
    return (
      <div className="ca-panel-header">
        <span>{deptObj.department?.name || "No Department"}</span>
        <span>
          CA Approved: {approvedCount} · Pending: {pendingCount} · Rejected:{" "}
          {rejectedCount}
        </span>
      </div>
    );
  };

  return (
    <div className="ca-requirements-page">
      <style>{`
        .ca-requirements-page {
          min-height: 100vh;
          background: transparent;
          position: relative;
        }
        .ca-requirements-page .ca-content {
          padding: 32px;
          min-height: 100vh;
          position: relative;
          z-index: 10;
        }
        .ca-requirements-page .ca-title {
          text-align: center;
          font-size: 42px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }
        .ca-requirements-page .ca-subtitle {
          text-align: center;
          font-size: 16px;
          color: #6b7280;
          margin-bottom: 32px;
        }
        .ca-requirements-page .ant-table-thead > tr > th {
          background: #0f172a !important;
          color: #fff !important;
          font-size: 15px !important;
          font-weight: 600 !important;
          border-bottom: 2px solid #e2e8f0 !important;
          padding: 14px 12px !important;
        }
        .ca-requirements-page .ant-table-tbody > tr > td {
          font-size: 15px !important;
          font-weight: 500 !important;
          padding: 12px !important;
        }
        .ca-requirements-page .ant-table-tbody > tr:hover > td {
          background: #f8fafc !important;
        }
        .ca-requirements-page .ca-row-completed {
          background: #f0fdf4 !important;
        }
        .ca-requirements-page .ca-row-rejected {
          background: #fef2f2 !important;
        }
        .ca-requirements-page .ca-row-ca-approved {
          background: #ecfdf5 !important;
        }
        .ca-requirements-page .ant-collapse-item {
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .ca-requirements-page .ant-collapse-header {
          background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
          color: #fff !important;
          font-weight: 600;
          font-size: 17px;
          border-radius: 12px;
          padding: 14px 16px !important;
          align-items: center !important;
        }
        .ca-requirements-page .ant-collapse-arrow {
          color: #fff !important;
        }
        .ca-requirements-page .ant-collapse-arrow svg {
          fill: #fff;
        }
        .ca-requirements-page .ant-collapse-content {
          background: #fff;
          border-radius: 0 0 12px 12px;
          border: 1px solid #e2e8f0;
          border-top: none;
        }
        .ca-requirements-page .ant-collapse-content-box {
          padding: 16px !important;
        }
        .ca-requirements-page .ca-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding-right: 24px;
        }
        .ca-requirements-page .ca-panel-header span:last-child {
          font-size: 14px;
          opacity: 0.95;
          font-weight: 500;
        }
        .ca-requirements-page .ca-filter-card {
          margin-bottom: 24px;
          padding: 20px 24px;
          border-radius: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          border: 1px solid #e5e7eb;
        }
        .ca-requirements-page .ca-stat-card {
          border-radius: 16px;
          border: none;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .ca-requirements-page .ca-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="ca-content">
        <h1 className="ca-title">CA Dashboard</h1>
        <p className="ca-subtitle">Review and approve requirements</p>

        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={8}>
            <Card
              className="ca-stat-card"
              hoverable
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
                borderColor: "transparent",
                color: "#fff",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Total Requirements
              </div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>{stats.total}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              className="ca-stat-card"
              hoverable
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)",
                borderColor: "transparent",
                color: "#fff",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Pending
              </div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>
                {stats.pending}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card
              className="ca-stat-card"
              hoverable
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                borderColor: "transparent",
                color: "#fff",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                Completed
              </div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>
                {stats.completed}
              </div>
            </Card>
          </Col>
        </Row>

        <div className="ca-filter-card">
          <Space size="middle" wrap>
            <Input
              placeholder="Search by purpose, requester..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
              style={{ width: 320, borderRadius: 10 }}
              size="large"
              allowClear
            />
            <DatePicker
              value={selectedDate}
              onChange={handleDateChange}
              format="DD-MM-YYYY"
              style={{ width: 200, borderRadius: 10 }}
              size="large"
              placeholder="Select date"
            />
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : (
          <Collapse
            defaultActiveKey={Object.keys(requirementsByDept)}
            accordion={false}
            bordered={false}
            expandIconPosition="end"
          >
            {Object.entries(requirementsByDept).map(
              ([deptId, deptObj]) => (
                <Panel key={deptId} header={getPanelHeader(deptObj)}>
                  <Table
                    columns={columns}
                    dataSource={sortedRequirements(deptObj.requirements)}
                    rowKey="id"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 2800 }}
                    size="middle"
                    bordered
                    rowClassName={rowClassName}
                  />
                </Panel>
              ),
            )}
          </Collapse>
        )}
      </div>
    </div>
  );
};

export default CARequirementsTable;
