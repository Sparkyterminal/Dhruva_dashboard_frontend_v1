/**
 * Shared helpers for budget report grid data.
 * Used by DataGridSpreadsheet, EditBudgetReport, and ViewEventwiseBudgetReport.
 */

export const generateId = () =>
  `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const emptyChildRow = (groupName) => ({
  id: generateId(),
  groupName,
  isGroupRow: false,
  slNo: "",
  particulars: "",
  size: "",
  qnty: 0,
  unit: "",
  rate: 0,
  totalCost: 0,
  grandTotal: 0,
  negotiatedAmount: 0,
  vendorCode: "",
  vendorName: "",
  vendorContactNumber: "",
  vendorId: "",
  inhouseAmount: false,
  assetsPurchase: false,
  directPayment: false,
  actualPaidAmount: 0,
});

export const buildGroupRow = (name) => ({
  id: generateId(),
  groupName: name,
  isGroupRow: true,
  expanded: true,
  slNo: "",
  particulars: name,
  size: "",
  qnty: "",
  unit: "",
  rate: "",
  totalCost: "",
  grandTotal: 0,
  negotiatedAmount: "",
  vendorCode: "",
  vendorName: "",
  vendorContactNumber: "",
  vendorId: "",
  inhouseAmount: "",
  assetsPurchase: "",
  directPayment: "",
  actualPaidAmount: "",
});

/**
 * Parse API budgetData (groups + grandTotals) into rowData for the grid.
 * @param {{ groups: Record<string, object[]>, grandTotals?: Record<string, number> }} budgetData
 * @returns {object[]} rowData
 */
export const parseBudgetDataToRowData = (budgetData) => {
  if (!budgetData?.groups) return [];
  const reconstructedRows = [];
  Object.entries(budgetData.groups).forEach(([groupName, rows]) => {
    const groupRow = { ...buildGroupRow(groupName) };
    groupRow.grandTotal = budgetData.grandTotals?.[groupName] ?? 0;
    reconstructedRows.push(groupRow);
    (rows || []).forEach((row) => {
      reconstructedRows.push({
        ...emptyChildRow(groupName),
        ...row,
        id: row.id || generateId(),
      });
    });
  });
  return reconstructedRows;
};
