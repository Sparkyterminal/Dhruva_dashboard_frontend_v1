import dayjs from "dayjs";
import { downloadExcel } from "@/lib/excel/downloadExcel";

const COLUMNS = [
  { header: "S.No", type: "number", width: 7 },
  { header: "Status" },
  { header: "Client Details", wrap: true, width: 28 },
  { header: "Event Type Details", wrap: true, width: 28 },
  { header: "Assigned To" },
  { header: "Start Date", type: "date" },
  { header: "End Date", type: "date" },
  { header: "Estimated Budget", type: "money" },
  { header: "Converted By Marketing" },
  { header: "Converted On", type: "date" },
  { header: "Notes", wrap: true, width: 40 },
  { header: "Created By" },
  { header: "Created On", type: "datetime" },
  { header: "Last Updated", type: "datetime" },
];

const personName = (p) => {
  if (p == null || p === "") return null;
  if (typeof p === "string") return p;
  return (
    p.name ||
    [p.first_name ?? p.firstName, p.last_name ?? p.lastName].filter(Boolean).join(" ") ||
    null
  );
};

/** One row per lead with every field the leads tracker holds. */
export const buildLeadsSheet = (leads, ctx = {}) => {
  let totalBudget = 0;
  const rows = leads.map((l, i) => {
    totalBudget += Number(l.estimatedBudget) || 0;
    return [
      i + 1,
      l.status,
      l.clientDetails,
      l.eventTypeDetails,
      personName(l.assignedTo),
      l.startDate,
      l.endDate,
      l.estimatedBudget,
      l.convertedByMarketing ? "Yes" : "No",
      l.convertedByMarketing ? l.convertedAt : null,
      l.notes,
      personName(l.createdBy),
      l.createdAt,
      l.updatedAt,
    ];
  });

  const totals = Array(COLUMNS.length).fill(null);
  totals[0] = "Total";
  totals[7] = totalBudget;

  const generated = dayjs(ctx.generatedAt || new Date()).format("DD MMM YYYY, hh:mm A");
  return {
    name: "Leads Tracker",
    title: "Leads Tracker",
    subtitle: [`${rows.length} leads`, ...(ctx.filterLines || []), `Generated on ${generated}`].join("   |   "),
    columns: COLUMNS,
    rows,
    totals: rows.length ? totals : undefined,
    freezeColumns: 3,
  };
};

export const downloadLeadsExcel = async (leads, ctx = {}) => {
  const generatedAt = ctx.generatedAt || new Date();
  await downloadExcel({
    fileName: `Leads_Tracker_${dayjs(generatedAt).format("YYYY-MM-DD")}`,
    sheets: [buildLeadsSheet(leads, { ...ctx, generatedAt })],
  });
};
