/* eslint-disable no-unused-vars */
import React from "react";
import axios from "axios";
import { Form, Input, Button, Space, message } from "antd";
import { API_BASE_URL } from "../../../../config";
import { useSelector } from "react-redux";

const AddPC = ({ onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const user = useSelector((state) => state.user.value);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: user?.access_token ? `Bearer ${user.access_token}` : undefined,
        },
      };

      await axios.post(`${API_BASE_URL}coordinators`, values, );

      message.success("Coordinator added successfully");
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error("AddPC error:", error);
      message.error("Failed to add coordinator");
    }
  };

  return (
    <Form layout="vertical" form={form}>
      <Form.Item
        label="Coordinator Name"
        name="name"
        rules={[
          { required: true, message: "Please enter coordinator name" },
        ]}
      >
        <Input placeholder="Enter coordinator name" />
      </Form.Item>

      <Space>
        <Button type="primary" onClick={handleSubmit}>
          Submit
        </Button>
        <Button onClick={onCancel}>Cancel</Button>
      </Space>
    </Form>
  );
};

export default AddPC;
