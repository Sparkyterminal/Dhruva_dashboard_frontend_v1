import React from "react";
import "./Charts.css";

/** The floating tooltip drawn from `useChartTip().tip`. */
const TipLayer = ({ tip }) =>
  tip ? (
    <div className="ec-tip" role="tooltip" style={{ left: tip.x, top: tip.y }}>
      {tip.content}
    </div>
  ) : null;

export default TipLayer;
