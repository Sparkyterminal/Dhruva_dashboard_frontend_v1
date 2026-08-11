import dayjs from "dayjs";

export const formatAmountINR = (value) => {
  const n = Number(value);
  if (value === null || value === undefined || Number.isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return "-";
  return d.format("DD-MM-YYYY HH:mm");
};

export const formatDate = (value) => {
  if (!value) return "-";
  const d = dayjs(value);
  if (!d.isValid()) return "-";
  return d.format("DD-MM-YYYY");
};

export const toSafeText = (value) => {
  if (value === null || value === undefined || value === "") return "-";
  return typeof value === "string" ? value : String(value);
};

export const formatEventName = (eventName) => {
  if (!eventName) return "-";
  if (typeof eventName === "string") return eventName;
  // Nested eventName on a populated event document
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

  if (client && eventLabel && eventLabel !== "-") {
    return `${client} — ${eventLabel}`;
  }
  if (client) return client;
  if (eventLabel && eventLabel !== "-") return eventLabel;
  return id || "-";
};

/** GET /daybook merges event advances with synthetic ids — not valid for inflow CRUD. */
export const isEventAdvanceDaybookRow = (record) => {
  const id = record?._id ?? record?.id;
  return typeof id === "string" && id.startsWith("eventadvance:");
};

export const statusTag = (status) => {
  const s = String(status || "").toUpperCase();
  if (!s) return { color: "default", text: "-" };
  if (s === "PENDING") return { color: "orange", text: s };
  if (s === "REJECTED") return { color: "red", text: s };
  if (s === "APPROVED" || s === "COMPLETED" || s === "ACCEPTED")
    return { color: "green", text: s };
  return { color: "blue", text: s };
};

