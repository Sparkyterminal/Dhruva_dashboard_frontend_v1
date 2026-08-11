import axios from "axios";
import { API_BASE_URL } from "../../../../config";
import {
  createDefaultRows,
  getEventDisplayLabel,
  getEventId,
  normalizeExpenseRows,
  prepareRowsForApi,
} from "./expensesUtils";

const STORAGE_PREFIX = "dhruva-expenses-v1";

const storageKey = (userId, date) => `${STORAGE_PREFIX}-${userId || "anon"}-${date}`;

const readLocal = (userId, date) => {
  try {
    const raw = localStorage.getItem(storageKey(userId, date));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return normalizeExpenseRows(parsed?.rows || parsed?.items || parsed);
  } catch {
    return null;
  }
};

const writeLocal = (userId, date, rows) => {
  localStorage.setItem(
    storageKey(userId, date),
    JSON.stringify({
      date,
      rows: prepareRowsForApi(rows),
      updatedAt: new Date().toISOString(),
    }),
  );
};

/**
 * Load events for Event Reference dropdown (`GET /events`).
 */
export const fetchEventsForExpenses = async ({ authHeaders, limit = 500 }) => {
  const res = await axios.get(`${API_BASE_URL}events`, {
    ...authHeaders,
    params: { page: 1, limit },
  });
  const data = res?.data || {};
  const list = Array.isArray(data.events)
    ? data.events
    : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];
  return list
    .filter((ev) => getEventId(ev))
    .map((ev) => ({
      id: String(getEventId(ev)),
      label: getEventDisplayLabel(ev),
      raw: ev,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * Fetch expenses for a business date.
 * Falls back to localStorage when API is unavailable (404/501/network).
 */
export const fetchExpensesByDate = async ({ date, authHeaders, userId }) => {
  try {
    const res = await axios.get(`${API_BASE_URL}expenses`, {
      ...authHeaders,
      params: { date },
    });
    const raw = res?.data?.rows ?? res?.data?.items ?? res?.data?.data ?? [];
    const rows = normalizeExpenseRows(raw);
    if (rows.length === 0) {
      return { rows: createDefaultRows(), source: "api-empty" };
    }
    writeLocal(userId, date, rows);
    return { rows, source: "api" };
  } catch (err) {
    const status = err?.response?.status;
    if (status && status !== 404 && status !== 501) {
      throw err;
    }
    const cached = readLocal(userId, date);
    if (cached?.length) {
      return { rows: cached, source: "local" };
    }
    return { rows: createDefaultRows(), source: "local-default" };
  }
};

/**
 * Save all rows for a date (bulk upsert).
 */
export const saveExpensesByDate = async ({
  date,
  rows,
  authHeaders,
  userId,
}) => {
  const payload = {
    date,
    rows: prepareRowsForApi(rows),
  };

  try {
    const res = await axios.put(`${API_BASE_URL}expenses`, payload, authHeaders);
    writeLocal(userId, date, payload.rows);
    return { ok: true, source: "api", data: res?.data };
  } catch (err) {
    const status = err?.response?.status;
    if (status && status !== 404 && status !== 501) {
      throw err;
    }
    writeLocal(userId, date, payload.rows);
    return { ok: true, source: "local", data: null };
  }
};
