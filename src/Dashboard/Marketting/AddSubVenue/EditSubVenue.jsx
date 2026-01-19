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
import { useNavigate, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../../../config";

const { Title } = Typography;
const { Option } = Select;

const EditSubVenue = () => {
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [subVenue, setSubVenue] = useState(null);
  const [form] = Form.useForm();

  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();
  const { id } = useParams();

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

  const fetchSubVenue = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}sub-venue-location/${id}`,
        config
      );
      const data = res.data.data || res.data;
      setSubVenue(data);
      // Populate form with existing data
      form.setFieldsValue({
        name: data.name,
        venue: data.venue?.id || data.venue,
      });
    } catch (err) {
      console.error("fetchSubVenue error:", err);
      message.error("Failed to load sub venue");
      navigate("/user/viewsubvenue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
    fetchSubVenue();
  }, [id]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      await axios.patch(
        `${API_BASE_URL}sub-venue-location/${id}`,
        values,
        config
      );
      message.success("Sub venue updated successfully");
      setTimeout(() => navigate("/user/viewsubvenue"), 1500);
    } catch (err) {
      console.error("update sub venue error:", err);
      message.error(
        err.response?.data?.message || "Failed to update sub venue"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    navigate("/user/viewsubvenue");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button
            type="link"
            icon={<LeftOutlined />}
            onClick={() => navigate("/user/viewsubvenue")}
          />
          <Title level={3} style={{ margin: 0 }}>
            Edit Sub Venue
          </Title>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6 border">
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
              disabled={loading}
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
            <Input placeholder="Enter sub venue name" disabled={loading} />
          </Form.Item>
        </Form>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="primary" onClick={handleUpdate} loading={loading}>
            Update Sub Venue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditSubVenue;
