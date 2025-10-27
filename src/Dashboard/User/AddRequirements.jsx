/* eslint-disable no-unused-vars */
import React from "react";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  message,
} from "antd";
import axios from "axios";
import { API_BASE_URL } from "../../../config";
import { useSelector } from "react-redux";

const { Option } = Select;

const AddRequirements = () => {
  const [form] = Form.useForm();
  const user = useSelector((state) => state.user.value);

  const config = {
    headers: {
      Authorization: user?.access_token,
    },
  };

  const onFinish = async (values) => {
    const payload = {
      purpose: values.purpose,
      amount: values.amount,
      due_date: values.due.format("YYYY-MM-DD"), // formatted date string
      priority: values.priority,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}request`,
        payload,
        config
      );
      message.success("Requirement submitted successfully!");
      form.resetFields();
    } catch (error) {
      message.error("Failed to submit requirement");
      console.error(error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Add Requirements</h2>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Purpose"
          name="purpose"
          rules={[{ required: true, message: "Please enter the purpose" }]}
        >
          <Input placeholder="Enter purpose" />
        </Form.Item>

        <Form.Item
          label="Amount"
          name="amount"
          rules={[{ required: true, message: "Please enter the amount" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            placeholder="Enter amount"
            formatter={(value) => `$ ${value}`}
            parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
          />
        </Form.Item>

        <Form.Item
          label="Due Date"
          name="due"
          rules={[{ required: true, message: "Please select due date" }]}
        >
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Priority"
          name="priority"
          rules={[{ required: true, message: "Please select priority" }]}
        >
          <Select placeholder="Select priority">
            <Option value="HIGH">HIGH</Option>
            <Option value="MEDIUM">MEDIUM</Option>
            <Option value="LOW">LOW</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Submit Requirement
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AddRequirements;
