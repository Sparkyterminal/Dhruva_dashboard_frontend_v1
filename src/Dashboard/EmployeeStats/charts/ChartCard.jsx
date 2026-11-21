import React, { useState } from "react";
import { BarChart3, Table2 } from "lucide-react";
import "./Charts.css";

/** A titled panel for one chart, with a Chart / Table switch (the table is the accessible twin of the chart). */
export const ChartCard = ({ title, subtitle, controls, chart, table, className = "" }) => {
  const [view, setView] = useState("chart");
  return (
    <section className={`ec-card ${className}`.trim()}>
      <header className="ec-card-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <div className="ec-card-tools">
          {controls}
          <div className="ec-view" role="group" aria-label={`${title}: view`}>
            <button type="button" aria-pressed={view === "chart"} onClick={() => setView("chart")}>
              <BarChart3 size={14} aria-hidden="true" /> Chart
            </button>
            <button type="button" aria-pressed={view === "table"} onClick={() => setView("table")}>
              <Table2 size={14} aria-hidden="true" /> Table
            </button>
          </div>
        </div>
      </header>
      <div className="ec-card-body">{view === "chart" ? chart : table}</div>
    </section>
  );
};

/** Plain table with the same numbers as a chart. columns: { key, label, align?, render?(row) }[] */
export const SimpleTable = ({ columns, rows, rowKey = "key", caption }) => (
  <div className="ec-table-wrap">
    <table className="ec-table">
      {caption ? <caption className="ec-sr">{caption}</caption> : null}
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col" style={{ textAlign: c.align || "left" }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={row[rowKey] ?? i}>
            {columns.map((c) => (
              <td key={c.key} style={{ textAlign: c.align || "left" }}>
                {c.render ? c.render(row) : row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const EmptyChart = ({ children = "No data for this period." }) => <p className="ec-empty">{children}</p>;

export const Legend = ({ items }) => (
  <ul className="ec-legend">
    {items.map((item) => (
      <li key={item.name}>
        <i style={{ background: item.color }} aria-hidden="true" />
        {item.name}
      </li>
    ))}
  </ul>
);
