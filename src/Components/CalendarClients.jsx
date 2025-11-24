/* eslint-disable no-unused-vars */
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

            // Display event name only if different from event type
            const displayName = event.eventName === et.eventType 
              ? event.eventName 
              : `${event.eventName} - ${et.eventType}`;

            // Check if start and end date are the same day
            const isSameDay = startDate.toDateString() === actualEndDate.toDateString();

            calendarEvents.push({
              id: `${event._id}-${idx}`,
              title: displayName,
              start: startDate.toISOString(),
              end: isSameDay 
                ? startDate.toISOString() // Single day event
                : new Date(actualEndDate.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Multi-day event
              allDay: true,
              extendedProps: {
                clientName: event.clientName || "Unknown Client",
                eventName: event.eventName || "Untitled Event",
                eventType: et.eventType || "Unknown Type",
                venue: et.venueLocation || "TBD",
                brideName: event.brideName,
                groomName: event.groomName,
                mainEvent: event.eventName || "Untitled Event",
                hasMultipleTypes: event.eventTypes.length > 1,
                agreedAmount: et.agreedAmount || event.agreedAmount || 0,
                startDate: et.startDate,
                endDate: et.endDate,
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
    // Light, pleasant colors for all events
    const colors = [
      "#60a5fa", // light blue
      "#34d399", // light green
      "#fbbf24", // light yellow
      "#a78bfa", // light purple
      "#f472b6", // light pink
      "#fb923c", // light orange
      "#4ade80", // light lime
      "#38bdf8", // light sky
      "#c084fc", // light violet
      "#fb7185", // light rose
      "#facc15", // light amber
      "#22d3ee", // light cyan
    ];
    
    // Generate consistent color based on event name
    let hash = 0;
    for (let i = 0; i < eventName.length; i++) {
      hash = eventName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      message.loading({
        content: "Generating PDF...",
        key: "pdf-export",
        duration: 0,
      });

      // Find all sections to export
      const allSections = document.querySelectorAll('.pdf-export-section');
      
      if (!allSections || allSections.length === 0) {
        throw new Error("No content found to export");
      }
      
      // Create a container for export
      const exportContainer = document.createElement("div");
      exportContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0px;
        width: 1200px;
        background-color: #ffffff;
        padding: 40px;
      `;

      // Clone all sections
      allSections.forEach((section) => {
        const clonedSection = section.cloneNode(true);
        
        // Remove any problematic colors and classes
        const processElement = (element) => {
          if (!element) return;
          
          // Remove Tailwind classes that might use oklch
          if (element.className && typeof element.className === 'string') {
            // Remove all Tailwind gradient and color classes
            element.className = element.className
              .replace(/bg-gradient-[^\s]*/g, '')
              .replace(/from-[^\s]*/g, '')
              .replace(/to-[^\s]*/g, '')
              .replace(/via-[^\s]*/g, '')
              .trim();
          }
          
          // Process inline styles
          if (element.style) {
            const styleProps = ['backgroundColor', 'color', 'borderColor', 'background', 'backgroundImage'];
            styleProps.forEach(prop => {
              const value = element.style[prop];
              if (value) {
                if (value.includes('oklch') || value.includes('gradient')) {
                  if (prop === 'backgroundColor' || prop === 'background' || prop === 'backgroundImage') {
                    element.style[prop] = '#ffffff';
                  } else if (prop === 'color') {
                    element.style[prop] = '#000000';
                  } else if (prop === 'borderColor') {
                    element.style[prop] = '#e5e7eb';
                  }
                }
              }
            });
          }
          
          // Process computed styles for elements that might have oklch
          if (window.getComputedStyle && element.nodeType === 1) {
            const computed = window.getComputedStyle(element);
            const bgColor = computed.backgroundColor;
            const color = computed.color;
            const borderColor = computed.borderColor;
            
            if (bgColor && bgColor.includes('oklch')) {
              element.style.backgroundColor = '#ffffff';
            }
            if (color && color.includes('oklch')) {
              element.style.color = '#000000';
            }
            if (borderColor && borderColor.includes('oklch')) {
              element.style.borderColor = '#e5e7eb';
            }
          }
          
          // Recursively process children
          if (element.children) {
            Array.from(element.children).forEach(child => processElement(child));
          }
        };
        
        processElement(clonedSection);
        clonedSection.style.marginBottom = '30px';
        clonedSection.style.backgroundColor = '#ffffff';
        exportContainer.appendChild(clonedSection);
      });

      document.body.appendChild(exportContainer);

      // Wait for fonts and rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture with html2canvas
      const canvas = await html2canvas(exportContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 0,
        ignoreElements: (element) => {
          // Skip any element that might have oklch colors
          if (element.style) {
            const style = window.getComputedStyle(element);
            if (style.backgroundColor?.includes('oklch') || 
                style.color?.includes('oklch') || 
                style.borderColor?.includes('oklch')) {
              return true;
            }
          }
          return false;
        },
        onclone: (clonedDoc) => {
          // Final pass to remove any remaining oklch colors in cloned document
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach(el => {
            if (el.style) {
              ['backgroundColor', 'color', 'borderColor', 'background', 'backgroundImage'].forEach(prop => {
                const value = el.style[prop];
                if (value && (value.includes('oklch') || value.includes('gradient'))) {
                  el.style[prop] = prop === 'color' ? '#000000' : '#ffffff';
                }
              });
            }
          });
        }
      });

      document.body.removeChild(exportContainer);

      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // A4 dimensions
      const pdfWidth = 210;
      const pdfHeight = 297;
      const margin = 10;
      const maxWidth = pdfWidth - (2 * margin);
      const maxHeight = pdfHeight - (2 * margin);

      // Calculate scaling
      const widthRatio = maxWidth / (imgWidth / 3.779527559);
      const heightRatio = maxHeight / (imgHeight / 3.779527559);
      const scale = Math.min(widthRatio, heightRatio, 1);

      const finalWidth = (imgWidth / 3.779527559) * scale;
      const finalHeight = (imgHeight / 3.779527559) * scale;

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      let yPosition = margin;
      let remainingHeight = imgHeight;
      let pageCount = 0;

      while (remainingHeight > 0) {
        if (pageCount > 0) {
          pdf.addPage();
          yPosition = margin;
        }

        const sourceY = pageCount * (maxHeight / scale) * 3.779527559;
        const sourceHeight = Math.min(
          remainingHeight,
          (maxHeight / scale) * 3.779527559
        );

        // Create a temporary canvas for this page
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pageCtx = pageCanvas.getContext('2d');
        
        pageCtx.drawImage(
          canvas,
          0, sourceY, canvas.width, sourceHeight,
          0, 0, canvas.width, sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);

        pdf.addImage(
          pageImgData,
          "JPEG",
          margin,
          yPosition,
          finalWidth,
          (sourceHeight / 3.779527559) * scale,
          undefined,
          "FAST"
        );

        remainingHeight -= sourceHeight;
        pageCount++;

        if (pageCount > 10) break; // Safety limit
      }

      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      const month = selectedMonth.getMonth();
      const year = selectedMonth.getFullYear();
      const filename = `Event_Calendar_${monthNames[month]}_${year}.pdf`;

      pdf.save(filename);

      message.success({
        content: "PDF exported successfully!",
        key: "pdf-export",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      message.error({
        content: `Failed to export PDF: ${error.message}`,
        key: "pdf-export",
        duration: 5,
      });
    } finally {
      setExporting(false);
    }
  };

  const renderEventContent = (eventInfo) => {
    try {
      const { eventName, eventType, venue } =
        eventInfo.event.extendedProps || {};

      // Show only event name if it's the same as event type
      const showEventType = eventName !== eventType;

      return (
        <div className="p-1.5 text-xs overflow-hidden leading-tight">
          <div className="font-semibold truncate text-white mb-0.5">
            {eventName}
          </div>
          {showEventType && (
            <div className="truncate text-white opacity-90 mb-0.5">
              {eventType}
            </div>
          )}
          {venue && (
            <div className="truncate opacity-80 flex items-center gap-1 text-white">
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
            const end = et.endDate ? new Date(et.endDate) : new Date(et.startDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
              return false;
            }

            const startMonth = start.getMonth();
            const startYear = start.getFullYear();
            const endMonth = end.getMonth();
            const endYear = end.getFullYear();

            // Event type must have start date OR end date in the current month/year
            const startsInCurrentMonth = (startMonth === month && startYear === year);
            const endsInCurrentMonth = (endMonth === month && endYear === year);

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
            eventTypes: eventTypesInMonth
          });
        }
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
      <div className="flex items-center justify-center h-screen" >
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
              <div className="p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
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
              className="flex items-center gap-2 px-6 py-3 text-white rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
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
          className="bg-white rounded-2xl shadow-xl p-6 mb-6 pdf-export-section"
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
                  agreedAmount,
                } = info.event.extendedProps;

                const showEventType = eventName !== eventType;
                
                let tooltip = showEventType ? `${eventName} - ${eventType}` : eventName;
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
        <div className="bg-white rounded-2xl shadow-xl p-6 pdf-export-section">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg" style={{ background: '#667eea' }}>
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
                    borderColor: getEventColor(event.eventName),
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
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
                    {event.eventTypes.map((et, idx) => {
                      const showEventType = event.eventName !== et.eventType;
                      
                      return (
                        <div
                          key={idx}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors"
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
                                {showEventType ? et.eventType : event.eventName}
                              </div>
                              <div className="flex items-start gap-2 text-sm text-gray-600 mb-2">
                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#667eea' }} />
                                <span>{et.venueLocation}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#667eea' }} />
                                <span>
                                  {formatDate(et.startDate)} at{" "}
                                  {formatTime(et.startDate)}
                                  {et.startDate !== et.endDate && et.endDate && (
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