import axiosClient from "@/api/axiosClient";
import { mapLimit } from "@/lib/async";
import { compressImage } from "./compressImage";
import { syncServerTime } from "./serverClock";

// Contract: docs/api/everyday-expenses/EVERYDAY_EXPENSES_BACKEND.md
// `authHeaders` is the axios config `{ headers: { Authorization } }` (same as the Daybook screens).

const BASE = "everyday-expenses";

/** Remembers the server's clock from any response that carries `serverTime`. */
const read = (res) => {
  const data = res?.data;
  if (data?.serverTime) syncServerTime(data.serverTime);
  return data;
};

const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""));

// ---- Me, settings, categories, people ----
export const fetchMe = async ({ authHeaders }) => read(await axiosClient.get(`${BASE}/me`, authHeaders));

export const saveSettings = async ({ payload, authHeaders }) =>
  read(await axiosClient.put(`${BASE}/settings`, payload, authHeaders));

export const fetchCategories = async ({ includeInactive = false, authHeaders }) =>
  read(
    await axiosClient.get(`${BASE}/categories`, {
      ...authHeaders,
      params: includeInactive ? { includeInactive: "true" } : {},
    }),
  );

export const createCategory = async ({ payload, authHeaders }) =>
  read(await axiosClient.post(`${BASE}/categories`, payload, authHeaders));

export const updateCategory = async ({ id, payload, authHeaders }) =>
  read(await axiosClient.put(`${BASE}/categories/${id}`, payload, authHeaders));

export const fetchPeople = async ({ authHeaders }) => read(await axiosClient.get(`${BASE}/people`, authHeaders));

export const saveGrades = async ({ grades, authHeaders }) =>
  read(await axiosClient.put(`${BASE}/grades`, { grades }, authHeaders));

// ---- My expenses ----
export const fetchMyExpenses = async ({ month, authHeaders }) =>
  read(await axiosClient.get(`${BASE}/mine`, { ...authHeaders, params: { month } }));

export const createExpense = async ({ payload, authHeaders }) =>
  read(await axiosClient.post(BASE, payload, authHeaders));

export const updateExpense = async ({ id, payload, authHeaders }) =>
  read(await axiosClient.put(`${BASE}/${id}`, payload, authHeaders));

export const deleteExpense = async ({ id, authHeaders }) =>
  read(await axiosClient.delete(`${BASE}/${id}`, authHeaders));

// ---- Reviewers ----
export const fetchOverview = async ({ filters = {}, page = 1, limit = 100, authHeaders }) =>
  read(await axiosClient.get(BASE, { ...authHeaders, params: clean({ ...filters, page, limit }) }));

/** Every page of the overview for the filters (pages 2..N in parallel); totals and per-person sums come from page 1. */
export const fetchOverviewAll = async ({ filters = {}, authHeaders, limit = 500 }) => {
  const first = await fetchOverview({ filters, page: 1, limit, authHeaders });
  const expenses = [...(first?.expenses || [])];
  const pages = Number(first?.totalPages) || 1;
  if (pages > 1) {
    const rest = await mapLimit(
      Array.from({ length: pages - 1 }, (_, i) => i + 2),
      3,
      (page) => fetchOverview({ filters, page, limit, authHeaders }),
    );
    rest.forEach((r) => expenses.push(...(r?.expenses || [])));
  }
  return { ...first, expenses };
};

export const rejectExpenses = async ({ ids, reason, authHeaders }) =>
  read(await axiosClient.post(`${BASE}/reject`, { ids, reason }, authHeaders));

export const repayExpenses = async ({ ids, date, mode, reference, authHeaders }) =>
  read(await axiosClient.post(`${BASE}/repay`, { ids, date, mode, reference }, authHeaders));

// ---- Bills (private S3 bucket, direct upload) ----

/**
 * Uploads one bill straight to S3 and returns the metadata to save on the expense.
 * 1) the API signs a short-lived PUT link, 2) the browser PUTs the file there.
 * The S3 request carries no Authorization header on purpose.
 */
export const uploadBill = async ({ file, authHeaders, onProgress }) => {
  const prepared = await compressImage(file);
  const contentType = prepared.type || "application/octet-stream";
  const { data } = await axiosClient.post(
    `${BASE}/uploads/presign`,
    { fileName: prepared.name, contentType, size: prepared.size },
    authHeaders,
  );
  await axiosClient.put(data.uploadUrl, prepared, {
    headers: { "Content-Type": contentType },
    onUploadProgress: (e) => {
      if (e.total) onProgress?.(Math.round((e.loaded / e.total) * 100));
    },
  });
  return { key: data.key, name: prepared.name, size: prepared.size, contentType };
};

/** Short-lived link to open a bill (owner of the entry or a reviewer). */
export const fetchBillUrl = async ({ key, authHeaders }) => {
  const res = await axiosClient.get(`${BASE}/uploads/url`, { ...authHeaders, params: { key } });
  return res?.data?.url;
};
