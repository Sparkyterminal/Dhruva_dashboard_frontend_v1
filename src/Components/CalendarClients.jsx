import React, { useEffect, useState, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import {
  Download,
  Calendar,
  MapPin,
  Clock,
  Users,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import { message } from "antd";
import { useSelector } from "react-redux";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const CalendarClients = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const calendarRef = useRef(null);
  const exportRef = useRef(null);
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
      const res = await axios.get(`${API_BASE_URL}events`, config);

      // Handle different response structures
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

      // Validate and filter out invalid events
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

  // Transform events for FullCalendar
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

            // Validate dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              console.warn(`Invalid date for event ${event._id}-${idx}`);
              return;
            }

            // Ensure end date is not before start date
            const actualEndDate = endDate < startDate ? startDate : endDate;

            calendarEvents.push({
              id: `${event._id}-${idx}`,
              title: event.eventName || "Untitled Event",
              start: startDate.toISOString(),
              end: new Date(
                actualEndDate.getTime() + 24 * 60 * 60 * 1000
              ).toISOString(), // Add 1 day for end date
              extendedProps: {
                clientName: event.clientName || "Unknown Client",
                eventType: et.eventType || "Unknown Type",
                venue: et.venueLocation || "TBD",
                brideName: event.brideName,
                groomName: event.groomName,
                mainEvent: event.eventName || "Untitled Event",
                hasMultipleTypes: event.eventTypes.length > 1,
                agreedAmount: et.agreedAmount || event.agreedAmount || 0,
              },
              backgroundColor: getEventColor(event.eventName),
              borderColor: getEventColor(event.eventName),
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

  const getEventColor = (eventName) => {
    const colors = {
      Wedding: "#8b5cf6",
      "Baby Shower": "#ec4899",
      Birthday: "#3b82f6",
      Reception: "#10b981",
      Engagement: "#f59e0b",
    };
    return colors[eventName] || "#6366f1";
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) {
      message.error("Calendar content not available for export");
      return;
    }

    setExporting(true);
    try {
      message.loading({
        content: "Generating PDF...",
        key: "pdf-export",
        duration: 0,
      });

      // Get the calendar container
      const calendarElement = exportRef.current;
      if (!calendarElement) {
        throw new Error("Calendar element not found");
      }

      // Find the parent container that holds both calendar and events
      const parentContainer = calendarElement.parentElement;
      const allSections = parentContainer.querySelectorAll(
        ".bg-white.rounded-2xl"
      );

      // Create a container for export
      const exportContainer = document.createElement("div");
      exportContainer.style.position = "absolute";
      exportContainer.style.left = "-9999px";
      exportContainer.style.top = "0px";
      exportContainer.style.width = calendarElement.offsetWidth + "px";
      exportContainer.style.backgroundColor = "#ffffff";
      exportContainer.style.padding = "20px";

      // Find calendar section and events section
      let calendarSection = null;
      let eventsSection = null;

      allSections.forEach((section) => {
        const hasCalendar = section.querySelector(".fc");
        const hasEventsHeading =
          section.textContent?.includes("Events This Month");

        if (hasCalendar) {
          calendarSection = section;
        } else if (hasEventsHeading) {
          eventsSection = section;
        }
      });

      // Clone calendar
      if (calendarSection) {
        const clonedCalendar = calendarSection.cloneNode(true);
        clonedCalendar.style.marginBottom = "20px";
        exportContainer.appendChild(clonedCalendar);
      }

      // Clone events section if it exists
      if (eventsSection) {
        const clonedEvents = eventsSection.cloneNode(true);
        exportContainer.appendChild(clonedEvents);
      }

      document.body.appendChild(exportContainer);

      // Use html2canvas to capture the content
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: exportContainer.offsetWidth,
        height: exportContainer.scrollHeight,
        windowWidth: exportContainer.scrollWidth,
        windowHeight: exportContainer.scrollHeight,
      });

      // Remove export container
      document.body.removeChild(exportContainer);

      const imgData = canvas.toDataURL("image/png", 1.0);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calculate PDF dimensions (A4 in pixels at 96 DPI)
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const mmToPx = 3.779527559; // Conversion factor
      const maxPdfWidth = pdfWidth * mmToPx;
      const maxPdfHeight = pdfHeight * mmToPx;

      // Calculate dimensions to fit content
      let finalWidth = imgWidth;
      let finalHeight = imgHeight;

      // Scale down if too large
      if (imgWidth > maxPdfWidth || imgHeight > maxPdfHeight) {
        const scale = Math.min(
          maxPdfWidth / imgWidth,
          maxPdfHeight / imgHeight
        );
        finalWidth = imgWidth * scale;
        finalHeight = imgHeight * scale;
      }

      // Create PDF
      const pdf = new jsPDF({
        orientation: finalWidth > finalHeight ? "landscape" : "portrait",
        unit: "mm",
        format: [pdfWidth, pdfHeight],
      });

      // Calculate position to center if needed
      const xPos = 0;
      const yPos = 0;

      // Convert pixels to mm for PDF
      const widthMm = finalWidth / mmToPx;
      const heightMm = finalHeight / mmToPx;

      // Add image to PDF - scale to fit page
      pdf.addImage(
        imgData,
        "PNG",
        xPos,
        yPos,
        widthMm,
        heightMm,
        undefined,
        "FAST"
      );

      // Add additional pages if content is taller than one page
      const pageHeight = pdf.internal.pageSize.height;
      if (heightMm > pageHeight) {
        let position = heightMm - pageHeight;

        while (position > 0) {
          pdf.addPage();
          pdf.addImage(
            imgData,
            "PNG",
            xPos,
            -position / mmToPx,
            widthMm,
            heightMm,
            undefined,
            "FAST"
          );
          position -= pageHeight;
        }
      }

      // Generate filename with current month and year
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
      const month = selectedMonth.getMonth();
      const year = selectedMonth.getFullYear();
      const filename = `Event_Calendar_${monthNames[month]}_${year}.pdf`;

      // Save PDF
      pdf.save(filename);

      message.success({
        content: "PDF exported successfully!",
        key: "pdf-export",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      message.error({
        content: "Failed to export PDF. Please try again.",
        key: "pdf-export",
        duration: 5,
      });
    } finally {
      setExporting(false);
    }
  };

  const renderEventContent = (eventInfo) => {
    try {
      const { clientName, eventType, venue, hasMultipleTypes } =
        eventInfo.event.extendedProps || {};

      return (
        <div className="p-1 text-xs overflow-hidden">
          <div className="font-semibold truncate">{clientName || "Event"}</div>
          {hasMultipleTypes && eventType && (
            <div className="truncate opacity-90">{eventType}</div>
          )}
          {venue && (
            <div className="truncate opacity-75 flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">{venue}</span>
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
      const month = selectedMonth.getMonth();
      const year = selectedMonth.getFullYear();

      return events.filter((event) => {
        if (!event || !event.eventTypes || !Array.isArray(event.eventTypes)) {
          return false;
        }

        return event.eventTypes.some((et) => {
          if (!et || !et.startDate) {
            return false;
          }

          try {
            const start = new Date(et.startDate);
            const end = et.endDate
              ? new Date(et.endDate)
              : new Date(et.startDate);

            // Validate dates
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              return false;
            }

            const startMonth = start.getMonth();
            const startYear = start.getFullYear();
            const endMonth = end.getMonth();
            const endYear = end.getFullYear();

            // Check if event overlaps with the selected month
            // Event can start before, during, or end during/after the month
            const eventStart = new Date(startYear, startMonth, 1);
            const eventEnd = new Date(endYear, endMonth + 1, 0);
            const monthStart = new Date(year, month, 1);
            const monthEnd = new Date(year, month + 1, 0);

            // Check if there's any overlap
            return eventStart <= monthEnd && eventEnd >= monthStart;
          } catch (error) {
            console.error("Error processing event date:", error);
            return false;
          }
        });
      });
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
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
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
          border-radius: 4px;
          border-width: 1px;
        }
        
        .fc-event:hover {
          opacity: 0.9;
          transform: translateY(-1px);
          transition: all 0.2s;
        }
        
        .fc .fc-button {
          background-color: #4f46e5;
          border-color: #4f46e5;
          text-transform: capitalize;
          font-weight: 500;
          padding: 8px 16px;
        }
        
        .fc .fc-button:hover {
          background-color: #4338ca;
          border-color: #4338ca;
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
          overflow: visible !important;
        }
        
        .fc-daygrid-day-events {
          margin-bottom: 0 !important;
        }
        
        .fc-more-link {
          font-weight: 600 !important;
          cursor: pointer !important;
        }
        
        .fc-popover {
          max-height: 400px !important;
          overflow-y: auto !important;
        }
        
        .fc-popover-body {
          max-height: 350px !important;
          overflow-y: auto !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto print-full">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 no-print border border-indigo-100">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl">
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
            <button
              onClick={handleExportPDF}
              disabled={exporting || loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Export to PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div
          ref={exportRef}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-indigo-100"
        >
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
            dayMaxEvents={false} // Show all events, no "+X more" limit
            moreLinkClick="popover" // Show all events in a popover if needed
            datesSet={(dateInfo) => {
              try {
                // Use the first visible date to determine the month
                if (dateInfo.start) {
                  setSelectedMonth(new Date(dateInfo.start));
                }
              } catch (error) {
                console.error("Error setting selected month:", error);
              }
            }}
            eventDidMount={(info) => {
              try {
                const {
                  clientName,
                  eventType,
                  venue,
                  brideName,
                  groomName,
                  mainEvent,
                  agreedAmount,
                } = info.event.extendedProps;

                let tooltip = `${mainEvent || "Event"}`;
                if (eventType) tooltip += `\nType: ${eventType}`;
                tooltip += `\nClient: ${clientName || "Unknown"}`;
                if (brideName && groomName) {
                  tooltip += `\n${brideName} & ${groomName}`;
                }
                tooltip += `\nVenue: ${venue || "TBD"}`;
                if (agreedAmount) {
                  tooltip += `\nAmount: ₹${agreedAmount.toLocaleString()}`;
                }

                info.el.setAttribute("title", tooltip);
              } catch (error) {
                console.error("Error mounting event:", error);
              }
            }}
          />
        </div>

        {/* Event Details Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
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
                  className="border-l-4 rounded-lg p-6 bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-shadow"
                  style={{ borderColor: getEventColor(event.eventName) }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="px-3 py-1 rounded-full text-sm font-semibold text-white"
                          style={{
                            backgroundColor: getEventColor(event.eventName),
                          }}
                        >
                          {event.eventName}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-800 mb-1">
                        {event.clientName}
                      </h4>
                      {event.brideName && event.groomName && (
                        <p className="text-gray-600 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          {event.brideName} & {event.groomName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {event.eventTypes.map((et, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-lg p-4 border border-gray-200 hover:border-indigo-300 transition-colors"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: getEventColor(
                                    event.eventName
                                  ),
                                }}
                              ></div>
                              {et.eventType}
                            </div>
                            <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-indigo-600" />
                              <span>{et.venueLocation}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 flex-shrink-0 text-indigo-600" />
                              <span>
                                {formatDate(et.startDate)} at{" "}
                                {formatTime(et.startDate)}
                                {et.startDate !== et.endDate && (
                                  <>
                                    {" "}
                                    → {formatDate(et.endDate)} at{" "}
                                    {formatTime(et.endDate)}
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
