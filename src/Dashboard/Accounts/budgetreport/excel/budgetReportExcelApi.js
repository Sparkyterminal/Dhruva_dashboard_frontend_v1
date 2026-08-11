import axios from "axios";
import { API_BASE_URL } from "../../../../../config";
import {
  SPREADSHEET_MODULE_BUDGET_REPORT,
  fetchSpreadsheetWorkbook,
  saveSpreadsheetWorkbook,
  listSpreadsheetWorkbooks,
} from "../../../../Components/UniverSheets/spreadsheetWorkbooksApi";
import { getWorkbookStats } from "../../../../Components/UniverSheets/workbookSnapshot";
import {
  buildBudgetReportListRow,
  getEventDisplayLabel,
  getEventId,
  getEventName,
  isBudgetReportEligibleEvent,
  parseEventsPayload,
} from "./budgetReportExcelUtils";

export { SPREADSHEET_MODULE_BUDGET_REPORT };

/**
 * Load events eligible for budget Excel (Confirmed Event + InProgress).
 * Prefers two status-filtered GETs when available; falls back to client filter.
 */
export const fetchBudgetReportEligibleEvents = async ({
  authHeaders,
  limit = 1000,
}) => {
  const byId = new Map();

  const merge = (list) => {
    (list || []).forEach((ev) => {
      if (!isBudgetReportEligibleEvent(ev)) return;
      const id = getEventId(ev);
      if (id) byId.set(String(id), ev);
    });
  };

  try {
    const [confirmedRes, inProgressRes] = await Promise.all([
      axios.get(`${API_BASE_URL}events`, {
        ...authHeaders,
        params: { page: 1, limit, status: "confirmed" },
      }),
      axios.get(`${API_BASE_URL}events`, {
        ...authHeaders,
        params: { page: 1, limit, status: "inprogress" },
      }),
    ]);
    merge(parseEventsPayload(confirmedRes));
    merge(parseEventsPayload(inProgressRes));
    if (byId.size > 0) {
      return Array.from(byId.values());
    }
  } catch {
    // Fall through to unfiltered list + client allowlist
  }

  const res = await axios.get(`${API_BASE_URL}events`, {
    ...authHeaders,
    params: { page: 1, limit },
  });
  return parseEventsPayload(res).filter(isBudgetReportEligibleEvent);
};

/**
 * @deprecated Use fetchBudgetReportEligibleEvents — kept for call-site compatibility.
 * Now returns Confirmed + InProgress events.
 */
export const fetchConfirmedEvents = fetchBudgetReportEligibleEvents;

/**
 * Fetch one event by id (for edit/view header labels).
 * Tries GET /events/:id, then falls back to scanning GET /events.
 */
export const fetchEventById = async ({ eventId, authHeaders }) => {
  if (!eventId) return null;
  const id = String(eventId);

  try {
    const res = await axios.get(`${API_BASE_URL}events/${id}`, authHeaders);
    const ev = res.data?.event || res.data?.data || res.data;
    if (ev && typeof ev === "object" && (ev._id || ev.id || ev.eventName)) {
      return ev;
    }
  } catch {
    // fall through to list lookup
  }

  try {
    const list = await fetchBudgetReportEligibleEvents({ authHeaders });
    const found = list.find((e) => String(getEventId(e)) === id);
    if (found) return found;
  } catch {
    // ignore
  }

  // Last resort: unfiltered events list (in case eligibility filter excludes it)
  try {
    const res = await axios.get(`${API_BASE_URL}events`, {
      ...authHeaders,
      params: { page: 1, limit: 1000 },
    });
    const all = parseEventsPayload(res);
    return all.find((e) => String(getEventId(e)) === id) || null;
  } catch {
    return null;
  }
};

/**
 * Load the Univer workbook mapped to an eligible event (Confirmed or InProgress).
 * key = eventId, module = budget-report
 */
export const fetchBudgetReportWorkbook = async ({ eventId, authHeaders }) => {
  const key = String(eventId);
  return fetchSpreadsheetWorkbook({
    module: SPREADSHEET_MODULE_BUDGET_REPORT,
    key,
    authHeaders,
  });
};

/**
 * Save full multi-sheet workbook for an eligible event (Confirmed or InProgress).
 */
export const saveBudgetReportWorkbook = async ({
  eventId,
  event,
  title,
  workbookData,
  version,
  authHeaders,
}) => {
  const key = String(eventId);
  const stats = getWorkbookStats(workbookData);
  const eventName =
    event?.eventName != null
      ? getEventName(event.eventName)
      : title || "Budget Report";
  const clientName = event?.clientName || event?.client?.name || "";

  return saveSpreadsheetWorkbook({
    module: SPREADSHEET_MODULE_BUDGET_REPORT,
    key,
    title:
      title ||
      (event ? `Budget Report — ${getEventDisplayLabel(event)}` : `Budget Report — ${key}`),
    workbookData,
    version,
    meta: {
      eventId: key,
      eventName,
      clientName,
      sheetCount: stats.sheetCount,
      sheetNames: stats.sheetNames,
      cellCount: stats.cellCount,
    },
    authHeaders,
  });
};

/**
 * True when an event payload indicates a budget Excel (or legacy) report exists.
 * Matches GET /events list fields: budgetReport + budgetReportsCount.
 */
export const eventHasBudgetReport = (event) => {
  if (!event) return false;
  if (Number(event.budgetReportsCount) > 0) return true;
  if (event.hasBudgetReport === true) return true;
  const br = event.budgetReport;
  if (!br) return false;
  if (typeof br === "string" && br.trim()) return true;
  if (typeof br === "object") {
    if (br._id || br.id || br.key || br.module) return true;
    if (br.workbookData) return true;
    // Non-empty plain object from API
    if (Object.keys(br).length > 0) return true;
  }
  return false;
};

/**
 * Resolve source event id used as spreadsheet key for clone.
 */
export const getBudgetReportSourceEventId = (event) => {
  if (!event) return null;
  const br = event.budgetReport;
  if (br && typeof br === "object") {
    if (br.key) return String(br.key);
    if (br.meta?.eventId) return String(br.meta.eventId);
    if (br.eventId) return String(br.eventId);
  }
  return getEventId(event) ? String(getEventId(event)) : null;
};

/**
 * Clone budget Excel workbook from one event onto another.
 *
 * Preferred: POST /spreadsheet-workbooks/clone
 * Fallback: GET source workbook → PUT under target event key (version 0 create)
 * Legacy fallback: POST /budget-report/:id/clone { eventId }
 */
export const cloneBudgetReportWorkbook = async ({
  sourceEventId,
  targetEventId,
  targetEvent,
  sourceReportId,
  authHeaders,
}) => {
  const sourceKey = String(sourceEventId || "");
  const targetKey = String(targetEventId || "");
  if (!sourceKey || !targetKey) {
    const err = new Error("Source and target event ids are required to clone.");
    err.code = "INVALID_CLONE";
    throw err;
  }
  if (sourceKey === targetKey) {
    const err = new Error("Cannot clone a budget report onto the same event.");
    err.code = "INVALID_CLONE";
    throw err;
  }

  // 1) Dedicated clone endpoint
  try {
    const res = await axios.post(
      `${API_BASE_URL}spreadsheet-workbooks/clone`,
      {
        module: SPREADSHEET_MODULE_BUDGET_REPORT,
        sourceKey,
        targetKey,
        meta: targetEvent
          ? {
              eventId: targetKey,
              eventName: getEventName(targetEvent.eventName),
              clientName: targetEvent.clientName || "",
            }
          : { eventId: targetKey },
      },
      {
        ...authHeaders,
        timeout: 120000,
      },
    );
    return {
      source: "api-clone",
      data: res.data,
    };
  } catch (err) {
    const status = err?.response?.status;
    if (status && status !== 404 && status !== 501) {
      throw err;
    }
  }

  // 2) Client-side full workbook copy (Excel)
  const sourceDoc = await fetchBudgetReportWorkbook({
    eventId: sourceKey,
    authHeaders,
  });
  if (!sourceDoc?.workbookData) {
    // 3) Legacy AG Grid clone if we have a report document id
    if (sourceReportId) {
      const res = await axios.post(
        `${API_BASE_URL}budget-report/${sourceReportId}/clone`,
        { eventId: targetKey },
        authHeaders,
      );
      return { source: "legacy-clone", data: res.data };
    }
    const err = new Error(
      "Source event has no budget report Excel to clone.",
    );
    err.code = "NO_SOURCE_WORKBOOK";
    throw err;
  }

  const targetDoc = await fetchBudgetReportWorkbook({
    eventId: targetKey,
    authHeaders,
  });
  if (targetDoc?.workbookData && (targetDoc.version > 0 || targetDoc._id)) {
    const err = new Error(
      "This event already has a budget report. View/Edit it instead of cloning.",
    );
    err.code = "TARGET_EXISTS";
    throw err;
  }

  const saved = await saveBudgetReportWorkbook({
    eventId: targetKey,
    event: targetEvent,
    workbookData: sourceDoc.workbookData,
    version: 0,
    authHeaders,
  });
  return { source: "client-copy", data: saved };
};

/**
 * Load clone source options: events that already have a budget report.
 */
export const fetchBudgetReportCloneSources = async ({
  authHeaders,
  excludeEventId,
}) => {
  const exclude = excludeEventId != null ? String(excludeEventId) : "";

  // Prefer spreadsheet list (Excel module)
  try {
    const list = await listSpreadsheetWorkbooks({
      module: SPREADSHEET_MODULE_BUDGET_REPORT,
      authHeaders,
    });
    if (list.available && list.items?.length) {
      return list.items
        .filter((wb) => {
          const id = String(wb.eventId || wb.key || "");
          return id && id !== exclude;
        })
        .map((wb) => ({
          sourceEventId: String(wb.eventId || wb.key),
          sourceReportId: wb._id || null,
          label:
            [wb.eventName, wb.clientName].filter(Boolean).join(" - ") ||
            String(wb.eventId || wb.key),
          eventName: wb.eventName || "",
          clientName: wb.clientName || "",
          sheetCount: wb.sheetCount || 0,
          updatedAt: wb.updatedAt,
        }));
    }
  } catch {
    // fall through to events list
  }

  const res = await axios.get(`${API_BASE_URL}events`, {
    ...authHeaders,
    params: { page: 1, limit: 1000 },
  });
  const bookings = parseEventsPayload(res);
  return bookings
    .filter((ev) => {
      if (!eventHasBudgetReport(ev)) return false;
      if (String(getEventId(ev)) === exclude) return false;
      return true;
    })
    .map((ev) => {
      const br = ev.budgetReport;
      const reportId =
        typeof br === "string"
          ? br
          : br?._id != null
            ? String(br._id)
            : null;
      return {
        sourceEventId: String(getEventId(ev)),
        sourceReportId: reportId,
        label: getEventDisplayLabel(ev),
        eventName: getEventName(ev.eventName),
        clientName: ev.clientName || "",
        sheetCount: br?.meta?.sheetCount ?? br?.sheetCount ?? 0,
        updatedAt: br?.updatedAt || ev.updatedAt,
        event: ev,
      };
    });
};

/**
 * Build the event-wise list:
 * 1) Prefer GET list of budget-report workbooks (meta only)
 * 2) Enrich with eligible events (Confirmed + InProgress) when possible
 * 3) Fallback: eligible events when workbook list endpoint is unavailable
 */
export const fetchBudgetReportExcelList = async ({
  authHeaders,
  search = "",
}) => {
  const [workbookList, eligibleEvents] = await Promise.all([
    listSpreadsheetWorkbooks({
      module: SPREADSHEET_MODULE_BUDGET_REPORT,
      authHeaders,
    }),
    fetchBudgetReportEligibleEvents({ authHeaders }).catch(() => []),
  ]);

  const workbooks = workbookList.items || [];
  const listAvailable = workbookList.available === true;

  const eventById = new Map();
  eligibleEvents.forEach((ev) => {
    const id = getEventId(ev);
    if (id) eventById.set(String(id), ev);
  });

  let rows = [];

  if (listAvailable) {
    rows = workbooks.map((wb) => {
      const eventId = String(wb.eventId || wb.key || "");
      const event = eventById.get(eventId) || null;
      return buildBudgetReportListRow({
        eventId,
        eventName:
          wb.eventName ||
          (event ? getEventName(event.eventName) : "") ||
          eventId,
        clientName: wb.clientName || event?.clientName || "",
        updatedAt: wb.updatedAt,
        version: wb.version,
        sheetCount: wb.sheetCount || wb.stats?.sheetCount || 0,
        workbookId: wb._id,
        hasWorkbook: true,
        event,
      });
    });
  } else {
    // List endpoint not ready — show eligible events; View/Edit load workbook.
    rows = eligibleEvents.map((ev) => {
      const eventId = String(getEventId(ev));
      return buildBudgetReportListRow({
        eventId,
        eventName: getEventName(ev.eventName),
        clientName: ev.clientName || "",
        updatedAt: null,
        version: 0,
        sheetCount: 0,
        workbookId: null,
        hasWorkbook: false,
        event: ev,
      });
    });
  }

  const q = String(search || "").trim().toLowerCase();
  if (q) {
    rows = rows.filter((r) => {
      const hay = `${r.eventName} ${r.clientName} ${r.eventId}`.toLowerCase();
      return hay.includes(q);
    });
  }

  rows.sort((a, b) => {
    const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    if (tb !== ta) return tb - ta;
    return String(a.eventName).localeCompare(String(b.eventName));
  });

  return rows;
};
