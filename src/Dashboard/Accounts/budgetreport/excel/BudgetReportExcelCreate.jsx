import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { Select, message } from "antd";
import { FileSpreadsheet } from "lucide-react";
import { PageHero } from "@/Components/PageKit";
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
    } catch {
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
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero
          eyebrow="Budget reports"
          title="Add budget report"
          subtitle="Pick a confirmed or in-progress event, then open its multi-sheet Excel workbook."
          onBack={() => navigate("/user/budgetreport/eventwise")}
          backLabel="Back to reports"
        />

        <section className="pk-panel">
          <div className="pk-toolbar">
            <div className="pk-toolbar-left" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
              <label htmlFor="br-event" style={{ fontWeight: 600, color: "var(--ink)" }}>
                1. Choose the event
              </label>
              <Select
                id="br-event"
                placeholder="Select confirmed or in-progress event"
                loading={loading}
                value={selectedEventId}
                onChange={setSelectedEventId}
                showSearch
                size="large"
                style={{ width: "100%", maxWidth: 640 }}
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={events.map((ev) => ({
                  value: String(getEventId(ev)),
                  label: `${getEventName(ev.eventName)} - ${ev.clientName || "N/A"} (${ev.eventConfirmation || "—"})`,
                }))}
              />
            </div>
          </div>

          <div style={{ padding: "20px" }}>
            {selectedEvent ? (
              <div style={{ marginBottom: 20 }}>
                <AgreedAmountBreakupCard event={selectedEvent} />
              </div>
            ) : null}

            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
              <label style={{ fontWeight: 600, color: "var(--ink)" }}>2. Open the workbook</label>
              <p className="pk-muted" style={{ margin: 0, maxWidth: 560 }}>
                {selectedEventId
                  ? `Ready to open Excel for: ${
                      selectedEvent ? getEventDisplayLabel(selectedEvent) : selectedEventId
                    }`
                  : "Select an event above first. You can then add multiple sheets with plenty of data on each."}
              </p>
              <button
                type="button"
                className="pk-btn is-solid"
                style={{ padding: "11px 20px", fontSize: 14 }}
                disabled={!selectedEventId || opening}
                onClick={openExcel}
              >
                <FileSpreadsheet size={16} aria-hidden="true" />
                {opening ? "Opening…" : "Open Excel editor"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BudgetReportExcelCreate;
