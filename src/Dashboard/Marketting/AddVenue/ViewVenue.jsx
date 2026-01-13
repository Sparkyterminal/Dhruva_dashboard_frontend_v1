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
  EyeOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../../config";
import ViewSubVenue from "../AddSubVenue/ViewSubVenue";
import AddVenue from "./AddVenue";

const { Title } = Typography;

const ViewVenue = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [subDrawerOpen, setSubDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [form] = Form.useForm();

  const user = useSelector((state) => state.user.value);

  const config = {
    headers: {
      Authorization: user?.access_token
        ? `Bearer ${user.access_token}`
        : undefined,
      "Content-Type": "application/json",
    },
  };

  const fetchVenues = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}venue`, config);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.venues)
        ? raw.venues
        : Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.data)
        ? raw.data
        : [];
      setData(list);
    } catch (err) {
      console.error("fetchVenues error:", err);
      message.error("Failed to load venues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}venue/${id}`, config);
      message.success("Venue deleted");
      fetchVenues();
    } catch (err) {
      console.error("delete venue error:", err);
      message.error("Delete failed");
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({ name: record.name });
    setEditModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const values = await form.validateFields();
      await axios.patch(
        `${API_BASE_URL}venue/${editingRecord.id}`,
        values,
        config
      );
      message.success("Venue updated");
      setEditModalOpen(false);
      setEditingRecord(null);
      fetchVenues();
    } catch (err) {
      console.error("update venue error:", err);
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
      title: "Venue Name",
      dataIndex: "name",
    },
    {
      title: "Action",
      width: 220,
      render: (_, record) => (
        <Space>
          {/* <Button
            icon={<EyeOutlined />}
            type="link"
            onClick={() => {
              setSelectedVenue(record);
              setSubDrawerOpen(true);
            }}
          >
            View Sub Venue
          </Button> */}
          <Button
            icon={<EditOutlined />}
            type="link"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete this venue?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} type="link" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const navigate = useNavigate();

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button
            type="link"
            icon={<LeftOutlined />}
            onClick={() => navigate(`/user`)}
          >
            Back
          </Button>
          <Title level={3} style={{ margin: 0 }}>
            View Venues
          </Title>
        </div>

        <div className="flex items-center gap-2">
          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate("/user/viewsubvenue")}
          >
            View Sub Venue
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setDrawerOpen(true)}
          >
            Add Venue Name
          </Button>
        </div>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
      />

      {/* Add Venue */}
      <Drawer
        title="Add Venue Name"
        open={drawerOpen}
        width={420}
        onClose={() => setDrawerOpen(false)}
        destroyOnClose
      >
        <AddVenue
          onSuccess={() => {
            setDrawerOpen(false);
            fetchVenues();
          }}
          onCancel={() => setDrawerOpen(false)}
        />
      </Drawer>

      {/* Edit Venue */}
      <Modal
        title="Edit Venue"
        open={editModalOpen}
        onOk={handleUpdate}
        onCancel={() => setEditModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Venue Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Sub Venue */}
      <Drawer
        title={`Sub Venues - ${selectedVenue?.name}`}
        width="80%"
        open={subDrawerOpen}
        onClose={() => setSubDrawerOpen(false)}
        destroyOnClose
      >
        <ViewSubVenue venue={selectedVenue} />
      </Drawer>
    </>
  );
};

export default ViewVenue;
