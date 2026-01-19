/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar, MapPin, Clock, Users } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { message } from "antd";
import { useSelector } from "react-redux";

const CalendarClients = () => {
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

      eventsData = eventsData.filter((event) => {
        return (
          event &&
          event._id &&
          event.eventName &&
          Array.isArray(event.eventTypes) &&
          event.eventTypes.length > 0
        );
      });

      setEvents(eventsData);

      if (eventsData.length === 0) {
        message.info("No events found");
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
        if (!event || !event.eventTypes || !Array.isArray(event.eventTypes)) {
          return;
        }

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

            // Display event name only if different from event type (coerce objects)
            const evName = formatText(event.eventName);
            const etName = formatText(et.eventType);
            const displayName =
              evName === etName ? evName : `${evName} - ${etName}`;

            // Check if start and end date are the same day
            const isSameDay =
              startDate.toDateString() === actualEndDate.toDateString();

            calendarEvents.push({
              id: `${event._id}-${idx}`,
              title: displayName,
              start: startDate.toISOString(),
              end: isSameDay
                ? startDate.toISOString() // Single day event
                : new Date(
                    actualEndDate.getTime() + 24 * 60 * 60 * 1000
                  ).toISOString(), // Multi-day event
              allDay: true,
              extendedProps: {
                clientName: formatText(event.clientName) || "Unknown Client",
                eventName: evName || "Untitled Event",
                eventType: etName || "Unknown Type",
                venue: formatText(et.venueLocation) || "TBD",
                brideName: formatText(event.brideName),
                groomName: formatText(event.groomName),
                mainEvent: evName || "Untitled Event",
                hasMultipleTypes: event.eventTypes.length > 1,
                agreedAmount: et.agreedAmount || event.agreedAmount || 0,
                startDate: et.startDate,
                endDate: et.endDate,
              },
              // Use a seed that includes the event id and the specific event-type index so
              // multiple events on the same day can get different but consistent colors
              backgroundColor: getEventColor(`${event._id}-${idx}`),
              borderColor: getEventColor(`${event._id}-${idx}`),
              textColor: "#ffffff",
            });
          } catch (error) {
            console.error(`Error processing event ${event._id}-${idx}:`, error);
          }
        });
      });
    } catch (error) {
      console.error("Error transforming events:", error);
      message.error("Error processing events data");
    }

    return calendarEvents;
  };

  const getEventColor = (seed) => {
    const s = String(seed || "");
    const colors = [
      "#3b82f6", // blue
      "#10b981", // green
      "#f59e0b", // amber
      "#8b5cf6", // purple
      "#ec4899", // pink
      "#fb923c", // orange
      "#34d399", // mint
      "#60a5fa", // sky
      "#a78bfa", // violet
      "#fb7185", // rose
    ];

    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
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
      const { eventName, eventType, venue } =
        eventInfo.event.extendedProps || {};

      // Show only event type if it's different from event name
      const showEventType = formatText(eventName) !== formatText(eventType);

      return (
        <div className="p-1.5 text-xs overflow-hidden leading-tight">
          <div className="font-semibold truncate text-white mb-0.5">
            {formatText(eventName)}
          </div>
          {showEventType && (
            <div className="truncate text-white opacity-90 mb-0.5">
              {formatText(eventType)}
            </div>
          )}
          {venue && (
            <div className="truncate opacity-80 flex items-center gap-1 text-white">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{formatText(venue)}</span>
            </div>
          )}
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
      // Get the first day of the calendar view (includes previous month days)
      const calendarApi = calendarRef.current?.getApi();
      if (!calendarApi) {
        return [];
      }

      const currentDate = calendarApi.getDate();
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();

      const filteredEvents = [];

      events.forEach((event) => {
        if (!event || !event.eventTypes || !Array.isArray(event.eventTypes)) {
          return;
        }

        // Filter event types that fall EXACTLY in the current calendar month
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

            // Event type must have start date OR end date in the current month/year
            const startsInCurrentMonth =
              startMonth === month && startYear === year;
            const endsInCurrentMonth = endMonth === month && endYear === year;

            return startsInCurrentMonth || endsInCurrentMonth;
          } catch (error) {
            console.error("Error processing event date:", error);
            return false;
          }
        });

        // Only include event if it has event types in this month
        if (eventTypesInMonth.length > 0) {
          filteredEvents.push({
            ...event,
            eventTypes: eventTypesInMonth,
          });
        }
      });

      // Sort event types by start date and then sort events by their earliest start date
      filteredEvents.forEach((ev) => {
        ev.eventTypes.sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate)
        );
      });

      filteredEvents.sort((a, b) => {
        const aFirst =
          a.eventTypes && a.eventTypes[0]
            ? new Date(a.eventTypes[0].startDate)
            : new Date(0);
        const bFirst =
          b.eventTypes && b.eventTypes[0]
            ? new Date(b.eventTypes[0].startDate)
            : new Date(0);
        return aFirst - bFirst;
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

  const formatDateShort = (dateString) => {
    try {
      if (!dateString) return "";
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "";
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
          font-family: inherit;
        }
        
        .fc .fc-toolbar-title {
          font-size: 1.75rem;
          font-weight: 700;
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
          font-weight: 600;
          color: #374151;
        }
        
        .fc .fc-daygrid-day.fc-day-today {
          background-color: #dbeafe !important;
        }
        
        .fc .fc-col-header-cell {
          background-color: #f9fafb;
          font-weight: 600;
          color: #4b5563;
          padding: 12px 0;
        }
        
        .fc-event {
          cursor: pointer;
          margin: 2px 0;
          border-radius: 6px;
          border-width: 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          opacity: 1 !important;
        }
        
        .fc-event:hover {
          opacity: 0.95 !important;
          transform: translateY(-1px);
          transition: all 0.2s;
          box-shadow: 0 4px 6px rgba(0,0,0,0.15);
        }
        
        .fc-event-main {
          opacity: 1 !important;
        }
        
        .fc-daygrid-event {
          opacity: 1 !important;
        }
        
        .fc .fc-button {
          background-color: #667eea;
          border-color: #667eea;
          text-transform: capitalize;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
        }
        
        .fc .fc-button:hover {
          background-color: #5568d3;
          border-color: #5568d3;
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
          min-height: 120px !important;
        }
        
        .fc-daygrid-day-events {
          margin-bottom: 0 !important;
        }
        
        .fc-event-main {
          overflow: visible !important;
        }
        
        .fc-daygrid-event-harness {
          margin-bottom: 3px !important;
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
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                }}
              >
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Event Calendar
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and view all your events
                </p>
              </div>
            </div>
            <div className="text-sm text-gray-600 px-4 py-2 bg-gray-100 rounded-lg">
              {events.length} events
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
            eventMaxStack={10}
            datesSet={(dateInfo) => {
              try {
                if (dateInfo.start) {
                  // Use the view's current date to get the actual displayed month
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
                  venue,
                  brideName,
                  groomName,
                } = info.event.extendedProps;

                const showEventType =
                  formatText(eventName) !== formatText(eventType);

                let tooltip = showEventType
                  ? `${formatText(eventName)} - ${formatText(eventType)}`
                  : formatText(eventName);
                tooltip += `\nClient: ${formatText(clientName) || "Unknown"}`;
                if (brideName && groomName) {
                  tooltip += `\n${formatText(brideName)} & ${formatText(
                    groomName
                  )}`;
                }
                tooltip += `\nVenue: ${formatText(venue) || "TBD"}`;

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
            <div className="p-2 rounded-lg" style={{ background: "#667eea" }}>
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
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
                  No events scheduled for this month
                </p>
              </div>
            ) : (
              getMonthEvents().map((event) => (
                <div
                  key={event._id}
                  className="border-l-4 rounded-lg p-6 bg-white hover:shadow-lg transition-shadow"
                  style={{
                    borderColor: getEventColor(event._id),
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                          style={{
                            backgroundColor: getEventColor(
                              formatText(event.eventName)
                            ),
                          }}
                        >
                          {formatText(event.eventName)}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 mb-1">
                        {formatText(event.clientName)}
                      </h4>
                      <div className="flex items-center gap-3 text-sm text-indigo-600 mb-2">
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
                      {event.brideName && event.groomName && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {formatText(event.brideName)} &{" "}
                          {formatText(event.groomName)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {event.eventTypes.map((et, idx) => {
                      const showEventType =
                        formatText(event.eventName) !==
                        formatText(et.eventType);
                      const start = et?.startDate;
                      const end = et?.endDate;
                      const multiDay = start && end && start !== end;

                      return (
                        <div
                          key={idx}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="text-sm font-semibold bg-indigo-600 text-white px-3 py-2 rounded">
                                {formatDateShort(start)}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{
                                    backgroundColor: getEventColor(
                                      `${event._id}-${idx}`
                                    ),
                                  }}
                                ></div>
                                {showEventType
                                  ? formatText(et.eventType)
                                  : formatText(event.eventName)}
                              </div>

                              <div className="text-sm text-gray-600 mb-2">
                                <span className="inline-flex items-center gap-2 mr-4">
                                  <MapPin
                                    className="w-4 h-4 mt-0.5"
                                    style={{ color: "#667eea" }}
                                  />
                                  <span>{formatText(et.venueLocation)}</span>
                                </span>
                                <span className="inline-flex items-center gap-2">
                                  <Clock
                                    className="w-4 h-4"
                                    style={{ color: "#667eea" }}
                                  />
                                  <span>
                                    {formatDate(start)} {formatTime(start)}
                                    {multiDay && end
                                      ? ` → ${formatDate(end)} ${formatTime(
                                          end
                                        )}`
                                      : ""}
                                  </span>
                                </span>
                              </div>
                            </div>
                            {/* <div className="ml-4 text-sm font-medium text-gray-700">
                              {et.agreedAmount
                                ? `₹${Number(et.agreedAmount).toLocaleString()}`
                                : ""}
                            </div> */}
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

export default CalendarClients;
