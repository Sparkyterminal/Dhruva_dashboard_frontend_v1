import dayjs from "dayjs";

/** Maps list-view tab keys to API `status` query (omit for all). */
export const CLIENT_BOOKINGS_LIST_TAB_API_STATUS = {
  all: undefined,
  confirmed: "confirmed",
  inprogress: "inprogress",
  cancelled: "cancelled",
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
export async function fetchAllMyEventsPages(
  axiosInstance,
  apiBaseUrl,
  authHeaders,
  extraParams = {},
) {
  const limit = extraParams.limit != null ? extraParams.limit : 100;
  const all = [];
  let page = 1;
  const maxPages = 500;
  while (page <= maxPages) {
    const res = await axiosInstance.get(`${apiBaseUrl}events`, {
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
