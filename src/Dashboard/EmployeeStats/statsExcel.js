import dayjs from "dayjs";
import { downloadExcel } from "@/lib/excel/downloadExcel";
import { monthLabel, rankEmployees, round1, round2 } from "./statsMath";

const num = (v) => Number(v) || 0;
const pctPoints = (ratio) => (ratio == null ? null : round1(num(ratio) * 100)); // the shared "percent" column is 0-100
const dept = (e) => (e.departments || []).join(", ") || null;

/**
 * Builds the three sheets from a /employee-stats response. Pure.
 *   By employee: every number per person   Employee x month: booked amount grid   Month winners
 * Never mentions the data floor.
 */
export const buildStatsSheets = (data, ctx = {}) => {
  const employees = rankEmployees(data?.employees || [], "bookedAmount");
  const months = data?.months || [];
  const monthly = data?.monthly || [];
  const generated = dayjs(ctx.generatedAt || new Date()).format("DD MMM YYYY, hh:mm A");
  const sub = (...parts) => [ctx.periodLabel && `Period: ${ctx.periodLabel}`, ...parts, `Generated on ${generated}`].filter(Boolean).join("   |   ");
  const t = data?.totals || {};

  const byEmployee = {
    name: "By employee",
    title: "Employee Statistics",
    subtitle: sub(`${employees.length} employees`, ctx.basisLabel),
    columns: [
      { header: "Rank", type: "number", width: 7 },
      { header: "Employee", width: 28 },
      { header: "Department", width: 22 },
      { header: "Bookings", type: "number" },
      { header: "Confirmed", type: "number" },
      { header: "In progress", type: "number" },
      { header: "Almost booked", type: "number" },
      { header: "Cancelled", type: "number" },
      { header: "Conversion", type: "percent" },
      { header: "Booked amount", type: "money" },
      { header: "Received", type: "money" },
      { header: "Pending", type: "money" },
      { header: "Pipeline", type: "money" },
      { header: "Avg booking value", type: "money" },
    ],
    rows: employees.map((e) => [
      e.metricValue > 0 ? e.rank : null,
      e.name,
      dept(e),
      num(e.totals.bookings),
      num(e.totals.confirmed),
      num(e.totals.inProgress),
      num(e.totals.almostBooked),
      num(e.totals.cancelled),
      pctPoints(e.totals.conversionRate),
      num(e.totals.bookedAmount),
      num(e.totals.receivedAmount),
      num(e.totals.pendingAmount),
      num(e.totals.pipelineAmount),
      e.totals.avgBookingValue == null ? null : num(e.totals.avgBookingValue),
    ]),
    totals: [
      "Total", null, null, num(t.bookings), num(t.confirmed), num(t.inProgress), num(t.almostBooked), num(t.cancelled),
      pctPoints(t.conversionRate), num(t.bookedAmount), num(t.receivedAmount), num(t.pendingAmount), num(t.pipelineAmount),
      t.avgBookingValue == null ? null : num(t.avgBookingValue),
    ],
    freezeColumns: 2,
  };

  const grid = {
    name: "Employee x month",
    title: "Booked amount by employee and month",
    subtitle: sub("Confirmed bookings only"),
    columns: [
      { header: "Employee", width: 28 },
      { header: "Department", width: 22 },
      ...months.map((m) => ({ header: monthLabel(m), type: "money" })),
      { header: "Total", type: "money" },
    ],
    rows: employees.map((e) => [
      e.name,
      dept(e),
      ...months.map((m) => num(e.byMonth.find((x) => x.month === m)?.bookedAmount)),
      num(e.totals.bookedAmount),
    ]),
    totals: ["Team", null, ...months.map((m) => num(monthly.find((x) => x.month === m)?.bookedAmount)), num(t.bookedAmount)],
    freezeColumns: 2,
  };

  const winners = {
    name: "Month winners",
    title: "Who was on top, month by month",
    subtitle: sub("Top by booked amount and by confirmed bookings"),
    columns: [
      { header: "Month", width: 14 },
      { header: "Top by amount", width: 26 },
      { header: "Booked amount", type: "money" },
      { header: "Confirmed", type: "number" },
      { header: "Most bookings", width: 26 },
      { header: "Confirmed ", type: "number" },
      { header: "Team booked", type: "money" },
      { header: "Team received", type: "money" },
    ],
    rows: months.map((m) => {
      const top = (data?.monthlyTop || []).find((x) => x.month === m) || {};
      const row = monthly.find((x) => x.month === m) || {};
      return [
        monthLabel(m),
        top.byAmount?.name ?? null,
        top.byAmount ? num(top.byAmount.bookedAmount) : null,
        top.byAmount ? num(top.byAmount.confirmed) : null,
        top.byBookings?.name ?? null,
        top.byBookings ? num(top.byBookings.confirmed) : null,
        round2(num(row.bookedAmount)),
        round2(num(row.receivedAmount)),
      ];
    }),
    freezeColumns: 1,
  };

  return [byEmployee, grid, winners];
};

export const downloadStatsExcel = async (data, { from, to, dateBasis }) => {
  const fmt = (d) => dayjs(d).format("DD MMM YYYY");
  await downloadExcel({
    fileName: `Employee_Statistics_${from}_to_${to}`,
    sheets: buildStatsSheets(data, {
      generatedAt: new Date(),
      periodLabel: `${fmt(from)} to ${fmt(to)}`,
      basisLabel: dateBasis === "event" ? "Counted by event date" : "Counted by booking date",
    }),
  });
};
