import dayjs from "dayjs";
import {
  getEventName,
  getTotalPayable,
  getBookingReceivedAmount,
  isCompletePaymentWedding,
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

const NONE = "-";

const formatInr = (n) =>
  Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export const day = (d) => (d && dayjs(d).isValid() ? dayjs(d).format("DD MMM YYYY") : NONE);
export const dateTime = (d) =>
  d && dayjs(d).isValid() ? dayjs(d).format("DD MMM YYYY, hh:mm A") : NONE;

// Populated refs arrive as { name }, unpopulated ones as plain strings.
export const nameOf = (v) => {
  if (v == null || v === "") return NONE;
  if (typeof v === "string") return v;
  return v.name || v.label || NONE;
};

export const statusLabel = (value) => {
  const s = String(value || "").toLowerCase();
  if (s.includes("confirm")) return "Confirmed";
  if (s.includes("progress") || s.includes("pending")) return "In progress";
  if (s.includes("cancel")) return "Cancelled";
  return value || NONE;
};

export const leadName = (lead) => (typeof lead === "string" ? lead : lead?.name || "");

export const bookedByName = (record) => {
  const raw =
    record?.bookedBy?.first_name ??
    record?.bookedBy?.firstName ??
    record?.createdBy?.first_name ??
    record?.createdBy?.firstName;
  const first = typeof raw === "string" ? raw.trim().split(/\s+/)[0] : "";
  return first ? capitalizeFirstLetter(first) : NONE;
};

const eventDateLabel = (record) => {
  const starts = (record.eventTypes || [])
    .map((t) => t?.startDate)
    .filter(Boolean)
    .map((d) => dayjs(d))
    .filter((d) => d.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf());
  if (starts.length === 0) return NONE;
  const first = starts[0].format("DD MMM YYYY");
  const distinctDays = new Set(starts.map((d) => d.format("YYYY-MM-DD"))).size;
  return distinctDays > 1 ? `${first} (+${distinctDays - 1} more)` : first;
};

export const earliestStart = (record) => {
  const times = (record.eventTypes || [])
    .map((t) => (t?.startDate ? new Date(t.startDate).getTime() : NaN))
    .filter((n) => !Number.isNaN(n));
  return times.length ? Math.min(...times) : Number.MAX_SAFE_INTEGER;
};

export const contactsOf = (e) =>
  [e.contactNumber, e.altContactNumber]
    .filter(Boolean)
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .join(", ") || NONE;

export const percent = (received, booked) =>
  booked > 0 ? Math.min(Math.round((received / booked) * 100), 100) : 0;

export const sumReceived = (advances) =>
  (advances || []).reduce((s, a) => s + (Number(a?.receivedAmount) || 0), 0);

/**
 * Complete-package weddings copy one advance schedule onto every ceremony, so
 * listing them all would repeat each advance. Same rule as the totals in
 * clientBookingsUtils: one entry per advance number, keeping the one that has
 * the received amount.
 */
export const completePackageAdvances = (record) => {
  const byKey = new Map();
  (record.eventTypes || []).forEach((et) =>
    (et?.advances || []).forEach((a, idx) => {
      const key =
        a?.advanceNumber != null && a.advanceNumber !== ""
          ? `n:${a.advanceNumber}`
          : `i:${idx}`;
      const prev = byKey.get(key);
      if (!prev || (Number(a.receivedAmount) || 0) > (Number(prev.receivedAmount) || 0)) {
        byKey.set(key, a);
      }
    }),
  );
  return [...byKey.values()].sort(
    (a, b) => (Number(a.advanceNumber) || 0) - (Number(b.advanceNumber) || 0),
  );
};

const ADVANCE_COLUMNS = [
  "#",
  "Expected",
  "Due Date",
  "Status",
  "Received",
  "Received On",
  "Mode",
  "Given By",
  "Collected By",
  "Remarks",
];

const advanceRow = (a, prefix = []) => {
  const got = Number(a.receivedAmount) > 0;
  return [
    ...prefix,
    a.advanceNumber != null ? String(a.advanceNumber) : NONE,
    formatInr(a.expectedAmount),
    day(a.advanceDate),
    got ? "Received" : "Pending",
    got ? formatInr(a.receivedAmount) : NONE,
    got ? day(a.receivedDate) : NONE,
    a.modeOfPayment || NONE,
    nameOf(a.givenBy),
    nameOf(a.collectedBy),
    a.remarks || NONE,
  ];
};

const AMOUNT_COLUMNS = [
  "Agreed",
  "Account Amount",
  "GST",
  "Account + GST",
  "Cash",
  "Total Payable",
  "Received",
  "Balance",
];

const amountCells = (t, received, balance) => [
  formatInr(t.agreedAmount),
  formatInr(t.accountAmount),
  formatInr(t.accountGst),
  formatInr(t.accountAmountWithGst),
  formatInr(t.cashAmount),
  formatInr(t.totalPayable),
  formatInr(received),
  formatInr(balance),
];

const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * One detail section per booking: booking info, event types (dates, venue,
 * coordinator), amount breakdown and advances. `amountCols` mark money columns
 * so each generator can add its own currency prefix.
 */
const buildDetail = (e, index) => {
  const complete = isCompletePaymentWedding(e);
  const types = e.eventTypes || [];
  const booked = getTotalPayable(e);
  const received = getBookingReceivedAmount(e);
  const balance = Math.max(booked - received, 0);

  const info = [
    ["Client", e.clientName || NONE],
    ["Event", getEventName(e.eventName)],
    ["Bride & Groom", e.brideName && e.groomName ? `${e.brideName} & ${e.groomName}` : NONE],
    ["Status", statusLabel(e.eventConfirmation)],
    ["Contact", contactsOf(e)],
    ["Payment Type", complete ? "Complete package" : "Separate"],
    ["Booked By", bookedByName(e)],
    ["Project Coordinators", [leadName(e.lead1), leadName(e.lead2)].filter(Boolean).join(", ") || NONE],
    ["Booked", formatInr(booked)],
    ["Received", formatInr(received)],
    ["Balance", formatInr(balance)],
    ["Collected", `${percent(received, booked)}%`],
  ];
  if (e.meetingDate) info.push(["Next Meeting", day(e.meetingDate)]);

  const tables = [];

  tables.push({
    title: complete ? "Ceremonies / Event Types" : "Event Types",
    columns: ["Event Type", "Start", "End", "Venue", "Sub Venue", "Coordinator"],
    rows: types.map((t) => [
      nameOf(t.eventType),
      dateTime(t.startDate),
      dateTime(t.endDate),
      nameOf(t.venueLocation),
      nameOf(t.subVenueLocation),
      nameOf(t.coordinator),
    ]),
    amountCols: [],
  });

  if (complete) {
    tables.push({
      title: "Complete Package Amount Breakdown",
      columns: ["Item", ...AMOUNT_COLUMNS],
      rows: [["Complete package", ...amountCells(types[0] || {}, received, balance)]],
      amountCols: range(1, 8),
    });
  } else if (types.length > 0) {
    const rows = types.map((t) => {
      const got = sumReceived(t.advances);
      return [
        nameOf(t.eventType),
        ...amountCells(t, got, Math.max((t.totalPayable || 0) - got, 0)),
      ];
    });
    if (types.length > 1) {
      const total = (key) => types.reduce((s, t) => s + (t[key] || 0), 0);
      rows.push([
        "Total",
        ...amountCells(
          {
            agreedAmount: total("agreedAmount"),
            accountAmount: total("accountAmount"),
            accountGst: total("accountGst"),
            accountAmountWithGst: total("accountAmountWithGst"),
            cashAmount: total("cashAmount"),
            totalPayable: booked,
          },
          received,
          balance,
        ),
      ]);
    }
    tables.push({
      title: "Amount Breakdown",
      columns: ["Event Type", ...AMOUNT_COLUMNS],
      rows,
      amountCols: range(1, 8),
      boldLastRow: types.length > 1,
    });
  }

  if (complete) {
    const advances = completePackageAdvances(e);
    if (advances.length) {
      tables.push({
        title: "Advances",
        columns: ADVANCE_COLUMNS,
        rows: advances.map((a) => advanceRow(a)),
        amountCols: [1, 4],
      });
    }
  } else {
    const rows = types.flatMap((t) =>
      (t.advances || []).map((a) => advanceRow(a, [nameOf(t.eventType)])),
    );
    if (rows.length) {
      tables.push({
        title: "Advances",
        columns: ["Event Type", ...ADVANCE_COLUMNS],
        rows,
        amountCols: [2, 5],
      });
    }
  }

  return {
    heading: `${index + 1}. ${e.clientName || NONE} - ${getEventName(e.eventName)}`,
    info,
    tables,
  };
};

/**
 * Turns events (as returned by GET /events) into a printable report model.
 * Pure: no I/O, no DOM. Amounts are pre-formatted numbers; each generator adds
 * its own currency prefix to the columns listed in `amountColumns` / `amountCols`.
 *
 * @param {object[]} events
 * @param {{ statusTab: string, filterLines?: string[], generatedAt?: Date }} ctx
 */
export const buildBookingsReport = (events, ctx) => {
  const sorted = [...events].sort((a, b) => earliestStart(a) - earliestStart(b));

  let booked = 0;
  let received = 0;
  let balance = 0;
  const rows = sorted.map((e, i) => {
    const b = getTotalPayable(e);
    const r = getBookingReceivedAmount(e);
    booked += b;
    received += r;
    balance += Math.max(b - r, 0);
    const couple =
      e.brideName && e.groomName ? ` (${e.brideName} & ${e.groomName})` : "";
    return [
      String(i + 1),
      getEventName(e.eventName),
      `${e.clientName || NONE}${couple}`,
      contactsOf(e),
      bookedByName(e),
      [leadName(e.lead1), leadName(e.lead2)].filter(Boolean).join(", ") || NONE,
      statusLabel(e.eventConfirmation),
      eventDateLabel(e),
      formatInr(b),
      formatInr(r),
      formatInr(Math.max(b - r, 0)),
      `${percent(r, b)}%`,
    ];
  });

  const generatedAt = ctx.generatedAt || new Date();
  return {
    title: STATUS_TAB_LABELS[ctx.statusTab] || STATUS_TAB_LABELS.all,
    filterLines: ctx.filterLines || [],
    generatedAt: dayjs(generatedAt).format("DD MMM YYYY, hh:mm A"),
    columns: REPORT_COLUMNS,
    rows,
    summary: [
      ["Total bookings", String(rows.length)],
      ["Total booked", formatInr(booked)],
      ["Total received", formatInr(received)],
      ["Total balance", formatInr(balance)],
    ],
    // Indexes of money columns in `rows`, for right-alignment / currency prefix.
    amountColumns: [8, 9, 10],
    details: sorted.map(buildDetail),
    fileBase: `Bookings_${(ctx.statusTab || "all").replace(/\W/g, "")}_${dayjs(
      generatedAt,
    ).format("YYYY-MM-DD")}`,
  };
};
