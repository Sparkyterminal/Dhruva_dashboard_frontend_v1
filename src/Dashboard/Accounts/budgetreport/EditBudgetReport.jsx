import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { Spin, Alert, Button, Card, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { API_BASE_URL } from "../../../../config";
import { parseBudgetDataToRowData } from "./budgetReportUtils";
import DataGridSpreadsheet from "./DataGridspreadsheet";

const { Title, Text } = Typography;

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
      <div className="budget-report-container flex items-center justify-center min-h-[50vh]">
        <Spin size="large" tip="Loading report…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="budget-report-container">
        <div className="budget-report-shell max-w-2xl pt-8">
          <Alert
            type="error"
            showIcon
            message={error}
            className="rounded-xl"
            action={
              <span
                className="cursor-pointer underline text-indigo-600"
                onClick={() => navigate("/user/budgetreport/eventwise")}
              >
                Back to list
              </span>
            }
          />
        </div>
      </div>
    );
  }

  if (!initialRowData?.length || !eventId) {
    return (
      <div className="budget-report-container">
        <div className="budget-report-shell max-w-2xl pt-8">
          <Alert
            type="warning"
            showIcon
            message="No report data or event found."
            className="rounded-xl"
            action={
              <span
                className="cursor-pointer underline text-indigo-600"
                onClick={() => navigate("/user/budgetreport/eventwise")}
              >
                Back to list
              </span>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="budget-report-container">
      <div className="budget-report-shell space-y-6">
        <Card
          className="border-0 shadow-md"
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(226,232,240,0.9)",
          }}
          bodyStyle={{ padding: "20px 24px" }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button
              icon={<ArrowLeftOutlined />}
              size="large"
              className="rounded-xl"
              onClick={() => navigate("/user/budgetreport/eventwise")}
            >
              Back
            </Button>
            <div>
              <Title level={3} className="!mb-0 !text-slate-800">
                Edit budget report
              </Title>
              <Text type="secondary" className="text-sm">
                Update line items and submit to save changes.
              </Text>
            </div>
          </div>
        </Card>
        <Card
          className="border-0 shadow-md overflow-hidden"
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(226,232,240,0.9)",
          }}
          bodyStyle={{ padding: "16px 20px 20px" }}
        >
          <div className="budget-report-grid" style={{ height: "calc(100vh - 220px)", minHeight: 480 }}>
            <DataGridSpreadsheet
              selectedEventId={eventId}
              initialRowData={initialRowData}
              reportId={id}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EditBudgetReport;
