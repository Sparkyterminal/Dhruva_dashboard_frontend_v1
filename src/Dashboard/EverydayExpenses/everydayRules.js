// Everyday Expenses rules. The server computes and stores the real result; these functions
// drive the live "You will get ₹X" preview and the form checks, and must match the contract:
// docs/api/everyday-expenses/EVERYDAY_EXPENSES_BACKEND.md (sections 2 and 3).

export const GRADES = {
  JUNIOR_STAFF: "Junior Staff",
  EXECUTIVE: "Executive / Coordinator",
  SENIOR_EXECUTIVE: "Senior Executive",
  MANAGER: "Manager",
};
export const GRADE_KEYS = Object.keys(GRADES);
export const DEFAULT_GRADE = "JUNIOR_STAFF";

export const CALC_TYPES = {
  ACTUAL: "Actual amount (optional limit)",
  PER_UNIT: "Rate × units (for example ₹ per km)",
  CAPPED_PER_UNIT: "Actual, up to a limit per unit (nights / days)",
  FIXED_MAX: "Actual, up to a fixed maximum",
};

export const round2 = (x) => Math.round((Number(x) + Number.EPSILON) * 100) / 100;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const formatMoney = (n) => {
  const v = num(n);
  const digits = Number.isInteger(v) ? 0 : 2;
  return `₹${Math.abs(v).toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
};

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** A duty that ends after `afterTime` qualifies; so does one ending after midnight (before 06:00). */
export const qualifiesAfterTime = (dutyEndTime, afterTime) => {
  if (!TIME_RE.test(dutyEndTime)) return false;
  const t = toMinutes(dutyEndTime);
  return t > toMinutes(afterTime) || t < 6 * 60;
};

/** The per-unit limit for a category: the grade's own limit when the category has one, else the plain cap. */
export const limitFor = (category, grade = DEFAULT_GRADE) => {
  const byGrade = category?.capByGrade;
  const own = byGrade && num(byGrade[grade]) > 0 ? num(byGrade[grade]) : null;
  return own ?? (num(category?.cap) > 0 ? num(category.cap) : null);
};

/**
 * Works out what the company will reimburse for one entry and what is wrong with it.
 *   entry: { amount, units, dutyEndTime, companyProvided, priorApproval: { approvedBy } }
 *   billCount: number of bills attached; otherClaimsSameDay: the person's other non-rejected
 *   entries in this category on the same expense date.
 * @returns {{ reimbursable: number, cappedBy: string|null, errors: Object<string,string>, valid: boolean }}
 */
export const evaluateEntry = ({ category, grade = DEFAULT_GRADE, entry = {}, billCount = 0, otherClaimsSameDay = 0 }) => {
  const errors = {};
  if (!category) return { reimbursable: 0, cappedBy: null, errors: { categoryId: "Select a category" }, valid: false };

  const amount = num(entry.amount);
  const units = num(entry.units);
  const unit = category.unitLabel || "unit";

  // 1. Arranged by the company, venue or client: nothing is payable.
  if (category.companyProvidedZero && entry.companyProvided) {
    return { reimbursable: 0, cappedBy: "Arranged by company/venue/client", errors, valid: true };
  }

  // Inputs the category asks for.
  if (category.calcType === "PER_UNIT") {
    if (!(units > 0)) errors.units = `Enter the ${unit}s`;
  } else {
    if (!(amount > 0)) errors.amount = "Enter an amount greater than 0";
    if (category.calcType === "CAPPED_PER_UNIT" && !(Number.isInteger(units) && units >= 1)) {
      errors.units = `Enter the number of ${unit}s (1 or more)`;
    }
  }

  // 2. Only after a given time (night food).
  if (category.afterTime) {
    if (!TIME_RE.test(entry.dutyEndTime || "")) errors.dutyEndTime = "Enter the time your duty ended";
    else if (!qualifiesAfterTime(entry.dutyEndTime, category.afterTime)) {
      errors.dutyEndTime = `Not eligible: duty must end after ${category.afterTime}`;
    }
  }

  // 3. Claims per day.
  if (category.maxClaimsPerDay && otherClaimsSameDay >= category.maxClaimsPerDay) {
    errors.categoryId = `Only ${plural(category.maxClaimsPerDay, "claim")} per day is allowed for ${category.name}`;
  }

  // 4. Prior approval above a limit.
  if (category.approvalAbove && amount > category.approvalAbove && !String(entry.priorApproval?.approvedBy || "").trim()) {
    errors.priorApproval = `Needs prior approval above ${formatMoney(category.approvalAbove)}. Enter who approved it.`;
  }

  // 5. Bill.
  if (category.requiresBill && billCount < 1) errors.bills = "Attach the bill";

  // The amount itself.
  let reimbursable = 0;
  let cappedBy = null;
  const limit = limitFor(category, grade);
  switch (category.calcType) {
    case "PER_UNIT":
      reimbursable = round2(units * num(category.rate));
      cappedBy = units > 0 ? `${formatMoney(category.rate)} per ${unit} × ${units} ${unit}` : null;
      break;
    case "CAPPED_PER_UNIT": {
      const max = limit != null && units > 0 ? round2(limit * units) : null;
      reimbursable = max != null ? Math.min(amount, max) : amount;
      if (max != null && amount > max) {
        const who = category.capByGrade ? ` (${GRADES[grade] || grade})` : "";
        cappedBy = `${category.name} limit ${formatMoney(max)} for ${plural(units, unit)}${who}`;
      }
      break;
    }
    case "FIXED_MAX":
      reimbursable = limit != null ? Math.min(amount, limit) : amount;
      if (limit != null && amount > limit) {
        cappedBy = `Capped at ${formatMoney(limit)}${category.maxClaimsPerDay === 1 ? " per day" : " per claim"}`;
      }
      break;
    default: // ACTUAL
      reimbursable = limit != null ? Math.min(amount, limit) : amount;
      if (limit != null && amount > limit) cappedBy = `Capped at ${formatMoney(limit)}`;
  }

  const valid = Object.keys(errors).length === 0;
  return { reimbursable: valid ? round2(reimbursable) : 0, cappedBy: valid ? cappedBy : null, errors, valid };
};

// ---- Time (India time, no daylight saving) ----

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" of the given instant in India time, whatever the device's time zone is. */
export const istDay = (ms) => new Date(ms + IST_OFFSET_MS).toISOString().slice(0, 10);

/** Milliseconds from `ms` until the next 00:00:00 India time. */
export const msUntilIstMidnight = (ms) => {
  const t = ms + IST_OFFSET_MS;
  return (Math.floor(t / DAY_MS) + 1) * DAY_MS - t;
};

/** { locked, msLeft } for an entry, given the (server-corrected) current time. */
export const lockInfo = (entry, nowMs) => {
  const until = Date.parse(entry?.editableUntil);
  if (!Number.isFinite(until)) return { locked: true, msLeft: 0 };
  const msLeft = until - nowMs;
  return { locked: msLeft <= 0, msLeft: Math.max(msLeft, 0) };
};

/** "3h 12m", "12m 05s", "42s". */
export const formatCountdown = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
};

/** "YYYY-MM-DD" minus `days` days (pure calendar arithmetic). */
export const subtractDays = (ymd, days) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10);
};
