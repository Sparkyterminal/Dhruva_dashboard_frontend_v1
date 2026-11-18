import { useEffect, useState } from "react";

// The lock is decided by the server's clock, not the phone's. Every API response that carries
// `serverTime` updates this offset, and the countdowns use serverNow().
let offsetMs = 0;

export const syncServerTime = (serverTimeIso) => {
  const server = Date.parse(serverTimeIso);
  if (Number.isFinite(server)) offsetMs = server - Date.now();
};

export const serverNow = () => Date.now() + offsetMs;

/** Re-renders every `tickMs` with the current server time (milliseconds since epoch). */
export const useServerNow = (tickMs = 1000) => {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const id = setInterval(() => setNow(serverNow()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  return now;
};
