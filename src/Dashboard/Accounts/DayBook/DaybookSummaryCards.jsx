import React from "react";
import { Skeleton } from "antd";
import { ArrowDownLeft, ArrowUpRight, Scale } from "lucide-react";
import { formatAmountINR } from "./daybookUtils";

const FlowCard = ({ tone, icon, title, amount, note }) => (
  <div className={`db-flow ${tone}`}>
    <div className="db-flow-head">
      <span className="db-flow-icon">
        {icon}
      </span>
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

const DaybookSummaryCards = ({ loading, inflow, outflow, accounts }) => {
  const inflowTotal = Number(inflow?.total) || 0;
  const inflowCount = inflow?.count ?? 0;
  const outflowTotal = Number(outflow?.total) || 0;
  const outflowCount = outflow?.count ?? 0;
  const net = inflowTotal - outflowTotal;
  const currentBalance = Array.isArray(accounts?.openCloseBalances)
    ? accounts.openCloseBalances[0]
    : null;

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

  const count = (n) => `${n} ${n === 1 ? "entry" : "entries"}`;

  return (
    <>
      <section className="db-summary" aria-label="Summary">
        <FlowCard
          tone="is-in"
          icon={<ArrowDownLeft size={17} strokeWidth={2} aria-hidden="true" />}
          title="Money in"
          amount={inflowTotal}
          note={count(inflowCount)}
        />
        <FlowCard
          tone="is-out"
          icon={<ArrowUpRight size={17} strokeWidth={2} aria-hidden="true" />}
          title="Money out"
          amount={outflowTotal}
          note={count(outflowCount)}
        />
        <FlowCard
          tone={net >= 0 ? "is-net" : "is-net is-loss"}
          icon={<Scale size={17} strokeWidth={2} aria-hidden="true" />}
          title={net >= 0 ? "Net (profit)" : "Net (loss)"}
          amount={Math.abs(net)}
          note="Inflow minus outflow"
        />
      </section>

      <section className="db-balances" aria-label="Balances">
        <Balance
          label="Cash opening"
          amount={currentBalance?.cashOpeningBalance}
          kind="is-cash"
        />
        <Balance
          label="Cash closing"
          amount={currentBalance?.cashClosingBalance}
          kind="is-cash"
        />
        <Balance
          label="Account opening"
          amount={currentBalance?.accountOpeningBalance}
          kind="is-acct"
        />
        <Balance
          label="Account closing"
          amount={currentBalance?.accountClosingBalance}
          kind="is-acct"
        />
      </section>
    </>
  );
};

export default DaybookSummaryCards;
