import React, { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Info, TriangleAlert, X } from "lucide-react";
import { Dialog } from "@/Components/FormKit";
import { subscribeToasts } from "./toast";
import "./AdminKit.css";

/** Bottom-right notifications fed by `toast.*`. Mount once per screen shell. */
export const Toaster = () => {
  const [items, setItems] = useState([]);

  useEffect(
    () =>
      subscribeToasts((item) => {
        setItems((prev) => [...prev, item]);
        setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== item.id)), 3800);
      }),
    [],
  );

  if (!items.length) return null;
  const Icon = { success: CheckCircle2, error: TriangleAlert, info: Info };
  return (
    <div className="ak-toasts" role="status" aria-live="polite">
      {items.map((t) => {
        const Glyph = Icon[t.kind] || Info;
        return (
          <div key={t.id} className={`ak-toast is-${t.kind}`}>
            <Glyph size={18} aria-hidden="true" />
            <span>{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

/** "Are you sure?" dialog. */
export const ConfirmDialog = ({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onCancel,
}) => (
  <Dialog open={open} onClose={onCancel} title={title} width={420}>
    <p className="ak-confirm-text">{message}</p>
    <div className="fk-actions">
      <button type="button" className="fk-btn" onClick={onCancel} disabled={busy}>
        Cancel
      </button>
      <button type="button" className="fk-btn is-danger" onClick={onConfirm} disabled={busy}>
        {busy ? "Please wait…" : confirmLabel}
      </button>
    </div>
  </Dialog>
);

/**
 * Data table with its own pagination.
 * columns: { key, title, render?(row, index), width?, align?, className? }[]
 * pagination: { page, pageSize, total } (1-based). Omit for no paging.
 */
export const DataTable = ({
  columns,
  rows,
  rowKey = "id",
  loading,
  pagination,
  onPageChange,
  onPageSizeChange,
  empty,
  pageSizeOptions = [10, 20, 50],
}) => {
  const list = Array.isArray(rows) ? rows : [];
  const total = pagination?.total ?? list.length;
  const pageSize = pagination?.pageSize ?? list.length;
  const page = pagination?.page ?? 1;
  const pages = Math.max(1, Math.ceil(total / (pageSize || 1)));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const offset = pagination ? (page - 1) * pageSize : 0;

  const cell = (col, row, index) =>
    col.render ? col.render(row, index + offset) : (row[col.key] ?? <span className="ak-dash">—</span>);

  return (
    <div className="ak-table-wrap">
      <div className="ak-scroll">
        <table className="ak-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} style={{ width: c.width, textAlign: c.align || "left" }}>
                  {c.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={`s${i}`} className="is-skeleton">
                    {columns.map((c) => (
                      <td key={c.key}>
                        <i />
                      </td>
                    ))}
                  </tr>
                ))
              : list.map((row, i) => (
                  <tr key={row[rowKey] ?? i}>
                    {columns.map((c) => (
                      <td key={c.key} style={{ textAlign: c.align || "left" }} className={c.className}>
                        {cell(c, row, i)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!loading && list.length === 0 ? <div className="ak-empty">{empty}</div> : null}

      {pagination && total > 0 ? (
        <div className="ak-pager">
          <span className="ak-pager-info">
            {from}–{to} of {total}
          </span>
          <div className="ak-pager-controls">
            {onPageSizeChange ? (
              <select
                aria-label="Rows per page"
                className="ak-pager-size"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
              >
                {pageSizeOptions.map((n) => (
                  <option key={n} value={n}>
                    {n} / page
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              className="ak-page-btn"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <span className="ak-page-now">
              {page} / {pages}
            </span>
            <button
              type="button"
              className="ak-page-btn"
              aria-label="Next page"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/** Initial-letter avatar + name (+ optional sub line). */
export const PersonCell = ({ name, sub }) => (
  <div className="pk-who">
    <span className="pk-avatar" aria-hidden="true">
      {String(name || "?").trim().charAt(0).toUpperCase()}
    </span>
    <div style={{ minWidth: 0 }}>
      <strong>{name || "—"}</strong>
      {sub ? <span>{sub}</span> : null}
    </div>
  </div>
);
