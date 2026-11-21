import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { LockKeyhole, UsersRound } from "lucide-react";
import { EmptyState, PageHero } from "@/Components/PageKit";
import { Toaster } from "@/Components/AdminKit";
import { toast } from "@/Components/AdminKit/toast";
import ExcelDownloadButton from "@/Components/ExcelDownloadButton";
import { canViewEmployeeStats } from "@/utils/employeeStatsAccess";
import EmployeeDrawer from "./EmployeeDrawer";
import EmployeeTable from "./EmployeeTable";
import FilterBar from "./FilterBar";
import KpiCards from "./KpiCards";
import MonthWinners from "./MonthWinners";
import Spotlight from "./Spotlight";
import { HeatCard, RankingCard, StatusCard, TrendCard } from "./StatsCharts";
import { fetchEmployeeStats, fetchStatsFilters } from "./statsApi";
import { downloadStatsExcel } from "./statsExcel";
import { clampFrom, isRangeValid, istToday, monthLabel, presetRange } from "./statsMath";
import "./EmployeeStats.css";

const longDay = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

/**
 * Employee Statistics for CA, Approver, Owner and the HR department. Everything shown comes from the
 * server: the filter choices (/employee-stats/filters) and the numbers (/employee-stats).
 */
const EmployeeStatsPage = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const allowed = canViewEmployeeStats(user);
  const authHeaders = useMemo(() => ({ headers: { Authorization: user?.access_token } }), [user?.access_token]);

  const [meta, setMeta] = useState(null);
  const [metaError, setMetaError] = useState(false);
  const [filters, setFilters] = useState({ preset: "year", from: "", to: "", dateBasis: "booked", department: "", userIds: [] });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [openUserId, setOpenUserId] = useState(null);
  const requestId = useRef(0);

  const loadMeta = useCallback(async () => {
    setMetaError(false);
    try {
      setMeta(await fetchStatsFilters({ authHeaders }));
    } catch {
      setMetaError(true);
    }
  }, [authHeaders]);

  useEffect(() => {
    if (allowed) loadMeta();
  }, [allowed, loadMeta]);

  const today = meta?.today || istToday();
  const range = useMemo(() => {
    if (!meta) return null;
    if (filters.preset === "custom") return { from: clampFrom(filters.from, meta.dataFrom), to: filters.to };
    return presetRange(filters.preset, today, meta.dataFrom);
  }, [meta, filters.preset, filters.from, filters.to, today]);

  const valid = Boolean(range) && isRangeValid(range.from, range.to);
  const queryKey = valid ? JSON.stringify([range, filters.dateBasis, filters.department, filters.userIds]) : "";

  const load = useCallback(async () => {
    if (!valid) return;
    const id = (requestId.current += 1);
    setLoading(true);
    setError(false);
    try {
      const res = await fetchEmployeeStats({
        filters: { ...range, dateBasis: filters.dateBasis, department: filters.department, userIds: filters.userIds },
        authHeaders,
      });
      if (id === requestId.current) setData(res);
    } catch {
      if (id === requestId.current) setError(true);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    // the query key already covers range, basis, department and employees
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, authHeaders]);

  useEffect(() => {
    if (!queryKey) return undefined;
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [queryKey, load]);

  const change = (patch) =>
    setFilters((f) => {
      const next = { ...f, ...patch };
      // switching to a custom range starts from the range being shown
      if (patch.preset === "custom" && f.preset !== "custom" && range) {
        next.from = range.from;
        next.to = range.to;
      }
      return next;
    });

  const employees = useMemo(() => data?.employees ?? [], [data]);
  const months = data?.months ?? [];
  const openEmployee = employees.find((e) => e.userId === openUserId) || null;
  // a stable object, so the side panel does not reload on every render
  const drawerFilters = useMemo(
    () => (range ? { from: range.from, to: range.to, dateBasis: filters.dateBasis } : null),
    [range, filters.dateBasis],
  );

  const exportExcel = async () => {
    if (!data || employees.length === 0) return toast.info("No data to download for these filters");
    await downloadStatsExcel(data, { ...range, dateBasis: filters.dateBasis });
  };

  if (!allowed) {
    return (
      <div className="pk-page">
        <div className="pk-wrap">
          <PageHero eyebrow="Employee activities" title="Employee Statistics" onBack={() => navigate("/user")} />
          <section className="pk-panel">
            <EmptyState
              icon={<LockKeyhole size={24} aria-hidden="true" />}
              title="You do not have access to this page"
              hint="Employee Statistics is for the CA, Approver, Owner and the HR department."
            />
          </section>
        </div>
      </div>
    );
  }

  const subtitle = range
    ? `${longDay(range.from)} to ${longDay(range.to)} · counted by ${filters.dateBasis === "event" ? "event date" : "booking date"}${
        data ? ` · ${employees.length} ${employees.length === 1 ? "employee" : "employees"}` : ""
      }`
    : "Loading…";

  const rangeError = filters.preset === "custom" && range && !valid ? "Choose a start date on or before the end date (up to 36 months)" : null;

  return (
    <div className="pk-page">
      <div className="pk-wrap">
        <PageHero eyebrow="Employee activities" title="Employee Statistics" subtitle={subtitle} onBack={() => navigate("/user")}>
          <ExcelDownloadButton label="Download Excel" onDownload={exportExcel} disabled={!data || employees.length === 0} />
        </PageHero>

        {metaError ? (
          <section className="pk-panel">
            <EmptyState icon={<UsersRound size={24} aria-hidden="true" />} title="Could not open Employee Statistics" hint="Check your connection and try again." />
            <div className="es-center">
              <button type="button" className="es-retry" onClick={loadMeta}>Try again</button>
            </div>
          </section>
        ) : !meta ? (
          <div className="es-skel" aria-hidden="true">
            <i /> <i /> <i />
          </div>
        ) : (
          <>
            <FilterBar meta={meta} state={filters} onChange={change} rangeError={rangeError} />

            {error && !data ? (
              <section className="pk-panel">
                <EmptyState icon={<UsersRound size={24} aria-hidden="true" />} title="Could not load the statistics" hint="Check your connection and try again." />
                <div className="es-center">
                  <button type="button" className="es-retry" onClick={load}>Try again</button>
                </div>
              </section>
            ) : !data ? (
              <div className="es-skel" aria-hidden="true">
                <i /> <i /> <i />
              </div>
            ) : (
              <div className={`es-content${loading ? " is-refreshing" : ""}`} aria-busy={loading}>
                {error ? <p className="es-warn" role="status">Could not refresh. Showing the last numbers.</p> : null}
                <KpiCards totals={data.totals} previous={data.previous} />

                {employees.length === 0 ? (
                  <section className="pk-panel">
                    <EmptyState
                      icon={<UsersRound size={24} aria-hidden="true" />}
                      title="No bookings in this period"
                      hint={`Nothing was booked between ${longDay(range.from)} and ${longDay(range.to)} for these filters. Try another period.`}
                    />
                  </section>
                ) : (
                  <>
                    <Spotlight employees={employees} teamBooked={data.totals?.bookedAmount} onSelect={setOpenUserId} />
                    <MonthWinners months={months} monthly={data.monthly} monthlyTop={data.monthlyTop} employees={employees} onSelect={setOpenUserId} />
                    <TrendCard months={months} monthly={data.monthly || []} />
                    <div className="es-two">
                      <RankingCard employees={employees} onSelect={setOpenUserId} />
                      <StatusCard totals={data.totals} />
                    </div>
                    <HeatCard employees={employees} months={months} monthly={data.monthly} monthlyTop={data.monthlyTop} onSelect={setOpenUserId} />
                    <EmployeeTable employees={employees} onSelect={setOpenUserId} />
                    {data.excluded?.noEventDate ? (
                      <p className="es-note">
                        {data.excluded.noEventDate} booking{data.excluded.noEventDate === 1 ? "" : "s"} without an event date {data.excluded.noEventDate === 1 ? "is" : "are"} not counted when counting by event date.
                      </p>
                    ) : null}
                    <p className="es-note">
                      Booked, received and pending amounts count confirmed bookings only. Pipeline is in progress and almost booked bookings. Months: {months.map((m) => monthLabel(m, false)).join(", ")}.
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <EmployeeDrawer
        employee={openEmployee}
        filters={drawerFilters}
        authHeaders={authHeaders}
        onClose={() => setOpenUserId(null)}
      />
      <Toaster />
    </div>
  );
};

export default EmployeeStatsPage;
