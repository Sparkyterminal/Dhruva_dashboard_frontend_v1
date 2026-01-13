/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { useSelector } from "react-redux";
import { LockOutlined } from "@ant-design/icons";

// CSS for Glassmorphism
const customStyles = `
  .glass-card {
    background: rgba(255,255,255,0.75);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(31,38,135,0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.35);
  }
  
  .custom-input .ant-input,
  .custom-input .ant-input-password {
    background: rgba(255,255,255,0.6);
    border: 1px solid rgba(255,140,0,0.2);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    transition: all 0.3s ease;
  }
  
  .custom-input .ant-input:hover,
  .custom-input .ant-input-password:hover,
  .custom-input .ant-input:focus,
  .custom-input .ant-input-password:focus {
    background: rgba(255,255,255,0.9);
    border-color: #ff7300;
    box-shadow: 0 0 0 2px rgba(255,115,0,0.1);
  }
  
  .custom-input .ant-form-item-label > label {
    font-weight: 600;
    color: #333;
    font-size: 1rem;
  }
  
  .custom-button-primary {
    background: linear-gradient(135deg, #ff7300 0%, #ff9500 100%);
    border: none;
    border-radius: 0.75rem;
    padding: 0.75rem 2rem;
    height: auto;
    font-size: 1rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(255,115,0,0.3);
    transition: all 0.3s ease;
  }
  
  .custom-button-primary:hover {
    background: linear-gradient(135deg, #ff8520 0%, #ffa520 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255,115,0,0.4);
  }
  
  .custom-button-secondary {
    background: rgba(255,255,255,0.8);
    border: 2px solid rgba(255,115,0,0.3);
    border-radius: 0.75rem;
    padding: 0.75rem 2rem;
    height: auto;
    font-size: 1rem;
    font-weight: 600;
    color: #ff7300;
    transition: all 0.3s ease;
  }
  
  .custom-button-secondary:hover {
    background: rgba(255,115,0,0.1) !important;
    border-color: #ff7300 !important;
    color: #ff7300 !important;
    transform: translateY(-2px);
  }
`;

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
      await axios.patch(
        `${API_BASE_URL}user/change/password`,
        {
          password: values.newPassword,
        },
        config
      );
      message.success("Password changed successfully");
      navigate("/user");
    } catch (error) {
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
    <div className="min-h-screen w-full bg-[#fff9f5] relative font-[cormoreg]">
      <style>{customStyles}</style>
      
      {/* Gradient Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            `radial-gradient(circle at 20% 80%, rgba(255,220,190,0.3) 0%, transparent 50%),` +
            `radial-gradient(circle at 80% 20%, rgba(255,245,238,0.35) 0%, transparent 50%),` +
            `radial-gradient(circle at 40% 40%, rgba(255,210,180,0.15) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 md:p-10">
            {/* Header with Icon */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <LockOutlined style={{ fontSize: '2.5rem', color: 'white' }} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">
                Change Password
              </h2>
              <p className="text-gray-600 mt-2 text-center">
                Please enter your new password below
              </p>
            </div>

            {/* Form */}
            <Form
              name="changePassword"
              onFinish={onFinish}
              layout="vertical"
              requiredMark={false}
              className="custom-input"
            >
              <Form.Item
                label="New Password"
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
                label="Confirm New Password"
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

              <Form.Item className="mb-0 mt-8">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="custom-button-primary flex-1"
                  >
                    Change Password
                  </Button>
                  <Button
                    onClick={() => navigate(-1)}
                    className="custom-button-secondary flex-1"
                  >
                    Back Home
                  </Button>
                </div>
              </Form.Item>
            </Form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChangePassword;