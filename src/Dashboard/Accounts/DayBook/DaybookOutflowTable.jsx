import React from "react";
import { DataTable } from "@/Components/AdminKit";
import { formatAmountINR, formatDate } from "./daybookUtils";
import { RowActions } from "./DaybookInflowTable";

const money = (v) => <span className="db-num">{formatAmountINR(v)}</span>;

const DaybookOutflowTable = ({ rows, onEdit, onDelete, deletingId }) => {
  const columns = [
    {
      key: "vendor",
      title: "Vendor",
      render: (r) => (
        <div className="db-cell-main">
          <strong>{r.vendor?.name || "-"}</strong>
          {r.vendor?.vendor_code ? <span>{String(r.vendor.vendor_code).toUpperCase()}</span> : null}
        </div>
      ),
    },
    { key: "paidDate", title: "Paid on", render: (r) => formatDate(r.paidDate) },
    {
      key: "paidFrom",
      title: "Paid from",
      render: (r) => (
        <div className="db-cell-main">
          <strong>{r.paidFrom === "ACCOUNT" ? "Account" : "Cash"}</strong>
          {r.paidFrom === "ACCOUNT" && r.accountName ? <span>{r.accountName}</span> : null}
        </div>
      ),
    },
    { key: "amountPaid", title: "Amount paid", align: "right", render: (r) => money(r.amountPaid) },
    { key: "tdsAmount", title: "TDS", align: "right", render: (r) => (r.tdsAmount ? money(r.tdsAmount) : "-") },
    { key: "gstAmount", title: "GST", align: "right", render: (r) => (r.gstAmount ? money(r.gstAmount) : "-") },
    {
      key: "actual",
      title: "Actual paid",
      align: "right",
      render: (r) => <span className="db-num is-out">{formatAmountINR(r.actualAmountPaid)}</span>,
    },
    { key: "note", title: "Note", render: (r) => r.note || "-" },
    {
      key: "actions",
      title: "",
      width: 90,
      render: (r) => (
        <RowActions
          label={`outflow to ${r.vendor?.name || "vendor"}`}
          busy={deletingId === r._id}
          onEdit={() => onEdit(r)}
          onDelete={() => onDelete(r)}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey="_id"
      empty={
        <div className="db-empty">
          <strong>No outflow in this period</strong>
          <span>Use “Add outflow” to record a payment to a vendor.</span>
        </div>
      }
    />
  );
};

export default DaybookOutflowTable;
