import React from "react";
import { sparkPoints } from "../statsMath";
import { CHART_INK } from "./chartTokens";

/** A tiny monthly trend: 2px line, an end dot with a surface ring. Flat grey when there is nothing to show. */
const Sparkline = ({ values, color, width = 88, height = 26, label }) => {
  const list = (values || []).map((v) => Number(v) || 0);
  const empty = list.length === 0 || list.every((v) => v === 0);
  const points = sparkPoints(list, width, height);
  const last = points ? points.split(" ").pop().split(",").map(Number) : null;
  return (
    <svg width={width} height={height} role="img" aria-label={label || `Trend: ${list.join(", ")}`} className="ec-spark">
      {empty ? (
        <line x1="2" x2={width - 2} y1={height / 2} y2={height / 2} stroke={CHART_INK.axis} strokeWidth="2" strokeLinecap="round" />
      ) : (
        <>
          <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {last ? <circle cx={last[0]} cy={last[1]} r="4" fill={color} stroke={CHART_INK.surface} strokeWidth="2" /> : null}
        </>
      )}
    </svg>
  );
};

export default Sparkline;
