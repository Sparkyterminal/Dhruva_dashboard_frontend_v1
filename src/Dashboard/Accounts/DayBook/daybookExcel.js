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

const toYmd = (value) => {
  if (!value) return null;
  const m = /^(\d{4}-\d{2}-\d{2})$/.exec(String(value));
  if (m) return m[1];
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
};

const clean = (v) => (v === "-" || v === "" || v == null ? null : v);
const money = (n) => (n === null || n === undefined ? null : Number(n));
const num = (n) => Number(n) || 0;

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

const DAY_WISE_COLUMNS = [
  { header: "Date", type: "date" },
  { header: "Day", width: 12 },
  { header: "Inflow", type: "money" },
  { header: "Cash Inflow", type: "money" },
  { header: "Account Inflow", type: "money" },
  { header: "Outflow", type: "money" },
  { header: "Net (Inflow - Outflow)", type: "money" },
  { header: "Inflow Entries", type: "number" },
  { header: "Outflow Entries", type: "number" },
  { header: "Cash Opening", type: "money" },
  { header: "Cash Closing", type: "money" },
  { header: "Account Opening", type: "money" },
  { header: "Account Closing", type: "money" },
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
const isAccount = (r) => String(r.receivedIn || "").toUpperCase() === "ACCOUNT";

const eventParts = (ref) => {
  if (ref && typeof ref === "object") {
    return {
      client: clean(ref.clientName),
      event: clean(formatEventName(ref.eventName ?? ref.name)),
    };
  }
  return { client: null, event: clean(formatEventReference(ref)) };
};

// Oldest first, like a ledger. Rows without a date go last.
const byDate = (getKey) => (a, b) => {
  const ka = getKey(a) || "9999-99-99";
  const kb = getKey(b) || "9999-99-99";
  return ka < kb ? -1 : ka > kb ? 1 : 0;
};
const outflowDay = (r) => toYmd(r.paidAt);

const buildDayWiseSheet = (inflowRows, outflowRows, balances, sub, truncated) => {
  const days = new Map();
  const dayOf = (key) => {
    if (!days.has(key)) {
      days.set(key, { inflow: 0, cash: 0, account: 0, inflowN: 0, outflow: 0, outflowN: 0, balance: null });
    }
    return days.get(key);
  };
  inflowRows.forEach((r) => {
    const d = dayOf(toYmd(r.receivedDate) || "none");
    const amount = num(r.amountReceived);
    d.inflow += amount;
    d.inflowN += 1;
    if (isAccount(r)) d.account += amount;
    else d.cash += amount;
  });
  outflowRows.forEach((r) => {
    const d = dayOf(outflowDay(r) || "none");
    d.outflow += num(r.amountPaid);
    d.outflowN += 1;
  });
  balances.forEach((b) => {
    dayOf(toYmd(b.balanceDate) || "none").balance = b;
  });

  const keys = [...days.keys()].sort((a, b) => (a === "none" ? 1 : b === "none" ? -1 : a < b ? -1 : 1));
  const totals = { inflow: 0, cash: 0, account: 0, outflow: 0, inflowN: 0, outflowN: 0 };
  const rows = keys.map((k) => {
    const d = days.get(k);
    Object.keys(totals).forEach((t) => {
      totals[t] += d[t];
    });
    const date = k === "none" ? null : ymdToDate(k);
    const b = d.balance;
    return [
      date,
      k === "none" ? "No date" : dayjs(date).format("dddd"),
      d.inflow,
      d.cash,
      d.account,
      d.outflow,
      d.inflow - d.outflow,
      d.inflowN,
      d.outflowN,
      money(b?.cashOpeningBalance),
      money(b?.cashClosingBalance),
      money(b?.accountOpeningBalance),
      money(b?.accountClosingBalance),
    ];
  });

  return {
    name: "Day Wise",
    title: "Day Wise Daybook",
    subtitle: sub(
      `${rows.length} days with entries`,
      truncated ? "Some entries were not returned by the server, so day totals may be incomplete" : null,
    ),
    columns: DAY_WISE_COLUMNS,
    rows,
    totals: [
      "Total", null, totals.inflow, totals.cash, totals.account, totals.outflow,
      totals.inflow - totals.outflow, totals.inflowN, totals.outflowN, null, null, null, null,
    ],
    freezeColumns: 2,
  };
};

/**
 * Builds the Daybook workbook sheets from a daybook response (whole period, same
 * shape as GET /daybook). `ctx.mode` picks the first sheet:
 *   "overall"  -> Summary (period totals)
 *   "daywise"  -> Day Wise (one row per day)
 * followed by Inflow, Outflow and Accounts detail sheets. Pure.
 */
export const buildDaybookSheets = (daybook, ctx = {}) => {
  const inflowRows = (daybook?.inflow?.data || [])
    .map(normalizeInflow)
    .sort(byDate((r) => toYmd(r.receivedDate)));
  const outflowRows = [...(daybook?.outflow?.data || [])].sort(byDate(outflowDay));
  const balances = [...(daybook?.accounts?.openCloseBalances || [])].sort(
    byDate((b) => toYmd(b.balanceDate)),
  );

  const generated = dayjs(ctx.generatedAt || new Date()).format("DD MMM YYYY, hh:mm A");
  const period = ctx.periodLabel || "";
  const sub = (...parts) =>
    [period && `Period: ${period}`, ...parts, `Generated on ${generated}`].filter(Boolean).join("   |   ");

  const inflowTotal = num(daybook?.inflow?.total);
  const inflowCount = num(daybook?.inflow?.count) || inflowRows.length;
  const outflowTotal = num(daybook?.outflow?.total);
  const outflowCount = num(daybook?.outflow?.count) || outflowRows.length;
  const pl = daybook?.profitAndLoss || {};
  const net = pl.value != null ? Number(pl.value) : inflowTotal - outflowTotal;
  const netType = String(pl.type || (net >= 0 ? "PROFIT" : "LOSS")).toUpperCase();
  const truncated = Boolean(daybook?.truncated) || inflowCount > inflowRows.length || outflowCount > outflowRows.length;

  const sheets = [];

  if (ctx.mode === "daywise") {
    sheets.push(buildDayWiseSheet(inflowRows, outflowRows, balances, sub, truncated));
  } else {
    const summaryRows = [
      ["Total inflow", inflowTotal, inflowCount],
      ["Total outflow", outflowTotal, outflowCount],
      [`Net ${netType === "LOSS" ? "loss" : "profit"}`, net, null],
    ];
    // The cash/account split is only exact when every inflow row was returned.
    if (!truncated && inflowRows.length > 0) {
      const sumBy = (wantAccount) =>
        inflowRows.filter((r) => isAccount(r) === wantAccount).reduce((s, r) => s + num(r.amountReceived), 0);
      const countBy = (wantAccount) => inflowRows.filter((r) => isAccount(r) === wantAccount).length;
      summaryRows.splice(
        1,
        0,
        ["   of which received in cash", sumBy(false), countBy(false)],
        ["   of which received in account", sumBy(true), countBy(true)],
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
      rows: summaryRows,
    });
  }

  if (inflowRows.length) {
    const partial = inflowCount > inflowRows.length;
    sheets.push({
      name: "Inflow",
      title: "Inflow",
      subtitle: sub(
        partial
          ? `Showing ${inflowRows.length} of ${inflowCount} inflow entries`
          : `${inflowRows.length} entries`,
      ),
      columns: INFLOW_COLUMNS,
      rows: inflowRows.map((r, i) => [
        i + 1,
        ymdToDate(r.receivedDate),
        r.name,
        isBookingAdvance(r) ? "Booking advance" : "Manual entry",
        String(r.receivedIn || "").toUpperCase(),
        isAccount(r) ? r.accountName : null,
        money(r.amountReceived),
        r.receivedBy,
        clean(formatEventReference(r.eventReference)),
        r.note,
      ]),
      totals: partial
        ? undefined
        : ["Total", null, null, null, null, null, inflowRows.reduce((s, r) => s + num(r.amountReceived), 0), null, null, null],
      freezeColumns: 3,
    });
  }

  if (outflowRows.length) {
    const partial = outflowCount > outflowRows.length;
    sheets.push({
      name: "Outflow",
      title: "Outflow",
      subtitle: sub(
        partial
          ? `Showing ${outflowRows.length} of ${outflowCount} outflow entries`
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
      totals: partial
        ? undefined
        : ["Total", null, null, null, null, outflowRows.reduce((s, r) => s + num(r.amountPaid), 0), null, null, null, null, null, null, null, null],
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
