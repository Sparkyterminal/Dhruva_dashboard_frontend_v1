/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Popconfirm,
  message,
  Card,
  Typography,
  Spin,
} from "antd";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";

const { Title } = Typography;

const ViewUsers = () => {
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const navigate = useNavigate();

  // const fetchUserData = async (page = 1, pageSize = 10) => {
  //   setLoading(true);
  //   try {
  //     const res = await axios.get(
  //       `${API_BASE_URL}user?page=${page}&limit=${pageSize}`,
  //       config
  //     );
  //     setUsers(res.data.items || []);
  //     setPagination({
  //       current: page,
  //       pageSize: pageSize,
  //       total: res.data.totalItems || 0,
  //     });
  //   } catch (err) {
  //     message.error("Failed to fetch user details.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchUserData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}user?page=${page}&limit=${pageSize}`,
        config
      );
      const usersData = res.data.items || [];
      const mappedUsers = usersData.map((user) => {
        const departmentInfo =
          user.department_details && user.department_details.length > 0
            ? user.department_details[0].name
            : "-";
        return { ...user, department_name: departmentInfo };
      });
      setUsers(mappedUsers);
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.totalItems || 0,
      });
    } catch (err) {
      message.error("Failed to fetch user details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    // eslint-disable-next-line
  }, []);

  const handleEdit = (id) => {
    navigate(`/dashboard/edituser/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}user/${id}`, config);
      message.success("User deleted successfully");
      fetchUserData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("Failed to delete user");
    }
  };

  const handleTableChange = (pagination) => {
    fetchUserData(pagination.current, pagination.pageSize);
  };

  const columns = [
    {
      title: "First Name",
      dataIndex: "first_name",
      key: "first_name",
      align: "center",
      ellipsis: true,
    },
    {
      title: "Last Name",
      dataIndex: "last_name",
      key: "last_name",
      align: "center",
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: ["email_data", "email_id"],
      key: "email_id",
      align: "center",
      render: (_, record) => record.email_data?.email_id || "-",
    },
    {
      title: "Mobile",
      dataIndex: ["phone_data", "phone_number"],
      key: "phone_number",
      align: "center",
      render: (_, record) => record.phone_data?.phone_number || "-",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      align: "center",
    },
    {
      title: "Designation",
      dataIndex: "designation",
      key: "designation",
      align: "center",
      render: (text) => text || "-",
    },
    {
      title: "Department",
      dataIndex: "department_name",
      key: "department_name",
      align: "center",
      // ellipsis: true,
      render: (text) => text || "-",
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <>
          <Button
            type="primary"
            size="small"
            style={{ marginRight: 8 }}
            onClick={() => handleEdit(record.id)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger" size="small">
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
      width: 150,
    },
  ];

  return (
    <Card
      style={{
        margin: "30px auto",
        maxWidth: 900,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
    >
      <Title level={3} style={{ textAlign: "center", marginBottom: 30 }}>
        Users
      </Title>
      <Table
        columns={columns}
        dataSource={users}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
        onChange={handleTableChange}
        bordered
        size="middle"
        style={{ background: "#fff", borderRadius: 8 }}
      />
    </Card>
  );
};

export default ViewUsers;
