import {
  SPREADSHEET_MODULE_DAILY_EXPENSES,
  fetchSpreadsheetWorkbook,
  saveSpreadsheetWorkbook,
  listSpreadsheetWorkbooks,
} from "../../../Components/UniverSheets/spreadsheetWorkbooksApi";
import { getWorkbookStats } from "../../../Components/UniverSheets/workbookSnapshot";
import {
  buildDailyExpenseListRow,
  filterRowsByDateRange,
  formatDisplayDate,
  toBusinessDate,
  todayBusinessDate,
} from "./dailyExpensesUtils";

export { SPREADSHEET_MODULE_DAILY_EXPENSES };

/**
 * One workbook per business date.
 * module = daily-expenses, key = YYYY-MM-DD
 */
export const fetchDailyExpenseWorkbook = async ({ date, authHeaders }) => {
  const key = toBusinessDate(date) || todayBusinessDate();
  return fetchSpreadsheetWorkbook({
    module: SPREADSHEET_MODULE_DAILY_EXPENSES,
    key,
    authHeaders,
  });
};

/**
 * Save full multi-sheet workbook for a business date.
 */
export const saveDailyExpenseWorkbook = async ({
  date,
  title,
  workbookData,
  version,
  authHeaders,
}) => {
  const key = toBusinessDate(date);
  if (!key) {
    const err = new Error("A valid business date (YYYY-MM-DD) is required.");
    err.code = "INVALID_DATE";
    throw err;
  }

  const stats = getWorkbookStats(workbookData);

  return saveSpreadsheetWorkbook({
    module: SPREADSHEET_MODULE_DAILY_EXPENSES,
    key,
    title: title || `Daily Expenses — ${formatDisplayDate(key)}`,
    workbookData,
    version,
    meta: {
      date: key,
      sheetCount: stats.sheetCount,
      sheetNames: stats.sheetNames,
      cellCount: stats.cellCount,
    },
    authHeaders,
  });
};

/**
 * List daily expense workbooks.
 * Today tab: date=today
 * All tab: optional from/to (YYYY-MM-DD)
 */
export const fetchDailyExpenseList = async ({
  authHeaders,
  mode = "all",
  from,
  to,
}) => {
  const today = todayBusinessDate();

  if (mode === "today") {
    const list = await listSpreadsheetWorkbooks({
      module: SPREADSHEET_MODULE_DAILY_EXPENSES,
      authHeaders,
      date: today,
    });

    if (list.available) {
      const rows = (list.items || [])
        .map((wb) =>
          buildDailyExpenseListRow({
            date: wb.date || wb.key || wb.meta?.date,
            updatedAt: wb.updatedAt,
            version: wb.version,
            sheetCount: wb.sheetCount || wb.stats?.sheetCount || 0,
            sheetNames: wb.sheetNames || wb.meta?.sheetNames || wb.stats?.sheetNames,
            workbookId: wb._id,
            title: wb.title,
          }),
        )
        .filter((r) => r.date === today);

      // If list returned nothing for today, still probe single GET so UI can show empty/create state
      if (rows.length === 0) {
        try {
          const doc = await fetchDailyExpenseWorkbook({
            date: today,
            authHeaders,
          });
          if (doc?.workbookData || doc?.version > 0 || doc?._id) {
            return [
              buildDailyExpenseListRow({
                date: today,
                updatedAt: doc.updatedAt,
                version: doc.version,
                sheetCount: doc.stats?.sheetCount || doc.meta?.sheetCount || 0,
                sheetNames: doc.stats?.sheetNames || doc.meta?.sheetNames,
                workbookId: doc._id,
                title: doc.title,
              }),
            ];
          }
        } catch {
          // no workbook for today
        }
      }
      return rows;
    }

    // List endpoint unavailable — probe today's workbook only
    try {
      const doc = await fetchDailyExpenseWorkbook({ date: today, authHeaders });
      if (doc?.workbookData || doc?.version > 0 || doc?._id) {
        return [
          buildDailyExpenseListRow({
            date: today,
            updatedAt: doc.updatedAt,
            version: doc.version,
            sheetCount: doc.stats?.sheetCount || doc.meta?.sheetCount || 0,
            sheetNames: doc.stats?.sheetNames || doc.meta?.sheetNames,
            workbookId: doc._id,
            title: doc.title,
          }),
        ];
      }
    } catch {
      // empty
    }
    return [];
  }

  // All tab
  const fromKey = toBusinessDate(from);
  const toKey = toBusinessDate(to);

  const list = await listSpreadsheetWorkbooks({
    module: SPREADSHEET_MODULE_DAILY_EXPENSES,
    authHeaders,
    from: fromKey || undefined,
    to: toKey || undefined,
  });

  let rows = (list.items || []).map((wb) =>
    buildDailyExpenseListRow({
      date: wb.date || wb.key || wb.meta?.date,
      updatedAt: wb.updatedAt,
      version: wb.version,
      sheetCount: wb.sheetCount || wb.stats?.sheetCount || 0,
      sheetNames: wb.sheetNames || wb.meta?.sheetNames || wb.stats?.sheetNames,
      workbookId: wb._id,
      title: wb.title,
    }),
  );

  // Always apply client filter (backend may ignore from/to until implemented)
  if (fromKey || toKey) {
    rows = filterRowsByDateRange(rows, fromKey, toKey);
  }

  // Exclude today from All? User said "today tab and rest in the all tab"
  // So All = everything else OR everything including with filter. "rest" suggests exclude today.
  // I'll exclude today from All tab for clearer separation.
  rows = rows.filter((r) => r.date !== today);

  rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return rows;
};
