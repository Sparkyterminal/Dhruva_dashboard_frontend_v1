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
  return eventName?.name || eventName?._id || eventName?.id || "-";
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

