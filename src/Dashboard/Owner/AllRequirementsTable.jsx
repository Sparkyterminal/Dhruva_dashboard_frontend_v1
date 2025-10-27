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
  Typography,
} from "antd";
import { EditOutlined, CheckOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../../config";

const { Title } = Typography;
const { Option } = Select;

// Dummy departments list for dropdown
const departmentsList = [
  { name: "Hennur Godown", id: "68fdf1cfe66ed5069ddb9f25" },
  // Add more departments as needed
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

  // Fetch table on mount
  useEffect(() => {
    fetchRequirementsData();
    // eslint-disable-next-line
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

  // PATCH amount_paid update
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
      }); // Refresh list after PATCH
    } catch (err) {
      message.error("Failed to update amount paid");
    }
  };

  // PATCH full payment done (status: COMPLETED)
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
      }); // Refresh list after PATCH
    } catch (err) {
      message.error("Failed to mark as completed");
    }
  };

  // PATCH status REJECTED for Invalid Reason button
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
      }); // Refresh list after PATCH
    } catch (err) {
      message.error("Failed to reject request");
    }
  };

  // Edit amount paid click
  const handleAmountPaidEdit = (row) => {
    setEditRowId(row.id);
    setEditAmountPaid(row.amount_paid);
  };
  const handleAmountPaidChange = (e) => setEditAmountPaid(e.target.value);

  // Columns
  const columns = [
    {
      title: "Sl. No",
      key: "slno",
      render: (_, __, idx) => idx + 1,
    },
    {
      title: "First Name",
      dataIndex: ["requested_by", "first_name"],
      key: "first_name",
      render: (_, record) => record.requested_by?.first_name || "",
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department",
      render: (_, record) => record.department?.name || "",
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (amt) =>
        amt?.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
        }),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <span
          style={{
            color:
              priority === "HIGH"
                ? "red"
                : priority === "MEDIUM"
                ? "orange"
                : "green",
          }}
        >
          {priority}
        </span>
      ),
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (date) => (date ? dayjs(date).format("DD-MM-YYYY") : ""),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date) => (date ? dayjs(date).format("DD-MM-YYYY HH:mm") : ""),
    },
    {
      title: "Amount Paid",
      dataIndex: "amount_paid",
      key: "amount_paid",
      render: (amount_paid, row) =>
        row.status === "COMPLETED" || row.status === "REJECTED" ? (
          <span style={{ color: "#999" }}>
            {amount_paid?.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }) || 0}
          </span>
        ) : row.id === editRowId ? (
          <Space>
            <Input
              style={{ width: 100 }}
              value={editAmountPaid}
              onChange={handleAmountPaidChange}
              size="small"
              disabled={row.status === "COMPLETED" || row.status === "REJECTED"}
            />
            <Button
              type="primary"
              icon={<CheckOutlined />}
              size="small"
              onClick={() => handleAmountPaidSave(row)}
              disabled={row.status === "COMPLETED" || row.status === "REJECTED"}
            />
          </Space>
        ) : (
          <Space>
            <span>
              {amount_paid?.toLocaleString("en-IN", {
                style: "currency",
                currency: "INR",
              }) || 0}
            </span>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleAmountPaidEdit(row)}
              disabled={row.status === "COMPLETED" || row.status === "REJECTED"}
            />
          </Space>
        ),
    },
    {
      title: "Full Payment",
      key: "full_payment",
      render: (_, row) =>
        row.status === "PENDING" ? (
          <Button
            type="primary"
            disabled={row.amount_paid >= row.amount}
            onClick={() => handleFullPaymentDone(row)}
          >
            Full Payment Done
          </Button>
        ) : (
          <Button type="primary" disabled>
            Full Payment Done
          </Button>
        ),
    },
    {
      title: "Invalid Reason",
      key: "invalid_reason",
      render: (_, row) =>
        row.status === "PENDING" ? (
          <Button danger onClick={() => handleReject(row)}>
            Mark as Rejected
          </Button>
        ) : (
          <Button danger disabled>
            Mark as Rejected
          </Button>
        ),
    },
  ];

  // Highlight overdue rows and disabled style for completed/rejected
  const rowClassName = (record) => {
    if (record.status === "COMPLETED" || record.status === "REJECTED") {
      return "disabled-row";
    }
    if (record.due_date && dayjs(record.due_date).isBefore(dayjs(), "day")) {
      return "due-date-passed";
    }
    return "";
  };

  return (
    <>
      <style>{`
        .due-date-passed {
          background-color: #ffe6e6 !important;
        }
        .disabled-row {
          background-color: #f5f5f5 !important;
          opacity: 0.6;
          pointer-events: none;
        }
      `}</style>
      <div style={{ padding: 24, background: "#fff", borderRadius: 8 }}>
        <Title level={3} style={{ marginBottom: 16 }}>
          All Requirements
        </Title>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="Search requirements"
            value={search}
            onChange={handleSearch}
            onPressEnter={handleSearchSubmit}
            style={{ width: 200 }}
          />
          <DatePicker
            placeholder="Due date"
            value={selectedDate}
            onChange={handleDateChange}
            allowClear
          />
          <Select
            placeholder="Department"
            value={selectedDept}
            onChange={handleDeptChange}
            allowClear
            style={{ width: 160 }}
          >
            {departmentsList.map((dept) => (
              <Option value={dept.id} key={dept.id}>
                {dept.name}
              </Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearchSubmit}>
            Search
          </Button>
          <Button
            onClick={() => {
              setSearch("");
              setSelectedDate(null);
              setSelectedDept(null);
              fetchRequirementsData();
            }}
          >
            Reset
          </Button>
        </Space>
        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={requirements}
          pagination={{ pageSize: 10 }}
          bordered
          size="middle"
          rowClassName={rowClassName}
        />
      </div>
    </>
  );
};

export default AllRequirementsTable;
