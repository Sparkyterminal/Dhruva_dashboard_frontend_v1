import React from "react";
import { formatPercent } from "../statsMath";
import { readableOn } from "./chartTokens";
import { EmptyChart } from "./ChartCard";
import TipLayer from "./TipLayer";
import { useChartTip } from "./useChartHelpers";
import "./Charts.css";

const MIN_LABEL_SHARE = 0.12; // a block narrower than this prints no label (the legend and tooltip carry it)

/**
 * One whole split into parts (status mix): a tall segmented bar. Block width = share; the share is printed
 * inside a block only when it fits. A part with 0 draws nothing. The legend lists the names and counts.
 *   parts: { key, label, color, count }[]
 */
const StatusBar = ({ parts, ariaLabel }) => {
  const { tip, show, hide } = useChartTip();
  const total = parts.reduce((t, p) => t + p.count, 0);
  if (total <= 0) return <EmptyChart>No bookings in this period.</EmptyChart>;

  const drawn = parts.filter((p) => p.count > 0);
  const summary = parts.map((p) => `${p.label} ${p.count}`).join(", ");

  return (
    <div className="ec-status">
      <div className="ec-seg-bar" role="img" aria-label={`${ariaLabel}: ${summary}`}>
        {drawn.map((p) => {
          const share = p.count / total;
          const tipNode = (
            <>
              <strong>{p.label}</strong>
              <span>
                <b>{p.count}</b> bookings · {formatPercent(share, 1)}
              </span>
            </>
          );
          return (
            <div
              key={p.key}
              className="ec-seg"
              style={{ flexGrow: p.count, background: p.color, color: readableOn(p.color) }}
              tabIndex={0}
              aria-label={`${p.label}: ${p.count} bookings, ${formatPercent(share, 1)}`}
              onMouseEnter={(e) => show(e.currentTarget, tipNode)}
              onFocus={(e) => show(e.currentTarget, tipNode)}
              onMouseLeave={hide}
              onBlur={hide}
            >
              {share >= MIN_LABEL_SHARE ? formatPercent(share) : ""}
            </div>
          );
        })}
      </div>
      <ul className="ec-legend is-counts">
        {parts.map((p) => (
          <li key={p.key}>
            <i style={{ background: p.color }} aria-hidden="true" />
            {p.label} <b>{p.count}</b>
          </li>
        ))}
      </ul>
      <TipLayer tip={tip} />
    </div>
  );
};

export default StatusBar;
