import React from "react";
import { formatAmountINR } from "./daybookUtils";

/** Highlighted calculated line shown under the amount fields ("Net amount received" etc.). */
export const Readout = ({ label, value, formula, tone = "" }) => (
  <div className={`db-readout${tone ? ` is-${tone}` : ""}`} aria-live="polite">
    <div>
      <span className="db-readout-label">{label}</span>
      {formula ? <span className="db-readout-formula">{formula}</span> : null}
    </div>
    <strong>{formatAmountINR(value)}</strong>
  </div>
);

/** Two fields side by side (stacked on phones). */
export const FieldRow = ({ children }) => <div className="db-form-row">{children}</div>;
