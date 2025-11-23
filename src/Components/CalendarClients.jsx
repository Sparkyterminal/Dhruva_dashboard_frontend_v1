/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { API_BASE_URL } from "../../config";
import axios from "axios";
import { message } from "antd";
import { useSelector } from "react-redux";

const CalendarClients = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const user = useSelector((state) => state.user.value);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  useEffect(() => {
    fetchRequirementsData();
  }, []);

  const fetchRequirementsData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}events`, config);
      setEvents(res.data.events || res.data.data || res.data || []);
    } catch (err) {
      message.error("Failed to fetch client bookings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const eventsOnDate = [];

    events.forEach((event) => {
      // Check main event dates
      const mainEventStart = new Date(event.eventTypes[0]?.startDate);
      const mainEventEnd = new Date(event.eventTypes[0]?.endDate);

      if (
        date >= new Date(mainEventStart.toDateString()) &&
        date <= new Date(mainEventEnd.toDateString())
      ) {
        eventsOnDate.push({
          id: event._id,
          name: event.eventName,
          client: event.clientName,
          type: "main",
          eventType: event.eventTypes[0]?.eventType,
          venue: event.eventTypes[0]?.venueLocation,
          amount: event.agreedAmount,
        });
      }

      // Check individual event types
      event.eventTypes.forEach((et, idx) => {
        const start = new Date(et.startDate);
        const end = new Date(et.endDate);

        if (
          date >= new Date(start.toDateString()) &&
          date <= new Date(end.toDateString())
        ) {
          // Avoid duplicate if already added as main event
          if (idx > 0 || !eventsOnDate.some((e) => e.id === event._id)) {
            eventsOnDate.push({
              id: `${event._id}-${idx}`,
              name: `${event.eventName} - ${et.eventType}`,
              client: event.clientName,
              type: "subEvent",
              eventType: et.eventType,
              venue: et.venueLocation,
              amount: et.agreedAmount || event.agreedAmount,
            });
          }
        }
      });
    });

    return eventsOnDate;
  };

  const changeMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentMonth);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const calendarDays = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-full { 
            width: 100% !important; 
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
          }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto print-full">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-800">
                Event Calendar
              </h1>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print Calendar
            </button>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(-1)}
              className="no-print p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">
              {monthNames[month]} {year}
            </h2>
            <button
              onClick={() => changeMonth(1)}
              className="no-print p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-100 border-b">
            {dayNames.map((day) => (
              <div
                key={day}
                className="p-3 text-center font-semibold text-gray-700 text-sm"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const date = day ? new Date(year, month, day) : null;
              const eventsOnDate = date ? getEventsForDate(date) : [];
              const isToday =
                date && date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`min-h-32 border-b border-r p-2 ${
                    !day ? "bg-gray-50" : "bg-white"
                  } ${isToday ? "bg-blue-50" : ""}`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-semibold mb-2 ${
                          isToday ? "text-blue-600" : "text-gray-700"
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {eventsOnDate.map((event, idx) => (
                          <div
                            key={idx}
                            className={`text-xs p-1.5 rounded ${
                              event.type === "main"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-green-100 text-green-800 border border-green-200"
                            }`}
                            title={`${event.name}\nClient: ${
                              event.client
                            }\nVenue: ${event.venue || "N/A"}\nAmount: ₹${
                              event.amount?.toLocaleString() || "N/A"
                            }`}
                          >
                            <div className="font-semibold truncate">
                              {event.client}
                            </div>
                            <div className="truncate opacity-90">
                              {event.eventType}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm text-gray-600">Main Event</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span className="text-sm text-gray-600">Event Type</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 rounded"></div>
              <span className="text-sm text-gray-600">Today</span>
            </div>
          </div>
        </div>

        {/* Event Summary */}
        <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Events in {monthNames[month]} {year}
          </h3>
          <div className="space-y-3">
            {events
              .filter((event) => {
                const hasEventInMonth = event.eventTypes.some((et) => {
                  const start = new Date(et.startDate);
                  const end = new Date(et.endDate);
                  return (
                    (start.getMonth() === month &&
                      start.getFullYear() === year) ||
                    (end.getMonth() === month && end.getFullYear() === year)
                  );
                });
                return hasEventInMonth;
              })
              .map((event) => (
                <div
                  key={event._id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {event.eventName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Client: {event.clientName}
                      </p>
                      {event.brideName && (
                        <p className="text-sm text-gray-600">
                          {event.brideName} & {event.groomName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        ₹{event.agreedAmount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {event.eventTypes.length} event
                        {event.eventTypes.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    {event.eventTypes.map((et, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-gray-600 bg-gray-50 p-2 rounded"
                      >
                        <span className="font-medium">{et.eventType}</span> -{" "}
                        {et.venueLocation}
                        <span className="ml-2">
                          ({new Date(et.startDate).toLocaleDateString()} -{" "}
                          {new Date(et.endDate).toLocaleDateString()})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarClients;
