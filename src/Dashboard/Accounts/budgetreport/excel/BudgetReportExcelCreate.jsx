import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button, Card, Select, Typography, message } from "antd";
import { ArrowLeftOutlined, FileExcelOutlined } from "@ant-design/icons";
import {
  fetchBudgetReportEligibleEvents,
  fetchBudgetReportWorkbook,
} from "./budgetReportExcelApi";
import {
  getEventDisplayLabel,
  getEventId,
  getEventName,
} from "./budgetReportExcelUtils";
import AgreedAmountBreakupCard from "../AgreedAmountBreakupCard";

const { Title, Text } = Typography;

/**
 * Create / open budget report Excel for a Confirmed or InProgress event.
 * Selecting an event opens the editable Excel workspace mapped to that event.
 */
const BudgetReportExcelCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.user.value);
  const authHeaders = { headers: { Authorization: user?.access_token } };

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(
    location.state?.preselectedEventId
      ? String(location.state.preselectedEventId)
      : null,
  );
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);

  const loadEvents = useCallback(async () => {
    if (!user?.access_token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchBudgetReportEligibleEvents({ authHeaders });
      setEvents(list);

      const preId = location.state?.preselectedEventId
        ? String(location.state.preselectedEventId)
        : null;
      if (preId) {
        setSelectedEventId(preId);
        const inList = list.some((e) => String(getEventId(e)) === preId);
        if (!inList) {
          message.warning(
            "Preselected event is not in the eligible list (Confirmed / In Progress). You can still open it if the id is valid.",
          );
        }
      }
    } catch (err) {
      console.error(err);
      message.error(
        err?.response?.data?.message ||
          "Failed to load confirmed / in-progress events",
      );
      setEvents([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.access_token, location.state?.preselectedEventId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const selectedEvent = selectedEventId
    ? events.find((e) => String(getEventId(e)) === String(selectedEventId)) ||
      null
    : null;

  const openExcel = async () => {
    if (!selectedEventId) {
      message.warning("Select a confirmed or in-progress event first.");
      return;
    }
    setOpening(true);
    try {
      // Probe existing workbook so user knows if they are creating vs editing
      const doc = await fetchBudgetReportWorkbook({
        eventId: selectedEventId,
        authHeaders,
      });
      if (doc?.workbookData) {
        message.info("Opening existing budget report Excel for this event.");
      } else {
        message.info("Creating a new budget report Excel for this event.");
      }
      navigate(`/user/budgetreport/edit/${selectedEventId}`, {
        state: {
          eventName: selectedEvent
            ? getEventName(selectedEvent.eventName)
            : undefined,
          clientName: selectedEvent?.clientName,
          eventLabel: selectedEvent
            ? getEventDisplayLabel(selectedEvent)
            : undefined,
        },
      });
    } catch (err) {
      // Still allow navigation — blank workbook on 404
      navigate(`/user/budgetreport/edit/${selectedEventId}`, {
        state: {
          eventName: selectedEvent
            ? getEventName(selectedEvent.eventName)
            : undefined,
          clientName: selectedEvent?.clientName,
          eventLabel: selectedEvent
            ? getEventDisplayLabel(selectedEvent)
            : undefined,
        },
      });
    } finally {
      setOpening(false);
    }
  };

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
                  Add budget report Excel
                </Title>
                <Text type="secondary" className="text-sm block mt-1">
                  Map a multi-sheet Excel workbook to a confirmed or in-progress
                  event.
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
                maxWidth: 520,
                justifyContent: "flex-end",
              }}
            >
              <Text strong className="text-slate-600 whitespace-nowrap text-sm">
                Event
              </Text>
              <Select
                className="min-w-[200px] flex-1"
                placeholder="Select confirmed or in-progress event"
                loading={loading}
                value={selectedEventId}
                onChange={setSelectedEventId}
                showSearch
                size="large"
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={events.map((ev) => ({
                  value: String(getEventId(ev)),
                  label: `${getEventName(ev.eventName)} - ${ev.clientName || "N/A"} (${ev.eventConfirmation || "—"})`,
                }))}
              />
            </div>
          </div>
        </Card>

        {selectedEvent && (
          <div style={{ marginBottom: 8 }}>
            <AgreedAmountBreakupCard event={selectedEvent} />
          </div>
        )}

        <Card
          className="border-0 shadow-md"
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.95)",
            border: "1px solid rgba(226,232,240,0.9)",
          }}
          bodyStyle={{ padding: "28px 24px" }}
        >
          <div className="flex flex-col items-start gap-4 max-w-xl">
            <Text className="text-slate-600">
              {selectedEventId
                ? `Ready to open Excel for: ${
                    selectedEvent
                      ? getEventDisplayLabel(selectedEvent)
                      : selectedEventId
                  }`
                : "Select a confirmed or in-progress event above, then open the Excel editor. You can add multiple sheets and large data per sheet."}
            </Text>
            <Button
              type="primary"
              size="large"
              icon={<FileExcelOutlined />}
              loading={opening}
              disabled={!selectedEventId}
              className="rounded-xl border-0"
              style={{
                background:
                  "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)",
              }}
              onClick={openExcel}
            >
              Open Excel editor
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BudgetReportExcelCreate;
