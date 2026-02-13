import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);

const formatIndianRupee = (amount) => {
  if (amount == null || amount === "") return "";
  const num = Number(amount);
  if (isNaN(num)) return "";
  return num.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
};

/**
 * Read-only AG Grid for budget report. Same column layout as DataGridSpreadsheet.
 */
const BudgetReportViewGrid = ({ rowData, pinnedBottomRowData = [] }) => {
  const columnDefs = useMemo(
    () => [
      { headerName: "Sl. No", field: "slNo", width: 90 },
      {
        headerName: "Particulars",
        field: "particulars",
        width: 240,
        cellStyle: (params) =>
          params.data?.isGroupRow
            ? { fontWeight: 700, backgroundColor: "#e2e8f0" }
            : {},
      },
      { headerName: "Size", field: "size", width: 110 },
      { headerName: "Qnty", field: "qnty", width: 90 },
      { headerName: "Unit", field: "unit", width: 90 },
      {
        headerName: "Rate (₹)",
        field: "rate",
        width: 120,
        valueFormatter: (p) =>
          p.value != null && p.value !== ""
            ? `₹${formatIndianRupee(p.value)}`
            : "",
      },
      {
        headerName: "Total Cost (₹)",
        field: "totalCost",
        width: 140,
        valueFormatter: (p) =>
          p.value != null && p.value !== ""
            ? `₹${formatIndianRupee(p.value)}`
            : "",
        cellStyle: (params) =>
          params.data?.isGroupRow ? { fontWeight: 700 } : {},
      },
      {
        headerName: "Negotiated Amt (₹)",
        field: "negotiatedAmount",
        width: 170,
        valueFormatter: (p) =>
          p.value != null && p.value !== ""
            ? `₹${formatIndianRupee(p.value)}`
            : "",
      },
      { headerName: "Vendor Code", field: "vendorCode", width: 170 },
      { headerName: "Vendor Name", field: "vendorName", width: 180 },
      { headerName: "Vendor Contact", field: "vendorContactNumber", width: 160 },
      {
        headerName: "Inhouse",
        field: "inhouseAmount",
        width: 110,
        valueFormatter: (p) =>
          p.data?.isGroupRow || p.node?.rowPinned ? "" : p.value ? "Yes" : "No",
      },
      {
        headerName: "Assets Purchase",
        field: "assetsPurchase",
        width: 140,
        valueFormatter: (p) =>
          p.data?.isGroupRow || p.node?.rowPinned ? "" : p.value ? "Yes" : "No",
      },
      {
        headerName: "Direct Payment",
        field: "directPayment",
        width: 140,
        valueFormatter: (p) =>
          p.data?.isGroupRow || p.node?.rowPinned ? "" : p.value ? "Yes" : "No",
      },
      {
        headerName: "Actual Paid Amt (₹)",
        field: "actualPaidAmount",
        width: 170,
        valueFormatter: (p) =>
          p.value != null && p.value !== ""
            ? `₹${formatIndianRupee(p.value)}`
            : "",
      },
    ],
    [],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: false,
      filter: false,
      resizable: true,
      editable: false,
      suppressMovable: true,
      wrapText: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      cellStyle: { color: "#1a1a1a", fontSize: "13px", lineHeight: "1.4" },
    }),
    [],
  );

  const getRowStyle = (params) => {
    if (params.node.rowPinned === "bottom")
      return { fontWeight: 700, backgroundColor: "#d1fae5", fontSize: "14px" };
    if (params.data?.isGroupRow)
      return { backgroundColor: "#e2e8f0", fontWeight: 700, fontSize: "14px" };
    return {};
  };

  const getRowHeight = (params) =>
    params.data?.isGroupRow ? 44 : 38;

  return (
    <div className="ag-theme-alpine" style={{ height: "70vh", width: "100%" }}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pinnedBottomRowData={pinnedBottomRowData}
        getRowId={(p) => p.data.id}
        getRowStyle={getRowStyle}
        getRowHeight={getRowHeight}
        animateRows
        suppressRowTransform
        domLayout="normal"
      />
    </div>
  );
};

export default BudgetReportViewGrid;
