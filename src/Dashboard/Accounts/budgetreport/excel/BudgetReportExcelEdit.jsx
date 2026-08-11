import React from "react";
import BudgetReportExcelWorkspace from "./BudgetReportExcelWorkspace";

/** Editable Excel mapped to a confirmed event (`:eventId` / `:id` param). */
const BudgetReportExcelEdit = () => (
  <BudgetReportExcelWorkspace mode="edit" />
);

export default BudgetReportExcelEdit;
