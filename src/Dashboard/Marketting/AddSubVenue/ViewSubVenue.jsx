/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Space,
  Typography,
  Drawer,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../../config";

const { Title } = Typography;
const { Option } = Select;

const ViewSubVenue = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [form] = Form.useForm();

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const config = {
    headers: {
      Authorization: user?.access_token
        ? `Bearer ${user.access_token}`
        : undefined,
      "Content-Type": "application/json",
    },
  };

  const fetchVenues = async () => {
    setVenuesLoading(true);
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
      setVenues(list);
    } catch (err) {
      console.error("fetchVenues error:", err);
      message.error("Failed to load venues");
    } finally {
      setVenuesLoading(false);
    }
  };

  const fetchSubVenues = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}sub-venue-location`, config);
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw.subVenueLocations)
        ? raw.subVenueLocations
        : Array.isArray(raw.items)
        ? raw.items
        : Array.isArray(raw.data)
        ? raw.data
        : [];
      setData(list);
    } catch (err) {
      console.error("fetchSubVenues error:", err);
      message.error("Failed to load sub venues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubVenues();
    fetchVenues();
  }, []);

  const handleAddSubVenue = async () => {
    try {
      const values = await form.validateFields();
      await axios.post(`${API_BASE_URL}sub-venue-location`, values, config);
      message.success("Sub venue created successfully");
      setAddDrawerOpen(false);
      form.resetFields();
      fetchSubVenues();
    } catch (err) {
      console.error("create sub venue error:", err);
      message.error(
        err.response?.data?.message || "Failed to create sub venue"
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}sub-venue-location/${id}`, config);
      message.success("Sub venue deleted successfully");
      fetchSubVenues();
    } catch (err) {
      console.error("delete sub venue error:", err);
      message.error("Delete failed");
    }
  };

  const handleEdit = (record) => {
    navigate(`/user/editsubvenue/${record.id}`);
  };

  const columns = [
    {
      title: "SL No",
      render: (_, __, index) => index + 1,
      width: 80,
    },
    {
      title: "Venue Name",
      dataIndex: ["venue", "name"],
      render: (venueName) => venueName || "-",
    },
    {
      title: "Sub Venue Name",
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
            title="Delete this sub venue?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button icon={<DeleteOutlined />} type="link" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            type="link"
            icon={<LeftOutlined />}
            onClick={() => navigate(`/user/viewvenue`)}
          />
          <Title level={3} style={{ margin: 0 }}>
            View Sub Venues
          </Title>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setAddDrawerOpen(true)}
        >
          Add Sub Venue
        </Button>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* Add Sub Venue Drawer */}
      <Drawer
        title="Add Sub Venue"
        width={520}
        open={addDrawerOpen}
        onClose={() => {
          setAddDrawerOpen(false);
          form.resetFields();
        }}
        destroyOnClose
        extra={
          <Space>
            <Button
              onClick={() => {
                setAddDrawerOpen(false);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleAddSubVenue}
              loading={loading}
            >
              Submit
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Venue"
            name="venue"
            rules={[{ required: true, message: "Please select a venue" }]}
          >
            <Select
              placeholder="Select venue"
              loading={venuesLoading}
              showSearch
              optionFilterProp="children"
            >
              {venues.map((venue) => (
                <Option key={venue.id} value={venue.id}>
                  {venue.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Sub Venue Name"
            name="name"
            rules={[{ required: true, message: "Please enter sub venue name" }]}
          >
            <Input placeholder="Enter sub venue name" />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
};
export default ViewSubVenue;
