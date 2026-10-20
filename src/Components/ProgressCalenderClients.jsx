import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { CalendarEmpty, CalendarSkeleton } from "./CalendarKit";
import { sameMonth, softEvent } from "./CalendarKit/calendarHelpers";
import "@/Components/PageKit/PageKit.css";
import { message } from "antd";
import { useSelector } from "react-redux";
import { fetchAllMyEventsPages } from "../Dashboard/Accounts/clientBookings/clientBookingsUtils";

const progressCache = new Map();

/** Calendar accent per status: gold = in progress, blue = almost booked, red = cancelled. */
const statusAccent = (status) =>
  status === "Cancelled" ? "#c0392b" : status === "Almost Booked" ? "#2f5d8c" : "#c4a747";

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

    const cacheKey = `progress:${user.access_token}`;
    const cached = progressCache.get(cacheKey);
    if (cached) setEvents(cached);
    setLoading(true);
    try {
      const authHeaders = { Authorization: user.access_token };
      const [inProgressList, almostBookedList, cancelledList] = await Promise.all([
        fetchAllMyEventsPages(authHeaders, {
          status: "inprogress",
          limit: 100,
        }),
        // Backends without the Almost Booked status yet simply return nothing here.
        fetchAllMyEventsPages(authHeaders, {
          status: "almostbooked",
          limit: 100,
        }).catch(() => []),
        fetchAllMyEventsPages(authHeaders, {
          status: "cancelled",
          limit: 100,
        }),
      ]);

      const byId = new Map();
      [...inProgressList, ...almostBookedList, ...cancelledList].forEach((event) => {
        if (event?._id) byId.set(String(event._id), event);
      });

      const eventsData = Array.from(byId.values()).filter(
        (event) =>
          event &&
          event.eventName &&
          (event.eventConfirmation === "InProgress" ||
          event.eventConfirmation === "Almost Booked" ||
            event.eventConfirmation === "Cancelled"),
      );

      progressCache.set(cacheKey, eventsData);
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
                ...softEvent(statusAccent(event.eventConfirmation)),
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
                ...softEvent(statusAccent(event.eventConfirmation)),
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

      const statusIcon =
        eventConfirmation === "Cancelled" ? "✕" : eventConfirmation === "Almost Booked" ? "◕" : "◐";

      return (
        <div className="fc-event-body">
          <div className="t">
            {statusIcon} {formatText(eventName)}
          </div>
          {eventType && !isMeeting && <div className="s">{formatText(eventType)}</div>}
          {isMeeting && <div className="s" style={{ fontStyle: "italic" }}>Meeting date</div>}
          <div className="s">{formatText(clientName)}</div>
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

  const getMonthEvents = () => {
    if (!selectedMonth || !events || events.length === 0) {
      return [];
    }

    try {
      const month = selectedMonth.getMonth();
      const year = selectedMonth.getFullYear();

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

  const calendarEvents = useMemo(() => getCalendarEvents(), [events]);
  const monthEvents = useMemo(() => getMonthEvents(), [events, selectedMonth]);

  const inProgressCount = events.filter(
    (e) => e.eventConfirmation === "InProgress",
  ).length;
  const almostBookedCount = events.filter(
    (e) => e.eventConfirmation === "Almost Booked",
  ).length;
  const cancelledCount = events.filter(
    (e) => e.eventConfirmation === "Cancelled",
  ).length;

  if (loading && events.length === 0) {
    return (
      <div className="ck">
        <CalendarSkeleton />
      </div>
    );
  }

  const accentFor = statusAccent;

  return (
    <div className="ck print-full">
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: white !important; }
        }
      `}</style>

      <div className="ck-head no-print">
        <div className="ck-title">
          <span className="ck-title-icon">
            <AlertCircle size={20} aria-hidden="true" />
          </span>
          <div>
            <h2>In progress, almost booked &amp; cancelled events</h2>
            <p>Track pending, almost booked and cancelled events, and their meeting dates</p>
          </div>
        </div>
        <div className="ck-chips">
          <span className="ck-chip is-gold">
            <i /> <b>{inProgressCount}</b> InProgress
          </span>
          <span className="ck-chip is-blue">
            <i /> <b>{almostBookedCount}</b> Almost booked
          </span>
          <span className="ck-chip is-red">
            <i /> <b>{cancelledCount}</b> Cancelled
          </span>
        </div>
      </div>

      <div className="ck-card pdf-export-section">
        {loading && <span className="ck-refresh no-print">Refreshing…</span>}
        <div className="ck-legend" style={{ marginBottom: 12 }}>
          <span><i style={{ "--c": "#c4a747" }} /> ◐ InProgress</span>
          <span><i style={{ "--c": "#2f5d8c" }} /> ◕ Almost booked</span>
          <span><i style={{ "--c": "#c0392b" }} /> ✕ Cancelled</span>
        </div>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth",
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
              const { clientName, eventName, eventType, eventConfirmation, isMeeting } =
                info.event.extendedProps;

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

      <div className="ck-card pdf-export-section">
        <h3 className="ck-card-title">
          Events this month{" "}
          <span>
            {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
        </h3>

        {monthEvents.length === 0 ? (
          <CalendarEmpty
            icon={<Calendar size={24} aria-hidden="true" />}
            title="No InProgress, Almost Booked or Cancelled events this month"
            hint="Use the arrows above to look at another month."
          />
        ) : (
          <div className="ck-list">
            {monthEvents.map((event) => (
              <article
                key={event._id}
                className="ck-item"
                style={{ "--accent": accentFor(event.eventConfirmation) }}
              >
                <div className="pk-pills">
                  <span className={`pk-pill ${event.eventConfirmation === "Cancelled" ? "is-red" : event.eventConfirmation === "Almost Booked" ? "is-blue" : "is-gold"}`}>
                    {formatText(event.eventName)}
                  </span>
                  <span className="pk-pill is-grey">{event.eventConfirmation}</span>
                </div>
                <h4>{formatText(event.clientName)}</h4>
                <p className="ck-item-meta">
                  <b>Project coordinators:</b> {formatText(event.lead1) || "-"}
                  {formatText(event.lead2) ? `, ${formatText(event.lead2)}` : ""}
                </p>

                <div className="ck-sub">
                  {/* Meeting Date */}
                  {event.meetings && event.meetings.length > 0 && (
                    <div className="ck-row is-meeting">
                      <span className="ck-date is-gold">Meeting</span>
                      <div className="ck-row-body">
                        <strong>Meeting date</strong>
                        <span>
                          <Clock size={14} aria-hidden="true" />
                          {formatDate(event.meetings[0].meetingDate)}{" "}
                          {formatTime(event.meetings[0].meetingDate)}
                        </span>
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
                        <div key={idx} className="ck-row">
                          <span className="ck-date is-grey">Event</span>
                          <div className="ck-row-body">
                            <strong>{formatText(et.eventType) || formatText(event.eventName)}</strong>
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

export default ProgressCalenderClients;
