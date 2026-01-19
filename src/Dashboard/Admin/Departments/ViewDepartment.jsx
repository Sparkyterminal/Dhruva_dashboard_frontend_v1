/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Table, Button, Popconfirm, message, Card, Typography } from "antd";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../../../config";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const ViewDepartment = () => {
  const user = useSelector((state) => state.user.value);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchDepartmentData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}department?page=${page}&limit=${pageSize}`,
        config
      );
      setDepartments(res.data.items); // items array from API
      setPagination({
        current: page,
        pageSize: pageSize,
        total: res.data.totalItems || 0,
      });
    } catch (err) {
      message.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData(pagination.current, pagination.pageSize);
    // eslint-disable-next-line
  }, []);

  const handleTableChange = (pagination) => {
    fetchDepartmentData(pagination.current, pagination.pageSize);
  };

  const handleEdit = (id) => {
    navigate(`/dashboard/editdepartment/${id}`);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}department/${id}`, config);
      message.success("Department deleted successfully");
      fetchDepartmentData(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error("Failed to delete department");
    }
  };

  const columns = [
    {
      title: "SL.No",
      dataIndex: "slno",
      key: "slno",
      render: (_, __, index) =>
        (pagination.current - 1) * pagination.pageSize + index + 1,
      width: 80,
      align: "center",
    },
    {
      title: "Department Name",
      dataIndex: "name",
      key: "name",
      ellipsis: true,
      width: 240,
      align: "center",
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <>
          <Button
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() => handleEdit(record.id)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this department?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="danger">Delete</Button>
          </Popconfirm>
        </>
      ),
      width: 180,
    },
  ];

  return (
    <Card
      style={{
        margin: "30px auto",
        maxWidth: 700,
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}
      bodyStyle={{ padding: "24px" }}
    >
      <Title level={3} style={{ textAlign: "center", marginBottom: 30 }}>
        Departments
      </Title>
      <Table
        columns={columns}
        dataSource={departments}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} departments`,
        }}
        onChange={handleTableChange}
        bordered
        size="middle"
        style={{ background: "#fff", borderRadius: 8 }}
      />
    </Card>
  );
};

export default ViewDepartment;
