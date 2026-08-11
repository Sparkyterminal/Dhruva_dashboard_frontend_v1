import React from "react";
import BudgetReportExcelWorkspace from "./BudgetReportExcelWorkspace";

/** Read-only Excel view — all sheets, not editable. */
const BudgetReportExcelView = () => (
  <BudgetReportExcelWorkspace mode="view" />
);

export default BudgetReportExcelView;
