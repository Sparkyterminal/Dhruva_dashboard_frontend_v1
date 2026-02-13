import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import axios from "axios";
import { useSelector } from "react-redux";
import { message, Modal } from "antd";
import { API_BASE_URL } from "../../../../config";
import { emptyChildRow, buildGroupRow } from "./budgetReportUtils";
ModuleRegistry.registerModules([AllCommunityModule]);

/* ───────── initial seed data ───────── */
const initialData = () => {
  const g1 = { ...buildGroupRow("Infrastructure"), grandTotal: 30000 };
  const c1 = {
    ...emptyChildRow("Infrastructure"),
    slNo: 1,
    particulars: "Tables & Chairs",
    size: "Medium",
    qnty: 10,
    unit: "Pcs",
    rate: 1500,
    totalCost: 15000,
    grandTotal: 0,
    negotiatedAmount: 14000,
  };
  const c2 = {
    ...emptyChildRow("Infrastructure"),
    slNo: 2,
    particulars: "Cupboards",
    size: "Large",
    qnty: 5,
    unit: "Pcs",
    rate: 3000,
    totalCost: 15000,
    grandTotal: 0,
    negotiatedAmount: 14500,
  };

  const g2 = { ...buildGroupRow("Stationery"), grandTotal: 4000 };
  const c3 = {
    ...emptyChildRow("Stationery"),
    slNo: 1,
    particulars: "Notebooks",
    size: "-",
    qnty: 100,
    unit: "Pcs",
    rate: 40,
    totalCost: 4000,
    grandTotal: 0,
    negotiatedAmount: 3800,
  };

  return [g1, c1, c2, g2, c3];
};

/* ═══════════════════════════════════════════
     MAIN COMPONENT
     ═══════════════════════════════════════════ */
const DataGridSpreadsheet = ({
  selectedEventId,
  initialRowData = null,
  reportId = null,
}) => {
  const gridRef = useRef(null);
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.value);
  const [rowData, setRowData] = useState(
    () => initialRowData && initialRowData.length > 0 ? initialRowData : initialData(),
  );
  const [vendors, setVendors] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingVendorCell, setEditingVendorCell] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const config = {
    headers: { Authorization: user?.access_token },
  };

  /* ── Utility: Format Indian Rupee with commas ── */
  const formatIndianRupee = useCallback((amount) => {
    if (!amount && amount !== 0) return "";
    const numAmount = Number(amount);
    if (isNaN(numAmount)) return "";
    // Indian numbering system: 1,00,000 format
    return numAmount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  }, []);

  /* ── Utility: Parse Indian Rupee format ── */
  const parseIndianRupee = useCallback((value) => {
    if (!value) return 0;
    // Remove commas and parse
    const cleaned = String(value).replace(/,/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }, []);

  /* ── vendors ── */
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}vendor/all`, config);
        if (res.data.success && res.data.vendors) {
          // Map vendors to the format expected by the component
          const formattedVendors = res.data.vendors
            .filter((vendor) => vendor.vendor_code) // Only include vendors with vendor_code
            .map((vendor) => ({
              code: vendor.vendor_code, // Use vendor_code from API
              id: vendor.id || vendor._id,
              name: vendor.name || "",
              contact:
                vendor.mobile_no ||
                vendor.alt_mobile_no ||
                vendor.cont_person ||
                "",
            }));
          setVendors(formattedVendors);
        }
      } catch (error) {
        console.error("Error fetching vendors:", error);
      }
    };
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── recalc helper ── */
  const recalcRow = useCallback((data) => {
    const totalCost = (Number(data.qnty) || 0) * (Number(data.rate) || 0);
    return { ...data, totalCost };
  }, []);

  /* ── Vendor cell renderer (shows value, click to edit) ── */
  const VendorCodeCellRenderer = useCallback(
    (params) => {
      if (params.data?.isGroupRow || params.node.rowPinned) return null;

      const cellId = `${params.node.id}_vendorCode`;
      const isEditing = editingVendorCell === cellId;

      if (isEditing) {
        return (
          <select
            defaultValue={params.value || ""}
            onChange={(e) => {
              const selectedVendor = vendors.find(
                (v) => v.code === e.target.value,
              );
              const code = e.target.value;
              const name = selectedVendor ? selectedVendor.name : "";
              const contact = selectedVendor ? selectedVendor.contact : "";
              const vendorId = selectedVendor?.id ?? selectedVendor?._id ?? "";
              params.node.setDataValue("vendorCode", code);
              params.node.setDataValue("vendorName", name);
              params.node.setDataValue("vendorContactNumber", contact);
              params.node.setDataValue("vendorId", vendorId);
              setRowData((prev) =>
                prev.map((r) =>
                  r.id === params.data.id
                    ? {
                        ...r,
                        vendorCode: code,
                        vendorName: name,
                        vendorContactNumber: contact,
                        vendorId,
                      }
                    : r,
                ),
              );
              setEditingVendorCell(null);
            }}
            onBlur={() => setEditingVendorCell(null)}
            autoFocus
            className="vendor-select"
            style={{ width: "100%", height: "100%", minHeight: "38px" }}
          >
            <option value="">-- Select Vendor --</option>
            {vendors.map((v) => (
              <option key={v.code} value={v.code}>
                {v.name} ({v.code})
              </option>
            ))}
          </select>
        );
      }

      // Find vendor name for display
      const selectedVendor = vendors.find((v) => v.code === params.value);
      const displayValue = selectedVendor
        ? `${selectedVendor.name} (${params.value})`
        : params.value;

      return (
        <div
          onClick={() => setEditingVendorCell(cellId)}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 8px",
            cursor: "pointer",
            color: params.value ? "#1a1a1a" : "#94a3b8",
            fontSize: "13px",
          }}
          title={params.value ? displayValue : "Click to select vendor"}
        >
          {params.value ? displayValue : "Click to select"}
        </div>
      );
    },
    [vendors, editingVendorCell],
  );

  /* ── Vendor dropdown editor ── */
  const VendorCellEditor = useCallback(
    (props) => {
      const handleChange = (e) => {
        const selectedVendor = vendors.find((v) => v.code === e.target.value);
        const code = e.target.value;
        const name = selectedVendor ? selectedVendor.name : "";
        const contact = selectedVendor ? selectedVendor.contact : "";
        const vendorId =
          selectedVendor?.id ?? selectedVendor?._id ?? "";
        props.node.setDataValue("vendorCode", code);
        props.node.setDataValue("vendorName", name);
        props.node.setDataValue("vendorContactNumber", contact);
        props.node.setDataValue("vendorId", vendorId);
        setRowData((prev) =>
          prev.map((r) =>
            r.id === props.data.id
              ? {
                  ...r,
                  vendorCode: code,
                  vendorName: name,
                  vendorContactNumber: contact,
                  vendorId,
                }
              : r,
          ),
        );
        props.stopEditing();
      };

      return (
        <select
          defaultValue={props.value}
          onChange={handleChange}
          autoFocus
          className="vendor-select"
        >
          <option value="">-- Select Vendor --</option>
          {vendors.map((v) => (
            <option key={v.code} value={v.code}>
              {v.code} — {v.name}
            </option>
          ))}
        </select>
      );
    },
    [vendors],
  );

  /* ── Toggle expand / collapse ── */
  const toggleGroup = useCallback((groupName) => {
    setRowData((prev) =>
      prev.map((r) =>
        r.isGroupRow && r.groupName === groupName
          ? { ...r, expanded: !r.expanded }
          : r,
      ),
    );
  }, []);

  /* ── visible rows (respect collapsed groups) ── */
  const visibleRows = useMemo(() => {
    const result = [];
    const collapsedGroups = new Set();
    for (const r of rowData) {
      if (r.isGroupRow) {
        result.push(r);
        if (!r.expanded) collapsedGroups.add(r.groupName);
        else collapsedGroups.delete(r.groupName);
      } else {
        if (!collapsedGroups.has(r.groupName)) result.push(r);
      }
    }
    return result;
  }, [rowData]);

  /* ── Group row expand/collapse renderer ── */
  const GroupCellRenderer = useCallback(
    (params) => {
      if (!params.data?.isGroupRow)
        return <span style={{ color: "#1a1a1a" }}>{params.value}</span>;
      const expanded = params.data.expanded;
      return (
        <div
          onClick={() => toggleGroup(params.data.groupName)}
          style={{
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "14px",
            color: "#1a1a1a",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            userSelect: "none",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              transition: "transform 0.2s",
              display: "inline-block",
              transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            ▶
          </span>
          {params.data.groupName}
        </div>
      );
    },
    [toggleGroup],
  );

  /* ── Delete button renderer (with confirmation) ── */
  const DeleteCellRenderer = useCallback((params) => {
    if (params.node.rowPinned) return null;
    if (params.data?.isGroupRow) {
      return (
        <button
          className="delete-group-btn"
          title="Delete entire group"
          onClick={() => {
            const groupName = params.data.groupName;
            Modal.confirm({
              title: "Delete entire group?",
              content:
                "Are you sure you want to delete this group? All rows and data in this group will be removed. This cannot be undone.",
              okText: "Yes, delete group",
              okType: "danger",
              cancelText: "Cancel",
              onOk() {
                setRowData((prev) =>
                  prev.filter((r) => r.groupName !== groupName)
                );
              },
            });
          }}
        >
          ✕ Group
        </button>
      );
    }
    return (
      <button
        className="delete-row-btn"
        title="Delete row"
        onClick={() => {
          Modal.confirm({
            title: "Delete this row?",
            content:
              "Are you sure you don't want this row? All details you entered here will be removed. This cannot be undone.",
            okText: "Yes, delete row",
            okType: "danger",
            cancelText: "Cancel",
            onOk() {
              setRowData((prev) =>
                prev.filter((r) => r.id !== params.data.id)
              );
            },
          });
        }}
      >
        ✕
      </button>
    );
  }, []);

  /* ── Add child row under group ── */
  const AddRowCellRenderer = useCallback((params) => {
    if (!params.data?.isGroupRow) return null;
    return (
      <button
        className="add-child-btn"
        title="Add row to this group"
        onClick={() => {
          const groupName = params.data.groupName;
          setRowData((prev) => {
            const newData = [...prev];
            // Find last child of this group
            let insertIdx = newData.findIndex((r) => r.id === params.data.id);
            for (let i = insertIdx + 1; i < newData.length; i++) {
              if (newData[i].isGroupRow) break;
              if (newData[i].groupName === groupName) insertIdx = i;
            }
            // Compute slNo
            const siblings = newData.filter(
              (r) => !r.isGroupRow && r.groupName === groupName,
            );
            const newChild = {
              ...emptyChildRow(groupName),
              slNo: siblings.length + 1,
            };
            newData.splice(insertIdx + 1, 0, newChild);
            return newData;
          });
        }}
      >
        + Row
      </button>
    );
  }, []);

  /* ── Column definitions ── */
  const columnDefs = useMemo(
    () => [
      {
        headerName: "",
        field: "__add",
        width: 80,
        pinned: "left",
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: AddRowCellRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        headerName: "",
        field: "__delete",
        width: 80,
        pinned: "left",
        editable: false,
        sortable: false,
        filter: false,
        cellRenderer: DeleteCellRenderer,
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        headerName: "Sl. No",
        field: "slNo",
        width: 90,
        editable: (params) => !params.data.isGroupRow,
        cellClass: (params) =>
          params.data.isGroupRow ? "group-cell" : "editable-cell",
      },
      {
        headerName: "Particulars",
        field: "particulars",
        width: 240,
        editable: (params) => !params.data.isGroupRow,
        cellRenderer: GroupCellRenderer,
        cellClass: (params) =>
          params.data.isGroupRow ? "group-cell" : "editable-cell",
      },
      {
        headerName: "Size",
        field: "size",
        width: 110,
        editable: (params) => !params.data.isGroupRow,
        cellClass: (params) =>
          params.data.isGroupRow ? "group-cell" : "editable-cell",
      },
      {
        headerName: "Qnty",
        field: "qnty",
        width: 90,
        editable: (params) => !params.data.isGroupRow,
        cellClass: (params) =>
          params.data.isGroupRow ? "group-cell" : "editable-cell",
        type: "numericColumn",
        valueParser: (params) => Number(params.newValue) || 0,
      },
      {
        headerName: "Unit",
        field: "unit",
        width: 90,
        editable: (params) => !params.data.isGroupRow,
        cellClass: (params) =>
          params.data.isGroupRow ? "group-cell" : "editable-cell",
      },
      {
        headerName: "Rate (₹)",
        field: "rate",
        width: 120,
        editable: (params) => !params.data.isGroupRow,
        cellClass: (params) =>
          params.data.isGroupRow ? "group-cell" : "editable-cell",
        type: "numericColumn",
        valueParser: (params) => parseIndianRupee(params.newValue) || 0,
        valueFormatter: (params) =>
          params.data.isGroupRow
            ? ""
            : params.value
              ? `₹${formatIndianRupee(params.value)}`
              : "",
      },
      {
        headerName: "Total Cost (₹)",
        field: "totalCost",
        width: 140,
        editable: false,
        type: "numericColumn",
        valueFormatter: (params) =>
          params.data.isGroupRow
            ? ""
            : params.value
              ? `₹${formatIndianRupee(params.value)}`
              : "",
        cellStyle: (params) => ({
          backgroundColor: params.data.isGroupRow ? "#e2e8f0" : "#f8fafc",
          color: "#1a1a1a",
          fontWeight: params.data.isGroupRow ? 700 : 400,
        }),
      },
      // Grand Total column – commented out
      // {
      //   headerName: "Grand Total (₹)",
      //   field: "grandTotal",
      //   width: 160,
      //   editable: (params) =>
      //     !!params.data?.isGroupRow && !params.node.rowPinned,
      //   type: "numericColumn",
      //   valueParser: (params) => parseIndianRupee(params.newValue) || 0,
      //   valueFormatter: (params) =>
      //     params.value != null && params.value !== ""
      //       ? `₹${formatIndianRupee(params.value)}`
      //       : "",
      //   cellStyle: (params) => {
      //     if (params.data?.isGroupRow) {
      //       return {
      //         backgroundColor: "#dbeafe",
      //         color: "#1e40af",
      //         fontWeight: 700,
      //         fontSize: "15px",
      //         display: "flex",
      //         alignItems: "center",
      //         justifyContent: "flex-end",
      //       };
      //     }
      //     return { backgroundColor: "#f8fafc", color: "#1a1a1a" };
      //   },
      //   cellClass: "grand-total-cell",
      // },
      {
        headerName: "Negotiated Amt (₹)",
        field: "negotiatedAmount",
        width: 170,
        editable: (params) => !params.data.isGroupRow,
        cellClass: (params) =>
          params.data.isGroupRow ? "group-cell" : "editable-cell",
        type: "numericColumn",
        valueParser: (params) => parseIndianRupee(params.newValue) || 0,
        valueFormatter: (params) =>
          params.data.isGroupRow
            ? ""
            : params.value
              ? `₹${formatIndianRupee(params.value)}`
              : "",
      },
      {
        headerName: "Vendor Code",
        field: "vendorCode",
        width: 170,
        editable: false,
        cellRenderer: VendorCodeCellRenderer,
        cellClass: (params) =>
          params.data.isGroupRow ? "group-cell" : "editable-cell",
      },
      {
        headerName: "Vendor Name",
        field: "vendorName",
        width: 180,
        editable: false,
        cellStyle: (params) => ({
          backgroundColor: params.data.isGroupRow ? "#e2e8f0" : "#f8fafc",
          color: "#1a1a1a",
        }),
      },
      {
        headerName: "Vendor Contact",
        field: "vendorContactNumber",
        width: 160,
        editable: (params) => !params.data?.isGroupRow,
        cellStyle: (params) => ({
        //   backgroundColor: params.data.isGroupRow ? "#e2e8f0" : "#f8fafc",
          color: "#1a1a1a",
        }),
      },
      {
        headerName: "Inhouse",
        field: "inhouseAmount",
        width: 110,
        editable: false, // Disable editing since we handle it via cellRenderer
        cellRenderer: (params) => {
          if (params.data.isGroupRow || params.node.rowPinned) return null;
          return (
            <input
              type="checkbox"
              checked={!!params.value}
              onChange={(e) => {
                params.node.setDataValue("inhouseAmount", e.target.checked);
                // Update rowData state
                setRowData((prev) =>
                  prev.map((r) =>
                    r.id === params.data.id
                      ? { ...r, inhouseAmount: e.target.checked }
                      : r,
                  ),
                );
              }}
              onClick={(e) => e.stopPropagation()} // Prevent cell click event
              className="grid-checkbox"
            />
          );
        },
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        headerName: "Assets Purchase",
        field: "assetsPurchase",
        width: 140,
        editable: false, // Disable editing since we handle it via cellRenderer
        cellRenderer: (params) => {
          if (params.data.isGroupRow || params.node.rowPinned) return null;
          return (
            <input
              type="checkbox"
              checked={!!params.value}
              onChange={(e) => {
                params.node.setDataValue("assetsPurchase", e.target.checked);
                // Update rowData state
                setRowData((prev) =>
                  prev.map((r) =>
                    r.id === params.data.id
                      ? { ...r, assetsPurchase: e.target.checked }
                      : r,
                  ),
                );
              }}
              onClick={(e) => e.stopPropagation()} // Prevent cell click event
              className="grid-checkbox"
            />
          );
        },
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        headerName: "Direct Payment",
        field: "directPayment",
        width: 140,
        editable: false, // Disable editing since we handle it via cellRenderer
        cellRenderer: (params) => {
          if (params.data.isGroupRow || params.node.rowPinned) return null;
          return (
            <input
              type="checkbox"
              checked={!!params.value}
              onChange={(e) => {
                params.node.setDataValue("directPayment", e.target.checked);
                // Update rowData state
                setRowData((prev) =>
                  prev.map((r) =>
                    r.id === params.data.id
                      ? { ...r, directPayment: e.target.checked }
                      : r,
                  ),
                );
              }}
              onClick={(e) => e.stopPropagation()} // Prevent cell click event
              className="grid-checkbox"
            />
          );
        },
        cellStyle: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
      {
        headerName: "Actual Paid Amt (₹)",
        field: "actualPaidAmount",
        width: 170,
        editable: (params) => !params.data.isGroupRow,
        cellClass: (params) =>
          params.data.isGroupRow ? "group-cell" : "editable-cell",
        type: "numericColumn",
        valueParser: (params) => parseIndianRupee(params.newValue) || 0,
        valueFormatter: (params) =>
          params.data.isGroupRow
            ? ""
            : params.value
              ? `₹${formatIndianRupee(params.value)}`
              : "",
      },
    ],
    [
      formatIndianRupee,
      parseIndianRupee,
      recalcRow,
      VendorCodeCellRenderer,
      VendorCellEditor,
      GroupCellRenderer,
      DeleteCellRenderer,
      AddRowCellRenderer,
    ],
  );

  /* ── Default col def ── */
  const defaultColDef = useMemo(
    () => ({
      sortable: false,
      filter: false,
      resizable: true,
      suppressMovable: true,
      wrapText: true,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      cellStyle: { color: "#1a1a1a", fontSize: "13px", lineHeight: "1.4" },
    }),
    [],
  );

  /* ── Pinned bottom totals ── */
  const pinnedBottomRowData = useMemo(() => {
    let totalCostSum = 0;
    let grandTotalSum = 0;
    let negotiatedAmountSum = 0;
    let actualPaidAmountSum = 0;

    for (const r of rowData) {
      if (r.isGroupRow) {
        grandTotalSum += Number(r.grandTotal) || 0;
        continue;
      }
      totalCostSum += Number(r.totalCost) || 0;
      negotiatedAmountSum += Number(r.negotiatedAmount) || 0;
      actualPaidAmountSum += Number(r.actualPaidAmount) || 0;
    }

    return [
      {
        id: "pinned_grand_total",
        isGroupRow: false,
        slNo: "",
        particulars: "GRAND TOTAL",
        size: "",
        qnty: "",
        unit: "",
        rate: "",
        totalCost: totalCostSum,
        grandTotal: grandTotalSum,
        negotiatedAmount: negotiatedAmountSum,
        vendorCode: "",
        vendorName: "",
        vendorContactNumber: "",
        vendorId: "",
        inhouseAmount: "",
        assetsPurchase: "",
        directPayment: "",
        actualPaidAmount: actualPaidAmountSum,
        __add: "",
        __delete: "",
      },
    ];
  }, [rowData]);

  /* ── Prevent editing on pinned bottom row and checkbox columns ── */
  const onCellEditingStarted = useCallback((params) => {
    if (params.node.rowPinned) {
      setTimeout(() => params.api.stopEditing(true), 0);
    }
    // Prevent editing checkbox columns
    const checkboxFields = ["inhouseAmount", "assetsPurchase", "directPayment"];
    if (checkboxFields.includes(params.colDef.field)) {
      setTimeout(() => params.api.stopEditing(true), 0);
    }
  }, []);

  /* ── Cell value changed → recalc ── */
  const onCellValueChanged = useCallback(
    (params) => {
      if (params.node.rowPinned) return;
      const field = params.colDef.field;
      if (params.data.isGroupRow) {
        if (field === "grandTotal") {
          setRowData((prev) =>
            prev.map((r) =>
              r.id === params.data.id
                ? { ...r, grandTotal: parseIndianRupee(params.newValue) || 0 }
                : r,
            ),
          );
        }
        return;
      }
      if (field === "qnty" || field === "rate") {
        const updated = recalcRow(params.data);
        params.node.setDataValue("totalCost", updated.totalCost);
        setRowData((prev) =>
          prev.map((r) => (r.id === params.data.id ? { ...r, ...updated } : r)),
        );
      } else {
        setRowData((prev) =>
          prev.map((r) =>
            r.id === params.data.id ? { ...r, [field]: params.newValue } : r,
          ),
        );
      }
    },
    [parseIndianRupee, recalcRow],
  );

  /* ── Add a new group ── */
  const addGroup = useCallback(() => {
    const name = newGroupName.trim();
    if (!name) return;
    const groupRow = buildGroupRow(name);
    const firstChild = { ...emptyChildRow(name), slNo: 1 };
    setRowData((prev) => [...prev, groupRow, firstChild]);
    setNewGroupName("");
  }, [newGroupName]);

  /* ── Row styling ── */
  const getRowStyle = useCallback((params) => {
    if (params.node.rowPinned === "bottom") {
      return {
        fontWeight: 700,
        backgroundColor: "#d1fae5",
        color: "#1a1a1a",
        fontSize: "14px",
      };
    }
    if (params.data?.isGroupRow) {
      return {
        backgroundColor: "#e2e8f0",
        fontWeight: 700,
        color: "#1a1a1a",
        fontSize: "14px",
      };
    }
    return { color: "#1a1a1a" };
  }, []);

  const getRowHeight = useCallback((params) => {
    if (params.data?.isGroupRow) return 44;
    return 38;
  }, []);

  /* ── Keyboard nav (Excel-like Tab / Enter) ── */
  const onCellKeyDown = useCallback(() => {
    // AG Grid handles Tab/Enter natively with singleClickEdit
  }, []);

  /* ── Prepare data for backend ── */
  const prepareDataForBackend = useCallback(() => {
    // Filter out group rows and internal fields
    const dataRows = rowData.filter((row) => !row.isGroupRow);
    
    // Group rows by groupName
    const groupedData = {};
    dataRows.forEach((row) => {
      const groupName = row.groupName || "Uncategorized";
      if (!groupedData[groupName]) {
        groupedData[groupName] = [];
      }
      groupedData[groupName].push({
        slNo: row.slNo || "",
        particulars: row.particulars || "",
        size: row.size || "",
        qnty: Number(row.qnty) || 0,
        unit: row.unit || "",
        rate: Number(row.rate) || 0,
        totalCost: Number(row.totalCost) || 0,
        negotiatedAmount: Number(row.negotiatedAmount) || 0,
        vendorCode: row.vendorCode || "",
        vendorName: row.vendorName || "",
        vendorContactNumber: row.vendorContactNumber || "",
        vendorId: row.vendorId || "",
        inhouseAmount: Boolean(row.inhouseAmount),
        assetsPurchase: Boolean(row.assetsPurchase),
        directPayment: Boolean(row.directPayment),
        actualPaidAmount: Number(row.actualPaidAmount) || 0,
      });
    });

    // Get grand totals from group rows
    const grandTotals = {};
    rowData
      .filter((row) => row.isGroupRow)
      .forEach((groupRow) => {
        grandTotals[groupRow.groupName] = Number(groupRow.grandTotal) || 0;
      });

    return {
      eventId: selectedEventId,
      budgetData: {
        groups: groupedData,
        grandTotals: grandTotals,
        summary: {
          totalCost: pinnedBottomRowData[0]?.totalCost || 0,
          grandTotal: pinnedBottomRowData[0]?.grandTotal || 0,
          negotiatedAmount: pinnedBottomRowData[0]?.negotiatedAmount || 0,
          actualPaidAmount: pinnedBottomRowData[0]?.actualPaidAmount || 0,
        },
      },
      metadata: {
        createdAt: new Date().toISOString(),
        totalRows: dataRows.length,
        totalGroups: Object.keys(groupedData).length,
      },
    };
  }, [rowData, selectedEventId, pinnedBottomRowData]);

  /* ── Submit to backend (POST new or PUT update) ── */
  const submitToBackend = useCallback(async () => {
    if (!selectedEventId) {
      message.warning("Please select a confirmed event first");
      return;
    }
    setIsSaving(true);
    try {
      const payload = prepareDataForBackend();
      const url = reportId
        ? `${API_BASE_URL}budget-report/${reportId}`
        : `${API_BASE_URL}budget-report`;
      const method = reportId ? "put" : "post";
      await axios[method](url, payload, config);
      message.success(
        reportId ? "Budget report updated successfully!" : "Budget report submitted successfully!",
      );
      navigate("/user/budgetreport/eventwise", { replace: true });
      return { success: true };
    } catch (error) {
      console.error("Error saving budget report:", error);
      message.error(
        error.response?.data?.message ||
          "Failed to save budget report. Please try again.",
      );
      return { success: false };
    } finally {
      setIsSaving(false);
    }
  }, [
    prepareDataForBackend,
    config,
    selectedEventId,
    reportId,
    navigate,
  ]);

  return (
    <div className="spreadsheet-wrapper">
      {/* Toolbar */}
      <div className="spreadsheet-toolbar">
        <div className="toolbar-left">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addGroup()}
            placeholder="New group name…"
            className="group-name-input"
          />
          <button
            onClick={addGroup}
            className="toolbar-btn toolbar-btn-primary"
          >
            + Add Group
          </button>
        </div>
        <div className="toolbar-right">
          <span className="row-count-badge">
            {rowData.filter((r) => !r.isGroupRow).length} rows ·{" "}
            {rowData.filter((r) => r.isGroupRow).length} groups
          </span>
          <button
            type="button"
            onClick={submitToBackend}
            className="toolbar-btn toolbar-btn-primary"
            disabled={isSaving || !selectedEventId}
            title={!selectedEventId ? "Please select an event first" : "Submit budget report"}
          >
            {isSaving ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="ag-theme-alpine spreadsheet-grid">
        <AgGridReact
          ref={gridRef}
          rowData={visibleRows}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pinnedBottomRowData={pinnedBottomRowData}
          getRowId={(params) => params.data.id}
          getRowStyle={getRowStyle}
          getRowHeight={getRowHeight}
          onCellValueChanged={onCellValueChanged}
          onCellEditingStarted={onCellEditingStarted}
          onCellKeyDown={onCellKeyDown}
          rowSelection={{ mode: "multiRow", enableClickSelection: false }}
          animateRows={true}
          suppressRowTransform={true}
          singleClickEdit={true}
          stopEditingWhenCellsLoseFocus={true}
          enterNavigatesVertically={true}
          enterNavigatesVerticallyAfterEdit={true}
          tabToNextCell={(params) => params.nextCellPosition}
          undoRedoCellEditing={true}
          undoRedoCellEditingLimit={20}
          cellSelection={false}
        />
      </div>
    </div>
  );
};

export default DataGridSpreadsheet;
