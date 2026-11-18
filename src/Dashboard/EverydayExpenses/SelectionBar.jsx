import React from "react";
import { BadgeIndianRupee, XCircle } from "lucide-react";
import { formatMoney } from "./everydayRules";
import "./Everyday.css";

/** Floating bar at the bottom of the screen while expenses are ticked in the overview. */
const SelectionBar = ({ count, total, onRepay, onReject, onClear }) => {
  if (count === 0) return null;
  return (
    <div className="ee-bar" role="region" aria-label="Selected expenses">
      <div className="ee-bar-info">
        <strong>{count} selected</strong>
        <span>To repay {formatMoney(total)}</span>
      </div>
      <div className="ee-bar-actions">
        <button type="button" className="ee-bar-btn" onClick={onClear}>
          Clear
        </button>
        <button type="button" className="ee-bar-btn is-reject" onClick={onReject}>
          <XCircle size={16} aria-hidden="true" /> Reject
        </button>
        <button type="button" className="ee-bar-btn is-repay" onClick={onRepay}>
          <BadgeIndianRupee size={16} aria-hidden="true" /> Mark repaid
        </button>
      </div>
    </div>
  );
};

export default SelectionBar;
