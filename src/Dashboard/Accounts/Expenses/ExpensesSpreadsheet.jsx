import React, { useCallback, useMemo, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import {
  ENTITY_OPTIONS,
  PAYMENT_MODE_OPTIONS,
  buildPinnedTotalRow,
  createEmptyExpenseRow,
  getEventDisplayLabel,
  getEventId,
  renumberRows,
} from "./expensesUtils";

ModuleRegistry.registerModules([AllCommunityModule]);

const formatINR = (value) => {
  const num = Number(value);
  if (!num && num !== 0) return "";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseAmountValue = (raw) => {
  const v = String(raw ?? "").replace(/[^\d.-]/g, "");
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const amountColumnDef = (headerName, field, readOnly) => ({
  headerName,
  field,
  width: 130,
  editable: (p) => isEditableRow(p, readOnly),
  cellClass: "editable-cell",
  valueParser: (p) => parseAmountValue(p.newValue),
  valueFormatter: (p) =>
    p.value != null && p.value !== "" ? formatINR(p.value) : "",
});

const isEditableRow = (params, readOnly) =>
  !readOnly && !params.data?.isTotalRow;

const ExpensesSpreadsheet = ({
  rows,
  onRowsChange,
  readOnly = false,
  events = [],
}) => {
  const gridRef = useRef(null);

  const eventById = useMemo(() => {
    const map = new Map();
    events.forEach((ev) => {
      const id = getEventId(ev?.raw || ev) || ev.id;
      if (id) map.set(String(id), ev?.raw || ev);
    });
    return map;
  }, [events]);

  const eventSelectLabels = useMemo(
    () => ["", ...events.map((e) => e.label).filter(Boolean)],
    [events],
  );

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Sl. No",
        field: "slNo",
        width: 72,
        editable: false,
        pinned: "left",
        cellStyle: { fontWeight: 600, backgroundColor: "#f8fafc" },
      },
      {
        headerName: "Event Reference",
        field: "eventReferenceId",
        width: 240,
        editable: (p) => isEditableRow(p, readOnly),
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: eventSelectLabels },
        cellClass: "editable-cell",
        valueGetter: (p) => {
          if (p.data?.isTotalRow) return "";
          if (p.data?.eventReferenceLabel) return p.data.eventReferenceLabel;
          const ev = eventById.get(String(p.data?.eventReferenceId || ""));
          return ev ? getEventDisplayLabel(ev) : "";
        },
        valueSetter: (p) => {
          const label = String(p.newValue || "").trim();
          if (!label) {
            p.data.eventReferenceId = "";
            p.data.eventReferenceLabel = "";
            return true;
          }
          const opt = events.find((e) => e.label === label);
          p.data.eventReferenceId = opt?.id || "";
          p.data.eventReferenceLabel = opt?.label || label;
          return true;
        },
      },
      {
        headerName: "Particulars",
        field: "particulars",
        width: 200,
        editable: (p) => isEditableRow(p, readOnly),
        cellClass: "editable-cell",
      },
      {
        headerName: "Category",
        field: "category",
        width: 120,
        editable: (p) => isEditableRow(p, readOnly),
        cellClass: "editable-cell",
      },
      amountColumnDef("In Amount (₹)", "inAmount", readOnly),
      amountColumnDef("Out Amount (₹)", "outAmount", readOnly),
      {
        headerName: "Paid To",
        field: "paidTo",
        width: 160,
        editable: (p) => isEditableRow(p, readOnly),
        cellClass: "editable-cell",
      },
      {
        headerName: "Payment Mode",
        field: "paymentMode",
        width: 130,
        editable: (p) => isEditableRow(p, readOnly),
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: PAYMENT_MODE_OPTIONS },
        cellClass: "editable-cell",
      },
      {
        headerName: "Entity Account",
        field: "entityAccount",
        width: 240,
        editable: (p) => isEditableRow(p, readOnly),
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["", ...ENTITY_OPTIONS] },
        cellClass: "editable-cell",
      },
      {
        headerName: "Remarks",
        field: "remarks",
        width: 180,
        editable: (p) => isEditableRow(p, readOnly),
        cellClass: "editable-cell",
      },
    ],
    [eventById, eventSelectLabels, events, readOnly],
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: false,
      filter: false,
      resizable: true,
      suppressMovable: true,
      wrapText: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      cellStyle: { fontSize: "13px", lineHeight: "1.4" },
    }),
    [],
  );

  const pinnedBottomRowData = useMemo(() => buildPinnedTotalRow(rows), [rows]);

  const onCellValueChanged = useCallback(
    (event) => {
      if (readOnly) return;
      const next = rows.map((row) =>
        row.id === event.data.id ? { ...row, ...event.data } : row,
      );
      onRowsChange(renumberRows(next));
    },
    [onRowsChange, readOnly, rows],
  );

  const focusFirstEditableCell = (rowIndex) => {
    gridRef.current?.api?.startEditingCell({
      rowIndex,
      colKey: "eventReferenceId",
    });
  };

  const handleAddRow = () => {
    const next = renumberRows([
      ...rows,
      createEmptyExpenseRow({ slNo: rows.length + 1 }),
    ]);
    onRowsChange(next);
    setTimeout(() => focusFirstEditableCell(next.length - 1), 0);
  };

  const handleDeleteSelected = () => {
    const selected = gridRef.current?.api?.getSelectedRows?.() || [];
    if (!selected.length) return;
    const ids = new Set(selected.map((r) => r.id));
    const filtered = rows.filter((r) => !ids.has(r.id));
    onRowsChange(
      filtered.length
        ? renumberRows(filtered)
        : renumberRows([createEmptyExpenseRow()]),
    );
  };

  return (
    <div className="expenses-spreadsheet-wrapper">
      {!readOnly && (
        <div className="expenses-spreadsheet-toolbar">
          <div className="toolbar-left">
            <button
              type="button"
              className="toolbar-btn toolbar-btn-primary"
              onClick={handleAddRow}
            >
              + Add Row
            </button>
            <button type="button" className="toolbar-btn" onClick={handleDeleteSelected}>
              Delete Selected
            </button>
          </div>
          <span className="row-count-badge">
            {rows.length} rows
            {events.length > 0
              ? ` · ${events.length} events loaded`
              : " · loading events…"}
          </span>
        </div>
      )}

      <div className="ag-theme-alpine expenses-spreadsheet-grid">
        <AgGridReact
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pinnedBottomRowData={pinnedBottomRowData}
          getRowId={(p) => p.data.id}
          onCellValueChanged={onCellValueChanged}
          singleClickEdit={!readOnly}
          stopEditingWhenCellsLoseFocus
          enterNavigatesVertically
          enterNavigatesVerticallyAfterEdit
          undoRedoCellEditing={!readOnly}
          undoRedoCellEditingLimit={30}
          rowSelection={
            readOnly ? undefined : { mode: "multiRow", enableClickSelection: true }
          }
          suppressRowClickSelection={!readOnly}
          animateRows
          domLayout="normal"
        />
      </div>

      <style>{`
        .expenses-spreadsheet-wrapper { width: 100%; }
        .expenses-spreadsheet-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .expenses-spreadsheet-toolbar .toolbar-left {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .expenses-spreadsheet-toolbar .toolbar-btn {
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #334155;
          border-radius: 8px;
          padding: 8px 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .expenses-spreadsheet-toolbar .toolbar-btn-primary {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          color: #fff;
          border: none;
        }
        .expenses-spreadsheet-toolbar .row-count-badge {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
        }
        .expenses-spreadsheet-grid {
          height: min(70vh, 720px);
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default ExpensesSpreadsheet;
