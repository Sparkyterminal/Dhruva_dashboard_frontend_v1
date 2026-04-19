import axios from "axios";
import { API_BASE_URL } from "../../../../config";

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

  const res = await axios.get(`${API_BASE_URL}daybook`, {
    ...authHeaders,
    params,
  });

  return res?.data;
};

export const createInflow = async ({ payload, authHeaders }) => {
  const res = await axios.post(
    `${API_BASE_URL}daybook/inflows`,
    payload,
    authHeaders,
  );
  return res?.data;
};

export const updateInflow = async ({ id, payload, authHeaders }) => {
  const res = await axios.put(
    `${API_BASE_URL}daybook/inflows/${id}`,
    payload,
    authHeaders,
  );
  return res?.data;
};

export const deleteInflow = async ({ id, authHeaders }) => {
  const res = await axios.delete(
    `${API_BASE_URL}daybook/inflows/${id}`,
    authHeaders,
  );
  return res?.data;
};

export const createOpenCloseBalance = async ({ payload, authHeaders }) => {
  const res = await axios.post(
    `${API_BASE_URL}daybook/accounts/open-close-balances`,
    payload,
    authHeaders,
  );
  return res?.data;
};

export const updateOpenCloseBalance = async ({ id, payload, authHeaders }) => {
  const res = await axios.put(
    `${API_BASE_URL}daybook/accounts/open-close-balances/${id}`,
    payload,
    authHeaders,
  );
  return res?.data;
};

export const deleteOpenCloseBalance = async ({ id, authHeaders }) => {
  const res = await axios.delete(
    `${API_BASE_URL}daybook/accounts/open-close-balances/${id}`,
    authHeaders,
  );
  return res?.data;
};

export const fetchEventsMinimal = async ({ query = "", authHeaders }) => {
  const res = await axios.get(`${API_BASE_URL}events/minimal`, {
    ...authHeaders,
    params: query ? { search: query } : {},
  });

  // expected shapes:
  // - { events: [...] }
  // - { data: [...] }
  // - [...] (fallback)
  return res?.data?.events || res?.data?.data || res?.data || [];
};

