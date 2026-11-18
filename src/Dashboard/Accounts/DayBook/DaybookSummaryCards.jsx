import React from "react";
import { Skeleton } from "antd";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { formatAmountINR } from "./daybookUtils";

const FlowCard = ({ tone, icon, title, amount, note }) => (
  <div className={`db-flow ${tone}`}>
    <div className="db-flow-head">
      <span className="db-flow-icon">{icon}</span>
      {title}
    </div>
    <p className="db-flow-amount">{formatAmountINR(amount)}</p>
    <p className="db-flow-note">{note}</p>
  </div>
);

const Balance = ({ label, amount, kind }) => (
  <div className={`db-balance ${kind}`}>
    <span>{label}</span>
    <strong>{formatAmountINR(amount)}</strong>
  </div>
);

const DaybookSummaryCards = ({ loading, inflow, outflow, surplusDeficit, days }) => {
  const netIn = Number(inflow?.totals?.net) || 0;
  const actualOut = Number(outflow?.totals?.actual) || 0;
  const value = Number(surplusDeficit?.value) || 0;
  const isDeficit = surplusDeficit?.type ? surplusDeficit.type === "DEFICIT" : value < 0;

  const first = Array.isArray(days) && days.length ? days[0] : null;
  const last = Array.isArray(days) && days.length ? days[days.length - 1] : null;
  const sum = (day, key) =>
    (Number(day?.cash?.[key]) || 0) +
    (day?.accounts || []).reduce((t, a) => t + (Number(a[key]) || 0), 0);
  const bank = (day, key) => (day?.accounts || []).reduce((t, a) => t + (Number(a[key]) || 0), 0);

  if (loading) {
    return (
      <div className="db-summary">
        {[0, 1, 2].map((i) => (
          <div className="db-flow" key={i} style={{ background: "#fff", borderColor: "var(--line)" }}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    );
  }

  const count = (n) => `${n ?? 0} ${n === 1 ? "entry" : "entries"}`;
  const inNote = `${count(inflow?.count)} · gross ${formatAmountINR(inflow?.totals?.gross)}`;
  const outNote = `${count(outflow?.count)} · paid ${formatAmountINR(outflow?.totals?.amountPaid)}`;

  return (
    <>
      <section className="db-summary" aria-label="Summary">
        <FlowCard
          tone="is-in"
          icon={<ArrowDownLeft size={17} strokeWidth={2} aria-hidden="true" />}
          title="Money in (net)"
          amount={netIn}
          note={inNote}
        />
        <FlowCard
          tone="is-out"
          icon={<ArrowUpRight size={17} strokeWidth={2} aria-hidden="true" />}
          title="Money out (actual)"
          amount={actualOut}
          note={outNote}
        />
        <FlowCard
          tone={isDeficit ? "is-net is-loss" : "is-net"}
          icon={<Scale size={17} strokeWidth={2} aria-hidden="true" />}
          title="Surplus/deficit"
          amount={Math.abs(value)}
          note={isDeficit ? "Deficit: money out is more than money in" : "Surplus: money in minus money out"}
        />
      </section>

      <section className="db-balances" aria-label="Balances">
        <Balance label="Cash opening" amount={first?.cash?.opening} kind="is-cash" />
        <Balance label="Cash closing" amount={last?.cash?.closing} kind="is-cash" />
        <Balance label="Bank opening" amount={bank(first, "opening")} kind="is-acct" />
        <Balance label="Bank closing" amount={bank(last, "closing")} kind="is-acct" />
        <Balance label="Total opening" amount={sum(first, "opening")} kind="is-total" />
        <Balance label="Total closing" amount={sum(last, "closing")} kind="is-total" />
      </section>
    </>
  );
};

export default DaybookSummaryCards;
