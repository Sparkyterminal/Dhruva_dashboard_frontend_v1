import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosClient from "@/api/axiosClient";
import AuthLayout from "./AuthLayout";

const ChangePassword = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [loading, setLoading] = useState(false);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axiosClient.patch(
        `user/change/password`,
        {
          password: values.newPassword,
        },
        config
      );
      message.success("Password changed successfully");
      navigate("/user");
    } catch {
      message.error("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const validateConfirmPassword = ({ getFieldValue }) => ({
    validator(_, value) {
      if (!value || getFieldValue("newPassword") === value) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("The two passwords do not match!"));
    },
  });

  return (
    <AuthLayout
      title="Change password"
      subtitle="Choose a new password for your account"
    >
      <Form
        name="changePassword"
        onFinish={onFinish}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          label="New password"
          name="newPassword"
          rules={[
            { required: true, message: "Please input your new password!" },
            { min: 6, message: "Password must be at least 6 characters." },
          ]}
          hasFeedback
        >
          <Input.Password size="large" placeholder="Enter new password" />
        </Form.Item>

        <Form.Item
          label="Confirm new password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm your new password!" },
            validateConfirmPassword,
          ]}
          hasFeedback
        >
          <Input.Password size="large" placeholder="Confirm new password" />
        </Form.Item>

        <Form.Item className="mb-0">
          <div className="flex flex-col gap-3 pt-2">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              block
            >
              Change password
            </Button>
            <Button onClick={() => navigate(-1)} size="large" block>
              Back home
            </Button>
          </div>
        </Form.Item>
      </Form>
    </AuthLayout>
  );
};

export default ChangePassword;
