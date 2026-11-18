import dayjs from "dayjs";
import axiosClient from "@/api/axiosClient";
import { mapLimit } from "@/lib/async";
import { round2 } from "./daybookMath";

// Contract: docs/api/daybook/DAYBOOK_V2_BACKEND.md

const DEFAULT_LIMIT = 200;

const toYMD = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value?.format === "function") return value.format("YYYY-MM-DD");
  return String(value);
};

export const fetchDaybookRange = async ({
  startDate,
  endDate,
  limit = DEFAULT_LIMIT,
  authHeaders,
}) => {
  const res = await axiosClient.get(`daybook`, {
    ...authHeaders,
    params: { startDate: toYMD(startDate), endDate: toYMD(endDate), limit },
  });
  return res?.data;
};

export const createInflow = async ({ payload, authHeaders }) =>
  (await axiosClient.post(`daybook/inflows`, payload, authHeaders))?.data;

export const updateInflow = async ({ id, payload, authHeaders }) =>
  (await axiosClient.put(`daybook/inflows/${id}`, payload, authHeaders))?.data;

export const deleteInflow = async ({ id, authHeaders }) =>
  (await axiosClient.delete(`daybook/inflows/${id}`, authHeaders))?.data;

export const createOutflow = async ({ payload, authHeaders }) =>
  (await axiosClient.post(`daybook/outflows`, payload, authHeaders))?.data;

export const updateOutflow = async ({ id, payload, authHeaders }) =>
  (await axiosClient.put(`daybook/outflows/${id}`, payload, authHeaders))?.data;

export const deleteOutflow = async ({ id, authHeaders }) =>
  (await axiosClient.delete(`daybook/outflows/${id}`, authHeaders))?.data;

export const fetchOpeningBalance = async ({ authHeaders }) =>
  (await axiosClient.get(`daybook/opening-balance`, authHeaders))?.data;

export const saveOpeningBalance = async ({ payload, authHeaders }) =>
  (await axiosClient.put(`daybook/opening-balance`, payload, authHeaders))?.data;

/** Vendor list for the outflow picker. */
export const fetchVendors = async ({ authHeaders }) => {
  const res = await axiosClient.get(`vendor/all`, authHeaders);
  return Array.isArray(res?.data?.vendors) ? res.data.vendors : [];
};

export const fetchEventsMinimal = async ({ query = "", authHeaders }) => {
  const res = await axiosClient.get(`events/minimal`, {
    ...authHeaders,
    params: query ? { search: query } : {},
  });
  // expected shapes: { events: [...] } | { data: [...] } | [...]
  return res?.data?.events || res?.data?.data || res?.data || [];
};

// GET /daybook returns at most 1000 rows per list, so long periods are fetched
// one calendar month at a time and joined. Balances are calculated per day by the
// server from the opening balance, so month chunks can simply be joined.
const MAX_ROWS_PER_REQUEST = 1000;
const CHUNK_CONCURRENCY = 3;

const monthWindows = (startDate, endDate) => {
  const windows = [];
  const last = dayjs(endDate);
  let cursor = dayjs(startDate);
  while (!cursor.isAfter(last, "day")) {
    const monthEnd = cursor.endOf("month");
    const end = monthEnd.isAfter(last, "day") ? last : monthEnd;
    windows.push({ start: cursor.format("YYYY-MM-DD"), end: end.format("YYYY-MM-DD") });
    cursor = end.add(1, "day");
  }
  return windows;
};

const num = (v) => Number(v) || 0;
const sumKey = (parts, pick) => round2(parts.reduce((t, p) => t + num(pick(p)), 0));

/**
 * Whole-period daybook: same shape as fetchDaybookRange plus `truncated`, which
 * is true if any single month still had more rows than the API returns.
 */
export const fetchDaybookAll = async ({ startDate, endDate, authHeaders, onProgress }) => {
  const windows = monthWindows(toYMD(startDate), toYMD(endDate));
  let done = 0;
  const parts = await mapLimit(windows, CHUNK_CONCURRENCY, async (w) => {
    const data = await fetchDaybookRange({
      startDate: w.start,
      endDate: w.end,
      limit: MAX_ROWS_PER_REQUEST,
      authHeaders,
    });
    done += 1;
    onProgress?.(done, windows.length);
    return data || {};
  });

  const inflowTotals = {
    gross: sumKey(parts, (p) => p.inflow?.totals?.gross),
    gst: sumKey(parts, (p) => p.inflow?.totals?.gst),
    tds: sumKey(parts, (p) => p.inflow?.totals?.tds),
    net: sumKey(parts, (p) => p.inflow?.totals?.net),
  };
  const outflowTotals = {
    amountPaid: sumKey(parts, (p) => p.outflow?.totals?.amountPaid),
    tds: sumKey(parts, (p) => p.outflow?.totals?.tds),
    gst: sumKey(parts, (p) => p.outflow?.totals?.gst),
    actual: sumKey(parts, (p) => p.outflow?.totals?.actual),
  };
  const surplus = round2(inflowTotals.net - outflowTotals.actual);

  return {
    inflow: {
      count: parts.reduce((t, p) => t + num(p.inflow?.count ?? p.inflow?.data?.length), 0),
      totals: inflowTotals,
      data: parts.flatMap((p) => p.inflow?.data || []),
    },
    outflow: {
      count: parts.reduce((t, p) => t + num(p.outflow?.count ?? p.outflow?.data?.length), 0),
      totals: outflowTotals,
      data: parts.flatMap((p) => p.outflow?.data || []),
    },
    surplusDeficit: { value: surplus, type: surplus >= 0 ? "SURPLUS" : "DEFICIT" },
    openingBalanceSet: parts.some((p) => p.openingBalanceSet),
    balances: { days: parts.flatMap((p) => p.balances?.days || []) },
    truncated: parts.some(
      (p) =>
        num(p.inflow?.count) > (p.inflow?.data?.length ?? 0) ||
        num(p.outflow?.count) > (p.outflow?.data?.length ?? 0),
    ),
  };
};
