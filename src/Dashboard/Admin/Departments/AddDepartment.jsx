import React from "react";
import { useSelector } from "react-redux";
import { Form, Input, Button, Card, Typography, message } from "antd";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";

const { Title } = Typography;

const AddDepartment = () => {
  const [form] = Form.useForm(); // Create AntD form instance
  const user = useSelector((state) => state.user.value);

  const config = {
    headers: {
      Authorization: user?.access_token,
    },
  };

  const onFinish = async (values) => {
    try {
      const payload = { name: values.name };
      const res = await axios.post(
        `${API_BASE_URL}department`,
        payload,
        config
      );
      if (res.status === 200 || res.status === 201) {
        message.success("Department added successfully ✅");
        form.resetFields(); // Clear form fields here
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to add department ❌");
    }
  };

  return (
    <Card style={{ maxWidth: 500, margin: "30px auto", padding: "20px" }}>
      <Title level={3} style={{ textAlign: "center", marginBottom: 20 }}>
        Add Department
      </Title>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {/* NAME INPUT */}
        <Form.Item
          label="Department Name"
          name="name"
          rules={[{ required: true, message: "Please enter department name" }]}
        >
          <Input placeholder="Enter department name" />
        </Form.Item>
        {/* SUBMIT BUTTON */}
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default AddDepartment;
