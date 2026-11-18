import React from "react";
import { BadgeIndianRupee, CircleCheck, Clock3, Receipt } from "lucide-react";
import { StatCard, StatRow } from "@/Components/PageKit";
import { formatMoney } from "./everydayRules";

/** Spent · Reimbursable · Repaid · Pending. `totals` comes from the API. */
const ExpenseSummaryCards = ({ totals }) => (
  <StatRow>
    <StatCard icon={<Receipt size={21} aria-hidden="true" />} label="Spent" value={formatMoney(totals?.spent)} />
    <StatCard
      tone="blue"
      icon={<BadgeIndianRupee size={21} aria-hidden="true" />}
      label="Reimbursable"
      value={formatMoney(totals?.reimbursable)}
    />
    <StatCard icon={<CircleCheck size={21} aria-hidden="true" />} label="Repaid" value={formatMoney(totals?.repaid)} />
    <StatCard
      tone="gold"
      icon={<Clock3 size={21} aria-hidden="true" />}
      label="Pending repayment"
      value={formatMoney(totals?.pending)}
    />
  </StatRow>
);

export default ExpenseSummaryCards;
