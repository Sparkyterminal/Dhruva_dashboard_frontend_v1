/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Space,
  Typography,
  Drawer,
  Modal,
  Form,
  Input,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import AddPC from "./AddPC";
import { API_BASE_URL } from "../../../../config";

const { Title } = Typography;

const ViewPC = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form] = Form.useForm();

  const user = useSelector((state) => state.user.value);

  const config = {
    headers: {
      Authorization: user?.access_token ? `Bearer ${user.access_token}` : undefined,
      "Content-Type": "application/json",
    },
  };

  // 🔹 Fetch Coordinators
  const fetchPCs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}coordinators`, );
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.data)
        ? raw.data
        : Array.isArray(raw.coordinators)
        ? raw.coordinators
        : [];
      setData(list);
    } catch (err) {
      console.error("fetchPCs error:", err);
      message.error("Failed to load coordinators");
    } finally {
      setLoading(false);
    }
  }; 

  useEffect(() => {
    fetchPCs();
  }, []);

  // 🔹 Delete Coordinator
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}coordinators/${id}`, config);
      message.success("Coordinator deleted");
      fetchPCs();
    } catch (err) {
      console.error("delete error:", err);
      message.error("Delete failed");
    }
  }; 

  // 🔹 Edit Coordinator
  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({ name: record.name });
    setEditModalOpen(true);
  };

  // 🔹 Update Coordinator
  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();

      await axios.patch(
        `${API_BASE_URL}coordinators/${editingRecord.id}`,
        values,
        { headers: { "Content-Type": "application/json", ...config.headers } }
      );

      message.success("Coordinator updated");
      setEditModalOpen(false);
      fetchPCs();
    } catch (err) {
      console.error("update error:", err);
      message.error("Update failed");
    }
  };

  const columns = [
    {
      title: "SL No",
      render: (_, __, index) => index + 1,
      width: 80,
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Action",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            type="link"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete this coordinator?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              icon={<DeleteOutlined />}
              type="link"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Title level={3}>View Project Coordinators</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setDrawerOpen(true)}
        >
          Add Project Coord
        </Button>
      </div>

      {/* Table */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
      />

      {/* Add Drawer */}
      <Drawer
        title="Add Coordinator"
        width={420}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <AddPC
          onSuccess={() => {
            setDrawerOpen(false);
            fetchPCs();
          }}
          onCancel={() => setDrawerOpen(false)}
        />
      </Drawer>

      {/* Edit Modal */}
      <Modal
        title="Edit Coordinator"
        open={editModalOpen}
        onOk={handleUpdate}
        onCancel={() => setEditModalOpen(false)}
        okText="Update"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input placeholder="Enter coordinator name" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ViewPC;
