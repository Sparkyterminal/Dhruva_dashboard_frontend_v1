/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Form, Input, DatePicker, InputNumber, Button, message, Select } from "antd";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import { API_BASE_URL } from "../../../../config";
import { FileTextOutlined } from "@ant-design/icons";

const { Option } = Select;

// CSS for Glassmorphism with Purple/Blue theme
const customStyles = `
  .glass-card-bill {
    background: rgba(255,255,255,0.75);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(99,102,241,0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.35);
  }
  
  .custom-input-bill .ant-input,
  .custom-input-bill .ant-input-number,
  .custom-input-bill .ant-picker,
  .custom-input-bill .ant-select-selector {
    background: rgba(255,255,255,0.6);
    border: 1px solid rgba(139,92,246,0.2);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    transition: all 0.3s ease;
  }
  
  .custom-input-bill .ant-select-selector {
    padding: 0.5rem 1rem !important;
    height: auto !important;
  }
  
  .custom-input-bill .ant-select-selection-item {
    line-height: 1.5 !important;
  }
  
  .custom-input-bill .ant-input-number {
    padding: 0;
  }
  
  .custom-input-bill .ant-input-number-input {
    padding: 0.75rem 1rem;
  }
  
  .custom-input-bill .ant-input:hover,
  .custom-input-bill .ant-input-number:hover,
  .custom-input-bill .ant-picker:hover,
  .custom-input-bill .ant-select-selector:hover,
  .custom-input-bill .ant-input:focus,
  .custom-input-bill .ant-input-number:focus,
  .custom-input-bill .ant-picker:focus,
  .custom-input-bill .ant-picker-focused,
  .custom-input-bill .ant-select-focused .ant-select-selector {
    background: rgba(255,255,255,0.9);
    border-color: #8b5cf6;
    box-shadow: 0 0 0 2px rgba(139,92,246,0.1);
  }
  
  .custom-input-bill .ant-form-item-label > label {
    font-weight: 600;
    color: #333;
    font-size: 1rem;
  }
  
  .custom-button-bill {
    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
    border: none;
    border-radius: 0.75rem;
    padding: 0.75rem 2rem;
    height: auto;
    font-size: 1.1rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(139,92,246,0.3);
    transition: all 0.3s ease;
  }
  
  .custom-button-bill:hover {
    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(139,92,246,0.4);
  }
`;

const AddBill = () => {
  const [form] = Form.useForm();
  const [showOtherEmiType, setShowOtherEmiType] = useState(false);

  const handleEmiTypeChange = (value) => {
    if (value === 'Others') {
      setShowOtherEmiType(true);
      form.setFieldsValue({ emiTypeOther: '' });
    } else {
      setShowOtherEmiType(false);
      form.setFieldsValue({ emiTypeOther: undefined });
    }
  };

  const onFinish = async (values) => {
    // Format date to YYYY-MM-DD and prepare payload
    const payload = {
      name: values.name,
      emiDate: values.emiDate.format("YYYY-MM-DD"),
      amount: values.amount,
      emiType: values.emiType === 'Others' ? values.emiTypeOther : values.emiType,
    };

    console.log('Payload being sent:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(`${API_BASE_URL}bills`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        message.success("Bill added successfully");
        form.resetFields();
        setShowOtherEmiType(false);
      } else {
        message.error("Failed to add bill");
      }
    } catch (error) {
      message.error("Error submitting the form");
    }
  };

  return (
    <div className="min-h-screen w-full bg-linear-to-br from-purple-50 via-blue-50 to-indigo-100 relative font-[cormoreg]">
      <style>{customStyles}</style>
      
      {/* Gradient Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            `radial-gradient(circle at 20% 80%, rgba(139,92,246,0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 80% 20%, rgba(99,102,241,0.15) 0%, transparent 50%),` +
            `radial-gradient(circle at 40% 40%, rgba(167,139,250,0.1) 0%, transparent 50%)`,
        }}
      />

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <div className="glass-card-bill p-8 md:p-10">
            {/* Header with Icon */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-linear-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <FileTextOutlined style={{ fontSize: '2.5rem', color: 'white' }} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">
                Add New Bill
              </h2>
              <p className="text-gray-600 mt-2 text-center">
                Enter bill details below
              </p>
            </div>

            {/* Form */}
            <Form
              form={form}
              onFinish={onFinish}
              layout="vertical"
              className="custom-input-bill"
            >
              <Form.Item
                label="Bill Name"
                name="name"
                rules={[{ required: true, message: "Please enter bill name" }]}
              >
                <Input size="large" placeholder="e.g., Electricity Bill" />
              </Form.Item>

              <Form.Item
                label="EMI Type"
                name="emiType"
                rules={[{ required: true, message: "Please select EMI type" }]}
              >
                <Select 
                  size="large" 
                  placeholder="Select EMI type"
                  onChange={handleEmiTypeChange}
                >
                  <Option value="Rent">Rent</Option>
                  <Option value="Utilities">Utilities</Option>
                  <Option value="Insurance">Insurance</Option>
                  <Option value="Others">Others</Option>
                </Select>
              </Form.Item>

              {showOtherEmiType && (
                <Form.Item
                  label="Specify EMI Type"
                  name="emiTypeOther"
                  rules={[{ required: true, message: "Please specify EMI type" }]}
                >
                  <Input size="large" placeholder="Enter EMI type" />
                </Form.Item>
              )}

              <Form.Item
                label="EMI Date"
                name="emiDate"
                rules={[{ required: true, message: "Please select EMI date" }]}
              >
                <DatePicker size="large" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label="Amount"
                name="amount"
                rules={[
                  { required: true, message: "Please enter amount" },
                  { type: "number", min: 1, message: "Amount must be positive" },
                ]}
              >
                <InputNumber 
                  size="large" 
                  style={{ width: "100%" }} 
                  min={1}
                  formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₹\s?|(,*)/g, '')}
                  placeholder="Enter amount"
                />
              </Form.Item>

              <Form.Item className="mb-0 mt-8">
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  className="custom-button-bill"
                >
                  Add Bill
                </Button>
              </Form.Item>
            </Form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AddBill;