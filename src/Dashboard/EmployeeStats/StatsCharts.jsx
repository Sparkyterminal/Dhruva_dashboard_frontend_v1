import React, { useState } from "react";
import { Segmented } from "@/Components/PageKit";
import { ChartCard, SimpleTable } from "./charts/ChartCard";
import ColumnChart from "./charts/ColumnChart";
import HBarChart from "./charts/HBarChart";
import HeatGrid from "./charts/HeatGrid";
import StatusBar from "./charts/StatusBar";
import { SERIES, STATUS } from "./charts/chartTokens";
import { formatCompactINR, formatINR, formatPercent, monthLabel, rankEmployees, topOfMonth } from "./statsMath";
import "./EmployeeStats.css";

const num = (v) => Number(v) || 0;

/** Monthly columns on ONE axis: booked amount, confirmed bookings, or booked vs received (both are rupees). */
export const TrendCard = ({ months, monthly }) => {
  const [metric, setMetric] = useState("amount");
  const rowOf = (m) => monthly.find((x) => x.month === m) || {};

  const config = {
    amount: {
      series: [{ name: "Booked amount", color: SERIES[0] }],
      values: (r) => [num(r.bookedAmount)],
      formatValue: formatINR,
      integerTicks: false,
    },
    bookings: {
      series: [{ name: "Confirmed bookings", color: SERIES[0] }],
      values: (r) => [num(r.confirmed)],
      formatValue: (v) => `${v}`,
      integerTicks: true,
    },
    vs: {
      series: [
        { name: "Booked", color: SERIES[0] },
        { name: "Received", color: SERIES[1] },
      ],
      values: (r) => [num(r.bookedAmount), num(r.receivedAmount)],
      formatValue: formatINR,
      integerTicks: false,
    },
  }[metric];

  const data = months.map((m) => ({ key: m, values: config.values(rowOf(m)) }));

  return (
    <ChartCard
      title="Month by month"
      subtitle="The whole team, every month of the period"
      controls={
        <Segmented
          label="Measure"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "amount", label: "Booked" },
            { value: "bookings", label: "Bookings" },
            { value: "vs", label: "Booked vs received" },
          ]}
        />
      }
      chart={
        <ColumnChart
          data={data}
          series={config.series}
          formatValue={config.formatValue}
          formatTick={config.integerTicks ? (v) => `${v}` : formatCompactINR}
          integerTicks={config.integerTicks}
          ariaLabel={`Team ${config.series.map((s) => s.name).join(" and ")} by month`}
        />
      }
      table={
        <SimpleTable
          caption="Team numbers by month"
          rows={months.map((m) => ({ key: m, ...rowOf(m) }))}
          columns={[
            { key: "month", label: "Month", render: (r) => monthLabel(r.key) },
            { key: "bookings", label: "Bookings", align: "right", render: (r) => num(r.bookings) },
            { key: "confirmed", label: "Confirmed", align: "right", render: (r) => num(r.confirmed) },
            { key: "bookedAmount", label: "Booked", align: "right", render: (r) => formatINR(r.bookedAmount) },
            { key: "receivedAmount", label: "Received", align: "right", render: (r) => formatINR(r.receivedAmount) },
            { key: "pendingAmount", label: "Pending", align: "right", render: (r) => formatINR(r.pendingAmount) },
          ]}
        />
      }
    />
  );
};

const RANK_METRICS = {
  bookedAmount: { label: "Booked", money: true },
  receivedAmount: { label: "Received", money: true },
  confirmed: { label: "Confirmed bookings", money: false },
};

/** Who is ahead: one bar per employee (one colour; the order carries the rank). */
export const RankingCard = ({ employees, onSelect }) => {
  const [metric, setMetric] = useState("bookedAmount");
  const meta = RANK_METRICS[metric];
  const ranked = rankEmployees(employees, metric);

  const rows = ranked
    .filter((e) => e.metricValue > 0)
    .map((e) => ({
      key: e.userId ?? "unassigned",
      label: e.name,
      sublabel: (e.departments || []).join(", "),
      value: e.metricValue,
      valueText: meta.money ? formatCompactINR(e.metricValue) : `${e.metricValue}`,
      tip: (
        <>
          <strong>{e.name}</strong>
          <span>Booked <b>{formatINR(e.totals.bookedAmount)}</b></span>
          <span>Received <b>{formatINR(e.totals.receivedAmount)}</b></span>
          <span>{e.totals.confirmed} confirmed of {e.totals.bookings} bookings</span>
        </>
      ),
      userId: e.userId,
    }));

  return (
    <ChartCard
      title="Ranking"
      subtitle="Click a name to see their months and bookings"
      controls={
        <Segmented
          label="Rank by"
          value={metric}
          onChange={setMetric}
          options={Object.entries(RANK_METRICS).map(([value, m]) => ({ value, label: m.label }))}
        />
      }
      chart={
        <HBarChart
          rows={rows}
          color={SERIES[0]}
          ariaLabel={`Employees ranked by ${meta.label.toLowerCase()}`}
          onSelect={(key) => {
            const row = rows.find((r) => r.key === key);
            if (row?.userId) onSelect(row.userId);
          }}
        />
      }
      table={
        <SimpleTable
          caption="Employees ranked"
          rows={ranked.map((e) => ({ key: e.userId ?? "unassigned", ...e }))}
          columns={[
            { key: "rank", label: "Rank", render: (r) => (r.metricValue > 0 ? r.rank : "–") },
            { key: "name", label: "Employee" },
            { key: "bookedAmount", label: "Booked", align: "right", render: (r) => formatINR(r.totals.bookedAmount) },
            { key: "receivedAmount", label: "Received", align: "right", render: (r) => formatINR(r.totals.receivedAmount) },
            { key: "confirmed", label: "Confirmed", align: "right", render: (r) => r.totals.confirmed },
          ]}
        />
      }
    />
  );
};

/** How all bookings in the period ended up, by status. */
export const StatusCard = ({ totals }) => {
  const parts = STATUS.map((s) => ({ ...s, count: num(totals?.[s.key]) }));
  const all = parts.reduce((t, p) => t + p.count, 0);
  return (
    <ChartCard
      title="Where the bookings stand"
      subtitle="Every booking in the period, by status"
      chart={<StatusBar parts={parts} ariaLabel="Bookings by status" />}
      table={
        <SimpleTable
          caption="Bookings by status"
          rows={parts}
          columns={[
            { key: "label", label: "Status" },
            { key: "count", label: "Bookings", align: "right" },
            { key: "share", label: "Share", align: "right", render: (r) => (all > 0 ? formatPercent(r.count / all, 1) : "—") },
          ]}
        />
      }
    />
  );
};

/** The employee x month grid with the winner of each month crowned. */
export const HeatCard = ({ employees, months, monthly, monthlyTop, onSelect }) => {
  const winners = {};
  months.forEach((m) => {
    const entry = (monthlyTop || []).find((x) => x.month === m);
    winners[m] = entry ? entry.byAmount?.userId ?? null : topOfMonth(employees, m, "amount")?.userId ?? null;
  });
  const ranked = rankEmployees(employees, "bookedAmount");

  return (
    <ChartCard
      title="Employee × month"
      subtitle="Booked amount. Darker means more. A crown marks the top employee of the month"
      chart={<HeatGrid employees={ranked} months={months} monthly={monthly} winners={winners} onSelect={onSelect} />}
      table={
        <SimpleTable
          caption="Booked amount by employee and month"
          rows={ranked.map((e) => ({ key: e.userId ?? "unassigned", ...e }))}
          columns={[
            { key: "name", label: "Employee" },
            ...months.map((m) => ({
              key: m,
              label: monthLabel(m),
              align: "right",
              render: (r) => formatINR(r.byMonth.find((x) => x.month === m)?.bookedAmount),
            })),
            { key: "total", label: "Total", align: "right", render: (r) => formatINR(r.totals.bookedAmount) },
          ]}
        />
      }
    />
  );
};
