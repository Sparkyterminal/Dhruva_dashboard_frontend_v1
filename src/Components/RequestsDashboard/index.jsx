import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./RequestsDashboard.css";

/** Title plus a single calm summary strip shared by every role's Request's Dashboard. */
const RequestsHeader = ({ title = "Request's Dashboard", subtitle, stats = {} }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  // As a tab on the role home the rail already links home; on its own page it needs a way back.
  const standalone = pathname !== "/user";
  const items = [
    { label: "Total", value: stats.total },
    { label: "Pending", value: stats.pending, tone: "pending" },
    { label: "Approved", value: stats.approved ?? stats.completed, tone: "approved" },
    { label: "Rejected", value: stats.rejected, tone: "rejected" },
  ];
  return (
    <>
      {standalone ? (
        <button type="button" className="rd-back" onClick={() => navigate("/user")}>
          <ArrowLeft size={16} aria-hidden="true" /> Back to Home
        </button>
      ) : null}
      <header className="rd-head">
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </header>
      <dl className="rd-stats">
        {items.map(({ label, value, tone }) => (
          <div key={label} className={tone ? `is-${tone}` : undefined}>
            <dt>{label}</dt>
            <dd>{value ?? 0}</dd>
          </div>
        ))}
      </dl>
    </>
  );
};

export default RequestsHeader;
