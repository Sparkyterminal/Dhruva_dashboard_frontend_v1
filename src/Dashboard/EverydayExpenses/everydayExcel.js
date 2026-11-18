import dayjs from "dayjs";
import { downloadExcel } from "@/lib/excel/downloadExcel";
import { round2 } from "./everydayRules";

// Dates arrive as "YYYY-MM-DD" strings. Parse them as local calendar days so the sheet shows the same date.
const ymdToDate = (value) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

const num = (v) => Number(v) || 0;
const STATUS_TEXT = { SUBMITTED: "Pending repayment", REJECTED: "Rejected", REPAID: "Repaid" };

const PERSON_COLUMNS = [
  { header: "Person", width: 28 },
  { header: "Department", width: 22 },
  { header: "Entries", type: "number" },
  { header: "Spent", type: "money" },
  { header: "Reimbursable", type: "money" },
  { header: "Repaid", type: "money" },
  { header: "Pending repayment", type: "money" },
];

const EXPENSE_COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Date", type: "date" },
  { header: "Person", width: 26 },
  { header: "Department", width: 20 },
  { header: "Group", width: 18 },
  { header: "Category", width: 24 },
  { header: "Spent", type: "money" },
  { header: "Units", type: "number" },
  { header: "Reimbursable", type: "money" },
  { header: "How it was worked out", wrap: true, width: 36 },
  { header: "Bills", type: "number" },
  { header: "Status" },
  { header: "Repaid on", type: "date" },
  { header: "Repaid how" },
  { header: "Reference" },
  { header: "Rejection reason", wrap: true, width: 30 },
  { header: "Note", wrap: true, width: 36 },
];

/**
 * Builds the sheets from an overview response (all pages joined): one row per person with totals,
 * and one row per expense. Pure.
 */
export const buildExpenseSheets = (data, ctx = {}) => {
  const expenses = [...(data?.expenses || [])].sort((a, b) =>
    a.expenseDate === b.expenseDate ? String(a.userName).localeCompare(String(b.userName)) : a.expenseDate < b.expenseDate ? -1 : 1,
  );
  const generated = dayjs(ctx.generatedAt || new Date()).format("DD MMM YYYY, hh:mm A");
  const sub = (...parts) => [ctx.periodLabel && `Period: ${ctx.periodLabel}`, ...parts, `Generated on ${generated}`].filter(Boolean).join("   |   ");

  const people = (data?.byPerson || []).map((p) => {
    const dept = expenses.find((e) => e.userId === p.userId)?.departments?.join(", ") || null;
    return [p.name, dept, num(p.count), num(p.spent), num(p.reimbursable), num(p.repaid), num(p.pending)];
  });
  const sum = (i) => round2(people.reduce((t, r) => t + num(r[i]), 0));

  return [
    {
      name: "By person",
      title: "Everyday Expenses — by person",
      subtitle: sub(`${people.length} people`),
      columns: PERSON_COLUMNS,
      rows: people,
      totals: ["Total", null, people.reduce((t, r) => t + num(r[2]), 0), sum(3), sum(4), sum(5), sum(6)],
      freezeColumns: 1,
    },
    {
      name: "Expenses",
      title: "Everyday Expenses — every entry",
      subtitle: sub(`${expenses.length} entries`),
      columns: EXPENSE_COLUMNS,
      rows: expenses.map((e, i) => [
        i + 1,
        ymdToDate(e.expenseDate),
        e.userName,
        (e.departments || []).join(", ") || null,
        e.categorySnapshot?.group || null,
        e.categorySnapshot?.name || null,
        e.amount == null || e.amount === "" ? null : num(e.amount),
        e.units == null || e.units === "" ? null : num(e.units),
        num(e.reimbursable),
        e.cappedBy || null,
        (e.bills || []).length,
        STATUS_TEXT[e.status] || e.status,
        ymdToDate(e.repayment?.date),
        e.repayment?.mode || null,
        e.repayment?.reference || null,
        e.rejection?.reason || null,
        e.note || null,
      ]),
      freezeColumns: 3,
    },
  ];
};

export const downloadExpensesExcel = async (data, { startDate, endDate }) => {
  const fmt = (d) => dayjs(d).format("DD MMM YYYY");
  const period = startDate && endDate ? `${fmt(startDate)} to ${fmt(endDate)}` : "All dates";
  await downloadExcel({
    fileName: `Everyday_Expenses_${startDate || "all"}_to_${endDate || "all"}`,
    sheets: buildExpenseSheets(data, { generatedAt: new Date(), periodLabel: period }),
  });
};
