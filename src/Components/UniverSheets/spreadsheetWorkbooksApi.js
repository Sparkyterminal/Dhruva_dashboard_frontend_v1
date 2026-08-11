import axios from "axios";
import { API_BASE_URL } from "../../../config";
import {
  cloneWorkbookData,
  getWorkbookStats,
  isValidWorkbookData,
  prepareWorkbookSnapshotForSave,
} from "./workbookSnapshot";

export const SPREADSHEET_MODULE_CLIENT_LEADS = "client-leads";
export const SPREADSHEET_MODULE_BUDGET_REPORT = "budget-report";
export const SPREADSHEET_MODULE_DAILY_EXPENSES = "daily-expenses";
export const SPREADSHEET_MODULE_DAYBOOK_INFLOW = "daybook-inflow";
export const SPREADSHEET_MODULE_DAYBOOK_OUTFLOW = "daybook-outflow";
export const SPREADSHEET_KEY_DEFAULT = "default";

/** Large multi-sheet workbooks need a longer timeout than the default. */
const WORKBOOK_REQUEST_TIMEOUT_MS = 120000;

/**
 * Normalize GET /spreadsheet-workbooks response into a stable shape.
 * Accepts either a bare document or `{ data: document }`.
 * Prefer a payload that already has `workbookData` / `module` at the top level
 * so a stray `data` field does not replace the real document.
 *
 * Always deep-clones `workbookData` so every sheet + cellData is preserved
 * and detached from the axios response object.
 */
export const normalizeWorkbookResponse = (raw) => {
  const root = raw && typeof raw === "object" ? raw : {};
  const nested = root.data && typeof root.data === "object" ? root.data : null;
  const data =
    root.workbookData != null || root.module != null || root.key != null
      ? root
      : nested &&
          (nested.workbookData != null ||
            nested.module != null ||
            nested.key != null)
        ? nested
        : nested || root;

  const workbookDataRaw =
    data.workbookData && typeof data.workbookData === "object"
      ? data.workbookData
      : null;

  // Full multi-sheet clone (includes all tabs under sheets + sheetOrder)
  const workbookData = workbookDataRaw
    ? prepareWorkbookSnapshotForSave(workbookDataRaw) ||
      cloneWorkbookData(workbookDataRaw)
    : null;

  const version =
    typeof data.version === "number" && !Number.isNaN(data.version)
      ? data.version
      : 0;

  return {
    _id: data._id ?? data.id ?? null,
    module: data.module ?? null,
    key: data.key ?? null,
    title: data.title ?? "",
    workbookData,
    version,
    updatedAt: data.updatedAt ?? null,
    updatedBy: data.updatedBy ?? null,
    meta: data.meta && typeof data.meta === "object" ? data.meta : {},
    stats: getWorkbookStats(workbookData),
    raw: data,
  };
};

/**
 * GET /spreadsheet-workbooks?module=&key=
 * Missing workbook (404 or null workbookData) → blank sheet (version 0).
 */
export const fetchSpreadsheetWorkbook = async ({
  module,
  key = SPREADSHEET_KEY_DEFAULT,
  authHeaders,
}) => {
  try {
    const res = await axios.get(`${API_BASE_URL}spreadsheet-workbooks`, {
      ...authHeaders,
      params: { module, key },
      timeout: WORKBOOK_REQUEST_TIMEOUT_MS,
    });
    return normalizeWorkbookResponse(res.data);
  } catch (err) {
    if (err?.response?.status === 404) {
      return {
        _id: null,
        module,
        key,
        title: "",
        workbookData: null,
        version: 0,
        updatedAt: null,
        updatedBy: null,
        meta: {},
        stats: { sheetCount: 0, cellCount: 0, sheetNames: [] },
        raw: null,
      };
    }
    throw err;
  }
};

/**
 * PUT /spreadsheet-workbooks
 * Sends the FULL workbook snapshot (all sheets). Backend must replace
 * `workbookData` entirely — not merge only the active sheet.
 */
export const saveSpreadsheetWorkbook = async ({
  module,
  key = SPREADSHEET_KEY_DEFAULT,
  title,
  workbookData,
  version,
  meta,
  authHeaders,
}) => {
  const snapshot = prepareWorkbookSnapshotForSave(workbookData);
  if (!snapshot || !isValidWorkbookData(snapshot)) {
    const err = new Error("Invalid workbook snapshot — nothing to save.");
    err.code = "INVALID_WORKBOOK";
    throw err;
  }

  const res = await axios.put(
    `${API_BASE_URL}spreadsheet-workbooks`,
    {
      module,
      key,
      ...(title != null ? { title } : {}),
      // Entire IWorkbookData: sheetOrder + sheets[id].cellData for EVERY tab
      workbookData: snapshot,
      version: typeof version === "number" ? version : 0,
      ...(meta && typeof meta === "object" ? { meta } : {}),
    },
    {
      ...authHeaders,
      timeout: WORKBOOK_REQUEST_TIMEOUT_MS,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    },
  );
  return normalizeWorkbookResponse(res.data);
};

/**
 * List workbook metadata for a module (no full workbookData preferred).
 * GET /spreadsheet-workbooks?module=...&list=1
 *
 * Returns `{ items, available }` where `available=false` means the list
 * endpoint is not implemented (404/501) so callers can fall back.
 */
export const listSpreadsheetWorkbooks = async ({
  module,
  authHeaders,
  from,
  to,
  date,
}) => {
  try {
    const params = { module, list: 1 };
    if (from) params.from = from;
    if (to) params.to = to;
    if (date) params.date = date;

    const res = await axios.get(`${API_BASE_URL}spreadsheet-workbooks`, {
      ...authHeaders,
      params,
      timeout: WORKBOOK_REQUEST_TIMEOUT_MS,
    });
    const root = res?.data;
    const raw = Array.isArray(root)
      ? root
      : Array.isArray(root?.data)
        ? root.data
        : Array.isArray(root?.workbooks)
          ? root.workbooks
          : Array.isArray(root?.items)
            ? root.items
            : [];

    const items = raw.map((item) => {
      const doc = normalizeWorkbookResponse(item);
      const meta =
        item?.meta && typeof item.meta === "object"
          ? item.meta
          : doc.raw?.meta && typeof doc.raw.meta === "object"
            ? doc.raw.meta
            : {};
      return {
        ...doc,
        workbookData: item?.workbookData ? doc.workbookData : null,
        meta,
        eventId: meta.eventId || doc.key || null,
        eventName: meta.eventName || "",
        clientName: meta.clientName || "",
        date: meta.date || doc.key || null,
        sheetCount:
          meta.sheetCount ??
          doc.stats?.sheetCount ??
          (Array.isArray(meta.sheetNames) ? meta.sheetNames.length : 0),
      };
    });
    return { items, available: true };
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404 || status === 501) {
      return { items: [], available: false };
    }
    throw err;
  }
};
