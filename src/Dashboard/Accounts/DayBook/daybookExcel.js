import dayjs from "dayjs";
import { downloadExcel } from "@/lib/excel/downloadExcel";
import { formatEventName, formatEventReference } from "./daybookUtils";

// The daybook API sends dates as "YYYY-MM-DD" strings. Parse them as local
// calendar days so the sheet shows the same date, not a shifted one.
const ymdToDate = (value) => {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : value;
};

const clean = (v) => (v === "-" || v === "" || v == null ? null : v);

const INFLOW_COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Received Date", type: "date" },
  { header: "Name", width: 28 },
  { header: "Source" },
  { header: "Received In" },
  { header: "Account" },
  { header: "Amount Received", type: "money" },
  { header: "Received By" },
  { header: "Event Reference", width: 30 },
  { header: "Note", wrap: true, width: 36 },
];

const OUTFLOW_COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Paid At", type: "datetime" },
  { header: "Purpose", wrap: true, width: 32 },
  { header: "Vendor" },
  { header: "Vendor Code" },
  { header: "Amount Paid", type: "money" },
  { header: "Status" },
  { header: "Entity Account" },
  { header: "Required Date", type: "datetime" },
  { header: "Paid To" },
  { header: "Client" },
  { header: "Event" },
  { header: "Group By" },
  { header: "Remarks", wrap: true, width: 36 },
];

const ACCOUNT_BASE_COLUMNS = [
  { header: "Date", type: "date" },
  { header: "Cash Opening", type: "money" },
  { header: "Cash Closing", type: "money" },
  { header: "Account Opening", type: "money" },
  { header: "Account Closing", type: "money" },
];
const ACCOUNT_GROUP_COLUMNS = [
  { header: "Account Name" },
  { header: "Opening", type: "money" },
  { header: "Closing", type: "money" },
];

// Older API responses return advance-shaped rows; map them to the unified shape.
const normalizeInflow = (r) => {
  const unified =
    r?.receivedDate !== undefined ||
    r?.receivedIn !== undefined ||
    r?.amountReceived !== undefined ||
    r?.receivedBy !== undefined;
  if (unified) return r;
  const adv = r?.advance || {};
  return {
    _id: r?._id,
    name: r?.client?.clientName,
    receivedDate: adv.receivedDate,
    receivedIn: String(adv.modeOfPayment || "").toUpperCase() === "ACCOUNT" ? "ACCOUNT" : "CASH",
    amountReceived: adv.receivedAmount,
    receivedBy: adv.collectedBy || adv.givenBy,
    eventReference: r?.event?.eventName?.name || r?.client?.clientName,
    note: adv.remarks,
  };
};

const isBookingAdvance = (r) => String(r?._id ?? "").startsWith("eventadvance:");

const eventParts = (ref) => {
  if (ref && typeof ref === "object") {
    return {
      client: clean(ref.clientName),
      event: clean(formatEventName(ref.eventName ?? ref.name)),
    };
  }
  return { client: null, event: clean(formatEventReference(ref)) };
};

const money = (n) => (n === null || n === undefined ? null : Number(n));

/**
 * Builds the Daybook workbook sheets (Summary, Inflow, Outflow, Accounts) from a
 * GET /daybook response. Pure; returns sheet specs for downloadExcel.
 */
export const buildDaybookSheets = (daybook, ctx = {}) => {
  const inflowRows = (daybook?.inflow?.data || []).map(normalizeInflow);
  const outflowRows = daybook?.outflow?.data || [];
  const balances = daybook?.accounts?.openCloseBalances || [];

  const generated = dayjs(ctx.generatedAt || new Date()).format("DD MMM YYYY, hh:mm A");
  const period = ctx.periodLabel || "";
  const sub = (...parts) => [period && `Period: ${period}`, ...parts, `Generated on ${generated}`].filter(Boolean).join("   |   ");

  const inflowTotal = Number(daybook?.inflow?.total) || 0;
  const inflowCount = Number(daybook?.inflow?.count) || inflowRows.length;
  const outflowTotal = Number(daybook?.outflow?.total) || 0;
  const outflowCount = Number(daybook?.outflow?.count) || outflowRows.length;
  const pl = daybook?.profitAndLoss || {};
  const net = pl.value != null ? Number(pl.value) : inflowTotal - outflowTotal;
  const netType = String(pl.type || (net >= 0 ? "PROFIT" : "LOSS")).toUpperCase();

  const summaryRows = [
    ["Total inflow", inflowTotal, inflowCount],
    ["Total outflow", outflowTotal, outflowCount],
    [`Net ${netType === "LOSS" ? "loss" : "profit"}`, net, null],
  ];
  // Cash/account split is only exact when every inflow row was returned.
  if (inflowRows.length === inflowCount && inflowRows.length > 0) {
    const sumBy = (mode) =>
      inflowRows
        .filter((r) => String(r.receivedIn || "").toUpperCase() === mode)
        .reduce((s, r) => s + (Number(r.amountReceived) || 0), 0);
    const countBy = (mode) =>
      inflowRows.filter((r) => String(r.receivedIn || "").toUpperCase() === mode).length;
    summaryRows.splice(
      1,
      0,
      ["   of which received in cash", sumBy("CASH"), countBy("CASH")],
      ["   of which received in account", sumBy("ACCOUNT"), countBy("ACCOUNT")],
    );
  }

  const sheets = [
    {
      name: "Summary",
      title: "Daybook Summary",
      subtitle: sub(),
      columns: [
        { header: "Particulars", width: 34 },
        { header: "Amount", type: "money", width: 20 },
        { header: "Count", type: "number", width: 10 },
      ],
      rows: summaryRows,
    },
  ];

  if (inflowRows.length) {
    const truncated = inflowCount > inflowRows.length;
    sheets.push({
      name: "Inflow",
      title: "Inflow",
      subtitle: sub(
        truncated
          ? `Showing the latest ${inflowRows.length} of ${inflowCount} inflow entries`
          : `${inflowRows.length} entries`,
      ),
      columns: INFLOW_COLUMNS,
      rows: inflowRows.map((r, i) => {
        const receivedIn = String(r.receivedIn || "").toUpperCase();
        return [
          i + 1,
          ymdToDate(r.receivedDate),
          r.name,
          isBookingAdvance(r) ? "Booking advance" : "Manual entry",
          receivedIn,
          receivedIn === "ACCOUNT" ? r.accountName : null,
          money(r.amountReceived),
          r.receivedBy,
          clean(formatEventReference(r.eventReference)),
          r.note,
        ];
      }),
      totals: truncated
        ? undefined
        : ["Total", null, null, null, null, null, inflowRows.reduce((s, r) => s + (Number(r.amountReceived) || 0), 0), null, null, null],
      freezeColumns: 3,
    });
  }

  if (outflowRows.length) {
    const truncated = outflowCount > outflowRows.length;
    sheets.push({
      name: "Outflow",
      title: "Outflow",
      subtitle: sub(
        truncated
          ? `Showing the latest ${outflowRows.length} of ${outflowCount} outflow entries`
          : `${outflowRows.length} entries`,
      ),
      columns: OUTFLOW_COLUMNS,
      rows: outflowRows.map((r, i) => {
        const { client, event } = eventParts(r.eventReference);
        return [
          i + 1,
          r.paidAt,
          r.purpose,
          r.vendor?.name,
          r.vendor?.vendor_code,
          money(r.amountPaid),
          String(r.status || "").toUpperCase() || null,
          r.entityAccount,
          r.requiredDate,
          clean(typeof r.amountPaidTo === "string" ? r.amountPaidTo : r.amountPaidTo?.name),
          client,
          event,
          r.groupBy?.name,
          r.remarks,
        ];
      }),
      totals: truncated
        ? undefined
        : ["Total", null, null, null, null, outflowRows.reduce((s, r) => s + (Number(r.amountPaid) || 0), 0), null, null, null, null, null, null, null, null],
      freezeColumns: 3,
    });
  }

  if (balances.length) {
    const maxAccounts = Math.max(0, ...balances.map((b) => (b.accountBalances || []).length));
    const columns = [...ACCOUNT_BASE_COLUMNS];
    const groups = [{ label: "Daily Balances", from: 0, to: ACCOUNT_BASE_COLUMNS.length - 1 }];
    for (let k = 1; k <= maxAccounts; k += 1) {
      groups.push({ label: `Account ${k}`, from: columns.length, to: columns.length + ACCOUNT_GROUP_COLUMNS.length - 1 });
      columns.push(...ACCOUNT_GROUP_COLUMNS);
    }
    sheets.push({
      name: "Accounts",
      title: "Account Open / Close Balances",
      subtitle: sub(`${balances.length} records`),
      columns,
      groups: maxAccounts ? groups : [],
      rows: balances.map((b) => {
        const row = [
          ymdToDate(b.balanceDate),
          money(b.cashOpeningBalance),
          money(b.cashClosingBalance),
          money(b.accountOpeningBalance),
          money(b.accountClosingBalance),
        ];
        for (let k = 0; k < maxAccounts; k += 1) {
          const a = (b.accountBalances || [])[k];
          row.push(...(a ? [a.accountName, money(a.openingBalance), money(a.closingBalance)] : [null, null, null]));
        }
        return row;
      }),
      freezeColumns: 1,
    });
  }

  return sheets;
};

export const downloadDaybookExcel = async (daybook, { startDate, endDate }) => {
  const generatedAt = new Date();
  const same = startDate === endDate;
  const fmt = (d) => dayjs(d).format("DD MMM YYYY");
  await downloadExcel({
    fileName: same ? `Daybook_${startDate}` : `Daybook_${startDate}_to_${endDate}`,
    sheets: buildDaybookSheets(daybook, {
      generatedAt,
      periodLabel: same ? fmt(startDate) : `${fmt(startDate)} to ${fmt(endDate)}`,
    }),
  });
};
