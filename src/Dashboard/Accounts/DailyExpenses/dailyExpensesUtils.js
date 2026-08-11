import dayjs from "dayjs";

/** Normalize any date-like value to YYYY-MM-DD business date key. */
export const toBusinessDate = (value) => {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const d = dayjs(value);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
};

export const todayBusinessDate = () => dayjs().format("YYYY-MM-DD");

export const formatDisplayDate = (value) => {
  const key = toBusinessDate(value);
  if (!key) return "—";
  return dayjs(key).format("DD MMM YYYY");
};

export const buildDailyExpenseListRow = ({
  date,
  updatedAt = null,
  version = 0,
  sheetCount = 0,
  sheetNames = [],
  workbookId = null,
  title = "",
}) => {
  const dateKey = toBusinessDate(date);
  const names = Array.isArray(sheetNames)
    ? sheetNames.map((n) => String(n || "").trim()).filter(Boolean)
    : [];
  return {
    key: dateKey,
    date: dateKey,
    title: title || `Daily Expenses — ${formatDisplayDate(dateKey)}`,
    updatedAt,
    version,
    sheetCount: Number(sheetCount) || names.length || 0,
    sheetNames: names,
    workbookId,
  };
};

/** Client-side filter when backend list has no from/to support. */
export const filterRowsByDateRange = (rows, from, to) => {
  const fromKey = toBusinessDate(from);
  const toKey = toBusinessDate(to);
  return (rows || []).filter((row) => {
    const d = toBusinessDate(row.date);
    if (!d) return false;
    if (fromKey && d < fromKey) return false;
    if (toKey && d > toKey) return false;
    return true;
  });
};
