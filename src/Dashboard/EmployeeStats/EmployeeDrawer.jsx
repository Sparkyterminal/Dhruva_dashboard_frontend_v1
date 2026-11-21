import React, { useCallback, useEffect, useState } from "react";
import { Drawer } from "@/Components/FormKit";
import { toast } from "@/Components/AdminKit/toast";
import ColumnChart from "./charts/ColumnChart";
import StatusBar from "./charts/StatusBar";
import { SERIES, STATUS } from "./charts/chartTokens";
import { fetchEmployeeBookings } from "./statsApi";
import { formatCompactINR, formatINR, formatPercent } from "./statsMath";
import "./EmployeeStats.css";

const STATUS_NAME = {
  "Confirmed Event": "Confirmed",
  InProgress: "In progress",
  "Almost Booked": "Almost booked",
  Cancelled: "Cancelled",
};

const dayText = (ymd) => {
  if (!ymd) return "—";
  const [y, m, d] = String(ymd).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
};

/** One employee: their months, their status mix and the bookings behind the numbers. */
const EmployeeDrawer = ({ employee, filters, authHeaders, onClose }) => {
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (nextPage, replace) => {
      if (!employee || !filters) return;
      setLoading(true);
      try {
        const res = await fetchEmployeeBookings({ userId: employee.userId ?? "unassigned", filters, page: nextPage, authHeaders });
        setBookings((prev) => (replace ? res?.bookings || [] : [...prev, ...(res?.bookings || [])]));
        setPage(res?.page ?? nextPage);
        setTotalPages(res?.totalPages ?? 1);
      } catch {
        toast.error("Could not load this employee's bookings");
      } finally {
        setLoading(false);
      }
    },
    [employee, filters, authHeaders],
  );

  useEffect(() => {
    if (employee) load(1, true);
    else setBookings([]);
  }, [employee, load]);

  const t = employee?.totals || {};
  const months = (employee?.byMonth || []).map((m) => ({ key: m.month, values: [Number(m.bookedAmount) || 0] }));

  return (
    <Drawer
      open={Boolean(employee)}
      onClose={onClose}
      title={employee?.name || ""}
      subtitle={(employee?.departments || []).join(", ")}
      width={620}
    >
      {employee ? (
        <div className="es-drawer">
          <div className="es-mini-kpis">
            <div><b title={formatINR(t.bookedAmount)}>{formatCompactINR(t.bookedAmount)}</b><span>Booked</span></div>
            <div><b title={formatINR(t.receivedAmount)}>{formatCompactINR(t.receivedAmount)}</b><span>Received</span></div>
            <div><b title={formatINR(t.pendingAmount)}>{formatCompactINR(t.pendingAmount)}</b><span>Pending</span></div>
            <div><b>{formatPercent(t.conversionRate)}</b><span>Conversion</span></div>
          </div>

          <h4>Booked amount by month</h4>
          <ColumnChart
            data={months}
            series={[{ name: "Booked amount", color: SERIES[0] }]}
            formatValue={formatINR}
            ariaLabel={`${employee.name}: booked amount by month`}
          />

          <h4>Bookings by status</h4>
          <StatusBar
            parts={STATUS.map((s) => ({ ...s, count: Number(t[s.key]) || 0 }))}
            ariaLabel={`${employee.name}: bookings by status`}
          />

          <h4>Bookings</h4>
          {bookings.length === 0 && !loading ? <p className="ec-empty">No bookings in this period.</p> : null}
          <ul className="es-bookings">
            {bookings.map((b) => (
              <li key={b._id}>
                <div>
                  <strong>{b.clientName || "—"}</strong>
                  <span>
                    {[b.eventName, `booked ${dayText(b.bookedOn)}`, b.eventDate ? `event ${dayText(b.eventDate)}` : null].filter(Boolean).join(" · ")}
                  </span>
                  <em className={`es-st is-${String(b.eventConfirmation).replace(/\s+/g, "").toLowerCase()}`}>
                    {STATUS_NAME[b.eventConfirmation] || b.eventConfirmation}
                  </em>
                </div>
                <div className="r">
                  <b>{formatCompactINR(b.bookedAmount || b.expectedAmount || 0)}</b>
                  <span>
                    {b.eventConfirmation === "Confirmed Event"
                      ? `received ${formatCompactINR(b.receivedAmount)}`
                      : b.expectedAmount
                        ? "expected"
                        : ""}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {page < totalPages ? (
            <button type="button" className="ec-more" disabled={loading} onClick={() => load(page + 1, false)}>
              {loading ? "Loading…" : "Load more"}
            </button>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
};

export default EmployeeDrawer;
