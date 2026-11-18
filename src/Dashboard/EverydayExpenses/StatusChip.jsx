import React from "react";
import "./Everyday.css";

const LOOK = {
  SUBMITTED: { label: "Pending repayment", cls: "is-gold" },
  REJECTED: { label: "Rejected", cls: "is-red" },
  REPAID: { label: "Repaid", cls: "" },
};

const StatusChip = ({ status }) => {
  const look = LOOK[status] || { label: status || "-", cls: "is-grey" };
  return <span className={`pk-pill ee-chip ${look.cls}`.trim()}>{look.label}</span>;
};

export default StatusChip;
