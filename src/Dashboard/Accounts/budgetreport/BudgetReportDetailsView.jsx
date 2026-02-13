import React, { useMemo } from "react";
import { parseBudgetDataToRowData } from "./budgetReportUtils";
import BudgetReportViewGrid from "./BudgetReportViewGrid";

/**
 * Component to display budget report details from report object (no API call).
 * Used in drawer to show report data directly from list response.
 */
const BudgetReportDetailsView = ({ reportData }) => {
  const rowData = useMemo(() => {
    if (!reportData?.budgetData) return [];
    return parseBudgetDataToRowData(reportData.budgetData);
  }, [reportData]);

  const pinnedBottomRowData = useMemo(() => {
    if (!rowData.length) {
      // Use summary from API if available
      const summary = reportData?.budgetData?.summary;
      if (summary) {
        return [
          {
            id: "pinned_total",
            isGroupRow: false,
            slNo: "",
            particulars: "GRAND TOTAL",
            size: "",
            qnty: "",
            unit: "",
            rate: "",
            totalCost: summary.totalCost || 0,
            // grandTotal: summary.grandTotal || 0,
            negotiatedAmount: summary.negotiatedAmount || 0,
            vendorCode: "",
            vendorName: "",
            vendorContactNumber: "",
            vendorId: "",
            inhouseAmount: "",
            assetsPurchase: "",
            directPayment: "",
            actualPaidAmount: summary.actualPaidAmount || 0,
          },
        ];
      }
      return [];
    }

    // Calculate from rowData
    let totalCost = 0;
    let grandTotal = 0;
    let negotiatedAmount = 0;
    let actualPaidAmount = 0;
    for (const r of rowData) {
      if (r.isGroupRow) grandTotal += Number(r.grandTotal) || 0;
      else {
        totalCost += Number(r.totalCost) || 0;
        negotiatedAmount += Number(r.negotiatedAmount) || 0;
        actualPaidAmount += Number(r.actualPaidAmount) || 0;
      }
    }
    return [
      {
        id: "pinned_total",
        isGroupRow: false,
        slNo: "",
        particulars: "GRAND TOTAL",
        size: "",
        qnty: "",
        unit: "",
        rate: "",
        totalCost,
        // grandTotal,
        negotiatedAmount,
        vendorCode: "",
        vendorName: "",
        vendorContactNumber: "",
        vendorId: "",
        inhouseAmount: "",
        assetsPurchase: "",
        directPayment: "",
        actualPaidAmount,
      },
    ];
  }, [rowData, reportData]);

  if (!reportData?.budgetData) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
        No budget data available.
      </div>
    );
  }

  if (!rowData.length) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#94a3b8" }}>
        No budget items found.
      </div>
    );
  }

  return (
    <BudgetReportViewGrid
      rowData={rowData}
      pinnedBottomRowData={pinnedBottomRowData}
    />
  );
};

export default BudgetReportDetailsView;
