import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { Select, message, Button, Card } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { API_BASE_URL } from "../../../../config";
import DataGridSpreadsheet from "./DataGridspreadsheet";
import AgreedAmountBreakupCard from "./AgreedAmountBreakupCard";

const BudgetReportHome = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [clients, setClients] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [loading, setLoading] = useState(false);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}events`, {
          ...config,
          params: { page: 1, limit: 1000 },
        });
        const bookings = res.data.events || res.data.data || res.data || [];
        const confirmedEvents = bookings.filter(
          (booking) => booking.eventConfirmation === "Confirmed Event",
        );
        setClients(confirmedEvents);
      } catch (err) {
        message.error("Failed to fetch client bookings");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getEventName = (eventName) => {
    if (typeof eventName === "string") return eventName;
    return eventName?.name || "N/A";
  };

  const selectedEvent = selectedEventId
    ? clients.find((c) => c._id === selectedEventId) || null
    : null;

  return (
    <div
      className="budget-report-container"
      style={{
        padding: "24px",
        maxWidth: 1400,
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      <Card
        style={{
          marginBottom: 24,
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
        bodyStyle={{ padding: "20px 24px" }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate("/user/budgetreport/eventwise")}
              size="large"
              style={{ borderRadius: 8 }}
            >
              Back
            </Button>
            <h1
              className="budget-report-title"
              style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              Budget Report
            </h1>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: "1 1 320px",
              minWidth: 280,
              maxWidth: 420,
              justifyContent: "flex-end",
            }}
          >
            <label
              style={{
                fontWeight: 600,
                color: "#475569",
                fontSize: "14px",
                whiteSpace: "nowrap",
              }}
            >
              Select Confirmed Event:
            </label>
            <Select
              style={{ flex: 1, minWidth: 200, borderRadius: 8 }}
              placeholder="Select a confirmed event"
              loading={loading}
              value={selectedEventId}
              onChange={setSelectedEventId}
              showSearch
              size="large"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={clients.map((client) => ({
                value: client._id,
                label: `${getEventName(client.eventName)} - ${client.clientName || "N/A"}`,
              }))}
            />
          </div>
        </div>
      </Card>

      {selectedEvent && (
        <div style={{ marginBottom: 24 }}>
          <AgreedAmountBreakupCard event={selectedEvent} />
        </div>
      )}

      <Card
        style={{
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
        Style={{ padding: "20px 24px" }}
      >
        <div
          className="budget-report-grid"
          style={{ minHeight: 480, height: "calc(100vh - 220px)" }}
        >
          <DataGridSpreadsheet selectedEventId={selectedEventId} />
        </div>
      </Card>
    </div>
  );
};

export default BudgetReportHome;
