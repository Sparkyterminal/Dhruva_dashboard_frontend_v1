import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/Components/AdminKit";
import { formatAmountINR, formatDate, formatEventReference } from "./daybookUtils";

export const RowActions = ({ onEdit, onDelete, busy, label }) => (
  <div className="db-row-actions">
    <button type="button" aria-label={`Edit ${label}`} onClick={onEdit} disabled={busy}>
      <Pencil size={15} aria-hidden="true" />
    </button>
    <button type="button" className="is-danger" aria-label={`Delete ${label}`} onClick={onDelete} disabled={busy}>
      <Trash2 size={15} aria-hidden="true" />
    </button>
  </div>
);

const money = (v) => <span className="db-num">{formatAmountINR(v)}</span>;

const DaybookInflowTable = ({ rows, onEdit, onDelete, deletingId }) => {
  const columns = [
    {
      key: "client",
      title: "Client",
      render: (r) => (
        <div className="db-cell-main">
          <strong>{r.clientName || "-"}</strong>
          {r.eventReference ? <span>{formatEventReference(r.eventReference)}</span> : null}
        </div>
      ),
    },
    { key: "eventDate", title: "Event date", render: (r) => formatDate(r.eventDate) },
    { key: "receivedDate", title: "Received on", render: (r) => formatDate(r.receivedDate) },
    {
      key: "receivedIn",
      title: "Received in",
      render: (r) => (
        <div className="db-cell-main">
          <strong>{r.receivedIn === "ACCOUNT" ? "Account" : "Cash"}</strong>
          {r.receivedIn === "ACCOUNT" && r.accountName ? <span>{r.accountName}</span> : null}
        </div>
      ),
    },
    { key: "amountReceived", title: "Amount received", align: "right", render: (r) => money(r.amountReceived) },
    { key: "gstAmount", title: "GST", align: "right", render: (r) => (r.gstAmount ? money(r.gstAmount) : "-") },
    { key: "tdsAmount", title: "TDS", align: "right", render: (r) => (r.tdsAmount ? money(r.tdsAmount) : "-") },
    {
      key: "net",
      title: "Net received",
      align: "right",
      render: (r) => <span className="db-num is-in">{formatAmountINR(r.netAmountReceived)}</span>,
    },
    { key: "note", title: "Note", render: (r) => r.note || "-" },
    {
      key: "actions",
      title: "",
      width: 90,
      render: (r) => (
        <RowActions
          label={`inflow from ${r.clientName || "client"}`}
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
          <strong>No inflow in this period</strong>
          <span>Use “Add inflow” to record money received.</span>
        </div>
      }
    />
  );
};

export default DaybookInflowTable;
