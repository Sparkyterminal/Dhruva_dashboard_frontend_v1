/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import axios from "axios";
import { Form, Input, Button, Space, message } from "antd";
import { API_BASE_URL } from "../../../../config";
import { useSelector } from "react-redux";

const AddVenue = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.value);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: user?.access_token ? `Bearer ${user.access_token}` : undefined,
        },
      };

      await axios.post(`${API_BASE_URL}venue`, values, config);

      message.success("Venue added");
      form.resetFields();
      onSuccess();
    } catch (err) {
      console.error("AddVenue error:", err);
      message.error("Failed to add venue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form layout="vertical" form={form}>
      <Form.Item name="name" label="Venue Name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Space>
        <Button type="primary" onClick={handleSubmit} loading={loading}>
          Submit
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Space>
    </Form>
  );
};

export default AddVenue;
