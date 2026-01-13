/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { Form, Input, InputNumber, Select, Button, message, Card, DatePicker } from "antd";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../config";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const AddRequirements = () => {
  const [form] = Form.useForm();
  const user = useSelector((state) => state.user.value);
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const searchTimeout = useRef(null);

  const deptId = user?.departments?.length ? user.departments[0].id : null;

  const config = {
    headers: {
      Authorization: user?.access_token,
    },
  };

  // Fetch vendors scoped by department
  const fetchVendors = async () => {
    if (!deptId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}vendor/list`, config);
      setVendors(res.data.vendors.reverse() || []);
    } catch (err) {
      message.error("Failed to fetch vendors");
    } finally {
      setLoading(false);
    }
  };

  // Fetch events list — supports optional server-side search query
  const fetchEvents = async (query = "") => {
    setEventsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`, {
        ...config,
        params: query ? { search: query } : {},
      });

      setEvents(res.data.events || res.data.data || res.data || []);
    } catch (err) {
      console.error("Failed to fetch events", err);
      message.error("Failed to fetch events");
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    // load initial events list (empty query)
    fetchEvents("");
  }, [deptId]);

  // Debounced search handler for Select's onSearch
  const handleEventSearch = (value) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchEvents(value.trim());
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const onFinish = async (values) => {
    const payload = {
      purpose: values.purpose,
      vendor: values.vendor || null,
      event_reference: values.event_reference || null,
      amount: typeof values.amount === 'number' ? values.amount : Number(values.amount) || 0,
      required_date: values.required_date
        ? (values.required_date.toISOString ? values.required_date.toISOString() : values.required_date.format('YYYY-MM-DD'))
        : null,
      transation_in: values.expecting_transaction_in?.toUpperCase(),
      priority: values.priority,
    };

    try {
      await axios.post(`${API_BASE_URL}request`, payload, config);
      message.success("Requirement submitted successfully!");
      navigate(-1);
      form.resetFields();
    } catch (error) {
      message.error("Failed to submit requirement");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 bg-linear-to-tr from-white to-indigo-50 font-[cormoreg] text-2xl">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-2 text-gray-600 hover:text-indigo-700 transition-colors duration-200 font-semibold cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <Card
          bordered={false}
          className="rounded-3xl shadow-md bg-white font-[cormoreg] text-2xl"
          style={{ padding: "2rem" }}
        >
          <h1 className="text-3xl font-semibold mb-1 text-indigo-700 text-center font-[cormoreg]">
            New Requirement
          </h1>
          <p className="text-center text-gray-500 mb-6 font-[cormoreg] text-2xl">
            Please fill all necessary details
          </p>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              label={
                <span className="text-gray-700 font-medium font-[cormoreg] text-2xl">
                  Purpose
                </span>
              }
              name="purpose"
              rules={[{ required: true, message: "Please enter the purpose" }]}
            >
              <Input
                placeholder="e.g., Office supplies, Equipment upgrade"
                size="large"
                className="rounded-lg border border-gray-300 focus:border-indigo-500 transition"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-700 font-medium font-[cormoreg] text-2xl">
                  Vendor{" "}
                </span>
              }
              name="vendor"
            >
              <Select
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children || "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                placeholder={
                  loading
                    ? "Loading vendors..."
                    : "Search vendor by code or name"
                }
                size="large"
                allowClear
                className="rounded-lg border border-gray-300 focus:border-indigo-500 transition"
                loading={loading}
                notFoundContent={loading ? "Loading..." : "No vendors found"}
              >
                {vendors.map((vendor) => (
                  <Option key={vendor.id} value={vendor.id}>
                    {`${
                      vendor.vendor_code || vendor.vendor_code === 0
                        ? vendor.vendor_code.toUpperCase()
                        : ""
                    } — ${vendor.name.toUpperCase()}`}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-700 font-medium font-[cormoreg] text-2xl">
                  Event Reference{" "}
                </span>
              }
              name="event_reference"
            >
              <Select
                showSearch
                filterOption={false}
                onSearch={handleEventSearch}
                onFocus={() => fetchEvents("")}
                placeholder={
                  eventsLoading ? "Loading events..." : "Search event or client"
                }
                size="large"
                allowClear
                className="rounded-lg border border-gray-300 focus:border-indigo-500 transition"
                loading={eventsLoading}
                notFoundContent={
                  eventsLoading ? "Loading..." : "No events found"
                }
              >
                {events.map((ev) => {
                  const eventName =
                    typeof ev.eventName === "string"
                      ? ev.eventName
                      : ev.eventName?.name || ev.name || ev.title || "Untitled";
                  const clientName = ev.clientName || "";
                  const value = ev._id || ev.id;
                  return (
                    <Option key={value} value={value}>
                      {`${eventName} — ${clientName}`}
                    </Option>
                  );
                })}
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-700 font-medium font-[cormoreg] text-2xl">
                  Amount
                </span>
              }
              name="amount"
              rules={[{ required: true, message: "Please enter the amount" }]}
            >
              <InputNumber
                size="large"
                min={0}
                placeholder="Enter amount"
                style={{ width: "100%" }}
                formatter={(value) =>
                  `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => (value ? value.replace(/[^\d.-]/g, "") : "")}
                onChange={(value) => form.setFieldsValue({ amount: value })}
                className="rounded-lg border border-gray-300 focus:border-indigo-500 transition"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-700 font-medium font-[cormoreg] text-2xl">
                  Required Date
                </span>
              }
              name="required_date"
            >
              <DatePicker
                size="large"
                style={{ width: "100%" }}
                className="rounded-lg border border-gray-300 focus:border-indigo-500 transition"
              />
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-700 font-medium font-[cormoreg] text-2xl">
                  Expecting Transactions In
                </span>
              }
              name="expecting_transaction_in"
              rules={[
                { required: true, message: "Please select account type" },
              ]}
            >
              <Select
                placeholder="Select account or cash"
                size="large"
                className="rounded-lg border border-gray-300 focus:border-indigo-500 transition"
              >
                <Option value="cash">Cash</Option>
                <Option value="account">Account</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <span className="text-gray-700 font-medium font-[cormoreg] text-2xl">
                  Priority
                </span>
              }
              name="priority"
              rules={[{ required: true, message: "Please select priority" }]}
            >
              <Select
                placeholder="Select priority level"
                size="large"
                className="rounded-lg border border-gray-300 focus:border-indigo-500 transition"
              >
                <Option value="HIGH">
                  <span className="flex items-center gap-2 text-red-600 font-semibold">
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>{" "}
                    High
                  </span>
                </Option>
                <Option value="MEDIUM">
                  <span className="flex items-center gap-2 text-yellow-600 font-semibold">
                    <span className="w-3 h-3 rounded-full bg-yellow-600"></span>{" "}
                    Medium
                  </span>
                </Option>
                <Option value="LOW">
                  <span className="flex items-center gap-2 text-green-600 font-semibold">
                    <span className="w-3 h-3 rounded-full bg-green-600"></span>{" "}
                    Low
                  </span>
                </Option>
              </Select>
            </Form.Item>

            <Form.Item className="mt-8 mb-0">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                className="bg-indigo-600 hover:bg-indigo-700 font-semibold rounded-lg shadow-md transition-colors duration-200 font-[cormoreg] text-2xl"
              >
                Submit Requirement
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default AddRequirements;
