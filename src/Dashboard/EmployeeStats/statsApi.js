import axiosClient from "@/api/axiosClient";

// Contract: docs/api/employee-stats/EMPLOYEE_STATS_BACKEND.md
// `authHeaders` is the axios config `{ headers: { Authorization } }`.

const BASE = "employee-stats";

const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)));

const rangeParams = ({ from, to, dateBasis }) => ({ from, to, dateBasis });

/** What the filter bar offers: today (IST), the earliest date, departments and employees. */
export const fetchStatsFilters = async ({ authHeaders }) => (await axiosClient.get(`${BASE}/filters`, authHeaders))?.data;

/** The whole page in one call: totals, previous period, per month, per employee, month winners. */
export const fetchEmployeeStats = async ({ filters, authHeaders }) =>
  (
    await axiosClient.get(BASE, {
      ...authHeaders,
      params: clean({
        ...rangeParams(filters),
        department: filters.department,
        userId: (filters.userIds || []).join(","),
      }),
    })
  )?.data;

/** The bookings behind one employee (side panel). `userId` may be "unassigned". */
export const fetchEmployeeBookings = async ({ userId, filters, month, status, page = 1, limit = 20, authHeaders }) =>
  (
    await axiosClient.get(`${BASE}/${userId}/bookings`, {
      ...authHeaders,
      params: clean({ ...rangeParams(filters), month, status, page, limit }),
    })
  )?.data;
