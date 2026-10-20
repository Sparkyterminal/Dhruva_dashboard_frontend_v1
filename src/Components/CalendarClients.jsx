import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar, MapPin, Clock } from "lucide-react";
import { message } from "antd";
import { useSelector } from "react-redux";
import { fetchAllMyEventsPages } from "../Dashboard/Accounts/clientBookings/clientBookingsUtils";
import {
  captureElementAsImage,
  downloadCanvasAsPng,
} from "../utils/captureElementAsImage";
import { getEffectiveCutoffDate } from "../utils/dataCutoff";
import { CalendarEmpty, CalendarSkeleton } from "./CalendarKit";
import { sameMonth, softEvent } from "./CalendarKit/calendarHelpers";
import "@/Components/PageKit/PageKit.css";

const confirmedCache = new Map();

const CalendarClients = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [exportingImage, setExportingImage] = useState(false);
  const calendarRef = useRef(null);
  const calendarExportRef = useRef(null);
  const user = useSelector((state) => state.user.value);

  const fetchRequirementsData = useCallback(async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      return;
    }

    const cached = confirmedCache.get(`confirmed:${user.access_token}`);
    if (cached) setEvents(cached);
    setLoading(true);
    try {
      const authHeaders = { Authorization: user.access_token };
      const allConfirmed = await fetchAllMyEventsPages(
        authHeaders,
        { status: "confirmed", limit: 100, startDate: getEffectiveCutoffDate(user) },
      );

      const eventsData = allConfirmed.filter(
        (event) =>
          event &&
          event.eventName &&
          event.eventConfirmation === "Confirmed Event" &&
          Array.isArray(event.eventTypes) &&
          event.eventTypes.length > 0,
      );

      confirmedCache.set(`confirmed:${user.access_token}`, eventsData);
      setEvents(eventsData);
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

  const getPriority = (eventType) => {
    const type = formatText(eventType).toLowerCase();
    if (type.includes("muhurtham")) return 1;
    if (type.includes("reception")) return 2;
    return 3;
  };

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
                venue: formatText(et.venueLocation) || "TBD",
                subVenue: formatText(et.subVenueLocation) || "",
                lead1: formatText(event.lead1) || "",
                lead2: formatText(event.lead2) || "",
                brideName: formatText(event.brideName),
                groomName: formatText(event.groomName),
                hasMultipleTypes: event.eventTypes.length > 1,
                agreedAmount: et.agreedAmount || event.agreedAmount || 0,
                startDate: et.startDate,
                endDate: et.endDate,
                eventConfirmation: event.eventConfirmation || "Pending",
                priority: getPriority(et.eventType || event.eventName),
              },
              ...softEvent(getEventColor(`${event._id}-${idx}`)),
            });
          } catch (error) {
            console.error(`Error processing event ${event._id}-${idx}:`, error);
          }
        });
      });

      // Sort events by priority (Reception=1, Muhurtham=2, others=3)
      calendarEvents.sort((a, b) => {
        if (a.start === b.start) {
          return a.extendedProps.priority - b.extendedProps.priority;
        }
        return 0;
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
      "#338147",
      "#2f8a4b",
      "#f59e0b",
      "#2b7a41",
      "#67cd7b",
      "#fb923c",
      "#34d399",
      "#5da06a",
      "#a1e4af",
      "#fb7185",
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
      const { eventName, eventType, lead1, lead2, venue, subVenue, priority } =
        eventInfo.event.extendedProps || {};

      const displayVenue = subVenue || venue;

      return (
        <div className="fc-event-body" data-priority={priority}>
          <div className="t">{formatText(eventName)}</div>
          {eventType && <div className="s">{formatText(eventType)}</div>}
          {lead1 && <div className="s">{formatText(lead1)}</div>}
          {lead2 && <div className="s">{formatText(lead2)}</div>}
          {displayVenue && (
            <div className="s" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MapPin size={10} style={{ flex: "none" }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                {formatText(displayVenue)}
              </span>
            </div>
          )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering event content:", error);
      return (
        <div className="fc-event-body">
          <div className="t">Event</div>
        </div>
      );
    }
  };

  const getMonthEvents = useCallback(() => {
    if (!selectedMonth || !events || events.length === 0) {
      return [];
    }

    try {
      const month = selectedMonth.getMonth();
      const year = selectedMonth.getFullYear();

      const filteredEvents = [];

      events.forEach((event) => {
        if (!event || !event.eventTypes || !Array.isArray(event.eventTypes)) {
          return;
        }

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
          filteredEvents.push({
            ...event,
            eventTypes: eventTypesInMonth,
          });
        }
      });

      filteredEvents.forEach((ev) => {
        ev.eventTypes.sort(
          (a, b) => new Date(a.startDate) - new Date(b.startDate),
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
  }, [events, selectedMonth]);

  const monthEvents = useMemo(() => getMonthEvents(), [getMonthEvents]);

  const monthLabel = useMemo(() => {
    if (!selectedMonth) return "";
    return selectedMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }, [selectedMonth]);

  const handleDownloadMonthImage = useCallback(async () => {
    if (!calendarExportRef.current) {
      message.error("Calendar is not ready for export");
      return;
    }

    const hide = message.loading(`Capturing ${monthLabel} calendar...`, 0);
    setExportingImage(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await captureElementAsImage(calendarExportRef.current, {
        hideSelectors: [".fc-downloadMonthImage-button"],
      });

      if (!canvas) {
        throw new Error("Failed to capture calendar");
      }

      const fileMonth = selectedMonth
        ? `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, "0")}`
        : "month";

      downloadCanvasAsPng(canvas, `Confirmed-Events-${fileMonth}.png`);
      message.success(`Downloaded calendar image for ${monthLabel}`);
    } catch (error) {
      console.error("Image export failed:", error);
      message.error("Failed to download calendar image. Please try again.");
    } finally {
      hide();
      setExportingImage(false);
    }
  }, [monthLabel, selectedMonth]);

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
    } catch {
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

  const calendarEvents = useMemo(() => getCalendarEvents(), [events]);

  if (loading && events.length === 0) {
    return (
      <div className="ck">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className={`ck print-full${exportingImage ? " calendar-exporting" : ""}`}>
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: white !important; }
        }
        .fc .fc-downloadMonthImage-button { background: #fff !important; }
        .calendar-exporting .fc-downloadMonthImage-button { opacity: 0.6; pointer-events: none; }
      `}</style>

      <div className="ck-head no-print">
        <div className="ck-title">
          <span className="ck-title-icon">
            <Calendar size={20} aria-hidden="true" />
          </span>
          <div>
            <h2>Confirmed events</h2>
            <p>Every confirmed event, by date and venue</p>
          </div>
        </div>
        <div className="ck-chips">
          <span className="ck-chip is-green">
            <i /> <b>{events.length}</b> confirmed events
          </span>
        </div>
      </div>

      <div ref={calendarExportRef} className="ck-card">
        {loading && <span className="ck-refresh no-print">Refreshing…</span>}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          customButtons={{
            downloadMonthImage: {
              text: "Download image",
              click: handleDownloadMonthImage,
            },
          }}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "downloadMonthImage",
          }}
          events={calendarEvents}
          eventContent={renderEventContent}
          height="auto"
          dayMaxEvents={false}
          eventMaxStack={15}
          datesSet={() => {
            try {
              const calendarApi = calendarRef.current?.getApi();
              if (calendarApi) {
                const currentDate = calendarApi.getDate();
                setSelectedMonth((prev) =>
                  sameMonth(prev, currentDate) ? prev : currentDate,
                );
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
                subVenue,
                lead1,
                lead2,
                brideName,
                groomName,
              } = info.event.extendedProps;

              let tooltip = `${formatText(eventName)}`;
              if (eventType) {
                tooltip += ` - ${formatText(eventType)}`;
              }
              tooltip += `\nClient: ${formatText(clientName) || "Unknown"}`;
              if (brideName && groomName) {
                tooltip += `\n${formatText(brideName)} & ${formatText(groomName)}`;
              }
              if (lead1) tooltip += `\nLead 1: ${formatText(lead1)}`;
              if (lead2) tooltip += `\nLead 2: ${formatText(lead2)}`;
              tooltip += `\nVenue: ${formatText(subVenue || venue) || "TBD"}`;

              info.el.setAttribute("title", tooltip);
            } catch (error) {
              console.error("Error mounting event:", error);
            }
          }}
        />
      </div>

      <div className="ck-card">
        <h3 className="ck-card-title">
          Events this month <span>{monthLabel}</span>
        </h3>

        {monthEvents.length === 0 ? (
          <CalendarEmpty
            icon={<Calendar size={24} aria-hidden="true" />}
            title="No confirmed events this month"
            hint="Use the arrows above to look at another month."
          />
        ) : (
          <div className="ck-list">
            {monthEvents.map((event) => (
              <article
                key={event._id}
                className="ck-item"
                style={{ "--accent": getEventColor(event._id) }}
              >
                <div className="ck-item-top">
                  <div>
                    <div className="pk-pills">
                      <span className="pk-pill">{formatText(event.eventName)}</span>
                      <span className="pk-pill is-grey">Confirmed</span>
                    </div>
                    <h4>{formatText(event.clientName)}</h4>
                    <p className="ck-item-meta">
                      <b>Project coordinators:</b> {formatText(event.lead1) || "-"}
                      {formatText(event.lead2) ? `, ${formatText(event.lead2)}` : ""}
                    </p>
                    {event.brideName && event.groomName && (
                      <p className="ck-item-meta">
                        {formatText(event.brideName)} &amp; {formatText(event.groomName)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="ck-sub">
                  {event.eventTypes.map((et, idx) => {
                    const start = et?.startDate;
                    const end = et?.endDate;
                    const multiDay = start && end && start !== end;
                    const displayVenue =
                      formatText(et.subVenueLocation) || formatText(et.venueLocation);

                    return (
                      <div key={idx} className="ck-row">
                        <span className="ck-date">{formatDateShort(start)}</span>
                        <div className="ck-row-body">
                          <strong>{formatText(et.eventType) || formatText(event.eventName)}</strong>
                          <span>
                            <MapPin size={14} aria-hidden="true" />
                            {displayVenue}
                          </span>
                          <span>
                            <Clock size={14} aria-hidden="true" />
                            {formatDate(start)} {formatTime(start)}
                            {multiDay && end ? ` → ${formatDate(end)} ${formatTime(end)}` : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarClients;
