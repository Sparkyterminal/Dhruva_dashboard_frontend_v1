import React, { useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { Card, message } from "antd";
import LeadForm from "./LeadForm";
import { API_BASE_URL } from "../../../../config";

const AddLeads = ({ onSuccess, inDrawer = false }) => {
  const [loading, setLoading] = useState(false);
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}client-leads`, values, config);
      const created = res.data?.data ?? res.data;
      if (onSuccess) {
        onSuccess(created);
      } else {
        message.success("Lead added successfully.");
      }
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to add lead.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: inDrawer ? 0 : 24 }}>
      <Card
        title="Status"
        bordered={false}
        style={inDrawer ? { boxShadow: "none" } : {}}
        bodyStyle={inDrawer ? { padding: "0 0 16px 0" } : {}}
      >
        <LeadForm
          onSubmit={handleSubmit}
          submitLabel="Add lead"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default AddLeads;
