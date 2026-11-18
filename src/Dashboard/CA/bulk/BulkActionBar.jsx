import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import "./BulkApprove.css";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** Floating bar that appears at the bottom of the screen while requirements are selected. */
const BulkActionBar = ({ count, requestedTotal, onApprove, onReject, onClear }) => {
  if (count === 0) return null;
  return (
    <div className="ba-bar" role="region" aria-label="Selected requirements">
      <div className="ba-bar-info">
        <strong>{count} selected</strong>
        <span>Requested {money(requestedTotal)}</span>
      </div>
      <div className="ba-bar-actions">
        <button type="button" className="ba-btn" onClick={onClear}>
          Clear
        </button>
        <button type="button" className="ba-btn is-reject" onClick={onReject}>
          <XCircle size={16} aria-hidden="true" /> Reject
        </button>
        <button type="button" className="ba-btn is-approve" onClick={onApprove}>
          <CheckCircle2 size={16} aria-hidden="true" /> Approve
        </button>
      </div>
    </div>
  );
};

export default BulkActionBar;
