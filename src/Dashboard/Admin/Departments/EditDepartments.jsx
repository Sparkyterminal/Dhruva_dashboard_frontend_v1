/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Form, Input, Button, Card, Typography, message, Spin } from "antd";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";

const { Title } = Typography;

const EditDepartments = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch department details and set form values
  useEffect(() => {
    const fetchDepartmentData = async () => {
      setFetching(true);
      try {
        const res = await axios.get(`${API_BASE_URL}department/${id}`, config);
        const data = res.data.data;
        form.setFieldsValue({ name: data.name });
      } catch (err) {
        message.error("Failed to fetch department details.");
      } finally {
        setFetching(false);
      }
    };
    fetchDepartmentData();
    // eslint-disable-next-line
  }, [id]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = { name: values.name };
      const res = await axios.patch(
        `${API_BASE_URL}department/${id}`,
        payload,
        config
      );
      if (res.status === 200 || res.status === 201) {
        message.success("Department updated successfully ✅");
        form.resetFields();
        navigate(-1); // Go back, or use navigate('/departments')
      }
    } catch (error) {
      console.error(error);
      message.error("Failed to update department ❌");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <Card
        style={{
          maxWidth: 500,
          margin: "30px auto",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <Spin size="large" />
      </Card>
    );
  }

  return (
    <Card style={{ maxWidth: 500, margin: "30px auto", padding: "20px" }}>
      <Title level={3} style={{ textAlign: "center", marginBottom: 20 }}>
        Edit Department
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
          <Button type="primary" htmlType="submit" block loading={loading}>
            Save Changes
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditDepartments;
