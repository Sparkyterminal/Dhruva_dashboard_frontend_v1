import React from "react";
import { Clock, Lock } from "lucide-react";
import { formatCountdown, lockInfo } from "./everydayRules";
import "./Everyday.css";

/**
 * "Editable · 3h 12m left" until 12:00 am India time, then "Locked". `now` is the server-corrected
 * time in ms (pass the same value to every chip so a list needs only one timer).
 */
const LockChip = ({ entry, now }) => {
  const { locked, msLeft } = lockInfo(entry, now);
  if (locked) {
    return (
      <span className="pk-pill is-grey ee-chip" title="Locked at 12:00 am. It can no longer be changed.">
        <Lock size={12} aria-hidden="true" /> Locked
      </span>
    );
  }
  return (
    <span className="pk-pill is-blue ee-chip" title="You can edit or delete this until 12:00 am tonight.">
      <Clock size={12} aria-hidden="true" /> Editable · {formatCountdown(msLeft)} left
    </span>
  );
};

export default LockChip;
