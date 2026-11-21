// Employee Statistics: the small calculations the page does itself. The money numbers come from
// the server (docs/api/employee-stats/EMPLOYEE_STATS_BACKEND.md); nothing here invents data.

export const round1 = (x) => Math.round((Number(x) + Number.EPSILON) * 10) / 10;
export const round2 = (x) => Math.round((Number(x) + Number.EPSILON) * 100) / 100;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Whole-number percentage text, or a dash when there is nothing to divide by. */
export const formatPercent = (ratioOrNull, digits = 0) =>
  ratioOrNull == null || !Number.isFinite(Number(ratioOrNull)) ? "—" : `${(Number(ratioOrNull) * 100).toFixed(digits)}%`;

/** Share of a total as 0-100, or null when the total is 0. */
export const shareOfTotal = (value, total) => (num(total) > 0 ? (num(value) / num(total)) * 100 : null);

/**
 * How `current` moved against `previous`.
 *   none: no earlier period to compare with   new: previous was 0 and now there is something
 *   up / down / flat: with the percent change (one decimal)
 */
export const changeVsPrevious = (current, previous) => {
  if (previous == null) return { kind: "none", percent: null };
  const c = num(current);
  const p = num(previous);
  if (p === 0) return c === 0 ? { kind: "flat", percent: 0 } : { kind: "new", percent: null };
  const percent = round1(((c - p) / p) * 100);
  return { kind: percent > 0 ? "up" : percent < 0 ? "down" : "flat", percent };
};

/** Movement of a ratio (0-1) in percentage points, for example conversion 60% -> 75% is +15. */
export const changeInPoints = (current, previous) => {
  if (previous == null || current == null) return { kind: "none", points: null };
  const points = round1((num(current) - num(previous)) * 100);
  return { kind: points > 0 ? "up" : points < 0 ? "down" : "flat", points };
};

const METRICS = ["bookedAmount", "receivedAmount", "confirmed", "bookings", "pendingAmount"];

/**
 * Employees sorted by a metric (highest first). Ties keep a fixed order: more confirmed, then higher
 * booked amount, then name A-Z. Equal values share a rank (1, 1, 3).
 */
export const rankEmployees = (employees, metric = "bookedAmount") => {
  const key = METRICS.includes(metric) ? metric : "bookedAmount";
  const sorted = [...(employees || [])].sort(
    (a, b) =>
      num(b.totals?.[key]) - num(a.totals?.[key]) ||
      num(b.totals?.confirmed) - num(a.totals?.confirmed) ||
      num(b.totals?.bookedAmount) - num(a.totals?.bookedAmount) ||
      String(a.name || "").localeCompare(String(b.name || "")),
  );
  let rank = 0;
  let last = null;
  return sorted.map((employee, i) => {
    const value = num(employee.totals?.[key]);
    if (value !== last) {
      rank = i + 1;
      last = value;
    }
    return { ...employee, rank, metricValue: value };
  });
};

/**
 * The winner of one month worked out from the per-month rows (used when the server sends no
 * `monthlyTop`). metric "amount" = highest booked amount; "bookings" = most confirmed bookings.
 * Returns null when nobody had a confirmed booking that month.
 */
export const topOfMonth = (employees, month, metric = "amount") => {
  let best = null;
  (employees || []).forEach((employee) => {
    const row = (employee.byMonth || []).find((m) => m.month === month);
    if (!row || num(row.confirmed) <= 0) return;
    const primary = metric === "bookings" ? num(row.confirmed) : num(row.bookedAmount);
    const secondary = metric === "bookings" ? num(row.bookedAmount) : num(row.confirmed);
    const candidate = { userId: employee.userId, name: employee.name, confirmed: num(row.confirmed), bookedAmount: num(row.bookedAmount), primary, secondary };
    if (
      !best ||
      candidate.primary > best.primary ||
      (candidate.primary === best.primary && candidate.secondary > best.secondary) ||
      (candidate.primary === best.primary && candidate.secondary === best.secondary && String(candidate.name).localeCompare(String(best.name)) < 0)
    ) {
      best = candidate;
    }
  });
  if (!best) return null;
  const { primary, secondary, ...winner } = best; // eslint-disable-line no-unused-vars
  return winner;
};

/**
 * The employee whose booked amount grew the most against the previous period.
 * Needs a previous period with money in it, and at least `minBookings` bookings now.
 */
export const risingStar = (employees, { minBookings = 3 } = {}) => {
  let best = null;
  (employees || []).forEach((employee) => {
    const prev = employee.previous;
    if (!prev || num(prev.bookedAmount) <= 0) return;
    if (num(employee.totals?.bookings) < minBookings) return;
    const change = changeVsPrevious(employee.totals?.bookedAmount, prev.bookedAmount);
    if (change.kind !== "up") return;
    if (
      !best ||
      change.percent > best.percent ||
      (change.percent === best.percent && num(employee.totals.bookedAmount) > num(best.employee.totals.bookedAmount))
    ) {
      best = { employee, percent: change.percent };
    }
  });
  return best;
};

/** Shade 0..steps for a heat grid (0 = nothing). */
export const heatLevel = (value, max, steps = 5) => {
  const v = num(value);
  const m = num(max);
  if (v <= 0 || m <= 0) return 0;
  return Math.min(steps, Math.max(1, Math.ceil((v / m) * steps)));
};

/** "x,y x,y …" for a tiny line chart. One point is drawn as a short flat line; equal values sit in the middle. */
export const sparkPoints = (values, width, height, pad = 2) => {
  const list = (values || []).map(num);
  if (list.length === 0) return "";
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const min = Math.min(...list);
  const max = Math.max(...list);
  const y = (v) => (max === min ? pad + innerH / 2 : pad + innerH - ((v - min) / (max - min)) * innerH);
  if (list.length === 1) return `${pad},${y(list[0]).toFixed(1)} ${pad + innerW},${y(list[0]).toFixed(1)}`;
  return list.map((v, i) => `${(pad + (i / (list.length - 1)) * innerW).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
};

export const initials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

// ---- Dates (plain calendar maths on "YYYY-MM-DD" / "YYYY-MM"; no time zones involved) ----

// ---- Money text and chart axes ----

/** Full rupee amount with Indian digit grouping: ₹12,34,567 (paise only when present). */
export const formatINR = (value) => {
  const n = num(value);
  const abs = Math.abs(n);
  const digits = Number.isInteger(abs) ? 0 : 2;
  return `${n < 0 ? "-" : ""}₹${abs.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};

const trim = (x) => String(Number(x.toFixed(2)));

/** Short rupee amount for axes and tight spots: ₹85,000 · ₹12.5 L · ₹1.23 Cr. */
export const formatCompactINR = (value) => {
  const n = num(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${trim(abs / 1e7)} Cr`;
  if (abs >= 1e5) return `${sign}₹${trim(abs / 1e5)} L`;
  return formatINR(n);
};

/** Round, evenly spaced axis ticks from 0 up to just above `max` (about `target` steps). */
export const niceTicks = (max, target = 4, integer = false) => {
  const m = num(max);
  if (m <= 0) return [0, 1];
  const rough = m / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / pow;
  let step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
  if (integer) step = Math.max(1, Math.ceil(step)); // counts: never 0.5 or 2.5 bookings
  const top = Math.ceil(m / step - 1e-9) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Number(v.toFixed(6)));
  return ticks;
};

/** Today's date in India time (UTC+05:30, no daylight saving), whatever the device's time zone. */
export const istToday = (nowMs = Date.now()) => new Date(nowMs + 330 * 60 * 1000).toISOString().slice(0, 10);

export const monthLabel = (month, withYear = true) => {
  const [y, m] = String(month).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-IN", {
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
};

/** Every "YYYY-MM" from the month of `from` to the month of `to`. */
export const monthsBetween = (from, to) => {
  const out = [];
  let [y, m] = from.slice(0, 7).split("-").map(Number);
  const [ey, em] = to.slice(0, 7).split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
};

const shiftMonthStart = (ymd, deltaMonths) => {
  const [y, m] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + deltaMonths, 1)).toISOString().slice(0, 10);
};

/** Later of two "YYYY-MM-DD" dates. */
export const clampFrom = (from, dataFrom) => (dataFrom && from < dataFrom ? dataFrom : from);

/** { from, to } for a preset, from today's date and the earliest allowed date. Nothing is fixed in advance. */
export const presetRange = (key, today, dataFrom) => {
  const monthStart = `${today.slice(0, 7)}-01`;
  switch (key) {
    case "month":
      return { from: clampFrom(monthStart, dataFrom), to: today };
    case "quarter":
      return { from: clampFrom(shiftMonthStart(monthStart, -2), dataFrom), to: today };
    case "year":
      return { from: clampFrom(`${today.slice(0, 4)}-01-01`, dataFrom), to: today };
    default:
      return { from: clampFrom(monthStart, dataFrom), to: today };
  }
};

export const isRangeValid = (from, to, maxMonths = 36) =>
  Boolean(from && to && from <= to && monthsBetween(from, to).length <= maxMonths);
