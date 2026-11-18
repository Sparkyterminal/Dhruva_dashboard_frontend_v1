import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { formatAmountINR, formatDate } from "./daybookUtils";

const money = (v) => <span className="db-num">{formatAmountINR(v)}</span>;

const bankTotals = (day) =>
  (day.accounts || []).reduce(
    (t, a) => ({
      opening: t.opening + (Number(a.opening) || 0),
      closing: t.closing + (Number(a.closing) || 0),
    }),
    { opening: 0, closing: 0 },
  );

/**
 * One row per day (newest first): opening and closing for cash and for the bank accounts together.
 * A day opens up to show every account. Nothing here is typed in; the server calculates it all.
 */
const DaybookBalancesTable = ({ days }) => {
  const [openDay, setOpenDay] = useState(null);
  const list = Array.isArray(days) ? [...days].reverse() : [];

  if (list.length === 0) {
    return (
      <div className="db-empty">
        <strong>No balances for this period</strong>
        <span>Balances start from the starting date set under “Starting balance”.</span>
      </div>
    );
  }

  return (
    <div className="ak-table-wrap">
      <div className="ak-scroll">
        <table className="ak-table db-balances-table">
          <thead>
            <tr>
              <th>Date</th>
              <th style={{ textAlign: "right" }}>Cash opening</th>
              <th style={{ textAlign: "right" }}>Cash closing</th>
              <th style={{ textAlign: "right" }}>Bank opening</th>
              <th style={{ textAlign: "right" }}>Bank closing</th>
              <th style={{ textAlign: "right" }}>Total closing</th>
            </tr>
          </thead>
          <tbody>
            {list.map((day) => {
              const bank = bankTotals(day);
              const expanded = openDay === day.date;
              return (
                <React.Fragment key={day.date}>
                  <tr>
                    <td>
                      <button
                        type="button"
                        className="db-expand"
                        aria-expanded={expanded}
                        onClick={() => setOpenDay(expanded ? null : day.date)}
                      >
                        {expanded ? <ChevronDown size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}
                        {formatDate(day.date)}
                      </button>
                    </td>
                    <td style={{ textAlign: "right" }}>{money(day.cash?.opening)}</td>
                    <td style={{ textAlign: "right" }}>{money(day.cash?.closing)}</td>
                    <td style={{ textAlign: "right" }}>{money(bank.opening)}</td>
                    <td style={{ textAlign: "right" }}>{money(bank.closing)}</td>
                    <td style={{ textAlign: "right" }}>
                      <span className="db-num is-strong">{formatAmountINR(day.totals?.closing)}</span>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr className="db-balances-detail">
                      <td colSpan={6}>
                        <table className="db-mini">
                          <thead>
                            <tr>
                              <th>Account</th>
                              <th>Opening</th>
                              <th>In</th>
                              <th>Out</th>
                              <th>Closing</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[{ accountName: "Cash", ...day.cash }, ...(day.accounts || [])].map((a) => (
                              <tr key={a.accountName}>
                                <td>{a.accountName}</td>
                                <td>{formatAmountINR(a.opening)}</td>
                                <td>{formatAmountINR(a.inflow)}</td>
                                <td>{formatAmountINR(a.outflow)}</td>
                                <td>
                                  <strong>{formatAmountINR(a.closing)}</strong>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DaybookBalancesTable;
