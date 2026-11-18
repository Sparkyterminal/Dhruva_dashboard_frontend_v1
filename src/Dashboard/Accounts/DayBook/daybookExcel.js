import dayjs from "dayjs";
import { downloadExcel } from "@/lib/excel/downloadExcel";
import { round2 } from "./daybookMath";
import { formatEventReference } from "./daybookUtils";

// The daybook API sends dates as "YYYY-MM-DD" strings. Parse them as local
// calendar days so the sheet shows the same date, not a shifted one.
const ymdToDate = (value) => {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : value;
};

const toYmd = (value) => {
  if (!value) return null;
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(value));
  if (m) return m[1];
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
};

const clean = (v) => (v === "-" || v === "" || v == null ? null : v);
const num = (n) => Number(n) || 0;
const sum = (rows, pick) => round2(rows.reduce((t, r) => t + num(pick(r)), 0));
const isAccount = (mode) => String(mode || "").toUpperCase() === "ACCOUNT";

const INFLOW_COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Received On", type: "date" },
  { header: "Client", width: 28 },
  { header: "Event Date", type: "date" },
  { header: "Event Reference", width: 30 },
  { header: "Received In" },
  { header: "Account", width: 30 },
  { header: "Amount Received", type: "money" },
  { header: "GST", type: "money" },
  { header: "TDS", type: "money" },
  { header: "Net Received", type: "money" },
  { header: "Note", wrap: true, width: 36 },
];

const OUTFLOW_COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Paid On", type: "date" },
  { header: "Vendor", width: 28 },
  { header: "Vendor Code" },
  { header: "Paid From" },
  { header: "Account", width: 30 },
  { header: "Amount Paid", type: "money" },
  { header: "TDS", type: "money" },
  { header: "GST", type: "money" },
  { header: "Actual Paid", type: "money" },
  { header: "Note", wrap: true, width: 36 },
];

const BALANCE_COLUMNS = [
  { header: "Date", type: "date" },
  { header: "Account", width: 32 },
  { header: "Opening", type: "money" },
  { header: "Net Inflow", type: "money" },
  { header: "Actual Outflow", type: "money" },
  { header: "Closing", type: "money" },
];

const DAY_WISE_COLUMNS = [
  { header: "Date", type: "date" },
  { header: "Day", width: 12 },
  { header: "Net Inflow", type: "money" },
  { header: "Cash Net Inflow", type: "money" },
  { header: "Account Net Inflow", type: "money" },
  { header: "Actual Outflow", type: "money" },
  { header: "Surplus / Deficit", type: "money" },
  { header: "Inflow Entries", type: "number" },
  { header: "Outflow Entries", type: "number" },
  { header: "Cash Opening", type: "money" },
  { header: "Cash Closing", type: "money" },
  { header: "Bank Opening", type: "money" },
  { header: "Bank Closing", type: "money" },
  { header: "Total Closing", type: "money" },
];

// Oldest first, like a ledger. Rows without a date go last.
const byDate = (getKey) => (a, b) => {
  const ka = getKey(a) || "9999-99-99";
  const kb = getKey(b) || "9999-99-99";
  return ka < kb ? -1 : ka > kb ? 1 : 0;
};

const bankSum = (day, key) => round2((day?.accounts || []).reduce((t, a) => t + num(a[key]), 0));

const buildDayWiseSheet = (inflowRows, outflowRows, days, sub, truncated) => {
  const map = new Map();
  const dayOf = (key) => {
    if (!map.has(key)) {
      map.set(key, { inflow: 0, cash: 0, account: 0, inflowN: 0, outflow: 0, outflowN: 0, balance: null });
    }
    return map.get(key);
  };
  inflowRows.forEach((r) => {
    const d = dayOf(toYmd(r.receivedDate) || "none");
    const net = num(r.netAmountReceived);
    d.inflow += net;
    d.inflowN += 1;
    if (isAccount(r.receivedIn)) d.account += net;
    else d.cash += net;
  });
  outflowRows.forEach((r) => {
    const d = dayOf(toYmd(r.paidDate) || "none");
    d.outflow += num(r.actualAmountPaid);
    d.outflowN += 1;
  });
  days.forEach((b) => {
    dayOf(toYmd(b.date) || "none").balance = b;
  });

  const keys = [...map.keys()].sort((a, b) => (a === "none" ? 1 : b === "none" ? -1 : a < b ? -1 : 1));
  const totals = { inflow: 0, cash: 0, account: 0, outflow: 0, inflowN: 0, outflowN: 0 };
  const rows = keys.map((k) => {
    const d = map.get(k);
    Object.keys(totals).forEach((t) => {
      totals[t] += d[t];
    });
    const date = k === "none" ? null : ymdToDate(k);
    const b = d.balance;
    return [
      date,
      k === "none" ? "No date" : dayjs(date).format("dddd"),
      round2(d.inflow),
      round2(d.cash),
      round2(d.account),
      round2(d.outflow),
      round2(d.inflow - d.outflow),
      d.inflowN,
      d.outflowN,
      b ? num(b.cash?.opening) : null,
      b ? num(b.cash?.closing) : null,
      b ? bankSum(b, "opening") : null,
      b ? bankSum(b, "closing") : null,
      b ? num(b.totals?.closing) : null,
    ];
  });

  return {
    name: "Day Wise",
    title: "Day Wise Daybook",
    subtitle: sub(
      `${rows.length} days`,
      truncated ? "Some entries were not returned by the server, so day totals may be incomplete" : null,
    ),
    columns: DAY_WISE_COLUMNS,
    rows,
    totals: [
      "Total", null, round2(totals.inflow), round2(totals.cash), round2(totals.account), round2(totals.outflow),
      round2(totals.inflow - totals.outflow), totals.inflowN, totals.outflowN, null, null, null, null, null,
    ],
    freezeColumns: 2,
  };
};

/**
 * Builds the Daybook workbook sheets from a daybook response (whole period, same
 * shape as GET /daybook). `ctx.mode` picks the first sheet:
 *   "overall"  -> Summary (period totals)
 *   "daywise"  -> Day Wise (one row per day)
 * followed by Inflow, Outflow and Balances detail sheets. Pure.
 */
export const buildDaybookSheets = (daybook, ctx = {}) => {
  const inflowRows = [...(daybook?.inflow?.data || [])].sort(byDate((r) => toYmd(r.receivedDate)));
  const outflowRows = [...(daybook?.outflow?.data || [])].sort(byDate((r) => toYmd(r.paidDate)));
  const days = [...(daybook?.balances?.days || [])].sort(byDate((b) => toYmd(b.date)));

  const generated = dayjs(ctx.generatedAt || new Date()).format("DD MMM YYYY, hh:mm A");
  const period = ctx.periodLabel || "";
  const sub = (...parts) =>
    [period && `Period: ${period}`, ...parts, `Generated on ${generated}`].filter(Boolean).join("   |   ");

  const inflowCount = num(daybook?.inflow?.count) || inflowRows.length;
  const outflowCount = num(daybook?.outflow?.count) || outflowRows.length;
  const truncated =
    Boolean(daybook?.truncated) || inflowCount > inflowRows.length || outflowCount > outflowRows.length;
  const it = daybook?.inflow?.totals || {};
  const ot = daybook?.outflow?.totals || {};
  const surplus = daybook?.surplusDeficit?.value != null
    ? num(daybook.surplusDeficit.value)
    : round2(num(it.net) - num(ot.actual));
  const isDeficit = surplus < 0;

  const sheets = [];

  if (ctx.mode === "daywise") {
    sheets.push(buildDayWiseSheet(inflowRows, outflowRows, days, sub, truncated));
  } else {
    const first = days[0];
    const last = days[days.length - 1];
    const rows = [
      ["Inflow: amount received", num(it.gross), inflowCount],
      ["Inflow: GST", num(it.gst), null],
      ["Inflow: TDS", num(it.tds), null],
      ["Inflow: net received", num(it.net), inflowCount],
      ["Outflow: amount paid", num(ot.amountPaid), outflowCount],
      ["Outflow: TDS", num(ot.tds), null],
      ["Outflow: GST", num(ot.gst), null],
      ["Outflow: actual paid", num(ot.actual), outflowCount],
      [isDeficit ? "Deficit" : "Surplus", Math.abs(surplus), null],
    ];
    if (first && last) {
      rows.push(
        ["Opening balance (first day)", num(first.totals?.opening), null],
        ["Closing balance (last day)", num(last.totals?.closing), null],
      );
    }
    sheets.push({
      name: "Summary",
      title: "Daybook Summary",
      subtitle: sub(truncated ? "Some entries were not returned by the server, so listed rows may be incomplete" : null),
      columns: [
        { header: "Particulars", width: 34 },
        { header: "Amount", type: "money", width: 20 },
        { header: "Count", type: "number", width: 10 },
      ],
      rows,
    });
  }

  if (inflowRows.length) {
    const partial = inflowCount > inflowRows.length;
    sheets.push({
      name: "Inflow",
      title: "Inflow",
      subtitle: sub(
        partial ? `Showing ${inflowRows.length} of ${inflowCount} inflow entries` : `${inflowRows.length} entries`,
      ),
      columns: INFLOW_COLUMNS,
      rows: inflowRows.map((r, i) => [
        i + 1,
        ymdToDate(r.receivedDate),
        r.clientName,
        ymdToDate(r.eventDate),
        clean(formatEventReference(r.eventReference)),
        isAccount(r.receivedIn) ? "Account" : "Cash",
        isAccount(r.receivedIn) ? r.accountName : null,
        num(r.amountReceived),
        num(r.gstAmount),
        num(r.tdsAmount),
        num(r.netAmountReceived),
        r.note,
      ]),
      totals: partial
        ? undefined
        : [
            "Total", null, null, null, null, null, null,
            sum(inflowRows, (r) => r.amountReceived),
            sum(inflowRows, (r) => r.gstAmount),
            sum(inflowRows, (r) => r.tdsAmount),
            sum(inflowRows, (r) => r.netAmountReceived),
            null,
          ],
      freezeColumns: 3,
    });
  }

  if (outflowRows.length) {
    const partial = outflowCount > outflowRows.length;
    sheets.push({
      name: "Outflow",
      title: "Outflow",
      subtitle: sub(
        partial ? `Showing ${outflowRows.length} of ${outflowCount} outflow entries` : `${outflowRows.length} entries`,
      ),
      columns: OUTFLOW_COLUMNS,
      rows: outflowRows.map((r, i) => [
        i + 1,
        ymdToDate(r.paidDate),
        r.vendor?.name,
        r.vendor?.vendor_code ? String(r.vendor.vendor_code).toUpperCase() : null,
        isAccount(r.paidFrom) ? "Account" : "Cash",
        isAccount(r.paidFrom) ? r.accountName : null,
        num(r.amountPaid),
        num(r.tdsAmount),
        num(r.gstAmount),
        num(r.actualAmountPaid),
        r.note,
      ]),
      totals: partial
        ? undefined
        : [
            "Total", null, null, null, null, null,
            sum(outflowRows, (r) => r.amountPaid),
            sum(outflowRows, (r) => r.tdsAmount),
            sum(outflowRows, (r) => r.gstAmount),
            sum(outflowRows, (r) => r.actualAmountPaid),
            null,
          ],
      freezeColumns: 3,
    });
  }

  if (days.length) {
    const rows = days.flatMap((day) =>
      [{ accountName: "Cash", ...day.cash }, ...(day.accounts || [])].map((a) => [
        ymdToDate(day.date),
        a.accountName,
        num(a.opening),
        num(a.inflow),
        num(a.outflow),
        num(a.closing),
      ]),
    );
    sheets.push({
      name: "Balances",
      title: "Daily Balances",
      subtitle: sub(`${days.length} days, calculated automatically (closing balance carries forward as the next opening)`),
      columns: BALANCE_COLUMNS,
      rows,
      freezeColumns: 2,
    });
  }

  return sheets;
};

const fmt = (d) => dayjs(d).format("DD MMM YYYY");

/**
 * @param {object} daybook response from fetchDaybookAll
 * @param {{ mode: "overall" | "daywise", startDate: string, endDate: string }} opts
 */
export const downloadDaybookExcel = async (daybook, { mode, startDate, endDate }) => {
  const overall = mode !== "daywise";
  const same = startDate === endDate;
  await downloadExcel({
    fileName: overall
      ? `Daybook_Overall_till_${endDate}`
      : same
        ? `Daybook_DayWise_${startDate}`
        : `Daybook_DayWise_${startDate}_to_${endDate}`,
    sheets: buildDaybookSheets(daybook, {
      mode: overall ? "overall" : "daywise",
      generatedAt: new Date(),
      periodLabel: overall
        ? `Overall, till ${fmt(endDate)}`
        : same
          ? fmt(startDate)
          : `${fmt(startDate)} to ${fmt(endDate)}`,
    }),
  });
};
