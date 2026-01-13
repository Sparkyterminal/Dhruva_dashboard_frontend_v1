/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Form, Input, Button, Row, Col, message, Select } from "antd";
const { Option } = Select;
import { LeftOutlined } from "@ant-design/icons";
import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";

const EditVendor = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useSelector((state) => state.user.value);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const [showOtherVendorType, setShowOtherVendorType] = useState(false);

  const handleVendorTypeChange = (value) => {
    if (value === "Other") {
      setShowOtherVendorType(true);
      form.setFieldsValue({ vendor_type_other: "" });
    } else {
      setShowOtherVendorType(false);
      form.setFieldsValue({ vendor_type_other: undefined });
    }
  };

  // Fetch vendor details by id and prefill the form
  const fetchVendorData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}vendor/${id}`, config);
      if (res.data && res.data.vendor) {
        // Prefill form fields, matching the AddVendor naming conventions
        // Map the received vendor data keys to form fields accordingly
        const vendor = res.data.vendor;
        form.setFieldsValue({
          name: vendor.name || "",
          person_category: vendor.person_category || "",
          company_name: vendor.company_name || "",
          referred_by: vendor.referred_by || vendor.refered_by || "",
          temp_address_1: vendor.temp_address_1 || "",
          temp_city: vendor.temp_city || "",
          temp_pin: vendor.temp_pin || "",
          temp_state: vendor.temp_state || "",
          temp_country: vendor.temp_country || "",
          perm_address_2: vendor.perm_address_2 || vendor.perm_address_1 || "",
          perm_city: vendor.perm_city || "",
          perm_pin: vendor.perm_pin || "",
          perm_state: vendor.perm_state || "",
          perm_country: vendor.perm_country || "",
          cont_person: vendor.cont_person || "",
          designation: vendor.designation || "",
          mobile_no: vendor.mobile_no || "",
          alt_mobile_no: vendor.alt_mobile_no || "",
          email: vendor.email || "",
          vendor_type: vendor.vendor_type || "",
          vendor_type_other: vendor.vendor_type === "Other" ? vendor.vendor_type_other || "" : undefined,
          gst_no: vendor.gst_no || "",
          msmed_no: vendor.msmed_no || "",
          pan_no: vendor.pan_no || "",
          bank_name: vendor.bank_name || "",
          beneficiary_name: vendor.beneficiary_name || "",
          bank_address_1: vendor.bank_address_1 || "",
          bank_address_2: vendor.bank_address_2 || "",
          bank_pin: vendor.bank_pin || "",
          account_number: vendor.account_number || "",
          ifscode: vendor.ifscode || "",
          branch: vendor.branch || "",
          payment_terms: vendor.payment_terms || "",
          tds_details: vendor.tds_details || "",
        });

        if (vendor.vendor_type === "Other") setShowOtherVendorType(true);
      }
    } catch (error) {
      message.error("Failed to fetch vendor details");
    }
  };

  useEffect(() => {
    fetchVendorData();
    // eslint-disable-next-line
  }, []);

  // Handle form submission for update
  const onFinish = async (values) => {
    // Build payload similar to AddVendor
    const payload = {
      name: values.name,
      person_category: values.person_category,
      company_name: values.company_name || null,
      referred_by: values.referred_by || values.refered_by || null,
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
      bank_address_1: values.bank_address_1 || null,
      bank_address_2: values.bank_address_2 || null,
      bank_pin: values.bank_pin || null,
      account_number: values.account_number,
      ifscode: values.ifscode,
      branch: values.branch || null,
      payment_terms: values.payment_terms || null,
      tds_details: values.tds_details || null,
    };

    try {
      await axios.put(`${API_BASE_URL}vendor/${id}`, payload, config);
      message.success("Vendor updated successfully");
      navigate(-1);
    } catch (error) {
      message.error("Failed to update vendor");
    }
  };

  return (
    <div
      style={{
        maxWidth: 800,
        margin: "auto",
        padding: 20,
        fontFamily: "cormoreg",
        paddingTop: 10,
      }}
    >
      <Row align="middle" style={{ paddingBottom: 16 }}>
        <Col>
          <Button
            type="link"
            onClick={() => navigate(-1)}
            icon={<LeftOutlined />}
            style={{ fontSize: 20, padding: 0 }}
          >
            <span
              style={{ borderBottom: "none" }}
              className="back-button-text font-[cormoreg]"
            >
              Back
            </span>
          </Button>
        </Col>
      </Row>

      <h1
        className="text-2xl font-semibold"
        style={{ textAlign: "center", marginBottom: 24 }}
      >
        Edit Vendor Details
      </h1>

      <Form form={form} layout="vertical" onFinish={onFinish} size="large">
        {/* Vendor Info */}
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="name"
              label="Name of the Vendor"
              rules={[{ required: true, message: "Please enter vendor name" }]}
            >
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

        {/* Address (Temporary) */}
        <h5>Address (Temporary)</h5>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="temp_address_1"
              label="Address 1"
              rules={[{ required: true, message: "Please enter temporary address" }]}
            >
              <Input placeholder="Temporary address 1" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              name="temp_city"
              label="City"
              rules={[{ required: true, message: "Please enter city" }]}
            >
              <Input placeholder="City" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              name="temp_pin"
              label="PIN Code"
              rules={[{ required: true, message: "Please enter PIN code" }]}
            >
              <Input placeholder="PIN code" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="temp_state"
              label="State"
              rules={[{ required: true, message: "Please enter state" }]}
            >
              <Input placeholder="State" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="temp_country"
              label="Country"
              rules={[{ required: true, message: "Please enter country" }]}
            >
              <Input placeholder="Country" />
            </Form.Item>
          </Col>
        </Row>

        {/* Address (Permanent) */}
        <h5>Address (Permanent)</h5>
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

        {/* Contact Info */}
        <h5>Contact Information</h5>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="cont_person"
              label="Contact Person"
              rules={[{ required: true, message: "Please enter contact Company Name" }]}
            >
              <Input placeholder="Contact Company Name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item name="designation" label="Designation">
              <Input placeholder="Designation" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              name="mobile_no"
              label="Mobile No."
              rules={[{ required: true, message: "Please enter mobile number" }]}
            >
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
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: "email", required: true, message: "Please enter valid email" }]}
            >
              <Input placeholder="Email" />
            </Form.Item>
          </Col>
        </Row>

        {/* Vendor Business Info */}
        <h5>Business Details</h5>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="vendor_type"
              label="Type Of Vendor"
              rules={[{ required: true, message: "Please select type of vendor" }]}
            >
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
            <Form.Item
              name="gst_no"
              label="GST No"
              rules={[{ required: true, message: "Please enter GST number" }]}
            >
              <Input placeholder="GST number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              name="msmed_no"
              label="MSMED No"
              rules={[{ required: true, message: "Please enter MSMED number" }]}
            >
              <Input placeholder="MSMED number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={6}>
            <Form.Item
              name="pan_no"
              label="PAN No"
              rules={[{ required: true, message: "Please enter PAN number" }]}
            >
              <Input placeholder="PAN number" />
            </Form.Item>
          </Col>
        </Row>

        {/* Bank Section */}
        <h5>Bank Details</h5>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item
              name="bank_name"
              label="Bank Name"
              rules={[{ required: true, message: "Please enter bank name" }]}
            >
              <Input placeholder="Bank Name" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="beneficiary_name" label="Beneficiary Name">
              <Input placeholder="Beneficiary Name" />
            </Form.Item>
          </Col>
        </Row>
        {/* <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item name="bank_address_1" label="Bank Address 1">
              <Input placeholder="Bank Address 1" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="bank_address_2" label="Bank Address 2">
              <Input placeholder="Bank Address 2" />
            </Form.Item>
          </Col>
        </Row> */}
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="bank_pin" label="PIN Code">
              <Input placeholder="PIN Code" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="account_number"
              label="Account Number"
              rules={[{ required: true, message: "Please enter account number" }]}
            >
              <Input placeholder="Account Number" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item
              name="ifscode"
              label="IFSC Code"
              rules={[{ required: true, message: "Please enter IFSC" }]}
            >
              <Input placeholder="IFSC CODE" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="branch" label="Branch">
              <Input placeholder="Branch" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
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
            Update
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

export default EditVendor;