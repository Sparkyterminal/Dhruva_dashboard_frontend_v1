import React, { useState } from "react";
import { Form, Input, Button, Row, Col, Typography, Select } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import axios from 'axios';
import { API_BASE_URL } from "../../../../config";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const { Title } = Typography;
const { Option } = Select;

const AddVendor = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const user = useSelector(state => state.user.value);
  const [showOtherVendorType, setShowOtherVendorType] = useState(false);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const onFinish = (values) => {
    // Prepare the JSON payload
    const payload = {
      name: values.name,
      person_category: values.person_category,
      company_name: values.company_name || null,
      referred_by: values.referred_by || null,
      temp_address_1: values.temp_address_1,
      temp_city: values.temp_city,
      temp_pin: values.temp_pin,
      temp_state: values.temp_state,
      temp_country: values.temp_country,
      perm_address_2: values.perm_address_2 || null,
      perm_city: values.perm_city || null,
      perm_pin: values.perm_pin || null,
      perm_state: values.perm_state || null,
      perm_country: values.perm_country || null,
      cont_person: values.cont_person,
      designation: values.designation || null,
      mobile_no: values.mobile_no,
      alt_mobile_no: values.alt_mobile_no || null,
      email: values.email,
      vendor_type: values.vendor_type === 'Other' ? values.vendor_type_other : values.vendor_type,
      gst_no: values.gst_no,
      msmed_no: values.msmed_no,
      pan_no: values.pan_no,
      bank_name: values.bank_name,
      beneficiary_name: values.beneficiary_name || null,
      bank_pin: values.bank_pin || null,
      account_number: values.account_number,
      ifscode: values.ifscode,
      branch: values.branch || null,
      payment_terms: values.payment_terms || null,
      tds_details: values.tds_details || null
    };

    console.log('Payload being sent:', JSON.stringify(payload, null, 2));

    axios.post(`${API_BASE_URL}vendor`, payload, config)
      .then(response => {
        console.log('Vendor added successfully:', response.data);
        form.resetFields();
        setShowOtherVendorType(false);
      })
      .catch(error => {
        console.error('Failed to add vendor:', error);
      });
  };

  const handleVendorTypeChange = (value) => {
    if (value === 'Other') {
      setShowOtherVendorType(true);
      form.setFieldsValue({ vendor_type_other: '' });
    } else {
      setShowOtherVendorType(false);
      form.setFieldsValue({ vendor_type_other: undefined });
    }
  };

  return (
    <div style={{
      maxWidth: 800,
      margin: 'auto',
      padding: 20,
      fontFamily: "cormoreg",
      paddingTop: 10
    }}>
      <Row align="middle" style={{ paddingBottom: 16 }}>
        <Col>
          <Button type="link" onClick={() => navigate(-1)} icon={<LeftOutlined />} style={{ fontSize: 20, padding: 0 }}>
            <span style={{ borderBottom: 'none' }} className="back-button-text font-[cormoreg]">Back</span>
          </Button>
        </Col>
      </Row>

      <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Add Vendor Details</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        size="large"
      >

        {/* Vendor Info */}
        <Title level={5}>Vendor Information</Title>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="name" label="Name of the Vendor" rules={[{ required: true, message: 'Please enter vendor name' }]}>
              <Input placeholder="Enter vendor name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="person_category" label="Category of Person" rules={[{ required: true, message: 'Please select category of person' }]}>
              <Select placeholder="Select category of person">
                <Option value="Individual">Individual</Option>
                <Option value="HUF">HUF</Option>
                <Option value="FIRM">FIRM</Option>
                <Option value="COMPANY">COMPANY</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="company_name" label="Company Name">
              <Input placeholder="Enter company name (if any)" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="referred_by" label="Referred By">
              <Input placeholder="Enter referrer name" />
            </Form.Item>
          </Col>
        </Row>

        {/* Address Section */}
        <Title level={5}>Address (Temporary)</Title>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="temp_address_1" label="Address 1" rules={[{ required: true, message: 'Please enter temporary address' }]}>
              <Input placeholder="Temporary address 1" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="temp_city" label="City" rules={[{ required: true, message: 'Please enter city' }]}>
              <Input placeholder="City" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="temp_pin" label="PIN Code" rules={[{ required: true, message: 'Please enter PIN code' }]}>
              <Input placeholder="PIN code" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="temp_state" label="State" rules={[{ required: true, message: 'Please enter state' }]}>
              <Input placeholder="State" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="temp_country" label="Country" rules={[{ required: true, message: 'Please enter country' }]}>
              <Input placeholder="Country" />
            </Form.Item>
          </Col>
        </Row>

        <Title level={5}>Address (Permanent)</Title>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="perm_address_2" label="Address 2">
              <Input placeholder="Permanent address 2" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="perm_city" label="City">
              <Input placeholder="City" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="perm_pin" label="PIN Code">
              <Input placeholder="PIN code" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="perm_state" label="State">
              <Input placeholder="State" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="perm_country" label="Country">
              <Input placeholder="Country" />
            </Form.Item>
          </Col>
        </Row>

        {/* Contact Info */}
        <Title level={5}>Contact Information</Title>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="cont_person" label="Contact Person" rules={[{ required: true, message: 'Please enter contact person name' }]}>
              <Input placeholder="Contact person name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="designation" label="Designation">
              <Input placeholder="Designation" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="mobile_no" label="Mobile No." rules={[{ required: true, message: 'Please enter mobile number' }]}>
              <Input placeholder="Mobile number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="alt_mobile_no" label="Alternative Mobile No.">
              <Input placeholder="Alternative mobile number" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="email" label="Email" rules={[{ type: 'email', required: true, message: 'Please enter valid email' }]}>
              <Input placeholder="Email" />
            </Form.Item>
          </Col>
        </Row>

        {/* Vendor Business Info */}
        <Title level={5}>Business Details</Title>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="vendor_type" label="Type Of Vendor" rules={[{ required: true, message: 'Please select type of vendor' }]}>
              <Select placeholder="Select type of vendor" onChange={handleVendorTypeChange}>
                <Option value="Material">Material</Option>
                <Option value="Labour">Labour</Option>
                <Option value="Composite">Composite</Option>
                <Option value="Expense">Expense</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          {showOtherVendorType && (
            <Col xs={24} sm={12}>
              <Form.Item name="vendor_type_other" label="Specify Other Type" rules={[{ required: true, message: 'Please specify vendor type' }]}>
                <Input placeholder="Enter vendor type" />
              </Form.Item>
            </Col>
          )}
          <Col xs={24} sm={6}>
            <Form.Item name="gst_no" label="GST No" rules={[{ required: true, message: 'Please enter GST number' }]}>
              <Input placeholder="GST number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="msmed_no" label="MSMED No" rules={[{ required: true, message: 'Please enter MSMED number' }]}>
              <Input placeholder="MSMED number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="pan_no" label="PAN No" rules={[{ required: true, message: 'Please enter PAN number' }]}>
              <Input placeholder="PAN number" />
            </Form.Item>
          </Col>
        </Row>

        {/* Bank Section */}
        <Title level={5}>Bank Details</Title>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="bank_name" label="Bank Name" rules={[{ required: true, message: 'Please enter bank name' }]}>
              <Input placeholder="Bank Name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="beneficiary_name" label="Beneficiary Name/Company Name">
              <Input placeholder="Beneficiary Name" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="bank_pin" label="Bank PIN Code">
              <Input placeholder="Bank PIN Code" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="account_number" label="Account Number" rules={[{ required: true, message: 'Please enter account number' }]}>
              <Input placeholder="Account Number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="ifscode" label="IFSC Code" rules={[{ required: true, message: 'Please enter IFSC' }]}>
              <Input placeholder="IFSC CODE" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="branch" label="Branch">
              <Input placeholder="Branch" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="payment_terms" label="Payment Terms">
              <Input placeholder="Payment Terms" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="tds_details" label="TDS Rate & Section (If Service Vendor)">
              <Input placeholder="TDS Rate & Section" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" block size="large">
            Submit
          </Button>
        </Form.Item>
      </Form>
      <style>{`
        .back-button-text:hover {
          border-bottom: 1px solid;
        }
        @media (min-width: 768px) {
          div[style*='maxWidth: 600px'] {
            max-width: 800px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AddVendor;