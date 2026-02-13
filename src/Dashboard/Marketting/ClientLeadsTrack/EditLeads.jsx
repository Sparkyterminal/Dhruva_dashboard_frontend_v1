import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { Card, Spin, Alert, Button, message } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import LeadForm from "./LeadForm";
import { API_BASE_URL } from "../../../../config";

const EditLeads = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const config = { headers: { Authorization: user?.access_token } };
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialValues, setInitialValues] = useState(null);
  const [error, setError] = useState(null);

  const fetchLead = useCallback(async () => {
    if (!id) return;
    setFetching(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}client-leads/${id}`, config);
      const raw = res.data?.data ?? res.data;
      setInitialValues(raw);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load lead.");
    } finally {
      setFetching(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config from closure
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await axios.put(`${API_BASE_URL}client-leads/${id}`, values, config);
      message.success("Lead updated successfully.");
      navigate("/user/client-leads");
    } catch (err) {
      message.error(err.response?.data?.message || "Failed to update lead.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <Spin size="large" tip="Loading lead…" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" message={error} showIcon />
        <Button onClick={() => navigate("/user/client-leads")}>Back</Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate("/user/client-leads")}
        style={{ marginBottom: 16 }}
      >
        Back
      </Button>
      <Card title="Status" bordered={false}>
        <LeadForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="Update lead"
          loading={loading}
        />
      </Card>
    </div>
  );
};

export default EditLeads;
