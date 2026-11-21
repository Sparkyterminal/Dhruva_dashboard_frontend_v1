import React, { useState } from "react";
import { EmptyChart } from "./ChartCard";
import TipLayer from "./TipLayer";
import { useChartTip } from "./useChartHelpers";
import "./Charts.css";

/**
 * Ranked horizontal bars: ONE series, so every bar has the same colour (colour is not a rank ramp).
 *   rows: { key, label, sublabel?, value, valueText, tip?: node }[] already sorted, highest first
 *   color: the bar colour   onSelect(key): optional, makes a row a button
 */
const HBarChart = ({ rows, color, onSelect, initialVisible = 8, ariaLabel }) => {
  const [showAll, setShowAll] = useState(false);
  const { tip, show, hide } = useChartTip();

  const max = Math.max(0, ...rows.map((r) => r.value));
  if (rows.length === 0 || max <= 0) return <EmptyChart />;

  const visible = showAll ? rows : rows.slice(0, initialVisible);
  const hidden = rows.length - visible.length;

  return (
    <div className="ec-hbar">
      <ol aria-label={ariaLabel}>
        {visible.map((r, i) => {
          const Row = onSelect ? "button" : "div";
          const pct = Math.max((r.value / max) * 100, r.value > 0 ? 1.5 : 0);
          return (
            <li key={r.key}>
              <Row
                {...(onSelect ? { type: "button", onClick: () => onSelect(r.key) } : { tabIndex: 0 })}
                className={`ec-hrow${i === 0 ? " is-first" : ""}`}
                aria-label={`${i + 1}. ${r.label}: ${r.valueText}`}
                onMouseEnter={(e) => r.tip && show(e.currentTarget, r.tip)}
                onFocus={(e) => r.tip && show(e.currentTarget, r.tip)}
                onMouseLeave={hide}
                onBlur={hide}
              >
                <span className="ec-hrank">{i + 1}</span>
                <span className="ec-hname" title={r.label}>
                  {r.label}
                  {r.sublabel ? <em>{r.sublabel}</em> : null}
                </span>
                <span className="ec-htrack">
                  <i style={{ width: `${pct}%`, background: color }} />
                </span>
                <span className="ec-hval">{r.valueText}</span>
              </Row>
            </li>
          );
        })}
      </ol>
      {rows.length > initialVisible ? (
        <button type="button" className="ec-more" onClick={() => setShowAll((v) => !v)}>
          {showAll ? "Show fewer" : `Show all ${rows.length} (${hidden} more)`}
        </button>
      ) : null}
      <TipLayer tip={tip} />
    </div>
  );
};

export default HBarChart;
