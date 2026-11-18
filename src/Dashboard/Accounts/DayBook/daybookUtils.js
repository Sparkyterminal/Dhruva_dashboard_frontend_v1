import dayjs from "dayjs";

/** ₹ with Indian digit grouping; paise are shown only when present (₹1,234.50). */
export const formatAmountINR = (value) => {
  const n = Number(value);
  if (value === null || value === undefined || Number.isNaN(n)) return "₹0";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const digits = Number.isInteger(abs) ? 0 : 2;
  return `${sign}₹${abs.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};

/** "YYYY-MM-DD" (or ISO) -> "DD-MM-YYYY". Date-only strings are read as local days. */
export const formatDate = (value) => {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return "-";
  return d.format("DD-MM-YYYY");
};

export const formatEventName = (eventName) => {
  if (!eventName) return "-";
  if (typeof eventName === "string") return eventName;
  if (eventName.eventName != null && typeof eventName.eventName === "object") {
    return eventName.eventName?.name || eventName.eventName?._id || "-";
  }
  if (typeof eventName.eventName === "string") return eventName.eventName;
  return eventName?.name || String(eventName?._id || eventName?.id || "-");
};

/** Normalize eventReference which may be an id string or a populated event object. */
export const getEventReferenceId = (ref) => {
  if (ref == null || ref === "") return undefined;
  if (typeof ref === "string") return ref;
  if (typeof ref === "object") {
    const id = ref._id ?? ref.id;
    return id != null ? String(id) : undefined;
  }
  return undefined;
};

/** Safe display label for eventReference (never returns a React-invalid object). */
export const formatEventReference = (ref) => {
  if (ref == null || ref === "") return "-";
  if (typeof ref === "string") return ref;
  if (typeof ref !== "object") return String(ref);

  const client = ref.clientName ? String(ref.clientName) : "";
  const eventLabel = formatEventName(ref.eventName ?? ref.name);
  const id = getEventReferenceId(ref);

  if (client && eventLabel && eventLabel !== "-") return `${client} — ${eventLabel}`;
  if (client) return client;
  if (eventLabel && eventLabel !== "-") return eventLabel;
  return id || "-";
};
