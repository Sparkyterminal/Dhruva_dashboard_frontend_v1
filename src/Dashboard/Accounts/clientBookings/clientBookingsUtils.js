import dayjs from "dayjs";
import axiosClient from "@/api/axiosClient";
import { mapLimit } from "@/lib/async";

/** Maps list-view tab keys to API `status` query (omit for all). */
export const CLIENT_BOOKINGS_LIST_TAB_API_STATUS = {
  all: undefined,
  confirmed: "confirmed",
  inprogress: "inprogress",
  almostbooked: "almostbooked",
  cancelled: "cancelled",
};

/**
 * Query params for `GET /events` shared by the list view and the exports, so a
 * download always matches what the list shows (status tab, filters, data floor).
 * Excludes paging (`page` / `limit`).
 */
export const buildBookingsQueryParams = ({
  listStatusTab,
  filterEventName,
  filterVenueId,
  filterDateRange,
  cutoffDate,
}) => {
  const params = {};
  const statusParam = CLIENT_BOOKINGS_LIST_TAB_API_STATUS[listStatusTab];
  if (statusParam) params.status = statusParam;
  if (filterEventName) params.eventName = filterEventName;
  if (filterVenueId) {
    // Send venue id as query param (support both common keys used on backend)
    params.venueId = filterVenueId;
    params.venueLocation = filterVenueId;
  }
  // Default the "from" date to the data-visibility cutoff when the user hasn't
  // picked their own start date (server-filtered, see src/utils/dataCutoff.js).
  const start = filterDateRange?.[0]?.format("YYYY-MM-DD") ?? cutoffDate;
  const end = filterDateRange?.[1]?.format("YYYY-MM-DD") ?? null;
  if (start) params.startDate = start;
  if (end) params.endDate = end;
  return params;
};

/**
 * `GET /events` returns `totalsByStatus` built from baseQuery (ignores list `status` filter).
 * @see EVENTS_LIST_FRONTEND.md
 */
export const getEventsListTotalsBucket = (totalsByStatus, listTabKey) => {
  if (!totalsByStatus || typeof totalsByStatus !== "object") return null;
  if (listTabKey === "all") return totalsByStatus.all ?? null;
  if (listTabKey === "inprogress") {
    return totalsByStatus.inprogress ?? totalsByStatus.pending ?? null;
  }
  return totalsByStatus[listTabKey] ?? null;
};

/** Booking count for a list tab badge (matches filters, all statuses visible). */
export const getTabLabelBookingCount = (totalsByStatus, listTabKey) => {
  const b = getEventsListTotalsBucket(totalsByStatus, listTabKey);
  const n = b?.totalBookingsNumber;
  return typeof n === "number" && !Number.isNaN(n) ? n : null;
};

/**
 * Load every page from events for the given query (e.g. calendar).
 */
export async function fetchAllMyEventsPages(authHeaders, extraParams = {}) {
  const limit = extraParams.limit != null ? extraParams.limit : 100;
  const all = [];
  let page = 1;
  const maxPages = 500;
  while (page <= maxPages) {
    const res = await axiosClient.get(`events`, {
      headers: authHeaders,
      params: { ...extraParams, page, limit },
    });
    const d = res.data || {};
    const batch = Array.isArray(d.events) ? d.events : [];
    all.push(...batch);
    const totalPages = Number(d.totalPages);
    if (Number.isFinite(totalPages) && totalPages >= 1 && page >= totalPages) {
      break;
    }
    if (batch.length === 0 || batch.length < limit) {
      break;
    }
    page += 1;
  }
  return all;
}

/**
 * Loads every page of `GET /events` for the query (pages 2..N in parallel) and keeps the
 * first response as `summary`, because it carries `totalsByStatus` for the stats cards.
 * The list view needs the whole set so it can be ordered by event date across pages.
 */
export async function fetchAllEventsWithSummary(authHeaders, params = {}, { limit = 100, concurrency = 4 } = {}) {
  const getPage = async (page) => {
    const res = await axiosClient.get(`events`, {
      headers: authHeaders,
      params: { ...params, page, limit },
    });
    return res.data || {};
  };

  const first = await getPage(1);
  const events = Array.isArray(first.events) ? [...first.events] : [];
  const total = Number(first.totalEvents ?? first.total);
  const totalPages =
    Number(first.totalPages) || (Number.isFinite(total) && total > 0 ? Math.ceil(total / limit) : 1);

  if (totalPages > 1) {
    const pages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const rest = await mapLimit(pages, concurrency, getPage);
    rest.forEach((d) => {
      if (Array.isArray(d.events)) events.push(...d.events);
    });
  }
  return { events, summary: first };
}

/**
 * Event dates of a booking. A booking can have several ceremonies (eventTypes), each with
 * a start (and optional end) date. Dates are compared as local calendar days.
 *   primary    = the next ceremony that is today or later; if all are over, the last one
 *   isUpcoming = the primary date is today or later
 *   others     = how many other distinct ceremony days the booking has
 */
export const getBookingEventDateInfo = (record, today = dayjs()) => {
  const todayStart = today.startOf("day");
  const ceremonies = (record?.eventTypes || [])
    .map((et) => {
      const start = et?.startDate ? dayjs(et.startDate).startOf("day") : null;
      if (!start || !start.isValid()) return null;
      const endRaw = et?.endDate ? dayjs(et.endDate).startOf("day") : start;
      const end = endRaw.isValid() && !endRaw.isBefore(start) ? endRaw : start;
      return { start, end };
    })
    .filter(Boolean)
    .sort((a, b) => a.start.valueOf() - b.start.valueOf());

  if (ceremonies.length === 0) return { primary: null, isUpcoming: false, others: 0 };

  const next = ceremonies.find((c) => !c.end.isBefore(todayStart));
  const chosen = next || ceremonies[ceremonies.length - 1];
  const primary = chosen.start;
  const distinctDays = new Set(ceremonies.map((c) => c.start.format("YYYY-MM-DD")));
  distinctDays.delete(primary.format("YYYY-MM-DD"));
  return { primary, isUpcoming: Boolean(next), others: distinctDays.size };
};

/**
 * Upcoming bookings first (nearest date at the top), then completed ones below (most recent
 * first), then bookings with no event date. Ties are broken by client name.
 */
export const sortBookingsByEventDate = (bookings, today = dayjs()) => {
  const rank = (info) => (!info.primary ? 2 : info.isUpcoming ? 0 : 1);
  return bookings
    .map((record) => ({ record, info: getBookingEventDateInfo(record, today) }))
    .sort((a, b) => {
      const ra = rank(a.info);
      const rb = rank(b.info);
      if (ra !== rb) return ra - rb;
      if (ra !== 2) {
        const diff = a.info.primary.valueOf() - b.info.primary.valueOf();
        if (diff !== 0) return ra === 0 ? diff : -diff;
      }
      return String(a.record.clientName || "").localeCompare(String(b.record.clientName || ""));
    })
    .map((x) => x.record);
};

export const formatDate = (dateString) => {
  if (!dateString) return "-";
  return dayjs(dateString).format("DD MMM YYYY");
};

export const formatAmount = (amount) => {
  if (!amount && amount !== 0) return "₹0";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

/** Capitalize first letter of a name (e.g. "archana" → "Archana"). */
export const capitalizeFirstLetter = (value) => {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const getEventName = (eventName) => {
  if (typeof eventName === "string") return eventName;
  return eventName?.name || "N/A";
};

export const isSingleDisplayEvent = (record) => {
  const eventNameStr = getEventName(record.eventName);
  if (
    eventNameStr === "Wedding" &&
    record.advancePaymentType === "complete"
  ) {
    return true;
  }
  if (eventNameStr !== "Wedding") return true;
  return false;
};

export const isCompletePaymentWedding = (record) => {
  const eventNameStr = getEventName(record.eventName);
  return (
    eventNameStr === "Wedding" && record.advancePaymentType === "complete"
  );
};

export const getTotalPayable = (record) => {
  if (isCompletePaymentWedding(record)) {
    return record.eventTypes?.[0]?.totalPayable || 0;
  }
  return (
    record.eventTypes?.reduce(
      (sum, et) => sum + (et.totalPayable || 0),
      0,
    ) || 0
  );
};

export const getTotalAgreedAmount = (record) => {
  if (isCompletePaymentWedding(record)) {
    return record.eventTypes?.[0]?.agreedAmount || 0;
  }
  return (
    record.eventTypes?.reduce(
      (sum, et) => sum + (et.agreedAmount || 0),
      0,
    ) || 0
  );
};

/**
 * For complete-payment weddings, the same advance schedule is often copied onto
 * every ceremony. Summing all eventTypes double-counts money.
 *
 * Deduplicate by advanceNumber (fallback: index), taking the max numeric value
 * so a receipt saved only on a non-first event type is still counted once.
 */
const getCompleteWeddingAdvanceFieldTotal = (record, field) => {
  const byKey = new Map();
  (record?.eventTypes || []).forEach((et) => {
    (et?.advances || []).forEach((adv, idx) => {
      const key =
        adv?.advanceNumber != null && adv.advanceNumber !== ""
          ? `n:${adv.advanceNumber}`
          : `i:${idx}`;
      const amt = Number(adv?.[field]);
      const value = Number.isFinite(amt) ? amt : 0;
      const prev = byKey.get(key) ?? 0;
      if (value > prev) byKey.set(key, value);
    });
  });
  let total = 0;
  for (const value of byKey.values()) total += value;
  return total;
};

export const getTotalExpectedAdvances = (record) => {
  if (isCompletePaymentWedding(record)) {
    return getCompleteWeddingAdvanceFieldTotal(record, "expectedAmount");
  }
  let total = 0;
  record.eventTypes?.forEach((et) => {
    et.advances?.forEach((adv) => {
      total += adv.expectedAmount || 0;
    });
  });
  return total;
};

export const getTotalReceivedAdvances = (record) => {
  if (isCompletePaymentWedding(record)) {
    return getCompleteWeddingAdvanceFieldTotal(record, "receivedAmount");
  }
  let total = 0;
  record.eventTypes?.forEach((et) => {
    et.advances?.forEach((adv) => {
      total += adv.receivedAmount || 0;
    });
  });
  return total;
};

/**
 * Prefer local complete-wedding rules over backend `advanceTotals` until the
 * API stops summing received across all eventTypes for complete packages.
 */
export const getBookingReceivedAmount = (record) => {
  if (isCompletePaymentWedding(record)) {
    return getTotalReceivedAdvances(record);
  }
  if (record?.advanceTotals?.totalReceivedAmount != null) {
    return Number(record.advanceTotals.totalReceivedAmount) || 0;
  }
  return getTotalReceivedAdvances(record);
};

export const getBookingBalanceAmount = (record) => {
  const booked = getTotalPayable(record) || getTotalAgreedAmount(record);
  const received = getBookingReceivedAmount(record);
  return Math.max(0, booked - received);
};
