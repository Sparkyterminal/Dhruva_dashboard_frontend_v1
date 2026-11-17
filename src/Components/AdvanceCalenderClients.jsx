import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { CalendarDays, CircleDollarSign, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import dayjs from "dayjs";
import { message } from "antd";
import { useSelector } from "react-redux";
import { getEffectiveCutoffDate } from "../utils/dataCutoff";
import { CalendarEmpty, CalendarSkeleton } from "./CalendarKit";
import { sameMonth, softEvent } from "./CalendarKit/calendarHelpers";
import { StatCard, StatRow } from "@/Components/PageKit";
import {
  fetchAllMyEventsPages,
  isCompletePaymentWedding,
} from "@/Dashboard/Accounts/clientBookings/clientBookingsUtils";
import { completePackageAdvances } from "@/Dashboard/Accounts/clientBookings/export/bookingsReport";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

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

const formatDate = (date) => (date ? dayjs(date).format("DD MMM YYYY") : "N/A");

/** The whole events payload is large; keep the last one per login so revisits paint at once. */
const advanceCache = new Map();

/** Received amount is the truth (the saved status can lag behind): nothing received = Pending. */
const advanceState = (expected, received) => {
  if (received > 0 && received >= expected) return "paid";
  if (received > 0) return "partial";
  return "pending";
};

const STATE_LABEL = { paid: "Received", partial: "Partly received", pending: "Pending" };
const STATE_COLOR = { paid: "#2f8a4b", partial: "#c4a747", pending: "#b5562b" };

/**
 * Flatten every advance of every confirmed event once, so month views and stats never
 * re-walk the raw payload. Complete-package weddings copy one schedule onto every
 * ceremony, so those are counted once (same rule as the bookings screens).
 */
const flattenAdvances = (events) => {
  const out = [];
  for (const event of events) {
    if (!event || !Array.isArray(event.eventTypes)) continue;
    const groups = isCompletePaymentWedding(event)
      ? [{ et: event.eventTypes[0], list: completePackageAdvances(event), label: "Package" }]
      : event.eventTypes.map((et) => ({ et, list: et?.advances || [], label: null }));

    groups.forEach(({ et, list, label }, etIdx) => {
      list.forEach((advance, advIdx) => {
        if (!advance || !advance.advanceDate) return;
        const parsed = dayjs(advance.advanceDate);
        if (!parsed.isValid()) return;
        const expected = Number(advance.expectedAmount) || 0;
        const received = Number(advance.receivedAmount) || 0;
        const state = advanceState(expected, received);
        out.push({
          id: `${event._id}-${etIdx}-${advIdx}`,
          event,
          et,
          typeLabel: label,
          advance,
          date: parsed.toDate(),
          dayKey: parsed.format("YYYY-MM-DD"),
          month: parsed.month(),
          year: parsed.year(),
          expected,
          received,
          state,
          pendingAmount: Math.max(expected - received, 0),
        });
      });
    });
  }
  return out;
};

const AdvanceCalendarClients = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const calendarRef = useRef(null);
  const user = useSelector((state) => state.user.value);

  const fetchRequirementsData = useCallback(async () => {
    if (!user?.access_token) {
      message.error("Authentication required. Please login again.");
      setLoading(false);
      return;
    }

    const cacheKey = `advance:${user.access_token}`;
    const cached = advanceCache.get(cacheKey);
    if (cached) {
      setEvents(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const allConfirmed = await fetchAllMyEventsPages(
        { Authorization: user.access_token },
        { status: "confirmed", limit: 100, startDate: getEffectiveCutoffDate(user) },
      );

      const eventsData = allConfirmed.filter(
        (event) =>
          event &&
          event._id &&
          event.eventName &&
          event.eventConfirmation === "Confirmed Event" &&
          Array.isArray(event.eventTypes),
      );

      advanceCache.set(cacheKey, eventsData);
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
      if (!cached) setEvents([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.access_token]);

  useEffect(() => {
    fetchRequirementsData();
  }, [fetchRequirementsData]);

  const advances = useMemo(() => flattenAdvances(events), [events]);

  const calendarEvents = useMemo(
    () =>
      advances.map((a) => ({
        id: a.id,
        title: formatText(a.event.eventName),
        start: a.dayKey,
        allDay: true,
        extendedProps: {
          clientName: formatText(a.event.clientName) || "Unknown Client",
          eventName: formatText(a.event.eventName),
          eventType: a.typeLabel || formatText(a.et?.eventType) || "N/A",
          advanceNumber: a.advance.advanceNumber,
          expectedAmount: a.expected,
          receivedAmount: a.received,
          state: a.state,
          pendingAmount: a.pendingAmount,
        },
        ...softEvent(STATE_COLOR[a.state]),
      })),
    [advances],
  );

  const monthAdvances = useMemo(() => {
    const month = selectedMonth.getMonth();
    const year = selectedMonth.getFullYear();
    return advances
      .filter((a) => a.month === month && a.year === year)
      .sort((a, b) => a.date - b.date);
  }, [advances, selectedMonth]);

  const stats = useMemo(() => {
    let totalExpected = 0;
    let totalReceived = 0;
    let totalPending = 0;
    let fullyPaidCount = 0;
    for (const a of monthAdvances) {
      totalExpected += a.expected;
      totalReceived += a.received;
      totalPending += a.pendingAmount;
      if (a.state === "paid") fullyPaidCount++;
    }
    return {
      totalExpected,
      totalReceived,
      totalPending,
      fullyPaidCount,
      totalAdvances: monthAdvances.length,
    };
  }, [monthAdvances]);

  const renderEventContent = (eventInfo) => {
    try {
      const { eventName, advanceNumber, expectedAmount, receivedAmount, state, pendingAmount } =
        eventInfo.event.extendedProps || {};

      return (
        <div className="fc-event-body">
          <div className="t">
            {formatText(eventName)} · Adv #{advanceNumber}
          </div>
          <div className="s" style={{ fontWeight: 700, color: STATE_COLOR[state] }}>
            {STATE_LABEL[state]}
          </div>
          <div className="s">Expected {money(expectedAmount)}</div>
          <div className="s">Received {money(receivedAmount)}</div>
          {pendingAmount > 0 && <div className="s">Pending {money(pendingAmount)}</div>}
        </div>
      );
    } catch (error) {
      console.error("Error rendering event content:", error);
      return (
        <div className="fc-event-body">
          <div className="t">Advance</div>
        </div>
      );
    }
  };

  if (loading && events.length === 0) {
    return (
      <div className="ck">
        <CalendarSkeleton />
      </div>
    );
  }

  return (
    <div className="ck ck-advance">
      <div className="ck-head">
        <div className="ck-title">
          <span className="ck-title-icon">
            <Wallet size={20} aria-hidden="true" />
          </span>
          <div>
            <h2>Advance payment calendar</h2>
            <p>Every advance of a confirmed event, its due date and whether it has been received</p>
          </div>
        </div>
        <div className="ck-legend">
          <span><i style={{ "--c": STATE_COLOR.paid }} /> Received</span>
          <span><i style={{ "--c": STATE_COLOR.partial }} /> Partly received</span>
          <span><i style={{ "--c": STATE_COLOR.pending }} /> Pending</span>
        </div>
      </div>

      <StatRow>
        <StatCard
          icon={<TrendingUp size={21} aria-hidden="true" />}
          label="Total expected"
          value={money(stats.totalExpected)}
        />
        <StatCard
          tone="blue"
          icon={<CircleDollarSign size={21} aria-hidden="true" />}
          label="Total received"
          value={money(stats.totalReceived)}
        />
        <StatCard
          tone="gold"
          icon={<TrendingDown size={21} aria-hidden="true" />}
          label="Total pending"
          value={money(stats.totalPending)}
        />
        <StatCard
          icon={<CalendarDays size={21} aria-hidden="true" />}
          label="Advances received / total"
          value={`${stats.fullyPaidCount}/${stats.totalAdvances}`}
        />
      </StatRow>

      <div className="ck-card">
        {loading && <span className="ck-refresh">Refreshing…</span>}
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
          eventMaxStack={10}
          datesSet={() => {
            try {
              const calendarApi = calendarRef.current?.getApi();
              if (calendarApi) {
                const currentDate = calendarApi.getDate();
                setSelectedMonth((prev) => (sameMonth(prev, currentDate) ? prev : currentDate));
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
                state,
              } = info.event.extendedProps;

              let tooltip = `${formatText(eventName)}`;
              if (eventType) tooltip += ` - ${formatText(eventType)}`;
              tooltip += `\nClient: ${formatText(clientName)}`;
              tooltip += `\nAdvance #${advanceNumber} - ${STATE_LABEL[state]}`;
              tooltip += `\nExpected: ${money(expectedAmount)}`;
              tooltip += `\nReceived: ${money(receivedAmount)}`;
              if (pendingAmount > 0) {
                tooltip += `\nPending: ${money(pendingAmount)}`;
              }

              info.el.setAttribute("title", tooltip);
            } catch (error) {
              console.error("Error mounting event:", error);
            }
          }}
        />
      </div>

      <div className="ck-card">
        <h3 className="ck-card-title">
          Advances this month{" "}
          <span>
            {selectedMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </span>
        </h3>

        {monthAdvances.length === 0 ? (
          <CalendarEmpty
            icon={<Wallet size={24} aria-hidden="true" />}
            title="No advances scheduled for this month"
            hint="Use the arrows above to look at another month."
          />
        ) : (
          <div className="ck-list">
            {monthAdvances.map((a) => {
              const pct = a.expected > 0 ? Math.min(Math.round((a.received / a.expected) * 100), 100) : 0;
              const typeText = a.typeLabel || formatText(a.et?.eventType);
              return (
                <article key={a.id} className="ck-item" style={{ "--accent": STATE_COLOR[a.state] }}>
                  <div className="ck-item-top">
                    <div>
                      <div className="pk-pills">
                        <span className={`pk-pill ${a.state === "paid" ? "" : "is-gold"}`}>
                          {STATE_LABEL[a.state]}
                        </span>
                        <span className="pk-pill is-grey">Advance #{a.advance.advanceNumber}</span>
                      </div>
                      <h4>{formatText(a.event.eventName)}</h4>
                      <p className="ck-item-meta">
                        <b>Client:</b> {formatText(a.event.clientName)}
                        {typeText ? ` · ${typeText}` : ""}
                      </p>
                    </div>
                    <span className="ck-date">Due {formatDate(a.date)}</span>
                  </div>

                  <div className="ck-amounts">
                    <div>
                      <span>Expected</span>
                      <strong>{money(a.expected)}</strong>
                    </div>
                    <div>
                      <span>Received</span>
                      <strong className="is-green">{money(a.received)}</strong>
                    </div>
                    <div>
                      <span>Pending</span>
                      <strong className={a.pendingAmount > 0 ? "is-gold" : "is-muted"}>
                        {money(a.pendingAmount)}
                      </strong>
                    </div>
                  </div>
                  <div className="ck-bar" aria-hidden="true">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvanceCalendarClients;
