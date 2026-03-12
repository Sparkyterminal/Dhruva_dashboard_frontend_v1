/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { AlertCircle } from "lucide-react";
import axios from "axios";
import { Modal, message, Tooltip } from "antd";
import { useSelector } from "react-redux";
import { API_BASE_URL } from "../../config";

const STATUS_COLORS = {
  Cancelled: { bg: "#fecaca", border: "#ef4444", text: "#991b1b" },
  Confirmed: { bg: "#bbf7d0", border: "#22c55e", text: "#166534" },
  Inprogress: { bg: "#fef9c3", border: "#eab308", text: "#854d0e" },
};

const LeadsCalendar = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const calendarRef = useRef(null);
  const user = useSelector((state) => state.user.value);

  const fetchLeads = useCallback(async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      return;
    }

    const config = {
      headers: { Authorization: user?.access_token },
    };

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}client-leads`, config);
      const list = res.data?.data ?? res.data?.leads ?? res.data;
      setLeads(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Error fetching leads:", err);
      if (err.response?.status === 401) {
        message.error("Session expired. Please login again.");
      } else {
        message.error(err.response?.data?.message || "Failed to load leads.");
      }
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const getCalendarEvents = () => {
    const calendarEvents = [];

    leads.forEach((lead) => {
      if (!lead || !(lead._id || lead.id)) return;

      let startDate;
      let endDate;

      if (lead.startDate || lead.endDate) {
        // Use start/end date from API (YYYY-MM-DD or ISO string)
        const startStr = lead.startDate || lead.endDate;
        const endStr = lead.endDate || lead.startDate;
        startDate = new Date(startStr);
        endDate = new Date(endStr);
        if (isNaN(startDate.getTime())) return;
        if (isNaN(endDate.getTime())) endDate = startDate;
        // For all-day range, FullCalendar end is exclusive; add one day so last day is included
        if (endStr && lead.startDate !== lead.endDate) {
          endDate.setUTCDate(endDate.getUTCDate() + 1);
        } else {
          endDate = new Date(startDate);
          endDate.setUTCDate(endDate.getUTCDate() + 1);
        }
      } else {
        // Fallback: no start/end date — use updatedAt or createdAt as single day
        const dateStr = lead.updatedAt || lead.createdAt;
        if (!dateStr) return;
        startDate = new Date(dateStr);
        if (isNaN(startDate.getTime())) return;
        endDate = new Date(startDate);
        endDate.setUTCDate(endDate.getUTCDate() + 1);
      }

      const status = lead.status || "Inprogress";
      const colors = STATUS_COLORS[status] || STATUS_COLORS.Inprogress;

      const clientPreview = lead.clientDetails
        ? String(lead.clientDetails).substring(0, 50) +
          (lead.clientDetails.length > 50 ? "…" : "")
        : "—";

      calendarEvents.push({
        id: lead._id ?? lead.id,
        title: `${clientPreview} - Click for details`,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        allDay: true,
        extendedProps: { lead },
        backgroundColor: colors.bg,
        borderColor: colors.border,
        textColor: colors.text,
      });
    });

    return calendarEvents;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Invalid Date";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderEventContent = (eventInfo) => {
    const lead = eventInfo.event.extendedProps?.lead;
    const status = lead?.status || "Inprogress";
    const clientPreview = lead?.clientDetails
      ? String(lead.clientDetails).substring(0, 40) +
        (lead.clientDetails.length > 40 ? "…" : "")
      : "Lead";

    return (
      <div
        className="p-2 text-xs overflow-hidden leading-snug cursor-pointer"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        title="Click for details"
      >
        <div
          className="font-semibold truncate mb-1"
          style={{ fontSize: "11px" }}
        >
          {clientPreview}
        </div>
        <div className="truncate" style={{ fontSize: "10px" }}>
          {status}
        </div>
      </div>
    );
  };

  const handleEventClick = (info) => {
    const lead = info.event.extendedProps?.lead;
    if (lead) {
      setSelectedLead(lead);
      setModalVisible(true);
    }
  };

  const inProgressCount = leads.filter(
    (l) => (l.status || "").toLowerCase() === "inprogress",
  ).length;
  const confirmedCount = leads.filter(
    (l) => (l.status || "").toLowerCase() === "confirmed",
  ).length;
  const cancelledCount = leads.filter(
    (l) => (l.status || "").toLowerCase() === "cancelled",
  ).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-500 mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading leads…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <style>{`
        .fc { font-family: system-ui, -apple-system, sans-serif; }
        .fc .fc-toolbar-title { font-size: 1.5rem; font-weight: 600; color: #1f2937; }
        .fc-theme-standard td, .fc-theme-standard th { border-color: #e5e7eb; }
        .fc-theme-standard .fc-scrollgrid { border-color: #e5e7eb; }
        .fc .fc-daygrid-day-number { padding: 8px; font-weight: 500; color: #374151; }
        .fc .fc-daygrid-day.fc-day-today { background-color: #fef3c7 !important; }
        .fc .fc-col-header-cell { background-color: #f9fafb; font-weight: 500; color: #4b5563; padding: 12px 0; }
        .fc-event { cursor: pointer; margin: 3px 2px; border-radius: 4px; border-width: 1px; opacity: 1 !important; }
        .fc-event:hover { opacity: 0.9 !important; }
        .fc .fc-button { background-color: #f59e0b; border-color: #f59e0b; text-transform: capitalize; }
        .fc .fc-button:hover { background-color: #d97706; border-color: #d97706; }
        .fc-daygrid-event { white-space: normal !important; overflow: visible !important; }
        .fc-daygrid-day-frame { min-height: 140px !important; }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                }}
              >
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-gray-800">
                  Client Leads Calendar
                </h1>
                <p className="text-gray-600 mt-1">
                  Leads by event start & end date
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="text-sm text-gray-600 px-4 py-2 bg-amber-100 rounded-lg">
                <span className="font-medium">{inProgressCount}</span> In
                Progress
              </div>
              <div className="text-sm text-gray-600 px-4 py-2 bg-green-100 rounded-lg">
                <span className="font-medium">{confirmedCount}</span> Confirmed
              </div>
              <div className="text-sm text-gray-600 px-4 py-2 bg-red-100 rounded-lg">
                <span className="font-medium">{cancelledCount}</span> Cancelled
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Status colors:
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: "#fef9c3", borderColor: "#eab308" }}
                />
                <span className="text-sm text-gray-600">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: "#bbf7d0", borderColor: "#22c55e" }}
                />
                <span className="text-sm text-gray-600">Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded border"
                  style={{ backgroundColor: "#fecaca", borderColor: "#ef4444" }}
                />
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth",
            }}
            events={getCalendarEvents()}
            eventContent={renderEventContent}
            eventClick={handleEventClick}
            height="auto"
            dayMaxEvents={false}
            eventMaxStack={15}
          />
        </div>
      </div>

      <Modal
        title="Lead Details"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedLead(null);
        }}
        footer={null}
        width={560}
        styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}
      >
        {selectedLead && (
          <div className="space-y-5">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Status
              </div>
              <div
                className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor:
                    STATUS_COLORS[selectedLead.status]?.bg ||
                    STATUS_COLORS.Inprogress.bg,
                  color:
                    STATUS_COLORS[selectedLead.status]?.text ||
                    STATUS_COLORS.Inprogress.text,
                  border: `1px solid ${STATUS_COLORS[selectedLead.status]?.border || STATUS_COLORS.Inprogress.border}`,
                }}
              >
                {selectedLead.status || "—"}
              </div>
            </div>

            {(selectedLead.assignedTo || selectedLead.assignedTo?.name) && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Assign to
                </div>
                <div className="text-base text-gray-800">
                  {typeof selectedLead.assignedTo === "object"
                    ? selectedLead.assignedTo?.name ||
                      selectedLead.assignedTo?.email ||
                      "—"
                    : selectedLead.assignedTo}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Client details
              </div>
              <div className="text-base text-gray-800 whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg">
                {selectedLead.clientDetails || "—"}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Event type details
              </div>
              <div className="text-base text-gray-800 whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg">
                {selectedLead.eventTypeDetails || "—"}
              </div>
            </div>

            {(selectedLead.startDate || selectedLead.endDate) && (
              <div className="flex gap-4 flex-wrap">
                {selectedLead.startDate && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Start date
                    </div>
                    <div className="text-base text-gray-800">
                      {formatDate(selectedLead.startDate)}
                    </div>
                  </div>
                )}
                {selectedLead.endDate && (
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      End date
                    </div>
                    <div className="text-base text-gray-800">
                      {formatDate(selectedLead.endDate)}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Notes
              </div>
              <div className="text-base text-gray-800 whitespace-pre-wrap break-words bg-gray-50 p-3 rounded-lg">
                {selectedLead.notes || "—"}
              </div>
            </div>

            <div className="flex gap-4 text-sm text-gray-500 border-t pt-4">
              <span>Created: {formatDate(selectedLead.createdAt)}</span>
              {selectedLead.updatedAt && (
                <span>Updated: {formatDate(selectedLead.updatedAt)}</span>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeadsCalendar;
