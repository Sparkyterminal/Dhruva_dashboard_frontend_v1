import React, { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Dialog } from "@/Components/FormKit";
import { CA_ACTIONS, getRowId } from "./bulkCaCheck";
import "./BulkApprove.css";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const sum = (rows, key) => rows.reduce((t, r) => t + (Number(r?.[key]) || 0), 0);

/**
 * Confirmation for approving / rejecting the selected requirements.
 * `run(rows, onProgress)` does the work and resolves to { succeeded, failed }.
 * Phases: confirm -> running (progress bar) -> done (only shown when something failed, so it can be retried).
 */
const BulkConfirmDialog = ({ open, action, rows, run, onClose, onFinished }) => {
  const [phase, setPhase] = useState("confirm");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [failed, setFailed] = useState([]);
  const [succeededCount, setSucceededCount] = useState(0);

  useEffect(() => {
    if (open) {
      setPhase("confirm");
      setFailed([]);
      setSucceededCount(0);
      setProgress({ done: 0, total: 0 });
    }
  }, [open]);

  const meta = CA_ACTIONS[action] || CA_ACTIONS.APPROVED;
  const isReject = meta.tone === "reject";
  const working = phase === "running";
  const targetRows = phase === "done" ? failed.map((f) => f.row) : rows;
  const noAmount = targetRows.filter((r) => !(Number(r.amount_paid) > 0)).length;

  const start = async () => {
    setPhase("running");
    setProgress({ done: 0, total: targetRows.length });
    const result = await run(targetRows, (done, total) => setProgress({ done, total }));
    setSucceededCount((n) => n + result.succeeded.length);
    onFinished?.(result);
    if (result.failed.length === 0) {
      onClose();
    } else {
      setFailed(result.failed);
      setPhase("done");
    }
  };

  const close = () => {
    if (!working) onClose();
  };

  const count = targetRows.length;
  const title =
    phase === "done"
      ? `${failed.length} could not be ${meta.past}`
      : `${meta.verb} ${count} requirement${count === 1 ? "" : "s"}?`;

  return (
    <Dialog open={open} onClose={close} title={title} width={620}>
      <div className="ba-dialog">
        {phase === "done" ? (
          <p className="ba-lead">
            {succeededCount} {meta.past} successfully. These {failed.length} failed. You can try them again.
          </p>
        ) : (
          <p className="ba-lead">
            {isReject
              ? "These requirements will be marked as rejected by the CA."
              : "These requirements will be marked as approved by the CA."}
          </p>
        )}

        {phase !== "done" && noAmount > 0 ? (
          <p className="ba-warn">
            <TriangleAlert size={15} aria-hidden="true" />
            {noAmount} of these {noAmount === 1 ? "has" : "have"} no amount paid entered yet.
          </p>
        ) : null}

        <div className="ba-list" role="list">
          {targetRows.map((r) => {
            const failure = failed.find((f) => getRowId(f.row) === getRowId(r));
            return (
              <div className="ba-item" role="listitem" key={getRowId(r)}>
                <div className="ba-item-main">
                  <strong>{r.purpose || "-"}</strong>
                  <span>
                    {[r.department?.name, r.vendor?.name].filter(Boolean).join(" · ") || "-"}
                  </span>
                  {failure ? <em>{failure.error}</em> : null}
                </div>
                <div className="ba-item-amt">
                  <strong>{money(r.amount)}</strong>
                  <span>Paid {money(r.amount_paid)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="ba-totals">
          <span>
            Requested <strong>{money(sum(targetRows, "amount"))}</strong>
          </span>
          <span>
            Amount paid <strong>{money(sum(targetRows, "amount_paid"))}</strong>
          </span>
        </div>

        {working ? (
          <div className="ba-progress" role="status" aria-live="polite">
            <div className="ba-progress-bar">
              <i style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
            </div>
            <span>
              {meta.progressVerb} {progress.done} of {progress.total}…
            </span>
          </div>
        ) : null}

        <div className="fk-actions">
          <button type="button" className="fk-btn" onClick={close} disabled={working}>
            {phase === "done" ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            className={`fk-btn ${isReject ? "is-danger" : "is-primary"}`}
            onClick={start}
            disabled={working}
            autoFocus
          >
            {working
              ? `${meta.progressVerb}…`
              : phase === "done"
                ? "Try failed again"
                : `Yes, ${meta.verb.toLowerCase()} ${count}`}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default BulkConfirmDialog;
