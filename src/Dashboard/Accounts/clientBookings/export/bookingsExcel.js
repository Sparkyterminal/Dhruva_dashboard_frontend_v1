import dayjs from "dayjs";
import { downloadExcel } from "@/lib/excel/downloadExcel";
import {
  getEventName,
  getTotalPayable,
  getBookingReceivedAmount,
  isCompletePaymentWedding,
} from "../clientBookingsUtils";
import {
  STATUS_TAB_LABELS,
  nameOf,
  statusLabel,
  leadName,
  bookedByName,
  earliestStart,
  percent,
  sumReceived,
  completePackageAdvances,
} from "./bookingsReport";

const NONE_TO_NULL = (v) => (v === "-" || v === "" ? null : v);

const BASE_COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Status" },
  { header: "Event" },
  { header: "Client" },
  { header: "Bride" },
  { header: "Groom" },
  { header: "Contact" },
  { header: "Alt Contact" },
  { header: "Booked By" },
  { header: "Project Coordinator 1" },
  { header: "Project Coordinator 2" },
  { header: "Payment Type" },
  { header: "Next Meeting", type: "date" },
  { header: "First Event Date", type: "date" },
  { header: "Last Event Date", type: "date" },
  { header: "No. of Event Types", type: "number" },
  { header: "Booked Amount", type: "money" },
  { header: "Received", type: "money" },
  { header: "Balance", type: "money" },
  { header: "Collected %", type: "percent" },
  { header: "Created On", type: "date" },
  { header: "Last Updated", type: "date" },
];

const PACKAGE_COLUMNS = [
  { header: "Agreed", type: "money" },
  { header: "Account Amount", type: "money" },
  { header: "GST", type: "money" },
  { header: "Account + GST", type: "money" },
  { header: "Cash", type: "money" },
  { header: "Total Payable", type: "money" },
];

const TYPE_COLUMNS = [
  { header: "Event Type" },
  { header: "Start", type: "datetime" },
  { header: "End", type: "datetime" },
  { header: "Venue" },
  { header: "Sub Venue" },
  { header: "Coordinator" },
  ...PACKAGE_COLUMNS,
  { header: "Received", type: "money" },
  { header: "Balance", type: "money" },
];

const ADVANCE_COLUMNS = [
  { header: "For" },
  { header: "Expected", type: "money" },
  { header: "Due Date", type: "date" },
  { header: "Status" },
  { header: "Received", type: "money" },
  { header: "Received On", type: "date" },
  { header: "Mode" },
  { header: "Given By" },
  { header: "Collected By" },
  { header: "Remarks", wrap: true, width: 24 },
];

const amountCells = (t) => [
  t.agreedAmount,
  t.accountAmount,
  t.accountGst,
  t.accountAmountWithGst,
  t.cashAmount,
  t.totalPayable,
];

const blanks = (n) => Array(n).fill(null);

const advancesOf = (e, complete) =>
  complete
    ? completePackageAdvances(e).map((a) => ({ a, forLabel: "Package" }))
    : (e.eventTypes || []).flatMap((t) =>
        (t.advances || []).map((a) => ({ a, forLabel: NONE_TO_NULL(nameOf(t.eventType)) })),
      );

/**
 * One row per booking: booking info, package breakdown, every event type and
 * every advance laid out in column groups. Pure; returns a sheet spec for
 * downloadExcel.
 */
export const buildBookingsSheet = (events, ctx) => {
  const sorted = [...events].sort((a, b) => earliestStart(a) - earliestStart(b));
  const completeFlags = sorted.map(isCompletePaymentWedding);
  const advanceLists = sorted.map((e, i) => advancesOf(e, completeFlags[i]));

  const maxTypes = Math.max(0, ...sorted.map((e) => (e.eventTypes || []).length));
  const maxAdvances = Math.max(0, ...advanceLists.map((l) => l.length));
  const hasPackage = completeFlags.some(Boolean);

  const columns = [...BASE_COLUMNS];
  const groups = [{ label: "Booking", from: 0, to: BASE_COLUMNS.length - 1 }];
  const addGroup = (label, cols) => {
    groups.push({ label, from: columns.length, to: columns.length + cols.length - 1 });
    columns.push(...cols);
  };
  if (hasPackage) addGroup("Complete Package Amount Breakdown", PACKAGE_COLUMNS);
  for (let k = 1; k <= maxTypes; k += 1) addGroup(`Event Type ${k}`, TYPE_COLUMNS);
  for (let k = 1; k <= maxAdvances; k += 1) addGroup(`Advance ${k}`, ADVANCE_COLUMNS);

  let totalBooked = 0;
  let totalReceived = 0;
  let totalBalance = 0;
  const rows = sorted.map((e, i) => {
    const complete = completeFlags[i];
    const types = e.eventTypes || [];
    const booked = getTotalPayable(e);
    const received = getBookingReceivedAmount(e);
    totalBooked += booked;
    totalReceived += received;
    totalBalance += Math.max(booked - received, 0);
    const starts = types.map((t) => t.startDate).filter(Boolean).sort();

    const row = [
      i + 1,
      statusLabel(e.eventConfirmation),
      getEventName(e.eventName),
      e.clientName,
      e.brideName,
      e.groomName,
      e.contactNumber,
      e.altContactNumber && e.altContactNumber !== e.contactNumber ? e.altContactNumber : null,
      NONE_TO_NULL(bookedByName(e)),
      leadName(e.lead1),
      leadName(e.lead2),
      complete ? "Complete package" : "Separate",
      e.meetingDate,
      starts[0],
      starts[starts.length - 1],
      types.length,
      booked,
      received,
      Math.max(booked - received, 0),
      percent(received, booked),
      e.createdAt,
      e.updatedAt,
    ];

    if (hasPackage) row.push(...(complete ? amountCells(types[0] || {}) : blanks(PACKAGE_COLUMNS.length)));

    for (let k = 0; k < maxTypes; k += 1) {
      const t = types[k];
      if (!t) {
        row.push(...blanks(TYPE_COLUMNS.length));
      } else if (complete) {
        row.push(
          NONE_TO_NULL(nameOf(t.eventType)), t.startDate, t.endDate,
          NONE_TO_NULL(nameOf(t.venueLocation)), NONE_TO_NULL(nameOf(t.subVenueLocation)),
          NONE_TO_NULL(nameOf(t.coordinator)),
          ...blanks(PACKAGE_COLUMNS.length + 2),
        );
      } else {
        const got = sumReceived(t.advances);
        row.push(
          NONE_TO_NULL(nameOf(t.eventType)), t.startDate, t.endDate,
          NONE_TO_NULL(nameOf(t.venueLocation)), NONE_TO_NULL(nameOf(t.subVenueLocation)),
          NONE_TO_NULL(nameOf(t.coordinator)),
          ...amountCells(t), got, Math.max((t.totalPayable || 0) - got, 0),
        );
      }
    }

    for (let k = 0; k < maxAdvances; k += 1) {
      const item = advanceLists[i][k];
      if (!item) {
        row.push(...blanks(ADVANCE_COLUMNS.length));
      } else {
        const { a, forLabel } = item;
        const got = Number(a.receivedAmount) > 0;
        row.push(
          forLabel, a.expectedAmount, a.advanceDate, got ? "Received" : "Pending",
          got ? a.receivedAmount : null, got ? a.receivedDate : null,
          a.modeOfPayment, NONE_TO_NULL(nameOf(a.givenBy)), NONE_TO_NULL(nameOf(a.collectedBy)),
          a.remarks,
        );
      }
    }
    return row;
  });

  const totals = blanks(columns.length);
  totals[0] = "Total";
  totals[16] = totalBooked;
  totals[17] = totalReceived;
  totals[18] = totalBalance;
  totals[19] = percent(totalReceived, totalBooked);

  const generated = dayjs(ctx.generatedAt || new Date()).format("DD MMM YYYY, hh:mm A");
  return {
    name: "Bookings",
    title: STATUS_TAB_LABELS[ctx.statusTab] || STATUS_TAB_LABELS.all,
    subtitle: [`${rows.length} bookings`, ...(ctx.filterLines || []), `Generated on ${generated}`].join("   |   "),
    columns,
    groups,
    rows,
    totals: rows.length ? totals : undefined,
    freezeColumns: 4,
  };
};

export const downloadBookingsExcel = async (events, ctx) => {
  const generatedAt = ctx.generatedAt || new Date();
  await downloadExcel({
    fileName: `Bookings_${(ctx.statusTab || "all").replace(/\W/g, "")}_${dayjs(generatedAt).format("YYYY-MM-DD")}`,
    sheets: [buildBookingsSheet(events, { ...ctx, generatedAt })],
  });
};
