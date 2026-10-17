import dayjs from "dayjs";
import {
  getEventName,
  getTotalPayable,
  getBookingReceivedAmount,
  capitalizeFirstLetter,
} from "../clientBookingsUtils";

export const STATUS_TAB_LABELS = {
  all: "All Bookings",
  confirmed: "Confirmed Bookings",
  inprogress: "In Progress Bookings",
  cancelled: "Cancelled Bookings",
};

export const REPORT_COLUMNS = [
  "#",
  "Event",
  "Client",
  "Contact",
  "Booked By",
  "Leads",
  "Status",
  "Event Date",
  "Booked",
  "Received",
  "Balance",
  "Collected",
];

const formatInr = (n) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const statusLabel = (value) => {
  const s = String(value || "").toLowerCase();
  if (s.includes("confirm")) return "Confirmed";
  if (s.includes("progress") || s.includes("pending")) return "In progress";
  if (s.includes("cancel")) return "Cancelled";
  return value || "-";
};

const leadName = (lead) =>
  typeof lead === "string" ? lead : lead?.name || "";

const bookedByName = (record) => {
  const raw =
    record?.bookedBy?.first_name ??
    record?.bookedBy?.firstName ??
    record?.createdBy?.first_name ??
    record?.createdBy?.firstName;
  const first = typeof raw === "string" ? raw.trim().split(/\s+/)[0] : "";
  return first ? capitalizeFirstLetter(first) : "-";
};

const eventDateLabel = (record) => {
  const starts = (record.eventTypes || [])
    .map((t) => t?.startDate)
    .filter(Boolean)
    .map((d) => dayjs(d))
    .filter((d) => d.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf());
  if (starts.length === 0) return "-";
  const first = starts[0].format("DD MMM YYYY");
  const distinctDays = new Set(starts.map((d) => d.format("YYYY-MM-DD"))).size;
  return distinctDays > 1 ? `${first} (+${distinctDays - 1} more)` : first;
};

const earliestStart = (record) => {
  const times = (record.eventTypes || [])
    .map((t) => (t?.startDate ? new Date(t.startDate).getTime() : NaN))
    .filter((n) => !Number.isNaN(n));
  return times.length ? Math.min(...times) : Number.MAX_SAFE_INTEGER;
};

/**
 * Turns events (as returned by GET /events) into a printable report model.
 * Pure: no I/O, no DOM. Amounts are plain numbers formatted with `formatInr`;
 * each generator adds its own currency prefix.
 *
 * @param {object[]} events
 * @param {{ statusTab: string, filterLines?: string[], generatedAt?: Date }} ctx
 */
export const buildBookingsReport = (events, ctx) => {
  const sorted = [...events].sort((a, b) => earliestStart(a) - earliestStart(b));

  let booked = 0;
  let received = 0;
  const rows = sorted.map((e, i) => {
    const b = getTotalPayable(e);
    const r = getBookingReceivedAmount(e);
    const bal = Math.max(b - r, 0);
    booked += b;
    received += r;
    const pct = b > 0 ? Math.min(Math.round((r / b) * 100), 100) : 0;
    const couple =
      e.brideName && e.groomName ? ` (${e.brideName} & ${e.groomName})` : "";
    const contacts = [e.contactNumber, e.altContactNumber]
      .filter(Boolean)
      .filter((v, idx, arr) => arr.indexOf(v) === idx)
      .join(", ");
    return [
      String(i + 1),
      getEventName(e.eventName),
      `${e.clientName || "-"}${couple}`,
      contacts || "-",
      bookedByName(e),
      [leadName(e.lead1), leadName(e.lead2)].filter(Boolean).join(", ") || "-",
      statusLabel(e.eventConfirmation),
      eventDateLabel(e),
      formatInr(b),
      formatInr(r),
      formatInr(bal),
      `${pct}%`,
    ];
  });

  const balance = Math.max(booked - received, 0);
  return {
    title: STATUS_TAB_LABELS[ctx.statusTab] || STATUS_TAB_LABELS.all,
    filterLines: ctx.filterLines || [],
    generatedAt: dayjs(ctx.generatedAt || new Date()).format(
      "DD MMM YYYY, hh:mm A",
    ),
    columns: REPORT_COLUMNS,
    rows,
    summary: [
      ["Total bookings", String(rows.length)],
      ["Total booked", formatInr(booked)],
      ["Total received", formatInr(received)],
      ["Total balance", formatInr(balance)],
    ],
    // Indexes of columns holding money, for right-alignment by the generators.
    amountColumns: [8, 9, 10],
    fileBase: `Bookings_${(ctx.statusTab || "all").replace(/\W/g, "")}_${dayjs(
      ctx.generatedAt || new Date(),
    ).format("YYYY-MM-DD")}`,
  };
};
