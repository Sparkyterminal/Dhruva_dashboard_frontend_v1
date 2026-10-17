// Excel number formats and value helpers shared by every Excel export.

// Indian digit grouping (12,34,567) with a rupee sign.
export const MONEY_FORMAT =
  '[>=10000000]"₹"##\\,##\\,##\\,##0;[>=100000]"₹"##\\,##\\,##0;"₹"#,##0';
export const DATE_FORMAT = "dd-mmm-yyyy";
export const DATETIME_FORMAT = "dd-mmm-yyyy hh:mm AM/PM";
export const PERCENT_FORMAT = '0"%"';

// Excel stores dates without a time zone. Shift by the local offset so the
// sheet shows the same wall-clock time the dashboard shows.
export const toExcelDate = (value) => {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
};

export const toExcelNumber = (value) => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const toExcelText = (value) => {
  if (value == null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
};

const FORMAT_BY_TYPE = {
  money: MONEY_FORMAT,
  date: DATE_FORMAT,
  datetime: DATETIME_FORMAT,
  percent: PERCENT_FORMAT,
};

export const formatFor = (type) => FORMAT_BY_TYPE[type];

export const coerceCell = (value, type) => {
  switch (type) {
    case "money":
    case "number":
    case "percent":
      return toExcelNumber(value);
    case "date":
    case "datetime":
      return toExcelDate(value);
    default:
      return toExcelText(value);
  }
};

// Excel sheet names: max 31 chars, none of  [ ] : * ? / \
export const sanitizeSheetName = (raw) =>
  String(raw || "Sheet")
    .replace(/[[\]:*?/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31) || "Sheet";

export const makeSheetName = (raw, used = new Set()) => {
  const base = sanitizeSheetName(raw);
  let name = base;
  let i = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` (${i})`;
    name = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    i += 1;
  }
  used.add(name.toLowerCase());
  return name;
};
