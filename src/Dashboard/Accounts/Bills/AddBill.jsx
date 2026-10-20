import "@/Components/PageKit/PageKit.css";
import React, { useState } from "react";
import {
  Form,
  Input,
  DatePicker,
  InputNumber,
  Button,
  message,
  Select,
} from "antd";
import { motion } from "framer-motion";
import { API_BASE_URL } from "@/config/config";
import { FileTextOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

// CSS for Glassmorphism with Purple/Blue theme
const customStyles = `
  .glass-card-bill {
    background: rgba(255,255,255,0.75);
    border-radius: 1.5rem;
    box-shadow: 0 8px 32px 0 rgba(51, 129, 71,0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.35);
  }
  
  .custom-input-bill .ant-input,
  .custom-input-bill .ant-input-number,
  .custom-input-bill .ant-picker,
  .custom-input-bill .ant-select-selector {
    background: rgba(255,255,255,0.6);
    border: 1px solid rgba(43, 122, 65,0.2);
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
    border-color: #2b7a41;
    box-shadow: 0 0 0 2px rgba(43, 122, 65,0.1);
  }
  
  .custom-input-bill .ant-form-item-label > label {
    font-weight: 600;
    color: #333;
    font-size: 1rem;
  }
  
  .custom-button-bill {
    background: linear-gradient(135deg, #2b7a41 0%, #338147 100%);
    border: none;
    border-radius: 0.75rem;
    padding: 0.75rem 2rem;
    height: auto;
    font-size: 1.1rem;
    font-weight: 600;
    box-shadow: 0 4px 15px rgba(43, 122, 65,0.3);
    transition: all 0.3s ease;
  }
  
  .custom-button-bill:hover {
    background: linear-gradient(135deg, #0f4220 0%, #17542a 100%) !important;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(43, 122, 65,0.4);
  }
`;

const AddBill = () => {
  const [form] = Form.useForm();
  const [showOtherEmiType, setShowOtherEmiType] = useState(false);
  const navigate = useNavigate();

  const handleEmiTypeChange = (value) => {
    if (value === "Others") {
      setShowOtherEmiType(true);
      form.setFieldsValue({ emiTypeOther: "" });
    } else {
      setShowOtherEmiType(false);
      form.setFieldsValue({ emiTypeOther: undefined });
    }
  };

  const onFinish = async (values) => {
    // Format dates to YYYY-MM-DD and prepare payload
    const startDateStr = values.startDate.format("YYYY-MM-DD");
    const payload = {
      name: values.name,
      belongs_to: values.belongsTo,
      emi_end_date: values.emiEndDate.format("YYYY-MM-DD"),
      emiType:
        values.emiType === "Others" ? values.emiTypeOther : values.emiType,
      // Prefer `startDate` + `frequency` (new backend fields)
      startDate: startDateStr,
      frequency: values.frequency || "MONTHLY",
      // Backward compatibility: backend still supports `emiDate`
      emiDate: startDateStr,
      defaultAmount: values.amount,
    };


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
        navigate(-1);
      } else {
        message.error("Failed to add bill");
      }
    } catch {
      message.error("Error submitting the form");
    }
  };

  return (
    <div className="pk-page">
      <style>{customStyles}</style>

      {/* Gradient Background */}
      <div className="relative z-10 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          <div className="pk-panel p-8 md:p-10">
            {/* Header with Icon */}
            <div className="flex flex-col items-center mb-8">
              <button
                onClick={() => navigate(-1)}
                className="pk-btn self-start mb-4"
              >
                Back
              </button>
              <div className="w-20 h-20 bg-forest-900 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <FileTextOutlined
                  style={{ fontSize: "2.5rem", color: "#E0D085" }}
                />
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
                label="Belongs To"
                name="belongsTo"
                rules={[
                  {
                    required: true,
                    message: "Please select who this belongs to",
                  },
                ]}
              >
                <Select size="large" placeholder="Select entity">
                  <Option value="Blue Pulse Ventures Pvt Lmtd.">
                    Blue Pulse Ventures Pvt Lmtd.
                  </Option>
                  <Option value="Sky Blue Event Management India Pvt Lmtd.">
                    Sky Blue Event Management India Pvt Lmtd.
                  </Option>
                  <Option value="Dhrua Kumar H P">Dhrua Kumar H P</Option>
                  <Option value="Monica">Monica</Option>
                </Select>
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
                  rules={[
                    { required: true, message: "Please specify EMI type" },
                  ]}
                >
                  <Input size="large" placeholder="Enter EMI type" />
                </Form.Item>
              )}

              <Form.Item
                label="Start Date"
                name="startDate"
                rules={[{ required: true, message: "Please select start date" }]}
              >
                <DatePicker size="large" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label="Frequency"
                name="frequency"
                initialValue="MONTHLY"
                rules={[{ required: true, message: "Please select frequency" }]}
              >
                <Select size="large" placeholder="Select frequency">
                  <Option value="MONTHLY">Monthly</Option>
                  <Option value="QUARTERLY">Quarterly</Option>
                  <Option value="YEARLY">Yearly</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="EMI End Date"
                name="emiEndDate"
                rules={[
                  { required: true, message: "Please select EMI end date" },
                ]}
              >
                <DatePicker size="large" style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item
                label="Amount"
                name="amount"
                rules={[
                  { required: true, message: "Please enter amount" },
                  {
                    type: "number",
                    min: 1,
                    message: "Amount must be positive",
                  },
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  min={1}
                  formatter={(value) =>
                    `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  }
                  parser={(value) => value.replace(/₹\s?|(,*)/g, "")}
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
