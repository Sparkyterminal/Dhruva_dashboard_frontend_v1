import React, { useEffect, useState } from "react";
import { message } from "antd";
import dayjs from "dayjs";
import { AmountField, DateField, Dialog, FormActions } from "@/Components/FormKit";
import { SOURCES } from "./daybookConfig";
import { saveOpeningBalance } from "./daybookApi";

const emptyAmounts = () => Object.fromEntries(SOURCES.map((s) => [s, ""]));

/** One-time starting balance. After this, balances carry forward automatically. */
const DaybookOpeningDialog = ({ open, current, authHeaders, onClose, onSaved }) => {
  const [asOfDate, setAsOfDate] = useState("");
  const [amounts, setAmounts] = useState(emptyAmounts);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (current?.asOfDate) {
      setAsOfDate(String(current.asOfDate).slice(0, 10));
      const next = emptyAmounts();
      (current.balances || []).forEach((b) => {
        if (b.source in next) next[b.source] = b.amount || "";
      });
      setAmounts(next);
    } else {
      setAsOfDate(dayjs().format("YYYY-MM-DD"));
      setAmounts(emptyAmounts());
    }
  }, [open, current]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!asOfDate) {
      setErrors({ asOfDate: "Select the starting date" });
      return;
    }
    const payload = {
      asOfDate,
      balances: SOURCES.map((source) => ({ source, amount: Number(amounts[source]) || 0 })),
    };
    setSaving(true);
    try {
      await saveOpeningBalance({ payload, authHeaders });
      onSaved?.();
    } catch (err) {
      message.error(err?.response?.data?.message || "Failed to save starting balance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Starting balance" width={520}>
      <form onSubmit={submit} noValidate>
        <p className="db-dialog-note">
          Enter what each account holds at the <strong>start</strong> of the first day. From then on, each day&apos;s closing balance carries forward as the next day&apos;s opening balance automatically.
        </p>
        <DateField label="Starting date" value={asOfDate} onChange={setAsOfDate} error={errors.asOfDate} required />
        {SOURCES.map((source) => (
          <AmountField
            key={source}
            label={source}
            value={amounts[source]}
            onChange={(v) => setAmounts((a) => ({ ...a, [source]: v }))}
          />
        ))}
        <FormActions onCancel={onClose} submitLabel="Save starting balance" busy={saving} />
      </form>
    </Dialog>
  );
};

export default DaybookOpeningDialog;
