/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { message } from "antd";
import { useSelector } from "react-redux";

const AdvanceCalendarClients = () => {
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
        return event && event._id && event.eventName;
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

  const getCalendarEvents = () => {
    const calendarEvents = [];

    try {
      events.forEach((event) => {
        if (!event || !event.eventTypes || !Array.isArray(event.eventTypes)) {
          return;
        }

        event.eventTypes.forEach((et) => {
          if (!et || !et.advances || !Array.isArray(et.advances)) {
            return;
          }

          et.advances.forEach((advance, advIdx) => {
            if (!advance || !advance.advanceDate) {
              return;
            }

            try {
              const advanceDate = new Date(advance.advanceDate);
              if (isNaN(advanceDate.getTime())) {
                return;
              }

              const expectedAmount = advance.expectedAmount || 0;
              const receivedAmount = advance.receivedAmount || 0;
              const isPending = receivedAmount < expectedAmount;
              const isFullyPaid = receivedAmount >= expectedAmount;

              const eventName = formatText(event.eventName);
              const eventType = formatText(et.eventType);
              const clientName = formatText(event.clientName);

              calendarEvents.push({
                id: `${event._id}-${advIdx}`,
                title: eventName,
                start: advanceDate.toISOString(),
                allDay: true,
                extendedProps: {
                  clientName: clientName || "Unknown Client",
                  eventName: eventName,
                  eventType: eventType || "N/A",
                  advanceNumber: advance.advanceNumber,
                  expectedAmount: expectedAmount,
                  receivedAmount: receivedAmount,
                  isPending: isPending,
                  isFullyPaid: isFullyPaid,
                  pendingAmount: expectedAmount - receivedAmount,
                },
                backgroundColor: isFullyPaid
                  ? "#10b981"
                  : isPending
                  ? "#f59e0b"
                  : "#6b7280",
                borderColor: isFullyPaid
                  ? "#059669"
                  : isPending
                  ? "#d97706"
                  : "#4b5563",
                textColor: "#ffffff",
              });
            } catch (error) {
              console.error(`Error processing advance:`, error);
            }
          });
        });
      });
    } catch (error) {
      console.error("Error transforming events:", error);
      message.error("Error processing events data");
    }

    return calendarEvents;
  };

  const renderEventContent = (eventInfo) => {
    try {
      const {
        eventName,
        advanceNumber,
        expectedAmount,
        receivedAmount,
        isPending,
        isFullyPaid,
      } = eventInfo.event.extendedProps || {};

      return (
        <div className="p-1.5 text-xs overflow-hidden leading-tight">
          <div className="font-semibold truncate text-white mb-1">
            {formatText(eventName)} - Adv #{advanceNumber}
          </div>
          <div className="text-white opacity-90 text-[10px] mb-0.5">
            Expected: ₹{Number(expectedAmount).toLocaleString()}
          </div>
          <div className="text-white opacity-90 text-[10px]">
            Received: ₹{Number(receivedAmount).toLocaleString()}
          </div>
          {isPending && (
            <div className="text-white font-semibold text-[10px] mt-1">
              Pending: ₹
              {Number(expectedAmount - receivedAmount).toLocaleString()}
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering event content:", error);
      return (
        <div className="p-1 text-xs">
          <div className="font-semibold">Advance</div>
        </div>
      );
    }
  };

  const getMonthAdvances = () => {
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

      const advances = [];

      events.forEach((event) => {
        if (!event || !event.eventTypes || !Array.isArray(event.eventTypes)) {
          return;
        }

        event.eventTypes.forEach((et) => {
          if (!et || !et.advances || !Array.isArray(et.advances)) {
            return;
          }

          et.advances.forEach((advance) => {
            if (!advance || !advance.advanceDate) {
              return;
            }

            try {
              const advanceDate = new Date(advance.advanceDate);
              if (isNaN(advanceDate.getTime())) {
                return;
              }

              const advMonth = advanceDate.getMonth();
              const advYear = advanceDate.getFullYear();

              if (advMonth === month && advYear === year) {
                advances.push({
                  ...advance,
                  event: event,
                  eventType: et,
                  advanceDate: advanceDate,
                });
              }
            } catch (error) {
              console.error("Error processing advance date:", error);
            }
          });
        });
      });

      advances.sort((a, b) => a.advanceDate - b.advanceDate);

      return advances;
    } catch (error) {
      console.error("Error filtering month advances:", error);
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
      return "N/A";
    }
  };

  const calculateMonthStats = () => {
    const monthAdvances = getMonthAdvances();
    let totalExpected = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let fullyPaidCount = 0;
    let pendingCount = 0;

    monthAdvances.forEach((adv) => {
      const expected = adv.expectedAmount || 0;
      const received = adv.receivedAmount || 0;
      totalExpected += expected;
      totalReceived += received;
      totalPending += expected - received;

      if (received >= expected) {
        fullyPaidCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      totalExpected,
      totalReceived,
      totalPending,
      fullyPaidCount,
      pendingCount,
      totalAdvances: monthAdvances.length,
    };
  };

  const stats = calculateMonthStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Loading advances...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-purple-50 to-blue-50">
      <style>{`
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
          background-color: #fef3c7 !important;
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
          border-width: 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          opacity: 1 !important;
        }
        
        .fc-event:hover {
          opacity: 0.95 !important;
          transform: translateY(-1px);
          transition: all 0.2s;
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .fc .fc-button {
          background-color: #7c3aed;
          border-color: #7c3aed;
          text-transform: capitalize;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
        }
        
        .fc .fc-button:hover {
          background-color: #6d28d9;
          border-color: #6d28d9;
        }
        
        .fc .fc-button-primary:disabled {
          background-color: #9ca3af;
          border-color: #9ca3af;
        }
        
        .fc-daygrid-day-frame {
          min-height: 120px !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl"
                style={{
                  background:
                    "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
                }}
              >
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Advance Payment Calendar
                </h1>
                <p className="text-gray-600 mt-1">
                  Track all payment advances and their status
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Expected</p>
                <p className="text-2xl font-bold text-gray-800">
                  ₹{stats.totalExpected.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Received</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stats.totalReceived.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  ₹{stats.totalPending.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Advances</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.fullyPaidCount}/{stats.totalAdvances}
                </p>
                <p className="text-xs text-gray-500 mt-1">Paid/Total</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
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
                  advanceNumber,
                  expectedAmount,
                  receivedAmount,
                  pendingAmount,
                } = info.event.extendedProps;

                let tooltip = `${formatText(eventName)}`;
                if (eventType) tooltip += ` - ${formatText(eventType)}`;
                tooltip += `\nClient: ${formatText(clientName)}`;
                tooltip += `\nAdvance #${advanceNumber}`;
                tooltip += `\nExpected: ₹${Number(
                  expectedAmount
                ).toLocaleString()}`;
                tooltip += `\nReceived: ₹${Number(
                  receivedAmount
                ).toLocaleString()}`;
                if (pendingAmount > 0) {
                  tooltip += `\nPending: ₹${Number(
                    pendingAmount
                  ).toLocaleString()}`;
                }

                info.el.setAttribute("title", tooltip);
              } catch (error) {
                console.error("Error mounting event:", error);
              }
            }}
          />
        </div>

        {/* Advance Details Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-600">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">
              Advances This Month
            </h3>
          </div>

          <div className="space-y-4">
            {getMonthAdvances().length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg">
                  No advances scheduled for this month
                </p>
              </div>
            ) : (
              getMonthAdvances().map((advance, idx) => {
                const expectedAmount = advance.expectedAmount || 0;
                const receivedAmount = advance.receivedAmount || 0;
                const isPending = receivedAmount < expectedAmount;
                const isFullyPaid = receivedAmount >= expectedAmount;
                const pendingAmount = expectedAmount - receivedAmount;

                return (
                  <div
                    key={idx}
                    className={`border-l-4 rounded-lg p-5 bg-white hover:shadow-lg transition-shadow ${
                      isFullyPaid
                        ? "border-green-500"
                        : isPending
                        ? "border-amber-500"
                        : "border-gray-400"
                    }`}
                    style={{
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
                              isFullyPaid
                                ? "bg-green-500"
                                : isPending
                                ? "bg-amber-500"
                                : "bg-gray-500"
                            }`}
                          >
                            {isFullyPaid
                              ? "Paid"
                              : isPending
                              ? "Pending"
                              : "Not Received"}
                          </span>
                          <span className="text-sm text-gray-600">
                            Advance #{advance.advanceNumber}
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-800 mb-1">
                          {formatText(advance.event.eventName)}
                        </h4>
                        <p className="text-gray-600">
                          Client: {formatText(advance.event.clientName)}
                        </p>
                        {advance.eventType?.eventType && (
                          <p className="text-sm text-gray-500">
                            Event Type:{" "}
                            {formatText(advance.eventType.eventType)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">
                          {formatDate(advance.advanceDate)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">
                          Expected Amount
                        </p>
                        <p className="text-lg font-bold text-gray-800">
                          ₹{expectedAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">
                          Received Amount
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          ₹{receivedAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">
                          Pending Amount
                        </p>
                        <p
                          className={`text-lg font-bold ${
                            isPending ? "text-amber-600" : "text-gray-400"
                          }`}
                        >
                          ₹{pendingAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {isPending && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-amber-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Payment of ₹{pendingAmount.toLocaleString()} is
                            pending
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvanceCalendarClients;
