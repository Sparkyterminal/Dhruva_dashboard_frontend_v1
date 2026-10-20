import React, { useEffect, useState } from "react";

const useNow = (intervalMs) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
};

const greetingFor = (date) => {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

/** "Good morning". Re-checks the hour once a minute. */
export const Greeting = () => {
  const now = useNow(60000);
  return (
    <h1 className="rh-greeting">
      {greetingFor(now)}
    </h1>
  );
};

/** Date and time. Lives in its own component so a ticking clock never re-renders the page below it. */
export const LiveClock = () => {
  const now = useNow(1000);
  return (
    <p className="rh-when">
      <span>
        {now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </span>
      <span className="rh-time">
        {now.toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </span>
    </p>
  );
};
