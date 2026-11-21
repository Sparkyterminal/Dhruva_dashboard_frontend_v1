import React, { useState } from "react";
import { formatCompactINR, monthLabel, niceTicks } from "../statsMath";
import { CHART_INK } from "./chartTokens";
import { EmptyChart, Legend } from "./ChartCard";
import TipLayer from "./TipLayer";
import { useChartTip, useElementWidth } from "./useChartHelpers";
import "./Charts.css";

const HEIGHT = 264;
const M = { left: 62, right: 12, top: 20, bottom: 38 };
const MIN_SLOT = 38; // narrower than this and the chart scrolls sideways instead of squeezing
const GAP = 2; // surface gap between neighbouring bars

/** Column with a 4px rounded top and a square foot on the baseline. */
const columnPath = (x, y, w, h, r = 4) => {
  if (h <= 0) return "";
  const radius = Math.min(r, h, w / 2);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
};

/**
 * Columns per month. One axis only: several series must share the same unit (for example booked vs received money).
 *   data: { key: "2026-10", values: number[] }[]   series: { name, color }[]
 *   formatValue(v): full text for the tooltip   formatTick(v): short text for the axis   integerTicks: counts
 */
const ColumnChart = ({ data, series, formatValue, formatTick = formatCompactINR, integerTicks = false, ariaLabel }) => {
  const [ref, width] = useElementWidth();
  const { tip, show, hide } = useChartTip();
  const [active, setActive] = useState(null);

  const all = data.flatMap((d) => d.values);
  const max = Math.max(0, ...all);
  if (data.length === 0 || max <= 0) return <EmptyChart />;

  const ticks = niceTicks(max, 4, integerTicks);
  const top = ticks[ticks.length - 1];
  const plotW = Math.max(width - M.left - M.right, data.length * MIN_SLOT);
  const svgW = plotW + M.left + M.right;
  const plotH = HEIGHT - M.top - M.bottom;
  const slot = plotW / data.length;
  const barW = Math.min(24, (slot * 0.7 - GAP * (series.length - 1)) / series.length);
  const groupW = barW * series.length + GAP * (series.length - 1);
  const y = (v) => M.top + plotH - (v / top) * plotH;
  const labelEvery = slot < 44 ? 2 : 1;

  // The one label printed on a bar: the highest column of the first series.
  const peak = Math.max(...data.map((d) => d.values[0]));
  const peakIndex = data.findIndex((d) => d.values[0] === peak);

  const tipFor = (d) => (
    <>
      <strong>{monthLabel(d.key)}</strong>
      {series.map((s, i) => (
        <span key={s.name}>
          <i style={{ background: s.color }} aria-hidden="true" /> {s.name}: <b>{formatValue(d.values[i])}</b>
        </span>
      ))}
    </>
  );

  return (
    <div className="ec-col">
      {series.length > 1 ? <Legend items={series} /> : null}
      <div className="ec-scroll-x" ref={ref}>
        <svg width={svgW} height={HEIGHT} role="img" aria-label={ariaLabel} className="ec-svg">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} stroke={t === 0 ? CHART_INK.axis : CHART_INK.grid} strokeWidth="1" />
              <text x={M.left - 8} y={y(t) + 4} textAnchor="end" className="ec-axis">
                {formatTick(t)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const cx = M.left + slot * i + slot / 2;
            const x0 = cx - groupW / 2;
            const isJan = d.key.endsWith("-01");
            return (
              <g key={d.key}>
                {active === i ? <rect x={M.left + slot * i} y={M.top} width={slot} height={plotH} fill="#f4f6f2" /> : null}
                {series.map((s, si) => {
                  const h = (d.values[si] / top) * plotH;
                  return <path key={s.name} d={columnPath(x0 + si * (barW + GAP), y(d.values[si]), barW, h)} fill={s.color} />;
                })}
                {i === peakIndex ? (
                  <text x={cx} y={y(peak) - 6} textAnchor="middle" className="ec-peak">
                    {formatTick(peak)}
                  </text>
                ) : null}
                {i % labelEvery === 0 ? (
                  <text x={cx} y={HEIGHT - M.bottom + 16} textAnchor="middle" className="ec-axis">
                    {monthLabel(d.key, false)}
                    {i === 0 || isJan ? (
                      <tspan x={cx} dy="13" className="ec-axis-year">
                        {d.key.slice(0, 4)}
                      </tspan>
                    ) : null}
                  </text>
                ) : null}
              </g>
            );
          })}

          {/* hit targets: the whole month slot, reachable by keyboard */}
          {data.map((d, i) => (
            <rect
              key={`hit-${d.key}`}
              x={M.left + slot * i}
              y={M.top}
              width={slot}
              height={plotH}
              fill="transparent"
              tabIndex={0}
              role="img"
              aria-label={`${monthLabel(d.key)}: ${series.map((s, si) => `${s.name} ${formatValue(d.values[si])}`).join(", ")}`}
              onMouseEnter={(e) => {
                setActive(i);
                show(e.currentTarget, tipFor(d));
              }}
              onFocus={(e) => {
                setActive(i);
                show(e.currentTarget, tipFor(d));
              }}
              onMouseLeave={() => {
                setActive(null);
                hide();
              }}
              onBlur={() => {
                setActive(null);
                hide();
              }}
            />
          ))}
        </svg>
      </div>
      <TipLayer tip={tip} />
    </div>
  );
};

export default ColumnChart;
