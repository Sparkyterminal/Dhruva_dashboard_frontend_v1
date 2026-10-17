import dayjs from "dayjs";
import axiosClient from "@/api/axiosClient";
import { mapLimit } from "@/lib/async";

const DEFAULT_LIMIT = 200;

const toYMD = (value) => {
  if (!value) return "";
  // dayjs objects: support both date strings and dayjs
  if (typeof value === "string") return value;
  if (typeof value?.format === "function") return value.format("YYYY-MM-DD");
  return String(value);
};

export const fetchDaybookRange = async ({
  startDate,
  endDate,
  limit = DEFAULT_LIMIT,
  /** When false, only manual DaybookInflow rows (no merged booking advances). Default true on server. */
  includeEventAdvances = true,
  authHeaders,
}) => {
  const yyyyMmDdStart = toYMD(startDate);
  const yyyyMmDdEnd = toYMD(endDate);

  const params = {
    startDate: yyyyMmDdStart,
    endDate: yyyyMmDdEnd,
    limit,
  };
  if (includeEventAdvances === false) {
    params.includeEventAdvances = "false";
  }

  const res = await axiosClient.get(`daybook`, {
    ...authHeaders,
    params,
  });

  return res?.data;
};

export const createInflow = async ({ payload, authHeaders }) => {
  const res = await axiosClient.post(
    `daybook/inflows`,
    payload,
    authHeaders,
  );
  return res?.data;
};

export const updateInflow = async ({ id, payload, authHeaders }) => {
  const res = await axiosClient.put(
    `daybook/inflows/${id}`,
    payload,
    authHeaders,
  );
  return res?.data;
};

export const deleteInflow = async ({ id, authHeaders }) => {
  const res = await axiosClient.delete(
    `daybook/inflows/${id}`,
    authHeaders,
  );
  return res?.data;
};

export const createOpenCloseBalance = async ({ payload, authHeaders }) => {
  const res = await axiosClient.post(
    `daybook/accounts/open-close-balances`,
    payload,
    authHeaders,
  );
  return res?.data;
};

export const updateOpenCloseBalance = async ({ id, payload, authHeaders }) => {
  const res = await axiosClient.put(
    `daybook/accounts/open-close-balances/${id}`,
    payload,
    authHeaders,
  );
  return res?.data;
};

export const deleteOpenCloseBalance = async ({ id, authHeaders }) => {
  const res = await axiosClient.delete(
    `daybook/accounts/open-close-balances/${id}`,
    authHeaders,
  );
  return res?.data;
};

export const fetchEventsMinimal = async ({ query = "", authHeaders }) => {
  const res = await axiosClient.get(`events/minimal`, {
    ...authHeaders,
    params: query ? { search: query } : {},
  });

  // expected shapes:
  // - { events: [...] }
  // - { data: [...] }
  // - [...] (fallback)
  return res?.data?.events || res?.data?.data || res?.data || [];
};


// GET /daybook returns at most 1000 rows per list, so long periods are fetched
// one calendar month at a time and joined.
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

const sumOf = (parts, pick) => parts.reduce((total, p) => total + (Number(pick(p)) || 0), 0);

/**
 * Whole-period daybook: same shape as fetchDaybookRange plus `truncated`, which
 * is true if any single month still had more rows than the API returns.
 */
export const fetchDaybookAll = async ({
  startDate,
  endDate,
  includeEventAdvances = true,
  authHeaders,
  onProgress,
}) => {
  const windows = monthWindows(toYMD(startDate), toYMD(endDate));
  let done = 0;
  const parts = await mapLimit(windows, CHUNK_CONCURRENCY, async (w) => {
    const data = await fetchDaybookRange({
      startDate: w.start,
      endDate: w.end,
      limit: MAX_ROWS_PER_REQUEST,
      includeEventAdvances,
      authHeaders,
    });
    done += 1;
    onProgress?.(done, windows.length);
    return data || {};
  });

  const inflowData = parts.flatMap((p) => p.inflow?.data || []);
  const outflowData = parts.flatMap((p) => p.outflow?.data || []);
  const seen = new Set();
  const balances = parts
    .flatMap((p) => p.accounts?.openCloseBalances || [])
    .filter((b) => {
      const key = b?._id ?? b?.balanceDate;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const inflowTotal = sumOf(parts, (p) => p.inflow?.total);
  const outflowTotal = sumOf(parts, (p) => p.outflow?.total);
  const net = inflowTotal - outflowTotal;
  return {
    inflow: {
      count: sumOf(parts, (p) => p.inflow?.count ?? p.inflow?.data?.length),
      total: inflowTotal,
      data: inflowData,
    },
    outflow: {
      count: sumOf(parts, (p) => p.outflow?.count ?? p.outflow?.data?.length),
      total: outflowTotal,
      data: outflowData,
    },
    profitAndLoss: { value: net, type: net >= 0 ? "PROFIT" : "LOSS" },
    accounts: { openCloseBalances: balances },
    truncated: parts.some(
      (p) =>
        (p.inflow?.count ?? 0) > (p.inflow?.data?.length ?? 0) ||
        (p.outflow?.count ?? 0) > (p.outflow?.data?.length ?? 0),
    ),
  };
};
