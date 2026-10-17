import dayjs from "dayjs";
import { downloadExcel } from "@/lib/excel/downloadExcel";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const BASE_COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Bill Name" },
  { header: "Belongs To" },
  { header: "EMI Type" },
  { header: "Frequency" },
  { header: "EMI Date", type: "date" },
  { header: "EMI End Date", type: "date" },
  { header: "Amount", type: "money" },
  { header: "Current Status" },
  { header: "Months Recorded", type: "number" },
  { header: "Months Paid", type: "number" },
  { header: "Total Paid", type: "money" },
  { header: "Total Pending", type: "money" },
  { header: "Created At", type: "date" },
  { header: "Last Updated", type: "date" },
];

const MONTH_COLUMNS = [
  { header: "Month" },
  { header: "EMI Amount", type: "money" },
  { header: "Status" },
  { header: "Amount Paid", type: "money" },
  { header: "Pending", type: "money" },
  { header: "Payment Mode" },
  { header: "Payment Date", type: "date" },
  { header: "Remarks", wrap: true, width: 24 },
];

// Same month window the Bills screen shows: up to the EMI end date, but never
// more than 12 months ahead.
const monthsOf = (bill, now) => {
  const emiEnd = new Date(bill.emi_end_date);
  const horizon = new Date(now.getFullYear(), now.getMonth() + 12, 1);
  const endDate = emiEnd < horizon ? emiEnd : horizon;
  return (bill.emiStatus || [])
    .filter((s) => new Date(s.year, s.month - 1, 1) <= endDate)
    .map((s) => {
      const amount = s.emiAmount || bill.defaultAmount || 0;
      const paidAmount = Number(s.amountPaid) || 0;
      return {
        label: `${MONTHS[s.month - 1] || s.month} ${s.year}`,
        sort: s.year * 12 + s.month,
        amount,
        paid: Boolean(s.paid),
        paidAmount,
        pending: Math.max(amount - paidAmount, 0),
        mode: s.paymentMode,
        date: s.paymentDate,
        remarks: s.remarks,
      };
    })
    .sort((a, b) => a.sort - b.sort);
};

// Mirrors the status chip on the Bills screen (closed / paid / overdue / pending).
const currentStatus = (bill, now) => {
  if (now > new Date(bill.emi_end_date)) return "Closed";
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (bill.emiStatus?.some((s) => s.month === month && s.year === year && s.paid)) return "Paid";
  const emiDay = new Date(bill.emiDate).getDate();
  return now > new Date(year, now.getMonth(), emiDay) ? "Overdue" : "Pending";
};

/** One row per bill, with its month-by-month EMI history laid out in column groups. */
export const buildBillsSheet = (bills, ctx = {}) => {
  const now = ctx.now || new Date();
  const monthLists = bills.map((b) => monthsOf(b, now));
  const maxMonths = Math.max(0, ...monthLists.map((l) => l.length));

  const columns = [...BASE_COLUMNS];
  const groups = [{ label: "Bill", from: 0, to: BASE_COLUMNS.length - 1 }];
  for (let k = 1; k <= maxMonths; k += 1) {
    groups.push({ label: `EMI ${k}`, from: columns.length, to: columns.length + MONTH_COLUMNS.length - 1 });
    columns.push(...MONTH_COLUMNS);
  }

  let grandPaid = 0;
  let grandPending = 0;
  const rows = bills.map((b, i) => {
    const months = monthLists[i];
    const paid = months.reduce((s, m) => s + m.paidAmount, 0);
    const pending = months.reduce((s, m) => s + m.pending, 0);
    grandPaid += paid;
    grandPending += pending;
    const row = [
      i + 1, b.name, b.belongs_to, b.emiType, b.frequency, b.emiDate, b.emi_end_date,
      b.defaultAmount, currentStatus(b, now), months.length,
      months.filter((m) => m.paid).length, paid, pending, b.createdAt, b.updatedAt,
    ];
    for (let k = 0; k < maxMonths; k += 1) {
      const m = months[k];
      row.push(
        ...(m
          ? [m.label, m.amount, m.paid ? "Paid" : "Pending", m.paidAmount, m.pending, m.mode, m.paid ? m.date : null, m.remarks]
          : Array(MONTH_COLUMNS.length).fill(null)),
      );
    }
    return row;
  });

  const totals = Array(columns.length).fill(null);
  totals[0] = "Total";
  totals[11] = grandPaid;
  totals[12] = grandPending;

  const generated = dayjs(ctx.generatedAt || now).format("DD MMM YYYY, hh:mm A");
  return {
    name: "Bills",
    title: "Bills",
    subtitle: [`${rows.length} bills`, ...(ctx.filterLines || []), `Generated on ${generated}`].join("   |   "),
    columns,
    groups,
    rows,
    totals: rows.length ? totals : undefined,
    freezeColumns: 2,
  };
};

export const downloadBillsExcel = async (bills, ctx = {}) => {
  const generatedAt = ctx.generatedAt || new Date();
  await downloadExcel({
    fileName: `Bills_${dayjs(generatedAt).format("YYYY-MM-DD")}`,
    sheets: [buildBillsSheet(bills, { ...ctx, generatedAt })],
  });
};
