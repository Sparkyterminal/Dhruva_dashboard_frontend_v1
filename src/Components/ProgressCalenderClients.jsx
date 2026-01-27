/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar, MapPin, Clock, Users, AlertCircle } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { message } from "antd";
import { useSelector } from "react-redux";

const ProgressCalenderClients = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const calendarRef = useRef(null);
  const user = useSelector((state) => state.user.value);

  const fetchRequirementsData = useCallback(async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      return;
    }

    const config = {
      headers: { Authorization: user?.access_token },
    };

    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`);

      let eventsData = [];
      if (res.data) {
        if (Array.isArray(res.data.events)) {
          eventsData = res.data.events;
        } else if (Array.isArray(res.data.data)) {
          eventsData = res.data.data;
        } else if (Array.isArray(res.data)) {
          eventsData = res.data;
        }
      }

      // Filter only InProgress and Cancelled events
      eventsData = eventsData.filter((event) => {
        return (
          event &&
          event._id &&
          event.eventName &&
          (event.eventConfirmation === "InProgress" ||
            event.eventConfirmation === "Cancelled")
        );
      });

      setEvents(eventsData);

      if (eventsData.length === 0) {
        message.info("No InProgress or Cancelled events found");
      }
    } catch (err) {
      console.error("Error fetching events:", err);
      if (err.response?.status === 401) {
        message.error("Session expired. Please login again.");
      } else if (err.response?.status === 403) {
        message.error("You don't have permission to view events.");
      } else if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error("Failed to fetch events. Please try again later.");
      }
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.access_token]);

  useEffect(() => {
    fetchRequirementsData();
  }, [fetchRequirementsData]);

  const getCalendarEvents = () => {
    const calendarEvents = [];

    try {
      events.forEach((event) => {
        if (!event) {
          return;
        }

        // Check if meetingDate exists
        if (event.meetingDate) {
          try {
            const meetingDate = new Date(event.meetingDate);

            if (!isNaN(meetingDate.getTime())) {
              calendarEvents.push({
                id: `${event._id}-meeting`,
                title: "",
                start: meetingDate.toISOString(),
                end: meetingDate.toISOString(),
                allDay: true,
                extendedProps: {
                  clientName: formatText(event.clientName) || "Unknown Client",
                  eventName: formatText(event.eventName) || "Untitled Event",
                  eventType: "Meeting",
                  eventConfirmation: event.eventConfirmation || "Pending",
                  isMeeting: true,
                },
                backgroundColor:
                  event.eventConfirmation === "Cancelled"
                    ? "#ef4444"
                    : "#f59e0b",
                borderColor:
                  event.eventConfirmation === "Cancelled"
                    ? "#dc2626"
                    : "#d97706",
                textColor: "#ffffff",
              });
            }
          } catch (error) {
            console.error(
              `Error processing meeting date for event ${event._id}:`,
              error,
            );
          }
        }

        // Process event types if they exist
        if (event.eventTypes && Array.isArray(event.eventTypes)) {
          event.eventTypes.forEach((et, idx) => {
            if (!et || !et.startDate) {
              return;
            }

            try {
              const startDate = new Date(et.startDate);
              const endDate = et.endDate
                ? new Date(et.endDate)
                : new Date(et.startDate);

              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                console.warn(`Invalid date for event ${event._id}-${idx}`);
                return;
              }

              const actualEndDate = endDate < startDate ? startDate : endDate;
              const isSameDay =
                startDate.toDateString() === actualEndDate.toDateString();

              calendarEvents.push({
                id: `${event._id}-${idx}`,
                title: "",
                start: startDate.toISOString(),
                end: isSameDay
                  ? startDate.toISOString()
                  : new Date(
                      actualEndDate.getTime() + 24 * 60 * 60 * 1000,
                    ).toISOString(),
                allDay: true,
                extendedProps: {
                  clientName: formatText(event.clientName) || "Unknown Client",
                  eventName: formatText(event.eventName) || "Untitled Event",
                  eventType: formatText(et.eventType) || "",
                  eventConfirmation: event.eventConfirmation || "Pending",
                  isMeeting: false,
                },
                backgroundColor:
                  event.eventConfirmation === "Cancelled"
                    ? "#ef4444"
                    : "#f59e0b",
                borderColor:
                  event.eventConfirmation === "Cancelled"
                    ? "#dc2626"
                    : "#d97706",
                textColor: "#ffffff",
              });
            } catch (error) {
              console.error(
                `Error processing event ${event._id}-${idx}:`,
                error,
              );
            }
          });
        }
      });
    } catch (error) {
      console.error("Error transforming events:", error);
      message.error("Error processing events data");
    }

    return calendarEvents;
  };

  const formatText = (v) => {
    try {
      if (v === null || v === undefined) return "";
      if (typeof v === "string" || typeof v === "number") return String(v);
      if (Array.isArray(v)) return v.map((x) => formatText(x)).join(", ");
      if (typeof v === "object") {
        if (v.name) return String(v.name);
        if (v.title) return String(v.title);
        if (v.label) return String(v.label);
        try {
          return JSON.stringify(v);
        } catch {
          return String(v);
        }
      }
      return String(v);
    } catch {
      return "";
    }
  };

  const renderEventContent = (eventInfo) => {
    try {
      const { eventName, eventType, clientName, eventConfirmation, isMeeting } =
        eventInfo.event.extendedProps || {};

      const statusIcon = eventConfirmation === "Cancelled" ? "✕" : "◐";

      return (
        <div
          className="p-2 text-xs overflow-hidden leading-snug"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          <div
            className="font-semibold truncate mb-1 flex items-center gap-1"
            style={{ fontSize: "11px" }}
          >
            <span>{statusIcon}</span>
            <span>{formatText(eventName)}</span>
          </div>
          {eventType && !isMeeting && (
            <div className="truncate mb-1" style={{ fontSize: "10px" }}>
              {formatText(eventType)}
            </div>
          )}
          {isMeeting && (
            <div
              className="truncate mb-1"
              style={{ fontSize: "10px", fontStyle: "italic" }}
            >
              Meeting Date
            </div>
          )}
          <div className="truncate" style={{ fontSize: "10px" }}>
            {formatText(clientName)}
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error rendering event content:", error);
      return (
        <div className="p-1 text-xs">
          <div className="font-semibold">Event</div>
        </div>
      );
    }
  };

  const getMonthEvents = () => {
    if (!selectedMonth || !events || events.length === 0) {
      return [];
    }

    try {
      const calendarApi = calendarRef.current?.getApi();
      if (!calendarApi) {
        return [];
      }

      const currentDate = calendarApi.getDate();
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();

      const filteredEvents = [];

      events.forEach((event) => {
        if (!event) {
          return;
        }

        let hasEventsInMonth = false;
        const eventCopy = { ...event, eventTypes: [], meetings: [] };

        // Check meeting date
        if (event.meetingDate) {
          try {
            const meetingDate = new Date(event.meetingDate);
            if (!isNaN(meetingDate.getTime())) {
              const meetingMonth = meetingDate.getMonth();
              const meetingYear = meetingDate.getFullYear();

              if (meetingMonth === month && meetingYear === year) {
                hasEventsInMonth = true;
                eventCopy.meetings.push({
                  meetingDate: event.meetingDate,
                  type: "Meeting",
                });
              }
            }
          } catch (error) {
            console.error("Error processing meeting date:", error);
          }
        }

        // Check event types
        if (event.eventTypes && Array.isArray(event.eventTypes)) {
          const eventTypesInMonth = event.eventTypes.filter((et) => {
            if (!et || !et.startDate) {
              return false;
            }

            try {
              const start = new Date(et.startDate);
              const end = et.endDate
                ? new Date(et.endDate)
                : new Date(et.startDate);

              if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return false;
              }

              const startMonth = start.getMonth();
              const startYear = start.getFullYear();
              const endMonth = end.getMonth();
              const endYear = end.getFullYear();

              const startsInCurrentMonth =
                startMonth === month && startYear === year;
              const endsInCurrentMonth = endMonth === month && endYear === year;

              return startsInCurrentMonth || endsInCurrentMonth;
            } catch (error) {
              console.error("Error processing event date:", error);
              return false;
            }
          });

          if (eventTypesInMonth.length > 0) {
            hasEventsInMonth = true;
            eventCopy.eventTypes = eventTypesInMonth;
          }
        }

        if (hasEventsInMonth) {
          filteredEvents.push(eventCopy);
        }
      });

      // Sort event types by start date
      filteredEvents.forEach((ev) => {
        if (ev.eventTypes && ev.eventTypes.length > 0) {
          ev.eventTypes.sort(
            (a, b) => new Date(a.startDate) - new Date(b.startDate),
          );
        }
      });

      // Sort events by their earliest date (meeting or event start)
      filteredEvents.sort((a, b) => {
        let aDate = new Date(0);
        let bDate = new Date(0);

        if (a.meetings && a.meetings.length > 0) {
          aDate = new Date(a.meetings[0].meetingDate);
        } else if (a.eventTypes && a.eventTypes[0]) {
          aDate = new Date(a.eventTypes[0].startDate);
        }

        if (b.meetings && b.meetings.length > 0) {
          bDate = new Date(b.meetings[0].meetingDate);
        } else if (b.eventTypes && b.eventTypes[0]) {
          bDate = new Date(b.eventTypes[0].startDate);
        }

        return aDate - bDate;
      });

      return filteredEvents;
    } catch (error) {
      console.error("Error filtering month events:", error);
      return [];
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const formatTime = (dateString) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Time";
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <div className="text-lg text-white">Loading events...</div>
        </div>
      </div>
    );
  }

  const inProgressCount = events.filter(
    (e) => e.eventConfirmation === "InProgress",
  ).length;
  const cancelledCount = events.filter(
    (e) => e.eventConfirmation === "Cancelled",
  ).length;

  return (
    <div className="min-h-screen p-6">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-full { 
            width: 100% !important; 
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          body { 
            print-color-adjust: exact; 
            -webkit-print-color-adjust: exact;
            background: white !important;
          }
        }
        
        .fc {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .fc .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }
        
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: #e5e7eb;
        }
        
        .fc-theme-standard .fc-scrollgrid {
          border-color: #e5e7eb;
        }
        
        .fc .fc-daygrid-day-number {
          padding: 8px;
          font-weight: 500;
          color: #374151;
        }
        
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #fef3c7 !important;
        }
        
        .fc .fc-col-header-cell {
          background-color: #f9fafb;
          font-weight: 500;
          color: #4b5563;
          padding: 12px 0;
        }
        
        .fc-event {
          cursor: pointer;
          margin: 3px 2px;
          border-radius: 4px;
          border-width: 0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          opacity: 1 !important;
        }
        
        .fc-event:hover {
          opacity: 0.9 !important;
          transform: translateY(-1px);
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
        
        .fc-event-main {
          opacity: 1 !important;
        }
        
        .fc-daygrid-event {
          opacity: 1 !important;
        }
        
        .fc .fc-button {
          background-color: #f59e0b;
          border-color: #f59e0b;
          text-transform: capitalize;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
        }
        
        .fc .fc-button:hover {
          background-color: #d97706;
          border-color: #d97706;
        }
        
        .fc .fc-button-primary:disabled {
          background-color: #9ca3af;
          border-color: #9ca3af;
        }
        
        .fc-daygrid-event {
          white-space: normal !important;
          overflow: visible !important;
        }
        
        .fc-daygrid-day-frame {
          min-height: 140px !important;
        }
        
        .fc-daygrid-day-events {
          margin-bottom: 0 !important;
        }
        
        .fc-event-main {
          overflow: visible !important;
        }
        
        .fc-daygrid-event-harness {
          margin-bottom: 4px !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto print-full">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 no-print">
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
                  InProgress and Cancelled Events
                </h1>
                <p className="text-gray-600 mt-1">
                  Track pending and cancelled events
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-sm text-gray-600 px-4 py-2 bg-amber-100 rounded-lg">
                <span className="font-medium">{inProgressCount}</span>{" "}
                InProgress
              </div>
              <div className="text-sm text-gray-600 px-4 py-2 bg-red-100 rounded-lg">
                <span className="font-medium">{cancelledCount}</span> Cancelled
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Event Status:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-amber-600">◐</span>
                <span className="text-sm text-gray-600">InProgress</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-600">✕</span>
                <span className="text-sm text-gray-600">Cancelled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 pdf-export-section">
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
            height="auto"
            dayMaxEvents={false}
            eventMaxStack={15}
            datesSet={(dateInfo) => {
              try {
                if (dateInfo.start) {
                  const calendarApi = calendarRef.current?.getApi();
                  if (calendarApi) {
                    const currentDate = calendarApi.getDate();
                    setSelectedMonth(currentDate);
                  }
                }
              } catch (error) {
                console.error("Error setting selected month:", error);
              }
            }}
            eventDidMount={(info) => {
              try {
                const {
                  clientName,
                  eventName,
                  eventType,
                  eventConfirmation,
                  isMeeting,
                } = info.event.extendedProps;

                let tooltip = `${formatText(eventName)}`;
                if (eventType && !isMeeting) {
                  tooltip += ` - ${formatText(eventType)}`;
                }
                if (isMeeting) {
                  tooltip += ` - Meeting Date`;
                }
                tooltip += `\nClient: ${formatText(clientName) || "Unknown"}`;
                tooltip += `\nStatus: ${eventConfirmation}`;

                info.el.setAttribute("title", tooltip);
              } catch (error) {
                console.error("Error mounting event:", error);
              }
            }}
          />
        </div>

        {/* Event Details Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 pdf-export-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: "#f59e0b" }}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">
              Events This Month
            </h3>
          </div>

          <div className="grid gap-4">
            {getMonthEvents().length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">
                  No InProgress or Cancelled events for this month
                </p>
              </div>
            ) : (
              getMonthEvents().map((event) => (
                <div
                  key={event._id}
                  className="border-l-4 rounded-lg p-6 bg-white hover:shadow-lg transition-shadow"
                  style={{
                    borderColor:
                      event.eventConfirmation === "Cancelled"
                        ? "#ef4444"
                        : "#f59e0b",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{
                            backgroundColor:
                              event.eventConfirmation === "Cancelled"
                                ? "#ef4444"
                                : "#f59e0b",
                          }}
                        >
                          {formatText(event.eventName)}
                        </span>
                        <span
                          className="px-3 py-1 rounded-full text-sm font-medium text-white"
                          style={{
                            backgroundColor:
                              event.eventConfirmation === "Cancelled"
                                ? "#dc2626"
                                : "#d97706",
                          }}
                        >
                          {event.eventConfirmation}
                        </span>
                      </div>
                      <h4 className="text-xl font-semibold text-gray-800 mb-1">
                        {formatText(event.clientName)}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-amber-600 mb-2">
                        <span className="font-medium">
                          Project Coordinators:
                        </span>
                        <span>{formatText(event.lead1) || "-"}</span>
                        <span>
                          {formatText(event.lead2)
                            ? `, ${formatText(event.lead2)}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Meeting Date */}
                    {event.meetings && event.meetings.length > 0 && (
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="text-sm font-medium bg-amber-600 text-white px-3 py-2 rounded">
                              Meeting
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-800 mb-1">
                              Meeting Date
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="inline-flex items-center gap-2">
                                <Clock
                                  className="w-4 h-4"
                                  style={{ color: "#f59e0b" }}
                                />
                                <span>
                                  {formatDate(event.meetings[0].meetingDate)}{" "}
                                  {formatTime(event.meetings[0].meetingDate)}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Event Types */}
                    {event.eventTypes &&
                      event.eventTypes.map((et, idx) => {
                        const start = et?.startDate;
                        const end = et?.endDate;
                        const multiDay = start && end && start !== end;

                        return (
                          <div
                            key={idx}
                            className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-amber-300 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className="text-sm font-medium bg-gray-600 text-white px-3 py-2 rounded">
                                  Event
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-800 mb-1">
                                  {formatText(et.eventType) ||
                                    formatText(event.eventName)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  <span className="inline-flex items-center gap-2">
                                    <Clock
                                      className="w-4 h-4"
                                      style={{ color: "#f59e0b" }}
                                    />
                                    <span>
                                      {formatDate(start)} {formatTime(start)}
                                      {multiDay && end
                                        ? ` → ${formatDate(end)} ${formatTime(end)}`
                                        : ""}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCalenderClients;
