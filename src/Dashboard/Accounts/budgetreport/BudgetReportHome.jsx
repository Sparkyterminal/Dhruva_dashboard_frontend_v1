import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { Select, message, Button, Card, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
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
    <div className="budget-report-container">
      <div className="budget-report-shell space-y-6">
      <Card
        className="border-0 shadow-md"
        style={{
          marginBottom: 0,
          borderRadius: 16,
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(226,232,240,0.9)",
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
              className="rounded-xl"
            >
              Back
            </Button>
            <div>
              <Title level={3} className="!mb-0 !text-slate-800">
                Budget report
              </Title>
              <Text type="secondary" className="text-sm block mt-1">
                Pick a confirmed event, then fill or review the spreadsheet below.
              </Text>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flex: "1 1 320px",
              minWidth: 280,
              maxWidth: 480,
              justifyContent: "flex-end",
            }}
          >
            <Text strong className="text-slate-600 whitespace-nowrap text-sm">
              Confirmed event
            </Text>
            <Select
              className="min-w-[200px] flex-1"
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
        className="border-0 shadow-md overflow-hidden"
        style={{
          borderRadius: 16,
          background: "rgba(255,255,255,0.95)",
          border: "1px solid rgba(226,232,240,0.9)",
        }}
        bodyStyle={{ padding: "16px 20px 20px" }}
      >
        {!selectedEventId && (
          <div className="mb-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3 text-sm text-slate-600">
            Select an event above to enable saving. You can still explore the grid
            layout beforehand.
          </div>
        )}
        <div
          className="budget-report-grid"
          style={{ minHeight: 480, height: "calc(100vh - 260px)" }}
        >
          <DataGridSpreadsheet selectedEventId={selectedEventId} />
        </div>
      </Card>
      </div>
    </div>
  );
};

export default BudgetReportHome;
