import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { Spin, Alert, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { API_BASE_URL } from "../../../../config";
import { parseBudgetDataToRowData } from "./budgetReportUtils";
import DataGridSpreadsheet from "./DataGridspreadsheet";

const EditBudgetReport = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [initialRowData, setInitialRowData] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  const fetchReport = useCallback(async () => {
    if (!id) {
      setError("Missing report ID");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}budget-report/${id}`, config);
      const raw = res.data?.data ?? res.data;
      const budgetData = raw?.budgetData ?? raw;
      const eventIdFromApi = raw?.eventId ?? raw?.event?._id ?? raw?.event;
      const parsedId =
        typeof eventIdFromApi === "string"
          ? eventIdFromApi
          : eventIdFromApi?._id ?? null;
      setEventId(parsedId);
      const rows = parseBudgetDataToRowData(budgetData);
      setInitialRowData(rows);
    } catch (err) {
      console.error("Error fetching budget report:", err);
      setError(
        err.response?.data?.message || "Failed to load budget report.",
      );
      setInitialRowData(null);
    } finally {
      setLoading(false);
    }
  }, [id, config.headers?.Authorization]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <Spin size="large" tip="Loading report…" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="error"
          showIcon
          message={error}
          action={
            <span
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/user/budgetreport/eventwise")}
            >
              Back to list
            </span>
          }
        />
      </div>
    );
  }

  if (!initialRowData?.length || !eventId) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          type="warning"
          message="No report data or event found."
          action={
            <span
              style={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => navigate("/user/budgetreport/eventwise")}
            >
              Back to list
            </span>
          }
        />
      </div>
    );
  }

  return (
    <div className="budget-report-container" style={{ padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/user/budgetreport/eventwise")}
          >
            Back
          </Button>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 600 }}>
            Edit Budget Report
          </h1>
        </div>
      </div>
      <div className="budget-report-grid">
        <DataGridSpreadsheet
          selectedEventId={eventId}
          initialRowData={initialRowData}
          reportId={id}
        />
      </div>
    </div>
  );
};

export default EditBudgetReport;
