/* eslint-disable no-unused-vars */
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../../config";
import { message, Table } from "antd";
import dayjs from "dayjs";

const ViewRequirements = () => {
  const user = useSelector((state) => state.user.value);

  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(false);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchRequirementsData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}request/my-requests`, config);
      setRequirements(res.data.items || []);
    } catch (err) {
      message.error("Failed to fetch requirements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirementsData();
    // eslint-disable-next-line
  }, []);

  const columns = [
    {
      title: "Sl. No",
      dataIndex: "slNo",
      key: "slNo",
      render: (_text, _record, index) => index + 1,
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
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
    },
    {
      title: "Due Date",
      dataIndex: "due_date",
      key: "due_date",
      render: (text) => dayjs(text).format("YYYY-MM-DD"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
  ];

  // Row styling function
  const getRowClassName = (record) => {
    const today = dayjs().startOf("day");
    const dueDate = dayjs(record.due_date).startOf("day");
    if (dueDate.isBefore(today)) {
      // Due date has passed
      return "requirement-row-overdue";
    }
    if (record.status !== "PENDING") {
      // Status is not PENDING
      return "requirement-row-resolved";
    }
    if (record.status === "PENDING") {
      // Status is pending
      return "requirement-row-pending";
    }
    return "";
  };

  return (
    <div>
      <Table
        dataSource={requirements}
        columns={columns}
        loading={loading}
        rowKey="id"
        rowClassName={getRowClassName}
        pagination={{ pageSize: 10 }}
      />
      {/* Row color styling */}
      <style>{`
        .requirement-row-overdue {
          background: #ffe5e8 !important; /* light red */
        }
        .requirement-row-pending {
          background: #fff9e5 !important; /* light yellow */
        }
        .requirement-row-resolved {
          background: #e6ffe6 !important; /* light green */
        }
      `}</style>
    </div>
  );
};

export default ViewRequirements;
