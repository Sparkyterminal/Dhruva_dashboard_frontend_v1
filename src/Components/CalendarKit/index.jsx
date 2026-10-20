import React from "react";
import "./CalendarKit.css";

/** Placeholder grid shown only while the very first load is running. */
export const CalendarSkeleton = () => (
  <div className="ck-card" aria-busy="true" aria-label="Loading calendar">
    <div className="ck-skeleton">
      {Array.from({ length: 28 }).map((_, i) => (
        <i key={i} />
      ))}
    </div>
  </div>
);

export const CalendarEmpty = ({ icon, title, hint }) => (
  <div className="ck-empty">
    {icon ? <span className="ring">{icon}</span> : null}
    <strong>{title}</strong>
    {hint ? <span>{hint}</span> : null}
  </div>
);
