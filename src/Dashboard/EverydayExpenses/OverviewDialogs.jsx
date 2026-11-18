import React, { useEffect, useState } from "react";
import { toast } from "@/Components/AdminKit/toast";
import { ChoiceField, DateField, Dialog, FormActions, TextAreaField, TextField } from "@/Components/FormKit";
import { rejectExpenses, repayExpenses } from "./everydayApi";
import { formatMoney, istDay } from "./everydayRules";
import { serverNow } from "./serverClock";
import "./Everyday.css";

const MODES = [
  { value: "CASH", label: "Cash" },
  { value: "BANK", label: "Bank transfer" },
  { value: "UPI", label: "UPI" },
];

const totalOf = (rows) => rows.reduce((t, r) => t + (Number(r.reimbursable) || 0), 0);
const personsOf = (rows) => [...new Set(rows.map((r) => r.userName).filter(Boolean))];

const List = ({ rows, failures }) => (
  <div className="ee-dlg-list" role="list">
    {rows.map((r) => {
      const failure = failures.find((f) => f.id === r._id);
      return (
        <div key={r._id} className="ee-dlg-item" role="listitem">
          <div>
            <strong>{r.userName || "-"}</strong>
            <span>
              {[r.categorySnapshot?.name, String(r.expenseDate).slice(0, 10)].filter(Boolean).join(" · ")}
            </span>
            {failure ? <em>{failure.message}</em> : null}
          </div>
          <strong>{formatMoney(r.reimbursable)}</strong>
        </div>
      );
    })}
  </div>
);

/** Shared flow: confirm -> send -> (if some failed) show which ones and let the reviewer retry them. */
const useDecision = ({ open, rows, call, onDone, onClose, successText }) => {
  const [busy, setBusy] = useState(false);
  const [failures, setFailures] = useState([]);

  useEffect(() => {
    if (open) setFailures([]);
  }, [open]);

  const run = async (extra) => {
    const targets = failures.length ? rows.filter((r) => failures.some((f) => f.id === r._id)) : rows;
    setBusy(true);
    try {
      const result = await call(
        targets.map((r) => r._id),
        extra,
      );
      const failed = result?.failed || [];
      const updated = result?.updated || [];
      onDone(updated);
      if (failed.length === 0) {
        toast.success(successText(updated.length));
        onClose();
      } else {
        setFailures(failed);
        toast.error(`${updated.length} done, ${failed.length} could not be changed`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, failures, run };
};

export const RepayDialog = ({ open, rows, authHeaders, onClose, onDone }) => {
  const [date, setDate] = useState("");
  const [mode, setMode] = useState("BANK");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setDate(istDay(serverNow()));
      setMode("BANK");
      setReference("");
      setError("");
    }
  }, [open]);

  const { busy, failures, run } = useDecision({
    open,
    rows,
    onDone,
    onClose,
    call: (ids) => repayExpenses({ ids, date, mode, reference: reference.trim(), authHeaders }),
    successText: (n) => `${n} expense${n === 1 ? "" : "s"} marked as repaid`,
  });

  const submit = (e) => {
    e.preventDefault();
    if (!date) return setError("Select the date you repaid");
    setError("");
    run();
  };

  const people = personsOf(rows);
  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} title={`Mark ${rows.length} as repaid?`} width={600}>
      <form onSubmit={submit} noValidate>
        <p className="ee-dlg-lead">
          {people.length === 1 ? `Repaying ${people[0]}.` : `Repaying ${people.length} people.`} Each person will see
          this as repaid, with these details.
        </p>
        <List rows={rows} failures={failures} />
        <div className="ee-dlg-total">
          <span>Total repaid</span>
          <strong>{formatMoney(totalOf(rows))}</strong>
        </div>
        <DateField label="Repaid on" value={date} onChange={setDate} error={error} required />
        <ChoiceField label="How" value={mode} onChange={setMode} options={MODES} required />
        <TextField label="Reference (optional)" value={reference} onChange={setReference} placeholder="UTR / receipt number" />
        <FormActions
          onCancel={onClose}
          submitLabel={failures.length ? "Try failed again" : `Yes, mark ${rows.length} repaid`}
          busy={busy}
          busyLabel="Saving…"
        />
      </form>
    </Dialog>
  );
};

export const RejectDialog = ({ open, rows, authHeaders, onClose, onDone }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const { busy, failures, run } = useDecision({
    open,
    rows,
    onDone,
    onClose,
    call: (ids) => rejectExpenses({ ids, reason: reason.trim(), authHeaders }),
    successText: (n) => `${n} expense${n === 1 ? "" : "s"} rejected`,
  });

  const submit = (e) => {
    e.preventDefault();
    if (reason.trim().length < 3) return setError("Write a reason (at least 3 letters). The employee will see it.");
    setError("");
    run();
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} title={`Reject ${rows.length} expense${rows.length === 1 ? "" : "s"}?`} width={600}>
      <form onSubmit={submit} noValidate>
        <p className="ee-dlg-lead">The employee sees the reason and can add the expense again with the correct details.</p>
        <List rows={rows} failures={failures} />
        <TextAreaField label="Reason" value={reason} onChange={setReason} error={error} rows={3} placeholder="e.g. Bill is unreadable" required />
        <div className="fk-actions">
          <button type="button" className="fk-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="fk-btn is-danger" disabled={busy}>
            {busy ? "Saving…" : failures.length ? "Try failed again" : `Yes, reject ${rows.length}`}
          </button>
        </div>
      </form>
    </Dialog>
  );
};
