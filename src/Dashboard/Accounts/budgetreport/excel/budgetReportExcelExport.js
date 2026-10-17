import dayjs from "dayjs";
import { downloadExcel } from "@/lib/excel/downloadExcel";
import { sanitizeSheetName } from "@/lib/excel/formats";
import { mapLimit } from "@/lib/async";
import { addUniverWorkbookSheets } from "@/lib/excel/univerToExcel";
import {
  getEventName,
  getTotalPayable,
  getBookingReceivedAmount,
} from "@/Dashboard/Accounts/clientBookings/clientBookingsUtils";
import {
  contactsOf,
  earliestStart,
  statusLabel,
} from "@/Dashboard/Accounts/clientBookings/export/bookingsReport";
import { buildBookingsSheet } from "@/Dashboard/Accounts/clientBookings/export/bookingsExcel";
import { fetchBudgetReportWorkbook } from "./budgetReportExcelApi";

const FETCH_CONCURRENCY = 3;

const SUMMARY_COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Event" },
  { header: "Client" },
  { header: "Contact" },
  { header: "Event Status" },
  { header: "First Event Date", type: "date" },
  { header: "Booked Amount", type: "money" },
  { header: "Received", type: "money" },
  { header: "Balance", type: "money" },
  { header: "Budget Report Created" },
  { header: "No. of Sheets", type: "number" },
  { header: "Budget Sheets In This File", wrap: true, width: 48 },
  { header: "Last Updated", type: "datetime" },
  { header: "Version", type: "number" },
];

const fileSafe = (text) =>
  String(text || "")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);

const sheetsOf = (workbookData) => {
  const sheets = workbookData?.sheets || {};
  const order = workbookData?.sheetOrder?.length ? workbookData.sheetOrder : Object.keys(sheets);
  return order.map((id) => sheets[id]).filter(Boolean);
};

/**
 * Tab names inside the combined file: "<n>. <client>" (plus " - <sheet>" when
 * the workbook has several sheets). The number prefix keeps them unique, so the
 * summary sheet can list them before the sheets are written.
 */
const labelFor = (n, client, sheet, multi) =>
  multi ? `${n}. ${client || "Event"} - ${sheet.name}` : `${n}. ${client || "Event"}`;

/** Downloads one event's budget workbook (every sheet) plus a one-row event sheet. */
export const downloadBudgetReportExcel = async ({ row, authHeaders }) => {
  const wb = await fetchBudgetReportWorkbook({ eventId: row.eventId, authHeaders });
  const label = [row.eventName, row.clientName].filter(Boolean).join(" - ") || row.eventId;
  const generatedAt = new Date();
  await downloadExcel({
    fileName: `Budget_Report_${fileSafe(label)}_${dayjs(generatedAt).format("YYYY-MM-DD")}`,
    sheets: row.event
      ? [{ ...buildBookingsSheet([row.event], { statusTab: "all", generatedAt }), name: "Event Details", title: `Event Details - ${label}` }]
      : [],
    extend: (workbook, usedNames) => {
      if (!wb.workbookData) throw new Error("No budget report has been created for this event yet");
      addUniverWorkbookSheets(workbook, wb.workbookData, { usedNames });
    },
  });
};

/**
 * Downloads every listed budget report in one file: a summary sheet (one row per
 * event), an Event Details sheet (one row per client with all booking details),
 * then each event's budget sheets.
 */
export const downloadAllBudgetReportsExcel = async ({ rows, authHeaders, onProgress }) => {
  let done = 0;
  const loaded = await mapLimit(rows, FETCH_CONCURRENCY, async (row) => {
    const wb = row.hasWorkbook
      ? await fetchBudgetReportWorkbook({ eventId: row.eventId, authHeaders })
      : null;
    done += 1;
    onProgress?.(done, rows.length);
    return wb;
  });

  const generatedAt = new Date();
  const summaryRows = rows.map((row, i) => {
    const ev = row.event;
    const sheets = sheetsOf(loaded[i]?.workbookData);
    const multi = sheets.length > 1;
    const booked = ev ? getTotalPayable(ev) : null;
    const received = ev ? getBookingReceivedAmount(ev) : null;
    return [
      i + 1,
      ev ? getEventName(ev.eventName) : row.eventName,
      row.clientName,
      ev ? contactsOf(ev) : null,
      ev ? statusLabel(ev.eventConfirmation) : null,
      ev && ev.eventTypes?.length ? new Date(earliestStart(ev)) : null,
      booked,
      received,
      ev ? Math.max(booked - received, 0) : null,
      sheets.length ? "Yes" : "No",
      sheets.length,
      sheets.map((s) => sanitizeSheetName(labelFor(i + 1, row.clientName, s, multi))).join("\n"),
      row.updatedAt,
      row.version,
    ];
  });

  const events = rows.map((r) => r.event).filter(Boolean);
  const details = events.length
    ? { ...buildBookingsSheet(events, { statusTab: "all", generatedAt }), name: "Event Details", title: "Event Details" }
    : null;

  await downloadExcel({
    fileName: `Budget_Reports_${dayjs(generatedAt).format("YYYY-MM-DD")}`,
    sheets: [
      {
        name: "Budget Reports",
        title: "Budget Reports",
        subtitle: `${rows.length} events   |   Generated on ${dayjs(generatedAt).format("DD MMM YYYY, hh:mm A")}`,
        columns: SUMMARY_COLUMNS,
        rows: summaryRows,
        freezeColumns: 3,
      },
      ...(details ? [details] : []),
    ],
    extend: (workbook, usedNames) => {
      loaded.forEach((wb, i) => {
        if (!wb?.workbookData) return;
        const multi = sheetsOf(wb.workbookData).length > 1;
        addUniverWorkbookSheets(workbook, wb.workbookData, {
          usedNames,
          labelFor: (sheet) => labelFor(i + 1, rows[i].clientName, sheet, multi),
        });
      });
    },
  });
};
