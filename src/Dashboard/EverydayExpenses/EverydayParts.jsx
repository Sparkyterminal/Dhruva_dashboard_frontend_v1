import React from "react";
import { formatMoney } from "./everydayRules";
import "./Everyday.css";

/** Two form fields side by side (stacked on phones). */
export const FieldRow = ({ children }) => <div className="ee-row">{children}</div>;

/** The live "You will get ₹X" box under the amount fields. */
export const ReimbursementBox = ({ amount, reason, muted }) => (
  <div className={`ee-readout${muted ? " is-muted" : ""}`} aria-live="polite">
    <div>
      <span className="ee-readout-label">You will get</span>
      {reason ? <span className="ee-readout-reason">{reason}</span> : null}
    </div>
    <strong>{formatMoney(amount)}</strong>
  </div>
);

/** A tick box with a label (FormKit has none). */
export const CheckField = ({ checked, onChange, children }) => (
  <label className="ee-check">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>{children}</span>
  </label>
);

/** Quiet note from management shown under the category (limits, rules). */
export const HintBox = ({ children, tone = "info" }) => (
  <p className={`ee-hint is-${tone}`}>{children}</p>
);
